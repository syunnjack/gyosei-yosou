import {createServer} from 'node:http'
import {readFile,stat} from 'node:fs/promises'
import {resolve,extname,sep} from 'node:path'
import {fileURLToPath} from 'node:url'
import {openDatabase,listMaterials} from './db.js'
import {hashPassword,checkPassword,createSession,currentUser,sessionToken,digest,limit} from './security.js'
import {diagnose,featureLabels} from '../src/materials.js'
import {aiReady,explainDiagnosis} from './ai.js'

const root=fileURLToPath(new URL('../',import.meta.url))
const fail=(status,message)=>{throw Object.assign(new Error(message),{status})}
const text=(value,min,max)=>typeof value==='string'&&value.trim().length>=min&&value.length<=max
const secureURL=value=>{try{return new URL(value).protocol==='https:'}catch{return false}}
const userRequired=user=>{if(!user)fail(401,'ログインしてください。')}
const adminRequired=user=>{userRequired(user);if(user.role!=='admin')fail(403,'管理者のみ操作できます。')}
const publicUser=user=>({id:user.id,name:user.name,email:user.email,role:user.role})
async function body(req){
  if(!req.headers['content-type']?.startsWith('application/json'))fail(415,'JSON形式が必要です。')
  let size=0;const chunks=[]
  for await(const chunk of req){size+=chunk.length;if(size>32768)fail(413,'入力が長すぎます。');chunks.push(chunk)}
  try{const data=JSON.parse(Buffer.concat(chunks).toString());if(!data||Array.isArray(data)||typeof data!=='object')throw new Error();return data}catch{fail(400,'入力形式を確認してください。')}
}
function materialInput(m){
  if(!text(m.id,1,80)||! /^[a-z0-9-]+$/.test(m.id)||!text(m.name,1,160)||!text(m.company,1,80)||!['模試','答練','通信講座','過去問','問題集'].includes(m.type)||!Number.isInteger(m.year)||m.year<2000||m.year>2100||!(m.price===null||(Number.isInteger(m.price)&&m.price>=0&&m.price<=1000000))||!Array.isArray(m.features)||m.features.length>4||m.features.some(f=>!Object.hasOwn(featureLabels,f))||!text(m.summary,1,1000)||!text(m.caution,0,1000)||!secureURL(m.url)||!secureURL(m.source)||!/^\d{4}-\d{2}-\d{2}$/.test(m.checkedOn)|| (m.affiliateUrl&&!secureURL(m.affiliateUrl)))fail(422,'教材の入力項目・URL・価格を確認してください。')
  return Object.fromEntries(['id','name','company','type','year','price','features','summary','caution','url','source','checkedOn','affiliateUrl'].filter(k=>m[k]!==undefined).map(k=>[k,m[k]]))
}

export function createApp({db=openDatabase(process.env.DATABASE_PATH||resolve(root,'data/gyosai.sqlite')),origins=(process.env.APP_ORIGIN||'http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:8787').split(','),production=process.env.NODE_ENV==='production',ai=explainDiagnosis}={}){
  const server=createServer(async(req,res)=>{
    const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data))}
    const cookie=(value,age=604800)=>res.setHeader('Set-Cookie',`gyosai_session=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${production?'; Secure':''}`)
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','DENY')
    try{
      const url=new URL(req.url,'http://localhost'),path=url.pathname,method=req.method
      if(!path.startsWith('/api/')){
        if(!['GET','HEAD'].includes(method))fail(405,'許可されていない操作です。')
        const dist=resolve(root,'dist');let file=resolve(dist,'.'+decodeURIComponent(path))
        if(!file.startsWith(dist+sep)&&file!==dist)fail(404,'ページが見つかりません。')
        try{if((await stat(file)).isDirectory())file=resolve(file,'index.html');const data=await readFile(file);const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.xml':'application/xml','.png':'image/png'};res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(method==='HEAD'?undefined:data);return}catch{fail(404,'ページが見つかりません。')}
      }
      if(!['GET','HEAD'].includes(method)){
        if(!origins.includes(req.headers.origin)||req.headers['x-gyosai-request']!=='1')fail(403,'この送信元からは操作できません。')
        if(!limit(db,`write:${req.socket.remoteAddress}`,200,60))fail(429,'操作が多いため、少し待ってお試しください。')
      }
      const user=currentUser(db,req)
      if(method==='GET'&&path==='/api/session')return send(200,{user,aiAvailable:aiReady()})
      if(method==='GET'&&path==='/api/materials')return send(200,{materials:listMaterials(db)})
      if(method==='POST'&&['/api/register','/api/login'].includes(path)){
        if(!limit(db,`auth:${req.socket.remoteAddress}`,15,900))fail(429,'試行回数が多いため15分後にお試しください。')
        const data=await body(req)
        if(!text(data.email,3,254)||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)||!text(data.password,12,128))fail(422,'メールアドレスと12文字以上のパスワードを入力してください。')
        const email=data.email.trim().toLowerCase();let row=db.prepare('SELECT * FROM users WHERE email=?').get(email)
        if(path==='/api/register'){
          if(!text(data.name,1,60))fail(422,'表示名を入力してください。')
          if(row)fail(409,'このメールアドレスは登録できません。ログインをお試しください。')
          const password=await hashPassword(data.password)
          try{db.prepare('INSERT INTO users(name,email,password) VALUES(?,?,?)').run(data.name.trim(),email,password)}catch{fail(409,'登録できませんでした。ログインをお試しください。')}
          row=db.prepare('SELECT * FROM users WHERE email=?').get(email)
        }else if(!row||!await checkPassword(data.password,row.password))fail(401,'メールアドレスまたはパスワードを確認してください。')
        db.prepare('DELETE FROM sessions WHERE token=?').run(digest(sessionToken(req)))
        cookie(createSession(db,row.id));return send(200,{user:publicUser(row)})
      }
      if(method==='POST'&&path==='/api/logout'){db.prepare('DELETE FROM sessions WHERE token=?').run(digest(sessionToken(req)));cookie('',0);return send(200,{ok:true})}
      const reviewPath=path.match(/^\/api\/materials\/([a-z0-9-]+)\/reviews$/)
      if(reviewPath){
        const id=reviewPath[1];if(!db.prepare('SELECT id FROM materials WHERE id=? AND active=1').get(id))fail(404,'教材が見つかりません。')
        if(method==='GET')return send(200,{reviews:db.prepare("SELECT r.id,r.rating,r.body,r.created_at,u.name FROM reviews r JOIN users u ON u.id=r.user_id WHERE r.material_id=? AND r.status='approved' ORDER BY r.id DESC LIMIT 100").all(id)})
        if(method==='POST'){userRequired(user);const data=await body(req);if(!Number.isInteger(data.rating)||data.rating<1||data.rating>5||!text(data.body,10,2000))fail(422,'評価1〜5と10〜2000文字のレビューを入力してください。')
          db.prepare("INSERT INTO reviews(material_id,user_id,rating,body) VALUES(?,?,?,?) ON CONFLICT(material_id,user_id) DO UPDATE SET rating=excluded.rating,body=excluded.body,status='pending'").run(id,user.id,data.rating,data.body.trim());return send(201,{message:'レビューを保存しました。管理者の確認後に公開されます。'})}
      }
      if(method==='POST'&&path==='/api/diagnoses'){
        userRequired(user);const data=await body(req)
        if(!Array.isArray(data.owned)||data.owned.length>100||data.owned.some(x=>!text(x,1,80))||typeof data.hours!=='number'||typeof data.budget!=='number'||!Number.isInteger(data.budget))fail(422,'診断の入力を確認してください。')
        const input={hours:data.hours,budget:data.budget,priority:data.priority,owned:data.owned}
        let result;try{result=diagnose(input,listMaterials(db))}catch{fail(422,'診断の入力を確認してください。')}
        if(data.useAI===true){if(!limit(db,`ai:${user.id}`,5,3600))fail(429,'AI補足は1時間5回までです。');result.ai=await ai(input,result)}
        const id=db.prepare('INSERT INTO diagnoses(user_id,input,result) VALUES(?,?,?)').run(user.id,JSON.stringify(input),JSON.stringify(result)).lastInsertRowid
        return send(201,{id:Number(id),result})
      }
      if(method==='GET'&&path==='/api/diagnoses'){userRequired(user);return send(200,{diagnoses:db.prepare('SELECT id,input,result,created_at FROM diagnoses WHERE user_id=? ORDER BY id DESC LIMIT 50').all(user.id).map(r=>({...r,input:JSON.parse(r.input),result:JSON.parse(r.result)}))})}
      if(path==='/api/study-logs'){
        userRequired(user)
        if(method==='GET')return send(200,{logs:db.prepare('SELECT id,day,subject,minutes,note FROM study_logs WHERE user_id=? ORDER BY day DESC,id DESC LIMIT 100').all(user.id)})
        if(method==='POST'){const data=await body(req);if(!/^\d{4}-\d{2}-\d{2}$/.test(data.day)||!Number.isFinite(Date.parse(data.day))||new Date(data.day).toISOString().slice(0,10)!==data.day||!['行政法','民法','憲法','商法','基礎法学','基礎知識','記述式'].includes(data.subject)||!Number.isInteger(data.minutes)||data.minutes<1||data.minutes>1440||!text(data.note||'',0,500))fail(422,'日付・科目・学習時間を確認してください。');db.prepare('INSERT INTO study_logs(user_id,day,subject,minutes,note) VALUES(?,?,?,?,?)').run(user.id,data.day,data.subject,data.minutes,data.note||'');return send(201,{ok:true})}
      }
      const deletion=path.match(/^\/api\/(study-logs|diagnoses)\/(\d+)$/)
      if(method==='DELETE'&&deletion){userRequired(user);const table=deletion[1]==='study-logs'?'study_logs':'diagnoses';const r=db.prepare(`DELETE FROM ${table} WHERE id=? AND user_id=?`).run(Number(deletion[2]),user.id);if(!r.changes)fail(404,'記録が見つかりません。');return send(200,{ok:true})}
      const outbound=path.match(/^\/api\/out\/([a-z0-9-]+)$/)
      if(method==='GET'&&outbound){const row=db.prepare('SELECT data FROM materials WHERE id=? AND active=1').get(outbound[1]);if(!row)fail(404,'教材が見つかりません。');const m=JSON.parse(row.data);const target=m.affiliateUrl||m.url;if(!secureURL(target))fail(422,'リンクを確認してください。');if(m.affiliateUrl)db.prepare('INSERT INTO affiliate_clicks(material_id) VALUES(?)').run(m.id);res.writeHead(302,{Location:target,'Cache-Control':'no-store'});res.end();return}
      if(path.startsWith('/api/admin/')){
        adminRequired(user)
        if(method==='GET'&&path==='/api/admin/reviews')return send(200,{reviews:db.prepare('SELECT r.*,u.name,m.data FROM reviews r JOIN users u ON r.user_id=u.id JOIN materials m ON r.material_id=m.id ORDER BY r.id DESC LIMIT 100').all().map(r=>({...r,material:JSON.parse(r.data).name,data:undefined}))})
        const moderation=path.match(/^\/api\/admin\/reviews\/(\d+)$/)
        if(method==='PATCH'&&moderation){const data=await body(req);if(!['approved','rejected','pending'].includes(data.status))fail(422,'状態を確認してください。');const r=db.prepare('UPDATE reviews SET status=? WHERE id=?').run(data.status,Number(moderation[1]));if(!r.changes)fail(404,'レビューが見つかりません。');db.prepare('INSERT INTO audit_logs(user_id,action,target) VALUES(?,?,?)').run(user.id,`review:${data.status}`,moderation[1]);return send(200,{ok:true})}
        if(method==='GET'&&path==='/api/admin/materials')return send(200,{materials:db.prepare('SELECT data,active FROM materials ORDER BY id').all().map(r=>({...JSON.parse(r.data),active:Boolean(r.active)}))})
        if(method==='PUT'&&path==='/api/admin/materials'){const data=await body(req);const m=materialInput(data);db.prepare('INSERT INTO materials(id,data,active) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,active=excluded.active,updated_at=CURRENT_TIMESTAMP').run(m.id,JSON.stringify(m),data.active===false?0:1);db.prepare('INSERT INTO audit_logs(user_id,action,target) VALUES(?,?,?)').run(user.id,'material:save',m.id);return send(200,{material:m})}
        if(method==='GET'&&path==='/api/admin/stats')return send(200,{clicks:db.prepare('SELECT material_id,day,count(*) AS clicks FROM affiliate_clicks GROUP BY material_id,day ORDER BY day DESC LIMIT 100').all(),audit:db.prepare('SELECT action,target,created_at FROM audit_logs ORDER BY id DESC LIMIT 30').all()})
      }
      fail(404,'ページが見つかりません。')
    }catch(error){if(!res.headersSent)send(error.status||500,{message:error.status?error.message:'処理に失敗しました。時間をおいてお試しください。'});else res.end();if(!error.status)console.error('Request failed:',error.code||error.name)}
  })
  server.headersTimeout=15000;server.requestTimeout=30000
  return {server,db}
}
