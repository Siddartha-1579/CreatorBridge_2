import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { projectsService } from "@/services/projects.service"
import type { ProjectWorkspace } from "@/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Briefcase, Plus, Sparkles } from "lucide-react"

export const BrandProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectWorkspace[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    projectsService
      .listProjects()
      .then((data) => {
        setProjects(data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div className="border-b border-[#F4E7FF] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9A6ADF] bg-[#F4E7FF] border border-[#D8B8FF] px-2.5 py-0.5 rounded-full">
              Brand Hub
            </span>
            <Badge variant="purple">Active Collaborations</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
            Brand Projects
          </h1>
          <p className="text-[#4B4652] text-sm mt-1">
            Review creator submissions, release milestone escrow payments, and approve final deliverables.
          </p>
        </div>

        <Link to="/brand/briefs/new">
          <Button variant="primary" size="sm" className="text-xs gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            New Brief
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="p-16 text-center text-[#4B4652] text-xs">
          <div className="h-6 w-6 border-2 border-[#9A6ADF] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span>Loading project workspaces...</span>
        </div>
      ) : projects.length === 0 ? (
        <Card className="p-12 text-center rounded-3xl bg-white border border-[#F4E7FF] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F4E7FF] text-[#9A6ADF] flex items-center justify-center mx-auto">
            <Briefcase className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-[#111111]">No active projects</h3>
          <p className="text-xs text-[#4B4652] max-w-md mx-auto leading-relaxed">
            Accept proposals from creator matches on your campaign briefs to launch dedicated production workspaces with milestone escrow protection.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link to="/brand/briefs">
              <Button variant="outline" size="sm" className="text-xs">
                View Campaign Briefs
              </Button>
            </Link>
            <Link to="/brand/discover">
              <Button variant="primary" size="sm" className="text-xs">
                Discover Creators
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {projects.map((proj) => (
            <Card
              key={proj.id}
              className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl bg-white border border-[#F4E7FF] hover:border-[#D8B8FF] transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-[#111111] text-base">{proj.title}</p>
                  <Badge variant="purple">{proj.status}</Badge>
                </div>
                <p className="text-xs text-emerald-700 font-mono font-semibold">
                  Budget: ${(proj.agreedBudgetCents / 100).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button variant="outline" size="sm" className="text-xs">
                  Manage Workspace
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
