#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

const buildDir = path.join(__dirname, "..", ".next-build")
const outputDir = path.join(__dirname, "..", "output")
const renameIndex = process.argv.includes("--rename-index")

function publishBuildOutput(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    return targetDir
  }

  // Next 15 static export crashes if distDir itself is named "output",
  // so we build into a temp directory and publish the final artifacts here.
  fs.rmSync(targetDir, { recursive: true, force: true })
  fs.cpSync(sourceDir, targetDir, { recursive: true })

  return targetDir
}

function removeTxtFiles(directory) {
  if (!fs.existsSync(directory)) {
    return
  }

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      removeTxtFiles(fullPath)
      continue
    }

    if (entry.name.endsWith(".txt")) {
      fs.unlinkSync(fullPath)
    }
  }
}

function renameExportIndex(directory) {
  const sourcePath = path.join(directory, "index.html")
  const targetPath = path.join(directory, "车卡器入口.html")

  if (!fs.existsSync(sourcePath)) {
    return
  }

  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath)
  }

  fs.renameSync(sourcePath, targetPath)
}

const finalOutputDir = publishBuildOutput(buildDir, outputDir)

removeTxtFiles(finalOutputDir)

if (renameIndex) {
  renameExportIndex(finalOutputDir)
}
