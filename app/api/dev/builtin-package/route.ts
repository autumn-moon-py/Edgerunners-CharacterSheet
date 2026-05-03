import { NextResponse } from "next/server"

import type { ImportData } from "@/card/card-types"
import { sanitizeImportData } from "@/card/package-sanitizer"
import { writeBuiltinPackageFile } from "@/lib/dev-builtin-package-file"

export const runtime = "nodejs"

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isLocalDevRequest(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return false
  }

  const normalizeHost = (value: string | null) => {
    if (!value) {
      return ""
    }

    return value.replace(/^https?:\/\//, "").split(":")[0]
  }

  const allowedHosts = new Set(["localhost", "127.0.0.1"])
  const originHost = normalizeHost(request.headers.get("origin"))
  const requestHost = normalizeHost(request.headers.get("x-forwarded-host") || request.headers.get("host"))

  return allowedHosts.has(originHost) || allowedHosts.has(requestHost)
}

async function parseBuiltinPackageRequest(request: Request): Promise<ImportData> {
  let body: unknown

  try {
    body = await request.json()
  } catch (error) {
    console.warn("[dev-builtin-package] Failed to parse request JSON", error)
    throw new Error("invalid-json")
  }

  if (!isPlainObject(body)) {
    throw new Error("invalid-body")
  }

  const { data } = body

  if (!isPlainObject(data)) {
    throw new Error("invalid-data")
  }

  return data as ImportData
}

export async function POST(request: Request) {
  if (!isLocalDevRequest(request)) {
    return NextResponse.json(
      { success: false, error: "仅开发环境允许直写核心包源码" },
      { status: 403 },
    )
  }

  try {
    const requestData = await parseBuiltinPackageRequest(request)

    let sanitized: ImportData

    try {
      sanitized = sanitizeImportData(requestData)
    } catch (error) {
      console.warn("[dev-builtin-package] Invalid builtin package payload", error)
      return NextResponse.json({ success: false, error: "核心包数据格式无效" }, { status: 400 })
    }

    try {
      const filePath = await writeBuiltinPackageFile(sanitized)

      return NextResponse.json({ success: true, filePath })
    } catch (error) {
      console.error("[dev-builtin-package] Failed to write builtin package file", error)
      return NextResponse.json({ success: false, error: "写入核心包源码失败" }, { status: 500 })
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "invalid-json") {
        return NextResponse.json({ success: false, error: "请求体不是有效 JSON" }, { status: 400 })
      }

      if (error.message === "invalid-body") {
        return NextResponse.json({ success: false, error: "请求体必须是对象" }, { status: 400 })
      }

      if (error.message === "invalid-data") {
        return NextResponse.json({ success: false, error: "核心包数据必须是对象" }, { status: 400 })
      }
    }

    console.error("[dev-builtin-package] Unexpected route failure", error)
    return NextResponse.json(
      { success: false, error: "处理核心包写入请求失败" },
      { status: 500 },
    )
  }
}
