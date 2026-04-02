"""
Quick test script for Phase 0 MVP (moved out of pytest discovery)
"""
import requests
import json
import time
import os

BASE_URL = "http://localhost:8000"


def test_health():
    """Test health endpoint"""
    print("\n=== Testing Health Endpoint ===")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200


def main():
    if not test_health():
        print("Health check failed. Is the server running?")


if __name__ == "__main__":
    main()
