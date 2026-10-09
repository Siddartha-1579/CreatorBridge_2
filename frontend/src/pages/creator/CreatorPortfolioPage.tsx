import React, { useState, useEffect } from "react"
import { portfoliosService } from "@/services/portfolios.service"
import { creatorsService } from "@/services/creators.service"
import type { PortfolioProject, AssetType } from "@/types"
import { PortfolioProject3DCard } from "@/components/portfolio/PortfolioProject3DCard"
import { ProjectDetailModal } from "@/components/portfolio/ProjectDetailModal"
import { ProjectFormModal } from "@/components/portfolio/ProjectFormModal"
import {
  Plus,
  Video,
  Image as ImageIcon,
  Film,
  Music,
  FolderKanban,
  Sparkles,
  Layers,
  Loader2,
  Filter,
} from "lucide-react"

export const CreatorPortfolioPage: React.FC = () => {
  const [projects, setProjects] = useState<PortfolioProject[]>([])
  const [activeFilter, setActiveFilter] = useState<string>("ALL")
  const [loading, setLoading] = useState(true)
  const [creatorId, setCreatorId] = useState<string>("")

  // Modals state
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null)

  const loadProjects = async () => {
    try {
      const profile = await creatorsService.getMyProfile()
      setCreatorId(profile.id)
      const items = await portfoliosService.listProjects(profile.id, false)
      setProjects(items)
    } catch (err) {
      console.error("Failed to load portfolio projects:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleToggleVisibility = async (project: PortfolioProject) => {
    const nextVis = project.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC"
    try {
      await portfoliosService.toggleVisibility(project.id, nextVis)
      loadProjects()
    } catch (err) {
      console.error("Failed to update visibility:", err)
    }
  }

  const handleDeleteProject = async (project: PortfolioProject) => {
    if (window.confirm(`Are you sure you want to delete "${project.title}"?`)) {
      try {
        await portfoliosService.deleteProject(project.id)
        loadProjects()
      } catch (err) {
        console.error("Failed to delete project:", err)
      }
    }
  }

  const filteredProjects = projects.filter((p) => {
    if (activeFilter === "ALL") return true
    return p.media_type === activeFilter
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              AI Portfolio & Creative Showcases
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
              {projects.length} Showcases
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Showcase your prompt outputs, motion video reels, and reproducible multi-stage pipelines to enterprise brands.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProject(null)
            setIsFormOpen(true)
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm shadow-purple-600/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add New Project
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          Filter:
        </span>
        {[
          { label: "All Media", value: "ALL" },
          { label: "AI Video", value: "VIDEO" },
          { label: "AI Image", value: "IMAGE" },
          { label: "Animation", value: "ANIMATION" },
          { label: "Audio & Voice", value: "AUDIO" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveFilter(tab.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              activeFilter === tab.value
                ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                : "bg-white text-slate-600 border-slate-200 hover:border-purple-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid of 3D Cards */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <span>Loading portfolio showcases...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-white border border-dashed border-purple-200 space-y-3">
          <FolderKanban className="w-12 h-12 text-purple-300 mx-auto" />
          <h3 className="font-semibold text-slate-900 text-base">No showcases found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeFilter === "ALL"
              ? "Start building your AI portfolio by adding a video commercial, image series, or prompt pipeline."
              : `No showcases found matching "${activeFilter}".`}
          </p>
          <button
            onClick={() => {
              setEditingProject(null)
              setIsFormOpen(true)
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Upload Showcase Asset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <PortfolioProject3DCard
              key={project.id}
              project={project}
              isOwner={true}
              onSelect={(p) => {
                setSelectedProject(p)
                setIsDetailOpen(true)
              }}
              onEdit={(p) => {
                setEditingProject(p)
                setIsFormOpen(true)
              }}
              onToggleVisibility={handleToggleVisibility}
              onDelete={handleDeleteProject}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ProjectDetailModal
        project={selectedProject}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedProject(null)
        }}
        onEdit={(p) => {
          setEditingProject(p)
          setIsFormOpen(true)
        }}
        isOwner={true}
      />

      <ProjectFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingProject(null)
        }}
        onSave={loadProjects}
        initialProject={editingProject}
      />
    </div>
  )
}
