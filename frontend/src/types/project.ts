export type ProjectStatus =
  | "INITIATED"
  | "IN_PRODUCTION"
  | "REVIEW"
  | "REVISION_REQUESTED"
  | "APPROVED"
  | "DELIVERED"
  | "CANCELLED"

export interface ProjectWorkspace {
  id: string
  title: string
  briefId?: string
  brandId: string
  creatorId: string
  status: ProjectStatus
  agreedBudgetCents: number
  dueDate?: string
  milestones: Array<Record<string, unknown>>
  createdAt: string
  updatedAt: string
}

export interface ProjectWorkspaceCreate {
  title: string
  briefId?: string
  brandId: string
  creatorId: string
  agreedBudgetCents: number
  dueDate?: string
  milestones?: Array<Record<string, unknown>>
}
