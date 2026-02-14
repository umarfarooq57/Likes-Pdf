import requests
import os

def test_upload():
    url = "http://127.0.0.1:8000/api/v1/documents/upload"
    # Create a small dummy file
    with open("test_upload.jpg", "wb") as f:
        f.write(os.urandom(1024))
    
    with open("test_upload.jpg", "rb") as f:
        files = {"file": ("test_upload.jpg", f, "image/jpeg")}
        try:
            response = requests.post(url, files=files)
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.json()}")
        except Exception as e:
            print(f"Error: {e}")
    
    if os.path.exists("test_upload.jpg"):
        os.remove("test_upload.jpg")

if __name__ == "__main__":
    test_upload()
