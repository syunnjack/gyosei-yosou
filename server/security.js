import {randomBytes, scrypt, timingSafeEqual, createHash} from 'node:crypto'
import {promisify} from 'node:util'
const derive=promisify(scrypt)
export const digest=value=>createHash('sha256').update(value).digest('hex')
export async function hashPassword(password){const salt=randomBytes(16).toString('hex');const key=await derive(password,salt,64);return `${salt}:${key.toString('hex')}`}
export async function checkPassword(password,stored){const [salt,hex]=stored.split(':');const key=await derive(password,salt,64);const expected=Buffer.from(hex,'hex');return expected.length===key.length&&timingSafeEqual(key,expected)}
export function createSession(db,userId){const token=randomBytes(32).toString('hex');db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(digest(token),userId,Date.now()+7*86400000);return token}
export function sessionToken(req){return (req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('gyosai_session='))?.slice(15)||''}
export function currentUser(db,req){return db.prepare('SELECT u.id,u.name,u.email,u.role FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.token=? AND s.expires>?').get(digest(sessionToken(req)),Date.now())||null}
export function limit(db,key,max,seconds){const now=Date.now();db.prepare('DELETE FROM rate_limits WHERE expires<?').run(now);db.prepare('INSERT INTO rate_limits VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').run(key,now+seconds*1000);return db.prepare('SELECT count FROM rate_limits WHERE key=?').get(key).count<=max}
