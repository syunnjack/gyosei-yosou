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
