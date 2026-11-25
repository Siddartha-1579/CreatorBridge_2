/**
 * CreatorBridge Support Chatbot Service
 *
 * Dispatches questions to the isolated /api/v1/chatbot endpoints.
 */

import { apiClient } from "@/lib/apiClient"

export interface ChatbotMessageResponse {
  answer: string
  in_scope: boolean
  confidence: number
  suggested_questions: string[]
  sources: string[]
  fallback_used: boolean
}

export interface ChatbotSuggestionsResponse {
  starter_questions: string[]
  supported_topics: string[]
}

class ChatbotService {
  async sendMessage(message: string, conversationId?: string): Promise<ChatbotMessageResponse> {
    const res = await apiClient.post<any>("chatbot/message", {
      message: message.trim(),
      conversation_id: conversationId,
    })
    // Support both direct ChatbotMessageResponse and wrapped ApiResponse<ChatbotMessageResponse>
    if (res && typeof res === "object" && "data" in res && res.data && "answer" in res.data) {
      return res.data as ChatbotMessageResponse
    }
    return res as ChatbotMessageResponse
  }

  async getSuggestions(): Promise<ChatbotSuggestionsResponse> {
    const res = await apiClient.get<any>("chatbot/suggestions")
    if (res && typeof res === "object" && "data" in res && res.data && "starter_questions" in res.data) {
      return res.data as ChatbotSuggestionsResponse
    }
    return res as ChatbotSuggestionsResponse
  }
}

export const chatbotService = new ChatbotService()
