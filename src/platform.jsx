import {createContext,useContext,useEffect,useState} from 'react'
import {materials as fallback} from './materials.js'
import './platform.css'
export const displayTime=value=>new Date(value.replace(' ','T')+'Z').toLocaleString('ja-JP')

export async function api(path,method='GET',data){
  let response
  try{response=await fetch(`/api${path}`,{method,credentials:'same-origin',headers:{'Content-Type':'application/json','X-Gyosai-Request':'1'},body:data===undefined?undefined:JSON.stringify(data),signal:AbortSignal.timeout(25000)})}catch{throw new Error('保存サービスに接続できません。入力を残したまま、時間をおいて再試行してください。')}
  if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('保存サービスに接続できません。')
  const json=await response.json().catch(()=>{throw new Error('保存サービスから正しい応答がありません。')})
  if(!response.ok)throw new Error(json.message||'処理に失敗しました。')
  return json
}
const Context=createContext(null)
export const usePlatform=()=>useContext(Context)
export function PlatformProvider({children}){
  const [user,setUser]=useState(null),[catalog,setCatalog]=useState(fallback),[available,setAvailable]=useState(false),[loading,setLoading]=useState(true),[aiAvailable,setAiAvailable]=useState(false)
  async function refresh(){const [session,items]=await Promise.all([api('/session'),api('/materials')]);setUser(session.user);setAiAvailable(session.aiAvailable);setCatalog(items.materials);setAvailable(true)}
  useEffect(()=>{let live=true;Promise.all([api('/session'),api('/materials')]).then(([session,items])=>{if(live){setUser(session.user);setAiAvailable(session.aiAvailable);setCatalog(items.materials);setAvailable(true)}}).catch(()=>{}).finally(()=>{if(live)setLoading(false)});return()=>{live=false}},[])
  return <Context.Provider value={{user,setUser,catalog,available,loading,aiAvailable,refresh}}>{children}</Context.Provider>
}
