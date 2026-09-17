"""投稿・固定ページのアイキャッチ（1200x630）を生成して WordPress にアップロードし featured_media に設定する（冪等）。

デザイン：紺の背景＋カテゴリ色の帯／サイト名／カテゴリチップ／見出し（最大3行）／右下に大きな数字（点数・正答数）。
数字はタイトル中の「NN/NN問」「NNN点」「NN.N/240」を自動抽出。抽出できないものはサイト名ロゴのみ。

実行: WPU / WPP 環境変数に管理者のユーザー名・パスワードを入れて
      python3 wordpress/tools/thumbnails.py            # 未設定のものだけ
      python3 wordpress/tools/thumbnails.py --force    # 全て再生成
"""
import os, re, sys, io, hashlib
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(__file__))
from wpsess import login, nonce, BASE

FONT = '/usr/share/fonts/opentype/ipafont-gothic/ipagp.ttf'
FONT_MONO = '/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf'
W, H = 1200, 630
NAVY = (31, 42, 68)
NAVY2 = (22, 30, 50)
WHITE = (255, 255, 255)
MUTE = (190, 198, 214)
CAT_COLOR = {
    'analysis': (232, 118, 60), 'mock-books': (56, 160, 110), 'strategy': (66, 133, 244),
    'mock-exams': (140, 96, 200), 'ai-score': (240, 180, 50), 'page': (120, 130, 150),
}
CAT_LABEL = {
    'analysis': '得点分析', 'mock-books': '市販予想模試', 'strategy': '学習戦略', 'mock-exams': '模試の記録',
    'ai-score': 'AI実力スコア', 'page': '行政書士試験 合格までの記録',
}
SITE = 'gyosei-yosou.jp ｜ 行政書士試験 4回目の記録'
FORCE = '--force' in sys.argv
ONLY = [a for a in sys.argv[1:] if not a.startswith('--')]

s = login()
_, REST = nonce(s)
HD = {'X-WP-Nonce': REST}
A = BASE + '/wp-json/wp/v2'


def api(method, path, **kw):
    r = s.request(method, A + path, headers=HD, timeout=120, **kw)
    if r.status_code >= 400:
        print('ERR', method, path, r.status_code, r.text[:300]); sys.exit(1)
    return r.json()


def font(size, mono=False):
    return ImageFont.truetype(FONT_MONO if mono else FONT, size)


def wrap(draw, text, f, width):
    lines, cur = [], ''
    for ch in text:
        if draw.textlength(cur + ch, font=f) > width and cur:
            lines.append(cur); cur = ch
        else:
            cur += ch
    if cur:
        lines.append(cur)
    return lines


def headline(title):
    t = re.sub(r'<[^>]+>', '', title)
    t = re.split(r'[：｜]', t)[0]
    t = re.sub(r'（[^）]*）$', '', t).strip()
    return t


def big_number(title):
    t = re.sub(r'<[^>]+>', '', title)
    m = re.search(r'(\d+)問→(\d+)問／(\d+)問', t)
    if m:
        return f'{m.group(2)}/{m.group(3)}', '問'
    m = re.search(r'(\d+)問中(\d+)問', t)
    if m:
        return f'{m.group(2)}/{m.group(1)}', '問'
    m = re.search(r'(\d+)/(\d+)問', t)
    if m:
        return f'{m.group(1)}/{m.group(2)}', '問'
    m = re.search(r'(\d+\.\d)/240', t)
    if m:
        return m.group(1), '/240'
    m = re.search(r'(\d{2,3})点', t)
    if m:
        return m.group(1), '点'
    m = re.search(r'(\d{1,3})週', t)
    if m:
        return m.group(1), '週'
    return None, None


def render(title, cat, date_text):
    img = Image.new('RGB', (W, H), NAVY)
    d = ImageDraw.Draw(img)
    # 斜めの濃淡
    d.polygon([(0, H), (W, H), (W, 330), (0, 480)], fill=NAVY2)
    color = CAT_COLOR.get(cat, CAT_COLOR['page'])
    d.rectangle([0, 0, W, 14], fill=color)
    d.rectangle([0, H - 14, W, H], fill=color)
    # サイト名
    d.text((70, 48), SITE, font=font(26), fill=MUTE)
    # カテゴリチップ
    label = CAT_LABEL.get(cat, CAT_LABEL['page'])
    f = font(26)
    tw = d.textlength(label, font=f)
    d.rounded_rectangle([70, 108, 70 + tw + 44, 108 + 46], radius=23, fill=color)
    d.text((92, 116), label, font=f, fill=WHITE)
    # 見出し
    num, unit = big_number(title)
    text_w = 660 if num else 1060
    hl = headline(title)
    size = 62
    while True:
        f = font(size)
        lines = wrap(d, hl, f, text_w)
        if len(lines) <= 3 or size <= 40:
            break
        size -= 4
    y = 200
    for ln in lines[:3]:
        d.text((70, y), ln, font=f, fill=WHITE)
        y += int(size * 1.35)
    # 大きな数字
    if num:
        fn = font(150 if len(num) <= 4 else 110)
        nw = d.textlength(num, font=fn)
        fu = font(44)
        uw = d.textlength(unit, font=fu)
        x = W - 80 - nw - uw - 10
        d.text((x, 300), num, font=fn, fill=color)
        d.text((x + nw + 10, 300 + (150 if len(num) <= 4 else 110) - 60), unit, font=fu, fill=MUTE)
    # 日付
    d.text((70, H - 70), date_text, font=font(24), fill=MUTE)
    buf = io.BytesIO()
    img.save(buf, 'PNG', optimize=True)
    return buf.getvalue()


def upload(png, slug):
    key = hashlib.md5(png).hexdigest()[:8]
    name = f'thumb-{slug}-{key}.png'
    found = api('GET', f'/media?search={name}&per_page=5')
    for m in found:
        if m['source_url'].endswith(name):
            return m['id']
    r = s.post(A + '/media', headers={**HD, 'Content-Disposition': f'attachment; filename="{name}"',
                                    'Content-Type': 'image/png'}, data=png, timeout=120)
    if r.status_code >= 400:
        print('ERR media', r.status_code, r.text[:300]); sys.exit(1)
    mid = r.json()['id']
    api('POST', f'/media/{mid}', json={'alt_text': slug, 'title': name})
    return mid


def process(ptype, item):
    if ONLY and item['slug'] not in ONLY:
        return
    if item['featured_media'] and not FORCE:
        return
    title = item['title']['rendered'].replace('&amp;', '&')
    if ptype == 'posts':
        cats = {c['slug'] for c in api('GET', f'/categories?post={item["id"]}')}
        cat = next((c for c in ['analysis', 'mock-books', 'strategy', 'ai-score', 'mock-exams'] if c in cats), 'page')
    else:
        cat = 'page'
    date_text = item['date'][:10].replace('-', '.') + ' 公開'
    png = render(title, cat, date_text)
    mid = upload(png, item['slug'])
    api('POST', f'/{ptype}/{item["id"]}', json={'featured_media': mid})
    print(ptype, item['slug'], '->', mid)


for ptype in ('posts', 'pages'):
    page = 1
    while True:
        items = api('GET', f'/{ptype}?per_page=50&page={page}&status=any')
        if not items:
            break
        for it in items:
            process(ptype, it)
        if len(items) < 50:
            break
        page += 1
print('done')
