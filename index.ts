import type { Plugin } from "@opencode-ai/plugin"
import type {
  Event,
  EventSessionCreated,
  EventSessionUpdated,
  Session,
} from "@opencode-ai/sdk"

/**
 * Converts a session ID to a consistent UUID format.
 * Uses Bun's hash function to generate a deterministic UUID from the session ID.
 */
function sessionToUUID(sessionId: string): string {
  const hash = Bun.hash(sessionId)
  const hashHex = hash.toString(16).padStart(16, "0")

  const fullHex = (hashHex + hashHex).slice(0, 32)
  return [
    fullHex.slice(0, 8),
    fullHex.slice(8, 12),
    fullHex.slice(12, 16),
    fullHex.slice(16, 20),
    fullHex.slice(20, 32),
  ].join("-")
}

/**
 * Sanitizes a value to prevent HTTP header injection.
 */
function sanitizeForHeader(value: string): string {
  return value.replace(/[\r\n\x00-\x1f\x7f]/g, "").trim()
}

// Global session state that the custom fetch can access
let currentSessionUUID = ""
let currentSessionName = ""

/**
 * OpenCode plugin for Helicone session tracking.
 *
 * Uses a custom fetch wrapper to inject Helicone session headers dynamically
 * on every request.
 *
 * ## Configuration
 *
 * ```json
 * {
 *   "plugin": ["opencode-helicone-session"],
 *   "provider": {
 *     "helicone": {
 *       "npm": "@ai-sdk/openai-compatible",
 *       "options": {
 *         "baseURL": "https://anthropic.helicone.ai"
 *       }
 *     }
 *   }
 * }
 * ```
 */
export const OpenCodeHeliconeSession: Plugin = async (ctx) => {
  let currentSession: Session | null = null

  const updateSessionInfo = () => {
    if (currentSession) {
      currentSessionUUID = sessionToUUID(currentSession.id)
      currentSessionName = sanitizeForHeader(
        currentSession.title || `Session ${new Date().toISOString()}`
      )
    }
  }

  return {
    // Provide auth loader that injects custom fetch
    auth: {
      provider: "helicone",
      methods: [],
      loader: async (_auth, _provider) => {
        // Return a custom fetch that adds Helicone headers
        return {
          fetch: (url: string | URL | Request, init?: RequestInit) => {
            const headers = new Headers(init?.headers)

            // Only set if user hasn't specified their own
            if (currentSessionUUID && !headers.has("Helicone-Session-Id")) {
              headers.set("Helicone-Session-Id", currentSessionUUID)
            }
            if (currentSessionName && !headers.has("Helicone-Session-Name")) {
              headers.set("Helicone-Session-Name", currentSessionName)
            }

            return fetch(url, {
              ...init,
              headers,
            })
          },
        }
      },
    },

    // Handle session events
    event: async ({ event }: { event: Event }) => {
      if (event.type === "session.created") {
        const sessionEvent = event as EventSessionCreated
        currentSession = sessionEvent.properties.info
        updateSessionInfo()
      } else if (event.type === "session.updated") {
        const sessionEvent = event as EventSessionUpdated
        currentSession = sessionEvent.properties.info
        updateSessionInfo()
      }
    },
  }
}

export default OpenCodeHeliconeSession
