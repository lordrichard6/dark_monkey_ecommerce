'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Play } from 'lucide-react'
import Image from 'next/image'
import {
  hasStoryContent,
  getYouTubeVideoId,
  getVimeoVideoId,
  type StoryContent,
} from '@/lib/story-content'

type ProductStoryProps = {
  story: StoryContent | null
}

export function ProductStory({ story }: ProductStoryProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!hasStoryContent(story)) {
    return null
  }

  const rawYoutubeId = story?.video_url ? getYouTubeVideoId(story.video_url) : null
  const rawVimeoId = story?.video_url ? getVimeoVideoId(story.video_url) : null

  // Validate IDs before embedding — prevents open-redirect via malformed IDs.
  // YouTube IDs: exactly 11 chars (alphanumeric, dash, underscore).
  // Vimeo IDs: purely numeric.
  const youtubeId = rawYoutubeId && /^[\w-]{11}$/.test(rawYoutubeId) ? rawYoutubeId : null
  const vimeoId = rawVimeoId && /^\d+$/.test(rawVimeoId) ? rawVimeoId : null

  return (
    <div className="border-t border-neutral-800 pt-8">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left group"
      >
        <h2 className="text-2xl font-bold">{story?.title || 'The Story'}</h2>
        {isExpanded ? (
          <ChevronUp className="w-6 h-6 text-neutral-400 group-hover:text-white transition-colors" />
        ) : (
          <ChevronDown className="w-6 h-6 text-neutral-400 group-hover:text-white transition-colors" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Story Body — callers must sanitize story.body before passing (page.tsx uses sanitizeProductHtml) */}
          {story?.body && (
            <div
              className="prose prose-invert prose-neutral max-w-none"
              dangerouslySetInnerHTML={{ __html: story.body }}
            />
          )}

          {/* Story Images */}
          {story?.images && story.images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {story.images.map((image, index) => (
                <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                  <Image
                    src={image}
                    alt={`Story image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Video Embed */}
          {(youtubeId || vimeoId) && (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-neutral-900">
              {youtubeId && (
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title="Product story video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              )}
              {vimeoId && (
                <iframe
                  src={`https://player.vimeo.com/video/${vimeoId}`}
                  title="Product story video"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
