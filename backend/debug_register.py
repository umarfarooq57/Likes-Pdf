import requests

resp = requests.post('http://localhost:8000/api/v1/auth/register', json={
    'email': 'debug@test.com',
    'password': 'Test123456',
    'full_name': 'Test User'
})
print('Status:', resp.status_code)
print('Headers:', dict(resp.headers))
print('Response:', resp.text)
