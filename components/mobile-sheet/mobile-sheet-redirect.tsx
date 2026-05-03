"use client"

import { useEffect } from "react"
import { shouldUseMobileSheet } from "@/lib/mobile-user-agent"
import { navigateToPage } from "@/lib/utils"

function normalizePathname(pathname: string): string {
  try {
    return decodeURIComponent(pathname).replace(/\\/g, "/")
  } catch {
    return pathname.replace(/\\/g, "/")
  }
}

function isHomeEntryPath(pathname: string): boolean {
  const normalizedPath = normalizePathname(pathname)
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""

  if (normalizedPath.endsWith("/车卡器入口.html") || normalizedPath.endsWith("/index.html")) {
    return true
  }

  if (!basePath) {
    return normalizedPath === "/" || normalizedPath === ""
  }

  return normalizedPath === basePath || normalizedPath === `${basePath}/`
}

function isMobileSheetPath(pathname: string): boolean {
  const normalizedPath = normalizePathname(pathname)
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""

  if (normalizedPath.endsWith("/m-sheet.html")) {
    return true
  }

  if (!basePath) {
    return normalizedPath === "/m-sheet"
  }

  return normalizedPath === `${basePath}/m-sheet`
}

export function MobileSheetRedirect() {
  useEffect(() => {
    let resizeTimer: ReturnType<typeof setTimeout> | null = null

    const redirectIfNeeded = () => {
      if (typeof window === "undefined") {
        return
      }

      const pathname = window.location.pathname
      if (isMobileSheetPath(pathname) || !isHomeEntryPath(pathname)) {
        return
      }

      if (
        shouldUseMobileSheet({
          userAgent: window.navigator.userAgent,
          viewportWidth: window.innerWidth,
        })
      ) {
        navigateToPage("/m-sheet")
      }
    }

    redirectIfNeeded()

    const handleResize = () => {
      if (resizeTimer) {
        clearTimeout(resizeTimer)
      }

      resizeTimer = setTimeout(redirectIfNeeded, 120)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      if (resizeTimer) {
        clearTimeout(resizeTimer)
      }
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return null
}
