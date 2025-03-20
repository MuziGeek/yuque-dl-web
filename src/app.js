const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const multer = require('multer');
const axios = require('axios');

const app = express();

// 配置 CORS
app.use(cors({
  origin: ['http://tools.easymuzi.cn', 'https://tools.easymuzi.cn'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));

app.use(express.json());

const TEMP_DIR = '/tmp';
const upload = multer({ dest: `${TEMP_DIR}/upload` });

// 添加分片大小配置（5MB）
const CHUNK_SIZE = 5 * 1024 * 1024;

// 存储下载任务状态
const downloadTasks = new Map();

// 获取下载任务状态
app.get('/download/status/:taskId', (req, res) => {
    const { taskId } = req.params;
    const task = downloadTasks.get(taskId);
    if (!task) {
        res.status(404).json({ error: '任务不存在' });
        return;
    }
    res.json(task);
});

// 开始下载任务
app.get('/download/start', async (req, res) => {
    const { url, ignoreImg, key, token, toc } = req.query;

    if (!url) {
        return res.status(400).json({ error: '请提供语雀知识库 URL' });
    }

    try {
        // 添加文件大小检查
        const fileStats = await checkFileSize(url);
        if (fileStats.tooLarge) {
            return res.status(430).json({ 
                error: '文件过大',
                message: '文件大小超过限制，请尝试分批下载或忽略图片',
                size: fileStats.size
            });
        }

        const taskId = Date.now().toString();
        const tempDir = path.join(TEMP_DIR, `download_${taskId}`);
        fs.mkdirSync(tempDir, { recursive: true });

        // 创建任务状态
        downloadTasks.set(taskId, {
            id: taskId,
            status: 'preparing',
            progress: 0,
            tempDir,
            error: null
        });

        const yuqueDlPath = path.join(process.cwd(), 'node_modules', '.bin', 'yuque-dl');
        let command = `"${yuqueDlPath}" "${url}"`;
        command += ` -d "${tempDir}"`;
        if (ignoreImg === 'true') command += ' -i';
        if (key) command += ` -k "${key}"`;
        if (token) command += ` -t "${token}"`;
        if (toc === 'true') command += ' --toc';

        // 执行下载命令
        await new Promise((resolve, reject) => {
            const child = exec(command);
            child.stdout.on('data', (data) => {
                console.log('标准输出:', data);
            });
            child.stderr.on('data', (data) => {
                console.warn('错误输出:', data);
            });
            child.on('error', reject);
            child.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`命令执行失败，退出码: ${code}`));
            });
        });

        // 更新任务状态为压缩中
        downloadTasks.get(taskId).status = 'compressing';

        // 创建压缩文件
        const zipPath = path.join(tempDir, 'yuque-docs.zip');
        const archive = archiver('zip', {
            zlib: { level: 1 }
        });

        const output = fs.createWriteStream(zipPath);
        archive.pipe(output);

        // 读取目录内容
        const files = fs.readdirSync(tempDir);
        
        // 添加除了 yuque-docs.zip 之外的所有文件到压缩包
        files.forEach(file => {
            if (file !== 'yuque-docs.zip') {
                const filePath = path.join(tempDir, file);
                const stat = fs.statSync(filePath);
                
                if (stat.isDirectory()) {
                    archive.directory(filePath, file);
                } else {
                    archive.file(filePath, { name: file });
                }
            }
        });

        await archive.finalize();

        // 更新任务状态为就绪
        downloadTasks.get(taskId).status = 'ready';
        res.json({ taskId });

    } catch (error) {
        console.error('处理过程出错:', error);
        
        // 根据错误类型返回不同的状态码
        if (error.code === 'ECONNREFUSED') {
            res.status(503).json({
                error: '服务暂时不可用',
                message: '无法连接到语雀服务器'
            });
        } else if (error.code === 'ETIMEDOUT') {
            res.status(504).json({
                error: '请求超时',
                message: '连接语雀服务器超时'
            });
        } else {
            res.status(500).json({
                error: '下载处理失败',
                message: error.message
            });
        }
    }
});

// 添加文件大小检查函数
async function checkFileSize(url) {
    // 这里可以实现文件大小检查逻辑
    // 例如：通过 HEAD 请求获取文件大小
    try {
        const response = await axios.head(url);
        const contentLength = parseInt(response.headers['content-length'] || '0');
        const maxSize = 100 * 1024 * 1024; // 100MB
        return {
            tooLarge: contentLength > maxSize,
            size: contentLength
        };
    } catch (error) {
        console.error('检查文件大小失败:', error);
        return { tooLarge: false, size: 0 };
    }
}

// 获取分片下载
app.get('/download/chunk/:taskId', async (req, res) => {
    const { taskId } = req.params;
    const { start } = req.query;
    const startByte = parseInt(start) || 0;

    const task = downloadTasks.get(taskId);
    if (!task || task.status !== 'ready') {
        res.status(404).json({ error: '任务不存在或未就绪' });
        return;
    }

    try {
        const zipPath = path.join(task.tempDir, 'yuque-docs.zip');
        const fileSize = fs.statSync(zipPath).size;

        // 检查起始位置是否有效
        if (startByte >= fileSize) {
            return res.status(416).json({
                error: '请求范围不符合要求',
                message: '已到达文件末尾',
                size: fileSize
            });
        }

        const endByte = Math.min(startByte + CHUNK_SIZE - 1, fileSize - 1);

        // 设置分片响应头
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Range', `bytes ${startByte}-${endByte}/${fileSize}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', endByte - startByte + 1);

        // 创建文件读取流
        const stream = fs.createReadStream(zipPath, { 
            start: startByte, 
            end: endByte,
            highWaterMark: 64 * 1024 // 64KB 缓冲区
        });

        // 错误处理
        stream.on('error', (error) => {
            console.error('文件流错误:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    error: '文件读取错误',
                    message: error.message
                });
            }
        });

        // 完成处理
        stream.on('end', () => {
            // 更新下载进度
            const progress = Math.round(((endByte + 1) / fileSize) * 100);
            if (task) {
                task.progress = progress;
            }

            // 如果是最后一个分片，延迟清理任务
            if (endByte >= fileSize - 1) {
                setTimeout(() => {
                    fs.rm(task.tempDir, { recursive: true, force: true }, (err) => {
                        if (err) console.error('清理临时文件失败:', err);
                        downloadTasks.delete(taskId);
                    });
                }, 1000);
            }
        });

        stream.pipe(res);

    } catch (error) {
        console.error('分片下载错误:', error);
        if (!res.headersSent) {
            res.status(500).json({
                error: '下载处理失败',
                message: error.message
            });
        }
    }
});

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('全局错误:', error);
    res.status(500).json({
        error: '服务器内部错误',
        message: error.message
    });
});

app.listen(9000, () => {
    console.log(`Server start on http://localhost:9000`);
});

module.exports = app;