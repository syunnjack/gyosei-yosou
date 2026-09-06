// 令和8年度 行政書士試験（2026年11月8日）に向けた模試の記録。
// 受験後は該当エントリの status を 'done' にし、date / scores / summary / review を埋めるだけで
// 記事・グラフ・構造化データ（JSON-LD）がすべて自動生成される。

export const EXAM_DATE = '2026-11-08'
export const PASS_LINE = { total: 180, law: 122, general: 24 }
export const MAX_SCORE = { law5: 160, lawMulti: 24, written: 60, general: 56, total: 300 }

export const providers = [
  { id: 'lec', name: 'LEC', series: '模試パック（全7回）', color: '#d59b49' },
  { id: 'ito', name: '伊藤塾', series: '公開模試', color: '#69a69a' },
  { id: 'tac', name: 'TAC', series: '公開模試（全2回）', color: '#7b88aa' },
  { id: 'thg', name: '東京法経学院', series: '公開模試（全3回）', color: '#a87666' }
]

// scores: 法令択一(5肢) / 多肢選択 / 記述 / 基礎知識 の素点。合計は自動計算。
const entry = (id, provider, round, title) => ({
  id, provider, round, title, status: 'planned', date: '', scores: null, summary: '', review: [], tags: []
})

export const mockExams = [
  entry('lec-1', 'lec', 1, 'LEC 模試パック 第1回'),
  entry('lec-2', 'lec', 2, 'LEC 模試パック 第2回'),
  entry('lec-3', 'lec', 3, 'LEC 模試パック 第3回'),
  entry('lec-4', 'lec', 4, 'LEC 模試パック 第4回'),
  entry('lec-5', 'lec', 5, 'LEC 模試パック 第5回'),
  entry('lec-6', 'lec', 6, 'LEC 模試パック 第6回'),
  entry('lec-7', 'lec', 7, 'LEC 模試パック 第7回'),
  entry('ito-1', 'ito', 1, '伊藤塾 公開模試'),
  entry('tac-1', 'tac', 1, 'TAC 公開模試 第1回'),
  entry('tac-2', 'tac', 2, 'TAC 公開模試 第2回'),
  entry('thg-1', 'thg', 1, '東京法経学院 公開模試 第1回'),
  entry('thg-2', 'thg', 2, '東京法経学院 公開模試 第2回'),
  entry('thg-3', 'thg', 3, '東京法経学院 公開模試 第3回')
]

// 記入例（コピーして使う）:
// {
//   ...entry('lec-1','lec',1,'LEC 模試パック 第1回'),
//   status:'done', date:'2026-09-13',
//   scores:{ law5:104, lawMulti:16, written:24, general:32 },
//   summary:'行政法は安定。民法の物権で取りこぼし、記述は行政事件訴訟法の要件が書けず部分点止まり。',
//   review:['民法・物権変動（177条の第三者）を条文＋判例で復習','記述は「要件→効果」の型で毎日1問'],
//   tags:['行政法','民法','記述']
// }

export const totalOf = s => s ? s.law5 + s.lawMulti + s.written + s.general : null
export const lawOf = s => s ? s.law5 + s.lawMulti + s.written : null
export const isPass = s => !!s && totalOf(s) >= PASS_LINE.total && lawOf(s) >= PASS_LINE.law && s.general >= PASS_LINE.general

export const faq = [
  { q: '行政書士試験の合格基準は？', a: '法令等科目 122点以上（244点満点）、基礎知識科目 24点以上（56点満点）、かつ総得点 180点以上（300点満点）の3条件をすべて満たす必要があります。' },
  { q: '模試は何回受けるのが目安？', a: '本記録では LEC 7回・伊藤塾 1回・TAC 2回・東京法経学院 3回の計13回を受験予定です。複数校を受けることで出題の癖に偏らず、本番の初見問題への耐性を高めます。' },
  { q: '模試の点数が合格ラインに届かないときは？', a: '総得点よりも「基礎知識の足切り（24点）」と「記述の部分点」を先に確認します。科目別の失点を可視化し、次回までの復習項目を1〜3個に絞るのが本サイトの運用方針です。' },
  { q: '令和8年度 行政書士試験の日程は？', a: '2026年11月8日（日）実施予定です。正確な実施要領は一般財団法人 行政書士試験研究センターの公式発表をご確認ください。' }
]
