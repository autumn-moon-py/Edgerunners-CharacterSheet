'use client'

import { Button } from '@/components/ui/button'
import { navigateToPage } from '@/lib/utils'

interface FeatureUnavailableProps {
  title: string
  description: string
}

export function FeatureUnavailable({ title, description }: FeatureUnavailableProps) {
  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-6 py-12">
      <div className="w-full rounded-xl border bg-white p-8 text-center shadow-sm">
        <h1 className="mb-3 text-2xl font-bold text-gray-900">{title}</h1>
        <p className="mb-6 text-sm leading-6 text-gray-600">{description}</p>
        <Button onClick={() => navigateToPage('/')}>返回主站</Button>
      </div>
    </div>
  )
}
