import {useEffect,useState} from 'react'
import {api,usePlatform,displayTime} from './platform.jsx'
const today=()=>new Date().toLocaleDateString('sv-SE')
export default function Account(){
 const {user,setUser,available,loading,refresh}=usePlatform()
 const [register,setRegister]=useState(false),[name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false)
 const [history,setHistory]=useState([]),[logs,setLogs]=useState([]),[day,setDay]=useState(today),[subject,setSubject]=useState('行政法'),[minutes,setMinutes]=useState('30'),[note,setNote]=useState('')
 async function reload(){const [h,l]=await Promise.all([api('/diagnoses'),api('/study-logs')]);setHistory(h.diagnoses);setLogs(l.logs)}
 useEffect(()=>{let live=true;setHistory([]);setLogs([]);if(user)Promise.all([api('/diagnoses'),api('/study-logs')]).then(([h,l])=>{if(live){setHistory(h.diagnoses);setLogs(l.logs)}}).catch(e=>{if(live)setMessage(e.message)});return()=>{live=false}},[user?.id])
 async function auth(e){e.preventDefault();setBusy(true);setMessage('');try{const r=await api(register?'/register':'/login','POST',{name,email,password});setPassword('');setUser(r.user)}catch(e){setMessage(e.message)}finally{setBusy(false)}}
 async function logout(){setBusy(true);try{await api('/logout','POST',{});setUser(null);setHistory([]);setLogs([]);setMessage('ログアウトしました。')}catch(e){setMessage(e.message)}finally{setBusy(false)}}
 async function save(e){e.preventDefault();setBusy(true);try{await api('/study-logs','POST',{day,subject,minutes:Number(minutes),note});setNote('');await reload();setMessage('学習記録を保存しました。')}catch(e){setMessage(e.message)}finally{setBusy(false)}}
 async function remove(kind,id){setBusy(true);try{await api(`/${kind}/${id}`,'DELETE');await reload();setMessage('記録を削除しました。')}catch(e){setMessage(e.message)}finally{setBusy(false)}}
 return <div className="content materials-page"><div className="page-intro"><span className="eyebrow">MY STUDY</span><h2>マイページ</h2><p>学習の積み重ねと、教材選びの履歴。</p></div>
 {message&&<p role="status" className="material-advice">{message}</p>}
 {!available?<section className="panel"><p>{loading?'接続を確認しています…':'保存サービスに接続できません。教材検索と保存しない診断は利用できます。'}</p><button onClick={()=>refresh().catch(e=>setMessage(e.message))}>再接続</button></section>:!user?<section className="panel"><h3>{register?'アカウント登録':'ログイン'}</h3><form className="material-form" onSubmit={auth}>
 {register&&<label>表示名<input required maxLength={60} autoComplete="nickname" value={name} onChange={e=>setName(e.target.value)}/></label>}
 <label>メールアドレス<input type="email" required maxLength={254} autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>パスワード（12文字以上）<input type="password" required minLength={12} maxLength={128} autoComplete={register?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)}/></label>
 <p>診断・学習記録は本人のみ閲覧できます。レビュー投稿時は表示名が公開されます。</p><button disabled={busy} className="material-primary">{busy?'処理中…':register?'登録する':'ログイン'}</button></form><button className="text-button" onClick={()=>{setRegister(!register);setMessage('')}}>{register?'登録済みの方はこちら':'新しく登録する'}</button></section>:<>
 <section className="panel"><h3>{user.name} さん</h3><p>表示中の直近{logs.length}件：{logs.reduce((sum,l)=>sum+l.minutes,0)}分の学習</p><button disabled={busy} onClick={logout}>ログアウト</button></section>
 <section className="panel"><h3>学習を記録</h3><form onSubmit={save} className="material-form"><div className="material-fields"><label>学習日<input type="date" required value={day} onChange={e=>setDay(e.target.value)}/></label><label>科目<select value={subject} onChange={e=>setSubject(e.target.value)}>{['行政法','民法','憲法','商法','基礎法学','基礎知識','記述式'].map(s=><option key={s}>{s}</option>)}</select></label><label>学習時間（分）<input type="number" required min="1" max="1440" value={minutes} onChange={e=>setMinutes(e.target.value)}/></label></div><label>復習メモ<textarea maxLength={500} value={note} onChange={e=>setNote(e.target.value)}/></label><button disabled={busy} className="material-primary">保存する</button></form>
 {logs.length===0?<p>まだ学習記録はありません。</p>:<ul className="record-list">{logs.map(l=><li key={l.id}><b>{l.day} / {l.subject} / {l.minutes}分</b><p>{l.note}</p><button disabled={busy} onClick={()=>remove('study-logs',l.id)}>この記録を削除</button></li>)}</ul>}</section>
 <section className="panel"><h3>教材診断の履歴</h3><p>「教材診断」で保存した最新50件を表示します。</p>{history.length===0?<p>保存した診断はありません。</p>:history.map(h=><details key={h.id}><summary>{displayTime(h.created_at)} / 週{h.input.hours}時間 / 予算{h.input.budget}円</summary><p>{h.result.advice}</p><ul>{h.result.candidates.map(m=><li key={m.id}>{m.name}：{m.reason}</li>)}</ul>{h.result.ai?.text&&<p>{h.result.ai.text}</p>}<button disabled={busy} onClick={()=>remove('diagnoses',h.id)}>この診断を削除</button></details>)}</section>
 </>}
 </div>
}
