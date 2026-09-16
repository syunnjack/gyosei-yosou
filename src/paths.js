// 置き場所を選ばないビルド（base:'./'）なので、ページごとの深さは
// HTML側が window.__ROOT__ で教える。渡っていなければ同じ階層とみなす。
export const ROOT = (typeof window !== 'undefined' && window.__ROOT__) || './'
export const to = path => `${ROOT}${path}`
