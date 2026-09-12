// スタディングの学習レポート（AI実力スコア）から書き写した値。
// 記述式（60点）は対象外なので、満点は300点ではなく240点で扱う。
//
// 更新するときは scoreSnapshots の末尾に新しい日付を1件足すだけでよい。
// 現在値・前回比・推移は、すべてこの配列から計算している。

const subjectMeta = [
  {name:'基礎法学',max:8,color:'#8f7da8'},
  {name:'憲法',max:28,color:'#7b88aa'},
  {name:'民法',max:36,color:'#69a69a'},
  {name:'行政法',max:92,color:'#d59b49'},
  {name:'商法',max:20,color:'#a87666'},
  {name:'基礎知識',max:56,color:'#748178'}
]

// rows の並びは [あなたのスコア, 受講者平均, 上位から何％の位置か]。
// percentile は小さいほど上位。total は画面に出ている総合スコアをそのまま入れる
// （科目を足し上げた値とは、丸めの分だけずれることがあるため）。
export const scoreSnapshots = [
  {date:'2026-09-10', total:91.7, rows:{
    '基礎法学':[2.4,2.8,73.1], '憲法':[11.7,13.9,73.3], '民法':[13.4,15.3,53.9],
    '行政法':[37.2,39.9,56.7], '商法':[6.4,6.8,45.3], '基礎知識':[20.5,23.1,60.4]
  }},
  {date:'2026-09-12', total:94.3, rows:{
    '基礎法学':[2.6,2.8,63.0], '憲法':[12.1,13.9,70.9], '民法':[13.7,15.3,53.0],
    '行政法':[38,40,55.1], '商法':[6.5,6.8,45.3], '基礎知識':[21.5,23.2,56.5]
  }}
]

const latest = scoreSnapshots[scoreSnapshots.length-1]
const previous = scoreSnapshots[scoreSnapshots.length-2]
const toSubjects = snap => snap && subjectMeta.map(m=>{
  const [score,average,percentile] = snap.rows[m.name]
  return {...m, score, average, percentile}
})

export const scoreMeta = {
  capturedOn: latest.date,
  source: 'スタディング 学習レポート（AI実力スコア）',
  total: latest.total,
  totalMax: 240,
  target: 160
}

export const scoreSubjects = toSubjects(latest)
// 前回の記録がまだ無いときは undefined。推移まわりの表示はその場合は出さない。
export const scorePrevSubjects = toSubjects(previous)
export const scorePrevSnapshot = previous

export const scoreAverageTotal = scoreSubjects.reduce((n,s)=>n+s.average,0)
export const scoreGap = scoreMeta.target - scoreMeta.total

// 目標までの不足分を、各科目の伸びしろ（満点−現在スコア）の比で割り振る。
// 配点の大きい行政法・基礎知識ほど厚く配分される。
const headroom = scoreSubjects.reduce((n,s)=>n+(s.max-s.score),0)
export const scorePlan = scoreSubjects.map(s=>{
  const need = scoreGap*(s.max-s.score)/headroom
  return {...s, need, goal: s.score+need}
})
