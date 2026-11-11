"""Re-zip wordpress/affinger-child from the repo and upload it (overwriting) to the live site."""
import sys, re, html as H, subprocess
sys.path.insert(0, __import__('os').path.dirname(__file__))
from wpsess import login, nonce, BASE

subprocess.run('cd /home/ubuntu/repos/gyosei-yosou/wordpress && rm -f /home/ubuntu/wp/affinger-child.zip && zip -qr /home/ubuntu/wp/affinger-child.zip affinger-child', shell=True, check=True)
s = login()
page = '/wp-admin/theme-install.php?browse=upload'
htm = s.get(BASE + page, timeout=60).text
n = re.search(r'name="_wpnonce" value="([^"]+)"', htm).group(1)
with open('/home/ubuntu/wp/affinger-child.zip', 'rb') as f:
    r = s.post(BASE + '/wp-admin/update.php?action=upload-theme', data={'_wpnonce': n, '_wp_http_referer': page, 'install-theme-submit': 'Install Now'},
               files={'themezip': ('affinger-child.zip', f, 'application/zip')}, timeout=600)
m = re.search(r'href="([^"]*overwrite=update-theme[^"]*)"', r.text)
if m:
    r = s.get(BASE + '/wp-admin/' + H.unescape(m.group(1)), timeout=600)
t = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', r.text))
i = t.find('テーマをインストールしています')
print('child upload:', r.status_code, t[i:i+250] if i >= 0 else t[-400:])
_, rest = nonce(s)
th = s.get(BASE + '/wp-json/wp/v2/themes?status=active', headers={'X-WP-Nonce': rest}, timeout=30).json()
print([(x['stylesheet'], x['version']) for x in th])
