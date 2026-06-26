import { proxy } from 'valtio'
import type {
  OdooPaginated,
  OdooPricelist,
  OdooQuotationDetail,
  OdooSaleDocument,
  OdooSyncQueueList,
} from '@/types/odoo'

export const odooStore = proxy({
  quotationsList: null as OdooPaginated<OdooSaleDocument> | null,
  quotationsListItems: [] as OdooSaleDocument[],
  quotationsListLoading: false,
  quotationsListLoadingMore: false,
  quotationsListError: null as string | null,

  quotationDetail: null as OdooQuotationDetail | null,
  quotationDetailId: null as number | null,
  quotationDetailLoading: false,
  quotationDetailError: null as string | null,

  pricelistsList: null as OdooPaginated<OdooPricelist> | null,
  pricelistsListItems: [] as OdooPricelist[],
  pricelistsListLoading: false,
  pricelistsListLoadingMore: false,
  pricelistsListError: null as string | null,

  syncQueueList: null as OdooSyncQueueList | null,
  syncQueueListItems: [] as OdooSyncQueueList['items'],
  syncQueueListLoading: false,
  syncQueueListLoadingMore: false,
  syncQueueListError: null as string | null,
  syncQueueRetryingId: null as string | null,
})
