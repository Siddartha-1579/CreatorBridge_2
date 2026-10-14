import React, { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import { communityService } from "@/services/community.service"
import type { BrandCommunityPost, BrandCommunityPostCreate } from "@/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MessageSquare,
  Plus,
  Pin,
  Trash2,
  Heart,
  Package,
  Megaphone,
  Trophy,
  BookOpen,
  Calendar,
  ExternalLink,
  Sparkles,
  Loader2,
  X,
  Search,
} from "lucide-react"

export const BrandCommunityPage: React.FC = () => {
  const [posts, setPosts] = useState<BrandCommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  // Create Post Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("ANNOUNCEMENT")
  const [mediaUrl, setMediaUrl] = useState("")
  const [pinned, setPinned] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const loadPosts = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await communityService.listPosts(
        undefined,
        selectedCategory !== "ALL" ? selectedCategory : undefined
      )
      setPosts(data || [])
    } catch (err: any) {
      console.error("Failed to load community posts:", err)
      setError(err?.message || "Could not retrieve community posts.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [selectedCategory])

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      setCreateError("Please provide both a title and content for your update.")
      return
    }

    setIsSubmitting(true)
    setCreateError(null)

    try {
      const newPost = await communityService.createPost({
        title: title.trim(),
        content: content.trim(),
        category,
        media_url: mediaUrl.trim() || undefined,
        pinned,
      })

      setPosts((prev) => [newPost, ...prev])
      setIsCreateModalOpen(false)
      setTitle("")
      setContent("")
      setCategory("ANNOUNCEMENT")
      setMediaUrl("")
      setPinned(false)
    } catch (err: any) {
      console.error("Failed to create community post:", err)
      setCreateError(err?.message || "Failed to publish post.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this community post?")) return
    try {
      await communityService.deletePost(postId)
      setPosts((prev) => prev.filter((p) => p.id !== postId))
    } catch (err: any) {
      alert(err?.message || "Failed to delete post.")
    }
  }

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts
    const q = searchQuery.toLowerCase()
    return posts.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.content?.toLowerCase().includes(q) ||
        p.brand_name?.toLowerCase().includes(q)
    )
  }, [posts, searchQuery])

  const getCategoryMeta = (cat: string) => {
    switch (cat) {
      case "ANNOUNCEMENT":
        return { label: "Announcement", icon: Megaphone, color: "bg-blue-50 text-blue-700 border-blue-200" }
      case "CONTEST":
        return { label: "Challenge & Bounty", icon: Trophy, color: "bg-amber-50 text-amber-700 border-amber-200" }
      case "WINNERS":
        return { label: "Winning Clips Showcase", icon: Trophy, color: "bg-emerald-50 text-emerald-700 border-emerald-200" }
      case "ASSET_PACK":
        return { label: "Asset Pack & LoRA", icon: Package, color: "bg-purple-50 text-purple-700 border-purple-200" }
      case "GUIDELINES":
        return { label: "Creative Guidelines", icon: BookOpen, color: "bg-slate-100 text-slate-800 border-slate-300" }
      default:
        return { label: cat, icon: MessageSquare, color: "bg-slate-50 text-slate-700 border-slate-200" }
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Brand Community Board
            </h1>
            <Badge variant="purple" className="text-xs">
              Direct Creator Broadcasts
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Publish downloadable asset kits, creative guidelines, milestone updates, and announce winning creator submissions.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold gap-1.5 shadow-md shadow-purple-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Community Post</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-purple-100 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {["ALL", "ANNOUNCEMENT", "CONTEST", "WINNERS", "ASSET_PACK", "GUIDELINES"].map((cat) => {
            const isSelected = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat === "ALL"
                  ? "All Posts"
                  : cat === "ASSET_PACK"
                  ? "Asset Packs"
                  : cat === "WINNERS"
                  ? "Winners"
                  : cat.charAt(0) + cat.slice(1).toLowerCase()}
              </button>
            )
          })}
        </div>

        <div className="relative sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search updates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Posts Stream */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <span className="text-xs">Loading community updates...</span>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs">
          <p>{error}</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-slate-200 rounded-3xl bg-slate-50/50">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 mx-auto mb-4">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No community posts yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Share creative guides, asset bundles, or announce winners to creators participating in your campaigns.
          </p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Publish First Post
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => {
            const catMeta = getCategoryMeta(post.category)
            const CatIcon = catMeta.icon

            return (
              <Card
                key={post.id}
                className={`p-6 rounded-2xl border transition-all ${
                  post.pinned
                    ? "border-purple-300 bg-gradient-to-br from-purple-50/30 via-white to-white shadow-xs"
                    : "border-purple-100 bg-white shadow-2xs hover:border-purple-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-sm text-slate-900">
                      {post.brand_name || "Your Brand"}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold py-0.5 px-2 flex items-center gap-1 ${catMeta.color}`}
                    >
                      <CatIcon className="w-3 h-3" />
                      <span>{catMeta.label}</span>
                    </Badge>
                    <span className="text-[11px] text-slate-400">
                      {new Date(post.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {post.pinned && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                        <Pin className="w-3 h-3 fill-amber-500 text-amber-600" />
                        <span>PINNED</span>
                      </span>
                    )}
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Post"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 mb-4">
                  <h3 className="text-base font-bold text-slate-900">{post.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>
                </div>

                {post.media_url && (
                  <div className="mb-4">
                    <a
                      href={post.media_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Attached Asset Kit / Resource</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  <span>{post.likes_count} Creator Likes</span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* CREATE POST MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                Brand Broadcast
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2">
                New Community Announcement
              </h2>
              <p className="text-xs text-slate-500">
                This post will be visible to all creators browsing the community and participating in your campaigns.
              </p>
            </div>

            {createError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Asset Pack v2.0 Available: High-Res 3D Packaging Renders"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50/50"
                  >
                    <option value="ANNOUNCEMENT">Announcement</option>
                    <option value="CONTEST">Challenge & Bounty</option>
                    <option value="WINNERS">Winners Showcase</option>
                    <option value="ASSET_PACK">Asset Pack & LoRA</option>
                    <option value="GUIDELINES">Brand Guidelines</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Download / Asset URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Content / Instructions <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Provide complete guidelines, key tips for creators, acceptable prompt techniques, and any requirements..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50/50"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinToggle"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="pinToggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Pin this post to the top of the community board
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Publishing...
                    </>
                  ) : (
                    "Publish Announcement"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
export default BrandCommunityPage
