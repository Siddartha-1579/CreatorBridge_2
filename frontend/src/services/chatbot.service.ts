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
    return apiClient.post<ChatbotMessageResponse>("chatbot/message", {
      message: message.trim(),
      conversation_id: conversationId,
    })
  }

  async getSuggestions(): Promise<ChatbotSuggestionsResponse> {
    return apiClient.get<ChatbotSuggestionsResponse>("chatbot/suggestions")
  }
}

export const chatbotService = new ChatbotService()
