import {useState} from 'react'
import {api,usePlatform,displayTime} from './platform.jsx'
export default function Reviews({materialId}){
  const {user,available}=usePlatform();const [reviews,setReviews]=useState(null),[rating,setRating]=useState('5'),[body,setBody]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false)
  async function load(){setBusy(true);try{setReviews((await api(`/materials/${materialId}/reviews`)).reviews);setMessage('')}catch(e){setMessage(e.message)}finally{setBusy(false)}}
  async function submit(e){e.preventDefault();setBusy(true);setMessage('');try{const r=await api(`/materials/${materialId}/reviews`,'POST',{rating:Number(rating),body});setMessage(r.message);setBody('')}catch(e){setMessage(e.message)}finally{setBusy(false)}}
  return <details onToggle={e=>{if(e.currentTarget.open&&reviews===null&&available&&!busy)load()}}><summary>利用者レビュー</summary>
    {!available?<p>レビューは保存サービスへの接続後に利用できます。</p>:<>
      {reviews?.length===0&&<p>公開レビューはまだありません。</p>}
      {reviews?.map(r=><blockquote key={r.id}><b>{r.name} / 評価 {r.rating} / 5</b><p>{r.body}</p><small>{displayTime(r.created_at)}</small></blockquote>)}
      {user?<form onSubmit={submit} className="review-form"><label>評価<select value={rating} onChange={e=>setRating(e.target.value)}>{[5,4,3,2,1].map(n=><option key={n}>{n}</option>)}</select></label><label>使ってみた感想<textarea required minLength={10} maxLength={2000} value={body} onChange={e=>setBody(e.target.value)}/></label><p>表示名と本文は承認後に公開されます。1教材につき1件。再投稿すると承認待ちに戻ります。</p><button disabled={busy} className="material-primary">{busy?'処理中…':'レビューを投稿'}</button></form>:<p>投稿するには「マイページ」からログインしてください。</p>}
      {reviews===null&&!busy&&<button onClick={load}>再読み込み</button>}
    </>}{message&&<p role="status">{message}</p>}
  </details>
}
