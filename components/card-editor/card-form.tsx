'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import MarkdownEditor, { SimpleMarkdownEditor } from './markdown-editor'
import { KeywordCombobox } from './keyword-combobox'
import { CompactCardIdEditor } from './compact-card-id-editor'
import { ImageUpload } from '@/app/card-editor/components/image-upload'
import type { ProfessionCard } from '@/card/profession-card/convert'
import type { CommunityCard } from '@/card/community-card/convert'
import {
  VARIANT_EDITOR_TYPES,
  VARIANT_LEVEL_OPTIONS,
  VARIANT_WEAPON_ATTRIBUTE_OPTIONS,
  VARIANT_WEAPON_DAMAGE_TYPE_OPTIONS,
  VARIANT_WEAPON_LOAD_OPTIONS,
  VARIANT_WEAPON_RANGE_OPTIONS,
  getVariantEditorType,
  sanitizeRawVariantCard,
  type RawVariantCard
} from '@/card/variant-card/convert'
import type { DomainCard } from '@/card/domain-card/convert'

import { useCardEditorStore } from '@/app/card-editor/store/card-editor-store'
import { CardType } from '@/app/card-editor/types'

// 通用卡牌编辑器属性
interface BaseCardFormProps<T> {
  card: T
  cardIndex: number
  cardType: CardType
  keywordLists?: {
    professions?: string[]
    ancestries?: string[]
    communities?: string[]
    domains?: string[]
    variants?: string[]
  }
  onAddKeyword?: (category: string, keyword: string) => void
}

// 职业卡牌编辑器
export function ProfessionCardForm({
  card,
  cardIndex,
  cardType,
  keywordLists,
  onAddKeyword
}: BaseCardFormProps<ProfessionCard>) {
  const { updateCard, packageData, uploadImage, deleteImage, getPreviewUrl } = useCardEditorStore()
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)

  const form = useForm<ProfessionCard>({
    defaultValues: card
  })
  const isResetting = useRef(false)

  // 当卡牌数据变化时重置表单
  useEffect(() => {
    isResetting.current = true
    form.reset(card)
    setTimeout(() => {
      isResetting.current = false
    }, 0)
  }, [card])

  // 监听表单变化并实时保存到store
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (!isResetting.current) {
        updateCard(cardType, cardIndex, value)
      }
    })

    return () => subscription.unsubscribe()
  }, [form, cardType, cardIndex, updateCard])

  // 手动保存函数（用于特定场景）
  const handleFieldBlur = () => {
    const currentData = form.getValues()
    updateCard(cardType, cardIndex, currentData)
  }

  // 加载图片预览
  useEffect(() => {
    const loadImagePreview = async () => {
      if (card.id) {
        const url = await getPreviewUrl(card.id)
        setCurrentImageUrl(url)
      }
    }
    loadImagePreview()
  }, [card.id, getPreviewUrl])

  // 处理图片上传
  const handleUploadImage = async (cardId: string, file: File | Blob) => {
    await uploadImage(cardId, file)

    // 上传成功后，更新卡牌的 hasLocalImage 标记
    const updatedCard = { ...card, hasLocalImage: true }
    updateCard(cardType, cardIndex, updatedCard)

    // 刷新预览 URL
    const url = await getPreviewUrl(cardId)
    setCurrentImageUrl(url)
  }

  // 处理图片删除
  const handleDeleteImage = async (cardId: string) => {
    await deleteImage(cardId)

    // 删除成功后，更新卡牌的 hasLocalImage 标记
    const updatedCard = { ...card, hasLocalImage: false }
    updateCard(cardType, cardIndex, updatedCard)

    // 删除后，清除预览 URL
    setCurrentImageUrl(null)
  }

  return (
    <Form {...form}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="名称"
            render={({ field }) => (
              <FormItem>
                <FormLabel>职业名称 *</FormLabel>
                <FormControl>
                  <KeywordCombobox
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={handleFieldBlur}
                    keywords={keywordLists?.professions || []}
                    onAddKeyword={(keyword) => onAddKeyword?.('professions', keyword)}
                    placeholder="输入或选择职业"
                  />
                </FormControl>
                <CompactCardIdEditor
                  card={card}
                  cardType={cardType}
                  cardIndex={cardIndex}
                  packageName={packageData.name || '新建卡包'}
                  author={packageData.author || '作者'}
                />
                <FormMessage />
              </FormItem>
            )}
/>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="领域1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>领域1 *</FormLabel>
                <FormControl>
                  <KeywordCombobox
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={handleFieldBlur}
                    keywords={keywordLists?.domains || []}
                    onAddKeyword={(keyword) => onAddKeyword?.('domains', keyword)}
                    placeholder="输入或选择领域"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="领域2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>领域2 *</FormLabel>
                <FormControl>
                  <KeywordCombobox
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={handleFieldBlur}
                    keywords={keywordLists?.domains || []}
                    onAddKeyword={(keyword) => onAddKeyword?.('domains', keyword)}
                    placeholder="输入或选择领域"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="职业特性"
          render={({ field }) => (
            <FormItem>
              <FormLabel>职业特性 *</FormLabel>
              <FormControl>
                <MarkdownEditor
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={handleFieldBlur}
                  placeholder="核心职业能力，支持Markdown格式"
                  height={200}
                />
              </FormControl>
              <div className="text-sm text-muted-foreground">
                支持Markdown格式，可以使用 *__特性名__* 或者 ***特性名*** 来标记特性标题
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="起始生命"
            render={({ field }) => (
              <FormItem>
                <FormLabel>起始生命 *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="例如：6"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value
                      field.onChange(value === '' ? '' : parseInt(value) || 0)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="起始闪避"
            render={({ field }) => (
              <FormItem>
                <FormLabel>起始闪避 *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="例如：11"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value
                      field.onChange(value === '' ? '' : parseInt(value) || 0)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="希望特性"
          render={({ field }) => (
            <FormItem>
              <FormLabel>希望特性 *</FormLabel>
              <FormControl>
                <SimpleMarkdownEditor
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={handleFieldBlur}
                  placeholder="描述希望点的使用效果"
                  height={100}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 图片上传区域 */}
        <div className="space-y-2">
          <FormLabel>卡牌图片</FormLabel>
          <ImageUpload
            cardId={card.id}
            currentImageUrl={currentImageUrl}
            onUpload={handleUploadImage}
            onDelete={handleDeleteImage}
            disabled={false}
          />
          <p className="text-xs text-muted-foreground">
            上传的图片将保存在浏览器 IndexedDB 中，导出时会打包到 .dhcb 文件
          </p>
        </div>

        {/* 卡图链接（备用） */}
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>或者手动输入图片URL</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="输入图片URL（可选）"
                  onBlur={handleFieldBlur}
                  type="url"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  )
}

export function CommunityCardForm({
  card,
  cardIndex,
  cardType,
  keywordLists,
  onAddKeyword
}: BaseCardFormProps<CommunityCard>) {
  const { updateCard, packageData, uploadImage, deleteImage, getPreviewUrl } = useCardEditorStore()
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)

  const form = useForm<CommunityCard>({
    defaultValues: card
  })
  const isResetting = useRef(false)

  // 当卡牌数据变化时重置表单
  useEffect(() => {
    isResetting.current = true
    form.reset(card)
    setTimeout(() => {
      isResetting.current = false
    }, 0)
  }, [card])

  // 监听表单变化并实时保存到store
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (!isResetting.current) {
        updateCard(cardType, cardIndex, value)
      }
    })

    return () => subscription.unsubscribe()
  }, [form, cardType, cardIndex, updateCard])

  // 手动保存函数（用于特定场景）
  const handleFieldBlur = () => {
    const currentData = form.getValues()
    updateCard(cardType, cardIndex, currentData)
  }

  // 加载图片预览
  useEffect(() => {
    const loadImagePreview = async () => {
      if (card.id) {
        const url = await getPreviewUrl(card.id)
        setCurrentImageUrl(url)
      }
    }
    loadImagePreview()
  }, [card.id, getPreviewUrl])

  // 处理图片上传
  const handleUploadImage = async (cardId: string, file: File | Blob) => {
    await uploadImage(cardId, file)

    // 上传成功后，更新卡牌的 hasLocalImage 标记
    const updatedCard = { ...card, hasLocalImage: true }
    updateCard(cardType, cardIndex, updatedCard)

    // 刷新预览 URL
    const url = await getPreviewUrl(cardId)
    setCurrentImageUrl(url)
  }

  // 处理图片删除
  const handleDeleteImage = async (cardId: string) => {
    await deleteImage(cardId)

    // 删除成功后，更新卡牌的 hasLocalImage 标记
    const updatedCard = { ...card, hasLocalImage: false }
    updateCard(cardType, cardIndex, updatedCard)

    // 删除后，清除预览 URL
    setCurrentImageUrl(null)
  }

  return (
    <Form {...form}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="名称"
            render={({ field }) => (
              <FormItem>
                <FormLabel>社群名称 *</FormLabel>
                <FormControl>
                  <KeywordCombobox
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={handleFieldBlur}
                    keywords={keywordLists?.communities || []}
                    onAddKeyword={(keyword) => onAddKeyword?.('communities', keyword)}
                    placeholder="输入或选择社群"
                  />
                </FormControl>
                <CompactCardIdEditor
                  card={card}
                  cardType={cardType}
                  cardIndex={cardIndex}
                  packageName={packageData.name || '新建卡包'}
                  author={packageData.author || '作者'}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="特性"
            render={({ field }) => (
              <FormItem>
                <FormLabel>社群特性 *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="社群的核心特性"
                    onBlur={handleFieldBlur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
/>
        </div>

        <FormField
          control={form.control}
          name="简介"
          render={({ field }) => (
            <FormItem>
              <FormLabel>简介</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="社群的简要介绍"
                  onBlur={handleFieldBlur}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="描述"
          render={({ field }) => (
            <FormItem>
              <FormLabel>详细描述 *</FormLabel>
              <FormControl>
                <MarkdownEditor
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={handleFieldBlur}
                  placeholder="社群的详细描述，支持Markdown格式"
                  height={200}
                />
              </FormControl>
              <div className="text-sm text-muted-foreground">
                支持Markdown格式，可以使用 *__特性名__* 或者 ***特性名*** 来标记特性标题
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 图片上传区域 */}
        <div className="space-y-2">
          <FormLabel>卡牌图片</FormLabel>
          <ImageUpload
            cardId={card.id}
            currentImageUrl={currentImageUrl}
            onUpload={handleUploadImage}
            onDelete={handleDeleteImage}
            disabled={false}
          />
          <p className="text-xs text-muted-foreground">
            上传的图片将保存在浏览器 IndexedDB 中，导出时会打包到 .dhcb 文件
          </p>
        </div>

        {/* 卡图链接（备用） */}
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>或者手动输入图片URL</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="输入图片URL（可选）"
                  onBlur={handleFieldBlur}
                  type="url"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  )
}

export function VariantCardForm({
  card,
  cardIndex,
  cardType
}: BaseCardFormProps<RawVariantCard>) {
  const { updateCard, packageData, uploadImage, deleteImage, getPreviewUrl } = useCardEditorStore()
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)

  const form = useForm<RawVariantCard>({
    defaultValues: sanitizeRawVariantCard(card)
  })
  const variantType = getVariantEditorType(form.watch('类型'))
  const isResetting = useRef(false)
  const pendingPersistTimer = useRef<number | null>(null)

  const scheduleVariantPersist = (nextCard: RawVariantCard) => {
    if (pendingPersistTimer.current !== null) {
      window.clearTimeout(pendingPersistTimer.current)
    }

    pendingPersistTimer.current = window.setTimeout(() => {
      updateCard(cardType, cardIndex, nextCard)
      pendingPersistTimer.current = null
    }, 0)
  }

  const resetVariantForm = (nextCard: Partial<RawVariantCard>, persist = true) => {
    const sanitizedCard = sanitizeRawVariantCard(nextCard)

    isResetting.current = true
    form.reset(sanitizedCard)

    if (persist) {
      scheduleVariantPersist(sanitizedCard)
    }

    setTimeout(() => {
      isResetting.current = false
    }, 0)

    return sanitizedCard
  }

  // 当卡牌数据变化时重置表单
  useEffect(() => {
    const sanitizedCard = sanitizeRawVariantCard(card)

    isResetting.current = true
    form.reset(sanitizedCard)

    setTimeout(() => {
      isResetting.current = false
    }, 0)
  }, [card, form])

  useEffect(() => {
    return () => {
      if (pendingPersistTimer.current !== null) {
        window.clearTimeout(pendingPersistTimer.current)
      }
    }
  }, [])

  // 监听表单变化并实时保存到store
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (!isResetting.current) {
        updateCard(cardType, cardIndex, sanitizeRawVariantCard(value as Partial<RawVariantCard>))
      }
    })

    return () => subscription.unsubscribe()
  }, [form, cardType, cardIndex, updateCard])

  // 手动保存函数（用于特定场景）
  const handleFieldBlur = () => {
    const currentData = sanitizeRawVariantCard(form.getValues())
    updateCard(cardType, cardIndex, currentData)
  }

  // 加载图片预览
  useEffect(() => {
    const loadImagePreview = async () => {
      if (card.id) {
        const url = await getPreviewUrl(card.id)
        setCurrentImageUrl(url)
      }
    }
    loadImagePreview()
  }, [card.id, getPreviewUrl])

  // 处理图片上传
  const handleUploadImage = async (cardId: string, file: File | Blob) => {
    await uploadImage(cardId, file)

    // 上传成功后，更新卡牌的 hasLocalImage 标记
    const updatedCard = sanitizeRawVariantCard({
      ...form.getValues(),
      id: cardId,
      hasLocalImage: true
    })
    updateCard(cardType, cardIndex, updatedCard)

    // 刷新预览 URL
    const url = await getPreviewUrl(cardId)
    setCurrentImageUrl(url)
  }

  // 处理图片删除
  const handleDeleteImage = async (cardId: string) => {
    await deleteImage(cardId)

    // 删除成功后，更新卡牌的 hasLocalImage 标记
    const updatedCard = sanitizeRawVariantCard({
      ...form.getValues(),
      id: cardId,
      hasLocalImage: false
    })
    updateCard(cardType, cardIndex, updatedCard)

    // 删除后，清除预览 URL
    setCurrentImageUrl(null)
  }

  return (
    <Form {...form}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="名称"
            render={({ field }) => (
              <FormItem>
                <FormLabel>变体名称 *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="输入变体卡名称"
                    onBlur={handleFieldBlur}
                  />
                </FormControl>
                <CompactCardIdEditor
                  card={card}
                  cardType={cardType}
                  cardIndex={cardIndex}
                  packageName={packageData.name || '新建卡包'}
                  author={packageData.author || '作者'}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="类型"
            render={({ field }) => (
              <FormItem>
                <FormLabel>变体类型 *</FormLabel>
                <Select
                  value={getVariantEditorType(field.value)}
                  onValueChange={(value) => {
                    resetVariantForm({
                      ...form.getValues(),
                      类型: value
                    })
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择变体类型" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {VARIANT_EDITOR_TYPES.map((typeOption) => (
                      <SelectItem key={typeOption} value={typeOption}>
                        {typeOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {variantType === '变体' && (
          <>
            <div className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="简略信息.item1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>简略信息 1</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="第一行简略信息"
                          onBlur={handleFieldBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="简略信息.item2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>简略信息 2</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="第二行简略信息"
                          onBlur={handleFieldBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="简略信息.item3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>简略信息 3</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="第三行简略信息"
                          onBlur={handleFieldBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                这些信息会出现在卡牌的标签栏，帮助玩家快速了解卡牌特性
              </div>
            </div>

            <FormField
              control={form.control}
              name="效果"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>卡牌效果 *</FormLabel>
                  <FormControl>
                    <MarkdownEditor
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={handleFieldBlur}
                      placeholder="卡牌的详细效果描述，支持Markdown格式"
                      height={200}
                    />
                  </FormControl>
                  <div className="text-sm text-muted-foreground">
                    支持Markdown格式，可以使用 *__关键词__* 来标记重要信息
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="子类别"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>子类别（可选）</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ''}
                        placeholder="例如：食物、工具、植入体"
                        onBlur={handleFieldBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="等级"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>等级（可选）</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="例如：1"
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value
                          field.onChange(value === '' ? undefined : parseInt(value) || 0)
                        }}
                        onBlur={handleFieldBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}

        <div className="text-xs text-muted-foreground">
          切换类型时会自动清理无关字段，武器和护甲不会保留通用变体字段。
        </div>

        {variantType === '武器' && (
          <div className="space-y-4 border-t pt-4">
            <div className="text-sm font-medium">武器字段</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="等级"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>等级 *</FormLabel>
                    <Select
                      value={typeof field.value === 'string' && VARIANT_LEVEL_OPTIONS.includes(field.value as typeof VARIANT_LEVEL_OPTIONS[number]) ? field.value : ''}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择等级" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {VARIANT_LEVEL_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="属性"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>属性 *</FormLabel>
                    <Select
                      value={typeof field.value === 'string' && VARIANT_WEAPON_ATTRIBUTE_OPTIONS.includes(field.value as typeof VARIANT_WEAPON_ATTRIBUTE_OPTIONS[number]) ? field.value : ''}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择属性" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {VARIANT_WEAPON_ATTRIBUTE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="伤害类型"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>伤害类型 *</FormLabel>
                    <Select
                      value={typeof field.value === 'string' && VARIANT_WEAPON_DAMAGE_TYPE_OPTIONS.includes(field.value as typeof VARIANT_WEAPON_DAMAGE_TYPE_OPTIONS[number]) ? field.value : ''}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择伤害类型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {VARIANT_WEAPON_DAMAGE_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="范围"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>范围 *</FormLabel>
                    <Select
                      value={typeof field.value === 'string' && VARIANT_WEAPON_RANGE_OPTIONS.includes(field.value as typeof VARIANT_WEAPON_RANGE_OPTIONS[number]) ? field.value : ''}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择范围" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {VARIANT_WEAPON_RANGE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="伤害"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>伤害 *</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} placeholder="例如：d8+3" onBlur={handleFieldBlur} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="负荷"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>负荷 *</FormLabel>
                    <Select
                      value={typeof field.value === 'string' && VARIANT_WEAPON_LOAD_OPTIONS.includes(field.value as typeof VARIANT_WEAPON_LOAD_OPTIONS[number]) ? field.value : ''}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择负荷" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {VARIANT_WEAPON_LOAD_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="特性名称"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>特性名称（可选）</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} placeholder="例如：可靠" onBlur={handleFieldBlur} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="描述"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>特性描述（可选）</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="例如：命中后附带额外效果"
                      onBlur={handleFieldBlur}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {variantType === '护甲' && (
          <div className="space-y-4 border-t pt-4">
            <div className="text-sm font-medium">护甲字段</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="等级"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>等级 *</FormLabel>
                    <Select
                      value={typeof field.value === 'string' && VARIANT_LEVEL_OPTIONS.includes(field.value as typeof VARIANT_LEVEL_OPTIONS[number]) ? field.value : ''}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择等级" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {VARIANT_LEVEL_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="伤害阈值"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>伤害阈值 *</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} placeholder="例如：6/13" onBlur={handleFieldBlur} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="护甲值"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>护甲值 *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value ?? ''}
                        placeholder="例如：3"
                        onChange={(e) => {
                          const value = e.target.value
                          field.onChange(value === '' ? undefined : parseInt(value) || 0)
                        }}
                        onBlur={handleFieldBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="特性名称"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>特性名称（可选）</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} placeholder="例如：灵活" onBlur={handleFieldBlur} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="描述"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>特性描述（可选）</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="例如：提供额外防护效果"
                      onBlur={handleFieldBlur}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* 图片上传区域 */}
        <div className="space-y-2">
          <FormLabel>卡牌图片</FormLabel>
          <ImageUpload
            cardId={card.id}
            currentImageUrl={currentImageUrl}
            onUpload={handleUploadImage}
            onDelete={handleDeleteImage}
            disabled={false}
          />
          <p className="text-xs text-muted-foreground">
            上传的图片将保存在浏览器 IndexedDB 中，导出时会打包到 .dhcb 文件
          </p>
        </div>

        {/* 卡图链接（备用） */}
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>或者手动输入图片URL</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="输入图片URL（可选）"
                  onBlur={handleFieldBlur}
                  type="url"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  )
}

export function DomainCardForm({
  card,
  cardIndex,
  cardType,
  keywordLists,
  onAddKeyword
}: BaseCardFormProps<DomainCard>) {
  const { updateCard, packageData, uploadImage, deleteImage, getPreviewUrl } = useCardEditorStore()
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)

  const form = useForm<DomainCard>({
    defaultValues: card
  })
  const isResetting = useRef(false)

  // 当卡牌数据变化时重置表单
  useEffect(() => {
    isResetting.current = true
    form.reset(card)
    setTimeout(() => {
      isResetting.current = false
    }, 0)
  }, [card])

  // 监听表单变化并实时保存到store
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (!isResetting.current) {
        updateCard(cardType, cardIndex, value)
      }
    })

    return () => subscription.unsubscribe()
  }, [form, cardType, cardIndex, updateCard])

  // 手动保存函数（用于特定场景）
  const handleFieldBlur = () => {
    const currentData = form.getValues()
    updateCard(cardType, cardIndex, currentData)
  }

  // 加载图片预览
  useEffect(() => {
    const loadImagePreview = async () => {
      if (card.id) {
        const url = await getPreviewUrl(card.id)
        setCurrentImageUrl(url)
      }
    }
    loadImagePreview()
  }, [card.id, getPreviewUrl])

  // 处理图片上传
  const handleUploadImage = async (cardId: string, file: File | Blob) => {
    await uploadImage(cardId, file)

    // 上传成功后，更新卡牌的 hasLocalImage 标记
    const updatedCard = { ...card, hasLocalImage: true }
    updateCard(cardType, cardIndex, updatedCard)

    // 刷新预览 URL
    const url = await getPreviewUrl(cardId)
    setCurrentImageUrl(url)
  }

  // 处理图片删除
  const handleDeleteImage = async (cardId: string) => {
    await deleteImage(cardId)

    // 删除成功后，更新卡牌的 hasLocalImage 标记
    const updatedCard = { ...card, hasLocalImage: false }
    updateCard(cardType, cardIndex, updatedCard)

    // 删除后，清除预览 URL
    setCurrentImageUrl(null)
  }

  return (
    <Form {...form}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="名称"
            render={({ field }) => (
              <FormItem>
                <FormLabel>卡牌名称 *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="输入卡牌名称"
                    onBlur={handleFieldBlur}
                  />
                </FormControl>
                <CompactCardIdEditor
                  card={card}
                  cardType={cardType}
                  cardIndex={cardIndex}
                  packageName={packageData.name || '新建卡包'}
                  author={packageData.author || '作者'}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="领域"
            render={({ field }) => (
              <FormItem>
                <FormLabel>所属领域 *</FormLabel>
                <FormControl>
                  <KeywordCombobox
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={handleFieldBlur}
                    keywords={keywordLists?.domains || []}
                    onAddKeyword={(keyword) => onAddKeyword?.('domains', keyword)}
                    placeholder="输入或选择卡牌所属的领域"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
/>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="等级"
            render={({ field }) => (
              <FormItem>
                <FormLabel>卡牌等级 *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="例如：1"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value
                      field.onChange(value === '' ? '' : parseInt(value) || 0)
                    }}
                    onBlur={handleFieldBlur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="属性"
            render={({ field }) => (
              <FormItem>
                <FormLabel>卡牌类型 *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="例如：能力、法术、仪式、术典"
                    onBlur={handleFieldBlur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="回想"
            render={({ field }) => (
              <FormItem>
                <FormLabel>回想费用 *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="例如：2"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value
                      field.onChange(value === '' ? '' : parseInt(value) || 0)
                    }}
                    onBlur={handleFieldBlur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="描述"
          render={({ field }) => (
            <FormItem>
              <FormLabel>卡牌描述 *</FormLabel>
              <FormControl>
                <MarkdownEditor
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={handleFieldBlur}
                  placeholder="卡牌的详细效果描述，支持Markdown格式"
                  height={200}
                />
              </FormControl>
              <div className="text-sm text-muted-foreground">
                支持Markdown格式，可以使用 *__关键词__* 来标记重要信息
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 图片上传区域 */}
        <div className="space-y-2">
          <FormLabel>卡牌图片</FormLabel>
          <ImageUpload
            cardId={card.id}
            currentImageUrl={currentImageUrl}
            onUpload={handleUploadImage}
            onDelete={handleDeleteImage}
            disabled={false}
          />
          <p className="text-xs text-muted-foreground">
            上传的图片将保存在浏览器 IndexedDB 中，导出时会打包到 .dhcb 文件
          </p>
        </div>

        {/* 卡图链接（备用） */}
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>或者手动输入图片URL</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="输入图片URL（可选）"
                  onBlur={handleFieldBlur}
                  type="url"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  )
}
