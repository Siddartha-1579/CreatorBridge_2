import React, { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
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
  const lastAttemptedTextRef = useRef<string>("")

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
    const textToSend = (overrideText ?? inputText).trim()
    if (!textToSend || isLoading) return

    if (textToSend.length > 500) {
      setError("Please keep your question under 500 characters.")
      return
    }

    lastAttemptedTextRef.current = textToSend

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
      let errorMsg = "The CreatorBridge support service is temporarily unreachable. Please try again shortly."
      if (err instanceof Error) {
        const msg = err.message
        if (msg === "Not Found" || msg.includes("404") || msg.includes("NOT_FOUND")) {
          errorMsg =
            "CreatorBridge Assistant is temporarily unable to reach the support service (HTTP 404). If the backend is restarting or syncing, please try again in a moment."
        } else if (msg.includes("Failed to fetch") || msg.includes("Network error") || msg.includes("network")) {
          errorMsg =
            "Unable to connect to CreatorBridge support. Please check your network connection and try again."
        } else if (msg.trim()) {
          errorMsg = msg
        }
      }
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading && inputText.trim()) {
        handleSend()
      }
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
    lastAttemptedTextRef.current = ""
  }

  return createPortal(
    <>
      {/* Floating Launcher Button — rendered directly in document.body with no outer square wrapper */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group flex items-center justify-center w-14 h-14 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border-2 focus:outline-none"
          style={{
            backgroundColor: "var(--accent-primary)",
            borderColor: "var(--accent-glow)",
            color: "var(--bg-page)",
          }}
          aria-label="Open CreatorBridge Support Assistant"
        >
          <MessageCircle className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: "var(--accent-primary)" }}
            ></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border border-white dark:border-[#0F0D15]"></span>
          </span>
        </button>
      )}

      {/* Chatbot Window Panel */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 font-sans w-[360px] sm:w-[400px] h-[540px] max-h-[85vh] border shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-subtle)",
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between select-none shadow-sm"
            style={{
              background: "linear-gradient(135deg, var(--accent-primary), var(--accent-hover))",
              color: "var(--bg-page)",
            }}
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-semibold text-sm tracking-wide leading-tight">
                    CreatorBridge Assistant
                  </h3>
                  <Sparkles className="w-3.5 h-3.5 opacity-90" />
                </div>
                <p className="text-[11px] opacity-85 leading-tight">Platform & Workflow Support</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={handleClearChat}
                className="opacity-80 hover:opacity-100 p-1 rounded-md hover:bg-black/10 transition-colors"
                title="Clear conversation"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="opacity-80 hover:opacity-100 p-1 rounded-md hover:bg-black/10 transition-colors"
                aria-label="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scope Notice Banner */}
          <div
            className="border-b px-3.5 py-1.5 text-[11px] flex items-center space-x-1.5"
            style={{
              backgroundColor: "var(--bg-subtle)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-muted)",
            }}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent-primary)" }} />
            <span className="truncate">Grounded strictly on CreatorBridge verified documentation.</span>
          </div>

          {/* Messages Stream */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3"
            style={{ backgroundColor: "var(--bg-page)" }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`flex items-start space-x-2 max-w-[85%] ${msg.sender === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"
                    }`}
                >
                  <div
                    className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs mt-0.5 border"
                    style={
                      msg.sender === "user"
                        ? {
                          backgroundColor: "var(--accent-primary)",
                          borderColor: "var(--accent-primary)",
                          color: "var(--bg-page)",
                        }
                        : {
                          backgroundColor: "var(--bg-subtle)",
                          borderColor: "var(--border-subtle)",
                          color: "var(--accent-primary)",
                        }
                    }
                  >
                    {msg.sender === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${msg.sender === "user"
                      ? "rounded-tr-none font-medium"
                      : msg.inScope === false
                        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/60 rounded-tl-none"
                        : "border rounded-tl-none"
                      }`}
                    style={
                      msg.sender === "user"
                        ? {
                          backgroundColor: "var(--accent-primary)",
                          color: "var(--bg-page)",
                        }
                        : msg.inScope === false
                          ? undefined
                          : {
                            backgroundColor: "var(--bg-surface)",
                            borderColor: "var(--border-subtle)",
                            color: "var(--text-primary)",
                          }
                    }
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Sources Badge */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div
                        className="mt-2 pt-1.5 border-t flex flex-wrap gap-1"
                        style={{ borderColor: "var(--border-subtle)" }}
                      >
                        {msg.sources.map((s, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded font-mono"
                            style={{
                              backgroundColor: "var(--accent-soft)",
                              color: "var(--accent-primary)",
                            }}
                          >
                            #{s.replace("faq_", "")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <span className="text-[10px] mt-1 px-8" style={{ color: "var(--text-muted)" }}>
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div
                className="flex items-center space-x-2 text-xs border rounded-xl px-3 py-2 w-fit shadow-sm"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--accent-primary)",
                }}
              >
                <Bot className="w-4 h-4 animate-bounce" />
                <span className="font-medium text-[11px]">Consulting CreatorBridge knowledge...</span>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="flex items-center space-x-2 text-xs text-rose-700 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 rounded-xl px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span className="flex-1 text-[11px] leading-snug">{error}</span>
                <button
                  onClick={() => handleSend(lastAttemptedTextRef.current)}
                  disabled={isLoading || !lastAttemptedTextRef.current}
                  className="font-semibold text-[11px] underline hover:text-rose-900 dark:hover:text-white shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Starter Suggestion Pills (Shown when conversation is short) */}
            {messages.length <= 2 && !isLoading && (
              <div className="pt-2">
                <p className="text-[11px] font-medium mb-2" style={{ color: "var(--text-muted)" }}>
                  Suggested topics:
                </p>
                <div className="flex flex-col gap-1.5">
                  {starterQuestions.slice(0, 4).map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(q)}
                      disabled={isLoading}
                      className="text-left text-[11px] font-medium border rounded-xl px-3 py-2 transition-colors shadow-2xs active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      style={{
                        backgroundColor: "var(--bg-surface)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-primary)",
                      }}
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
          <div
            className="p-3 border-t"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div
              className="relative flex items-center border rounded-xl transition-all"
              style={{
                backgroundColor: "var(--bg-subtle)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about CreatorBridge..."
                rows={1}
                maxLength={500}
                disabled={isLoading}
                className="w-full resize-none py-2.5 pl-3 pr-10 text-xs bg-transparent focus:outline-none disabled:opacity-50"
                style={{ color: "var(--text-primary)" }}
              />

              <button
                onClick={() => handleSend()}
                disabled={!inputText.trim() || isLoading}
                className="absolute right-2 p-1.5 rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                style={{
                  backgroundColor: "var(--accent-primary)",
                  color: "var(--bg-page)",
                }}
                aria-label="Send Message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

            <div
              className="flex items-center justify-between mt-1.5 px-1 text-[10px]"
              style={{ color: "var(--text-muted)" }}
            >
              <span>Enter to send · Shift+Enter for new line</span>
              <span className={inputText.length > 450 ? "text-amber-600 dark:text-amber-400 font-medium" : ""}>
                {inputText.length}/500
              </span>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  )
}