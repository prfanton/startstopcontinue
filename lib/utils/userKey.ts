const USER_KEY_STORAGE_KEY = 'retro_user_key'

export function getUserKey(): string {
  if (typeof window === 'undefined') return ''
  let key = localStorage.getItem(USER_KEY_STORAGE_KEY)
  if (!key) {
    key = crypto.randomUUID()
    localStorage.setItem(USER_KEY_STORAGE_KEY, key)
  }
  return key
}

export function getDisplayName(sessionId: string): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(`retro_display_name_${sessionId}`)
}

export function setDisplayName(sessionId: string, name: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`retro_display_name_${sessionId}`, name)
}
