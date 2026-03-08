import { useSyncExternalStore } from 'react'

/**
 * Returns `true` only after the component has mounted on the client.
 * Uses `useSyncExternalStore` to avoid the React Compiler warning about
 * calling setState synchronously inside an effect (the classic
 * `useState(false)` + `useEffect(() => setMounted(true), [])` pattern).
 */
function subscribe() {
  return () => {}
}

function getClientSnapshot() {
  return true
}

function getServerSnapshot() {
  return false
}

export function useIsMounted(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)
}
