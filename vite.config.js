import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins:[react()],
  base:'/gyosei-yosou/',
  build:{rollupOptions:{input:{
    main:resolve(import.meta.dirname,'index.html'),
    score:resolve(import.meta.dirname,'ai-score/index.html')
  }}}
})
