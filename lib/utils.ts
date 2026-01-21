import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Утилита для объединения классов Tailwind CSS
 * Используется для динамического применения стилей
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
