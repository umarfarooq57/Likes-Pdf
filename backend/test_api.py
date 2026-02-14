"""
DocuForge API Test Script
Tests all major endpoints
"""
import requests
import os
import time

BASE_URL = 'http://localhost:8000/api/v1'
TOKEN = None
TIMEOUT = 10  # seconds


def test_health():
    """Test health endpoints"""
    print("\n" + "="*50)
    print("🔍 Testing Health Endpoints")
    print("="*50)

    # Root endpoint
    resp = requests.get('http://localhost:8000/', timeout=TIMEOUT)
    print(f"✅ Root: {resp.status_code} - {resp.json()['status']}")

    # Health check
    resp = requests.get('http://localhost:8000/health', timeout=TIMEOUT)
    print(f"✅ Health: {resp.status_code} - {resp.json()}")

    return True


def test_auth():
    """Test authentication endpoints"""
    global TOKEN
    print("\n" + "="*50)
    print("🔐 Testing Authentication")
    print("="*50)

    # Register
    email = f"test_{int(time.time())}@docuforge.com"
    try:
        resp = requests.post(f'{BASE_URL}/auth/register', json={
            'email': email,
            'password': 'TestPass123!',
            'full_name': 'Test User'
        }, timeout=TIMEOUT)
        print(f"📝 Register: {resp.status_code}")
        if resp.status_code not in [200, 201, 400]:  # 400 if already exists
            print(f"   Response: {resp.text[:100]}")
    except requests.exceptions.Timeout:
        print("📝 Register: TIMEOUT")
        return False
    except Exception as e:
        print(f"📝 Register: ERROR - {e}")
        return False

    # Login
    try:
        resp = requests.post(f'{BASE_URL}/auth/login', data={
            'username': email,
            'password': 'TestPass123!'
        }, timeout=TIMEOUT)
        print(f"🔑 Login: {resp.status_code}")

        if resp.status_code == 200:
            TOKEN = resp.json().get('access_token')
            print(f"   Token received: {TOKEN[:30]}...")
            return True
        else:
            print(f"   Error: {resp.text[:100]}")
            return False
    except requests.exceptions.Timeout:
        print("🔑 Login: TIMEOUT")
        return False
    except Exception as e:
        print(f"🔑 Login: ERROR - {e}")
        return False


def test_upload():
    """Test document upload"""
    print("\n" + "="*50)
    print("📤 Testing Document Upload")
    print("="*50)

    if not TOKEN:
        print("❌ No token, skipping upload test")
        return False

    headers = {'Authorization': f'Bearer {TOKEN}'}

    # Create a simple test file
    test_content = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n168\n%%EOF"

    files = {'file': ('test.pdf', test_content, 'application/pdf')}

    resp = requests.post(f'{BASE_URL}/documents/upload',
                         headers=headers, files=files)
    print(f"📄 Upload: {resp.status_code}")

    if resp.status_code in [200, 201]:
        doc_id = resp.json().get('id')
        print(f"   Document ID: {doc_id}")
        return doc_id
    else:
        print(f"   Error: {resp.text[:200]}")
        return None


def test_list_documents():
    """Test document listing"""
    print("\n" + "="*50)
    print("📋 Testing Document List")
    print("="*50)

    if not TOKEN:
        print("❌ No token, skipping")
        return False

    headers = {'Authorization': f'Bearer {TOKEN}'}
    resp = requests.get(f'{BASE_URL}/documents', headers=headers)
    print(f"📑 List: {resp.status_code}")

    if resp.status_code == 200:
        data = resp.json()
        if isinstance(data, list):
            print(f"   Found {len(data)} documents")
        elif isinstance(data, dict):
            print(f"   Response: {list(data.keys())}")
        return True
    else:
        print(f"   Error: {resp.text[:100]}")
        return False


def test_api_docs():
    """Test OpenAPI documentation"""
    print("\n" + "="*50)
    print("📚 Testing API Documentation")
    print("="*50)

    resp = requests.get(f'{BASE_URL}/openapi.json')
    print(f"📖 OpenAPI: {resp.status_code}")

    if resp.status_code == 200:
        data = resp.json()
        paths = list(data.get('paths', {}).keys())
        print(f"   Total endpoints: {len(paths)}")
        print(f"   Sample paths: {paths[:5]}")
        return True
    return False


def main():
    print("\n" + "🚀"*25)
    print("    DocuForge API Test Suite")
    print("🚀"*25)

    results = {
        'health': test_health(),
        'auth': test_auth(),
        'upload': test_upload(),
        'list': test_list_documents(),
        'docs': test_api_docs(),
    }

    print("\n" + "="*50)
    print("📊 Test Results Summary")
    print("="*50)

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {name}: {status}")

    print(f"\n   Total: {passed}/{total} passed")
    print("="*50)


if __name__ == '__main__':
    main()
