import { BrainCircuit, CalendarDays, Flag, ShieldCheck, Target } from 'lucide-react'
import { scoreMeta, scoreSubjects } from './score.js'
import { daily, dontDo, downside, examDate, examDay, missPatterns, passLine, planRows, weeks } from './strategy.js'
import './prose.css'
import './strategy.css'

const one = n => n.toFixed(1)
const planTotal = planRows.reduce((n,r)=>n+r.target,0)
const nowOf = name => scoreSubjects.find(s=>s.name===name)

// 本試験までの残り日数。表示した時点で数え直す。
function daysLeft(){
 const diff = new Date(examDate+'T00:00:00+09:00') - new Date()
 return Math.max(0, Math.ceil(diff/86400000))
}

function Strategy(){
 const left = daysLeft()
 return <div className="content">
  <div className="page-intro"><span className="eyebrow">EXAM STRATEGY</span><h2>AI実力スコア{one(scoreMeta.total)}点から、<br/>本試験198点を設計する</h2>
   <p>180点を狙う計画は、どこか1つ外すと落ちます。198点を設計して、3つ同時に外しても180に残る形にしました。前提を2つ変えたことで、配分がまるごと組み変わっています。</p></div>

  <section className="metric-grid">
   <Cell icon={<Target/>} n={one(scoreMeta.total)} label="現在のAI実力スコア" sub={`${scoreMeta.totalMax}点満点・記述式を除く`}/>
   <Cell icon={<Flag/>} n={String(planTotal)} label="設計値" sub="300点満点"/>
   <Cell icon={<ShieldCheck/>} n="180" label="合格ライン" sub="総得点。他に2つの足切りあり"/>
   <Cell icon={<CalendarDays/>} n={String(left)} label="本試験まで（日）" sub={`${examDate}（11月第2日曜・見込み）`}/>
  </section>

  <Panel title="前提を2つ変えた" sub="ここが今回の組み直しの起点">
   <ol className="steps">
    <li><b>基礎知識に1分も使わない。</b>2回目・3回目の本試験を無勉強で足切り通過できているため、多くの受験生が政治経済社会に取られる時間を、まるごと行政法に回せます。これが最大の武器です。</li>
    <li><b>教材は2冊だけに固定する。</b>伊藤塾「解法スキル完全マスター」（2分冊）と「一問一答 過去問セレクション」。少ないことは弱点ではなく、回転数を上げられる強みです。</li>
   </ol>
  </Panel>

  <Panel title="得点設計" sub={`合計${planTotal}点。合格条件は「総得点180・法令等122・基礎知識24」の3つすべて`}>
   <div className="score-table"><table><thead><tr><th>科目</th><th>満点</th><th>現在（AI）</th><th>設計値</th><th>得点率</th><th className="left">内訳</th></tr></thead>
    <tbody>{planRows.map(r=>{const now=nowOf(r.name);return <tr key={r.name}>
     <td>{r.name}</td><td>{r.full}</td><td>{now?one(now.score):'—'}</td>
     <td className="goal">{r.target}</td><td>{(r.target/r.full*100).toFixed(0)}%</td><td className="left note">{r.note}</td></tr>})}
     <tr className="sum"><td>合計</td><td>300</td><td>—</td><td className="goal">{planTotal}</td><td>{(planTotal/300*100).toFixed(0)}%</td><td className="left note">合格ラインを18点上回る</td></tr>
    </tbody></table></div>
   <ul className="pass-line">{passLine.map(p=><li key={p.label}><span>{p.label}</span><b>{p.need}</b><small>/ {p.full}点</small></li>)}</ul>
  </Panel>

  <Panel title="下振れ耐性" sub="「余裕を持って超える」の中身は、外したときにどこで止まるか">
   <div className="score-table"><table><thead><tr><th className="left">想定</th><th>内訳の変化</th><th>総得点</th></tr></thead>
    <tbody>{downside.map((d,i)=><tr key={d.label} className={i===downside.length-1?'sum':''}>
     <td className="left">{d.label}</td><td className="note">{d.detail||'—'}</td><td className={d.total>=180?'goal':'need'}>{d.total}</td></tr>)}</tbody></table></div>
   <p className="para">3つ同時に外して、ようやく180ちょうど。ここまで余白を作っておくと、模試のブレで計画を揺らす必要がなくなります。</p>
  </Panel>

  <Panel title="なぜ行政法に全振りするのか" sub="配点112点／300点">
   <p className="para">記述式を含めると、行政法は<b>112点（全体の37%）</b>を占めます。しかも中身の大半は「条文がそのまま答えになる」問題です。行政手続法・行政不服審査法・行政事件訴訟法は合わせても<b>200条弱</b>しかなく、毎日15分の素読で1周できます。8週間でいちばん点が動くのはここです。</p>
   <p className="para">伸ばしやすい順は <b>行政手続法 → 行政不服審査法 → 行政事件訴訟法 → 国家賠償法 → 地方自治法</b>。前の2つは条文の反復だけで最短距離で点になります。行政事件訴訟法と国家賠償法は判例（処分性・原告適格・訴えの利益、公権力の行使・営造物責任）まで要るので、その後に回します。</p>
  </Panel>

  <Panel title="教材2冊の噛み合わせ" sub="一問一答＝回転装置、解法スキル＝誤答の翻訳機">
   <ol className="steps">
    <li><b>解法スキルは通読しない。</b>最初にやるのは、行政法編・民法編から「肢の切り方のパターン」だけを抜き出して<b>A4用紙1枚</b>にまとめること。</li>
    <li><b>一問一答を回す。</b>×だった肢に、下のパターンのどれで引っかかったかを2文字でタグ付けする。</li>
    <li><b>週末にパターン別の×の数を数える。</b>「今週は主体のすり替えで12回落ちた」と分かれば、翌週はそこだけ意識して読む。</li>
    <li><b>2周目以降は×肢だけ。</b>○の肢に戻らない。8週間で全肢を何周もする時間はありません。</li>
   </ol>
   <div className="tags">{missPatterns.map(p=><i key={p}>{p}</i>)}</div>
   <p className="para">知識ではなく<b>外し方の癖</b>を潰す作業です。ノートは作らず、作るのはこのパターン表1枚だけにします。</p>
  </Panel>

  <Panel title="8週間の進め方" sub={`${examDate} の本試験まで`}>
   <div className="score-table"><table><thead><tr><th>週</th><th className="left">期間</th><th className="left">主軸</th><th className="left">到達ライン</th></tr></thead>
    <tbody>{weeks.map(w=><tr key={w.no}><td>W{w.no}</td><td className="left note">{w.period}</td><td className="left">{w.focus}</td><td className="left goal">{w.goal}</td></tr>)}</tbody></table></div>
   <p className="para">初回の模試で180は出ない前提です。現実的なカーブは<b>模試①160 → 模試②175 → 模試③185 → 本試験190台</b>。ここから外れたときに動かすのは、計画ではなく×肢の配分だけです。</p>
  </Panel>

  <Panel title="1日の配分" sub="時間ではなく比率で管理する。総量が減っても設計が崩れないため">
   <div className="subject-list">{daily.map(d=><div className="ratio-row" key={d.name}>
    <b>{d.name}</b><div className="bar"><i style={{width:`${d.ratio}%`}}/></div><strong>{d.ratio}<small>%</small></strong><small>{d.note}</small></div>)}</div>
   <p className="para">2時間しか取れない日は、<b>行政法・民法・記述</b>だけ残して他を落とします。この3つで本試験212点分です。</p>
  </Panel>

  <Panel title="記述式は毎日10分、キーワードだけ" sub="満点を狙わず、部分点を積む型を固定する">
   <ul className="steps">
    <li><b>行政法</b>：「誰を被告として／どの訴訟・申立てを／どの要件で」</li>
    <li><b>民法</b>：「誰が誰に対して／何を根拠に／何を請求できるか」</li>
    <li>40字は<b>主語＋根拠＋結論</b>の3ブロックに割る</li>
   </ul>
   <p className="para">書いたら模範解答と見比べて、文章の出来ではなく<b>キーワードが入っているかどうかだけ</b>で採点します。記述は択一の知識の出口なので、行政法・民法の勉強がそのまま点になります。</p>
  </Panel>

  <Panel title="模試の使い方と、当日180分の配分" sub="模試の目的は点数ではなく、時間配分の実験・×肢の発掘・本番の体感">
   <div className="score-table"><table><thead><tr><th>順</th><th className="left">内容</th><th>時間</th><th className="left">ねらい</th></tr></thead>
    <tbody>{examDay.map((e,i)=><tr key={e.what}><td>{i+1}</td><td className="left">{e.what}</td><td>{e.min}分</td><td className="left note">{e.why||'—'}</td></tr>)}
     <tr className="sum"><td>計</td><td className="left">—</td><td>{examDay.reduce((n,e)=>n+e.min,0)}分</td><td className="left note">試験時間3時間</td></tr></tbody></table></div>
   <p className="para">文章理解を最初に置くのは、確実に取れる12点を頭が元気なうちに回収するためです。合う順番は人によって違うので、模試①と②で<b>別の順番を試して</b>自分の型を決めます。復習は当日中に、×と「勘で当たった△」だけ。模試は3〜4回で十分で、受験時間の倍を復習に使います。</p>
  </Panel>

  <Panel title="やらないことリスト" sub="やることより、やらないことのほうが効く">
   <ul className="steps dont">{dontDo.map(d=><li key={d}>{d}</li>)}</ul>
  </Panel>

  <div className="notice"><ShieldCheck/><div><b>この記事の位置づけ</b><p>個人の学習記録をもとにした学習計画です。AI実力スコアは学習サービスによる推定値で、実際の得点・合格を保証するものではありません。試験日・試験範囲・配点・実施要領は、必ず一般財団法人行政書士試験研究センターの公式発表で確認してください（本試験日は11月第2日曜の見込みとして記載しています）。</p></div></div>
  <div className="method"><BrainCircuit/><div><b>数値の出どころ</b><p>「現在（AI）」の列は、サイト内の「AI実力スコア」と同じデータ（{scoreMeta.capturedOn}時点）を参照しています。スコアを更新すると、この記事の数値も一緒に動きます。</p></div></div>
 </div>
}

function Cell({icon,n,label,sub}){return <article className="metric"><div>{icon}</div><strong>{n}</strong><span>{label}</span><small>{sub}</small></article>}
function Panel({title,sub,children}){return <section className="panel"><div className="panel-title"><div><h3>{title}</h3><p>{sub}</p></div></div>{children}</section>}

export default Strategy
