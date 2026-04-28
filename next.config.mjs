/** @type {import('next').NextConfig} */

const isGithubActions = process.env.GITHUB_ACTIONS || false
const isLocalBuild = process.env.LOCAL_BUILD || false
const distDir = process.env.NEXT_DIST_DIR || '.next'

let assetPrefix = ''
let basePath = ''

// 如果在 GitHub Actions 中运行，则设置 assetPrefix 和 basePath
if (isGithubActions) {
  const repo = 'DaggerHeart-CharacterSheet'
  assetPrefix = `/${repo}`
  basePath = `/${repo}`
}

// 如果是本地构建，使用相对路径
if (isLocalBuild) {
  assetPrefix = ''
  basePath = ''
}

const nextConfig = {
  distDir,
  allowedDevOrigins: ['localhost', '127.0.0.1', '0.0.0.0'],
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  assetPrefix: assetPrefix,
  basePath: basePath,
  output: 'export',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
