export const dynamic = 'force-dynamic'

import { getAllFeedPostsAdmin } from '@/actions/feed'
import { FeedAdminClient } from './feed-admin-client'

export default async function AdminFeedPage() {
  const posts = await getAllFeedPostsAdmin()

  return <FeedAdminClient posts={posts} />
}
