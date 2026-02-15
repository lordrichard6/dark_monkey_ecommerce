import { getAdminClient } from '@/lib/supabase/admin'
import { AdminNotConfigured } from '@/components/admin/AdminNotConfigured'
import { TagManager } from '@/components/admin/settings/TagManager'
import { EmailTester } from '@/components/admin/settings/EmailTester'
import { Settings, Tag, Mail } from 'lucide-react'

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
                {/* General Settings */}
                <section id="general">
                    <div className="mb-6 flex items-center gap-2">
                        <Settings className="h-5 w-5 text-amber-500" />
                        <h2 className="text-lg font-semibold text-zinc-50">General</h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <a href="/admin/messages" className="block rounded-lg border border-white/10 bg-zinc-900/50 p-4 transition hover:bg-zinc-900">
                            <h3 className="font-medium text-white">Top Bar Messages</h3>
                            <p className="mt-1 text-sm text-zinc-400">Manage announcement bar content.</p>
                        </a>
                        <a href="/admin/categories" className="block rounded-lg border border-white/10 bg-zinc-900/50 p-4 transition hover:bg-zinc-900">
                            <h3 className="font-medium text-white">Categories</h3>
                            <p className="mt-1 text-sm text-zinc-400">Manage categories and subcategories.</p>
                        </a>
                        <a href="/admin/discounts" className="block rounded-lg border border-white/10 bg-zinc-900/50 p-4 transition hover:bg-zinc-900">
                            <h3 className="font-medium text-white">Discounts</h3>
                            <p className="mt-1 text-sm text-zinc-400">Manage discount codes.</p>
                        </a>
                    </div>
                </section>

                {/* Email Testing */}
                <section id="email-testing">
                    <div className="mb-6 flex items-center gap-2">
                        <Mail className="h-5 w-5 text-indigo-500" />
                        <h2 className="text-lg font-semibold text-zinc-50">Email Notifications</h2>
                    </div>
                    <EmailTester />
                </section>

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
