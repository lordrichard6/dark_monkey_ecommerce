'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { uploadGalleryItem, createTag } from '@/actions/gallery'
import { Loader2, UploadCloudIcon, XIcon, PlusIcon } from 'lucide-react'

type Props = {
    tags: { id: string; name: string }[]
}

export function UploadGalleryItemButton({ tags }: Props) {
    const [open, setOpen] = useState(false)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    // Form state
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())

    // Tag creation state
    const [newTagName, setNewTagName] = useState('')
    const [creatingTag, setCreatingTag] = useState(false)
    const [availableTags, setAvailableTags] = useState(tags)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0])
        }
    }

    const toggleTag = (id: string) => {
        const newTags = new Set(selectedTags)
        if (newTags.has(id)) newTags.delete(id)
        else newTags.add(id)
        setSelectedTags(newTags)
    }

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return
        setCreatingTag(true)

        const result = await createTag(newTagName.trim())

        setCreatingTag(false)
        if (result.ok) {
            if (result.tag) {
                // Check if already exists in list to avoid duplicates (though ID check handles it)
                if (!availableTags.some(t => t.id === result.tag.id)) {
                    setAvailableTags(prev => [...prev, result.tag!])
                }
                // Select it
                setSelectedTags(prev => new Set(prev).add(result.tag.id))
                setNewTagName('')
            }
        } else {
            alert(result.error || 'Failed to create tag')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file || !title) return

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('title', title)
        formData.append('description', description)

        const result = await uploadGalleryItem(formData, Array.from(selectedTags))

        setUploading(false)
        if (result.ok) {
            setOpen(false)
            resetForm()
            // Wait a moment for revalidation to propagate
            setTimeout(() => router.refresh(), 500)
        } else {
            alert(result.error)
        }
    }

    const resetForm = () => {
        setTitle('')
        setDescription('')
        setFile(null)
        setSelectedTags(new Set())
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="w-full rounded-lg bg-amber-500 px-4 py-2 text-center text-sm font-medium text-zinc-950 hover:bg-amber-400 sm:w-auto flex items-center justify-center gap-2"
            >
                <UploadCloudIcon className="w-4 h-4" />
                Upload Art
            </button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900">
                    <h2 className="text-lg font-bold text-white">Upload New Art</h2>
                    <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-white">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            required
                            className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-500/10 file:text-amber-500 hover:file:bg-amber-500/20 cursor-pointer"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            placeholder="Art Title"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            placeholder="Optional description..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Tags</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleCreateTag();
                                    }
                                }}
                                className="flex-1 rounded-lg border border-white/10 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
                                placeholder="New tag name"
                            />
                            <button
                                type="button"
                                onClick={handleCreateTag}
                                disabled={creatingTag || !newTagName.trim()}
                                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:opacity-50"
                            >
                                {creatingTag ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlusIcon className="w-3 h-3" />}
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-white/5 rounded-lg bg-black/20">
                            {availableTags.map(tag => (
                                <button
                                    key={tag.id}
                                    type="button"
                                    onClick={() => toggleTag(tag.id)}
                                    className={`px-2 py-1 rounded text-xs transition ${selectedTags.has(tag.id)
                                        ? 'bg-amber-500 text-zinc-950 font-bold'
                                        : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                                        }`}
                                >
                                    {tag.name}
                                </button>
                            ))}
                            {availableTags.length === 0 && <p className="text-xs text-zinc-500">No tags available. Create one above.</p>}
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            disabled={uploading}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploading || !file || !title}
                            className="px-4 py-2 rounded-lg bg-amber-500 text-sm font-medium text-zinc-950 hover:bg-amber-400 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {uploading ? 'Uploading...' : 'Upload'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
