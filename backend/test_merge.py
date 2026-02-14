"""Quick test script for merge API"""
import requests

# Minimal valid PDF
PDF_CONTENT = b"""%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000052 00000 n 
0000000101 00000 n 
trailer<</Size 4/Root 1 0 R>>
startxref
178
%%EOF"""

BASE_URL = "http://localhost:8000/api/v1"

print("=== DocuForge Merge Test ===\n")

# Upload first file
print("1. Uploading first PDF...")
r1 = requests.post(f"{BASE_URL}/documents/upload", 
    files={"file": ("test1.pdf", PDF_CONTENT, "application/pdf")})
print(f"   Status: {r1.status_code}")
if r1.status_code != 200:
    print(f"   Error: {r1.text}")
    exit(1)
doc1 = r1.json()
print(f"   Doc ID: {doc1['id']}")

# Upload second file
print("\n2. Uploading second PDF...")
r2 = requests.post(f"{BASE_URL}/documents/upload", 
    files={"file": ("test2.pdf", PDF_CONTENT, "application/pdf")})
print(f"   Status: {r2.status_code}")
if r2.status_code != 200:
    print(f"   Error: {r2.text}")
    exit(1)
doc2 = r2.json()
print(f"   Doc ID: {doc2['id']}")

# Merge
print("\n3. Merging PDFs...")
merge_data = {"document_ids": [doc1["id"], doc2["id"]]}
print(f"   Request: {merge_data}")
r3 = requests.post(f"{BASE_URL}/edit/merge", json=merge_data)
print(f"   Status: {r3.status_code}")
print(f"   Response: {r3.text}")

if r3.status_code == 200:
    print("\n✅ MERGE SUCCESSFUL!")
else:
    print("\n❌ MERGE FAILED!")
