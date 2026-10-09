import { supabase } from "@/lib/supabase"

export const assetsService = {
  /**
   * Uploads an asset file to a Supabase Storage bucket.
   * Centralizes file upload handling outside of UI components.
   */
  async uploadAsset(
    bucket: string,
    path: string,
    file: File
  ): Promise<{ path: string; publicUrl: string }> {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    })

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`)
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path)

    return {
      path: data.path,
      publicUrl,
    }
  },

  getPublicUrl(bucket: string, path: string): string {
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(path)
    return publicUrl
  },
}
