"""gyosei-yosou.jp に 2026年11月の更新を反映する。

- 投稿3本を slug で作成/更新（LEC模試3回の個人成績表・令和8年度採点結果122点・令和9年度の展望）
- 固定ページ /mock-exams/ /results/ / の古い行・文を、いまの WordPress の本文に対して差し替える

既定はドライラン（何が当たるかを表示するだけ）。書き込むときは --apply を付ける。
資格情報は環境変数 WPU / WPP（WordPress 管理者のユーザー名・パスワード）で渡す。ファイルには保存しない。

    $env:WPU='...'; $env:WPP='...'; python wordpress/tools/publish_2026_results.py
    python wordpress/tools/publish_2026_results.py --apply
"""
import os, re, sys, json
import requests

BASE = 'https://gyosei-yosou.jp'
API = BASE + '/wp-json/wp/v2'
HERE = os.path.dirname(os.path.abspath(__file__))
CONTENT = os.path.join(HERE, '..', 'content', '2026-11')
APPLY = '--apply' in sys.argv
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36'


def login():
    s = requests.Session()
    s.headers['User-Agent'] = UA
    s.get(BASE + '/wp-login.php', timeout=30)
    r = s.post(BASE + '/wp-login.php', data={
        'log': os.environ['WPU'], 'pwd': os.environ['WPP'], 'wp-submit': 'Log In',
        'redirect_to': BASE + '/wp-admin/', 'testcookie': '1'}, timeout=30)
    if 'wp-admin' not in r.url:
        sys.exit(f'LOGIN FAILED {r.status_code} {r.url}')
    html = s.get(BASE + '/wp-admin/', timeout=30).text
    m = re.search(r'wpApiSettings\s*=\s*(\{.*?\});', html)
    if not m:
        sys.exit('REST nonce が取れない')
    s.headers['X-WP-Nonce'] = json.loads(m.group(1))['nonce']
    return s


s = None


def api(method, path, **kw):
    r = s.request(method, API + path, timeout=120, **kw)
    if r.status_code >= 400:
        sys.exit(f'ERR {method} {path} {r.status_code} {r.text[:300]}')
    return r.json()


# ---------------------------------------------------------------- posts
CAT = {'mock': 5, 'strategy': 7, 'analysis': 9, 'study': 24}
TAG = {'LEC': 16, '模試': 36, '成績表': 45, '行政書士': 25, '法令等': 35, '足切り': 31,
       '学習計画': 32, '記述式': 10, '行政法': 12, '基礎知識': 14, '文章理解': 39, '設問別正解率': 47,
       '解き直し': 42, '過去問': 41, '通信講座': 26, 'スタディング': 21, '予算': 52}

POSTS = [
    dict(slug='gyosei-shoshi-2026-exam-result-122', file='exam-122.html', date='2026-11-09T19:00:00',
         title='令和8年度 行政書士試験の採点結果｜300点中122点、法令等は86点で足切り',
         desc='令和8年度行政書士試験（2026年11月8日）の採点結果は300点中122点。法令等86点で基準点122点に36点届かず、記述3問は0点、基礎知識は36点。採点サービスによる点で、公式の合否ではない。模試の点との対応も記録した。',
         cats=[CAT['study'], CAT['analysis']], tags=['行政書士', '法令等', '足切り', '記述式']),
    dict(slug='lec-moshi-3kai-kojin-seisekihyo-2026', file='lec-3kai.html', date='2026-11-26T12:00:00',
         title='LECの模試3回の個人成績表｜ファイナル112点・全日本第3回122点・ヤマ当て150点',
         desc='2026年度のLEC模試3回（ファイナル・全日本公開模試 第3回・直前ヤマ当て）の個人成績表。法令等122点を超えたのはヤマ当ての1回だけで記述36点に頼った形。行政法は3回で57問中26問、記述は自己採点17点→返却0点。',
         cats=[CAT['mock'], CAT['analysis']], tags=['LEC', '模試', '成績表', '行政法', '記述式', '設問別正解率']),
    dict(slug='tenbou-reiwa9-gyosei-shihoshi', file='tenbou.html', date='2026-11-26T12:30:00',
         title='令和9年度の展望｜行政書士5回目と司法書士、2027年の順番を数字で決める',
         desc='令和8年度は122点で不合格。法令等の足切り・記述の振れ幅・行政法の正解率という2026年度の数字から、令和9年度の目標（記述0点で法令等122点）と、司法書士→行政書士の順番を決めた。',
         cats=[CAT['strategy']], tags=['行政書士', '学習計画', '法令等']),
    dict(slug='machigai-note-gakushu-shoki', file='machigai-note.html', date='2026-11-26T13:00:00',
         title='間違いノートは学習の初期から作る｜LEC模試3回で同じ論点を落とし続けた記録',
         desc='行政書士の模試3回で、会社法の設立は3回とも、住民基本台帳法と国家賠償法1条は2回とも不正解だった。総合点しか残していなかった反省から、間違いノートを学習初期から付ける理由と、1問1行・7項目の書き方をまとめた。',
         cats=[CAT['study'], CAT['strategy']], tags=['解き直し', '過去問', '学習計画', '模試', '行政書士']),
    dict(slug='goukaku-oiwaikin-henkin-hikaku-2027', file='oiwaikin-henkin-2027.html', date='2026-11-26T14:00:00',
         title='行政書士の合格お祝い金・全額返金を比較｜2027年度合格で戻る額と条件（アガルート・フォーサイト・スタディング）',
         desc='2027年度（令和9年度）の行政書士試験に合格したら戻るお金を、公式ページで確認して比較。アガルートは全額返金か5万円、フォーサイトは1万円か受講料50%、スタディングは1万円分のギフト。返金とギフトの違い、顔出し・給付金併用などの条件も。',
         cats=[CAT['strategy']], tags=['行政書士', '通信講座', 'スタディング', '予算'], affiliate=True),
]

# アフィリエイトリンクは wordpress/content/affiliate-links.json に書く（例は affiliate-links.example.json）。
# 本文の {{AFF_XXX}} を置き換える。1つでも空なら、その記事は投稿しない。
AFF_FILE = os.path.join(HERE, '..', 'content', 'affiliate-links.json')


def fill_affiliate(content):
    links = json.load(open(AFF_FILE, encoding='utf-8')) if os.path.exists(AFF_FILE) else {}
    missing = sorted(k for k in set(re.findall(r'\{\{(AFF_[A-Z0-9_]+)\}\}', content)) if not links.get(k))
    for k, v in links.items():
        if v:
            content = content.replace('{{' + k + '}}', v)
    return content, missing

# ---------------------------------------------------------------- page edits
LINK_LEC = '<a href="/lec-moshi-3kai-kojin-seisekihyo-2026/">LECの模試3回の個人成績表</a>'
LINK_122 = '<a href="/gyosei-shoshi-2026-exam-result-122/">令和8年度の採点結果（122点）</a>'
LINK_TEN = '<a href="/tenbou-reiwa9-gyosei-shihoshi/">令和9年度の展望</a>'
NOTE = (f'<p><strong>2026年11月26日 更新：</strong>LECの個人成績表3回分（ファイナル112点・全日本公開模試 第3回122点・直前ヤマ当て150点）と、'
        f'本試験の採点結果122点を反映しました。詳しくは{LINK_LEC}・{LINK_122}、次の1年は{LINK_TEN}に書いています。</p>')

ROW = re.compile(r'<tr\b[^>]*>(?:(?!</tr>).)*?</tr>', re.S)
CELL = re.compile(r'<td\b[^>]*>.*?</td>', re.S)


def td(*vals):
    return ''.join(v if v.startswith('<td') else f'<td>{v}</td>' for v in vals)


def mock_row(rest):
    """/mock-exams/ の行：日付と模試名のセルは残し、3列目以降を差し替える"""
    def f(row):
        cells = CELL.findall(row)
        return '<tr>' + ''.join(cells[:2]) + td(*rest) + '</tr>'
    return f


def ops_mock():
    return [
        ('row', 'mock-lec-5/', mock_row(['受験済・成績表返却', '68', '16', '0', '28', '112／300（3,300位／3,900人・偏差値39.6・C判定）'])),
        ('row', 'mock-lec-6/', mock_row(['受験済・成績表返却', '84', '14', '4', '20', '122／300（2,703位／3,046人・偏差値36.6・C判定）'])),
        ('row', 'mock-lec-7/', mock_row(['受験済・成績表返却', '76', '14', '36', '24', '150／300（2,102位／2,744人・偏差値43.0・B判定）'])),
        ('text', 'LEC の全日本公開模試 第2回・第3回とヤマ当て模試は受けていません。',
         f'LEC の全日本公開模試 第2回は受けていません。第3回とヤマ当て模試は解いて提出し、個人成績表が出ました（{LINK_LEC}）。'),
        ('text', 'いずれも結果待ちです。', 'このうちLECのファイナル模試は112点で返ってきました。ほかは結果待ちです。'),
        ('text', '本試験は11月8日で、残りは34日です。', ''),
        ('text_all', '2026年11月8日（日）実施予定です。', '2026年11月8日（日）に実施されました。'),
        ('first_p', NOTE),
    ]


def ops_results():
    final = ('<tr><td>2026年9月25日</td><td>LEC ファイナル模試（自宅）<br /><small>返却点。記述は自己採点17点→返却0点。法令等84点で足切り122に−38。3,900人中3,300位・偏差値39.6。</small></td>'
             '<td>68</td><td>16</td><td>0</td><td class="ok">28</td><td class="ng">112</td></tr>'
             '<tr><td>2026年（提出日未記録）</td><td>LEC 全日本行政書士公開模試 第3回<br /><small>3,046人中2,703位・偏差値36.6。基礎知識20点で足切り。法令等102点。</small></td>'
             '<td>84</td><td>14</td><td>4</td><td class="ng">20</td><td class="ng">122</td></tr>'
             '<tr><td>2026年（提出日未記録）</td><td>LEC 厳選！直前ヤマ当て模試<br /><small>2,744人中2,102位・偏差値43.0。法令等126点で2026年度初めて122点を超えたが、記述36点込み。</small></td>'
             '<td>76</td><td>14</td><td>36</td><td class="ok">24</td><td class="ng">150</td></tr>')
    exam = ('<tr><td>2026年11月8日</td><td>令和8年度 本試験（4回目）<br /><small>採点サービスによる点（公式ではない）。法令等86点で足切り122に−36。記述3問とも0点。</small></td>'
            '<td colspan="2">86（択一＋多肢）</td><td>0</td><td class="ok">36</td><td class="ng">122</td></tr>')
    return [
        ('row', 'LEC ファイナル模試（自宅）', lambda row: final),
        ('row', '2026年10月5日 提出', lambda row: row.replace('／LEC ファイナル模試', '') + exam),
        ('row', 'LEC ファイナル模試（9/25）', lambda row: '<tr><td>LEC ファイナル模試（9/25）</td>' + td('68', '16', '0', '<td><strong>84</strong></td>', '28', '112') + '</tr>'),
        ('row_re', r'<td>LEC ファイナル</td>\s*<td>101</td>', lambda row: '<tr><td>LEC ファイナル</td>' + td('84', '<td><strong>−38</strong></td>', '28', '+4') + '</tr>'),
        ('text', '東京法経学院とLECファイナルの記述（28点・17点）は自己採点です。', '東京法経学院とLECファイナルの記述（28点・17点）は自己採点です。LECファイナルの記述は、のちに0点で返ってきました。'),
        ('first_p', NOTE),
    ]


def ops_home():
    block = (f'<h2>2026年11月の更新</h2><ul><li>{LINK_122}</li><li>{LINK_LEC}（ファイナル112点・全日本第3回122点・ヤマ当て150点）</li>'
             f'<li>{LINK_TEN}｜記述0点で法令等122点を第一関門に置き、司法書士→行政書士の順で進める</li>'
             '<li><a href="/machigai-note-gakushu-shoki/">間違いノートは学習の初期から作る</a></li></ul>')
    return [('before', '<h2>試験日程・受験要項</h2>', block)]


def apply_ops(raw, ops):
    out, log = raw, []
    for op in ops:
        kind = op[0]
        if kind in ('row', 'row_re'):
            pat = re.compile(op[1]) if kind == 'row_re' else None
            rows = [m for m in ROW.finditer(out) if (pat.search(m.group(0)) if pat else op[1] in m.group(0))]
            if len(rows) != 1:
                log.append(f'  SKIP row {op[1]!r}: {len(rows)}件一致'); continue
            m = rows[0]
            out = out[:m.start()] + op[2](m.group(0)) + out[m.end():]
            log.append(f'  OK   row {op[1]!r}')
        elif kind == 'text_all':
            n = out.count(op[1])
            if not n:
                log.append(f'  SKIP text {op[1][:30]!r}: 0件一致'); continue
            out = out.replace(op[1], op[2]); log.append(f'  OK   text {op[1][:30]!r}（{n}件）')
        elif kind == 'text':
            n = out.count(op[1])
            if n != 1:
                log.append(f'  SKIP text {op[1][:30]!r}: {n}件一致'); continue
            out = out.replace(op[1], op[2]); log.append(f'  OK   text {op[1][:30]!r}')
        elif kind == 'first_p':
            if '2026年11月26日 更新' in out:
                log.append('  SKIP note: 既に入っている'); continue
            i = out.find('</p>')
            if i < 0:
                log.append('  SKIP note: 段落が無い'); continue
            out = out[:i + 4] + '\n' + op[1] + out[i + 4:]; log.append('  OK   note')
        elif kind == 'before':
            if '2026年11月の更新' in out:
                log.append('  SKIP home block: 既に入っている'); continue
            n = out.count(op[1])
            if n != 1:
                log.append(f'  SKIP before {op[1]!r}: {n}件一致'); continue
            out = out.replace(op[1], op[2] + '\n' + op[1]); log.append('  OK   home block')
    return out, log


def main():
    global s
    s = login()
    for p in POSTS:
        content = open(os.path.join(CONTENT, p['file']), encoding='utf-8').read()
        if p.get('affiliate'):
            content, missing = fill_affiliate(content)
            if missing:
                print('SKIP', p['slug'], '— affiliate-links.json に未設定:', ', '.join(missing))
                continue
        found = api('GET', f"/posts?slug={p['slug']}&status=any&context=edit")
        body = {'slug': p['slug'], 'title': p['title'], 'content': content, 'status': 'publish',
                'categories': p['cats'], 'tags': [TAG[t] for t in p['tags']],
                'comment_status': 'closed', 'ping_status': 'closed', 'meta': {'st_description': p['desc']}}
        if not found:
            body['date'] = p['date']
        print(('UPDATE' if found else 'CREATE'), p['slug'])
        if APPLY:
            r = api('POST', f"/posts/{found[0]['id']}" if found else '/posts', json=body)
            print('  ->', r['link'])

    for slug, ops in [('mock-exams', ops_mock()), ('results', ops_results()), ('home', ops_home())]:
        page = api('GET', f'/pages?slug={slug}&status=any&context=edit')[0]
        raw = page['content']['raw']
        new, log = apply_ops(raw, ops)
        print(f'PAGE {slug} (id {page["id"]})'); print('\n'.join(log))
        if APPLY and new != raw:
            api('POST', f'/pages/{page["id"]}', json={'content': new})
            print('  -> updated', page['link'])

    print('done' if APPLY else 'dry run（書き込むときは --apply）')


if __name__ == '__main__':
    main()
