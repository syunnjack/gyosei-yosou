import { useMemo, useState } from 'react'
import { Activity, ArrowUpRight, BarChart3, BookOpen, BrainCircuit, Check, ChevronRight, Database, FileSearch, Gauge, Menu, RotateCcw, ShieldCheck, Sparkles, Target, X } from 'lucide-react'
import { forecastQuestions, predictions, subjects, years } from './data.js'
import './score.css'
import { scoreAverageTotal, scoreGap, scoreMeta, scorePlan, scoreSubjects } from './score.js'

const tabs=['予測レポート','出題分析','予想問題','AI実力スコア']
const one=n=>n.toFixed(1)
const pct=(a,b)=>a/b*100

function Sparkline({values,color}){const max=Math.max(...values);const min=Math.min(...values);const points=values.map((v,i)=>`${i*24},${22-(v-min)/(max-min||1)*14}`).join(' ');return <svg className="spark" viewBox="0 0 120 28" aria-label="6年推移"><polyline points={points} fill="none" stroke={color} strokeWidth="2"/>{values.map((v,i)=><circle key={i} cx={i*24} cy={22-(v-min)/(max-min||1)*14} r="2.5" fill={color}/>)}</svg>}

function App(){
 const [tab,setTab]=useState(tabs[0]); const [subject,setSubject]=useState('すべて'); const [openQ,setOpenQ]=useState(null); const [mobile,setMobile]=useState(false)
 const filtered=useMemo(()=>subject==='すべて'?predictions:predictions.filter(p=>p.subject===subject),[subject])
 return <div className="app">
  <aside className={mobile?'side open':'side'}>
   <button className="close" onClick={()=>setMobile(false)}><X/></button>
   <div className="brand"><div className="brand-mark">G</div><div><b>GYOSAI</b><span>LEGAL EXAM INTELLIGENCE</span></div></div>
   <nav>{tabs.map((t,i)=><button key={t} className={tab===t?'active':''} onClick={()=>{setTab(t);setMobile(false)}}>{[<Target/>,<BarChart3/>,<BookOpen/>,<Gauge/>][i]}{t}</button>)}</nav>
   <div className="model-card"><div className="pulse"><BrainCircuit/></div><span>ANALYSIS MODEL</span><strong>Gyosei Forecast v1.0</strong><p>6年分・360問を対象に、科目配分と本文信号を統合。</p><div><i/>解析ステータス: ACTIVE</div></div>
   <p className="disclaimer"><ShieldCheck/>本サービスは学習支援用です。出題を保証するものではありません。</p>
  </aside>
  <main>
   <header><button className="menu" onClick={()=>setMobile(true)}><Menu/></button><div><span className="eyebrow">2026 EXAM FORECAST</span><h1>行政書士試験 <em>AI予測分析</em></h1></div><div className="header-stat"><Database/><span>解析済み<strong>360 Questions</strong></span></div></header>
   {tab==='予測レポート'&&<Forecast filtered={filtered} subject={subject} setSubject={setSubject}/>}
   {tab==='出題分析'&&<Analysis/>}
   {tab==='予想問題'&&<Questions openQ={openQ} setOpenQ={setOpenQ}/>}
   {tab==='AI実力スコア'&&<Score/>}
  </main>
 </div>
}

function Forecast({filtered,subject,setSubject}){return <div className="content">
 <section className="hero"><div><span className="tag"><Sparkles/>AI INSIGHT</span><h2>次に狙われる論点を、<br/><em>根拠とともに。</em></h2><p>令和2〜7年度の本試験PDFを分析。固定的な科目構成、直近本文の論点信号、横断出題のしやすさから学習優先度を算出しました。</p></div><div className="score-ring"><span>MODEL<br/>CONFIDENCE</span><strong>84<small>%</small></strong><p>構造分析 95 / 本文分析 73</p></div></section>
 <section className="metric-grid"><Metric icon={<FileSearch/>} n="6" label="分析年度" sub="令和2〜7年度"/><Metric icon={<Database/>} n="360" label="対象問題" sub="全60問 × 6年"/><Metric icon={<Activity/>} n="12" label="重点論点" sub="上位6件を表示"/><Metric icon={<Gauge/>} n="84%" label="総合信頼度" sub="データ品質を加味"/></section>
 <div className="section-head"><div><span className="eyebrow">PRIORITY MATRIX</span><h2>重点学習ランキング</h2></div><select value={subject} onChange={e=>setSubject(e.target.value)}><option>すべて</option>{subjects.map(s=><option key={s.name}>{s.name}</option>)}</select></div>
 <section className="ranking">{filtered.map(p=><article key={p.rank}><div className="rank">0{p.rank}</div><div className="prediction"><div><span>{p.subject}</span><b>{p.weight}</b></div><h3>{p.topic}</h3><p>{p.reason}</p><div className="signals">{p.signals.map(s=><i key={s}>{s}</i>)}</div></div><div className="prob"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="18"/><circle cx="22" cy="22" r="18" style={{strokeDashoffset:113-(113*p.score/100)}}/></svg><strong>{p.score}<small>%</small></strong><span>予測スコア</span></div></article>)}</section>
 <div className="method"><BrainCircuit/><div><b>スコアの見方</b><p>科目ウェイト40%、出題周期20%、論点横断性20%、直近本文信号20%を基準化。PDF抽出品質による信頼度補正を適用しています。</p></div></div>
 </div>}

function Metric({icon,n,label,sub}){return <article className="metric"><div>{icon}</div><strong>{n}</strong><span>{label}</span><small>{sub}</small></article>}

function Analysis(){return <div className="content"><div className="page-intro"><span className="eyebrow">DATA EXPLORER</span><h2>6年分の出題構造</h2><p>毎年の問題冊子を同じ尺度で比較。科目別配分とPDF本文の解析可能性を分けて可視化します。</p></div>
 <section className="panel"><div className="panel-title"><div><h3>科目別・年間出題数</h3><p>問題番号帯に基づく構造分類</p></div><span className="verified"><Check/>構造検証済み</span></div><div className="subject-list">{subjects.map(s=><div className="subject-row" key={s.name}><span className="dot" style={{background:s.color}}/><b>{s.name}</b><Sparkline values={s.trend} color={s.color}/><div className="bar"><i style={{width:`${s.count/19*100}%`,background:s.color}}/></div><strong>{s.count}<small>問</small></strong></div>)}</div></section>
 <section className="panel"><div className="panel-title"><div><h3>データソース品質</h3><p>解析結果の透明性</p></div></div><div className="year-grid">{years.map(y=><article key={y.year}><div><strong>{y.year}</strong><span>{y.pages} pages</span></div><div className="quality"><i style={{width:`${y.quality}%`}}/></div><b>{y.quality}%</b><small>{y.label}・{y.note}</small></article>)}</div><div className="notice"><ShieldCheck/><p><b>信頼度補正を適用</b> R2〜R6は埋め込みフォントの文字マップ不整合を検知したため、全文キーワードの寄与を抑え、問題構造を中心に評価しています。</p></div></section>
 </div>}

function Questions({openQ,setOpenQ}){return <div className="content"><div className="page-intro"><span className="eyebrow">GENERATIVE PRACTICE</span><h2>AI予想問題</h2><p>高優先度論点から、本試験の問い方に寄せた学習用サンプルを生成。解答よりも「なぜ狙われるか」を重視します。</p></div><div className="question-grid">{forecastQuestions.map((q,i)=><article className="question" key={q.q}><div className="qmeta"><span>予想 {String(i+1).padStart(2,'0')}</span><b>{q.subject}</b><i>{q.level}</i></div><h3>{q.q}</h3><button onClick={()=>setOpenQ(openQ===i?null:i)}>解答と分析を見る <ChevronRight className={openQ===i?'rot':''}/></button>{openQ===i&&<div className="answer"><span>MODEL ANSWER</span><p>{q.answer}</p><small><BrainCircuit/>生成根拠：{q.why}</small></div>}</article>)}</div><div className="method"><RotateCcw/><div><b>生成品質について</b><p>予想問題は学習用の叩き台です。条文・判例の最新状態を必ず六法および信頼できる教材で確認してください。</p></div></div></div>}

// スタディングのAI実力スコアを、科目バランス・平均との差・目標までの残りに分けて表示する。
function Radar(){
 const cx=178,cy=160,r=112,n=scoreSubjects.length
 // 真上から時計回りに軸を並べる。半径は得点率（score/max）。
 const point=(ratio,i)=>{const a=(-90+360/n*i)*Math.PI/180;return [cx+r*ratio*Math.cos(a),cy+r*ratio*Math.sin(a)]}
 const poly=vals=>vals.map((v,i)=>point(v,i).join(',')).join(' ')
 return <div className="radar">
  <svg viewBox="0 0 356 320" role="img" aria-label="科目別の得点率をあなたと受講者平均で比較したレーダーチャート">
   {[.25,.5,.75,1].map(g=><polygon key={g} points={poly(scoreSubjects.map(()=>g))} fill="none" stroke="#e2e0d8"/>)}
   {scoreSubjects.map((s,i)=>{const [x,y]=point(1,i);return <line key={s.name} x1={cx} y1={cy} x2={x} y2={y} stroke="#e2e0d8"/>})}
   <polygon points={poly(scoreSubjects.map(s=>s.average/s.max))} fill="#8ba19b25" stroke="#8ba19b" strokeWidth="2"/>
   <polygon points={poly(scoreSubjects.map(s=>s.score/s.max))} fill="#d59b4930" stroke="#c99548" strokeWidth="2"/>
   {scoreSubjects.map((s,i)=>{const [x,y]=point(1.2,i);return <text key={s.name} x={x} y={y} textAnchor={Math.abs(x-cx)<1?'middle':x>cx?'start':'end'} dominantBaseline="middle" fontSize="12" fill="#42534e">{s.name}</text>})}
  </svg>
  <p className="radar-legend"><i style={{background:'#c99548'}}/>あなた<i style={{background:'#8ba19b'}}/>受講者平均<small>外周＝満点</small></p>
 </div>
}

function Score(){return <div className="content">
 <div className="page-intro"><span className="eyebrow">PERSONAL DIAGNOSTIC</span><h2>AI実力スコア</h2><p>{scoreMeta.source}の値（{scoreMeta.capturedOn}時点）を科目別に並べ、受講者平均との差と目標{scoreMeta.target}点までの残りを整理しています。</p></div>
 <section className="metric-grid"><Metric icon={<Gauge/>} n={one(scoreMeta.total)} label="現在のスコア" sub={`${scoreMeta.totalMax}点満点`}/><Metric icon={<Target/>} n={String(scoreMeta.target)} label="目標点" sub={`達成率 ${one(pct(scoreMeta.total,scoreMeta.target))}%`}/><Metric icon={<ArrowUpRight/>} n={`+${one(scoreGap)}`} label="目標まで" sub="不足している点数"/><Metric icon={<Activity/>} n={one(scoreAverageTotal)} label="受講者平均" sub={`差 ${one(scoreMeta.total-scoreAverageTotal)}点`}/></section>

 <section className="panel"><div className="panel-title"><div><h3>科目別のスコアバランス</h3><p>得点率で受講者平均と重ねる</p></div></div><Radar/></section>

 <section className="panel"><div className="panel-title"><div><h3>科目別の実力</h3><p>縦線は受講者平均の位置</p></div></div><div className="subject-list">{scoreSubjects.map(s=><div className="score-row" key={s.name}><span className="dot" style={{background:s.color}}/><b>{s.name}</b><div className="bar"><i style={{width:`${pct(s.score,s.max)}%`,background:s.color}}/><u style={{left:`${pct(s.average,s.max)}%`}}/></div><strong>{one(s.score)}<small>/{s.max}</small></strong><em className={s.score>=s.average?'up':'down'}>{s.score>=s.average?'+':''}{one(s.score-s.average)}</em><small>上位{one(s.percentile)}%</small></div>)}</div></section>

 <section className="panel"><div className="panel-title"><div><h3>目標{scoreMeta.target}点までの上積み目安</h3><p>不足分を各科目の伸びしろの比で配分</p></div></div><div className="score-table"><table><thead><tr><th>科目</th><th>現在</th><th>上積み</th><th>到達目安</th><th>目安の得点率</th></tr></thead><tbody>{scorePlan.map(p=><tr key={p.name}><td>{p.name}</td><td>{one(p.score)} / {p.max}</td><td className="need">+{one(p.need)}</td><td className="goal">{one(p.goal)}</td><td>{one(pct(p.goal,p.max))}%</td></tr>)}<tr className="sum"><td>合計</td><td>{one(scoreMeta.total)} / {scoreMeta.totalMax}</td><td className="need">+{one(scoreGap)}</td><td className="goal">{one(scoreMeta.target)}</td><td>{one(pct(scoreMeta.target,scoreMeta.totalMax))}%</td></tr></tbody></table></div></section>

 <div className="notice"><ShieldCheck/><div><b>スコアの前提</b><p>AI実力スコアは実際の得点・合格を保証するものではありません。行政書士試験は300点満点ですが、記述式（60点）が対象外のため、ここでは{scoreMeta.totalMax}点満点として扱っています。目標{scoreMeta.target}点も同じ基準です。</p></div></div>
 </div>}

export default App

