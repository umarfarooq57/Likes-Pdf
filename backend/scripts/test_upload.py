import os
import sys
import uuid
import time

try:
    import requests
except Exception as e:
    print('requests not installed:', e)
    sys.exit(1)

BASE_URL = os.environ.get('API_URL', 'http://127.0.0.1:8000')
# Try common upload endpoints
candidate_paths = [
    '/api/v1/upload',
    '/api/upload',
    '/api/v1/documents/upload',
    '/api/v1/upload/batch',
    '/api/v1/documents/upload/batch'
]

UPLOAD_URL = None
for p in candidate_paths:
    UPLOAD_URL = BASE_URL + p
    # quick HEAD to see if exists
    try:
        resp = requests.head(UPLOAD_URL, timeout=5)
        if resp.status_code != 404:
            break
    except Exception:
        # if HEAD fails, still try POST below
        break

# Create a small dummy file in the same directory as this script
script_dir = os.path.dirname(__file__)
fname = os.path.join(script_dir, '_dummy_upload.png')
os.makedirs(script_dir, exist_ok=True)
with open(fname, 'wb') as f:
    # Write a minimal 1x1 PNG
    f.write(
        b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc``\x00\x00\x00\x02\x00\x01\xe2!\xbc\x33\x00\x00\x00\x00IEND\xaeB`\x82'
    )

files = {'file': (os.path.basename(fname), open(fname, 'rb'), 'text/plain')}
print('Uploading to', UPLOAD_URL)
try:
    r = requests.post(UPLOAD_URL, files=files, timeout=30)
    print('Status:', r.status_code)
    try:
        print('JSON:', r.json())
    except Exception:
        print('Response text:', r.text)
except Exception as e:
    print('Request failed:', repr(e))

# cleanup
try:
    os.remove(fname)
except Exception:
    pass
