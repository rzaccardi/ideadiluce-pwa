'use client'

import { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio/react'
import { accountStore, clearAccountFeedback, saveProfile, saveBusiness } from '@/features/account'
import { authStore } from '@/features/auth'
import { api } from '@/api/endpoints'
import type { TaxValidationResultDTO } from '@/types/dto'
import {
  StripeFieldGroup,
  StripeFieldLabel,
  StripeInput,
} from '@/components/checkout/stripe-ui/StripeFields'
import { useI18n } from '@/hooks/use-i18n'
import { AccountSaveFeedback } from '@/components/account/AccountSaveFeedback'
import { AccountDcPanel } from '@/components/account/dc/AccountDcPanel'
import { accountDcPrimaryBtnClass } from '@/components/account/dc/account-dc-styles'
import { FadeIn } from '@/components/motion'

export function AccountPage() {
  const { t } = useI18n()
  const auth = useSnapshot(authStore)
  const account = useSnapshot(accountStore)
  const [firstName, setFirstName] = useState(auth.me?.firstName ?? '')
  const [lastName, setLastName] = useState(auth.me?.lastName ?? '')
  const [phone, setPhone] = useState(auth.me?.phone ?? '')
  const [companyName, setCompanyName] = useState(auth.me?.companyName ?? '')
  const [vatNumber, setVatNumber] = useState(auth.me?.vatNumber ?? '')
  const [fiscalCode, setFiscalCode] = useState(auth.me?.fiscalCode ?? '')
  const [pec, setPec] = useState(auth.me?.pec ?? '')
  const [sdiCode, setSdiCode] = useState(auth.me?.sdiCode ?? '')
  const [taxValidation, setTaxValidation] = useState<TaxValidationResultDTO | null>(null)
  const [taxValidating, setTaxValidating] = useState(false)

  useEffect(() => {
    if (!auth.me) return
    setFirstName(auth.me.firstName ?? '')
    setLastName(auth.me.lastName ?? '')
    setPhone(auth.me.phone ?? '')
    setCompanyName(auth.me.companyName ?? '')
    setVatNumber(auth.me.vatNumber ?? '')
    setFiscalCode(auth.me.fiscalCode ?? '')
    setPec(auth.me.pec ?? '')
    setSdiCode(auth.me.sdiCode ?? '')
  }, [auth.me])

  if (!auth.me) {
    return null
  }

  async function validateBusinessTaxFields() {
    const vat = vatNumber.trim()
    const fc = fiscalCode.trim()
    if (!vat && !fc) {
      setTaxValidation(null)
      return null
    }
    setTaxValidating(true)
    try {
      const res = await api.tax.validate({
        countryCode: 'IT',
        vatNumber: vat || undefined,
        fiscalCode: fc || undefined,
        personType: companyName.trim() || vat ? 'company' : 'private',
      })
      setTaxValidation(res)

      const autofillName = res.vat?.autofill?.companyName ?? res.vat?.vies.name
      if (autofillName?.trim() && !companyName.trim()) {
        setCompanyName(autofillName)
      }

      return res
    } finally {
      setTaxValidating(false)
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    clearAccountFeedback()

    try {
      await saveProfile({
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phone: phone || null,
      })
      const tax = await validateBusinessTaxFields()
      if (tax?.fiscalCode && !tax.fiscalCode.valid) return
      if (tax?.vat && (!tax.vat.formatValid || !tax.vat.checksumValid)) return
      await saveBusiness({
        companyName: companyName.trim() || undefined,
        vatNumber: vatNumber.trim() || undefined,
        fiscalCode: fiscalCode.trim() || undefined,
        pec: pec.trim() || undefined,
        sdiCode: sdiCode.trim() || undefined,
      })
    } catch {
      /* errore in accountStore.error */
    }
  }

  return (
    <FadeIn>
    <form onSubmit={(e) => void onSave(e)} className="flex flex-col gap-[18px]">
      <AccountSaveFeedback />

      <AccountDcPanel title={t('account.profile.personalData')}>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <StripeFieldLabel htmlFor="profile-email">{t('common.email')}</StripeFieldLabel>
            <StripeFieldGroup className="mt-1.5">
              <StripeInput
                id="profile-email"
                type="email"
                name="email"
                value={auth.me.email}
                disabled
                className="text-zinc-500"
              />
            </StripeFieldGroup>
            <p className="mt-1.5 text-xs text-[#9298a3]">{t('account.profile.emailReadonly')}</p>
          </div>
          <div>
            <StripeFieldLabel htmlFor="profile-phone">{t('common.phone')}</StripeFieldLabel>
            <StripeFieldGroup className="mt-1.5">
              <StripeInput
                id="profile-phone"
                type="tel"
                name="phone"
                placeholder="+39 …"
                autoComplete="tel"
                value={phone ?? ''}
                onChange={(e) => setPhone(e.target.value)}
              />
            </StripeFieldGroup>
          </div>
          <div>
            <StripeFieldLabel htmlFor="profile-first">{t('common.firstName')}</StripeFieldLabel>
            <StripeFieldGroup className="mt-1.5">
              <StripeInput
                id="profile-first"
                name="firstName"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </StripeFieldGroup>
          </div>
          <div>
            <StripeFieldLabel htmlFor="profile-last">{t('common.lastName')}</StripeFieldLabel>
            <StripeFieldGroup className="mt-1.5">
              <StripeInput
                id="profile-last"
                name="lastName"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </StripeFieldGroup>
          </div>
        </div>
      </AccountDcPanel>

      <AccountDcPanel title={t('account.profile.businessData')} description={t('account.profile.businessHint')}>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <StripeFieldLabel htmlFor="profile-company">Ragione sociale</StripeFieldLabel>
            <StripeFieldGroup className="mt-1.5">
              <StripeInput
                id="profile-company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                autoComplete="organization"
              />
            </StripeFieldGroup>
          </div>
          <div>
            <StripeFieldLabel htmlFor="profile-vat">P.IVA</StripeFieldLabel>
            <StripeFieldGroup className="mt-1.5">
              <StripeInput
                id="profile-vat"
                value={vatNumber}
                onChange={(e) => {
                  setVatNumber(e.target.value)
                  setTaxValidation(null)
                }}
                onBlur={() => void validateBusinessTaxFields()}
                className="uppercase"
              />
            </StripeFieldGroup>
            {taxValidation?.vat && vatNumber.trim() ? (
              <div className="mt-1 space-y-1">
                <p
                  className={`text-xs ${taxValidation.vat.checksumValid ? 'text-emerald-700' : 'text-red-700'}`}
                >
                  {taxValidation.vat.checksumValid
                    ? t('checkout.billing.vatFormatValid')
                    : taxValidation.vat.errors[0] ?? t('checkout.billing.vatFormatInvalid')}
                </p>
                {taxValidation.vat.vies.status === 'valid' ? (
                  <p className="text-xs text-emerald-700">
                    {t('checkout.billing.vatViesValid')}
                    {taxValidation.vat.vies.name ? ` — ${taxValidation.vat.vies.name}` : ''}
                  </p>
                ) : taxValidation.vat.vies.status === 'service_unavailable' ? (
                  <p className="text-xs text-amber-800">{t('checkout.billing.viesUnavailable')}</p>
                ) : null}
              </div>
            ) : null}
          </div>
          <div>
            <StripeFieldLabel htmlFor="profile-fiscal">Codice fiscale</StripeFieldLabel>
            <StripeFieldGroup className="mt-1.5">
              <StripeInput
                id="profile-fiscal"
                value={fiscalCode}
                onChange={(e) => {
                  setFiscalCode(e.target.value)
                  setTaxValidation(null)
                }}
                onBlur={() => void validateBusinessTaxFields()}
                className="uppercase"
              />
            </StripeFieldGroup>
            {taxValidation?.fiscalCode && fiscalCode.trim() ? (
              <p
                className={`mt-1 text-xs ${taxValidation.fiscalCode.valid ? 'text-emerald-700' : 'text-red-700'}`}
              >
                {taxValidation.fiscalCode.valid
                  ? t('checkout.billing.fiscalCodeValid')
                  : taxValidation.fiscalCode.errors[0] ?? t('checkout.billing.fiscalCodeInvalid')}
              </p>
            ) : null}
          </div>
          <div>
            <StripeFieldLabel htmlFor="profile-pec">PEC</StripeFieldLabel>
            <StripeFieldGroup className="mt-1.5">
              <StripeInput
                id="profile-pec"
                type="email"
                value={pec}
                onChange={(e) => setPec(e.target.value)}
              />
            </StripeFieldGroup>
          </div>
          <div>
            <StripeFieldLabel htmlFor="profile-sdi">Codice SDI</StripeFieldLabel>
            <StripeFieldGroup className="mt-1.5">
              <StripeInput
                id="profile-sdi"
                value={sdiCode}
                onChange={(e) => setSdiCode(e.target.value)}
                className="uppercase"
              />
            </StripeFieldGroup>
          </div>
        </div>
      </AccountDcPanel>

      <div>
        <button
          type="submit"
          disabled={account.isSaving || taxValidating}
          className={`${accountDcPrimaryBtnClass} disabled:opacity-60`}
        >
          {account.isSaving ? t('account.profile.saving') : t('account.profile.save')}
        </button>
      </div>
    </form>
    </FadeIn>
  )
}
