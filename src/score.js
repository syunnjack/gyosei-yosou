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
  target: 180,
  // 記述式を計算に入れない設計にしたので、目標は240点満点で180点。
  // スタディングの画面に出ている目標160点は、記述式で20点取る前提の値。
  targetNote: '記述式を計算に入れず、択一・多肢・基礎知識だけで180点を取る設計'
}

export const scoreSubjects = toSubjects(latest)
// 前回の記録がまだ無いときは undefined。推移まわりの表示はその場合は出さない。
export const scorePrevSubjects = toSubjects(previous)
export const scorePrevSnapshot = previous

export const scoreAverageTotal = scoreSubjects.reduce((n,s)=>n+s.average,0)
// 実際に受けた模試と本試験の得点。AI実力スコアと同じ「記述式を除く240点満点」に
// そろえるため、法令択一＋多肢選択＋基礎知識だけを足している（written は参考）。
// 模試の実施月までは手元の成績表から特定できないので、年と回だけを持つ。
export const actualExams = [
  {label:'2023 LEC模試②', kind:'模試', choice:76, multi:2, general:16, written:0, total300:94, note:'自己採点'},
  {label:'令和5年度 本試験', kind:'本試験', choice:84, multi:8, general:44, written:16, total300:152},
  {label:'2024 大原模試①', kind:'模試', choice:92, multi:22, general:36, written:10, total300:160},
  {label:'2024 大原模試②', kind:'模試', choice:84, multi:10, general:16, written:20, total300:130},
  {label:'令和6年度 本試験', kind:'本試験', choice:104, multi:8, general:48, written:8, total300:168}
].map(e => ({...e, score240: e.choice + e.multi + e.general}))

// 直近の本試験を「いまの実力」とみなす。模試は回ごとに難易度と母集団が動くため。
export const latestActual = [...actualExams].reverse().find(e => e.kind === '本試験')
export const actualGap = scoreMeta.target - latestActual.score240
// AI実力スコアと実測のひらき。スタディングのスコアは繰り返し学習でも上がる指標なので、
// 「できるか」だけを見る実測とは一致しない。
export const aiDelta = latestActual.score240 - scoreMeta.total
