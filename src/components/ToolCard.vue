<template>
  <div class="tool-card" @click="$emit('click')">
    <el-card :body-style="{ padding: '0px' }" shadow="hover">
      <div class="tool-content">
        <div class="icon-wrapper">
          <slot name="icon"></slot>
        </div>
        <div class="tool-info">
          <h3>{{ title }}</h3>
          <p>{{ description }}</p>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  title: string
  description: string
}>()
</script>

<style scoped>
.tool-card {
  cursor: pointer;
  transition: all 0.3s ease;
  width: 320px;
  height: 160px;
}

.tool-card :deep(.el-card) {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  border: none;
  background: linear-gradient(145deg, #ffffff, #f5f7fa);
  box-shadow: 5px 5px 10px #e8eaed,
             -5px -5px 10px #ffffff;
}

.tool-card:hover {
  transform: translateY(-5px);
}

.tool-card:hover :deep(.el-card) {
  background: linear-gradient(145deg, #f8f9fb, #ffffff);
  box-shadow: 8px 8px 16px #e8eaed,
             -8px -8px 16px #ffffff;
}

.tool-content {
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.icon-wrapper {
  background: var(--icon-gradient);
  border-radius: 12px;
  color: white;
  transition: transform 0.3s ease;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-card:hover .icon-wrapper {
  transform: scale(1.05);
}

.tool-info h3 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 1.25rem;
  font-weight: 600;
}

.tool-info p {
  margin: 0;
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
}
</style>