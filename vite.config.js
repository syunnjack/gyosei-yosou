import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 記事ページは scripts/gen-article-pages.mjs が先に書き出す（npm run build 参照）。
const dir = import.meta.dirname
const articlePages = Object.fromEntries(
  readdirSync(resolve(dir, 'articles'), { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => [`article-${e.name}`, resolve(dir, 'articles', e.name, 'index.html')])
)

export default defineConfig({
  plugins: [react()],
  // 相対パスで書き出す。こうしておくと、GitHub Pages の
  // /gyosei-yosou/ 配下でも、独自ドメインのルート直下でも、
  // どちらに置いてもアセットを読める。
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(dir, 'index.html'),
        score: resolve(dir, 'ai-score/index.html'),
        strategy: resolve(dir, 'strategy/index.html'),
        articles: resolve(dir, 'articles/index.html'),
        ...articlePages
      }
    }
  }
})
