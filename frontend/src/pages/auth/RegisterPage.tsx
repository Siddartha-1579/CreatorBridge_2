import React, { useState, useEffect } from "react"
import { useNavigate, Link, useSearchParams } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert } from "@/components/ui/alert"
import { PolicyAgreementCheckbox } from "@/components/policy/PolicyAgreementCheckbox"
import { PlatformPoliciesModal } from "@/components/policy/PlatformPoliciesModal"
import type { UserRole } from "@/types"

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const initialRoleParam = searchParams.get("role")?.toUpperCase()
  const initialRole: UserRole =
    initialRoleParam === "BRAND" || initialRoleParam === "AGENCY" ? "BRAND" : "CREATOR"

  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>(initialRole)
  const [policyAccepted, setPolicyAccepted] = useState(false)
  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [policyError, setPolicyError] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const roleParam = searchParams.get("role")?.toUpperCase()
    if (roleParam === "BRAND" || roleParam === "AGENCY") {
      setRole("BRAND")
    } else if (roleParam === "CREATOR") {
      setRole("CREATOR")
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!policyAccepted) {
      setPolicyError(true)
      setError("You must read and agree to the CreatorBridge Platform Policies to create an account.")
      return
    }

    setIsSubmitting(true)

    try {
      await register({
        email,
        fullName,
        password,
        role,
        policyAccepted: true,
        policyVersion: "2026.1",
      })
      if (role === "BRAND" || role === "AGENCY") {
        navigate("/brand/dashboard")
      } else {
        navigate("/creator/dashboard")
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Join CreatorBridge — Where Brands Meet Creativity</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <Alert variant="error">{error}</Alert>}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Account Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("CREATOR")}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-colors ${
                    role === "CREATOR"
                      ? "bg-purple-600/20 border-purple-500 text-purple-300"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  AI Creator
                </button>
                <button
                  type="button"
                  onClick={() => setRole("BRAND")}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-colors ${
                    role === "BRAND"
                      ? "bg-purple-600/20 border-purple-500 text-purple-300"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  Brand / Agency
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Full Name</label>
              <Input
                type="text"
                placeholder="Alex Rivera"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Email Address</label>
              <Input
                type="email"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Mandatory Platform Policies Agreement Checkbox */}
            <PolicyAgreementCheckbox
              id="general-policy-agreement"
              checked={policyAccepted}
              onChange={(checked) => {
                setPolicyAccepted(checked)
                if (checked) setPolicyError(false)
              }}
              onOpenPolicies={() => setShowPolicyModal(true)}
              hasError={policyError}
              errorMessage="You must agree to the CreatorBridge Platform Policies to continue."
              policyVersion="2026.1"
            />
          </CardContent>

          <CardFooter className="flex flex-col space-y-3">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isSubmitting || !policyAccepted}
            >
              {isSubmitting ? "Creating Account..." : "Register"}
            </Button>
            <p className="text-xs text-zinc-400 text-center">
              Already have an account?{" "}
              <Link to="/login" className="text-purple-400 hover:underline">
                Sign In
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      <PlatformPoliciesModal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        onAcceptAndClose={() => {
          setPolicyAccepted(true)
          setPolicyError(false)
          setShowPolicyModal(false)
        }}
      />
    </>
  )
}
