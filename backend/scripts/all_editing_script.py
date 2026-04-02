"""Moved editing test script into scripts folder and guarded execution."""
import requests

BASE_URL = "http://localhost:8000/api/v1"

PDF_CONTENT = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"


def main():
    print('\n' + '='*60)
    print('UPLOADING TEST PDF (2 pages)')
    print('='*60)
    r = requests.post(f"{BASE_URL}/documents/upload",
                      files={"file": ("test.pdf", PDF_CONTENT, "application/pdf")})
    print(f"Upload Status: {r.status_code}")

    if r.status_code != 200:
        print(f"Upload failed: {r.text}")
        return

    doc = r.json()
    doc_id = doc.get("id")
    print(f"Document ID: {doc_id}")


if __name__ == '__main__':
    main()
