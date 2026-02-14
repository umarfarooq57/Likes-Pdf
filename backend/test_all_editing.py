"""Test all editing endpoints"""
import requests

BASE_URL = "http://localhost:8000/api/v1"

# Create valid PDF
PDF_CONTENT = b"""%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R 4 0 R]/Count 2>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj
4 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000052 00000 n 
0000000106 00000 n 
0000000173 00000 n 
trailer<</Size 5/Root 1 0 R>>
startxref
240
%%EOF"""

def test_endpoint(name, method, url, **kwargs):
    print(f"\n{'='*50}")
    print(f"Testing: {name}")
    print(f"{'='*50}")
    
    try:
        if method == "POST":
            r = requests.post(url, **kwargs)
        else:
            r = requests.get(url, **kwargs)
        
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            print(f"✅ SUCCESS")
            return r.json()
        else:
            print(f"❌ FAILED: {r.text[:200]}")
            return None
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return None

# Upload test file
print("\n" + "="*60)
print("UPLOADING TEST PDF (2 pages)")
print("="*60)
r = requests.post(f"{BASE_URL}/documents/upload", 
    files={"file": ("test.pdf", PDF_CONTENT, "application/pdf")})
print(f"Upload Status: {r.status_code}")

if r.status_code != 200:
    print(f"Upload failed: {r.text}")
    exit(1)

doc = r.json()
doc_id = doc["id"]
print(f"Document ID: {doc_id}")
print(f"Page count: {doc.get('page_count', 'N/A')}")

# Test Split
test_endpoint("Split - By Pages", "POST", f"{BASE_URL}/edit/split", 
    json={"document_id": doc_id, "mode": "pages", "pages": [1]})

test_endpoint("Split - By Range", "POST", f"{BASE_URL}/edit/split",
    json={"document_id": doc_id, "mode": "range", "ranges": ["1-2"]})

# Test Rotate
test_endpoint("Rotate Page 1 by 90°", "POST", f"{BASE_URL}/edit/rotate",
    json={"document_id": doc_id, "rotations": {"1": 90}})

# Test Extract Pages
test_endpoint("Extract Page 1", "POST", f"{BASE_URL}/edit/extract-pages",
    json={"document_id": doc_id, "pages": [1]})

# Test Delete Pages
test_endpoint("Delete Page 2", "POST", f"{BASE_URL}/edit/delete-pages",
    json={"document_id": doc_id, "pages": [2]})

print("\n" + "="*60)
print("ALL TESTS COMPLETE")
print("="*60)
