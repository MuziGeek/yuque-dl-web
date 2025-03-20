<template>
  <router-view></router-view>
</template>

<script lang="ts" setup>
import DownloadForm from './components/DownloadForm.vue'
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

.title {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2.5rem;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

.card-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 2rem;
}
</style>