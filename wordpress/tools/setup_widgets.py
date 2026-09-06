"""サイドバー等のウィジェットを構成する（冪等: 対象サイドバーを作り直す）。
広告ウィジェット（sidebar-3/4/26/16/5 等）は AdSense 審査通過後に管理画面から追加する想定で、ここでは空のままにする。"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from wpsess import login, nonce, BASE

s = login()
_, REST = nonce(s)
H = {'X-WP-Nonce': REST}
A = BASE + '/wp-json/wp/v2'

PROFILE = ('<div class="gy-profile"><p><strong>4回目の行政書士受験生</strong></p><p>令和5年度152点 → 令和6年度168点（あと12点）。'
           'スタディング受講中、模試13回（自宅受験）と市販予想模試の自己採点を全公開。</p>'
           '<p><a href="/about/">運営者情報</a>／<a href="/mock-exams/">模試の記録</a></p></div>')


def clear(sidebar):
    for w in s.get(A + f'/widgets?sidebar={sidebar}&per_page=100', headers=H).json():
        s.delete(A + f'/widgets/{w["id"]}?force=true', headers=H)


placed = {}


def add(sidebar, id_base, instance):
    # REST の sidebar 指定は AFFINGER 環境で無視されて inactive に入るため、作成後に /sidebars で配置し直す
    r = s.post(A + '/widgets', headers=H, json={'id_base': id_base, 'sidebar': sidebar, 'instance': {'raw': instance}})
    print(sidebar, id_base, r.status_code, r.text[:120] if r.status_code >= 400 else '')
    placed.setdefault(sidebar, []).append(r.json()['id'])


clear('sidebar-1')  # サイドバートップ
add('sidebar-1', 'text', {'title': 'このサイトについて', 'text': PROFILE, 'filter': True, 'visual': False})
add('sidebar-1', 'recent-posts', {'title': '新着記事', 'number': 6, 'show_date': True})
add('sidebar-1', 'categories', {'title': 'カテゴリー', 'count': True, 'hierarchical': False, 'dropdown': False})
add('sidebar-1', 'search', {'title': ''})
clear('sidebar-2')  # サイドバーウィジェット（スクロール追従）
add('sidebar-2', 'text', {'title': '本試験まで', 'text': '[gy_countdown label="令和8年度 行政書士試験"]', 'filter': True, 'visual': False})

# 投稿記事（下部）: 関連導線
clear('sidebar-5')
add('sidebar-5', 'text', {'title': '', 'text': '<p class="gy-nav">→ <a href="/mock-exams/">模試13回の日程・得点一覧</a>　→ <a href="/mock-books/">市販予想模試 2022〜2026年度 会社別得点表</a>　→ <a href="/ai-score/">AI実力スコアの推移</a></p>', 'filter': True, 'visual': False})

for sidebar, ids in placed.items():
    s.post(A + f'/sidebars/{sidebar}', headers=H, json={'widgets': ids})
sb = s.get(A + '/sidebars', headers=H).json()
print({x['id']: len(x.get('widgets', [])) for x in sb if x.get('widgets')})
