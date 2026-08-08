import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  value: number | string | null | undefined,
  currency = 'USD',
) {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)
}

export function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong') {
  if (typeof error === 'string') return error
  if (error && typeof error === 'object') {
    const maybe = error as {
      response?: { data?: { message?: string; errors?: unknown } }
      message?: string
    }
    if (maybe.response?.data?.message) return maybe.response.data.message
    if (maybe.message) return maybe.message
  }
  return fallback
}
