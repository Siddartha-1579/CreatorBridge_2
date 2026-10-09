import { AssetType } from "./portfolio"

export type GenerationJobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"

export interface GenerationJob {
  id: string
  userId: string
  projectId?: string
  providerName: string
  modality: AssetType
  status: GenerationJobStatus
  parameters: Record<string, unknown>
  resultAssetPath?: string
  resultMetadata?: Record<string, unknown>
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export interface GenerationJobCreate {
  modality: AssetType
  prompt: string
  projectId?: string
  parameters?: Record<string, unknown>
  preferredProvider?: string
}

export interface ModalityConfigInfo {
  provider: string
  status: "READY" | "UNCONFIGURED" | "RATE_LIMITED" | "DEGRADED"
  model: string
  is_fallback: boolean
}

export interface AIStatusData {
  text: ModalityConfigInfo
  image: ModalityConfigInfo
  video: ModalityConfigInfo
  voice: ModalityConfigInfo
  embedding: ModalityConfigInfo
  guardrails: {
    max_input_chars: number
    timeout_seconds: number
    max_retries: number
  }
}
