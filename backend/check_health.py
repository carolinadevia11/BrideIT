import urllib.request
import json

def check_health():
    url = "http://localhost:8000/healthz"
    try:
        print(f"Attempting to connect to {url}...")
        with urllib.request.urlopen(url) as response:
            status = response.getcode()
            data = response.read().decode('utf-8')
            print(f"Status: {status}")
            print(f"Response: {data}")
    except urllib.error.URLError as e:
        print(f"Failed to connect: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    check_health()