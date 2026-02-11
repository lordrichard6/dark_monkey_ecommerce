'use client'

import { useState, useTransition } from 'react'
import { Save, Eye, EyeOff, Image as ImageIcon, Video } from 'lucide-react'
import { saveProductStory } from '@/actions/product-story'
import { EMPTY_STORY, type StoryContent } from '@/lib/story-content'

type StoryEditorProps = {
    productId: string
    productName: string
    initialStory?: StoryContent | null
    onSaved?: () => void
}

export function StoryEditor({ productId, productName, initialStory, onSaved }: StoryEditorProps) {
    const [story, setStory] = useState<StoryContent>(initialStory || EMPTY_STORY)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSave = () => {
        setError(null)
        setSuccess(false)

        startTransition(async () => {
            const result = await saveProductStory(productId, story)

            if (!result.ok) {
                setError(result.error)
                return
            }

            setSuccess(true)
            onSaved?.()

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000)
        })
    }

    const handleImageUrlAdd = () => {
        const url = prompt('Enter image URL:')
        if (url) {
            setStory(prev => ({
                ...prev,
                images: [...(prev.images || []), url]
            }))
        }
    }

    const handleImageRemove = (index: number) => {
        setStory(prev => ({
            ...prev,
            images: (prev.images || []).filter((_, i) => i !== index)
        }))
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Story Editor</h2>
                    <p className="text-neutral-400">For: {productName}</p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black font-medium hover:bg-neutral-200 disabled:opacity-50 transition-colors"
                >
                    <Save className="w-5 h-5" />
                    {isPending ? 'Saving...' : 'Save Story'}
                </button>
            </div>

            {/* Messages */}
            {error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                    {error}
                </div>
            )}

            {success && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
                    Story saved successfully!
                </div>
            )}

            {/* Title */}
            <div>
                <label className="block text-sm font-medium mb-2">Story Title</label>
                <input
                    type="text"
                    value={story.title || ''}
                    onChange={(e) => setStory(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="The Story Behind This Design"
                    className="w-full px-4 py-3 rounded-lg bg-neutral-900 border border-neutral-700 focus:border-neutral-500 focus:outline-none"
                />
            </div>

            {/* Body (Simple Textarea - can be upgraded to Tiptap later) */}
            <div>
                <label className="block text-sm font-medium mb-2">Story Content</label>
                <textarea
                    value={story.body || ''}
                    onChange={(e) => setStory(prev => ({ ...prev, body: e.target.value }))}
                    placeholder="Tell the story of this product... (HTML supported)"
                    rows={10}
                    className="w-full px-4 py-3 rounded-lg bg-neutral-900 border border-neutral-700 focus:border-neutral-500 focus:outline-none resize-none font-mono text-sm"
                />
                <p className="mt-2 text-xs text-neutral-400">
                    HTML supported. Use &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;ol&gt; tags.
                </p>
            </div>

            {/* Images */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Story Images</label>
                    <button
                        onClick={handleImageUrlAdd}
                        className="flex items-center gap-2 px-3 py-1.5 rounded text-sm hover:bg-neutral-800 transition-colors"
                    >
                        <ImageIcon className="w-4 h-4" />
                        Add Image URL
                    </button>
                </div>

                {story.images && story.images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {story.images.map((url, index) => (
                            <div key={index} className="relative group">
                                <img
                                    src={url}
                                    alt={`Story image ${index + 1}`}
                                    className="w-full aspect-video object-cover rounded-lg"
                                />
                                <button
                                    onClick={() => handleImageRemove(index)}
                                    className="absolute top-2 right-2 p-2 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-neutral-400 py-8 text-center border-2 border-dashed border-neutral-800 rounded-lg">
                        No images added
                    </p>
                )}
            </div>

            {/* Video URL */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    <Video className="w-4 h-4 inline mr-2" />
                    Video URL (YouTube or Vimeo)
                </label>
                <input
                    type="url"
                    value={story.video_url || ''}
                    onChange={(e) => setStory(prev => ({ ...prev, video_url: e.target.value }))}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-4 py-3 rounded-lg bg-neutral-900 border border-neutral-700 focus:border-neutral-500 focus:outline-none"
                />
            </div>

            {/* Published Toggle */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setStory(prev => ({ ...prev, published: !prev.published }))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${story.published
                            ? 'border-green-500 bg-green-500/10 text-green-400'
                            : 'border-neutral-700 text-neutral-400'
                        }`}
                >
                    {story.published ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    {story.published ? 'Published' : 'Draft'}
                </button>
                <p className="text-sm text-neutral-400">
                    {story.published
                        ? 'Story is visible to customers'
                        : 'Story is hidden from customers'}
                </p>
            </div>
        </div>
    )
}
