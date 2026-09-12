// スタディングの学習レポート（AI実力スコア）から書き写した値。
// 記述式（60点）は対象外なので、満点は300点ではなく240点で扱う。
export const scoreMeta = {
  capturedOn: '2026-09-12',
  source: 'スタディング 学習レポート（AI実力スコア）',
  total: 94.3,
  totalMax: 240,
  target: 160
}

// percentile は「上位から何％の位置か」。小さいほど上位。
export const scoreSubjects = [
  {name:'基礎法学',score:2.6,max:8,average:2.8,percentile:63.0,color:'#8f7da8'},
  {name:'憲法',score:12.1,max:28,average:13.9,percentile:70.9,color:'#7b88aa'},
  {name:'民法',score:13.7,max:36,average:15.3,percentile:53.0,color:'#69a69a'},
  {name:'行政法',score:38,max:92,average:40,percentile:55.1,color:'#d59b49'},
  {name:'商法',score:6.5,max:20,average:6.8,percentile:45.3,color:'#a87666'},
  {name:'基礎知識',score:21.5,max:56,average:23.2,percentile:56.5,color:'#748178'}
]

export const scoreAverageTotal = scoreSubjects.reduce((n,s)=>n+s.average,0)
export const scoreGap = scoreMeta.target - scoreMeta.total

// 目標までの不足分を、各科目の伸びしろ（満点−現在スコア）の比で割り振る。
// 配点の大きい行政法・基礎知識ほど厚く配分される。
const headroom = scoreSubjects.reduce((n,s)=>n+(s.max-s.score),0)
export const scorePlan = scoreSubjects.map(s=>{
  const need = scoreGap*(s.max-s.score)/headroom
  return {...s, need, goal: s.score+need}
})
