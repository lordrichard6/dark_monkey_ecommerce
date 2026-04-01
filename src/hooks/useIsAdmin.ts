'use client'

import { useState, useEffect } from 'react'

let cachedResult: boolean | null = null

export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState<boolean>(cachedResult ?? false)

  useEffect(() => {
    if (cachedResult !== null) {
      setIsAdmin(cachedResult)
      return
    }

    fetch('/api/auth/is-admin')
      .then((r) => r.json())
      .then(({ isAdmin }: { isAdmin: boolean }) => {
        cachedResult = isAdmin
        setIsAdmin(isAdmin)
      })
      .catch(() => {
        cachedResult = false
      })
  }, [])

  return isAdmin
}
