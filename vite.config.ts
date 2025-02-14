import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  
  return {
    plugins: [vue()],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          configure: (proxy) => {
            proxy.on('error', (err, req) => {
              console.log('代理错误:', err)
              console.log('请求URL:', req.url)
            })
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log('发送代理请求:', req.url)
              console.log('代理请求头:', proxyReq.getHeaders())
            })
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log('收到代理响应:', req.url)
              console.log('响应状态:', proxyRes.statusCode)
              console.log('响应头:', proxyRes.headers)
            })
          }
        }
      }
    },
    define: {
      'process.env': env
    }
  }
})
