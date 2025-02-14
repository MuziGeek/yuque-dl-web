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
        {{ downloading ? '处理中...' : '下载文档' }}
      </el-button>
    </el-form-item>

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
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import  { AxiosError } from 'axios'
import api from '../config/axios'
import type { ErrorResponse } from '../types/api'

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

const downloading = ref(false)
const downloadResult = ref<DownloadResult | null>(null)

// 下载
const download = async () => {
  try {
    if (!form.value.url) {
      ElMessage.error('请输入语雀知识库 URL')
      return
    }

    downloading.value = true
    downloadResult.value = null

    console.log('发送请求到:', '/download')
    console.log('请求数据:', form.value)

    const response = await api.get('/download', {
      params: form.value,
      responseType: 'blob',
      headers: {
        'Accept': 'application/zip, application/octet-stream'
      }
    })

    console.log('请求成功，响应头:', response.headers)
    
    // 创建下载链接
    const blob = new Blob([response.data], { type: 'application/zip' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'yuque-docs.zip'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    downloadResult.value = {
      success: true,
      message: '文档已下载为 ZIP 压缩包'
    }

  } catch (err) {
    const error = err as AxiosError<ErrorResponse>
    console.error('详细错误信息:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      data: error.response?.data
    })
    
    // 改进错误提示
    let errorMessage = '下载失败: '
    if (error.response?.status === 405) {
      errorMessage += '请确保输入正确的语雀知识库 URL'
    } else {
      errorMessage += error.response?.data?.message || error.message
    }
    
    downloadResult.value = {
      success: false,
      message: errorMessage
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
</style>