import { apiClient } from "@/lib/apiClient"
import type { BrandCommunityPost, BrandCommunityPostCreate } from "@/types"

export const communityService = {
  async listPosts(brandId?: string, category?: string): Promise<BrandCommunityPost[]> {
    const params: Record<string, string | undefined> = {}
    if (brandId) params.brand_id = brandId
    if (category && category !== "ALL") params.category = category
    return apiClient.get<BrandCommunityPost[]>("campaigns/community/posts", { params })
  },

  async createPost(data: BrandCommunityPostCreate): Promise<BrandCommunityPost> {
    return apiClient.post<BrandCommunityPost>("campaigns/community/posts", data)
  },

  async deletePost(postId: string): Promise<boolean> {
    return apiClient.delete<boolean>(`campaigns/community/posts/${postId}`)
  },

  async likePost(postId: string): Promise<number> {
    return apiClient.post<number>(`campaigns/community/posts/${postId}/like`)
  },
}
