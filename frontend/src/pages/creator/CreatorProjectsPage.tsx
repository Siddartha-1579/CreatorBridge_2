import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { projectsService } from "@/services/projects.service"
import type { ProjectWorkspace } from "@/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Briefcase, ArrowRight, ShieldCheck, DollarSign, Clock, Sparkles } from "lucide-react"

export const CreatorProjectsPage: React.FC = () => {
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
      <div className="border-b border-[#F4E7FF] pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#9A6ADF] bg-[#F4E7FF] border border-[#D8B8FF] px-2.5 py-0.5 rounded-full">
            Creator Hub
          </span>
          <Badge variant="purple">Commercial Engagements</Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
          Active Projects & Briefs
        </h1>
        <p className="text-[#4B4652] text-sm mt-1">
          Manage campaign deliverables, review milestones, and collaborate with commercial brands.
        </p>
      </div>

      {loading ? (
        <div className="p-16 text-center text-[#4B4652] text-xs">
          <div className="h-6 w-6 border-2 border-[#9A6ADF] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span>Loading active projects...</span>
        </div>
      ) : projects.length === 0 ? (
        <Card className="p-12 text-center rounded-3xl bg-white border border-[#F4E7FF] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F4E7FF] text-[#9A6ADF] flex items-center justify-center mx-auto">
            <Briefcase className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-[#111111]">No active projects yet</h3>
          <p className="text-xs text-[#4B4652] max-w-md mx-auto leading-relaxed">
            Projects are initiated when brands review your verified portfolio and accept campaign proposals. Keep your profile complete to rank higher in brand matching.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link to="/creator/portfolio">
              <Button variant="outline" size="sm" className="text-xs">
                Enhance Portfolio
              </Button>
            </Link>
            <Link to="/creator/profile">
              <Button variant="primary" size="sm" className="text-xs">
                Review Profile
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
                <div className="flex items-center gap-4 text-xs text-[#4B4652]">
                  <span className="font-mono font-semibold text-emerald-700">
                    Budget: ${(proj.agreedBudgetCents / 100).toLocaleString()}
                  </span>
                  <span>Escrow: Protected</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button variant="outline" size="sm" className="text-xs">
                  Project Workspace
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
