import type { ApiErrorDTO } from '../types/dto.js'

export type ApiSuccess<T> = { data: T }

export function ok<T>(data: T): ApiSuccess<T> {
  return { data }
}

export function errorBody(dto: ApiErrorDTO): { error: ApiErrorDTO } {
  return { error: dto }
}
