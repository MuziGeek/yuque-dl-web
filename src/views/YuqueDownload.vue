<template>
  <div class="app-container">
    <div class="content-wrapper">
      <div class="header">
        <el-button 
          class="back-button" 
          @click="$router.push('/')"
          :icon="ArrowLeft"
          text
        >
          返回工具箱
        </el-button>
        <h1 class="title">语雀文档下载工具</h1>
      </div>
      <div class="card-container">
        <DownloadForm />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DownloadForm from '../components/DownloadForm.vue'
import { ArrowLeft } from '@element-plus/icons-vue'
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 2rem;
}

.content-wrapper {
  max-width: 800px;
  margin: 0 auto;
}

.header {
  position: relative;
  margin-bottom: 2rem;
  text-align: center;
  padding: 0.5rem 0;
}

.back-button {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.95rem;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  transition: all 0.3s ease;
}

.back-button:hover {
  color: #667eea;
  transform: translateY(-50%) translateX(-4px);
}

.title {
  color: #2c3e50;
  font-size: 2rem;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  margin: 0;
}

.card-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 2rem;
}

@media (max-width: 768px) {
  .app-container {
    padding: 1rem;
  }

  .header {
    margin-bottom: 1.5rem;
  }

  .title {
    font-size: 1.5rem;
  }

  .back-button {
    font-size: 0.9rem;
    padding: 6px 12px;
  }

  .card-container {
    padding: 1.5rem;
  }
}
</style> 