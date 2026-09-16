import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createApp} from './app.js'
import {openDatabase,listMaterials} from './db.js'
import {explainDiagnosis} from './ai.js'
import {diagnose} from '../src/materials.js'

async function setup(t){
 const db=openDatabase(':memory:');const {server}=createApp({db,origins:['http://test.local'],ai:async()=>({text:'誤答を復習しましょう。',status:'generated'})})
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`
 t.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));db.close()})
 async function request(path,{method='GET',data,cookie='',origin='http://test.local',header=true}={}){const response=await fetch(base+'/api'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...(header?{'X-Gyosai-Request':'1'}:{}),Cookie:cookie},body:data===undefined?undefined:JSON.stringify(data),redirect:'manual'});const content=await response.text();return {status:response.status,data:content?JSON.parse(content):null,cookie:response.headers.get('set-cookie')?.split(';')[0],location:response.headers.get('location')}}
 async function register(email='test@example.test'){const r=await request('/register',{method:'POST',data:{name:'テスト利用者',email,password:'test-only-password-123'}});assert.equal(r.status,200);return r.cookie}
 return {db,request,register}
}
const input={hours:8,budget:5000,priority:'questions',owned:[]}
test('registration uses cookie sessions; role and hashes stay protected',async t=>{
 const {db,request,register}=await setup(t);const cookie=await register()
 const session=await request('/session',{cookie});assert.equal(session.data.user.role,'user');assert.equal(session.data.user.password,undefined)
 assert.notEqual(db.prepare('SELECT password FROM users').get().password,'test-only-password-123')
 assert.equal((await request('/admin/reviews',{cookie})).status,403)
 const login=await request('/login',{method:'POST',data:{email:'test@example.test',password:'test-only-password-123'}});assert.equal(login.status,200)
 await request('/logout',{method:'POST',cookie:login.cookie,data:{}});assert.equal((await request('/session',{cookie:login.cookie})).data.user,null)
})
test('cross-origin and missing custom-header mutations are rejected',async t=>{
 const {request}=await setup(t)
 assert.equal((await request('/register',{method:'POST',origin:'https://evil.test',data:{}})).status,403)
 assert.equal((await request('/register',{method:'POST',header:false,data:{}})).status,403)
})
test('review requires login and approval; editing resets moderation',async t=>{
 const {db,request,register}=await setup(t);const path='/materials/lec-final-2026/reviews',data={rating:4,body:'問題を解いた後の復習に使いました。'}
 assert.equal((await request(path,{method:'POST',data})).status,401)
 const cookie=await register();assert.equal((await request(path,{method:'POST',cookie,data})).status,201)
 assert.equal((await request(path)).data.reviews.length,0)
 db.prepare("UPDATE users SET role='admin'").run()
 const id=db.prepare('SELECT id FROM reviews').get().id
 assert.equal((await request(`/admin/reviews/${id}`,{method:'PATCH',cookie,data:{status:'approved'}})).status,200)
 assert.equal((await request(path)).data.reviews.length,1)
 await request(path,{method:'POST',cookie,data:{...data,body:'使い直して評価を更新しました。'}})
 assert.equal((await request(path)).data.reviews.length,0)
 assert.equal(db.prepare('SELECT count(*) AS n FROM reviews').get().n,1)
})
test('private diagnosis history is isolated; zero-budget and owned filters persist',async t=>{
 const {request,register}=await setup(t),a=await register(),b=await register('other@example.test')
 const r=await request('/diagnoses',{method:'POST',cookie:a,data:{...input,budget:0}});assert.equal(r.status,201);assert.equal(r.data.result.candidates.length,0)
 assert.equal((await request('/diagnoses',{cookie:b})).data.diagnoses.length,0)
 assert.equal((await request(`/diagnoses/${r.data.id}`,{method:'DELETE',cookie:b})).status,404)
 assert.equal((await request('/diagnoses',{cookie:a})).data.diagnoses.length,1)
 const owned=await request('/diagnoses',{method:'POST',cookie:a,data:{...input,owned:['itojuku-public-2026'],useAI:true}});assert.equal(owned.data.result.candidates.some(m=>m.id==='itojuku-public-2026'),false);assert.equal(owned.data.result.ai.status,'generated')
})
test('study logs validate date/minutes and keep owners separate',async t=>{
 const {request,register}=await setup(t),a=await register(),b=await register('other@example.test')
 for(const bad of [{day:'2026-02-30',subject:'民法',minutes:30},{day:'2026-09-17',subject:'民法',minutes:-1}])assert.equal((await request('/study-logs',{method:'POST',cookie:a,data:bad})).status,422)
 assert.equal((await request('/study-logs',{method:'POST',cookie:a,data:{day:'2026-09-17',subject:'民法',minutes:30,note:'相続を復習'}})).status,201)
 const rows=(await request('/study-logs',{cookie:a})).data.logs;assert.equal(rows.length,1)
 assert.equal((await request('/study-logs',{cookie:b})).data.logs.length,0)
 assert.equal((await request(`/study-logs/${rows[0].id}`,{method:'DELETE',cookie:b})).status,404)
 assert.equal((await request(`/study-logs/${rows[0].id}`,{method:'DELETE',cookie:a})).status,200)
})
test('admin material edits feed catalog and budget diagnosis; dangerous URLs rejected',async t=>{
 const {db,request,register}=await setup(t);const cookie=await register();db.prepare("UPDATE users SET role='admin'").run()
 const material=listMaterials(db)[0]
 assert.equal((await request('/admin/materials',{method:'PUT',cookie,data:{...material,url:'javascript:alert(1)'}})).status,422)
 assert.equal((await request('/admin/materials',{method:'PUT',cookie,data:{...material,price:9999,active:true}})).status,200)
 const r=await request('/diagnoses',{method:'POST',cookie,data:input});assert.equal(r.data.result.excluded.find(m=>m.id===material.id).reason,'予算を超える')
 await request('/admin/materials',{method:'PUT',cookie,data:{...material,active:false}})
 assert.equal((await request('/materials')).data.materials.some(m=>m.id===material.id),false)
})
test('seed is idempotent and edited catalog survives restart',()=>{
 const dir=mkdtempSync(join(tmpdir(),'gyosai-test-')),file=join(dir,'test.sqlite')
 try{let db=openDatabase(file);const m={...listMaterials(db)[0],price:1234};db.prepare('UPDATE materials SET data=? WHERE id=?').run(JSON.stringify(m),m.id);db.close();db=openDatabase(file);assert.equal(listMaterials(db).length,3);assert.equal(listMaterials(db).find(x=>x.id===m.id).price,1234);db.close()}finally{rmSync(dir,{recursive:true,force:true})}
})
test('AI failure preserves deterministic result and sends no account identifiers',async()=>{
 const priorKey=process.env.OPENAI_API_KEY,priorModel=process.env.OPENAI_MODEL
 process.env.OPENAI_API_KEY='test-only';process.env.OPENAI_MODEL='test-model'
 try{
 const result=diagnose(input)
 const failure=await explainDiagnosis(input,result,async()=>{throw new Error('offline')});assert.equal(failure.status,'unavailable')
 const success=await explainDiagnosis({...input,email:'private@example.test'},result,async(url,options)=>{const payload=JSON.parse(options.body);assert.equal(payload.store,false);assert.equal(payload.input.includes('private@example.test'),false);return {ok:true,json:async()=>({status:'completed',output:[{content:[{type:'output_text',text:'復習しましょう。'}]}]})}});assert.equal(success.text,'復習しましょう。')
 }finally{if(priorKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=priorKey;if(priorModel===undefined)delete process.env.OPENAI_MODEL;else process.env.OPENAI_MODEL=priorModel}
})
