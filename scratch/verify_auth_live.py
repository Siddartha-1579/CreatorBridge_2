"""Live verification of CreatorBridge authentication workflows.
Tests:
1. Creator registration & login (via direct backend and Vite proxy)
2. Brand registration & login (via direct backend and Vite proxy)
3. Turnstile rejection handling
4. Role-based redirect path verification
5. Authenticated token verification
"""

import httpx
import uuid

base_direct = "http://127.0.0.1:8000/api/v1"
base_proxied = "http://127.0.0.1:5173/api/v1"

print("=" * 65)
print("CREATORBRIDGE: LIVE AUTHENTICATION SYSTEM VERIFICATION")
print("=" * 65)

# Step 1: Health check
r_h1 = httpx.get(f"{base_direct}/health")
r_h2 = httpx.get(f"{base_proxied}/health")
assert r_h1.status_code == 200, f"Direct health failed: {r_h1.status_code}"
assert r_h2.status_code == 200, f"Proxied health failed: {r_h2.status_code}"
print(f"[PASS] Health check verified: direct=200, proxied=200 ({r_h1.json()['status']})")

# Step 2: Creator Registration & Login
print("\n--- 1. CREATOR REGISTRATION & LOGIN TEST ---")
creator_email = f"creator_live_{uuid.uuid4().hex[:6]}@cinematic-ai.com"
test_password = "SecureLivePassword123!"

reg_c = httpx.post(f"{base_direct}/auth/register", json={
    "email": creator_email,
    "password": test_password,
    "confirmPassword": test_password,
    "fullName": "Elena Rostova AI",
    "role": "CREATOR",
    "turnstileToken": "test-turnstile-token"
})
assert reg_c.status_code == 200, f"Creator registration failed: {reg_c.text}"
c_reg_json = reg_c.json()["data"]
print(f"[PASS] Creator registered: {creator_email} (Role: {c_reg_json['user']['role']})")
print(f"       Redirect path: {c_reg_json['redirect_path']}")
assert c_reg_json["user"]["role"] == "CREATOR"
assert "/creator" in c_reg_json["redirect_path"]

# Login via Vite dev proxy (exactly what browser executes at http://localhost:5173)
login_c = httpx.post(f"{base_proxied}/auth/login", json={
    "email": creator_email,
    "password": test_password,
    "turnstileToken": "test-turnstile-token"
})
assert login_c.status_code == 200, f"Creator login via Vite proxy failed: {login_c.text}"
c_login_json = login_c.json()["data"]
print(f"[PASS] Creator logged in via Vite proxy:")
print(f"       User ID: {c_login_json['user']['id']}")
print(f"       Token received: {bool(c_login_json['access_token'])}")
print(f"       Redirect destination: {c_login_json['redirect_path']}")

# Step 3: Brand Registration & Login
print("\n--- 2. BRAND REGISTRATION & LOGIN TEST ---")
brand_email = f"brand_live_{uuid.uuid4().hex[:6]}@fashion-brand.com"

reg_b = httpx.post(f"{base_proxied}/auth/register", json={
    "email": brand_email,
    "password": test_password,
    "confirmPassword": test_password,
    "fullName": "Nova Wear Brand",
    "role": "BRAND",
    "turnstileToken": "test-turnstile-token"
})
assert reg_b.status_code == 200, f"Brand registration failed: {reg_b.text}"
b_reg_json = reg_b.json()["data"]
print(f"[PASS] Brand registered: {brand_email} (Role: {b_reg_json['user']['role']})")
print(f"       Redirect path: {b_reg_json['redirect_path']}")
assert b_reg_json["user"]["role"] == "BRAND"
assert "/brand" in b_reg_json["redirect_path"]

# Login via direct backend
login_b = httpx.post(f"{base_direct}/auth/login", json={
    "email": brand_email,
    "password": test_password,
    "turnstileToken": "test-turnstile-token"
})
assert login_b.status_code == 200, f"Brand login failed: {login_b.text}"
b_login_json = login_b.json()["data"]
print(f"[PASS] Brand logged in via direct backend:")
print(f"       User ID: {b_login_json['user']['id']}")
print(f"       Token received: {bool(b_login_json['access_token'])}")
print(f"       Redirect destination: {b_login_json['redirect_path']}")

# Step 4: Turnstile Bot Challenge Rejection
print("\n--- 3. TURNSTILE BOT PROTECTION VERIFICATION ---")
fail_res = httpx.post(f"{base_direct}/auth/login", json={
    "email": creator_email,
    "password": test_password,
    "turnstileToken": "mock-fail"
})
assert fail_res.status_code == 422, f"Expected 422, got {fail_res.status_code}"
error_msg = fail_res.json()["error"]["message"]
print(f"[PASS] Bot rejection enforced (Status: {fail_res.status_code}): '{error_msg}'")

# Step 5: Authenticated Session Verification
print("\n--- 4. AUTHENTICATED API REQUEST WITH JWT ---")
token = c_login_json["access_token"]
me_res = httpx.get(f"{base_direct}/creators/me", headers={"Authorization": f"Bearer {token}"})
print(f"[PASS] Authenticated request to /creators/me: Status {me_res.status_code}")
assert me_res.status_code == 200, f"Expected 200, got {me_res.status_code}: {me_res.text}"
print(f"       Creator profile full name: {me_res.json()['data']['full_name']}")

print("\n" + "=" * 65)
print("ALL LIVE AUTHENTICATION AND ROLE TESTS PASSED PERFECTLY!")
print("=" * 65)
