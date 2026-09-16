import catalog from './material-catalog.json' with {type:'json'}
export const materials = catalog

export const featureLabels = {practice:'本番形式の演習', lecture:'解説講義', correction:'記述の添削', questions:'質問会'}

export function diagnose(input, catalog=materials) {
  const hours=Number(input.hours), budget=Number(input.budget)
  if (input.hours==='' || input.budget==='' || input.hours==null || input.budget==null || !Number.isFinite(hours) || hours<0 || hours>168 || !Number.isFinite(budget) || !Number.isInteger(budget) || budget<0 || budget>1000000 || !Object.hasOwn(featureLabels,input.priority)) {
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
