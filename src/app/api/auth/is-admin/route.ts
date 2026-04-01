import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth-admin'

export async function GET() {
  const user = await getAdminUser()
  return NextResponse.json({ isAdmin: !!user })
}
