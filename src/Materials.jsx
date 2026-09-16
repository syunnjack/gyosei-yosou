import {useState} from 'react'
import {featureLabels, diagnose} from './materials.js'
import {api,usePlatform} from './platform.jsx'
import Reviews from './Reviews.jsx'
import './materials.css'

function OfficialLink({material}) {const {available}=usePlatform();return <a href={available?`/api/out/${material.id}`:material.url} target="_blank" rel={available&&material.affiliateUrl?'sponsored noopener noreferrer':'noopener noreferrer'}>{available&&material.affiliateUrl?'広告・':''}公式で料金・日程を確認 ↗</a>}
function MaterialCard({material,reason,rank}) {return <article className="material-card">
  <div className="material-meta">{rank && <b>候補 {rank}</b>}<span>{material.company} / {material.year} / {material.type}</span></div>
  <h3>{material.name}</h3><p>{material.summary}</p>
  <div className="material-tags">{material.features.map(f=><span key={f}>{featureLabels[f]}</span>)}</div>
  {reason && <p className="material-reason">{reason}</p>}
  <p className="material-price">料金：{material.price===null?'公式で確認':`${material.price.toLocaleString()}円`} <small>{material.price===null?'予算内かは未確認':'掲載時点の料金・条件は公式で確認'}</small></p>
  <details><summary>教材の詳細・申込時の確認事項</summary><p>{material.caution}</p><p>情報確認日：{material.checkedOn}。受付状況や料金は変更されることがあります。</p><a href={material.source} target="_blank" rel="noopener noreferrer">掲載情報の出典 ↗</a></details>
  <OfficialLink material={material}/>
  <Reviews materialId={material.id}/>
</article>}

export default function Materials({mode='catalog'}) {
  const {catalog:materials,user,available,aiAvailable}=usePlatform()
  const [busy,setBusy]=useState(false),[useAI,setUseAI]=useState(false),[saved,setSaved]=useState(false),[type,setType]=useState('すべて')
  const [company,setCompany]=useState('すべて')
  const [query,setQuery]=useState('')
  const [priority,setPriority]=useState('practice')
  const [hours,setHours]=useState('8')
  const [budget,setBudget]=useState('5000')
  const [owned,setOwned]=useState([])
  const [result,setResult]=useState(null)
  const [error,setError]=useState('')
  const isDiagnosis=mode==='diagnosis', isRanking=mode==='ranking'
  const filtered=materials.filter(m=>(company==='すべて'||m.company===company)&&(type==='すべて'||m.type===type)&&`${m.name} ${m.company}`.toLowerCase().includes(query.trim().toLowerCase()))
  const ordered=isRanking?[...filtered].sort((a,b)=>Number(b.features.includes(priority))-Number(a.features.includes(priority))||a.id.localeCompare(b.id)):filtered
  function update(setter,value){setter(value);setResult(null);setSaved(false);setError('')}
  async function submit(event){event.preventDefault();setBusy(true);setError('');setSaved(false);try{const input={priority,hours:Number(hours),budget:Number(budget),owned};if(user&&available){const response=await api('/diagnoses','POST',{...input,useAI});setResult(response.result);setSaved(true)}else setResult(diagnose(input,materials))}catch(e){setError(e.message)}finally{setBusy(false)}}
  return <div className="content materials-page">
    <div className="page-intro"><span className="eyebrow">MATERIAL GUIDE / 2026</span><h2>{isDiagnosis?'教材診断':isRanking?'教材ランキング':'教材を探す'}</h2><p>{isDiagnosis?'今の学習時間と手元の教材から、次の一冊を考える。':'公式情報を並べて、自分に必要な模試を選ぶ。'}</p></div>
    <div className="material-intro"><b>買い足す前に、目的をひとつ。</b><p>出典付きの教材を{materials.length}件掲載。順位は選択条件への一致順です。品質・的中率の優劣や合格確率を示すものではありません。</p></div>
    {isDiagnosis?<>
      <form className="material-form" onSubmit={submit}>
        <fieldset disabled={busy} className="form-body">
        <div className="material-fields"><label>週に使える学習時間<input type="number" min="0" max="168" step="0.5" required value={hours} onChange={e=>update(setHours,e.target.value)}/><small>時間／週</small></label>
        <label>追加購入の予算<input type="number" min="0" max="1000000" step="1" required value={budget} onChange={e=>update(setBudget,e.target.value)}/><small>円（0円なら追加購入なし）</small></label>
        <label>重視する支援<select value={priority} onChange={e=>update(setPriority,e.target.value)}>{Object.entries(featureLabels).map(([v,label])=><option value={v} key={v}>{label}</option>)}</select></label></div>
        <fieldset><legend>受講・購入済み、またはコースに含まれる模試</legend>{materials.map(m=><label className="material-check" key={m.id}><input type="checkbox" checked={owned.includes(m.id)} onChange={e=>update(setOwned,e.target.checked?[...owned,m.id]:owned.filter(id=>id!==m.id))}/>{m.company}：{m.name}</label>)}</fieldset>
        <p>{user&&available?'診断すると入力と結果を自分の履歴に保存します。':'ログインなしでも診断できます。入力は保存されません。履歴を残すにはマイページからログインしてください。'}</p>
        {user&&aiAvailable&&<label className="material-check"><input type="checkbox" checked={useAI} onChange={e=>update(setUseAI,e.target.checked)}/>AIによる学習方法の補足を付ける（学習時間・予算・選択条件をOpenAIに送信。氏名・メールは送りません）</label>}
        <button className="material-primary" type="submit" disabled={busy}>{busy?'診断中…':user&&available?'診断して履歴に保存':'条件に合う候補を見る'}</button>{error&&<p role="alert">{error}</p>}
        </fieldset>
      </form>
      {result&&<section aria-label="診断結果" aria-live="polite" className="material-results"><h3>あなたの次の一歩</h3><p className="material-advice">{result.advice}</p>
        {saved&&<p>マイページの診断履歴に保存しました。</p>}
        {result.ai?.text&&<aside className="material-advice"><b>AIによる学習方法の補足</b><p>{result.ai.text}</p></aside>}
        {result.ai&&!result.ai.text&&<p>AI補足は現在利用できません。条件に基づく診断結果を表示しています。</p>}
        {result.candidates.length>0?<><p>料金未確認の候補を含みます。予算 {result.budget.toLocaleString()} 円で申込可能か確認してください。同条件は同順位です。</p><div className="material-grid">{result.candidates.map(m=><MaterialCard key={m.id} material={m} rank={m.match?1:result.candidates.filter(c=>c.match).length+1} reason={m.reason}/>)}</div></>:<p>今回、新しく購入する候補はありません。</p>}
        {result.excluded.length>0&&<details><summary>候補から外した教材（{result.excluded.length}件）</summary><ul>{result.excluded.map(m=><li key={m.id}>{m.name}：{m.reason}</li>)}</ul></details>}
        <details><summary>診断の基準</summary><p>購入済みを除外し、予算0円なら購入を勧めません。週6時間未満は復習を優先します（運営上の目安）。残りの候補を重視する支援の確認有無で並べます。価格不明は予算適合を判定せず、支援の記載がない場合も非対応とは断定しません。</p></details>
      </section>}
    </>:<>
      <div className="material-filters"><label>教材名で検索<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="例：公開模試"/></label><label>予備校<select value={company} onChange={e=>setCompany(e.target.value)}>{['すべて',...new Set(materials.map(m=>m.company))].map(c=><option key={c}>{c}</option>)}</select></label>{isRanking&&<label>優先する支援<select value={priority} onChange={e=>setPriority(e.target.value)}>{Object.entries(featureLabels).map(([v,label])=><option value={v} key={v}>{label}</option>)}</select></label>}</div>
      <label className="type-filter">教材の種類<select value={type} onChange={e=>setType(e.target.value)}>{['すべて','模試','答練','通信講座','過去問','問題集'].map(t=><option key={t}>{t}</option>)}</select></label>
      <p role="status">{ordered.length}件{isRanking?'・公式情報との一致順（同条件は同順位）':''}</p>
      {ordered.length?<div className="material-grid">{ordered.map(m=><MaterialCard key={m.id} material={m} rank={isRanking?(m.features.includes(priority)?1:ordered.filter(c=>c.features.includes(priority)).length+1):null} reason={isRanking?(m.features.includes(priority)?`${featureLabels[priority]}を公式情報で確認`:'選んだ支援の有無は公式で要確認'):null}/>)}</div>:<div className="material-empty"><p>条件に合う教材がありません。</p><button onClick={()=>{setQuery('');setCompany('すべて');setType('すべて')}}>検索条件をリセット</button></div>}
    </>}
  </div>
}
