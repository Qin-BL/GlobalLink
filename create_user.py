import requests

response = requests.post('http://127.0.0.1:8000/api/v1/users/', 
                        json={'username': 'testuser', 
                             'email': 'test@example.com', 
                             'password': 'testpassword'})

print(f"Status code: {response.status_code}")
print(f"Response: {response.text}")