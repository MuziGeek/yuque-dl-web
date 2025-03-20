import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import YuqueDownload from '../views/YuqueDownload.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/yuque-download',
      name: 'yuque-download',
      component: YuqueDownload
    },

  ]
})

export default router