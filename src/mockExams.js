// 令和8年度 行政書士試験（2026年11月8日）に向けた模試の記録（4回目の受験）。
// 受験後は該当エントリの status を 'done' にし、date / scores / summary / review を埋めるだけで
// 記事・グラフ・構造化データ（JSON-LD）がすべて自動生成される。

export const EXAM_DATE = '2026-11-08'
export const ATTEMPT = 4
export const PASS_LINE = { total: 180, law: 122, general: 24 }
export const MAX_SCORE = { law5: 160, lawMulti: 24, written: 60, general: 56, total: 300 }

export const providers = [
  { id: 'lec', name: 'LEC', series: '模試パック（全7回）', color: '#d59b49' },
  { id: 'ito', name: '伊藤塾', series: '公開模擬試験', color: '#69a69a' },
  { id: 'tac', name: 'TAC', series: '全国公開模試（全2回）', color: '#7b88aa' },
  { id: 'thg', name: '東京法経学院', series: '最強の公開模試（全3回）', color: '#a87666' }
]

// すべて自宅受験。date は答案提出締切日（または教材発送日）。dateNote に日付の根拠を残す。
// scores: 法令択一(5肢) / 多肢選択 / 記述 / 基礎知識 の素点。合計は自動計算。
const entry = (id, provider, round, title, date, dateNote) => ({
  id, provider, round, title, status: 'planned', date, dateNote, scores: null, summary: '', review: [], tags: []
})

export const mockExams = [
  entry('lec-1', 'lec', 1, 'LEC 到達度確認模試 第1回', '2026-07-17', '2025年日程からの推定（要確認）'),
  entry('lec-2', 'lec', 2, 'LEC 到達度確認模試 第2回', '2026-08-14', '2025年日程からの推定（要確認）'),
  entry('lec-3', 'lec', 3, 'LEC 全日本行政書士公開模試 第1回', '2026-08-28', '会場実施 8/28〜30・自宅答案締切は例年会場初日'),
  entry('lec-4', 'lec', 4, 'LEC 全日本行政書士公開模試 第2回', '2026-09-11', '会場実施 9/11〜13'),
  { ...entry('lec-5', 'lec', 5, 'LEC ファイナル模試', '2026-09-25', '会場実施 9/25〜27・自宅答案締切 10/10 必着'), status: 'progress' },
  entry('lec-6', 'lec', 6, 'LEC 全日本行政書士公開模試 第3回', '2026-10-09', '会場申込締切10/8からの推定（要確認）'),
  entry('lec-7', 'lec', 7, 'LEC 厳選！直前ヤマ当て模試', '2026-10-16', '会場申込締切9/25からの推定（要確認）'),
  entry('ito-1', 'ito', 1, '伊藤塾 公開模擬試験 第1回', '2026-09-15', '答案提出締切 9/15（消印有効）・成績 9/29'),
  entry('tac-1', 'tac', 1, 'TAC 全国公開模試 第1回', '2026-09-10', '自宅受験 9/10 発送・会場実施 9/18〜20'),
  entry('tac-2', 'tac', 2, 'TAC 全国公開模試 第2回', '2026-10-02', '自宅受験 10/2 発送・会場実施 10/9〜11'),
  entry('thg-1', 'thg', 1, '東京法経学院 最強の公開模試 I', '2026-09-15', '問題発送 9/15'),
  entry('thg-2', 'thg', 2, '東京法経学院 最強の公開模試 II', '2026-09-24', '問題発送 9/24'),
  entry('thg-3', 'thg', 3, '東京法経学院 最強の公開模試 III', '2026-09-29', '問題発送 9/29')
]

// 記入例（コピーして使う）:
// { ...entry('lec-5','lec',5,'LEC ファイナル模試','2026-09-25',''),
//   status:'done',
//   scores:{ law5:104, lawMulti:16, written:24, general:32 },
//   summary:'行政法は安定。民法の物権で取りこぼし、記述は行政事件訴訟法の要件が書けず部分点止まり。',
//   review:['民法・物権変動（177条の第三者）を条文＋判例で復習','記述は「要件→効果」の型で毎日1問'],
//   tags:['行政法','民法','記述'] }

// 過去の本試験・模試（積み上げログの成績表記事から抽出）。kind: 'exam' 本試験 / 'mock' 模試 / 'self' 自己採点
// 内訳が成績表に無いものは null（合計のみ）。
export const pastResults = [
  { id: 'first-exam', kind: 'exam', date: '', title: '1回目 本試験（200字論述の時代）', scores: null, total: null, note: '一般知識の足切りで不合格（採点対象外）。年度・点数の記録なし。' },
  { id: 'r5-exam', kind: 'exam', date: '2023-11-12', title: '令和5年度 本試験（2回目）', scores: { law5: 84, lawMulti: 8, written: 16, general: 44 }, note: '足切りは通過。152点で不合格（合格点まで28点）。' },
  { id: 'thg-2024-1', kind: 'mock', date: '2024-09-19', title: '東京法経学院 2024 第1回（自宅）', scores: null, total: null, note: '法令択一 29/40問。基礎知識は文章理解未読で足切り、記述は半分未満。' },
  { id: 'thg-2024-2', kind: 'mock', date: '2024-09-27', title: '東京法経学院 2024 第2回（自宅）', scores: null, total: 160, note: '偏差値49・56人中29位（C判定）。択一 136/216・20位、多肢＋記述 24点・37位。行政法記述は題意を読み違えて0点。' },
  { id: 'ohara-2024-2', kind: 'mock', date: '2024-10-26', title: '資格の大原 2024 第2回公開模試（会場・浜松）', scores: { law5: 84, lawMulti: 10, written: 20, general: 16 }, note: '偏差値44・282人中195位。平均160点に対し−30。基礎知識16点で足切り水準。' },
  { id: 'r6-exam', kind: 'exam', date: '2024-11-10', title: '令和6年度 本試験（3回目）', scores: { law5: 104, lawMulti: 8, written: 8, general: 48 }, note: '168点で不合格（合格点まで12点＝択一3問分）。多肢8点は2年連続、記述は16→8点に減。' },
  { id: 'r7-self', kind: 'self', date: '2026-08-25', title: '令和7年度 本試験問題を自己採点（受験しなかった年）', scores: null, total: 150, note: '1年のブランク後に初見で150点。合格点まで30点。' }
]

// スタディング（通信講座）の学習状況。AI実力スコアは受講画面の値を日付付きで追記する。
// AI実力スコアは記述式（60点）を除く240点満点・目標点160。subjects: 科目別スコア / 満点 / 受講者平均 / 上位から何%か。
export const studying = {
  course: 'スタディング 行政書士講座',
  max: 240,
  target: 160,
  history: [
    {
      date: '2026-09-06', score: 87.9,
      subjects: [
        { name: '基礎法学', score: 2, max: 8, avg: 2.8, pct: 89.3 },
        { name: '憲法', score: 11.2, max: 28, avg: 13.9, pct: 75.9 },
        { name: '民法', score: 12.9, max: 36, avg: 15.2, pct: 55.7 },
        { name: '行政法', score: 34.8, max: 92, avg: 39.9, pct: 62.7 },
        { name: '商法', score: 6.4, max: 20, avg: 6.8, pct: 45.0 },
        { name: '基礎知識', score: 20.5, max: 56, avg: 23.1, pct: 60.2 }
      ]
    }
  ]
}

export const totalOf = s => s ? s.law5 + s.lawMulti + s.written + s.general : null
export const lawOf = s => s ? s.law5 + s.lawMulti + s.written : null
export const isPass = s => !!s && totalOf(s) >= PASS_LINE.total && lawOf(s) >= PASS_LINE.law && s.general >= PASS_LINE.general
export const resultTotal = r => r.scores ? totalOf(r.scores) : r.total

export const faq = [
  { q: '行政書士試験の合格基準は？', a: '法令等科目 122点以上（244点満点）、基礎知識科目 24点以上（56点満点）、かつ総得点 180点以上（300点満点）の3条件をすべて満たす必要があります。' },
  { q: '模試は何回受けるのが目安？', a: '本記録では LEC 7回・伊藤塾 1回・TAC 2回・東京法経学院 3回の計13回をすべて自宅受験で予定しています。複数校を受けることで出題の癖に偏らず、本番の初見問題への耐性を高めます。' },
  { q: '模試の点数が合格ラインに届かないときは？', a: '総得点よりも「基礎知識の足切り（24点）」と「多肢選択・記述の部分点」を先に確認します。過去2回の本試験では、直前期に択一と基礎知識は伸びた一方、多肢選択と記述は下がっていました。' },
  { q: '令和8年度 行政書士試験の日程は？', a: '2026年11月8日（日）実施予定です。正確な実施要領は一般財団法人 行政書士試験研究センターの公式発表をご確認ください。' }
]
