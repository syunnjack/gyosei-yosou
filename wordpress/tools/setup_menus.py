"""ヘッダー/スマホ/フッターメニューを作成し AFFINGER のメニュー位置に割り当てる（冪等）。"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from wpsess import login, nonce, BASE

s = login()
_, REST = nonce(s)
H = {'X-WP-Nonce': REST}
A = BASE + '/wp-json/wp/v2'

pages = {p['slug']: p['id'] for p in s.get(A + '/pages?per_page=100', headers=H).json()}
cats = {c['slug']: c['id'] for c in s.get(A + '/categories?per_page=100', headers=H).json()}


def menu(name, items, locations):
    found = [m for m in s.get(A + '/menus?per_page=100', headers=H).json() if m['name'] == name]
    mid = found[0]['id'] if found else s.post(A + '/menus', headers=H, json={'name': name}).json()['id']
    have = {(i['object'], i['object_id']) for i in s.get(A + f'/menu-items?menus={mid}&per_page=100', headers=H).json()}
    for i, (title, kind, key) in enumerate(items):
        obj = ('page', pages[key]) if kind == 'page' else ('category', cats[key])
        if obj in have:
            continue
        body = {'title': title, 'menus': mid, 'status': 'publish', 'menu_order': i + 1,
                'type': 'post_type' if kind == 'page' else 'taxonomy', 'object': obj[0], 'object_id': obj[1]}
        r = s.post(A + '/menu-items', headers=H, json=body)
        print(name, title, r.status_code)
    r = s.post(A + f'/menus/{mid}', headers=H, json={'locations': locations})
    print(name, '->', r.json().get('locations'))


main = [('ホーム', 'page', 'home'), ('模試の記録', 'page', 'mock-exams'), ('これまでの成績', 'page', 'results'),
        ('AI実力スコア', 'page', 'ai-score'), ('市販予想模試 2022-2026', 'page', 'mock-books'),
        ('学習戦略・予定表', 'cat', 'strategy'), ('運営者情報', 'page', 'about')]
footer = [('運営者情報', 'page', 'about'), ('プライバシーポリシー', 'page', 'privacy-policy'),
          ('広告・アフィリエイトについて', 'page', 'disclosure'), ('お問い合わせ', 'page', 'contact'),
          ('サイトマップ', 'page', 'sitemap')]
menu('グローバルメニュー', main, ['primary-menu', 'smartphone-menu'])
menu('フッターメニュー', footer, ['secondary-menu', 'smartphone-footermenu'])
