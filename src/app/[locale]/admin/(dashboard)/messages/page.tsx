import { getAllAnnouncements } from '@/actions/announcements'
import { AnnouncementsManager } from './AnnouncementsManager'

export default async function AnnouncementsPage() {
  const announcements = await getAllAnnouncements()

  return <AnnouncementsManager initialAnnouncements={announcements} />
}
