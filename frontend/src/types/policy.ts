export interface PolicySection {
  id: string
  title: string
  category: string
  summary: string
  content: string
  key_rules?: string[]
}

export interface PlatformPolicy {
  version: string
  policyReference: string
  status: string
  effectiveDate: string
  title: string
  sections: PolicySection[]
  metadata?: Record<string, any>
}

export interface PolicyStatus {
  userId?: string
  currentVersion: string
  currentReference: string
  accepted: boolean
  acceptedVersion?: string | null
  acceptedAt?: string | null
  requiresAcceptance: boolean
}

export interface PolicyAcceptancePayload {
  policyVersion: string
}

export interface PolicyAcceptanceRecord {
  id: string
  userId: string
  policyVersion: string
  policyReference: string
  acceptedAt: string
  ipAddress?: string
}
