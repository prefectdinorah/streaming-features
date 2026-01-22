'use client'

import { useState } from 'react'
import { skipCurrentVideo } from '@/app/actions/player'

interface SkipButtonProps {
  hasVideo: boolean
}

export function SkipButton({ hasVideo }: SkipButtonProps) {
  const [isSkipping, setIsSkipping] = useState(false)

  const handleSkip = async () => {
    if (isSkipping) return

    setIsSkipping(true)
    try {
      const result = await skipCurrentVideo()
      if (!result.success) {
        console.error('Failed to skip video:', result.error)
      }
    } catch (error) {
      console.error('Error skipping video:', error)
    } finally {
      setIsSkipping(false)
    }
  }

  return (
    <button
      onClick={handleSkip}
      disabled={!hasVideo || isSkipping}
      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors font-medium"
    >
      <span className="text-lg">⏭️</span>
      {isSkipping ? 'Пропускаем...' : 'Пропустить текущее'}
    </button>
  )
}
