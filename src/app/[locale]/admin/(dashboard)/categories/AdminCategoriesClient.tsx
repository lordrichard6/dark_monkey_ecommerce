'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Link } from '@/i18n/navigation'
import { Plus, Edit, GripVertical, ChevronRight } from 'lucide-react'
import { DeleteCategoryButton } from './delete-category-button'
import { reorderCategories, type Category } from '@/actions/admin-categories'

type CategoryWithLevel = Category & { level: number }

type Props = {
  roots: CategoryWithLevel[]
  flatList: CategoryWithLevel[]
}

function SortableRootRow({
  category,
  subs,
}: {
  category: CategoryWithLevel
  subs: CategoryWithLevel[]
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <>
      {/* Root row */}
      <div
        ref={setNodeRef}
        style={style}
        className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/50"
      >
        {/* Mobile card layout */}
        <div className="flex items-center gap-3 px-3 py-3 sm:hidden">
          <button
            {...listeners}
            {...attributes}
            className="shrink-0 cursor-grab touch-none text-zinc-600 hover:text-zinc-400 active:cursor-grabbing"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-zinc-50">{category.name}</p>
            <p className="truncate text-xs text-zinc-500 font-mono">{category.slug}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">
              {category.product_count ?? 0}p
            </span>
            <Link href={`/admin/categories/${category.id}`}>
              <button className="rounded p-1.5 text-zinc-400 hover:bg-zinc-700 hover:text-amber-400">
                <Edit className="h-4 w-4" />
              </button>
            </Link>
            <DeleteCategoryButton id={category.id} name={category.name} />
          </div>
        </div>

        {/* Desktop table row */}
        <div className="hidden sm:grid sm:grid-cols-[auto_1fr_1fr_80px_80px_80px] sm:items-center sm:gap-0">
          <div className="px-4 py-3 font-medium text-zinc-50">
            <div className="flex items-center gap-2">
              <button
                {...listeners}
                {...attributes}
                className="cursor-grab touch-none text-zinc-600 hover:text-zinc-400 active:cursor-grabbing"
                aria-label="Drag to reorder"
              >
                <GripVertical className="h-4 w-4" />
              </button>
              {category.name}
            </div>
          </div>
          <div className="px-4 py-3 text-sm text-zinc-400 font-mono">{category.slug}</div>
          <div className="px-4 py-3 text-sm text-zinc-400">{category.sort_order}</div>
          <div className="px-4 py-3 text-sm text-zinc-400">{category.product_count ?? 0}</div>
          <div className="px-4 py-3">
            <div className="flex gap-2">
              <Link href={`/admin/categories/${category.id}`}>
                <button className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-amber-400">
                  <Edit className="h-4 w-4" />
                </button>
              </Link>
              <DeleteCategoryButton id={category.id} name={category.name} />
            </div>
          </div>
        </div>
      </div>

      {/* Sub-category rows */}
      {subs.map((sub) => (
        <div
          key={sub.id}
          className="border-b border-zinc-800/30 bg-zinc-950/40 transition-colors hover:bg-zinc-800/30"
        >
          {/* Mobile */}
          <div className="flex items-center gap-3 px-3 py-2.5 sm:hidden">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-700 ml-7" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-zinc-400">{sub.name}</p>
              <p className="truncate text-xs text-zinc-600 font-mono">{sub.slug}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-xs text-zinc-500">
                {sub.product_count ?? 0}p
              </span>
              <Link href={`/admin/categories/${sub.id}`}>
                <button className="rounded p-1.5 text-zinc-500 hover:bg-zinc-700 hover:text-amber-400">
                  <Edit className="h-3.5 w-3.5" />
                </button>
              </Link>
              <DeleteCategoryButton id={sub.id} name={sub.name} />
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden sm:grid sm:grid-cols-[auto_1fr_1fr_80px_80px_80px] sm:items-center">
            <div className="px-4 py-2.5 text-sm text-zinc-400">
              <div className="flex items-center pl-9">
                <span className="mr-2 text-zinc-700">└</span>
                {sub.name}
              </div>
            </div>
            <div className="px-4 py-2.5 text-xs text-zinc-500 font-mono">{sub.slug}</div>
            <div className="px-4 py-2.5 text-xs text-zinc-500">{sub.sort_order}</div>
            <div className="px-4 py-2.5 text-xs text-zinc-500">{sub.product_count ?? 0}</div>
            <div className="px-4 py-2.5">
              <div className="flex gap-2">
                <Link href={`/admin/categories/${sub.id}`}>
                  <button className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-amber-400">
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                </Link>
                <DeleteCategoryButton id={sub.id} name={sub.name} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

export function AdminCategoriesClient({ roots, flatList }: Props) {
  const [rootOrder, setRootOrder] = useState<CategoryWithLevel[]>(roots)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setRootOrder((prev) => {
      const oldIndex = prev.findIndex((r) => r.id === active.id)
      const newIndex = prev.findIndex((r) => r.id === over.id)
      const next = arrayMove(prev, oldIndex, newIndex)
      reorderCategories(next.map((r) => r.id))
      return next
    })
  }

  // Sub-categories keyed by parent_id
  const subsByParent: Record<string, CategoryWithLevel[]> = {}
  for (const item of flatList) {
    if (item.level === 0) continue
    const parentId = item.parent_id ?? '__none__'
    if (!subsByParent[parentId]) subsByParent[parentId] = []
    subsByParent[parentId].push(item)
  }

  return (
    <div className="rounded-lg border border-zinc-800 overflow-hidden">
      {/* Desktop header row */}
      <div className="hidden sm:grid sm:grid-cols-[auto_1fr_1fr_80px_80px_80px] border-b border-zinc-800 bg-zinc-900/80">
        <div className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Name</div>
        <div className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Slug</div>
        <div className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Sort</div>
        <div className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Products</div>
        <div className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Actions</div>
      </div>

      {/* Mobile header */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-3 py-2.5 sm:hidden">
        <span className="text-xs font-medium text-zinc-400">Categories</span>
        <span className="text-xs text-zinc-600">Drag to reorder</span>
      </div>

      <div>
        {flatList.length === 0 ? (
          <div className="py-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="mb-4 rounded-full bg-zinc-900 p-4 ring-1 ring-zinc-800">
                <Plus className="h-6 w-6 text-zinc-500" />
              </div>
              <h3 className="text-lg font-medium text-zinc-200">No categories found</h3>
              <p className="mt-1 max-w-sm text-sm text-zinc-500">
                Create your first category to get started.
              </p>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={rootOrder.map((r) => r.id)}
              strategy={verticalListSortingStrategy}
            >
              {rootOrder.map((root) => (
                <SortableRootRow key={root.id} category={root} subs={subsByParent[root.id] ?? []} />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}
