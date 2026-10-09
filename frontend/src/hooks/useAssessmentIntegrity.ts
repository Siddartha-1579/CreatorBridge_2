import { useEffect, useRef, useState, useCallback } from "react"

interface IntegrityState {
  tabSwitches: number
  copyAttempts: number
}

export function useAssessmentIntegrity(isActive: boolean = true) {
  const [integrityState, setIntegrityState] = useState<IntegrityState>({
    tabSwitches: 0,
    copyAttempts: 0,
  })

  const containerRef = useRef<HTMLDivElement>(null)

  // Non-punitive tab switch tracking
  useEffect(() => {
    if (!isActive) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setIntegrityState((prev) => ({
          ...prev,
          tabSwitches: prev.tabSwitches + 1,
        }))
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [isActive])

  // Clipboard deterrent strictly bounded to assessment container element
  useEffect(() => {
    if (!isActive || !containerRef.current) return
    const el = containerRef.current

    const preventCopy = (e: ClipboardEvent) => {
      // Allow legitimate inputs/textareas if needed, but deter copying question prompts
      const target = e.target as HTMLElement
      if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
        e.preventDefault()
        setIntegrityState((prev) => ({
          ...prev,
          copyAttempts: prev.copyAttempts + 1,
        }))
      }
    }

    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    el.addEventListener("copy", preventCopy)
    el.addEventListener("contextmenu", preventContextMenu)

    return () => {
      el.removeEventListener("copy", preventCopy)
      el.removeEventListener("contextmenu", preventContextMenu)
    }
  }, [isActive])

  const getIntegrityPayload = useCallback(() => {
    return {
      tab_switches: integrityState.tabSwitches,
      copy_attempts: integrityState.copyAttempts,
    }
  }, [integrityState])

  return {
    containerRef,
    integrityState,
    getIntegrityPayload,
  }
}
