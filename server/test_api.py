#!/usr/bin/env python3
import urllib.request
import json
import sys

print("=== TESTING STBG ARCHIVE SERVER ===\n")

# Test login
print("1. TESTING LOGIN ENDPOINT")
print("-" * 40)
try:
    data = json.dumps({"username": "admin", "password": "admin123"}).encode('utf-8')
    req = urllib.request.Request(
        'http://localhost:3000/api/auth/login',
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req, timeout=5) as response:
        result = json.load(response)
        print("[OK] LOGIN SUCCESS!")
        print("Response:")
        print(json.dumps(result, indent=2))
        login_token = result.get('token')
        login_user = result.get('user')
except Exception as e:
    print(f"[ERROR] Login Error: {e}")
    sys.exit(1)

# Test document-types
print("\n2. TESTING DOCUMENT-TYPES ENDPOINT")
print("-" * 40)
try:
    with urllib.request.urlopen('http://localhost:3000/api/document-types', timeout=5) as response:
        result = json.load(response)
        print(f"[OK] DOCUMENT-TYPES SUCCESS!")
        print(f"Retrieved: {len(result)} document types")
        print("First 2 items:")
        print(json.dumps(result[:2], indent=2))
except Exception as e:
    print(f"[ERROR] Document Types Error: {e}")
    sys.exit(1)

print("\n" + "=" * 40)
print("[OK] ALL TESTS PASSED!")
print("Database connection verified successfully.")

