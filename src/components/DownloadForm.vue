<template>
  <el-form :model="form" label-width="120px" class="download-form">
    <el-form-item label="知识库 URL">
      <el-input 
        v-model="form.url" 
        placeholder="请输入语雀知识库的完整 URL"
        class="custom-input"
      />
    </el-form-item>
    
    <el-form-item label="忽略图片" class="switch-item">
      <el-switch
        v-model="form.ignoreImg"
        class="custom-switch"
      />
    </el-form-item>
    
    <el-form-item label="Cookie Key">
      <el-input 
        v-model="form.key"
        placeholder="默认为 _yuque_session"
        class="custom-input"
      />
    </el-form-item>
    
    <el-form-item label="Token">
      <el-input 
        v-model="form.token"
        type="password"
        placeholder="请输入您的语雀 Token"
        class="custom-input"
      />
    </el-form-item>
    
    <el-form-item label="输出 TOC 目录" class="switch-item">
      <el-switch
        v-model="form.toc"
        class="custom-switch"
      />
    </el-form-item>
    
    <el-form-item class="submit-item">
      <el-button 
        type="primary" 
        @click="download" 
        :loading="downloading"
        class="submit-button"
      >
        {{ buttonText }}
      </el-button>
    </el-form-item>

    <el-progress 
      v-if="downloading && progress > 0" 
      :percentage="progress" 
      :format="format"
      :status="progressStatus"
    />

    <div v-if="downloadResult" class="download-result">
      <el-alert
        :title="downloadResult.success ? '处理成功' : '处理失败'"
        :type="downloadResult.success ? 'success' : 'error'"
        :description="downloadResult.message"
        show-icon
        :closable="false"
      />
    </div>
  </el-form>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { AxiosError } from 'axios'
import api from '../config/axios'

interface DownloadResult {
  success: boolean
  message: string
}

const form = ref({
  url: '',
  ignoreImg: false,
  key: '_yuque_session',
  token: '',
  toc: false
})

const progress = ref(0)
const downloading = ref(false)
const downloadResult = ref<DownloadResult | null>(null)

// 计算按钮文本
const buttonText = computed(() => {
  if (!downloading.value) return '下载文档'
  return progress.value === 0 ? '拉取文档中...' : `下载中 ${progress.value}%`
})

// 计算进度条状态
const progressStatus = computed(() => {
  if (progress.value >= 100) return 'success'
  return ''
})

// 格式化进度条文本
const format = (percentage: number) => {
  if (percentage === 100) return '完成'
  return `${percentage}%`
}

// 下载
const download = async () => {
  try {
    if (!form.value.url) {
      ElMessage.error('请输入语雀知识库 URL')
      return
    }

    downloading.value = true
    progress.value = 0
    downloadResult.value = null

    try {
      // 1. 开始下载任务
      const startResponse = await api.get('/download/start', {
        params: form.value
      })

      const { taskId } = startResponse.data

      // 2. 轮询任务状态
      while (true) {
        const statusResponse = await api.get(`/download/status/${taskId}`)
        const task = statusResponse.data

        if (task.status === 'error') {
          throw new Error(task.error)
        }

        if (task.status === 'ready') {
          break
        }

        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // 3. 开始分片下载
      let start = 0
      const chunks: Blob[] = []

      while (true) {
        try {
          const response = await api.get(`/download/chunk/${taskId}`, {
            params: { start },
            responseType: 'blob'
          })

          const chunk = response.data
          chunks.push(chunk)

          const range = response.headers['content-range']
          if (!range) {
            throw new Error('服务器未返回 Content-Range 头')
          }

          const matches = range.match(/bytes (\d+)-(\d+)\/(\d+)/)
          if (!matches) {
            throw new Error('Content-Range 格式错误')
          }

          const [, , current, total] = matches
          const currentByte = parseInt(current)
          const totalBytes = parseInt(total)
          
          progress.value = Math.round((currentByte / totalBytes) * 100)

          if (currentByte + 1 >= totalBytes) {
            break
          }

          // 更新下一个分片的起始位置
          start = currentByte + 1

        } catch (error: any) {
          if (error.response?.status === 416) {
            // 如果收到 416 错误，说明已经下载完成
            console.log('下载完成')
            break
          }
          throw error
        }
      }

      // 4. 合并所有分片并下载
      const blob = new Blob(chunks, { type: 'application/zip' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `yuque-docs-${Date.now()}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      downloadResult.value = {
        success: true,
        message: '文档下载完成'
      }

    } catch (err) {
      const error = err as AxiosError
      console.error('下载错误:', error)
      
      let errorMessage = '下载失败: '
      
      if (error.response?.status === 430) {
        errorMessage = '文件过大，请尝试以下方法：\n' +
          '1. 开启"忽略图片"选项\n' +
          '2. 分批下载文档\n' +
          '3. 选择较小的知识库'
        
        // 自动开启忽略图片选项
        form.value.ignoreImg = true
        
      } else if (error.response?.status === 503) {
        errorMessage = '服务暂时不可用，请稍后重试'
      } else if (error.response?.status === 504) {
        errorMessage = '请求超时，请检查网络连接'
      } else {
        // 检查 error.response 和 error.response.data 是否存在
        if (error.response && 'data' in error.response) {
          const responseData = error.response.data as Record<string, any>;
          errorMessage += responseData.message || error.message;
        } else {
          errorMessage += error.message;
        }
      }
      
      downloadResult.value = {
        success: false,
        message: errorMessage
      }
      
      // 显示错误提示
      ElMessage.error({
        message: errorMessage,
        duration: 5000,
        showClose: true
      })
    }

  } finally {
    downloading.value = false
  }
}
</script>

<style scoped>
.download-form {
  max-width: 600px;
  margin: 0 auto;
}

.custom-input :deep(.el-input__wrapper) {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
}

.custom-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.switch-item :deep(.el-form-item__content) {
  justify-content: flex-start;
}

.submit-item {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}

.submit-button {
  min-width: 160px;
  height: 44px;
  font-size: 1.1rem;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: transform 0.2s;
}

.submit-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.download-result {
  margin-top: 1.5rem;
}

:deep(.el-alert) {
  border-radius: 8px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #2c3e50;
}

:deep(.el-switch) {
  --el-switch-on-color: #667eea;
}

:deep(.el-progress) {
  margin-top: 1rem;
}
</style>