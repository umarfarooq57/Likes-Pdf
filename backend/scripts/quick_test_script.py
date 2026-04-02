import requests


def main():
    resp = requests.post('http://localhost:8000/api/v1/auth/register', json={
        'email': 'test99@test.com',
        'password': 'Test123456',
        'full_name': 'Test'
    })
    print('Status:', resp.status_code)
    print('Response:', resp.text)


if __name__ == '__main__':
    main()
