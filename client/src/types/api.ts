export type ApiEnvelope<T> = { data: T }

/** Allineato al contratto errore del server. */
export type ApiFailureBody = {
  error: {
    code: string
    message: string
    userMessage: string
    retriable: boolean
    correlationId: string
    details?: unknown
  }
}

export class ApiRequestError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
    public readonly userMessage?: string,
    public readonly retriable?: boolean,
    public readonly correlationId?: string,
  ) {
    super(userMessage ?? message)
    this.name = 'ApiRequestError'
  }
}
