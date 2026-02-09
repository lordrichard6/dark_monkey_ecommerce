import { getAdminClient } from '@/lib/supabase/admin'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'
import { TagManager } from '@/components/admin/settings/TagManager'
import { Settings, Tag } from 'lucide-react'

export default async function AdminSettingsPage() {
    const supabase = getAdminClient()
    if (!supabase) return <div className="p-8"><AdminNotConfigured /></div>

    const tags = await supabase.from('tags').select('*').order('name', { ascending: true })

    return (
        <div className="p-8">
            <div className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-zinc-400" />
                <h1 className="text-2xl font-bold text-zinc-50">Settings</h1>
            </div>

            <div className="mt-8 space-y-12">
                {/* Tag Management */}
                <section id="tags">
                    <div className="flex items-center gap-2 mb-6">
                        <Tag className="h-5 w-5 text-emerald-500" />
                        <h2 className="text-lg font-semibold text-zinc-50">Tags</h2>
                    </div>
                    <TagManager initialTags={tags.data || []} />
                </section>
            </div>
        </div>
    )
}
