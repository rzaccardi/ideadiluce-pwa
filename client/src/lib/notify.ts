import { toast } from 'sonner'

type NotifyOptions = {
  description?: string
  duration?: number
}

export const notify = {
  error(message: string, options?: NotifyOptions) {
    toast.error(message, {
      description: options?.description,
      duration: options?.duration ?? 5500,
    })
  },
  success(message: string, options?: NotifyOptions) {
    toast.success(message, {
      description: options?.description,
      duration: options?.duration ?? 4200,
    })
  },
  info(message: string, options?: NotifyOptions) {
    toast.info(message, {
      description: options?.description,
      duration: options?.duration ?? 4200,
    })
  },
  warning(message: string, options?: NotifyOptions) {
    toast.warning(message, {
      description: options?.description,
      duration: options?.duration ?? 4800,
    })
  },
  message(message: string, options?: NotifyOptions) {
    toast.message(message, {
      description: options?.description,
      duration: options?.duration ?? 4200,
    })
  },
}
