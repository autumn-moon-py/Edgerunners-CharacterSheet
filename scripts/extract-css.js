#!/usr/bin/env node

/**
 * CSS提取脚本
 * 从Next.js构建输出中提取CSS文件，并生成TypeScript模块
 * 用于HTML导出器的CSS内联功能
 */

const fs = require('fs');
const path = require('path');

function resolveExportDir() {
  const preferredOutDir = path.join(__dirname, '../output');
  const fallbackDistDir = path.join(__dirname, '../.next-build');

  if (fs.existsSync(preferredOutDir)) {
    return preferredOutDir;
  }

  return fallbackDistDir;
}

const exportDir = resolveExportDir();

// 配置
const CONFIG = {
  // CSS文件目录
  cssDir: path.join(exportDir, '_next/static/css'),
  // 输出文件路径
  outputFile: path.join(__dirname, '../lib/embedded-styles.ts'),
  // 是否压缩CSS（关闭压缩以保留所有样式）
  compressCSS: false,
  // 是否包含source map
  includeSourceMap: false
};

/**
 * 读取目录中的所有CSS文件
 */
function readCSSFiles(directory) {
  try {
    if (!fs.existsSync(directory)) {
      console.error(`❌ CSS目录不存在: ${directory}`);
      console.log('请先运行 "pnpm build" 生成CSS文件');
      process.exit(1);
    }

    const files = fs.readdirSync(directory);
    const cssFiles = files.filter(file => file.endsWith('.css'));
    
    if (cssFiles.length === 0) {
      console.error('❌ 未找到CSS文件');
      console.log('请先运行 "pnpm build" 生成CSS文件');
      process.exit(1);
    }

    console.log(`✅ 找到 ${cssFiles.length} 个CSS文件:`, cssFiles);
    return cssFiles.map(file => path.join(directory, file));
  } catch (error) {
    console.error('❌ 读取CSS文件失败:', error);
    process.exit(1);
  }
}

/**
 * 合并所有CSS文件内容
 */
function combineCSSContent(filePaths) {
  let combinedCSS = '';
  let totalSize = 0;

  for (const filePath of filePaths) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const fileName = path.basename(filePath);
      
      // 添加文件标记（方便调试）
      combinedCSS += `\n/* === CSS from ${fileName} === */\n`;
      combinedCSS += content;
      
      totalSize += content.length;
      console.log(`  - ${fileName}: ${(content.length / 1024).toFixed(2)} KB`);
    } catch (error) {
      console.error(`❌ 读取文件失败 ${filePath}:`, error);
    }
  }

  console.log(`✅ 合并CSS完成，总大小: ${(totalSize / 1024).toFixed(2)} KB`);
  return combinedCSS;
}

/**
 * 处理CSS内容
 * - 移除source map引用
 * - 修正路径
 * - 可选压缩
 */
function processCSS(css, compress = true) {
  let processed = css;

  // 移除source map引用
  if (!CONFIG.includeSourceMap) {
    processed = processed.replace(/\/\*#\s*sourceMappingURL=.*?\*\//g, '');
    processed = processed.replace(/\n\/\/#\s*sourceMappingURL=.*/g, '');
  }

  // 移除字体文件的外部引用（如果有的话）
  // 这些在纯静态环境下可能无法加载
  processed = processed.replace(/@font-face\s*{[^}]*url\([^)]*\)[^}]*}/g, (match) => {
    if (match.includes('http://') || match.includes('https://') || match.includes('data:')) {
      return match; // 保留在线字体和data URL
    }
    console.log('⚠️  移除了本地字体引用（在file://协议下可能无法加载）');
    return ''; // 移除本地字体引用
  });

  // 压缩CSS（可选）
  if (compress) {
    // 基础压缩：移除注释和多余空白
    processed = processed
      // 保留重要注释（如许可证）
      .replace(/\/\*(?!\s*!)[^*]*\*+(?:[^/*][^*]*\*+)*\//g, '')
      // 移除多余空白
      .replace(/\s+/g, ' ')
      // 移除选择器前后空白
      .replace(/\s*([{}:;,])\s*/g, '$1')
      // 移除最后的分号前的空白
      .replace(/;\s*}/g, '}')
      // 移除开头和结尾空白
      .trim();

    console.log(`✅ CSS压缩完成，压缩后大小: ${(processed.length / 1024).toFixed(2)} KB`);
  }

  return processed;
}

/**
 * 生成TypeScript模块文件
 */
function generateTypeScriptModule(cssContent) {
  // 转义模板字符串中的特殊字符
  const escapedCSS = cssContent
    .replace(/\\/g, '\\\\')  // 转义反斜杠
    .replace(/`/g, '\\`')     // 转义反引号
    .replace(/\${/g, '\\${'); // 转义模板字符串插值

  const moduleContent = `/**
 * 自动生成的CSS内容文件
 * 生成时间: ${new Date().toISOString()}
 * 
 * 该文件包含了应用的所有CSS样式，用于HTML导出功能
 * 请勿手动编辑此文件，它会在构建时自动生成
 * 
 * 使用方法:
 * import { embeddedStyles } from './embedded-styles';
 */

/**
 * 完整的CSS内容（包含Tailwind CSS和应用样式）
 * 大小: ${(cssContent.length / 1024).toFixed(2)} KB
 */
export const embeddedStyles = \`${escapedCSS}\`;

/**
 * 获取嵌入的样式
 * @returns CSS字符串
 */
export function getEmbeddedStyles(): string {
  return embeddedStyles;
}

/**
 * 检查是否有可用的嵌入样式
 * @returns 是否有样式内容
 */
export function hasEmbeddedStyles(): boolean {
  return embeddedStyles.length > 0;
}

/**
 * 获取样式信息
 * @returns 样式统计信息
 */
export function getStylesInfo() {
  return {
    size: embeddedStyles.length,
    sizeKB: (embeddedStyles.length / 1024).toFixed(2),
    sizeMB: (embeddedStyles.length / 1024 / 1024).toFixed(2),
    generated: '${new Date().toISOString()}',
    compressed: ${CONFIG.compressCSS}
  };
}
`;

  return moduleContent;
}

/**
 * 保存生成的模块文件
 */
function saveModuleFile(content, outputPath) {
  try {
    // 确保目录存在
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 写入文件
    fs.writeFileSync(outputPath, content, 'utf-8');
    console.log(`✅ 成功生成: ${outputPath}`);
    
    // 显示文件信息
    const stats = fs.statSync(outputPath);
    console.log(`   文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error('❌ 保存文件失败:', error);
    process.exit(1);
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始提取CSS...\n');

  // 1. 读取CSS文件
  const cssFiles = readCSSFiles(CONFIG.cssDir);

  // 2. 合并CSS内容
  const combinedCSS = combineCSSContent(cssFiles);

  // 3. 处理CSS
  const processedCSS = processCSS(combinedCSS, CONFIG.compressCSS);

  // 4. 生成TypeScript模块
  const moduleContent = generateTypeScriptModule(processedCSS);

  // 5. 保存文件
  saveModuleFile(moduleContent, CONFIG.outputFile);

  console.log('\n✅ CSS提取完成！');
  console.log('📝 下一步：在 html-exporter.ts 中导入 embedded-styles');
}

// 运行主函数
main();
