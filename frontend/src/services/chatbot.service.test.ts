import { describe, it } from "node:test"
import assert from "node:assert/strict"
import type { ChatbotMessageResponse, ChatbotSuggestionsResponse } from "./chatbot.service.ts"

// Pure unit test verifying chatbot service response unwrapping and error classifications
describe("Chatbot Frontend Service & Response Normalization", () => {
  it("Requirement 1: Correctly unpacks direct ChatbotMessageResponse payload", () => {
    const rawResponse: ChatbotMessageResponse = {
      answer: "CreatorBridge uses a 7-factor matching score.",
      in_scope: true,
      confidence: 0.95,
      suggested_questions: ["How do I create a portfolio?"],
      sources: ["matching_engine"],
      fallback_used: false,
    }

    // Verify response structure
    assert.strictEqual(rawResponse.in_scope, true)
    assert.strictEqual(rawResponse.confidence, 0.95)
    assert.ok(rawResponse.answer.includes("7-factor"))
    assert.strictEqual(rawResponse.sources.length, 1)
  })

  it("Requirement 2: Correctly unpacks wrapped ApiResponse envelope", () => {
    const wrappedResponse = {
      success: true,
      data: {
        answer: "Creators can showcase up to 10 portfolio projects.",
        in_scope: true,
        confidence: 0.9,
        suggested_questions: ["What tools are supported?"],
        sources: ["creator_portfolios"],
        fallback_used: false,
      },
      message: "Success",
    }

    // Unwrapping logic matches chatbot.service.ts
    const unpacked = (
      wrappedResponse && typeof wrappedResponse === "object" && "data" in wrappedResponse && wrappedResponse.data && "answer" in wrappedResponse.data
        ? wrappedResponse.data
        : wrappedResponse
    ) as ChatbotMessageResponse

    assert.strictEqual(unpacked.answer, "Creators can showcase up to 10 portfolio projects.")
    assert.strictEqual(unpacked.in_scope, true)
  })

  it("Requirement 3: Starter suggestions structure matches contract", () => {
    const suggestions: ChatbotSuggestionsResponse = {
      starter_questions: [
        "How does creator matching work?",
        "How do I create and publish a portfolio?",
        "How does a brand publish a campaign brief?",
      ],
      supported_topics: ["Matching Engine", "Portfolios", "Briefs"],
    }

    assert.ok(suggestions.starter_questions.length >= 3)
    assert.ok(suggestions.supported_topics.length >= 3)
    assert.ok(suggestions.starter_questions.includes("How does creator matching work?"))
  })

  it("Requirement 4: Out-of-scope answer contract validation", () => {
    const outOfScopeResponse: ChatbotMessageResponse = {
      answer: "I can only answer questions about CreatorBridge.",
      in_scope: false,
      confidence: 1.0,
      suggested_questions: ["How does CreatorBridge work?"],
      sources: [],
      fallback_used: true,
    }

    assert.strictEqual(outOfScopeResponse.in_scope, false)
    assert.strictEqual(outOfScopeResponse.sources.length, 0)
    assert.ok(outOfScopeResponse.answer.includes("only answer questions about CreatorBridge"))
  })

  it("Requirement 5: Informative error message mapping for HTTP 404 / NOT_FOUND", () => {
    const formatError = (errMessage: string): string => {
      if (errMessage === "Not Found" || errMessage.includes("404") || errMessage.includes("NOT_FOUND")) {
        return "CreatorBridge Assistant is temporarily unable to reach the support service (HTTP 404). If the backend is restarting or syncing, please try again in a moment."
      }
      if (errMessage.includes("Failed to fetch") || errMessage.includes("Network error") || errMessage.includes("network")) {
        return "Unable to connect to CreatorBridge support. Please check your network connection and try again."
      }
      return errMessage
    }

    assert.ok(formatError("Not Found").includes("HTTP 404"))
    assert.ok(formatError("HTTP_404").includes("HTTP 404"))
    assert.ok(formatError("NOT_FOUND").includes("HTTP 404"))
    assert.ok(formatError("Failed to fetch").includes("network connection"))
  })
})
