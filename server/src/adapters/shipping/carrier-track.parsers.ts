export type CarrierKind = 'dhl' | 'fedex' | 'other'

export type OrderShipmentStatusDTO =
  | 'preparing'
  | 'shipped'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'exception'

export type OrderShipmentEventDTO = {
  at: string
  label: string
  location: string | null
}

export type CarrierTrackResult = {
  carrier: CarrierKind
  trackingNumber: string
  status: OrderShipmentStatusDTO
  shippedAt: string | null
  estimatedDeliveryAt: string | null
  deliveredAt: string | null
  lastLocation: string | null
  events: OrderShipmentEventDTO[]
}

function isoOrNull(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function combineDateTime(date: string | undefined, time: string | undefined): string | null {
  if (!date) return null
  const raw = time ? `${date}T${time}` : date
  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()
  return isoOrNull(date)
}

function locationLabel(parts: Array<string | null | undefined>): string | null {
  const text = parts.filter((p) => typeof p === 'string' && p.trim()).join(', ')
  return text || null
}

export function detectCarrier(input: {
  carrierName?: string | null
  carrierCode?: string | null
  trackingNumber?: string | null
}): CarrierKind | null {
  const blob = `${input.carrierCode ?? ''} ${input.carrierName ?? ''}`.toLowerCase()
  if (/fedex|federal express/.test(blob)) return 'fedex'
  if (/\bdhl\b/.test(blob)) return 'dhl'
  const tracking = input.trackingNumber?.trim() ?? ''
  if (/^(\d{12}|\d{15})$/.test(tracking)) return 'fedex'
  if (/^(\d{10}|JD\d+)/i.test(tracking)) return 'dhl'
  if (blob.trim()) return 'other'
  return tracking ? 'other' : null
}

export function mapFedexDerivedStatus(code: string | null | undefined): OrderShipmentStatusDTO {
  const key = (code ?? '').toUpperCase()
  if (key === 'DL' || key === 'DELIVERED') return 'delivered'
  if (key === 'OD' || key === 'OUT_FOR_DELIVERY') return 'out_for_delivery'
  if (key === 'IT' || key === 'IN_TRANSIT' || key === 'PU' || key === 'PICKED_UP') return 'in_transit'
  if (key === 'DE' || key === 'SE' || key === 'EXCEPTION' || key === 'DELAY') return 'exception'
  return 'in_transit'
}

export function parseFedexTrackPayload(
  payload: unknown,
  trackingNumber: string,
): CarrierTrackResult | null {
  const root = payload as {
    output?: {
      completeTrackResults?: Array<{
        trackResults?: Array<{
          trackingNumberInfo?: { trackingNumber?: string }
          latestStatusDetail?: {
            code?: string
            derivedCode?: string
            statusByLocale?: string
            description?: string
          }
          dateAndTimes?: Array<{ type?: string; dateTime?: string }>
          scanEvents?: Array<{
            date?: string
            eventType?: string
            eventDescription?: string
            scanLocation?: { city?: string; countryCode?: string; countryName?: string }
          }>
        }>
      }>
    }
  }
  const result = root.output?.completeTrackResults?.[0]?.trackResults?.[0]
  if (!result) return null

  const dates = result.dateAndTimes ?? []
  const dateByType = (type: string) =>
    isoOrNull(dates.find((row) => (row.type ?? '').toUpperCase() === type)?.dateTime)

  const events: OrderShipmentEventDTO[] = (result.scanEvents ?? [])
    .map((event) => ({
      at: isoOrNull(event.date) ?? '',
      label: event.eventDescription?.trim() || event.eventType || 'Update',
      location: locationLabel([
        event.scanLocation?.city,
        event.scanLocation?.countryName ?? event.scanLocation?.countryCode,
      ]),
    }))
    .filter((event) => event.at)
    .slice(0, 12)

  const status = mapFedexDerivedStatus(
    result.latestStatusDetail?.derivedCode ?? result.latestStatusDetail?.code,
  )

  return {
    carrier: 'fedex',
    trackingNumber: result.trackingNumberInfo?.trackingNumber?.trim() || trackingNumber,
    status,
    shippedAt: dateByType('SHIP') ?? dateByType('ACTUAL_PICKUP'),
    estimatedDeliveryAt: dateByType('ESTIMATED_DELIVERY'),
    deliveredAt: status === 'delivered' ? dateByType('ACTUAL_DELIVERY') ?? events[0]?.at ?? null : null,
    lastLocation: events[0]?.location ?? null,
    events,
  }
}

export function mapDhlStatus(status: string | null | undefined, typeCode: string | null | undefined): OrderShipmentStatusDTO {
  const blob = `${status ?? ''} ${typeCode ?? ''}`.toUpperCase()
  if (/\b(OK|DELIVERED|CONSEGNAT)/.test(blob)) return 'delivered'
  if (/\b(WC|OUT FOR DELIVERY|IN CONSEGNA)/.test(blob)) return 'out_for_delivery'
  if (/\b(EXCEPTION|FAIL|UNDELIVERED|CUSTOMS)/.test(blob)) return 'exception'
  if (blob.trim()) return 'in_transit'
  return 'shipped'
}

export function parseDhlTrackPayload(
  payload: unknown,
  trackingNumber: string,
): CarrierTrackResult | null {
  const root = payload as {
    shipments?: Array<{
      shipmentTrackingNumber?: string
      status?: string
      estimatedDeliveryDate?: string
      events?: Array<{
        date?: string
        time?: string
        description?: string
        typeCode?: string
        serviceArea?: Array<{ description?: string }>
      }>
    }>
  }
  const shipment = root.shipments?.[0]
  if (!shipment) return null

  const events: OrderShipmentEventDTO[] = (shipment.events ?? [])
    .map((event) => ({
      at: combineDateTime(event.date, event.time) ?? '',
      label: event.description?.trim() || event.typeCode || 'Update',
      location: event.serviceArea?.[0]?.description?.trim() || null,
    }))
    .filter((event) => event.at)
    .slice(0, 12)

  const latestType = shipment.events?.[0]?.typeCode
  const status = mapDhlStatus(shipment.status, latestType)
  const deliveredEvent = events.find((event) => /deliver|consegn/i.test(event.label))

  return {
    carrier: 'dhl',
    trackingNumber: shipment.shipmentTrackingNumber?.trim() || trackingNumber,
    status,
    shippedAt: events.at(-1)?.at ?? null,
    estimatedDeliveryAt: isoOrNull(shipment.estimatedDeliveryDate) ?? (shipment.estimatedDeliveryDate ? `${shipment.estimatedDeliveryDate}T12:00:00.000Z` : null),
    deliveredAt: status === 'delivered' ? deliveredEvent?.at ?? events[0]?.at ?? null : null,
    lastLocation: events[0]?.location ?? null,
    events,
  }
}

export function carrierTrackingUrl(carrier: CarrierKind | null, trackingNumber: string | null): string | null {
  const number = trackingNumber?.trim()
  if (!number) return null
  if (carrier === 'fedex') return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(number)}`
  if (carrier === 'dhl') {
    return `https://www.dhl.com/it-it/home/tracking.html?tracking-id=${encodeURIComponent(number)}`
  }
  return null
}
