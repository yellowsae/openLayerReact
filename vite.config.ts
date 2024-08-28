import path from 'node:path'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
// https://vitejs.dev/config/
export default defineConfig({
  // 引入 public 文件夹中的 cesium 文件夹
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
