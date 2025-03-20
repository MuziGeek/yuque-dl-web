<template>
  <div class="home-container">
    <div class="content-wrapper">
      <h1 class="title">Muzi's 工具箱</h1>
      <div class="tools-grid">
        <ToolCard
          title="语雀文档下载"
          description="批量下载语雀知识库文档的便捷工具"
          @click="router.push('/yuque-download')"
          style="--icon-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"
        >
          <template #icon>
            <el-icon :size="30"><Document /></el-icon>
          </template>
        </ToolCard>
        <ToolCard
          title="WeChat-RSS"
          description="微信公众号RSS订阅解决方案"
          @click="openWeChatRSS"
          style="--icon-gradient: linear-gradient(135deg, #34d399 0%, #3b82f6 100%);"
        >
          <template #icon>
            <el-icon :size="30"><ChatRound /></el-icon>
          </template>
        </ToolCard>
      </div>
    </div>
  </div>
  
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'
import {  ChatRound } from '@element-plus/icons-vue'
import ToolCard from '../components/ToolCard.vue'

const router = useRouter()

const openWeChatRSS = () => {
  window.location.href = 'https://wewe.easymuzi.cn/dash'
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e0e6ed 100%);
  padding: 3rem 2rem;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.title {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 4rem;
  font-size: 3rem;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #2c3e50 0%, #3f51b5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2.5rem;
  padding: 0 1rem;
}

@media (max-width: 640px) {
  .home-container {
    padding: 2rem 1rem;
  }
  
  .title {
    font-size: 2.5rem;
    margin-bottom: 3rem;
  }
  
  .tools-grid {
    gap: 1.5rem;
    padding: 0;
  }
}
</style>