import { prisma } from '../../lib/prisma.js'

export type StockRequestType = 'RESTOCK_NOTIFY' | 'PRODUCT_REQUEST'

export const restockNotifyRepository = {
  async upsert(input: {
    email: string
    productRef: string
    variantRef: string | null
    quantity: number
    locale: string
    productName: string | null
    odooPartnerId: number | null
    requestType: StockRequestType
  }) {
    const variantRef = input.variantRef ?? ''
    const existing = await prisma.stockRestockRequest.findUnique({
      where: {
        email_productRef_variantRef_requestType: {
          email: input.email,
          productRef: input.productRef,
          variantRef,
          requestType: input.requestType,
        },
      },
    })
    const row = await prisma.stockRestockRequest.upsert({
      where: {
        email_productRef_variantRef_requestType: {
          email: input.email,
          productRef: input.productRef,
          variantRef,
          requestType: input.requestType,
        },
      },
      create: {
        email: input.email,
        productRef: input.productRef,
        variantRef,
        quantity: input.quantity,
        locale: input.locale,
        productName: input.productName,
        odooPartnerId: input.odooPartnerId,
        requestType: input.requestType,
      },
      update: {
        quantity: input.quantity,
        locale: input.locale,
        productName: input.productName,
        odooPartnerId: input.odooPartnerId,
        notifiedAt: null,
      },
    })
    return { row, created: !existing }
  },
}
