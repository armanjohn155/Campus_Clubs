import axios from 'axios'
import type { FieldErrors } from '@/types'

export function getErrorDetails(error: unknown): { message: string; fields: FieldErrors } {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; errors?: FieldErrors } | undefined
    return {
      message: data?.message ?? 'The request could not be completed. Try again.',
      fields: data?.errors ?? {},
    }
  }

  return { message: 'The request could not be completed. Try again.', fields: {} }
}
