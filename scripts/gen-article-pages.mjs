// 受験記のHTMLを src/articles.json から作る。
// Vite の複数ページ構成は「ビルド前にHTMLが在る」ことが前提なので、
// build の直前にここで articles/ 以下を書き出す。sitemap も同時に作る。
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const articles = JSON.parse(readFileSync(resolve(root, 'src/articles.json'), 'utf8'))
const SITE = 'https://syunnjack.github.io/gyosei-yosou'
const GA = `<script async src="https://www.googletagmanager.com/gtag/js?id=G-B7JKBTJ3RR"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-B7JKBTJ3RR');</script>`

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
// 本文の **強調** を <strong> にする。記事データで使っている記法はこれだけ。
const rich = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

const head = ({ title, description, url, type, root: r, entry, slug }) => `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:site_name" content="GYOSAI" />
    <meta property="og:locale" content="ja_JP" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <title>${esc(title)}</title>
    ${GA}
    <script>window.__ROOT__=${JSON.stringify(r)};${slug ? `window.__SLUG__=${JSON.stringify(slug)};` : ''}</script>
  </head>
  <body>
    <!--
      JavaScript が動く前のHTMLにも本文を置く。記事は本文そのものが中身なので、
      要約ではなく全文を出す。JSが動くと React が同じ内容で置き換える。
    -->
    <div id="root">
      <main>`

const foot = entry => `      </main>
    </div>
    <script type="module" src="${entry}"></script>
  </body>
</html>
`

// 記事ページ
rmSync(resolve(root, 'articles'), { recursive: true, force: true })
for (const a of articles) {
  const body = a.sections.map(s => `        <h2>${esc(s.heading)}</h2>\n` + s.body.map(b => `        <p>${rich(b)}</p>`).join('\n')).join('\n')
  const rel = (a.related || []).map(slug => articles.find(x => x.slug === slug)).filter(Boolean)
  const relHtml = rel.length ? `\n        <h2>あわせて読む</h2>\n        <ul>\n${rel.map(r => `          <li><a href="../${r.slug}/">${esc(r.title)}</a></li>`).join('\n')}\n        </ul>` : ''
  const html = head({
    title: `${a.title}｜行政書士試験`, description: a.description,
    url: `${SITE}/articles/${a.slug}/`, type: 'article', root: '../../',
    slug: a.slug
  }) + `
        <h1>${esc(a.title)}</h1>
        <p><time datetime="${a.publishedAt}">${a.publishedAt.slice(0, 10)}</time>・${esc(a.category)}</p>
        <p>${esc(a.description)}</p>
${body}${relHtml}
        <p><a href="../">受験記の一覧へ戻る</a></p>
        <p><small>当サイトは個人が作成した学習支援ツールで、試験実施団体とは関係ありません。記載は個人の学習記録であり、合格を保証するものではありません。</small></p>
` + foot('../../src/main-article.jsx')
  const dir = resolve(root, 'articles', a.slug)
  mkdirSync(dir, { recursive: true })
  writeFileSync(resolve(dir, 'index.html'), html)
}

// 一覧ページ
const list = articles.map(a => `          <li><a href="./${a.slug}/">${esc(a.title)}</a><br /><small>${a.publishedAt.slice(0, 10)}・${esc(a.description)}</small></li>`).join('\n')
const indexHtml = head({
  title: '受験記｜行政書士試験', description: '4回目の行政書士試験に向けた受験記です。1回目から順に、落ちた回に何が足りなかったのかを成績表の数字と一緒に記録しています。',
  url: `${SITE}/articles/`, type: 'website', root: '../'
}) + `
        <h1>行政書士試験 受験記</h1>
        <p>4回目の行政書士試験に向けた記録です。受かった話ではなく、落ちた回に何が足りなかったのかを、成績表の数字と一緒に残しています。</p>
        <ul>
${list}
        </ul>
        <p><small>当サイトは個人が作成した学習支援ツールで、試験実施団体とは関係ありません。</small></p>
` + foot('../src/main-articles.jsx')
mkdirSync(resolve(root, 'articles'), { recursive: true })
writeFileSync(resolve(root, 'articles/index.html'), indexHtml)

// サイトマップ。記事が増えたらここも自動で増える。
const urls = [
  { loc: `${SITE}/`, p: '1.0' },
  { loc: `${SITE}/ai-score/`, p: '0.8' },
  { loc: `${SITE}/strategy/`, p: '0.8' },
  { loc: `${SITE}/articles/`, p: '0.8' },
  ...articles.map(a => ({ loc: `${SITE}/articles/${a.slug}/`, p: '0.6' }))
]
writeFileSync(resolve(root, 'public/sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>${u.p}</priority>\n  </url>`).join('\n') +
  `\n</urlset>\n`)

console.log(`記事 ${articles.length} 本ぶんのページと sitemap を書き出した`)
if (!existsSync(resolve(root, 'articles/index.html'))) process.exit(1)
