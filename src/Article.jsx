import { ArrowUpRight, CalendarDays, ChevronRight } from 'lucide-react'
import { to } from './paths.js'
import articles from './articles.json'
import './prose.css'
import './articles.css'

export const bySlug = slug => articles.find(a => a.slug === slug)
export const allArticles = articles

const ymd = iso => iso.slice(0, 10).replace(/-/g, '.')

// 本文の **強調** だけをタグにする。記事データで使っている記法はこれだけ。
export function Rich({ text }) {
 const parts = text.split(/\*\*(.+?)\*\*/g)
 return <>{parts.map((p, i) => (i % 2 ? <b key={i}>{p}</b> : p))}</>
}

/** 受験記の一覧 */
export function ArticleList({ onOpen }) {
 return <div className="content">
  <div className="page-intro"><span className="eyebrow">EXAM DIARY</span><h2>受験記</h2>
   <p>4回目の行政書士試験に向けた記録です。受かった話ではなく、落ちた回に何が足りなかったのかを、成績表の数字と一緒に残しています。</p></div>
  <div className="article-list">{allArticles.map(a => <article key={a.slug}>
   <div className="amuta"><CalendarDays/><time dateTime={a.publishedAt}>{ymd(a.publishedAt)}</time><span>{a.category}</span></div>
   <h3><a href={to(`articles/${a.slug}/`)} onClick={onOpen}>{a.title}</a></h3>
   <p>{a.description}</p>
   <div className="tags">{a.tags.map(t => <i key={t}>{t}</i>)}</div>
   <a className="more" href={to(`articles/${a.slug}/`)}>続きを読む <ChevronRight/></a>
  </article>)}</div>
 </div>
}

/** 記事1本 */
export default function Article({ slug }) {
 const a = bySlug(slug)
 if (!a) return <div className="content"><div className="page-intro"><h2>記事が見つかりません</h2><p><a href={to('articles/')}>受験記の一覧へ戻る</a></p></div></div>
 const related = (a.related || []).map(bySlug).filter(Boolean)
 return <div className="content article">
  <div className="page-intro"><span className="eyebrow">EXAM DIARY</span>
   <h2>{a.title}</h2>
   <p className="amuta"><CalendarDays/><time dateTime={a.publishedAt}>{ymd(a.publishedAt)}</time><span>{a.category}</span></p>
   <p>{a.description}</p>
   <div className="tags">{a.tags.map(t => <i key={t}>{t}</i>)}</div>
  </div>
  {a.sections.map(s => <section className="panel" key={s.heading}>
   <div className="panel-title"><div><h3>{s.heading}</h3></div></div>
   {s.body.map((b, i) => <p className="para" key={i}><Rich text={b}/></p>)}
  </section>)}
  {related.length > 0 && <section className="panel"><div className="panel-title"><div><h3>あわせて読む</h3></div></div>
   <ul className="related">{related.map(r => <li key={r.slug}><a href={to(`articles/${r.slug}/`)}>{r.title}<ArrowUpRight/></a></li>)}</ul>
  </section>}
  <p className="back"><a href={to('articles/')}>← 受験記の一覧へ</a></p>
 </div>
}
