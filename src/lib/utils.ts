import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatFullCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatMonth(month: number, year: number): string {
  return new Date(year, month - 1).toLocaleDateString('pt-BR', {
    month: 'short',
    year: 'numeric',
  })
}

export function getMonthName(month: number): string {
  return new Date(2024, month - 1).toLocaleDateString('pt-BR', { month: 'long' })
}
