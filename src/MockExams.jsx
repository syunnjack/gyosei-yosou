import { useEffect, useMemo, useState } from 'react'
import { BrainCircuit, CalendarDays, CheckCircle2, ChevronRight, ClipboardList, Compass, Flag, HelpCircle, History, ShieldCheck, TrendingUp } from 'lucide-react'
import { ATTEMPT, EXAM_DATE, MAX_SCORE, PASS_LINE, faq, isPass, lawOf, mockExams, pastResults, providers, resultTotal, strategyPost, studying, totalOf } from './mockExams.js'

const SITE = 'https://syunnjack.github.io/gyosei-yosou/'
const providerOf = id => providers.find(p => p.id === id)
const fmt = d => d ? new Date(d).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }) : '日程未定'
const daysLeft = () => Math.max(0, Math.ceil((new Date(EXAM_DATE) - new Date()) / 86400000))
const statusOf = e => e.status !== 'planned' ? e.status : (e.date && e.date < new Date().toISOString().slice(0, 10) ? 'due' : 'planned')
const STATUS = { done: '受験済み', progress: '解答中', planned: '受験予定', due: '結果待ち・未記入' }
const KIND = { exam: '本試験', mock: '模試', self: '自己採点' }

function useJsonLd(done) {
  useEffect(() => {
    const el = document.createElement('script'); el.type = 'application/ld+json'
    el.text = JSON.stringify([
      { '@context': 'https://schema.org', '@type': 'Blog', name: '行政書士試験 模試の記録', url: SITE + '#mock-exams', inLanguage: 'ja',
        description: `令和8年度（2026年11月8日）行政書士試験（${ATTEMPT}回目の受験）に向けた模試13回分の得点推移・過去の本試験成績・スタディングAI実力スコアの記録。`,
        blogPost: [{ '@type': 'BlogPosting', headline: strategyPost.title, datePublished: strategyPost.date, url: `${SITE}#post-${strategyPost.id}`, description: strategyPost.lead, articleBody: strategyPost.sections.map(s => [s.h, ...(s.body || []), ...(s.list || [])].join('\n')).join('\n\n'), keywords: ['行政書士', ...strategyPost.tags].join(',') }, ...done.map(e => ({ '@type': 'BlogPosting', headline: `${e.title}の結果と復習ポイント`, datePublished: e.date, url: `${SITE}#mock-${e.id}`, articleBody: e.summary, keywords: ['行政書士', '模試', providerOf(e.provider).name, ...e.tags].join(',') }))] },
      { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }
    ])
    document.head.appendChild(el); return () => el.remove()
  }, [done])
}

function TrendChart({ done }) {
  const W = 640, H = 220, px = 36, py = 18
  const xs = i => done.length > 1 ? px + i * (W - px * 2) / (done.length - 1) : W / 2
  const ys = v => H - py - v / MAX_SCORE.total * (H - py * 2)
  const pts = done.map((e, i) => `${xs(i)},${ys(totalOf(e.scores))}`).join(' ')
  return <svg className="trend" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="模試の総得点推移と合格ライン180点">
    {[0, 100, 180, 300].map(v => <g key={v}><line x1={px} x2={W - px} y1={ys(v)} y2={ys(v)} className={v === PASS_LINE.total ? 'pass' : ''} /><text x={px - 8} y={ys(v) + 4}>{v}</text></g>)}
    <text x={W - px} y={ys(PASS_LINE.total) - 6} textAnchor="end" className="pass-label">合格ライン 180</text>
    {done.length > 1 && <polyline points={pts} />}
    {done.map((e, i) => <g key={e.id}><circle cx={xs(i)} cy={ys(totalOf(e.scores))} r="6" fill={providerOf(e.provider).color} /><text x={xs(i)} y={ys(totalOf(e.scores)) - 12} textAnchor="middle" className="val">{totalOf(e.scores)}</text><text x={xs(i)} y={H - 2} textAnchor="middle" className="lbl">{e.title.replace(/ 公開模試| 模試パック/, '')}</text></g>)}
    {done.length === 0 && <text x={W / 2} y={H / 2} textAnchor="middle" className="empty">受験後にスコアを入力すると推移が表示されます</text>}
  </svg>
}

function ScoreBar({ label, v, max, line }) {
  return <div className="score-row"><span>{label}</span><div className="bar">{line != null && <b style={{ left: `${line / max * 100}%` }} />}<i style={{ width: `${v / max * 100}%` }} /></div><strong>{v}<small>/{max}</small></strong></div>
}

export default function MockExams() {
  const [open, setOpen] = useState(null)
  const [filter, setFilter] = useState('all')
  const done = useMemo(() => mockExams.filter(e => e.status === 'done' && e.scores).sort((a, b) => a.date.localeCompare(b.date)), [])
  const list = filter === 'all' ? mockExams : mockExams.filter(e => e.provider === filter)
  const totals = done.map(e => totalOf(e.scores))
  const best = totals.length ? Math.max(...totals) : null
  const avg = totals.length ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length) : null
  const latest = done[done.length - 1]
  const ai = studying.history[studying.history.length - 1]
  useJsonLd(done)

  return <div className="content" id="mock-exams">
    <section className="hero mock-hero"><div><span className="tag"><Flag />MOCK EXAM LOG</span><h2>{ATTEMPT}回目の受験。合格までの推移を、<br /><em>模試13回で記録する。</em></h2><p>令和8年度 行政書士試験（{fmt(EXAM_DATE)}）まで、LEC・伊藤塾・TAC・東京法経学院の模試をすべて自宅受験。前回168点（あと12点）から、総得点だけでなく法令122点・基礎知識24点の足切りも毎回チェックし、次回までの復習項目を残します。</p></div><div className="score-ring countdown"><span>本試験まで</span><strong>{daysLeft()}<small>日</small></strong><p>{fmt(EXAM_DATE)}</p></div></section>

    <article className="panel post" id={`post-${strategyPost.id}`}><div className="panel-title"><div><span className="eyebrow"><Compass />STRATEGY</span><h3>{strategyPost.title}</h3><p><time dateTime={strategyPost.date}>{fmt(strategyPost.date)}</time> 投稿</p></div></div>
      <p className="lead">{strategyPost.lead}</p>
      {strategyPost.sections.map(s => <section key={s.h}><h4>{s.h}</h4>{s.body?.map(b => <p key={b}>{b}</p>)}{s.list && <ul>{s.list.map(l => <li key={l}>{l}</li>)}</ul>}</section>)}
      <div className="signals">{strategyPost.tags.map(t => <i key={t}>{t}</i>)}</div>
    </article>

    <section className="metric-grid">
      <Metric icon={<ClipboardList />} n={`${done.length}/${mockExams.length}`} label="受験済み" sub="計13回を予定" />
      <Metric icon={<TrendingUp />} n={best ?? '—'} label="最高得点" sub="300点満点" />
      <Metric icon={<CheckCircle2 />} n={avg ?? '—'} label="平均得点" sub={avg != null ? `合格ラインまで ${Math.max(0, PASS_LINE.total - avg)}点` : '受験後に表示'} />
      <Metric icon={<CalendarDays />} n={latest ? (isPass(latest.scores) ? '合格圏' : '要強化') : '—'} label="直近判定" sub={latest ? latest.title : '未受験'} />
    </section>

    <section className="panel"><div className="panel-title"><div><h3>総得点の推移</h3><p>受験日順・合格ライン180点との比較</p></div><div className="legend">{providers.map(p => <span key={p.id}><i style={{ background: p.color }} />{p.name}</span>)}</div></div><TrendChart done={done} /></section>

    <div className="section-head"><div><span className="eyebrow">EXAM REPORTS</span><h2>模試ごとの記録</h2></div><select value={filter} onChange={e => setFilter(e.target.value)} aria-label="予備校で絞り込み"><option value="all">すべての予備校</option>{providers.map(p => <option key={p.id} value={p.id}>{p.name}（{p.series}）</option>)}</select></div>

    <section className="exam-list">{list.map(e => { const p = providerOf(e.provider); const s = e.scores; const isOpen = open === e.id
      return <article key={e.id} id={`mock-${e.id}`} className={`exam ${e.status}`}>
        <button className="exam-head" onClick={() => setOpen(isOpen ? null : e.id)} aria-expanded={isOpen}>
          <span className="pv" style={{ background: p.color }}>{p.name}</span>
          <div><h3>{e.title}</h3><time dateTime={e.date || undefined}>{fmt(e.date)}{e.dateNote && <small> ・{e.dateNote}</small>}</time></div>
          {s ? <div className={`total ${isPass(s) ? 'ok' : ''}`}><strong>{totalOf(s)}</strong><small>/300</small><em>{isPass(s) ? '合格圏' : '合格ライン未達'}</em></div> : <div className={`total ${statusOf(e)}`}><em>{STATUS[statusOf(e)]}</em></div>}
          <ChevronRight className={isOpen ? 'rot' : ''} />
        </button>
        {isOpen && <div className="exam-body">
          {s ? <>
            <div className="scores"><ScoreBar label="法令等（合計）" v={lawOf(s)} max={244} line={PASS_LINE.law} /><ScoreBar label="　択一（5肢）" v={s.law5} max={MAX_SCORE.law5} /><ScoreBar label="　多肢選択" v={s.lawMulti} max={MAX_SCORE.lawMulti} /><ScoreBar label="　記述" v={s.written} max={MAX_SCORE.written} /><ScoreBar label="基礎知識" v={s.general} max={MAX_SCORE.general} line={PASS_LINE.general} /></div>
            <h4>所感</h4><p>{e.summary}</p>
            {e.review.length > 0 && <><h4>次回までの復習項目</h4><ul>{e.review.map(r => <li key={r}>{r}</li>)}</ul></>}
            {e.tags.length > 0 && <div className="signals">{e.tags.map(t => <i key={t}>{t}</i>)}</div>}
          </> : <p className="todo">受験後にスコア・所感・復習項目を追記します。記入方法は <code>src/mockExams.js</code> のコメント参照。</p>}
        </div>}
      </article> })}</section>

    <section className="panel history"><div className="panel-title"><div><h3><History />これまでの記録（{ATTEMPT - 1}回の受験と模試）</h3><p>積み上げログの成績表から抽出。内訳不明のものは合計のみ</p></div></div>
      <div className="table-wrap"><table><thead><tr><th>日付</th><th>区分</th><th>試験</th><th>択一</th><th>多肢</th><th>記述</th><th>基礎知識</th><th>合計</th></tr></thead><tbody>
        {pastResults.map(r => { const t = resultTotal(r); const s = r.scores; return <tr key={r.id} className={r.kind}><td>{r.date ? <time dateTime={r.date}>{r.date.replace(/-/g, '/')}</time> : '—'}</td><td><i className="kind">{KIND[r.kind]}</i></td><td><b>{r.title}</b><small>{r.note}</small></td><td>{s ? s.law5 : '—'}</td><td>{s ? s.lawMulti : '—'}</td><td>{s ? s.written : '—'}</td><td className={s && s.general < PASS_LINE.general ? 'ng' : ''}>{s ? s.general : '—'}</td><td className={t == null ? '' : t >= PASS_LINE.total ? 'ok' : 'ng'}><strong>{t ?? '—'}</strong>{t != null && <small>{t >= PASS_LINE.total ? '合格圏' : `−${PASS_LINE.total - t}`}</small>}</td></tr> })}
      </tbody></table></div>
      <p className="note">直前期（模試→本試験の2か月）に法令択一は+20点・基礎知識は+32点伸びた一方、多肢選択と記述は模試より下がった。今回は多肢・記述の部分点を模試ごとに単独で追う。</p>
    </section>

    {ai && <section className="panel studying"><div className="panel-title"><div><h3><BrainCircuit />スタディング AI実力スコア</h3><p>{studying.course}・記述式を除く{studying.max}点満点・目標{studying.target}点（{fmt(ai.date)}時点）</p></div><div className="ai-total"><strong>{ai.score}</strong><small>/{studying.max}</small><em>目標まで {Math.max(0, +(studying.target - ai.score).toFixed(1))}点</em></div></div>
      <div className="scores">{ai.subjects.map(su => <div key={su.name} className="score-row ai"><span>{su.name}</span><div className="bar"><b style={{ left: `${su.avg / su.max * 100}%` }} title={`受講者平均 ${su.avg}`} /><i style={{ width: `${su.score / su.max * 100}%` }} /></div><strong>{su.score}<small>/{su.max}</small></strong><em>平均{su.avg}・上位{su.pct}%</em></div>)}</div>
      <p className="note">縦線は受講者平均（過去1年以内の学習者中の位置）。AI実力スコアは問題演習の正答率・反復・難易度・模試得点から「今受けたら何点か」を予測する指標で、忘却効果により学習を止めると下がる（<a href="https://studying.jp/function/aiscore.html" target="_blank" rel="noopener">仕組み</a>）。現状は全科目が平均以下で、特に基礎法学・憲法の差が大きい。行政法（92点配点）の底上げが最短で目標に近づく。</p>
    </section>}

    <section className="panel faq"><div className="panel-title"><div><h3><HelpCircle />よくある質問</h3><p>模試と合格基準について</p></div></div>{faq.map(f => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}</section>

    <div className="method"><ShieldCheck /><div><b>記録の方針</b><p>得点は各予備校の採点結果に基づく自己申告です。模試の難易度は校ごとに異なるため、点数の絶対値より「足切り科目の安定」と「復習項目の消化」を重視して推移を見ています。</p></div></div>
  </div>
}

function Metric({ icon, n, label, sub }) { return <article className="metric"><div>{icon}</div><strong>{n}</strong><span>{label}</span><small>{sub}</small></article> }
