import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://dl.easymuzi.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('proxy error', err)
          })
          proxy.on('proxyReq', () => {
            console.log('Sending Request to the Target')
          })
          proxy.on('proxyRes', () => {
            console.log('Received Response from the Target')
          })
        }
      }
    }
  }
})
