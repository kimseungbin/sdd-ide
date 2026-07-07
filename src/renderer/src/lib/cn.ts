import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Join and de-duplicate Tailwind classes (last conflicting utility wins).
 *
 * Used INTERNALLY by components as a safety net when variant classes could
 * conflict — NOT a public `className` escape hatch. Components still expose only
 * their closed variant/size props (CLAUDE.md Rule 2).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
