import { getAnnouncements, getAllAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, toggleAnnouncementActive } from '@/actions/announcements'
import { Plus, Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react'
import { revalidatePath } from 'next/cache'

export default async function AnnouncementsPage() {
    const announcements = await getAllAnnouncements()

    async function addAnnouncement(formData: FormData) {
        'use server'
        const text = formData.get('text') as string
        const url = formData.get('url') as string
        if (!text) return
        await createAnnouncement({ text, url })
        revalidatePath('/admin/messages')
    }

    async function removeAnnouncement(id: string) {
        'use server'
        await deleteAnnouncement(id)
        revalidatePath('/admin/messages')
    }

    async function toggleStatus(id: string, currentStatus: boolean) {
        'use server'
        await toggleAnnouncementActive(id, !currentStatus)
        revalidatePath('/admin/messages')
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Announcements</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_300px]">
                <div className="space-y-4">
                    <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6">
                        <h3 className="mb-4 text-lg font-semibold text-white">Active Announcements</h3>
                        {announcements.length === 0 ? (
                            <p className="text-zinc-500">No announcements yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {announcements.map((announcement) => (
                                    <div
                                        key={announcement.id}
                                        className="flex items-center justify-between rounded-lg border border-white/5 bg-zinc-950 p-4 transition hover:border-white/10"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-zinc-200">{announcement.text}</p>
                                                {!announcement.active && (
                                                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">Inactive</span>
                                                )}
                                            </div>
                                            {announcement.url && (
                                                <p className="text-sm text-zinc-500">{announcement.url}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <form action={toggleStatus.bind(null, announcement.id, announcement.active)}>
                                                <button
                                                    type="submit"
                                                    className={`p-2 transition hover:text-white ${announcement.active ? 'text-green-500' : 'text-zinc-600'
                                                        }`}
                                                    title={announcement.active ? 'Deactivate' : 'Activate'}
                                                >
                                                    {announcement.active ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                                </button>
                                            </form>

                                            <form action={removeAnnouncement.bind(null, announcement.id)}>
                                                <button
                                                    type="submit"
                                                    className="p-2 text-red-500/50 transition hover:text-red-500"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6">
                        <h3 className="mb-4 text-lg font-semibold text-white">Add New</h3>
                        <form action={addAnnouncement} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400">Message</label>
                                <input
                                    name="text"
                                    required
                                    type="text"
                                    placeholder="e.g. Free shipping over $50"
                                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400">Link (optional)</label>
                                <input
                                    name="url"
                                    type="text"
                                    placeholder="e.g. /products/sale"
                                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-amber-400"
                            >
                                <Plus className="h-4 w-4" />
                                Add Announcement
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
