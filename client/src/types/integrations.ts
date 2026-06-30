/** Indirizzo checkout / account (mirror server checkout validators). */
export type AddressInput = {
  firstName: string
  lastName: string
  line1: string
  streetNumber: string
  isSnc: boolean
  line2?: string
  city: string
  postalCode: string
  /** ISO 3166-1 alpha-2 */
  country: string
  phone?: string
  courierNotes?: string
}
