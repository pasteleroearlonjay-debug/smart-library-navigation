import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Resolve the public app base URL for redirects and absolute links
// Priority: NEXT_PUBLIC_APP_URL > VERCEL_URL > fallback to localhost
export function getAppUrl(): string {
  // Prefer explicit public URL
  const envUrl = process.env.NEXT_PUBLIC_APP_URL
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.replace(/\/$/, '')
  }

  // Support Vercel runtime where VERCEL_URL is host without protocol
  const vercelHost = process.env.VERCEL_URL
  if (vercelHost && vercelHost.trim().length > 0) {
    const hasProtocol = vercelHost.startsWith('http://') || vercelHost.startsWith('https://')
    return `${hasProtocol ? '' : 'https://'}${vercelHost}`.replace(/\/$/, '')
  }

  // Default for local development
  return 'http://localhost:3000'
}