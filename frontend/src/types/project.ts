export type ProjectStatus =
  | "INITIATED"
  | "IN_PRODUCTION"
  | "REVIEW"
  | "REVISION_REQUESTED"
  | "APPROVED"
  | "DELIVERED"
  | "CANCELLED"

export interface ProjectMilestone {
  id: string
  title: string
  amount_cents: number
  status: "PENDING" | "FUNDED" | "RELEASED" | "DISPUTED"
  due_date?: string
}

export interface ProjectDeliverable {
  id: string
  title: string
  asset_url?: string
  status: "PENDING" | "SUBMITTED" | "APPROVED" | "REVISION_REQUESTED"
  notes?: string
  submitted_at?: string
}

export interface ProjectMessage {
  id: string
  sender_id: string
  sender_role: string
  content: string
  timestamp: string
}

export interface ProjectWorkspace {
  id: string
  title: string
  briefId?: string
  brandId: string
  creatorId: string
  status: ProjectStatus
  agreedBudgetCents: number
  dueDate?: string
  milestones: ProjectMilestone[]
  deliverables?: ProjectDeliverable[]
  messages?: ProjectMessage[]
  createdAt: string
  updatedAt: string
}

export interface ProjectWorkspaceCreate {
  title: string
  briefId?: string
  brandId?: string
  creatorId: string
  agreedBudgetCents: number
  dueDate?: string
  milestones?: ProjectMilestone[]
  deliverables?: ProjectDeliverable[]
  messages?: ProjectMessage[]
}

export interface ProjectWorkspaceUpdate {
  status?: ProjectStatus
  milestones?: ProjectMilestone[]
  deliverables?: ProjectDeliverable[]
  messages?: ProjectMessage[]
}
