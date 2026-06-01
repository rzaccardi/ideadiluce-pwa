import type { PwaOrderStatus, PwaPaymentMethod, PwaPaymentStatus } from '@prisma/client'
import type {
  PwaOrderStatusDTO,
  PwaPaymentMethodDTO,
  PwaPaymentStatusDTO,
} from '../../types/dto.js'

export const paymentMethodToPrisma = (method: PwaPaymentMethodDTO): PwaPaymentMethod => {
  switch (method) {
    case 'card_nexi':
      return 'CARD_NEXI'
    case 'bank_transfer':
      return 'BANK_TRANSFER'
    case 'paypal':
      return 'PAYPAL'
    case 'google_pay':
      return 'GOOGLE_PAY'
    case 'stripe':
      return 'STRIPE'
  }
}

export const paymentMethodToDTO = (method: PwaPaymentMethod): PwaPaymentMethodDTO => {
  switch (method) {
    case 'CARD_NEXI':
      return 'card_nexi'
    case 'BANK_TRANSFER':
      return 'bank_transfer'
    case 'PAYPAL':
      return 'paypal'
    case 'GOOGLE_PAY':
      return 'google_pay'
    case 'STRIPE':
      return 'stripe'
  }
}

export const orderStatusToDTO = (status: PwaOrderStatus): PwaOrderStatusDTO =>
  status.toLowerCase() as PwaOrderStatusDTO

export const paymentStatusToDTO = (status: PwaPaymentStatus): PwaPaymentStatusDTO =>
  status.toLowerCase() as PwaPaymentStatusDTO

