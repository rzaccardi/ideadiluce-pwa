import { describe, expect, it } from 'vitest'
import {
  carrierTrackingUrl,
  detectCarrier,
  parseDhlTrackPayload,
  parseFedexTrackPayload,
} from './carrier-track.parsers.js'

describe('detectCarrier', () => {
  it('riconosce FedEx e DHL dal nome corriere', () => {
    expect(detectCarrier({ carrierName: 'FedEx Express' })).toBe('fedex')
    expect(detectCarrier({ carrierCode: 'dhl' })).toBe('dhl')
  })
})

describe('parseFedexTrackPayload', () => {
  it('estrae consegna effettiva e stato', () => {
    const parsed = parseFedexTrackPayload(
      {
        output: {
          completeTrackResults: [
            {
              trackResults: [
                {
                  trackingNumberInfo: { trackingNumber: '128300000000' },
                  latestStatusDetail: { code: 'DL', derivedCode: 'DELIVERED', description: 'Delivered' },
                  dateAndTimes: [
                    { type: 'ACTUAL_DELIVERY', dateTime: '2026-08-01T14:22:00+02:00' },
                    { type: 'SHIP', dateTime: '2026-07-30T09:00:00+02:00' },
                  ],
                  scanEvents: [
                    {
                      date: '2026-08-01T14:22:00+02:00',
                      eventDescription: 'Delivered',
                      scanLocation: { city: 'Roma', countryCode: 'IT' },
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      '128300000000',
    )
    expect(parsed?.status).toBe('delivered')
    expect(parsed?.deliveredAt).toContain('2026-08-01')
    expect(parsed?.lastLocation).toContain('Roma')
  })
})

describe('parseDhlTrackPayload', () => {
  it('mappa Delivered + evento OK', () => {
    const parsed = parseDhlTrackPayload(
      {
        shipments: [
          {
            shipmentTrackingNumber: '1234567890',
            status: 'Delivered',
            estimatedDeliveryDate: '2026-08-01',
            events: [
              {
                date: '2026-08-01',
                time: '14:22:00',
                description: 'Delivered',
                typeCode: 'OK',
                serviceArea: [{ description: 'Rome - Italy' }],
              },
            ],
          },
        ],
      },
      '1234567890',
    )
    expect(parsed?.status).toBe('delivered')
    expect(parsed?.deliveredAt).toBeTruthy()
    expect(parsed?.lastLocation).toContain('Rome')
  })
})

describe('carrierTrackingUrl', () => {
  it('costruisce il link pubblico', () => {
    expect(carrierTrackingUrl('fedex', 'ABC')).toContain('trknbr=ABC')
    expect(carrierTrackingUrl('dhl', '123')).toContain('tracking-id=123')
  })
})
