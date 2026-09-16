import {createApp} from './app.js'
if(process.env.NODE_ENV==='production'&&(!process.env.APP_ORIGIN?.startsWith('https://')||!process.env.DATABASE_PATH))throw new Error('本番ではHTTPSのAPP_ORIGINと永続ディスクのDATABASE_PATHを設定してください。')
const {server,db}=createApp()
server.listen(Number(process.env.PORT||8787),process.env.HOST||'127.0.0.1',()=>console.log(`GYOSAI server ready on port ${process.env.PORT||8787}`))
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>{db.close();process.exit(0)}))
