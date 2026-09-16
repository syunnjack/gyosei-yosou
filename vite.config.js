import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins:[react()],
  // 相対パスで書き出す。こうしておくと、GitHub Pages の
  // /gyosei-yosou/ 配下でも、独自ドメインのルート直下でも、
  // どちらに置いてもアセットを読める。
  base:'./',
  server:{proxy:{'/api':{target:'http://127.0.0.1:8787',changeOrigin:false}}},
  build:{rollupOptions:{input:{
    main:resolve(import.meta.dirname,'index.html'),
    score:resolve(import.meta.dirname,'ai-score/index.html'),
    strategy:resolve(import.meta.dirname,'strategy/index.html')
  }}}
})
