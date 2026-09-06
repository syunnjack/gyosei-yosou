# GYOSAI - 行政書士試験 AI予測分析

令和2〜7年度の行政書士本試験問題冊子をもとに、科目配分、抽出品質、論点横断性を可視化する学習支援サイトです。

## 開発

```bash
npm install
npm run dev
```

## データ分析

`C:\Users\syunn\Downloads` に `r2_mondai.pdf` 〜 `r7_mondai.pdf` を配置して実行します。

```bash
python -m pip install -r requirements.txt
npm run analyze
```

R2〜R6はPDF内の日本語文字マップ不整合があるため、構造補助解析として扱います。R7は全文抽出を利用します。予測スコアは学習優先度の目安で、実際の出題を保証しません。

## 模試の記録（記事投稿手順）

「模試の記録」タブは `src/mockExams.js` のデータから記事・推移グラフ・JSON-LD（Blog / FAQPage）を自動生成します。
模試を受けたら該当エントリを次のように書き換えて `main` に push するだけで公開されます。

```js
{ ...entry('lec-1','lec',1,'LEC 模試パック 第1回'),
  status:'done', date:'2026-09-13',
  scores:{ law5:104, lawMulti:16, written:24, general:32 },   // 素点。合計・合否判定は自動
  summary:'所感（2〜4文）',
  review:['次回までの復習項目1','復習項目2'],
  tags:['行政法','記述'] }
```

- 合格基準は総得点180 / 法令122 / 基礎知識24 で判定
- `#mock-exams` / `#mock-<id>` のURLで該当タブ・記事に直接遷移
