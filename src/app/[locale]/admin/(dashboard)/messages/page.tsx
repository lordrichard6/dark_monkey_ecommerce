import { getAllAnnouncements } from '@/actions/announcements'
import { AnnouncementsManager } from './AnnouncementsManager'

export default async function AnnouncementsPage() {
  const announcements = await getAllAnnouncements()

  return (
    <div className="p-4 sm:p-8">
      <AnnouncementsManager initialAnnouncements={announcements} />
    </div>
  )
}
