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
        err = re.search(r'id="login_error"[^>]*>(.*?)</div>', r.text, re.S)
        msg = re.sub(r'<[^>]+>', '', err.group(1)).strip() if err else ''
        sys.exit(f'LOGIN FAILED {r.status_code} {r.url} {msg}')
    print('login OK')
    # REST API の nonce。admin-ajax の rest-nonce（WP 5.3+）を先に使い、だめなら管理画面から拾う
    nonce = None
    r = s.get(BASE + '/wp-admin/admin-ajax.php', params={'action': 'rest-nonce'}, timeout=30)
    if r.status_code == 200 and re.fullmatch(r'[0-9a-f]{10}', r.text.strip()):
        nonce = r.text.strip()
    for page in ('/wp-admin/', '/wp-admin/post-new.php', '/wp-admin/profile.php'):
        if nonce:
            break
        m = re.search(r'wpApiSettings\s*=\s*(\{.*?\});', s.get(BASE + page, timeout=30).text)
        if m:
            nonce = json.loads(m.group(1))['nonce']
    if not nonce:
        sys.exit('REST nonce が取れない')
    s.headers['X-WP-Nonce'] = nonce
    me = s.get(API + '/users/me', params={'context': 'edit'}, timeout=30)
    if me.status_code != 200:
        sys.exit(f'REST API で認証できない {me.status_code} {me.text[:200]}')
    print('REST OK as', me.json().get('slug'), me.json().get('roles'))
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
       '解き直し': 42, '過去問': 41, '通信講座': 26, 'スタディング': 21, '予算': 52,
       '伊藤塾': 17, '民法': 13, '資格試験': 27}

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
         title='行政書士の合格お祝い金・全額返金を比較｜2027年度合格で戻る額と条件',
         desc='2027年度（令和9年度）の行政書士試験に合格したら戻るお金を、7社の公式ページで確認して比較。アガルートは全額返金か5万円、東京法経学院は一般学費で全額返金、フォーサイトは1万円か50%、スタディングは1万円分。LEC・TAC・伊藤塾の全額返金は2026年度合格者向け。',
         cats=[CAT['strategy']], tags=['行政書士', '通信講座', 'スタディング', '予算'], affiliate=True),
    dict(slug='shihoshi-goukaku-oiwaikin-henkin-2027', file='shihoshi-oiwaikin-henkin-2027.html', date='2026-11-26T23:50:00',
         title='司法書士の合格お祝い金・全額返金を比較｜2027年度合格で戻る額と条件',
         desc='2027年度（令和9年度）の司法書士試験に合格したら戻るお金を公式ページで確認して比較。アガルートは全額返金か現金3万円、東京法経学院は総合コースで全額返金、スタディングは1万円分のギフト。LEC・TAC・伊藤塾・フォーサイト・クレアールは確認できた範囲も記載。',
         cats=[CAT['strategy']], tags=['通信講座', 'スタディング', '予算'], affiliate=True),
    dict(slug='fudousan-kanteishi-gaiyou', file='fudousan-kanteishi-gaiyou.html', date='2026-11-27T07:00:00',
         title='不動産鑑定士試験の概要｜受験資格・試験科目・日程・合格率（令和8年の実績）',
         desc='不動産鑑定士試験は受験資格なし。短答式（5月・行政法規と鑑定理論）と論文式（8月・民法・経済学・会計学・鑑定理論）の2段階で、令和8年の合格率は短答37.4%・論文17.6%。受験手数料、短答免除、合格後の実務修習まで国土交通省の資料で確認した。',
         cats=[CAT['strategy']], tags=['資格試験', '学習計画', '民法']),
    dict(slug='tochikaoku-chosashi-gaiyou', file='tochikaoku-chosashi-gaiyou.html', date='2026-11-27T07:05:00',
         title='土地家屋調査士試験の概要｜受験資格・午前の部の免除・日程・合格率',
         desc='土地家屋調査士試験は受験資格なし。筆記（10月・午前の部と午後の部）と口述（翌年1月）で、令和7年度の合格率は約10.1%。測量士補・建築士などで午前の部が免除される。受験手数料8,300円、令和8年度の日程を法務省の資料で確認した。',
         cats=[CAT['strategy']], tags=['資格試験', '学習計画', '民法']),
    dict(slug='itojuku-hirabayashi-kunimoto', file='itojuku-hirabayashi-kunimoto.html', date='2026-11-27T07:10:00',
         title='伊藤塾 平林講師・国本講師の講座を受けて｜法的三段論法で「何となく解く」をやめた',
         desc='伊藤塾の平林講師・国本講師の講座で、全体像から問題文の生の主張へ寄せていく順番と、法的三段論法を教わった。何となく解いていた択一と記述を改め、司法書士試験もいけるかもと思えるようになった受講の感想。',
         cats=[CAT['study']], tags=['伊藤塾', '記述式', '民法', '行政書士']),
]

# アフィリエイトリンクは wordpress/content/affiliate-links.json に書く（例は affiliate-links.example.json）。
# 本文の {{AFF_XXX|公式URL}} を置き換える。未設定のものは公式URLのまま公開し、あとで設定して再実行すれば差し替わる。
AFF_FILE = os.path.join(HERE, '..', 'content', 'affiliate-links.json')


def fill_affiliate(content):
    links = json.load(open(AFF_FILE, encoding='utf-8')) if os.path.exists(AFF_FILE) else {}
    official = []

    def rep(m):
        key, url = m.group(1), m.group(2)
        if links.get(key):
            return links[key]
        official.append(key)
        return url
    content = re.sub(r'\{\{(AFF_[A-Z0-9_]+)\|([^}]+)\}\}', rep, content)
    # {{AFFHTML_XXX}} はバナー・計測タグなどの HTML をそのまま入れる。未設定なら何も出さない
    content = re.sub(r'\{\{(AFFHTML_[A-Z0-9_]+)\}\}', lambda m: links.get(m.group(1), ''), content)
    return content, sorted(set(official))

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
        # 2回目以降の実行で行が増えないよう、追加済みなら差し替えだけにする
        ('dedupe', ['LEC 全日本行政書士公開模試 第3回<br', 'LEC 厳選！直前ヤマ当て模試<br', '令和8年度 本試験（4回目）']),
        ('row_once', 'LEC ファイナル模試（自宅）', 'LEC 全日本行政書士公開模試 第3回<br', lambda row: final),
        ('row_once', '2026年10月5日 提出', '令和8年度 本試験（4回目）', lambda row: row.replace('／LEC ファイナル模試', '') + exam),
        ('row', 'LEC ファイナル模試（9/25）', lambda row: '<tr><td>LEC ファイナル模試（9/25）</td>' + td('68', '16', '0', '<td><strong>84</strong></td>', '28', '112') + '</tr>'),
        ('row_re', r'<td>LEC ファイナル</td>\s*<td>101</td>', lambda row: '<tr><td>LEC ファイナル</td>' + td('84', '<td><strong>−38</strong></td>', '28', '+4') + '</tr>'),
        ('text_all', 'LECファイナルの記述は、のちに0点で返ってきました。LECファイナルの記述は、のちに0点で返ってきました。', 'LECファイナルの記述は、のちに0点で返ってきました。'),
        ('text_unless', '東京法経学院とLECファイナルの記述（28点・17点）は自己採点です。', '東京法経学院とLECファイナルの記述（28点・17点）は自己採点です。LECファイナルの記述は、のちに0点で返ってきました。', 'のちに0点で返ってきました'),
        ('first_p', NOTE),
    ]


def ops_home():
    block = (f'<h2>2026年11月の更新</h2><ul><li>{LINK_122}</li><li>{LINK_LEC}（ファイナル112点・全日本第3回122点・ヤマ当て150点）</li>'
             f'<li>{LINK_TEN}｜記述0点で法令等122点を第一関門に置き、司法書士→行政書士の順で進める</li>'
             '<li><a href="/machigai-note-gakushu-shoki/">間違いノートは学習の初期から作る</a></li>'
             '<li><a href="/itojuku-hirabayashi-kunimoto/">伊藤塾 平林講師・国本講師の講座を受けて</a></li>'
             '<li><a href="/fudousan-kanteishi-gaiyou/">不動産鑑定士試験の概要</a>／<a href="/tochikaoku-chosashi-gaiyou/">土地家屋調査士試験の概要</a></li></ul>')
    concept = ('<h2>このサイトのコンセプト：資格試験をクイズ・ゲームとして楽しむ</h2>'
               '<p>50代になって、気力と体力だけで机に向かう勉強は続かなくなりました。そこで資格試験を、<strong>クイズとゲームのつもりで遊ぶ</strong>ことにしています。</p>'
               '<ul>'
               '<li><strong>毎日がクイズ：</strong>移動時間や食事中に、スマホで一問一答・肢別問題を解く。机に向かうことを前提にしない</li>'
               '<li><strong>模試はボス戦：</strong>点数・偏差値・順位を、ゲームのスコアとして記録する。良い数字も悪い数字もそのまま載せる</li>'
               '<li><strong>スコアは毎日動かす：</strong>AI実力スコアは触らない日が続くと下がる。だから少しずつ毎日触る</li>'
               '<li><strong>間違いはアイテム：</strong>落とした問題は<a href="/machigai-note-gakushu-shoki/">間違いノート</a>に集めて、次に出たときに取り返す</li>'
               '</ul>'
               '<p>いま攻略中のゲームは2つ。令和9年度の行政書士（5回目）と、新しく始めた司法書士です。</p>')
    return [
        ('text', 'このページでは、次の挑戦と学習の状況を記録していきます。',
         'このサイトでは、次の挑戦をクイズとゲームのつもりで攻略していく記録を残します。'),
        ('insert_before', '<h2>次の目標は2つ</h2>', concept, 'このサイトのコンセプト'),
        # 終わった行政書士試験のカウントダウンを、次の司法書士試験（筆記・例年7月第1日曜。令和9年度は未発表のため予定）に変える
        ('text_all', '[gy_countdown]', '[gy_countdown date="2027-07-04" label="令和9年度 司法書士試験 筆記（予定）"]'),
        ('text_unless', '<h2>このサイトのコンセプト', '<p><small>司法書士試験の日付は、例年の7月第1日曜から置いた予定です。令和9年度の日程は法務省の発表後に直します。</small></p>\n<h2>このサイトのコンセプト', '例年の7月第1日曜から置いた予定'),
        ('before', '<h2>試験日程・受験要項</h2>', block),
        # 既にある「2026年11月の更新」欄に、あとから足した記事を追記する
        ('text_unless', '間違いノートは学習の初期から作る</a></li>',
         '間違いノートは学習の初期から作る</a></li>'
         '<li><a href="/itojuku-hirabayashi-kunimoto/">伊藤塾 平林講師・国本講師の講座を受けて</a></li>'
         '<li><a href="/fudousan-kanteishi-gaiyou/">不動産鑑定士試験の概要</a>／<a href="/tochikaoku-chosashi-gaiyou/">土地家屋調査士試験の概要</a></li>',
         'itojuku-hirabayashi-kunimoto'),
    ]


# サイト名・キャッチフレーズ・トップページのタイトル（コンセプト変更）
SITE_TITLE = '資格試験はクイズで遊ぶ｜行政書士・司法書士の攻略記録'
SITE_TAGLINE = '行政書士・司法書士の試験を、クイズとゲームのつもりで楽しむ個人の攻略記録。模試の点数・順位・AIスコアを「ゲームの数字」として毎日動かしています。'
HOME_TITLE = '資格試験をクイズ・ゲームとして楽しむ｜行政書士リベンジと司法書士の攻略記録'
HOME_DESC = '50代の受験生が、行政書士（5回目）と司法書士をクイズとゲームのつもりで攻略する記録。移動時間の一問一答、模試はボス戦、AIスコアは毎日動かす。点数は良くても悪くてもそのまま載せます。'


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
        elif kind == 'dedupe':
            for key in op[1]:
                rows = [m for m in ROW.finditer(out) if key in m.group(0)]
                for m in reversed(rows[1:]):
                    out = out[:m.start()] + out[m.end():]
                log.append(f'  OK   dedupe {key!r}: {len(rows)}件→{min(len(rows), 1)}件')
        elif kind == 'row_once':
            if op[2] in out:
                log.append(f'  SKIP row {op[1]!r}: 追加済み'); continue
            rows = [m for m in ROW.finditer(out) if op[1] in m.group(0)]
            if len(rows) != 1:
                log.append(f'  SKIP row {op[1]!r}: {len(rows)}件一致'); continue
            m = rows[0]
            out = out[:m.start()] + op[3](m.group(0)) + out[m.end():]
            log.append(f'  OK   row {op[1]!r}')
        elif kind == 'text_unless':
            if op[3] in out:
                log.append(f'  SKIP text {op[1][:30]!r}: 反映済み'); continue
            n = out.count(op[1])
            if n != 1:
                log.append(f'  SKIP text {op[1][:30]!r}: {n}件一致'); continue
            out = out.replace(op[1], op[2]); log.append(f'  OK   text {op[1][:30]!r}')
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
        elif kind == 'insert_before':
            if op[3] in out:
                log.append(f'  SKIP insert {op[3]!r}: 既に入っている'); continue
            n = out.count(op[1])
            if n != 1:
                log.append(f'  SKIP insert before {op[1]!r}: {n}件一致'); continue
            out = out.replace(op[1], op[2] + '\n' + op[1]); log.append(f'  OK   insert {op[3]!r}')
        elif kind == 'before':
            if '2026年11月の更新' in out:
                log.append('  SKIP home block: 既に入っている'); continue
            n = out.count(op[1])
            if n != 1:
                log.append(f'  SKIP before {op[1]!r}: {n}件一致'); continue
            out = out.replace(op[1], op[2] + '\n' + op[1]); log.append('  OK   home block')
    return out, log


# ---------------------------------------------------------------- SEO・スマホ最適化
SNIPPET_FILE = os.path.join(HERE, '..', 'snippets', 'gy-seo-mobile.php')
SNIPPET_NAME = 'gy-seo-mobile（SEO・スマホ最適化）'
EYECATCH_DIR = os.path.join(HERE, 'eyecatch')
FONT_B = r'C:\Windows\Fonts\YuGothB.ttc'
FONT_R = r'C:\Windows\Fonts\YuGothM.ttc'


def ensure_code_snippets():
    """Code Snippets プラグイン（wordpress.org）を入れて有効にする。PHP をテーマを触らずに足すため。"""
    r = s.get(API + '/plugins', params={'search': 'code-snippets'}, timeout=60)
    if r.status_code >= 400:
        print(f'  SKIP plugin: プラグイン一覧を読めない {r.status_code} {r.text[:150]}'); return False
    have = [x for x in r.json() if x['plugin'].startswith('code-snippets/')]
    if have and have[0]['status'] == 'active':
        print('  OK   Code Snippets は有効'); return True
    print('  Code Snippets を' + ('有効化' if have else 'インストールして有効化'))
    if not APPLY:
        return True
    if have:
        r = s.post(API + f"/plugins/{have[0]['plugin']}", json={'status': 'active'}, timeout=120)
    else:
        r = s.post(API + '/plugins', json={'slug': 'code-snippets', 'status': 'active'}, timeout=180)
    if r.status_code >= 400:
        print(f'  ERR  plugin {r.status_code} {r.text[:200]}'); return False
    print('  -> Code Snippets 有効')
    return True


def upsert_snippet():
    code = open(SNIPPET_FILE, encoding='utf-8').read()
    code = re.sub(r'^<\?php\s*', '', code)  # Code Snippets は先頭の <?php なしで登録する
    base = BASE + '/wp-json/code-snippets/v1/snippets'
    r = s.get(base, timeout=60)
    if r.status_code >= 400:
        print(f'  SKIP snippet: Code Snippets の API が使えない {r.status_code}'); return
    found = [x for x in r.json() if x.get('name') == SNIPPET_NAME]
    body = {'name': SNIPPET_NAME, 'code': code, 'scope': 'global', 'active': True,
            'desc': 'gyosei-yosou の SEO・スマホ最適化。リポジトリの wordpress/snippets/gy-seo-mobile.php と同じ内容。'}
    print('  snippet', 'UPDATE' if found else 'CREATE', SNIPPET_NAME)
    if not APPLY:
        return
    r = s.request('PUT' if found else 'POST', base + (f"/{found[0]['id']}" if found else ''), json=body, timeout=120)
    if r.status_code >= 400:
        print(f'  ERR  snippet {r.status_code} {r.text[:300]}'); return
    sid = r.json().get('id')
    s.post(base + f'/{sid}/activate', timeout=60)
    print('  -> snippet 有効 id', sid)


def make_eyecatch(title, label):
    from PIL import Image, ImageDraw, ImageFont
    W, H = 1200, 630
    img = Image.new('RGB', (W, H), (31, 42, 68))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 14], fill=(240, 160, 40))
    fb = ImageFont.truetype(FONT_B, 62)
    fs = ImageFont.truetype(FONT_R, 30)
    d.rounded_rectangle([70, 80, 70 + d.textlength(label, font=fs) + 40, 132], radius=10, fill=(240, 160, 40))
    d.text((90, 86), label, font=fs, fill=(31, 42, 68))
    main, _, sub = title.partition('｜')
    lines, cur = [], ''
    for ch in main:
        if d.textlength(cur + ch, font=fb) > W - 160 and cur:
            lines.append(cur); cur = ch
        else:
            cur += ch
    lines.append(cur)
    y = 190
    for ln in lines[:3]:
        d.text((80, y), ln, font=fb, fill=(255, 255, 255)); y += 84
    if sub:
        fsub = ImageFont.truetype(FONT_R, 36)
        sl, cur = [], ''
        for ch in sub:
            if d.textlength(cur + ch, font=fsub) > W - 160 and cur:
                sl.append(cur); cur = ch
            else:
                cur += ch
        sl.append(cur)
        for ln in sl[:2]:
            d.text((80, y + 12), ln, font=fsub, fill=(200, 208, 224)); y += 50
    d.text((80, H - 70), 'gyosei-yosou.jp ｜ 資格試験はクイズで遊ぶ', font=fs, fill=(170, 180, 200))
    os.makedirs(EYECATCH_DIR, exist_ok=True)
    return img


def ensure_eyecatches():
    """アイキャッチ（OGP 画像）が無い記事に 1200x630 の画像を作って設定する。"""
    labels = {5: '模試の記録', 7: '学習戦略', 9: '得点分析', 24: '学習記録', 6: '市販予想模試', 8: 'AI実力スコア'}
    posts = api('GET', '/posts?per_page=100&status=publish&_fields=id,slug,title,featured_media,categories')
    for p in posts:
        if p['featured_media']:
            continue
        title = re.sub(r'<[^>]+>', '', p['title']['rendered'])
        title = title.replace('&#8211;', '–').replace('&amp;', '&').replace('&#038;', '&')
        label = next((labels[c] for c in p['categories'] if c in labels), '行政書士・司法書士')
        print('  eyecatch', p['slug'])
        if not APPLY:
            continue
        img = make_eyecatch(title, label)
        path = os.path.join(EYECATCH_DIR, p['slug'] + '.png')
        img.save(path, optimize=True)
        with open(path, 'rb') as fh:
            r = s.post(API + '/media', data=fh.read(), timeout=120, headers={
                'Content-Type': 'image/png', 'Content-Disposition': f'attachment; filename=eyecatch-{p["slug"]}.png'})
        if r.status_code >= 400:
            print(f'  ERR  media {r.status_code} {r.text[:200]}'); continue
        mid = r.json()['id']
        api('POST', f'/media/{mid}', json={'alt_text': title})
        api('POST', f"/posts/{p['id']}", json={'featured_media': mid})
        print('  -> set', mid)



def fix_countdown_widget():
    """サイドバーの「本試験まで」ウィジェット（[gy_countdown]）を、司法書士試験に向ける。"""
    r = s.get(API + '/widgets', params={'context': 'edit'}, timeout=60)
    if r.status_code >= 400:
        print(f'  SKIP widget: {r.status_code}'); return
    for w in r.json():
        inst = (w.get('instance') or {}).get('raw') or {}
        text = inst.get('text') or inst.get('content') or ''
        if '[gy_countdown]' not in text:
            continue
        key = 'text' if 'text' in inst else 'content'
        inst[key] = text.replace('[gy_countdown]', '[gy_countdown date="2027-07-04" label="令和9年度 司法書士試験 筆記（予定）"]')
        if 'title' in inst:
            inst['title'] = '司法書士試験まで'
        print('  widget', w['id'], '→ 司法書士試験まで')
        if APPLY:
            r2 = s.post(API + f"/widgets/{w['id']}", json={'instance': {'raw': inst}}, timeout=60)
            print('  ->', r2.status_code if r2.status_code >= 400 else 'updated', r2.text[:150] if r2.status_code >= 400 else '')


def seo_phase():
    print('SEO')
    if ensure_code_snippets():
        upsert_snippet()
    fix_countdown_widget()
    ensure_eyecatches()


def main():
    global s
    s = login()
    for p in POSTS:
        content = open(os.path.join(CONTENT, p['file']), encoding='utf-8').read()
        if p.get('affiliate'):
            content, official = fill_affiliate(content)
            if official:
                print('  公式URLのまま（アフィリエイト未設定）:', ', '.join(official))
        found = api('GET', f"/posts?slug={p['slug']}&status=any&context=edit")
        body = {'slug': p['slug'], 'title': p['title'], 'content': content, 'status': 'publish',
                'categories': p['cats'], 'tags': [TAG[t] for t in p['tags']],
                'comment_status': 'closed', 'ping_status': 'closed', 'meta': {'st_description': p['desc']}}
        if not found:
            body['date'] = p['date']
        elif found[0].get('status') == 'future':
            # 予約投稿になってしまった記事は、いまの時刻で公開する
            body['date'] = None
            body['date_gmt'] = None
        print(('UPDATE' if found else 'CREATE'), p['slug'])
        if APPLY:
            r = api('POST', f"/posts/{found[0]['id']}" if found else '/posts', json=body)
            print('  ->', r['link'])

    for slug, ops in [('mock-exams', ops_mock()), ('results', ops_results()), ('home', ops_home())]:
        page = api('GET', f'/pages?slug={slug}&status=any&context=edit')[0]
        raw = page['content']['raw']
        new, log = apply_ops(raw, ops)
        print(f'PAGE {slug} (id {page["id"]})'); print('\n'.join(log))
        body = {'content': new} if new != raw else {}
        if slug == 'home' and page['title']['raw'] != HOME_TITLE:
            body.update(title=HOME_TITLE, meta={'st_description': HOME_DESC})
            print(f'  title: {page["title"]["raw"]} -> {HOME_TITLE}')
        if APPLY and body:
            api('POST', f'/pages/{page["id"]}', json=body)
            print('  -> updated', page['link'])

    cur = api('GET', '/settings')
    print(f'SITE title: {cur.get("title")} -> {SITE_TITLE}')
    print(f'SITE tagline: {cur.get("description")} -> {SITE_TAGLINE}')
    if APPLY and (cur.get('title'), cur.get('description')) != (SITE_TITLE, SITE_TAGLINE):
        api('POST', '/settings', json={'title': SITE_TITLE, 'description': SITE_TAGLINE})
        print('  -> site title / tagline updated')

    seo_phase()

    print('done' if APPLY else 'dry run（書き込むときは --apply）')


if __name__ == '__main__':
    main()
