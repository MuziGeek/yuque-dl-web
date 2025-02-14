import express from 'express'
import cors from 'cors'

const app = express()

// 配置 CORS
app.use(cors({
  origin: ['http://tools.easymuzi.cn', 'https://tools.easymuzi.cn'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// 处理 POST 请求
app.post('/download', async (req, res) => {
  // 你的下载逻辑
}) 