'use client'

import { useEffect, useRef, useState } from 'react'
import { useSnapshot } from 'valtio/react'
import { api } from '@/api/endpoints'
import { authStore, checkoutLogin, checkoutRegister } from '@/features/auth'
import { fetchCart } from '@/features/cart'
import {
  advanceCheckoutStep,
  applyEmailLookupResult,
  checkoutStore,
  initBillingFromShipping,
  isBusinessCheckout,
  markAnagraficaCollectedAtAccount,
  prepareCheckoutAfterAuth,
  setContactForceLogin,
  setCustomerSegment,
  setBusinessNoVatNumber,
  setEmailLookupError,
  setEmailLookupLoading,
  updateBusinessField,
  updateCheckoutAddress,
  updateCheckoutEmail,
  validateTaxFields,
} from '@/features/checkout'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { PhonePrefixField } from '@/components/PhonePrefixField'
import { useCheckoutLoginModal } from '@/hooks/use-checkout-login-modal'
import { useForgotPasswordModal } from '@/hooks/use-forgot-password-modal'
import { useI18n } from '@/hooks/use-i18n'
import { isCheckoutPhoneValid } from '@/lib/checkout-address.validators'
import { generateSecurePassword } from '@/lib/generate-password'
import { ApiRequestError } from '@/types/api'
import {
  StripeControlledInput,
  StripeErrorBanner,
  StripeFieldGroup,
  StripeFieldLabel,
  StripePayButton,
  StripeSectionTitle,
} from './StripeFields'
import { CheckoutAccountSection } from './CheckoutAccountSection'
import { CheckoutCustomerTypeCards } from './CheckoutCustomerTypeCards'
import { CheckoutRetailFiscalCodeField } from './CheckoutRetailFiscalCodeField'
import { CheckoutToggleCheckbox } from './CheckoutStepPrimitives'
import { TaxVerifyButton } from './TaxVerifyButton'
import { TaxValidationMessage } from './TaxValidationMessage'

const EMAIL_CHECK_DEBOUNCE_MS = 500

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function CheckoutContactSection() {
  const { t } = useI18n()
  const auth = useSnapshot(authStore)
  const checkout = useSnapshot(checkoutStore)
  const { openForgotPassword, forgotPasswordModal } = useForgotPasswordModal()
  const { openCheckoutLogin, checkoutLoginModal } = useCheckoutLoginModal()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lookupSeqRef = useRef(0)

  const email = checkout.draft.email
  const emailOk = isValidEmail(email)
  const lookup = checkout.emailLookup
  const billing = checkout.draft.billing
  const business = isBusinessCheckout()
  const segment = checkout.customerSegment ?? 'retail'

  /** Email già registrata → password + Accedi (senza toggle Registrati/Accedi). */
  const needsLogin = !auth.isAuthenticated && lookup.exists === true

  /** Flusso unico registrazione per non loggati con email libera / non ancora verificata. */
  const showRegisterFields = !auth.isAuthenticated && !needsLogin

  useEffect(() => {
    if (auth.isAuthenticated) return
    if (!emailOk) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      return
    }

    const normalized = email.trim().toLowerCase()
    if (lookup.status === 'ready' && lookup.email === normalized && lookup.exists != null) {
      return
    }
    if (lookup.status === 'loading' && lookup.email === normalized) {
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void runEmailCheck(normalized)
    }, EMAIL_CHECK_DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [
    email,
    emailOk,
    auth.isAuthenticated,
    lookup.status,
    lookup.email,
    lookup.exists,
  ])

  useEffect(() => {
    if (auth.isAuthenticated) return
    if (checkout.customerSegment == null) {
      setCustomerSegment('retail')
    }
  }, [auth.isAuthenticated, checkout.customerSegment])

  useEffect(() => {
    if (needsLogin) {
      setPassword('')
      setShowPassword(false)
      setRegisterError(null)
    }
  }, [needsLogin])

  async function runEmailCheck(normalized: string) {
    const seq = ++lookupSeqRef.current
    setEmailLookupLoading(normalized)
    try {
      const result = await api.auth.checkEmail(normalized)
      if (seq !== lookupSeqRef.current) return
      if (checkoutStore.draft.email.trim().toLowerCase() !== normalized) return
      applyEmailLookupResult(normalized, result.exists)
    } catch {
      if (seq !== lookupSeqRef.current) return
      setEmailLookupError(normalized)
    }
  }

  function clearAuthLoadingPhase(phase: 'account' | 'login') {
    if (checkoutStore.initLoadingPhase === phase) {
      checkoutStore.initLoadingPhase = null
    }
  }

  async function handleLogin() {
    setLoginError(null)
    setLoginLoading(true)
    checkoutStore.initLoadingPhase = 'login'
    try {
      await checkoutLogin(email.trim(), password)
      clearAuthLoadingPhase('login')
      setLoginLoading(false)
      setPassword('')
      setContactForceLogin(false)
      void fetchCart({ force: true }).catch(() => undefined)
      void prepareCheckoutAfterAuth()
    } catch (err) {
      setPassword('')
      setLoginError(
        err instanceof ApiRequestError
          ? (err.userMessage ?? err.message)
          : t('checkout.account.loginError'),
      )
      clearAuthLoadingPhase('login')
      setLoginLoading(false)
    }
  }

  async function handleRegister() {
    setRegisterError(null)
    setRegisterLoading(true)
    const firstName = billing.firstName.trim()
    const lastName = billing.lastName.trim()
    const companyName = checkout.business.companyName.trim()
    const vatNumber = checkout.business.vatNumber.trim()
    const fiscalCode = checkout.business.fiscalCode.trim()
    const noVat = checkout.business.noVatNumber

    if (!firstName || !lastName) {
      setRegisterError(t('checkout.error.incompleteStep'))
      setRegisterLoading(false)
      return
    }
    if (password.length < 8) {
      setRegisterError(t('register.passwordTooShort'))
      setRegisterLoading(false)
      return
    }
    if (
      segment === 'business' &&
      (!companyName || (noVat ? !fiscalCode : !vatNumber))
    ) {
      setRegisterError(t('checkout.error.incompleteStep'))
      setRegisterLoading(false)
      return
    }

    const phone = billing.phone?.trim() ?? ''
    if (!isCheckoutPhoneValid(phone)) {
      setRegisterError(t('checkout.shipping.phoneRequired'))
      setRegisterLoading(false)
      return
    }

    checkoutStore.initLoadingPhase = 'account'
    try {
      await checkoutRegister({
        email: email.trim(),
        password,
        firstName,
        lastName,
        phone,
        customerSegment: segment,
        companyName: segment === 'business' ? companyName : undefined,
        vatNumber: segment === 'business' && vatNumber ? vatNumber : undefined,
        fiscalCode: segment === 'business' && fiscalCode ? fiscalCode : undefined,
      })
      // Sessione PWA pronta: chiudi overlay subito (non attendere prefill/cart).
      // La latenza Odoo (~partner+portal) resta sul register HTTP; eventuali mail
      // post-sessione non devono tenere bloccata la UI.
      clearAuthLoadingPhase('account')
      setRegisterLoading(false)
      setPassword('')
      markAnagraficaCollectedAtAccount()
      initBillingFromShipping()
      void fetchCart({ force: true }).catch(() => undefined)
      void prepareCheckoutAfterAuth()
    } catch (err) {
      setPassword('')
      if (err instanceof ApiRequestError && err.code === 'EMAIL_TAKEN') {
        applyEmailLookupResult(email.trim().toLowerCase(), true)
        setLoginError(err.userMessage ?? err.message)
        setRegisterError(null)
        openCheckoutLogin(email)
      } else {
        setRegisterError(
          err instanceof ApiRequestError
            ? (err.userMessage ?? err.message)
            : t('checkout.account.registerError'),
        )
      }
      clearAuthLoadingPhase('account')
      setRegisterLoading(false)
    }
  }

  const emailField = (
    <div>
      <StripeFieldLabel htmlFor="checkout-contact-email">{t('common.email')}</StripeFieldLabel>
      <StripeFieldGroup>
        <div className="relative">
          <StripeControlledInput
            id="checkout-contact-email"
            type="email"
            name="checkout-contact-email"
            placeholder={t('common.email')}
            autoComplete="email"
            value={email}
            onValueChange={updateCheckoutEmail}
            required
            className={lookup.status === 'loading' ? 'pr-11' : undefined}
            aria-busy={lookup.status === 'loading'}
          />
          {lookup.status === 'loading' ? (
            <span
              className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-idl-muted"
              role="status"
              aria-live="polite"
              aria-label={t('checkout.contact.checking')}
            >
              <LoadingSpinner className="h-4 w-4" />
            </span>
          ) : null}
        </div>
      </StripeFieldGroup>
      {lookup.status === 'error' && emailOk ? (
        <p className="mt-1.5 text-xs text-amber-800">{t('checkout.contact.checkError')}</p>
      ) : null}
    </div>
  )

  if (auth.isAuthenticated && auth.me) {
    return (
      <section className="space-y-3">
        <StripeSectionTitle>{t('checkout.contact.title')}</StripeSectionTitle>
        <CheckoutAccountSection />
        <StripePayButton
          className="w-full"
          onClick={() => void advanceCheckoutStep()}
        >
          {t('checkout.continue')}
        </StripePayButton>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <StripeSectionTitle>{t('checkout.contact.title')}</StripeSectionTitle>

      <p className="text-sm text-idl-muted">
        {t('checkout.contact.hint')}{' '}
        <button
          type="button"
          className="font-semibold text-idl-graphite underline decoration-[#a1a1aa] underline-offset-2 hover:decoration-idl-graphite"
          onClick={() => {
            setLoginError(null)
            openCheckoutLogin(email)
          }}
        >
          {t('checkout.contact.loginLink')}
        </button>
      </p>

      {needsLogin ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-idl-graphite">{t('checkout.contact.loginRequired')}</p>
          {loginError ? <StripeErrorBanner message={loginError} /> : null}
          {emailField}
          <div>
            <StripeFieldLabel htmlFor="checkout-contact-password">{t('common.password')}</StripeFieldLabel>
            <StripeFieldGroup>
              <StripeControlledInput
                id="checkout-contact-password"
                type="password"
                name="checkout-contact-password"
                placeholder={t('common.password')}
                autoComplete="current-password"
                value={password}
                onValueChange={setPassword}
                required
              />
            </StripeFieldGroup>
          </div>
          <p className="text-right text-sm">
            <button
              type="button"
              onClick={() => openForgotPassword(email)}
              className="text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-900"
            >
              {t('login.forgot')}
            </button>
          </p>
          <StripePayButton
            className="w-full"
            disabled={!emailOk || !password || loginLoading}
            loading={loginLoading}
            onClick={() => void handleLogin()}
          >
            {loginLoading ? t('auth.loggingIn') : t('auth.loginSubmit')}
          </StripePayButton>
        </div>
      ) : null}

      {showRegisterFields ? (
        <div className="space-y-4">
          <CheckoutCustomerTypeCards
            variant="tabs"
            value={segment}
            onChange={setCustomerSegment}
            disabled={registerLoading}
          />

          {registerError ? <StripeErrorBanner message={registerError} /> : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <StripeFieldLabel htmlFor="checkout-reg-firstName">{t('common.firstName')}</StripeFieldLabel>
              <StripeFieldGroup>
                <StripeControlledInput
                  id="checkout-reg-firstName"
                  name="checkout-reg-firstName"
                  placeholder={t('checkout.register.firstName')}
                  autoComplete="given-name"
                  value={billing.firstName}
                  onValueChange={(value) => updateCheckoutAddress('billing', 'firstName', value)}
                  required
                />
              </StripeFieldGroup>
            </div>
            <div>
              <StripeFieldLabel htmlFor="checkout-reg-lastName">{t('common.lastName')}</StripeFieldLabel>
              <StripeFieldGroup>
                <StripeControlledInput
                  id="checkout-reg-lastName"
                  name="checkout-reg-lastName"
                  placeholder={t('checkout.register.lastName')}
                  autoComplete="family-name"
                  value={billing.lastName}
                  onValueChange={(value) => updateCheckoutAddress('billing', 'lastName', value)}
                  required
                />
              </StripeFieldGroup>
            </div>
          </div>

          {!business ? <CheckoutRetailFiscalCodeField disabled={registerLoading} /> : null}

          {business ? (
            <div className="space-y-3">
              <div>
                <StripeFieldLabel htmlFor="checkout-reg-company">
                  {t('checkout.billing.companyName')}
                </StripeFieldLabel>
                <StripeFieldGroup>
                  <StripeControlledInput
                    id="checkout-reg-company"
                    name="checkout-reg-company"
                    placeholder={t('checkout.billing.companyName')}
                    value={checkout.business.companyName}
                    onValueChange={(value) => updateBusinessField('companyName', value)}
                    required
                  />
                </StripeFieldGroup>
              </div>

              <CheckoutToggleCheckbox
                checked={checkout.business.noVatNumber}
                disabled={registerLoading || checkout.business.taxValidating}
                label={t('checkout.billing.noVatNumber')}
                onChange={setBusinessNoVatNumber}
              />

              {checkout.business.noVatNumber ? (
                <div>
                  <StripeFieldLabel htmlFor="checkout-reg-fiscal">
                    {t('checkout.billing.fiscalCode')}
                  </StripeFieldLabel>
                  <div className="flex items-stretch gap-2">
                    <StripeFieldGroup className="min-w-0 flex-1">
                      <StripeControlledInput
                        id="checkout-reg-fiscal"
                        name="checkout-reg-fiscal"
                        placeholder="RSSMRA80A01H501U"
                        autoComplete="off"
                        value={checkout.business.fiscalCode}
                        disabled={registerLoading || checkout.business.taxValidating}
                        normalize={(v) => v.toUpperCase()}
                        onValueChange={(value) => updateBusinessField('fiscalCode', value)}
                        onBlur={() => {
                          if (checkoutStore.business.taxValidating || registerLoading) return
                          void validateTaxFields().catch(() => undefined)
                        }}
                        required
                      />
                    </StripeFieldGroup>
                    <TaxVerifyButton
                      onClick={() => void validateTaxFields().catch(() => undefined)}
                      disabled={
                        !checkout.business.fiscalCode.trim() ||
                        registerLoading ||
                        checkout.business.taxValidating
                      }
                      loading={checkout.business.taxValidating}
                      verified={checkout.business.fiscalCodeValid === true}
                    />
                  </div>
                  <TaxValidationMessage
                    valid={
                      checkout.business.fiscalCode.trim()
                        ? checkout.business.fiscalCodeValid
                        : null
                    }
                    validLabel={t('checkout.billing.fiscalCodeValid')}
                    invalidLabel={t('checkout.billing.fiscalCodeInvalid')}
                    errorMessage={
                      checkout.business.fiscalCode.trim()
                        ? checkout.business.fiscalCodeError
                        : null
                    }
                  />
                </div>
              ) : (
                <div>
                  <StripeFieldLabel htmlFor="checkout-reg-vat">
                    {t('checkout.billing.vatNumber')}
                  </StripeFieldLabel>
                  <div className="flex items-stretch gap-2">
                    <StripeFieldGroup className="min-w-0 flex-1">
                      <StripeControlledInput
                        id="checkout-reg-vat"
                        name="checkout-reg-vat"
                        placeholder="IT12345678901"
                        value={checkout.business.vatNumber}
                        disabled={registerLoading || checkout.business.taxValidating}
                        normalize={(v) => v.toUpperCase()}
                        onValueChange={(value) => updateBusinessField('vatNumber', value)}
                        onBlur={() => {
                          if (checkoutStore.business.taxValidating || registerLoading) return
                          void validateTaxFields().catch(() => undefined)
                        }}
                        required
                      />
                    </StripeFieldGroup>
                    <TaxVerifyButton
                      onClick={() => void validateTaxFields().catch(() => undefined)}
                      disabled={
                        !checkout.business.vatNumber.trim() ||
                        registerLoading ||
                        checkout.business.taxValidating
                      }
                      loading={checkout.business.taxValidating}
                      verified={checkout.business.vatChecksumValid === true}
                    />
                  </div>
                  <TaxValidationMessage
                    valid={
                      checkout.business.vatNumber.trim()
                        ? checkout.business.vatChecksumValid
                        : null
                    }
                    validLabel={t('checkout.billing.vatFormatValid')}
                    invalidLabel={t('checkout.billing.vatFormatInvalid')}
                    errorMessage={
                      checkout.business.vatNumber.trim() ? checkout.business.vatError : null
                    }
                  />
                </div>
              )}
            </div>
          ) : null}

          <div>
            <StripeFieldLabel htmlFor="checkout-reg-phone">{t('common.phone')}</StripeFieldLabel>
            <StripeFieldGroup>
              <PhonePrefixField
                id="checkout-reg-phone"
                name="checkout-reg-phone"
                value={billing.phone ?? ''}
                defaultCountry={billing.country}
                required
                disabled={registerLoading}
                onValueChange={(value) => updateCheckoutAddress('billing', 'phone', value)}
              />
            </StripeFieldGroup>
          </div>

          {emailField}

          <div>
            <StripeFieldLabel htmlFor="checkout-reg-password">{t('common.password')}</StripeFieldLabel>
            <StripeFieldGroup>
              <StripeControlledInput
                id="checkout-reg-password"
                type="password"
                name="checkout-reg-password"
                placeholder={t('register.passwordHint')}
                autoComplete="new-password"
                value={password}
                onValueChange={setPassword}
                showPassword={showPassword}
                onShowPasswordChange={setShowPassword}
                required
                minLength={8}
              />
            </StripeFieldGroup>
            <p className="mt-1.5 text-right text-sm">
              <button
                type="button"
                disabled={registerLoading}
                onClick={() => {
                  setPassword(generateSecurePassword(12))
                  setShowPassword(true)
                }}
                className="text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-900 disabled:opacity-50"
              >
                {t('checkout.contact.generatePassword')}
              </button>
            </p>
            {password.length > 0 && password.length < 8 ? (
              <p className="mt-1.5 text-xs text-red-700" role="alert">
                {t('register.passwordTooShort')}
              </p>
            ) : null}
          </div>

          <StripePayButton
            className="w-full"
            disabled={
              registerLoading ||
              !emailOk ||
              password.length < 8 ||
              !billing.firstName.trim() ||
              !billing.lastName.trim() ||
              !isCheckoutPhoneValid(billing.phone ?? '') ||
              (business &&
                (!checkout.business.companyName.trim() ||
                  (checkout.business.noVatNumber
                    ? !checkout.business.fiscalCode.trim()
                    : !checkout.business.vatNumber.trim())))
            }
            loading={registerLoading}
            onClick={() => void handleRegister()}
          >
            {registerLoading ? t('checkout.processing') : t('checkout.account.createAndContinue')}
          </StripePayButton>
        </div>
      ) : null}

      {forgotPasswordModal}
      {checkoutLoginModal}
    </section>
  )
}
