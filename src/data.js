export const years = [
  {year:'R2',pages:50,questions:60,quality:42,label:'補助解析',note:'文字マップ不整合'},
  {year:'R3',pages:50,questions:60,quality:45,label:'補助解析',note:'文字マップ不整合'},
  {year:'R4',pages:47,questions:60,quality:44,label:'補助解析',note:'文字マップ不整合'},
  {year:'R5',pages:46,questions:60,quality:46,label:'補助解析',note:'文字マップ不整合'},
  {year:'R6',pages:46,questions:60,quality:43,label:'補助解析',note:'文字マップ不整合'},
  {year:'R7',pages:46,questions:60,quality:96,label:'全文解析',note:'33,359文字抽出'}
]

export const subjects = [
  {name:'行政法',count:19,color:'#d59b49',trend:[18,19,19,19,19,19]},
  {name:'民法',count:9,color:'#69a69a',trend:[9,9,9,9,9,9]},
  {name:'憲法',count:5,color:'#7b88aa',trend:[5,5,5,5,5,5]},
  {name:'商法・会社法',count:5,color:'#a87666',trend:[5,5,5,5,5,5]},
  {name:'基礎法学',count:2,color:'#8f7da8',trend:[2,2,2,2,2,2]},
  {name:'基礎知識',count:14,color:'#748178',trend:[14,14,14,14,14,14]}
]

export const predictions = [
  {rank:1,subject:'行政法',topic:'行政手続法 × 不利益処分',score:92,reason:'中核科目・条文横断性',signals:['聴聞と弁明','理由提示','申請に対する処分'],weight:'最優先'},
  {rank:2,subject:'行政法',topic:'行政事件訴訟法 × 原告適格',score:89,reason:'判例知識と訴訟類型の複合',signals:['処分性','訴えの利益','義務付け訴訟'],weight:'最優先'},
  {rank:3,subject:'民法',topic:'契約解除・危険負担',score:86,reason:'改正民法の横断整理が必要',signals:['催告解除','帰責事由','原状回復'],weight:'重点'},
  {rank:4,subject:'行政法',topic:'国家賠償法',score:82,reason:'判例比較に向く安定論点',signals:['公権力の行使','営造物責任','求償'],weight:'重点'},
  {rank:5,subject:'憲法',topic:'表現の自由 × 審査基準',score:78,reason:'人権判例の比較問題に適合',signals:['事前抑制','明確性','公共の福祉'],weight:'警戒'},
  {rank:6,subject:'民法',topic:'相続・遺留分',score:75,reason:'制度改正後の定着確認',signals:['遺産分割','特別受益','遺留分侵害額'],weight:'警戒'}
]

export const forecastQuestions = [
  {subject:'行政法',level:'標準',q:'行政庁が申請に対する拒否処分をする場合の理由提示に関する次の記述のうち、行政手続法および判例に照らし、最も妥当なものはどれか。',answer:'処分時に、根拠条項だけでなく、適用関係が分かる程度の具体的理由を示す必要がある。',why:'理由提示・申請手続・処分性を横断する高頻度構造。'},
  {subject:'民法',level:'やや難',q:'債務不履行による契約解除と損害賠償に関する次の記述のうち、民法の規定に照らし、正しいものはどれか。',answer:'解除には原則として債務者の帰責事由を要しないが、損害賠償では帰責事由が問題となる。',why:'改正後に混同しやすい要件差を問う設計。'},
  {subject:'憲法',level:'標準',q:'表現行為に対する事前規制について、最高裁判所の判例の趣旨に照らし、妥当でないものはどれか。',answer:'事前規制は常に絶対的に禁止される、との記述は妥当でない。',why:'判例の原則と例外を識別する典型形式。'}
]
