import os, re, sys, json, requests

BASE = 'https://gyosei-yosou.jp'
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/128 Safari/537.36'


def login():
    s = requests.Session()
    s.headers['User-Agent'] = UA
    s.get(BASE + '/wp-login.php', timeout=30)
    r = s.post(BASE + '/wp-login.php', data={
        'log': os.environ['WPU'], 'pwd': os.environ['WPP'],
        'wp-submit': 'Log In', 'redirect_to': BASE + '/wp-admin/', 'testcookie': '1'
    }, timeout=30, allow_redirects=True)
    if 'wp-admin' not in r.url:
        print('LOGIN FAILED', r.status_code, r.url, file=sys.stderr)
        sys.exit(1)
    return s


def nonce(s, page='/wp-admin/', name='_wpnonce'):
    html = s.get(BASE + page, timeout=30).text
    m = re.search(r'wpApiSettings\s*=\s*(\{.*?\});', html)
    rest = json.loads(m.group(1))['nonce'] if m else None
    return html, rest
