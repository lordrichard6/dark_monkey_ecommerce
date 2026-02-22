'use client'

import { Trash2 } from 'lucide-react'
import { deleteCategory } from '@/actions/admin-categories'
import { useRouter } from '@/i18n/navigation'
import { toast } from 'sonner'

export function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    const result = await deleteCategory(id)
    if (result.ok) {
      toast.success('Category deleted')
      router.refresh()
    } else {
      toast.error(result.error ?? 'Failed to delete category')
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-red-400"
      title="Delete category"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
