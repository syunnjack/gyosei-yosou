// Official sources checked on 2026-09-16. Unknown values stay null.
export const materials = [
  {id:'lec-final-2026', company:'LEC', name:'2026年 ファイナル模試', type:'模試', year:2026, price:null, features:['practice','lecture'], summary:'本番前の総合演習に。成績処理と解説講義が付属します。', caution:'受験形式・空席・申込期限を公式ページで確認してください。', url:'https://online.lec-jp.com/disp/CSfLastPackGoodsPage_003.jsp?GOODS_NO=100268626', source:'https://www.lec-jp.com/gyousei/moshi/'},
  {id:'tac-public-2026', company:'TAC', name:'2026年 全国公開模試', type:'模試', year:2026, price:null, features:['practice','correction'], summary:'個人別成績表と記述添削済み答案で振り返る公開模試。会場・自宅受験の案内があります。', caution:'成績表・添削答案の提供には答案提出条件があります。既存コースに含まれる場合は重複購入に注意してください。', url:'https://www.tac-school.co.jp/kouza_gyosei/gyosei_moshi.html', source:'https://www.tac-school.co.jp/kouza_gyosei/gyosei_moshi.html'},
  {id:'itojuku-public-2026', company:'伊藤塾', name:'2026年 公開模擬試験（全2回）', type:'模試', year:2026, price:null, features:['practice','lecture','correction','questions'], summary:'解説講義・添削答案・オンライン質問会で復習できる全2回の模試。', caution:'第1回の答案提出期限は9/15。第2回は10/13（消印有効）。会場受験は別途申込・有料オプションで、申込期限と定員があります。', url:'https://www.itojuku.co.jp/shiken/gyosei/kouza/26D11001.html', source:'https://www.itojuku.co.jp/shiken/gyosei/kouza/26D11001.html'}
].map(m=>({...m, checkedOn:'2026-09-16'}))

export const featureLabels = {practice:'本番形式の演習', lecture:'解説講義', correction:'記述の添削', questions:'質問会'}

export function diagnose(input, catalog=materials) {
  const hours=Number(input.hours), budget=Number(input.budget)
  if (!Number.isFinite(hours) || hours<0 || hours>168 || !Number.isFinite(budget) || budget<0 || budget>1000000 || !Object.hasOwn(featureLabels,input.priority)) {
    throw new Error('時間・予算・重視する項目を確認してください。')
  }
  const owned=Array.isArray(input.owned)?input.owned:[]
  const excluded=[]
  const candidates=catalog.filter(m=>{
    const reason=owned.includes(m.id)?'受講・購入済み':budget===0?'追加購入の予算なし':m.price!==null&&m.price>budget?'予算を超える':null
    if(reason) excluded.push({...m,reason})
    return !reason
  }).map(m=>({...m,match:m.features.includes(input.priority),reason:m.features.includes(input.priority)?`${featureLabels[input.priority]}を公式情報で確認できるため。`:'重視する支援の有無は公式ページで確認が必要です。'}))
    .sort((a,b)=>Number(b.match)-Number(a.match)||a.id.localeCompare(b.id))
  const limited=hours<6
  return {candidates:limited?[]:candidates, excluded, limited, budget,
    advice:budget===0?'追加購入せず、手元の教材の誤答を復習しましょう。':limited?'まず手元の教材を復習しましょう。週6時間未満の場合は、新しい模試より復習時間の確保を優先するルールです。':'模試を1回解いた後、誤答の復習時間を確保しましょう。まず候補を1つに絞って日程と料金を確認してください。'}
}
