/**
 * HTML导入器 - 从导出的HTML文件中安全提取角色数据
 * 
 * 功能：
 * 1. 从HTML文件中提取嵌入的JSON数据
 * 2. 安全地解析和验证数据
 * 3. 避免DOM解析和JavaScript执行
 * 4. 提供数据完整性验证
 */

import { SheetData } from './sheet-data'
import { validateAndProcessCharacterData } from './character-data-validator'

interface ImportResult {
    success: boolean
    data?: SheetData
    error?: string
    warnings?: string[]
    metadata?: {
        exportTime?: string
        filename?: string
        version?: string
        exporter?: string
    }
}

const CHARACTER_DATA_SCRIPT_ID = 'dh-character-data'

/**
 * 从HTML内容中提取元数据信息
 */
function extractMetadata(htmlContent: string): ImportResult['metadata'] {
    const metadata: ImportResult['metadata'] = {}

    // 提取标题中的信息
    const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i)
    if (titleMatch) {
        metadata.filename = titleMatch[1]
    }

    // 提取导出时间
    const exportTimeMatch = htmlContent.match(/HTML导出时间：([\d\-\/:\s]+)</i)
    if (exportTimeMatch) {
        metadata.exportTime = exportTimeMatch[1]
    }

    // 提取版本信息（如果有的话）
    const versionMatch = htmlContent.match(/data-version="([^"]+)"/i)
    if (versionMatch) {
        metadata.version = versionMatch[1]
    }

    // 提取导出器信息
    const exporterMatch = htmlContent.match(/data-exporter="([^"]+)"/i)
    if (exporterMatch) {
        metadata.exporter = exporterMatch[1]
    }

    return metadata
}

/**
 * 安全地从HTML字符串中提取角色数据
 * 不进行DOM解析，不执行JavaScript代码
 */
export function extractCharacterDataFromHTML(htmlContent: string): ImportResult {
    try {
        console.log('[HTML Import] 开始从HTML中提取角色数据...')

        // 1. 检查HTML内容基本格式
        if (!htmlContent || typeof htmlContent !== 'string') {
            return {
                success: false,
                error: 'HTML内容无效或为空'
            }
        }

        // 2. 检查是否是我们导出的HTML文件
        if (!htmlContent.includes('Daggerheart') ||
            !htmlContent.includes('data-exporter="daggerheart-character-sheet"')) {
            return {
                success: false,
                error: '这不是有效的Daggerheart角色卡HTML文件'
            }
        }

        // 3. 提取元数据
        const metadata = extractMetadata(htmlContent)

        // 4. 提取JSON数据
        const rawCharacterData = extractEmbeddedCharacterData(htmlContent)
        if (!rawCharacterData) {
            return {
                success: false,
                error: '未找到角色数据，HTML文件可能已损坏'
            }
        }

        // 5. 解析JSON数据
        let characterData: any
        try {
            characterData = JSON.parse(rawCharacterData)
        } catch (parseError) {
            return {
                success: false,
                error: `JSON解析失败: ${parseError instanceof Error ? parseError.message : '未知错误'}`
            }
        }

        // 6. 使用通用验证函数验证和处理数据
        const validation = validateAndProcessCharacterData(characterData, 'html')
        
        if (!validation.valid) {
            return {
                success: false,
                error: validation.error
            }
        }

        console.log('[HTML Import] 角色数据提取成功:', validation.data?.name)

        return {
            success: true,
            data: validation.data,
            warnings: validation.warnings,
            metadata
        }

    } catch (error) {
        console.error('[HTML Import] 提取失败:', error)
        return {
            success: false,
            error: `提取失败: ${error instanceof Error ? error.message : '未知错误'}`
        }
    }
}

function extractEmbeddedCharacterData(htmlContent: string): string | null {
    const scriptTagData = extractCharacterDataFromScriptTag(htmlContent)
    if (scriptTagData) {
        return scriptTagData
    }

    return extractCharacterDataFromLegacyAssignment(htmlContent)
}

function extractCharacterDataFromScriptTag(htmlContent: string): string | null {
    const scriptTagRegex = new RegExp(
        `<script[^>]*id=["']${CHARACTER_DATA_SCRIPT_ID}["'][^>]*>([\\s\\S]*?)<\\/script>`,
        'i'
    )
    const match = htmlContent.match(scriptTagRegex)

    if (!match || match[1] === undefined) {
        return null
    }

    return decodeEmbeddedJsonText(match[1].trim())
}

function extractCharacterDataFromLegacyAssignment(htmlContent: string): string | null {
    const assignmentIndex = htmlContent.indexOf('window.characterData')
    if (assignmentIndex === -1) {
        return null
    }

    const jsonStart = htmlContent.indexOf('{', assignmentIndex)
    if (jsonStart === -1) {
        return null
    }

    const extractedJson = readBalancedJsonObject(htmlContent, jsonStart)
    return extractedJson ? decodeEmbeddedJsonText(extractedJson) : null
}

function readBalancedJsonObject(source: string, startIndex: number): string | null {
    let depth = 0
    let inString = false
    let escaped = false

    for (let index = startIndex; index < source.length; index += 1) {
        const char = source[index]

        if (inString) {
            if (escaped) {
                escaped = false
                continue
            }

            if (char === '\\') {
                escaped = true
                continue
            }

            if (char === '"') {
                inString = false
            }

            continue
        }

        if (char === '"') {
            inString = true
            continue
        }

        if (char === '{') {
            depth += 1
            continue
        }

        if (char === '}') {
            depth -= 1
            if (depth === 0) {
                return source.slice(startIndex, index + 1)
            }
        }
    }

    return null
}

function decodeEmbeddedJsonText(rawText: string): string {
    return rawText
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
}

/**
 * 从文件对象中读取HTML内容并提取角色数据
 */
export async function importCharacterFromHTMLFile(file: File): Promise<ImportResult> {
    try {
        console.log('[HTML Import] 开始读取HTML文件:', file.name)

        // 检查文件类型
        if (!file.name.toLowerCase().endsWith('.html') && file.type !== 'text/html') {
            return {
                success: false,
                error: '请选择HTML文件'
            }
        }

        // 检查文件大小（防止过大的文件）
        if (file.size > 100 * 1024 * 1024) { // 100MB限制
            return {
                success: false,
                error: '文件过大，请选择小于100MB的HTML文件'
            }
        }

        // 读取文件内容
        const htmlContent = await readFileAsText(file)

        // 提取角色数据
        const result = extractCharacterDataFromHTML(htmlContent)

        if (result.success && result.metadata) {
            result.metadata.filename = file.name
        }

        return result

    } catch (error) {
        console.error('[HTML Import] 文件读取失败:', error)
        return {
            success: false,
            error: `文件读取失败: ${error instanceof Error ? error.message : '未知错误'}`
        }
    }
}

/**
 * 将文件读取为文本
 */
function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (event) => {
            if (typeof event.target?.result === 'string') {
                resolve(event.target.result)
            } else {
                reject(new Error('文件读取结果不是字符串'))
            }
        }

        reader.onerror = () => {
            reject(new Error('文件读取失败'))
        }

        reader.readAsText(file, 'utf-8')
    })
}
