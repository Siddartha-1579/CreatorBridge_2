import React, { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import { communityService } from "@/services/community.service"
import type { BrandCommunityPost } from "@/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MessageSquare,
  Pin,
  Heart,
  Share2,
  ExternalLink,
  Sparkles,
  Search,
  Filter,
  Megaphone,
  Trophy,
  Package,
  BookOpen,
  HelpCircle,
  Loader2,
  Building2,
  Calendar,
} from "lucide-react"

export const CreatorCommunityPage: React.FC = () => {
  const [posts, setPosts] = useState<BrandCommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [likingPostId, setLikingPostId] = useState<string | null>(null)

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
      setError(err?.message || "Could not load brand community feed.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [selectedCategory])

  const handleLike = async (postId: string) => {
    if (likingPostId) return
    setLikingPostId(postId)
    try {
      const newCount = await communityService.likePost(postId)
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes_count: newCount } : p))
      )
    } catch (err) {
      console.error("Failed to like post:", err)
    } finally {
      setLikingPostId(null)
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

  const getCategoryMeta = (category: string) => {
    switch (category) {
      case "ANNOUNCEMENT":
        return { label: "Announcement", icon: Megaphone, color: "bg-blue-50 text-blue-700 border-blue-200" }
      case "CONTEST":
        return { label: "Challenge & Bounties", icon: Trophy, color: "bg-amber-50 text-amber-700 border-amber-200" }
      case "WINNERS":
        return { label: "Winning Clips Showcase", icon: Trophy, color: "bg-emerald-50 text-emerald-700 border-emerald-200" }
      case "ASSET_PACK":
        return { label: "Asset Pack & LoRA", icon: Package, color: "bg-purple-50 text-purple-700 border-purple-200" }
      case "GUIDELINES":
        return { label: "Brand Guidelines", icon: BookOpen, color: "bg-slate-100 text-slate-800 border-slate-300" }
      default:
        return { label: category, icon: MessageSquare, color: "bg-slate-50 text-slate-700 border-slate-200" }
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F4E7FF] pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
              Brand Communities & Updates
            </h1>
            <Badge variant="purple" className="text-xs">
              Live Feed
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#4B4652] mt-1">
            Direct announcements, downloadable brand asset kits, winning clip showcases, and creative guidelines from verified brands.
          </p>
        </div>

        <Link to="/creator/campaigns">
          <Button variant="primary" size="sm" className="text-xs gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Explore Campaigns
          </Button>
        </Link>
      </div>

      {/* Categories & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#F4E7FF] shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {["ALL", "ANNOUNCEMENT", "CONTEST", "WINNERS", "ASSET_PACK", "GUIDELINES"].map((cat) => {
            const isSelected = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-[#9A6ADF] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat === "ALL"
                  ? "All Posts"
                  : cat === "ASSET_PACK"
                  ? "Asset Packs"
                  : cat === "WINNERS"
                  ? "Winning Clips"
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
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#9A6ADF] bg-slate-50/50"
          />
        </div>
      </div>

      {/* Posts Stream */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-[#9A6ADF]" />
          <span className="text-xs">Loading community announcements...</span>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs">
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={loadPosts} className="mt-3 text-xs">
            Retry
          </Button>
        </div>
      ) : filteredPosts.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-slate-200 rounded-3xl bg-slate-50/50">
          <div className="w-14 h-14 rounded-2xl bg-[#F4E7FF] border border-[#D8B8FF] flex items-center justify-center text-[#9A6ADF] mx-auto mb-4">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No community posts yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Brand announcements, new asset packs, and competition winners will appear here once brands publish them.
          </p>
        </Card>
      ) : (
        <div className="space-y-5">
          {filteredPosts.map((post) => {
            const catMeta = getCategoryMeta(post.category)
            const CatIcon = catMeta.icon

            return (
              <Card
                key={post.id}
                className={`p-6 rounded-2xl border transition-all ${
                  post.pinned
                    ? "border-[#9A6ADF]/40 bg-gradient-to-br from-[#F4E7FF]/20 via-white to-white shadow-xs"
                    : "border-[#F4E7FF] bg-white shadow-2xs hover:border-[#D8B8FF]"
                }`}
              >
                {/* Post Top Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 font-bold shrink-0">
                      {post.brand_logo_url ? (
                        <img
                          src={post.brand_logo_url}
                          alt={post.brand_name || "Brand"}
                          className="w-full h-full rounded-xl object-cover"
                        />
                      ) : (
                        <Building2 className="w-5 h-5 text-[#9A6ADF]" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#111111]">
                          {post.brand_name || "Verified Brand"}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold py-0.5 px-2 flex items-center gap-1 ${catMeta.color}`}
                        >
                          <CatIcon className="w-3 h-3" />
                          <span>{catMeta.label}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(post.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>
                  </div>

                  {post.pinned && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                      <Pin className="w-3 h-3 fill-amber-500 text-amber-600" />
                      <span>PINNED</span>
                    </div>
                  )}
                </div>

                {/* Post Content */}
                <div className="space-y-2 mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-[#111111]">
                    {post.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#4B4652] leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>
                </div>

                {/* Optional Media / Asset Pack Link */}
                {post.media_url && (
                  <div className="mb-4">
                    <a
                      href={post.media_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#F4E7FF] text-[#9A6ADF] hover:bg-[#D8B8FF]/50 border border-[#D8B8FF] transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      <span>Download Resource / Open Asset Kit</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                    </a>
                  </div>
                )}

                {/* Footer Actions */}
                <div className="pt-3 border-t border-[#F4E7FF] flex items-center justify-between text-xs text-slate-500">
                  <button
                    onClick={() => handleLike(post.id)}
                    disabled={likingPostId === post.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors font-semibold"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        post.likes_count > 0 ? "fill-rose-500 text-rose-500" : ""
                      }`}
                    />
                    <span>{post.likes_count} {post.likes_count === 1 ? "Like" : "Likes"}</span>
                  </button>

                  <Link
                    to="/creator/campaigns"
                    className="text-xs text-[#9A6ADF] font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>View Brand Campaigns</span>
                    <Sparkles className="w-3 h-3" />
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
export default CreatorCommunityPage
