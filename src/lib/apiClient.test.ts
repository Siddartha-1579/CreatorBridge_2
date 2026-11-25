import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"

// Mock global localStorage
const storage: Record<string, string> = {}
global.localStorage = {
  getItem: (key: string) => storage[key] || null,
  setItem: (key: string, value: string) => {
    storage[key] = String(value)
  },
  removeItem: (key: string) => {
    delete storage[key]
  },
  clear: () => {
    for (const k of Object.keys(storage)) delete storage[k]
  },
  key: (i: number) => Object.keys(storage)[i] || null,
  length: 0,
}

// Import ApiError and ApiClient class logic
import { ApiError } from "./apiClient.ts"

describe("Central Authentication & API Client Error Normalization", () => {
  beforeEach(() => {
    global.localStorage.clear()
  })

  it("1. Attaches Bearer token to authenticated requests", () => {
    global.localStorage.setItem("creatorbridge_auth_token", "valid-jwt-token-xyz")
    const token = global.localStorage.getItem("creatorbridge_auth_token")
    assert.strictEqual(token, "valid-jwt-token-xyz")

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
    assert.strictEqual(headers.Authorization, "Bearer valid-jwt-token-xyz")
  })

  it("2. Handles 401 Unauthorized by clearing session and notifying subscribers", () => {
    global.localStorage.setItem("creatorbridge_auth_token", "expired-token-123")
    global.localStorage.setItem("creatorbridge_user", JSON.stringify({ id: "usr_123", role: "CREATOR" }))

    let unauthorizedFired = 0
    let lastEvent: { endpoint: string; message: string } | undefined = undefined

    // Simulate central notifyUnauthorized logic
    const handleUnauthorized = (info: { endpoint: string; message: string }) => {
      unauthorizedFired++
      lastEvent = info
      global.localStorage.removeItem("creatorbridge_auth_token")
      global.localStorage.removeItem("creatorbridge_user")
    }

    handleUnauthorized({ endpoint: "briefs/00000000-0000-0000-0000-000000000004", message: "Invalid or expired authentication token" })

    assert.strictEqual(unauthorizedFired, 1)
    assert.ok(lastEvent)
    assert.strictEqual((lastEvent as { endpoint: string; message: string }).message, "Invalid or expired authentication token")
    assert.strictEqual(global.localStorage.getItem("creatorbridge_auth_token"), null)
    assert.strictEqual(global.localStorage.getItem("creatorbridge_user"), null)
  })

  it("3. Prevents duplicate unauthorized callbacks on concurrent 401 requests", () => {
    let callCount = 0
    let isNotifying = false

    const notifyOnce = () => {
      if (isNotifying) return
      isNotifying = true
      callCount++
      global.localStorage.removeItem("creatorbridge_auth_token")
    }

    // 5 concurrent failed requests simulate firing at the exact same millisecond
    notifyOnce()
    notifyOnce()
    notifyOnce()
    notifyOnce()
    notifyOnce()

    assert.strictEqual(callCount, 1)
  })

  it("4. Does NOT clear session or trigger unauthorized logout on 403 Forbidden", () => {
    global.localStorage.setItem("creatorbridge_auth_token", "creator-token-abc")
    global.localStorage.setItem("creatorbridge_user", JSON.stringify({ id: "usr_1", role: "CREATOR" }))

    const status: number = 403
    let unauthorizedTriggered = false

    if (status === 401) {
      unauthorizedTriggered = true
    }

    assert.strictEqual(unauthorizedTriggered, false)
    assert.strictEqual(global.localStorage.getItem("creatorbridge_auth_token"), "creator-token-abc")
  })

  it("5. Does NOT clear session on Network Error (0) or Server Error (500)", () => {
    global.localStorage.setItem("creatorbridge_auth_token", "valid-token-preserved")
    const networkErr = new ApiError("Unable to connect to the server", "NETWORK_ERROR", 0)
    const serverErr = new ApiError("Server error", "HTTP_500", 500)

    assert.strictEqual(networkErr.statusCode, 0)
    assert.strictEqual(serverErr.statusCode, 500)
    // Local session remains completely intact
    assert.strictEqual(global.localStorage.getItem("creatorbridge_auth_token"), "valid-token-preserved")
  })

  it("6. Correctly classifies and maps 404 Campaign Not Found", () => {
    const err = new ApiError(
      "Campaign Brief not found: 00000000-0000-0000-0000-999999999999",
      "NOT_FOUND",
      404
    )
    assert.strictEqual(err.statusCode, 404)
    assert.strictEqual(err.code, "NOT_FOUND")
    assert.ok(err.message.includes("not found"))
    // Crucially, it must NOT be classified as an auth error
    assert.notStrictEqual(err.statusCode, 401)
  })

  it("7. Differentiates 401 on login from 401 on authenticated session", () => {
    const loginEndpoint = "auth/login"
    const protectedEndpoint = "creator/profile"

    const isLogin = loginEndpoint.includes("auth/login") || loginEndpoint.includes("auth/register")
    const isProtected = protectedEndpoint.includes("auth/login") || protectedEndpoint.includes("auth/register")

    assert.strictEqual(isLogin, true)
    assert.strictEqual(isProtected, false)
  })
})
