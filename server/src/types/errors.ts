export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly userMessage: string,
    public readonly statusCode: number = 400,
    public readonly retriable: boolean = false,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError
}
