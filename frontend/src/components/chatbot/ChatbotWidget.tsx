import React, { useState, useRef, useEffect } from "react"
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  AlertCircle,
  BookOpen,
} from "lucide-react"
import { chatbotService, type ChatbotMessageResponse } from "@/services/chatbot.service"

interface MessageItem {
  id: string
  sender: "user" | "assistant"
  text: string
  inScope?: boolean
  sources?: string[]
  fallbackUsed?: boolean
  timestamp: Date
}

const DEFAULT_STARTER_QUESTIONS = [
  "How does creator matching work?",
  "How do I create and publish a portfolio?",
  "How does a brand publish a campaign brief?",
  "What AI tools are supported on the platform?",
  "How does the trust score system work?",
]

export const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hello! I am your CreatorBridge platform assistant. I can answer questions about finding AI creators, publishing campaigns, portfolio setups, 7-factor matching, and troubleshooting.",
      timestamp: new Date(),
    },
  ])
  const [inputText, setInputText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [starterQuestions, setStarterQuestions] = useState<string[]>(DEFAULT_STARTER_QUESTIONS)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen, isLoading])

  // Fetch starter questions when opened for the first time
  useEffect(() => {
    if (isOpen && starterQuestions.length === DEFAULT_STARTER_QUESTIONS.length) {
      chatbotService
        .getSuggestions()
        .then((res) => {
          if (res?.starter_questions?.length) {
            setStarterQuestions(res.starter_questions)
          }
        })
        .catch(() => {
          // Keep default starter questions on error
        })
    }
  }, [isOpen])

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen])

  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText || inputText).trim()
    if (!textToSend || isLoading) return

    if (textToSend.length > 500) {
      setError("Please keep your question under 500 characters.")
      return
    }

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputText("")
    setError(null)
    setIsLoading(true)

    try {
      const response: ChatbotMessageResponse = await chatbotService.sendMessage(textToSend)

      const assistantMsg: MessageItem = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        text: response.answer,
        inScope: response.in_scope,
        sources: response.sources,
        fallbackUsed: response.fallback_used,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to reach the support assistant. Please try again."
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClearChat = () => {
    setMessages([
      {
        id: "welcome-reset",
        sender: "assistant",
        text: "Conversation cleared. How can I help you with CreatorBridge today?",
        timestamp: new Date(),
      },
    ])
    setError(null)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-[#7C4DBE] to-[#9A6ADF] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/60 focus:outline-none focus:ring-4 focus:ring-[#9A6ADF]/40"
          aria-label="Open CreatorBridge Support Assistant"
        >
          <MessageCircle className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9A6ADF] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border border-white"></span>
          </span>
        </button>
      )}

      {/* Chatbot Window Panel */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[540px] max-h-[85vh] bg-white border border-[#E5DBF5] shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#7C4DBE] to-[#9A6ADF] text-white px-4 py-3 flex items-center justify-between select-none shadow-sm">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-semibold text-sm tracking-wide leading-tight text-white">CreatorBridge Assistant</h3>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <p className="text-[11px] text-white/80 leading-tight">Platform & Workflow Support</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={handleClearChat}
                className="text-white/70 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
                title="Clear conversation"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
                aria-label="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scope Notice Banner */}
          <div className="bg-[#FAF7FD] border-b border-[#EEDDFD] px-3.5 py-1.5 text-[11px] text-[#6E48A0] flex items-center space-x-1.5">
            <BookOpen className="w-3.5 h-3.5 shrink-0 text-[#9A6ADF]" />
            <span className="truncate">Grounded strictly on CreatorBridge verified documentation.</span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FCFBFD]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`flex items-start space-x-2 max-w-[85%] ${
                    msg.sender === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs mt-0.5 ${
                      msg.sender === "user"
                        ? "bg-[#9A6ADF] text-white"
                        : "bg-[#EFE8F9] text-[#7C4DBE] border border-[#D9C4F3]"
                    }`}
                  >
                    {msg.sender === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                      msg.sender === "user"
                        ? "bg-gradient-to-r from-[#9A6ADF] to-[#7C4DBE] text-white rounded-tr-none font-medium"
                        : msg.inScope === false
                        ? "bg-amber-50 text-amber-950 border border-amber-200/80 rounded-tl-none"
                        : "bg-white text-[#111111] border border-[#E9DFF6] rounded-tl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Sources Badge */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 pt-1.5 border-t border-[#EFE8F9] flex flex-wrap gap-1">
                        {msg.sources.map((s, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center text-[10px] bg-[#F2EAFA] text-[#7C4DBE] px-1.5 py-0.5 rounded font-mono"
                          >
                            #{s.replace("faq_", "")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <span className="text-[10px] text-gray-400 mt-1 px-8">
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center space-x-2 text-xs text-[#7C4DBE] bg-white border border-[#EFE8F9] rounded-xl px-3 py-2 w-fit shadow-sm">
                <Bot className="w-4 h-4 animate-bounce text-[#9A6ADF]" />
                <span className="font-medium text-[11px]">Consulting CreatorBridge knowledge...</span>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="flex items-center space-x-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="flex-1 text-[11px]">{error}</span>
                <button
                  onClick={() => handleSend()}
                  className="font-semibold text-[11px] underline hover:text-rose-900 shrink-0"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Starter Suggestion Pills (Shown when conversation is short) */}
            {messages.length <= 2 && !isLoading && (
              <div className="pt-2">
                <p className="text-[11px] font-medium text-gray-500 mb-2">Suggested topics:</p>
                <div className="flex flex-col gap-1.5">
                  {starterQuestions.slice(0, 4).map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(q)}
                      className="text-left text-[11px] text-[#6E48A0] bg-white hover:bg-[#F7F2FD] border border-[#E8DCF7] rounded-xl px-3 py-1.5 transition-colors shadow-2xs hover:border-[#9A6ADF]/40 active:scale-[0.99]"
                    >
                      💡 {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Area */}
          <div className="p-3 bg-white border-t border-[#EFE8F9]">
            <div className="relative flex items-center bg-[#F9F7FC] border border-[#E5DBF5] rounded-xl focus-within:border-[#9A6ADF] focus-within:ring-2 focus-within:ring-[#9A6ADF]/20 transition-all">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about CreatorBridge..."
                rows={1}
                maxLength={500}
                disabled={isLoading}
                className="w-full resize-none py-2.5 pl-3 pr-10 text-xs bg-transparent focus:outline-none placeholder:text-gray-400 text-gray-800 disabled:opacity-50"
              />

              <button
                onClick={() => handleSend()}
                disabled={!inputText.trim() || isLoading}
                className="absolute right-2 p-1.5 rounded-lg bg-gradient-to-r from-[#7C4DBE] to-[#9A6ADF] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                aria-label="Send Message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-gray-400">
              <span>Enter to send · Shift+Enter for new line</span>
              <span className={inputText.length > 450 ? "text-amber-600 font-medium" : ""}>
                {inputText.length}/500
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
