import {DatabaseSync} from 'node:sqlite'
import {resolve,dirname} from 'node:path'
import {mkdirSync,existsSync} from 'node:fs'
const source=resolve(process.env.DATABASE_PATH||'data/gyosai.sqlite')
const target=resolve(process.argv[2]||`data/backups/gyosai-${Date.now()}.sqlite`)
if(!existsSync(source))throw new Error('バックアップ元のDBがありません。')
if(target===source||existsSync(target))throw new Error('新しい保存先を指定してください。既存ファイルは上書きしません。')
mkdirSync(dirname(target),{recursive:true})
const db=new DatabaseSync(source);db.prepare('VACUUM INTO ?').run(target);db.close()
console.log('バックアップを作成しました。')
