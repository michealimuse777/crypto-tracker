import type { Currency } from '~/types'

const currencyFormatters: Record<Currency, Intl.NumberFormat> = {
  usd: new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }),
  ngn: new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 2
  }),
  eur: new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2
  })
}

const percentFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  signDisplay: 'always'
})

const compactPercentFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2,
  signDisplay: 'always'
})

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
})

export const formatCurrency = (value: number, currency: Currency = 'usd') =>
  (currencyFormatters[currency] ?? currencyFormatters.usd).format(Number.isFinite(value) ? value : 0)

export const formatPercent = (value: number) => {
  const normalizedValue = Number.isFinite(value) ? value : 0
  const formatter = Math.abs(normalizedValue) >= 1000 ? compactPercentFormatter : percentFormatter

  return `${formatter.format(normalizedValue)}%`
}

export const formatCompactNumber = (value: number) =>
  compactFormatter.format(Number.isFinite(value) ? value : 0)

export const formatDate = (value?: string | null) => {
  if (!value) {
    return 'Not set'
  }

  const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value
  const parsed = new Date(normalizedValue)

  if (Number.isNaN(parsed.getTime())) {
    return 'Not set'
  }

  return dateFormatter.format(parsed)
}

export const stripHtml = (value = '') =>
  value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
