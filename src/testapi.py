import requests
url = "http://localhost:8000/deepseek"
data = {"text":""}
res = requests.post(url=url, json=data)
print(res.text)