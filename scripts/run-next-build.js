#!/usr/bin/env node

const { spawnSync } = require("child_process")
const fs = require("fs")
const path = require("path")

const isLocalBuild = process.argv.includes("--local")
const nextBin = require.resolve("next/dist/bin/next")
const distDir = ".next-build"

const projectRoot = path.join(__dirname, "..")
const distDirPath = path.join(projectRoot, distDir)
const nextCacheDirPath = path.join(projectRoot, ".next")

// Next 15 occasionally crashes in webpack hashing when stale build output/cache
// is left behind, so start each local build from a clean generated state.
fs.rmSync(distDirPath, { recursive: true, force: true })
fs.rmSync(nextCacheDirPath, { recursive: true, force: true })

const env = {
  ...process.env,
  NEXT_DIST_DIR: distDir,
}

if (isLocalBuild) {
  env.LOCAL_BUILD = "true"
  env.NEXT_PUBLIC_ENABLE_CARD_MANAGER = "true"
}

const result = spawnSync(process.execPath, [nextBin, "build"], {
  stdio: "inherit",
  env,
})

if (result.status !== 0) {
  process.exit(result.status || 1)
}
