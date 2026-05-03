const PHONE_USER_AGENT_RE = /(?:iphone|ipod|windows phone|android.+mobile|mobile)/i
const TABLET_USER_AGENT_RE = /(?:ipad|tablet|playbook|silk|kindle|android(?!.*mobile))/i

export const MOBILE_SHEET_MAX_WIDTH = 820

export function isPhoneUserAgent(userAgent?: string | null): boolean {
  if (!userAgent) {
    return false
  }

  if (TABLET_USER_AGENT_RE.test(userAgent)) {
    return false
  }

  return PHONE_USER_AGENT_RE.test(userAgent)
}

export function isNarrowMobileSheetViewport(viewportWidth?: number | null): boolean {
  return typeof viewportWidth === "number" && viewportWidth > 0 && viewportWidth <= MOBILE_SHEET_MAX_WIDTH
}

export function shouldUseMobileSheet(options: {
  userAgent?: string | null
  viewportWidth?: number | null
}): boolean {
  return isPhoneUserAgent(options.userAgent) || isNarrowMobileSheetViewport(options.viewportWidth)
}
