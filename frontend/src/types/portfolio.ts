export type AssetType = 
  | "IMAGE" 
  | "VIDEO" 
  | "ANIMATION" 
  | "AUDIO" 
  | "GRAPHIC" 
  | "TEXT" 
  | "STORYBOARD" 
  | "WORKFLOW"

export type CommercialUseStatus = 
  | "COMMERCIAL_READY"
  | "COMMERCIAL_USE_WITH_PERMISSION"
  | "PERSONAL_PROJECT"
  | "UNKNOWN"

export type AIGenerationType = 
  | "AI_GENERATED"
  | "AI_ASSISTED"

export type ProjectVisibility = 
  | "PUBLIC"
  | "PRIVATE"
  | "UNPUBLISHED"

export interface WorkflowStage {
  stage_name: string
  description: string
  tools_used: string[]
}

export interface PortfolioProject {
  id: string
  creator_id: string
  title: string
  description?: string
  category: string
  content_type: string
  media_type: AssetType
  thumbnail_url?: string
  media_url: string
  tools: string[]
  models: string[]
  skills: string[]
  workflow_summary?: string
  workflow_stages: WorkflowStage[]
  aspect_ratio: string
  resolution: string
  duration_seconds?: number
  commercial_use_status: CommercialUseStatus
  ai_generation_type: AIGenerationType
  visibility: ProjectVisibility
  is_featured: boolean
  external_url?: string
  verification_status: string
  public_url?: string
  created_at: string
  updated_at: string
}

export interface PortfolioProjectCreate {
  title: string
  description?: string
  category: string
  content_type: string
  media_type: AssetType
  thumbnail_url?: string
  media_url: string
  tools: string[]
  models?: string[]
  skills?: string[]
  workflow_summary?: string
  workflow_stages?: WorkflowStage[]
  aspect_ratio: string
  resolution: string
  duration_seconds?: number
  commercial_use_status: CommercialUseStatus
  ai_generation_type: AIGenerationType
  visibility: ProjectVisibility
  is_featured?: boolean
  external_url?: string
}

export interface PortfolioProjectUpdate {
  title?: string
  description?: string
  category?: string
  content_type?: string
  media_type?: AssetType
  thumbnail_url?: string
  media_url?: string
  tools?: string[]
  models?: string[]
  skills?: string[]
  workflow_summary?: string
  workflow_stages?: WorkflowStage[]
  aspect_ratio?: string
  resolution?: string
  duration_seconds?: number
  commercial_use_status?: CommercialUseStatus
  ai_generation_type?: AIGenerationType
  visibility?: ProjectVisibility
  is_featured?: boolean
  external_url?: string
}

export interface PortfolioUploadResponse {
  storage_path: string
  public_url: string
  media_type: string
  file_size_bytes: number
}

// Backward compatibility aliases
export type PortfolioItem = PortfolioProject
export type PortfolioItemCreate = PortfolioProjectCreate
