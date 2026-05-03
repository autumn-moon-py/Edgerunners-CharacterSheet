import { promises as fs } from "node:fs"
import path from "node:path"

import type { ImportData } from "@/card/card-types"

export function getBuiltinPackageFilePath() {
  return path.join(process.cwd(), "data", "cards", "builtin-base.json")
}

export async function writeBuiltinPackageFile(data: ImportData) {
  const targetPath = getBuiltinPackageFilePath()
  const serialized = `${JSON.stringify(data, null, 2)}\n`

  await fs.writeFile(targetPath, serialized, "utf8")

  return targetPath
}
