path = r'D:/DATA/Likes-Pdf-main/backend/app/core/security.py'
with open(path, 'r', encoding='utf-8') as f:
    s = f.read()
s2 = s.replace('from datetime import datetime, timedelta\n', 'from datetime import datetime, timedelta, timezone\n')
s2 = s2.replace('datetime.utcnow()', 'datetime.now(timezone.utc)')
if s2 != s:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(s2)
    print('ok')
else:
    print('no')
