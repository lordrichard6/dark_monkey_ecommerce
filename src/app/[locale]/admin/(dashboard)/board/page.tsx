import { getBoardData } from '@/actions/admin-board'
import { BoardClient } from './board-client'

export const dynamic = 'force-dynamic'

export default async function BoardPage() {
  const { items, admins, currentUserId } = await getBoardData()

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8 md:px-8">
      <BoardClient initialItems={items} admins={admins} currentUserId={currentUserId} />
    </div>
  )
}
