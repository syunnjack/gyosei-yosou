import test from 'node:test'
import assert from 'node:assert/strict'
import {diagnose,materials} from './materials.js'
const input={hours:8,budget:5000,priority:'questions',owned:[]}
test('prioritizes verified support without inventing price eligibility',()=>{
 const r=diagnose(input)
 assert.equal(r.candidates[0].id,'itojuku-public-2026')
 assert.equal(r.candidates[0].price,null)
 assert.equal(r.candidates.filter(m=>m.match).length,1)
})
test('excludes owned materials and does not mutate catalog',()=>{
 const before=JSON.stringify(materials)
 const r=diagnose({...input,owned:[materials[0].id]})
 assert.equal(r.candidates.length,2)
 assert.equal(r.excluded[0].reason,'受講・購入済み')
 assert.equal(JSON.stringify(materials),before)
})
test('zero budget and insufficient study time recommend no purchase',()=>{
 assert.equal(diagnose({...input,budget:0}).candidates.length,0)
 assert.equal(diagnose({...input,hours:5.5}).candidates.length,0)
 assert.equal(diagnose({...input,hours:6}).candidates.length,3)
})
test('all owned yields no candidates',()=>assert.equal(diagnose({...input,owned:materials.map(m=>m.id)}).candidates.length,0))
test('known over-budget products are excluded',()=>{
 const r=diagnose(input,[{...materials[0],price:5001},{...materials[1],price:5000}])
 assert.equal(r.candidates.length,1)
 assert.equal(r.excluded[0].reason,'予算を超える')
})
test('rejects invalid inputs',()=>{
 for(const change of [{hours:-1},{hours:169},{budget:-1},{budget:NaN},{priority:'unknown'}]) assert.throws(()=>diagnose({...input,...change}))
})
