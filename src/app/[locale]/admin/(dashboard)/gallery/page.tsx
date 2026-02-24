import { getGalleryItems, getTags } from '@/actions/gallery'
import { AdminGalleryList } from '@/components/admin/gallery/AdminGalleryList'
import { UploadGalleryItemButton } from '@/components/admin/gallery/UploadGalleryItemButton'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gallery — Admin | DarkMonkey',
}

export default async function AdminGalleryPage() {
  const { items } = await getGalleryItems(100) // Fetch strict list
  const tags = await getTags()

  return (
    <div className="p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-zinc-50">Art Gallery</h1>
        <UploadGalleryItemButton tags={tags} />
      </div>

      <div className="mt-8">
        <AdminGalleryList items={items} />
      </div>
    </div>
  )
}
