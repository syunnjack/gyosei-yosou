import {useEffect,useState} from 'react'
import {api,usePlatform} from './platform.jsx'
import {featureLabels} from './materials.js'
const empty={id:'',company:'',name:'',type:'模試',year:2026,price:null,features:[],summary:'',caution:'',url:'',source:'',checkedOn:new Date().toLocaleDateString('sv-SE'),active:true,affiliateUrl:''}
export default function Admin(){
 const {user,refresh}=usePlatform();const [items,setItems]=useState([]),[reviews,setReviews]=useState([]),[stats,setStats]=useState(null),[form,setForm]=useState(empty),[message,setMessage]=useState(''),[busy,setBusy]=useState(false)
 const update=(key,value)=>setForm(f=>({...f,[key]:value}))
 async function load(){const [m,r,s]=await Promise.all([api('/admin/materials'),api('/admin/reviews'),api('/admin/stats')]);setItems(m.materials);setReviews(r.reviews);setStats(s)}
 useEffect(()=>{if(user?.role==='admin')load().catch(e=>setMessage(e.message))},[user?.id])
 async function save(e){e.preventDefault();setBusy(true);try{await api('/admin/materials','PUT',form);await Promise.all([load(),refresh()]);setMessage('教材を保存しました。')}catch(e){setMessage(e.message)}finally{setBusy(false)}}
 async function moderate(id,status){setBusy(true);try{await api(`/admin/reviews/${id}`,'PATCH',{status});await load();setMessage('レビューの公開状態を更新しました。')}catch(e){setMessage(e.message)}finally{setBusy(false)}}
 if(user?.role!=='admin')return <div className="content"><p>管理者でログインしてください。</p></div>
 return <div className="content materials-page"><div className="page-intro"><span className="eyebrow">MANAGEMENT</span><h2>管理画面</h2><p>教材情報とレビューの公開を管理します。</p></div>{message&&<p role="status" className="material-advice">{message}</p>}
 <section className="panel"><h3>教材の追加・編集</h3><div className="admin-items"><button onClick={()=>setForm({...empty})}>新規教材</button>{items.map(m=><button key={m.id} onClick={()=>setForm({...m,affiliateUrl:m.affiliateUrl||''})}>{m.company}：{m.name}{!m.active?'（非公開）':''}</button>)}</div>
 <form onSubmit={save} className="material-form"><div className="material-fields">
 <label>教材ID（半角英数字・ハイフン）<input required pattern="[a-z0-9-]+" maxLength={80} value={form.id} onChange={e=>update('id',e.target.value)}/></label><label>予備校・出版社<input required maxLength={80} value={form.company} onChange={e=>update('company',e.target.value)}/></label><label>教材名<input required maxLength={160} value={form.name} onChange={e=>update('name',e.target.value)}/></label>
 <label>種類<select value={form.type} onChange={e=>update('type',e.target.value)}>{['模試','答練','通信講座','過去問','問題集'].map(t=><option key={t}>{t}</option>)}</select></label><label>対象年<input type="number" required min="2000" max="2100" value={form.year} onChange={e=>update('year',Number(e.target.value))}/></label><label>料金（不明なら空欄）<input type="number" min="0" max="1000000" value={form.price??''} onChange={e=>update('price',e.target.value===''?null:Number(e.target.value))}/></label>
 </div><fieldset><legend>公式情報で確認できる支援</legend>{Object.entries(featureLabels).map(([key,label])=><label className="material-check" key={key}><input type="checkbox" checked={form.features.includes(key)} onChange={e=>update('features',e.target.checked?[...form.features,key]:form.features.filter(f=>f!==key))}/>{label}</label>)}</fieldset>
 <label>概要<textarea required maxLength={1000} value={form.summary} onChange={e=>update('summary',e.target.value)}/></label><label>注意事項<textarea maxLength={1000} value={form.caution} onChange={e=>update('caution',e.target.value)}/></label>
 {['url','source','affiliateUrl'].map((key,i)=><label key={key}>{['公式URL','情報の出典URL','アフィリエイトURL（任意・広告表示あり）'][i]}<input type="url" required={i<2} value={form[key]} onChange={e=>update(key,e.target.value)} placeholder="https://"/></label>)}
 <label>情報確認日<input type="date" required value={form.checkedOn} onChange={e=>update('checkedOn',e.target.value)}/></label><label className="material-check"><input type="checkbox" checked={form.active} onChange={e=>update('active',e.target.checked)}/>公開する</label><button disabled={busy} className="material-primary">教材を保存</button></form></section>
 <section className="panel"><h3>レビューの確認</h3>{reviews.length===0?<p>レビューはありません。</p>:reviews.map(r=><article className="moderation" key={r.id}><b>{r.material} / {r.name} / 評価{r.rating}</b><p>{r.body}</p><p>状態：{{pending:'承認待ち',approved:'公開済み',rejected:'非公開'}[r.status]}</p><div className="admin-items"><button disabled={busy} onClick={()=>moderate(r.id,'approved')}>承認して公開</button><button disabled={busy} onClick={()=>moderate(r.id,'rejected')}>非公開にする</button></div></article>)}</section>
 <section className="panel"><h3>広告リンクのクリック</h3>{stats?.clicks.length?stats.clicks.map(c=><p key={c.day+c.material_id}>{c.day} / {c.material_id}：{c.clicks}回</p>):<p>記録はありません。広告URLを設定した教材のみ集計します。</p>}<details><summary>管理操作の履歴</summary>{stats?.audit.map((a,i)=><p key={i}>{a.created_at} / {a.action} / {a.target}</p>)}</details></section>
 </div>
}
