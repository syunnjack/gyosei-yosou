import {openDatabase} from './db.js'
const email=process.argv[2]?.trim().toLowerCase()
if(!email)throw new Error('Usage: npm run admin -- registered-email')
const db=openDatabase(process.env.DATABASE_PATH||'data/gyosai.sqlite')
const result=db.prepare("UPDATE users SET role='admin' WHERE email=?").run(email)
db.close()
if(!result.changes)throw new Error('先に画面からアカウント登録してください。')
console.log('管理者権限を設定しました。')
