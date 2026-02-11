/**
 * Type definitions for product story content
 */

export type StoryContent = {
    title?: string
    body?: string // HTML from rich text editor
    images?: string[] // Array of image URLs
    video_url?: string // YouTube, Vimeo, etc.
    published?: boolean
}

export const EMPTY_STORY: StoryContent = {
    title: '',
    body: '',
    images: [],
    video_url: '',
    published: false,
}

/**
 * Validate story content structure
 */
export function validateStoryContent(content: unknown): content is StoryContent {
    if (typeof content !== 'object' || content === null) {
        return false
    }

    const story = content as Record<string, unknown>

    if (story.title !== undefined && typeof story.title !== 'string') {
        return false
    }

    if (story.body !== undefined && typeof story.body !== 'string') {
        return false
    }

    if (story.images !== undefined) {
        if (!Array.isArray(story.images)) return false
        if (!story.images.every(img => typeof img === 'string')) return false
    }

    if (story.video_url !== undefined && typeof story.video_url !== 'string') {
        return false
    }

    if (story.published !== undefined && typeof story.published !== 'boolean') {
        return false
    }

    return true
}

/**
 * Check if story has meaningful content
 */
export function hasStoryContent(story: StoryContent | null | undefined): boolean {
    if (!story) return false

    return Boolean(
        story.published &&
        (story.title?.trim() ||
            story.body?.trim() ||
            (story.images && story.images.length > 0) ||
            story.video_url?.trim())
    )
}

/**
 * Extract YouTube video ID from URL
 */
export function getYouTubeVideoId(url: string): string | null {
    if (!url) return null

    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
    ]

    for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match && match[1]) {
            return match[1]
        }
    }

    return null
}

/**
 * Extract Vimeo video ID from URL
 */
export function getVimeoVideoId(url: string): string | null {
    if (!url) return null

    const match = url.match(/vimeo\.com\/(\d+)/)
    return match ? match[1] : null
}
