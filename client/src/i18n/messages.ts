import type { PwaLocale } from '@/lib/locale'

export type MessageKey =
  | 'brand.name'
  | 'common.loading'
  | 'common.loadingCatalog'
  | 'common.confirm'
  | 'common.cancel'
  | 'common.pleaseWait'
  | 'common.notAvailable'
  | 'common.email'
  | 'common.password'
  | 'common.firstName'
  | 'common.lastName'
  | 'common.phone'
  | 'common.quantity'
  | 'common.remove'
  | 'common.all'
  | 'common.back'
  | 'common.save'
  | 'common.saving'
  | 'common.close'
  | 'common.menu'
  | 'nav.catalog'
  | 'nav.cart'
  | 'nav.account'
  | 'nav.login'
  | 'nav.register'
  | 'nav.wishlist'
  | 'nav.checkout'
  | 'nav.logout'
  | 'footer.tagline'
  | 'error.genericTitle'
  | 'notFound.metaTitle'
  | 'notFound.eyebrow'
  | 'notFound.title'
  | 'notFound.description'
  | 'notFound.backHome'
  | 'notFound.exploreCatalog'
  | 'notFound.searchPlaceholder'
  | 'notFound.searchCta'
  | 'notFound.assistenza'
  | 'notFound.linkDesign'
  | 'notFound.linkTechnical'
  | 'notFound.linkAttacco'
  | 'notFound.linkGuide'
  | 'notFound.linkProductNotFound'
  | 'notFound.footer'
  | 'productNotFound.formTitle'
  | 'productNotFound.formDescription'
  | 'productNotFound.photoProduct'
  | 'productNotFound.photoProductHint'
  | 'productNotFound.photoSocket'
  | 'productNotFound.photoSocketHint'
  | 'productNotFound.nameLabel'
  | 'productNotFound.namePlaceholder'
  | 'productNotFound.emailPlaceholder'
  | 'productNotFound.phoneLabel'
  | 'productNotFound.phonePlaceholder'
  | 'productNotFound.codeLabel'
  | 'productNotFound.codePlaceholder'
  | 'productNotFound.brandLabel'
  | 'productNotFound.brandPlaceholder'
  | 'productNotFound.usage'
  | 'productNotFound.usageHome'
  | 'productNotFound.usageShop'
  | 'productNotFound.usageOffice'
  | 'productNotFound.usageOutdoor'
  | 'productNotFound.usageInstall'
  | 'productNotFound.urgency'
  | 'productNotFound.urgencyLow'
  | 'productNotFound.urgencyMedium'
  | 'productNotFound.urgencyHigh'
  | 'productNotFound.messageLabel'
  | 'productNotFound.messagePlaceholder'
  | 'productNotFound.submit'
  | 'productNotFound.privacyNote'
  | 'productNotFound.privacyLink'
  | 'productNotFound.responseNote'
  | 'productNotFound.success'
  | 'productNotFound.error'
  | 'productNotFound.stepsTitle'
  | 'productNotFound.preferTalk'
  | 'productNotFound.whatsapp'
  | 'productNotFound.professionalsTitle'
  | 'productNotFound.professionalsBody'
  | 'productNotFound.professionalsCta'
  | 'productNotFound.showroomTitle'
  | 'productNotFound.showroomBody'
  | 'productNotFound.showroomCta'
  | 'auth.sessionChecking'
  | 'auth.redirectingToLogin'
  | 'auth.loggingIn'
  | 'auth.loggedIn'
  | 'auth.loggedOut'
  | 'auth.loggedOutLocalOnly'
  | 'auth.loginSubmit'
  | 'auth.registerSubmit'
  | 'auth.registering'
  | 'auth.noAccount'
  | 'auth.hasAccount'
  | 'auth.firstNamePlaceholder'
  | 'auth.lastNamePlaceholder'
  | 'auth.emailPlaceholder'
  | 'auth.loginError'
  | 'auth.recaptchaRequired'
  | 'auth.recaptchaFailed'
  | 'auth.recaptchaBanner'
  | 'auth.recaptchaPrivacy'
  | 'auth.recaptchaTerms'
  | 'home.title'
  | 'home.subtitle'
  | 'home.metaDescription'
  | 'home.featuredTitle'
  | 'home.featuredDescription'
  | 'home.goToCatalog'
  | 'home.viewAll'
  | 'home.categories'
  | 'catalog.title'
  | 'catalog.description'
  | 'catalog.metaDescription'
  | 'catalog.search'
  | 'catalog.searchLabel'
  | 'catalog.searchPlaceholder'
  | 'catalog.clearSearch'
  | 'catalog.noSuggestions'
  | 'catalog.suggestGroupAttacchi'
  | 'catalog.suggestGroupBrands'
  | 'catalog.suggestGroupCategories'
  | 'catalog.suggestGroupProducts'
  | 'catalog.suggestGroupHints'
  | 'catalog.suggestGroupQueries'
  | 'catalog.searchRecentLabel'
  | 'catalog.searchEmptyTitle'
  | 'catalog.searchEmptyDescription'
  | 'catalog.searchViewAllResults'
  | 'catalog.searchViewAllResultsNoCount'
  | 'catalog.searchKeyboardNavigate'
  | 'catalog.searchKeyboardSelect'
  | 'catalog.searchKeyboardClose'
  | 'catalog.searchShortcutHint'
  | 'catalog.searchPopularLabel'
  | 'catalog.searchClearRecent'
  | 'header.openSearch'
  | 'catalog.inStock'
  | 'catalog.inStockHint'
  | 'catalog.sort'
  | 'catalog.sortRelevance'
  | 'catalog.sortPriceAsc'
  | 'catalog.sortPriceDesc'
  | 'catalog.sortName'
  | 'catalog.minPrice'
  | 'catalog.maxPrice'
  | 'catalog.categoryLabel'
  | 'catalog.allCategories'
  | 'catalog.clearCategory'
  | 'catalog.hideCategories'
  | 'catalog.chooseCategory'
  | 'catalog.searchCategoryPlaceholder'
  | 'catalog.noCategoryFound'
  | 'catalog.showingCount'
  | 'catalog.inStockSuffix'
  | 'catalog.forQuery'
  | 'catalog.seenAll'
  | 'catalog.emptyTitle'
  | 'catalog.emptyDescription'
  | 'category.loading'
  | 'category.empty'
  | 'category.backToCatalog'
  | 'product.notAvailable'
  | 'product.backToCatalog'
  | 'product.sectionDescription'
  | 'product.sectionSpecs'
  | 'product.sectionActivity'
  | 'product.additionalInfo'
  | 'product.addToCart'
  | 'product.addToCartShort'
  | 'product.addingToCart'
  | 'product.availability.available'
  | 'product.availability.orderable'
  | 'product.availability.outOfStock'
  | 'product.availability.shippedInDays'
  | 'product.availability.shippedByDate'
  | 'product.availability.orderableFallback'
  | 'product.availability.lowStock'
  | 'product.outOfStock'
  | 'product.unavailable'
  | 'product.available'
  | 'product.lowStock'
  | 'product.relatedTitle'
  | 'product.grid.empty'
  | 'product.card.noImage'
  | 'product.quantityLabel'
  | 'product.variantLabel'
  | 'product.variantSoldOut'
  | 'product.meta.sku'
  | 'product.meta.categories'
  | 'product.meta.availability'
  | 'product.trust.secureTitle'
  | 'product.trust.secureDescription'
  | 'product.trust.freeShippingTitle'
  | 'product.trust.freeShippingDescription'
  | 'product.trust.refundTitle'
  | 'product.trust.refundDescription'
  | 'product.restock.notifyCta'
  | 'product.requestProduct'
  | 'product.restock.title'
  | 'product.restock.description'
  | 'product.restock.quantityDesired'
  | 'product.restock.confirmSent'
  | 'product.restock.submit'
  | 'product.restock.submitting'
  | 'product.restock.error'
  | 'product.socialProof.disabled'
  | 'product.socialProof.noEvents'
  | 'product.socialProof.minQuantityHint'
  | 'product.socialProof.purchased'
  | 'product.socialProof.closeNotifications'
  | 'product.socialProof.piece'
  | 'product.socialProof.pieces'
  | 'product.demand.unitsSold'
  | 'product.demand.recentBuyers'
  | 'product.card.addingAria'
  | 'product.card.inCartAria'
  | 'product.card.inCartTitle'
  | 'product.card.addAria'
  | 'product.card.outOfStockAria'
  | 'product.card.cartSr'
  | 'product.slider.prev'
  | 'product.slider.next'
  | 'login.title'
  | 'login.welcomeTitle'
  | 'login.subtitle'
  | 'login.forgot'
  | 'login.rememberMe'
  | 'login.passwordPlaceholder'
  | 'login.showPassword'
  | 'login.hidePassword'
  | 'login.professionalPrompt'
  | 'login.professionalCta'
  | 'register.title'
  | 'register.subtitle'
  | 'register.business'
  | 'register.passwordHint'
  | 'register.passwordPlaceholder'
  | 'forgot.title'
  | 'forgot.subtitle'
  | 'forgot.submit'
  | 'forgot.error'
  | 'forgot.sentMessage'
  | 'reset.title'
  | 'reset.submit'
  | 'reset.invalidLink'
  | 'reset.expiredLink'
  | 'reset.passwordLabel'
  | 'reset.requestNewLink'
  | 'reset.odooDelegated'
  | 'cart.title'
  | 'cart.pageTitle'
  | 'cart.description'
  | 'cart.clear'
  | 'cart.continueShopping'
  | 'cart.itemCountOne'
  | 'cart.itemCountMany'
  | 'cart.variant'
  | 'cart.perUnit'
  | 'cart.line.availableFast'
  | 'cart.line.availableLead'
  | 'cart.line.lowStock'
  | 'cart.line.orderable'
  | 'cart.line.unavailable'
  | 'cart.recommendationsTitle'
  | 'cart.recommendationsDescription'
  | 'cart.recommendationsLoading'
  | 'cart.recommendationsEmpty'
  | 'cart.summary.title'
  | 'cart.summary.subtotal'
  | 'cart.summary.tax'
  | 'cart.summary.shipping'
  | 'cart.summary.shippingFree'
  | 'cart.summary.total'
  | 'cart.summary.taxIncluded'
  | 'cart.summary.securePayment'
  | 'cart.summary.estimatesDisclaimer'
  | 'cart.checkoutCta'
  | 'cart.remove'
  | 'cart.empty.title'
  | 'cart.empty.description'
  | 'cart.empty.browseCatalog'
  | 'cart.empty.backHome'
  | 'cart.empty.popularCategories'
  | 'cart.empty.featured'
  | 'cart.toast.added'
  | 'cart.toast.quantity'
  | 'cart.toast.close'
  | 'cart.toast.openCart'
  | 'cart.stock.outOfStock'
  | 'cart.stock.insufficient'
  | 'cart.reservationExpired.title'
  | 'cart.reservationExpired.description'
  | 'cart.reservationExpired.dismiss'
  | 'cart.freeShipping.progress'
  | 'cart.freeShipping.remaining'
  | 'cart.freeShipping.unlocked'
  | 'cart.freeShipping.unlockedDetail'
  | 'cart.compatibility.title'
  | 'cart.compatibility.description'
  | 'cart.compatibility.cta'
  | 'cart.pricelist.b2b'
  | 'cart.pricelist.b2c'
  | 'cart.quoteCta'
  | 'cart.priceUpdated'
  | 'cart.professional.badge'
  | 'cart.professional.banner'
  | 'cart.unpurchasable.badge'
  | 'cart.unpurchasable.limitedBadge'
  | 'cart.unpurchasable.blockedCheckout'
  | 'cart.unpurchasable.moveToWishlist'
  | 'cart.unpurchasable.noPurchasableLines'
  | 'cart.delivery.banner'
  | 'cart.quote.title'
  | 'cart.quote.description'
  | 'cart.quote.stubMessage'
  | 'cart.quote.backToCart'
  | 'cart.quote.loginCta'
  | 'cart.quote.loginRequired'
  | 'cart.quote.accountTitle'
  | 'cart.quote.accountHint'
  | 'cart.quote.accountContinue'
  | 'cart.quote.reviewLines'
  | 'cart.quote.emptyCart'
  | 'cart.quote.notesLabel'
  | 'cart.quote.notesPlaceholder'
  | 'cart.quote.submit'
  | 'cart.quote.success'
  | 'cart.quote.successPending'
  | 'cart.quote.frozenTitle'
  | 'cart.quote.frozenDescription'
  | 'cart.quote.frozenNotice'
  | 'cart.quote.proceedCheckout'
  | 'cart.quote.checkoutStarted'
  | 'cart.quote.checkoutFailed'
  | 'cart.quote.steps.navLabel'
  | 'cart.quote.steps.group.account'
  | 'cart.quote.steps.group.details'
  | 'cart.quote.steps.pageTitle.account'
  | 'cart.quote.steps.pageTitle.accountConfirm'
  | 'cart.quote.steps.pageTitle.details'
  | 'cart.quote.steps.pageSubtitle.account'
  | 'cart.quote.steps.pageSubtitle.details'
  | 'cart.quote.estimateNotice'
  | 'wishlist.title'
  | 'wishlist.descriptionGuest'
  | 'wishlist.descriptionAccount'
  | 'wishlist.addAllToCart'
  | 'wishlist.emptyTitle'
  | 'wishlist.emptyDescription'
  | 'wishlist.unavailableTitle'
  | 'wishlist.unavailableDescription'
  | 'wishlist.item.unavailable'
  | 'wishlist.item.notInCatalog'
  | 'wishlist.item.addToCart'
  | 'wishlist.heart.add'
  | 'wishlist.heart.remove'
  | 'checkout.processing'
  | 'checkout.confirmOrder'
  | 'checkout.payAmount'
  | 'checkout.contactInfo'
  | 'checkout.shippingAddress'
  | 'checkout.billingAddress'
  | 'checkout.billingSameAsShipping'
  | 'checkout.continue'
  | 'checkout.continueToShipping'
  | 'checkout.continueToPayment'
  | 'checkout.selectShipping'
  | 'checkout.payment'
  | 'checkout.paymentNote'
  | 'walletQuickPay.checkoutFallback'
  | 'walletQuickPay.openCheckout'
  | 'checkout.steps.title'
  | 'checkout.steps.pageTitle.account'
  | 'checkout.steps.pageTitle.accountConfirm'
  | 'checkout.steps.details'
  | 'checkout.steps.account'
  | 'checkout.steps.customerType'
  | 'checkout.steps.addresses'
  | 'checkout.steps.deliveryRecipient'
  | 'checkout.steps.review'
  | 'checkout.steps.group.account'
  | 'checkout.steps.group.anagrafica'
  | 'checkout.steps.group.indirizzi'
  | 'checkout.steps.group.shipping'
  | 'checkout.steps.group.payment'
  | 'checkout.steps.payment'
  | 'checkout.steps.shipping'
  | 'checkout.stepProgress'
  | 'checkout.summary.subtotal'
  | 'checkout.summary.tax'
  | 'checkout.summary.shipping'
  | 'checkout.summary.free'
  | 'checkout.summary.total'
  | 'checkout.backToCart'
  | 'checkout.shipping.title'
  | 'checkout.shipping.noMethods'
  | 'checkout.shipping.addressIncomplete'
  | 'checkout.shipping.deliveryEstimate'
  | 'checkout.shipping.pickupRomeOnly'
  | 'checkout.shipping.addressSubtitle'
  | 'checkout.shipping.diffAddressSubtitle'
  | 'checkout.shipping.methodSubtitle'
  | 'checkout.shipping.diffFromBilling'
  | 'checkout.summary.showOrderSummary'
  | 'checkout.summary.hideOrderSummary'
  | 'checkout.summary.promoHint'
  | 'checkout.summary.crossSellTitle'
  | 'checkout.summary.crossSellCompat'
  | 'checkout.summary.crossSellAdd'
  | 'checkout.summary.secureBadge'
  | 'checkout.summary.securePayment'
  | 'checkout.summary.returns'
  | 'checkout.loading.dontClose'
  | 'checkout.loading.address'
  | 'checkout.loading.shipping'
  | 'checkout.loading.payment'
  | 'checkout.payStore'
  | 'checkout.steps.navLabel'
  | 'checkout.address.fullName'
  | 'checkout.address.phoneOptional'
  | 'checkout.address.line1'
  | 'checkout.address.streetNumber'
  | 'checkout.address.isSnc'
  | 'checkout.address.streetNumberHint'
  | 'checkout.address.courierNotes'
  | 'checkout.orderNotes'
  | 'checkout.orderNotesPlaceholder'
  | 'checkout.address.line2'
  | 'checkout.address.city'
  | 'checkout.address.postalCode'
  | 'checkout.address.detailsTitle'
  | 'checkout.address.lockEdits'
  | 'checkout.address.unlockEdits'
  | 'checkout.address.changeAddress'
  | 'checkout.address.label'
  | 'checkout.address.country'
  | 'checkout.address.selectedTitle'
  | 'checkout.address.searchPlaceholder'
  | 'checkout.address.googleHint'
  | 'checkout.address.resolvingPrefill'
  | 'checkout.account.guestHint'
  | 'checkout.account.continueAsGuest'
  | 'checkout.account.requiredHint'
  | 'checkout.account.registerTab'
  | 'checkout.account.loginTab'
  | 'checkout.account.orDivider'
  | 'checkout.account.createAndContinue'
  | 'checkout.account.registerError'
  | 'checkout.register.firstName'
  | 'checkout.register.lastName'
  | 'checkout.register.changeCustomerType'
  | 'checkout.customerType.hint'
  | 'checkout.customerType.retail.title'
  | 'checkout.customerType.business.title'
  | 'checkout.deliveryRecipient.hint'
  | 'checkout.deliveryRecipient.self.title'
  | 'checkout.deliveryRecipient.self.description'
  | 'checkout.deliveryRecipient.other.title'
  | 'checkout.deliveryRecipient.other.description'
  | 'checkout.deliveryRecipient.company'
  | 'checkout.deliveryRecipient.addressTitle'
  | 'checkout.deliveryRecipient.notSavedHint'
  | 'checkout.billing.professionalActive'
  | 'checkout.billing.subtitle'
  | 'checkout.addresses.subtitle'
  | 'checkout.billing.businessTitle'
  | 'checkout.billing.companyName'
  | 'checkout.billing.vatNumber'
  | 'checkout.billing.fiscalCode'
  | 'checkout.billing.fiscalCodeOptional'
  | 'checkout.billing.pec'
  | 'checkout.billing.sdiCode'
  | 'checkout.billing.pecOrSdiHint'
  | 'checkout.billing.clientOrderRefOptional'
  | 'checkout.billing.fiscalCodeValid'
  | 'checkout.billing.fiscalCodeInvalid'
  | 'checkout.billing.vatFormatValid'
  | 'checkout.billing.vatFormatInvalid'
  | 'checkout.billing.verify'
  | 'checkout.billing.verifying'
  | 'checkout.billing.verifyVatVies'
  | 'checkout.billing.vatViesValid'
  | 'checkout.billing.vatViesInvalid'
  | 'checkout.billing.viesUnavailable'
  | 'checkout.billing.vatForceAccepted'
  | 'checkout.billing.vatAttempt'
  | 'checkout.review.clientOrderRef'
  | 'checkout.review.hint'
  | 'checkout.review.acceptTerms'
  | 'checkout.review.summaryTitle'
  | 'checkout.review.detailsToggle'
  | 'checkout.review.secureFooter'
  | 'checkout.payment.bankTransfer'
  | 'checkout.payment.card'
  | 'checkout.account.loginPrompt'
  | 'checkout.account.loginError'
  | 'checkout.account.notYou'
  | 'checkout.account.logoutConfirmDescription'
  | 'bankTransfer.title'
  | 'bankTransfer.description'
  | 'bankTransfer.copy'
  | 'bankTransfer.copied'
  | 'bankTransfer.copyAll'
  | 'bankTransfer.holder'
  | 'bankTransfer.iban'
  | 'bankTransfer.bank'
  | 'bankTransfer.amount'
  | 'bankTransfer.reference'
  | 'bankTransfer.awaitingNote'
  | 'paymentResult.loading'
  | 'paymentResult.notFound'
  | 'paymentResult.fetchError'
  | 'paymentResult.syncNote'
  | 'paymentResult.orderPwa'
  | 'paymentResult.orderOdoo'
  | 'paymentResult.paymentStatus'
  | 'paymentResult.total'
  | 'paymentResult.myOrders'
  | 'paymentResult.catalog'
  | 'paymentResult.status.paid'
  | 'paymentResult.status.pending'
  | 'paymentResult.status.failed'
  | 'thankYou.hero.confirmedEyebrow'
  | 'thankYou.hero.pendingEyebrow'
  | 'thankYou.hero.failedEyebrow'
  | 'thankYou.hero.confirmedTitle'
  | 'thankYou.hero.confirmedTitleGeneric'
  | 'thankYou.hero.pendingTitle'
  | 'thankYou.hero.failedTitle'
  | 'thankYou.hero.emailPrefix'
  | 'thankYou.hero.confirmedBody'
  | 'thankYou.hero.pendingBody'
  | 'thankYou.hero.failedBody'
  | 'thankYou.hero.retryCheckout'
  | 'thankYou.hero.retryPayment'
  | 'thankYou.orderNumber'
  | 'thankYou.estimatedDelivery'
  | 'thankYou.deliverySoon'
  | 'thankYou.tracker.title'
  | 'thankYou.tracker.confirmed'
  | 'thankYou.tracker.preparing'
  | 'thankYou.tracker.shipped'
  | 'thankYou.tracker.delivered'
  | 'thankYou.tracker.now'
  | 'thankYou.tracker.today'
  | 'thankYou.tracker.afterPayment'
  | 'thankYou.tracker.trackingNote'
  | 'thankYou.tracker.pickupNote'
  | 'thankYou.tracker.trackCta'
  | 'thankYou.lines.title'
  | 'thankYou.lines.quantity'
  | 'thankYou.support.title'
  | 'thankYou.support.body'
  | 'thankYou.support.cta'
  | 'thankYou.summary.title'
  | 'thankYou.summary.subtotal'
  | 'thankYou.summary.shipping'
  | 'thankYou.summary.total'
  | 'thankYou.summary.vat'
  | 'thankYou.summary.shipTo'
  | 'thankYou.summary.payment'
  | 'thankYou.shippingFree'
  | 'thankYou.account.title'
  | 'thankYou.account.body'
  | 'thankYou.account.cta'
  | 'thankYou.crossSell.eyebrow'
  | 'thankYou.crossSell.title'
  | 'thankYou.crossSell.catalog'
  | 'purchaseError.securePayment'
  | 'purchaseError.supportPhone'
  | 'purchaseError.hero.title'
  | 'purchaseError.hero.bodyPrefix'
  | 'purchaseError.hero.bodyStrong'
  | 'purchaseError.hero.bodySuffix'
  | 'purchaseError.hero.retryPayment'
  | 'purchaseError.hero.changeMethod'
  | 'purchaseError.attemptRef'
  | 'purchaseError.causes.title'
  | 'purchaseError.causes.intro'
  | 'purchaseError.causes.card.title'
  | 'purchaseError.causes.card.body'
  | 'purchaseError.causes.secure3ds.title'
  | 'purchaseError.causes.secure3ds.body'
  | 'purchaseError.causes.limit.title'
  | 'purchaseError.causes.limit.body'
  | 'purchaseError.methods.title'
  | 'purchaseError.methods.card'
  | 'purchaseError.methods.paypal'
  | 'purchaseError.methods.bankTransfer'
  | 'purchaseError.support.title'
  | 'purchaseError.support.body'
  | 'purchaseError.support.cta'
  | 'purchaseError.cart.title'
  | 'purchaseError.cart.noCharge'
  | 'purchaseError.cart.reserved'
  | 'purchaseError.cart.ssl'
  | 'purchaseError.cart.backToShop'
  | 'purchaseError.taxIncluded'
  | 'purchaseError.footer.company'
  | 'purchaseError.footer.help'
  | 'account.pricelist'
  | 'account.greeting.named'
  | 'account.greeting.default'
  | 'account.overview.myOrders'
  | 'account.overview.editProfile'
  | 'account.overview.recentOrders'
  | 'account.overview.allOrders'
  | 'account.overview.noOrders'
  | 'account.overview.browseCatalog'
  | 'account.overview.segmentB2b'
  | 'account.overview.segmentB2c'
  | 'account.overview.segmentProfessional'
  | 'account.overview.accountType'
  | 'account.overview.recentQuotes'
  | 'account.overview.recentInvoices'
  | 'account.overview.viewAllQuotes'
  | 'account.overview.viewAllInvoices'
  | 'account.overview.noQuotes'
  | 'account.overview.noInvoices'
  | 'account.overview.payableQuotesHint'
  | 'account.overview.professionalActive'
  | 'account.nav.overview'
  | 'account.nav.dashboard'
  | 'account.nav.profile'
  | 'account.nav.orders'
  | 'account.nav.parts'
  | 'account.nav.addresses'
  | 'account.nav.payments'
  | 'account.nav.data'
  | 'account.nav.support'
  | 'account.nav.wishlist'
  | 'account.nav.quotes'
  | 'account.nav.invoices'
  | 'account.dashboard.totalOrders'
  | 'account.dashboard.inProgress'
  | 'account.dashboard.savedParts'
  | 'account.dashboard.ongoingOrder'
  | 'account.dashboard.details'
  | 'account.dashboard.delivery'
  | 'account.dashboard.deliverySoon'
  | 'account.dashboard.reorderParts'
  | 'account.dashboard.reorderPartsBody'
  | 'account.dashboard.goToParts'
  | 'account.dashboard.openQuotes'
  | 'account.dashboard.invoices'
  | 'account.parts.title'
  | 'account.parts.description'
  | 'account.parts.savedCount'
  | 'account.addresses.current'
  | 'account.payments.title'
  | 'account.payments.current'
  | 'account.quotes.title'
  | 'account.quotes.description'
  | 'account.quotes.empty'
  | 'account.quotes.view'
  | 'account.quotes.status.requested'
  | 'account.quotes.status.sent'
  | 'account.quotes.status.checkout_started'
  | 'account.quotes.status.converted'
  | 'account.quotes.status.draft'
  | 'account.quotes.status.cancelled'
  | 'account.quotes.badge.expired'
  | 'account.quotes.badge.payable'
  | 'account.quotes.badge.pending'
  | 'account.quotes.badge.preparing'
  | 'account.quotes.message.expired'
  | 'account.quotes.message.notPayable'
  | 'account.quotes.message.not_sent'
  | 'account.quotes.message.cancelled'
  | 'account.quotes.message.converted'
  | 'account.quotes.message.draft'
  | 'account.quotes.validUntil'
  | 'account.quotes.linesTitle'
  | 'account.quotes.expiredContact'
  | 'account.quotes.viewOrder'
  | 'account.invoices.title'
  | 'account.invoices.description'
  | 'account.invoices.empty'
  | 'account.invoices.loadError'
  | 'account.quotes.checkout'
  | 'account.invoices.download'
  | 'account.invoices.pdfPending'
  | 'account.invoices.pdfDownloadError'
  | 'account.invoices.portalLink'
  | 'checkout.frozenQuote.title'
  | 'checkout.frozenQuote.loading'
  | 'account.profile.businessTitle'
  | 'account.profile.businessData'
  | 'account.profile.businessHint'
  | 'account.overview.professionalCta'
  | 'account.overview.professionalCtaLink'
  | 'account.overview.professionalPending'
  | 'account.overview.professionalRejected'
  | 'account.shell.backToCatalog'
  | 'account.shell.backToShop'
  | 'account.shell.cart'
  | 'account.shell.continueShopping'
  | 'account.shell.logout'
  | 'account.shell.logoutShort'
  | 'account.shell.logoutConfirmTitle'
  | 'account.shell.logoutConfirmDescription'
  | 'account.profile.validationError'
  | 'account.profile.personalData'
  | 'account.profile.emailReadonly'
  | 'account.profile.preferredPayment'
  | 'account.profile.preferredPaymentHint'
  | 'account.profile.shippingAddress'
  | 'account.profile.save'
  | 'account.profile.odooSyncWarning'
  | 'account.profile.saving'
  | 'account.section.orders.title'
  | 'account.section.orders.description'
  | 'account.section.profile.title'
  | 'account.section.profile.description'
  | 'account.section.overview.description'
  | 'account.meta.customer'
  | 'account.meta.email'
  | 'account.meta.phone'
  | 'account.meta.shippingAddress'
  | 'account.meta.preferredPayment'
  | 'account.meta.orders'
  | 'account.orders.emptyTitle'
  | 'account.orders.emptyDescription'
  | 'account.orders.track'
  | 'account.orders.reorder'
  | 'account.orders.itemCount'
  | 'account.orders.table.order'
  | 'account.orders.table.date'
  | 'account.orders.table.total'
  | 'account.orders.table.status'
  | 'account.orders.table.detail'
  | 'account.orders.table.reorder'
  | 'account.orders.table.reordering'
  | 'orders.detail.loading'
  | 'orders.detail.back'
  | 'orders.detail.reorder'
  | 'orders.detail.items'
  | 'orders.detail.quantity'
  | 'orders.detail.orderStatus'
  | 'orders.detail.paymentStatus'
  | 'orders.detail.total'
  | 'orders.detail.date'
  | 'orders.detail.pwaRef'
  | 'orders.detail.completeOrder'
  | 'orders.detail.invoicePortal'
  | 'orders.reorder.success'
  | 'orders.reorder.error'
  | 'impersonate.invalidLink'
  | 'impersonate.expiredLink'
  | 'impersonate.loading'
  | 'breadcrumb.home'
  | 'category.products'
  | 'legal.terms'
  | 'legal.privacy'
  | 'paymentMethod.stripe'
  | 'paymentMethod.stripeDescription'
  | 'paymentMethod.bankTransfer'
  | 'paymentMethod.bankTransferDescription'
  | 'orderStatus.cart_created'
  | 'orderStatus.checkout_started'
  | 'orderStatus.payment_started'
  | 'orderStatus.payment_pending'
  | 'orderStatus.paid'
  | 'orderStatus.paid_sync_pending'
  | 'orderStatus.synced'
  | 'orderStatus.payment_failed'
  | 'orderStatus.abandoned'
  | 'orderStatus.cancelled'
  | 'orderStatus.confirmed'
  | 'orderStatus.completed'
  | 'paymentStatus.not_started'
  | 'paymentStatus.created'
  | 'paymentStatus.pending'
  | 'paymentStatus.captured'
  | 'paymentStatus.failed'
  | 'paymentStatus.cancelled'
  | 'paymentStatus.refunded'
  | 'impersonation.banner.viewing'
  | 'impersonation.banner.startedBy'
  | 'impersonation.banner.end'
  | 'cart.floating.close'
  | 'cart.floating.loading'
  | 'cart.floating.items'
  | 'cart.floating.estimatedTotal'
  | 'cart.floating.moreLines'
  | 'cart.floating.openCart'
  | 'cart.floating.openMiniCart'
  | 'checkout.payment.loadingModule'
  | 'checkout.payment.orPayWithCard'
  | 'checkout.payment.orderSr'
  | 'checkout.payment.prepareError'
  | 'checkout.payment.failed'
  | 'checkout.payment.cardholderName'
  | 'checkout.payment.cardholderNamePlaceholder'
  | 'checkout.payment.cardholderNameRequired'
  | 'checkout.payment.formNotReady'
  | 'checkout.payment.cardIncomplete'
  | 'checkout.poweredByStripe'
  | 'checkout.emailPlaceholder'
  | 'checkout.error.incompleteAddress'
  | 'checkout.error.incompleteStep'
  | 'checkout.error.authRequired'
  | 'checkout.error.generic'
  | 'checkout.error.missingOrder'
  | 'checkout.error.missingPayment'
  | 'checkout.error.orderUnavailable'
  | 'checkout.error.alreadyPaid'
  | 'checkout.shipping.eta'
  | 'checkout.address.typeToSearch'
  | 'breadcrumb.nav'
  | 'language.switcher.current'
  | 'language.switcher.other'
  | 'theme.switcher.title'
  | 'theme.switcher.toLight'
  | 'theme.switcher.toDark'
  | 'theme.switcher.toClassic'
  | 'skeleton.loadingProducts'
  | 'skeleton.loadingCart'
  | 'skeleton.loadingCartSummary'
  | 'skeleton.loadingProduct'
  | 'skeleton.loadingCheckout'
  | 'skeleton.loadingPageHeader'
  | 'skeleton.loadingForm'
  | 'skeleton.loadingPaymentResult'
  | 'skeleton.loadingCatalogFilters'
  | 'skeleton.loadingAccount'
  | 'skeleton.loadingList'

const IT: Record<MessageKey, string> = {
  'brand.name': 'Idea di Luce',
  'common.loading': 'Caricamento…',
  'common.loadingCatalog': 'Caricamento negozio in corso…',
  'common.confirm': 'Conferma',
  'common.cancel': 'Annulla',
  'common.pleaseWait': 'Attendere…',
  'common.notAvailable': '—',
  'common.email': 'Email',
  'common.password': 'Password',
  'common.firstName': 'Nome',
  'common.lastName': 'Cognome',
  'common.phone': 'Telefono',
  'common.quantity': 'Quantità',
  'common.remove': 'Rimuovi',
  'common.all': 'Tutti',
  'common.back': 'Indietro',
  'common.save': 'Salva',
  'common.saving': 'Salvataggio…',
  'common.close': 'Chiudi',
  'common.menu': 'Menu',
  'nav.catalog': 'Negozio',
  'nav.cart': 'Carrello',
  'nav.account': 'Account',
  'nav.login': 'Accedi',
  'nav.register': 'Registrati',
  'nav.wishlist': 'Preferiti',
  'nav.checkout': 'Checkout',
  'nav.logout': 'Esci',
  'footer.tagline': 'Idea di Luce · illuminazione per casa e professionisti',
  'error.genericTitle': 'Qualcosa è andato storto',
  'notFound.metaTitle': 'Pagina non trovata',
  'notFound.eyebrow': 'ERRORE 404',
  'notFound.title': 'Qui la luce si è spenta.',
  'notFound.description':
    'La pagina che cerchi è stata spostata, rimossa o non è mai esistita. Ma non resti al buio: ripartiamo da qui.',
  'notFound.backHome': 'Torna alla home',
  'notFound.exploreCatalog': 'Esplora il negozio',
  'notFound.searchPlaceholder': 'Cerca per prodotto, attacco, codice o marca',
  'notFound.searchCta': 'Cerca',
  'notFound.assistenza': 'Assistenza',
  'notFound.linkDesign': "Illuminazione d'arredo",
  'notFound.linkTechnical': 'Prodotti tecnici',
  'notFound.linkAttacco': 'Scegli per attacco',
  'notFound.linkGuide': 'Guide',
  'notFound.linkProductNotFound': 'Prodotto non trovato?',
  'notFound.footer': 'TLB Italy Srl · Via Appia Pignatelli 450, Roma · info@ideadiluce.com',
  'productNotFound.formTitle': 'Raccontaci cosa cerchi',
  'productNotFound.formDescription':
    'Più informazioni ci dai, più velocemente troviamo il prodotto corretto.',
  'productNotFound.photoProduct': 'Foto del prodotto o dell\'attacco',
  'productNotFound.photoProductHint': 'Trascina la foto del prodotto',
  'productNotFound.photoSocket': 'Foto dell\'attacco',
  'productNotFound.photoSocketHint': 'Foto dell\'attacco da vicino',
  'productNotFound.nameLabel': 'Nome e cognome',
  'productNotFound.namePlaceholder': 'Mario Rossi',
  'productNotFound.emailPlaceholder': 'mario@email.it',
  'productNotFound.phoneLabel': 'Telefono / WhatsApp',
  'productNotFound.phonePlaceholder': '+39 ___ ___ ____',
  'productNotFound.codeLabel': 'Codice / EAN / MPN',
  'productNotFound.codePlaceholder': 'es. 8711500411990',
  'productNotFound.brandLabel': 'Marca (se nota)',
  'productNotFound.brandPlaceholder': 'Philips, Osram…',
  'productNotFound.usage': 'Uso',
  'productNotFound.usageHome': 'Casa',
  'productNotFound.usageShop': 'Negozio',
  'productNotFound.usageOffice': 'Ufficio',
  'productNotFound.usageOutdoor': 'Esterno',
  'productNotFound.usageInstall': 'Impianto',
  'productNotFound.urgency': 'Urgenza',
  'productNotFound.urgencyLow': 'Bassa',
  'productNotFound.urgencyMedium': 'Media',
  'productNotFound.urgencyHigh': 'Alta',
  'productNotFound.messageLabel': 'Messaggio',
  'productNotFound.messagePlaceholder': 'Descrivi il prodotto, dove lo usavi e cosa ti serve…',
  'productNotFound.submit': 'Invia la richiesta',
  'productNotFound.privacyNote': 'Inviando accetti la',
  'productNotFound.privacyLink': 'Privacy Policy',
  'productNotFound.responseNote': 'Ti rispondiamo via email o WhatsApp, di solito in giornata.',
  'productNotFound.success': 'Richiesta inviata. Ti risponderemo al più presto.',
  'productNotFound.error': 'Invio non riuscito',
  'productNotFound.stepsTitle': 'Come funziona',
  'productNotFound.preferTalk': 'PREFERISCI PARLARNE?',
  'productNotFound.whatsapp': 'Scrivici su WhatsApp',
  'productNotFound.professionalsTitle': 'Anche per professionisti',
  'productNotFound.professionalsBody':
    'Liste lunghe o riordini ricorrenti? Caricaci un file con i codici: ti prepariamo un preventivo unico.',
  'productNotFound.professionalsCta': 'Area professionisti',
  'productNotFound.showroomTitle': 'Showroom di Roma',
  'productNotFound.showroomBody':
    'Via Appia Pignatelli 450 · Lun–Ven 9–13 / 15–18. Porta il pezzo: lo identifichiamo al volo.',
  'productNotFound.showroomCta': 'Scopri lo showroom',
  'auth.sessionChecking': 'Verifica sessione…',
  'auth.redirectingToLogin': 'Reindirizzamento al login…',
  'auth.loggingIn': 'Accesso…',
  'auth.loggedIn': 'Accesso effettuato.',
  'auth.loggedOut': 'Sei uscito dall’account.',
  'auth.loggedOutLocalOnly':
    'Sessione locale chiusa. Se noti anomalie, ricarica la pagina o riprova.',
  'auth.loginSubmit': 'Entra',
  'auth.registerSubmit': 'Registrati',
  'auth.registering': 'Registrazione…',
  'auth.noAccount': 'Non hai un account?',
  'auth.hasAccount': 'Hai già un account?',
  'auth.firstNamePlaceholder': 'Mario',
  'auth.lastNamePlaceholder': 'Rossi',
  'auth.emailPlaceholder': 'nome@email.com',
  'auth.loginError': 'Errore di accesso',
  'auth.recaptchaRequired': 'Completa la verifica anti-bot prima di continuare.',
  'auth.recaptchaFailed': 'Verifica anti-bot non superata. Riprova.',
  'auth.recaptchaBanner': 'Protezione Google reCAPTCHA attiva.',
  'auth.recaptchaPrivacy': 'Privacy',
  'auth.recaptchaTerms': 'Termini',
  'home.title': 'Idea di Luce',
  'home.subtitle': 'Illuminazione per casa e professionisti',
  'home.metaDescription': 'La luce pensata. Illuminazione per casa e professionisti.',
  'home.featuredTitle': 'Prodotti in evidenza',
  'home.featuredDescription': 'Una selezione dal negozio disponibile.',
  'home.goToCatalog': 'Vai al negozio',
  'home.viewAll': 'Vedi tutti i prodotti',
  'home.categories': 'Categorie',
  'catalog.title': 'Negozio',
  'catalog.description': 'Cerca prodotti, filtra per categoria e ordina i risultati.',
  'catalog.metaDescription': 'Negozio illuminazione — lampade, applique e soluzioni per casa e professionisti.',
  'catalog.search': 'Cerca prodotti',
  'catalog.searchLabel': 'Cerca nel negozio',
  'catalog.searchPlaceholder': 'Cerca prodotto, attacco, codice o marca…',
  'catalog.clearSearch': 'Cancella ricerca',
  'catalog.noSuggestions': 'Nessun suggerimento nei prodotti caricati.',
  'catalog.suggestGroupAttacchi': 'Attacchi',
  'catalog.suggestGroupBrands': 'Marchi',
  'catalog.suggestGroupCategories': 'Categorie',
  'catalog.suggestGroupProducts': 'Prodotti',
  'catalog.suggestGroupHints': 'Suggerimenti',
  'catalog.suggestGroupQueries': 'Ricerche',
  'catalog.searchRecentLabel': 'Ricerche recenti',
  'catalog.searchEmptyTitle': 'Nessun risultato',
  'catalog.searchEmptyDescription': 'Prova con altri termini, un codice attacco o una marca.',
  'catalog.searchViewAllResults': 'Vedi tutti i {count} risultati',
  'catalog.searchViewAllResultsNoCount': 'Vedi tutti i risultati',
  'catalog.searchKeyboardNavigate': 'Naviga',
  'catalog.searchKeyboardSelect': 'Seleziona',
  'catalog.searchKeyboardClose': 'Chiudi',
  'catalog.searchShortcutHint': 'Premi {shortcut} per aprire la ricerca',
  'catalog.searchPopularLabel': 'Ricerche popolari',
  'catalog.searchClearRecent': 'Cancella',
  'header.openSearch': 'Apri ricerca negozio',
  'catalog.inStock': 'Solo disponibili',
  'catalog.inStockHint': 'Mostra solo prodotti con giacenza in magazzino.',
  'catalog.sort': 'Ordina',
  'catalog.sortRelevance': 'Rilevanza',
  'catalog.sortPriceAsc': 'Prezzo crescente',
  'catalog.sortPriceDesc': 'Prezzo decrescente',
  'catalog.sortName': 'Nome A–Z',
  'catalog.minPrice': 'Prezzo min (€)',
  'catalog.maxPrice': 'Prezzo max (€)',
  'catalog.categoryLabel': 'Categoria',
  'catalog.allCategories': 'Tutte le categorie',
  'catalog.clearCategory': 'Cancella categoria',
  'catalog.hideCategories': 'Nascondi categorie',
  'catalog.chooseCategory': 'Scegli categoria ({count})',
  'catalog.searchCategoryPlaceholder': 'Cerca categoria…',
  'catalog.noCategoryFound': 'Nessuna categoria trovata.',
  'catalog.showingCount': 'Mostrati {shown} di {total} prodotti',
  'catalog.inStockSuffix': ' disponibili',
  'catalog.forQuery': ' per “{query}”',
  'catalog.seenAll': 'Hai visto tutti i prodotti.',
  'catalog.emptyTitle': 'Nessun prodotto',
  'catalog.emptyDescription': 'Prova un altro filtro.',
  'category.loading': 'Caricamento…',
  'category.empty': 'Nessun prodotto in questa categoria.',
  'category.backToCatalog': '← {catalog}',
  'product.notAvailable': 'Prodotto non disponibile',
  'product.backToCatalog': 'Torna al negozio',
  'product.sectionDescription': 'Descrizione del prodotto',
  'product.sectionSpecs': 'Caratteristiche tecniche',
  'product.sectionActivity': 'Attività recente',
  'product.additionalInfo': 'Informazioni aggiuntive',
  'product.addToCart': 'Aggiungi al carrello',
  'product.addToCartShort': 'Aggiungi',
  'product.addingToCart': 'Aggiunta in corso…',
  'product.availability.available': 'Disponibile',
  'product.availability.orderable': 'Ordinabile',
  'product.availability.outOfStock': 'Fuori stock',
  'product.availability.shippedInDays': 'Spedito in {days} giorni lavorativi',
  'product.availability.shippedByDate': 'Spedito indicativamente entro il {date}',
  'product.availability.orderableFallback':
    'Ordinabile — spedito indicativamente in 10 giorni lavorativi',
  'product.availability.lowStock': 'Solo {count} disponibili',
  'product.outOfStock': 'Fuori stock',
  'product.unavailable': 'Non disponibile',
  'product.available': 'Disponibile',
  'product.lowStock': 'Solo {count} disponibili',
  'product.relatedTitle': 'Ti potrebbe interessare…',
  'product.grid.empty': 'Nessun prodotto in elenco.',
  'product.card.noImage': 'Nessuna immagine',
  'product.quantityLabel': 'Quantità',
  'product.variantLabel': 'Variante',
  'product.variantSoldOut': 'Esaurito',
  'product.meta.sku': 'COD:',
  'product.meta.categories': 'Categorie:',
  'product.meta.availability': 'Disponibilità',
  'product.trust.secureTitle': '100% Sicuro',
  'product.trust.secureDescription': 'Grazie alla crittografia SSL che protegge le tue transazioni.',
  'product.trust.freeShippingTitle': 'Spedizioni gratuite',
  'product.trust.freeShippingDescription': "Per ordini dall'Italia pari o superiori a € 200 (IVA esclusa).",
  'product.trust.refundTitle': 'Soddisfatti o rimborsati',
  'product.trust.refundDescription': 'Restituendo gli articoli entro 14 giorni, rimborsiamo i tuoi acquisti.',
  'product.restock.notifyCta': 'Avvisami al restock',
  'product.requestProduct': 'Richiedi prodotto',
  'product.restock.title': 'Avvisami quando torna disponibile',
  'product.restock.description': 'Indica email e quantità desiderata: ti contatteremo al restock.',
  'product.restock.quantityDesired': 'Quantità desiderata',
  'product.restock.confirmSent': 'Ti avviseremo a {email} quando {productName} torna disponibile',
  'product.restock.submit': 'Richiedi notifica',
  'product.restock.submitting': 'Invio…',
  'product.restock.error': 'Impossibile registrare la richiesta. Riprova.',
  'product.socialProof.disabled': 'Le notifiche di attività recente non sono attive per questo negozio.',
  'product.socialProof.noEvents': 'Nessun acquisto recente da mostrare per questo prodotto',
  'product.socialProof.minQuantityHint': ' (min. {count} pezzi)',
  'product.socialProof.purchased': '{buyer} ha acquistato {quantity}',
  'product.socialProof.closeNotifications': 'Chiudi notifiche acquisti',
  'product.socialProof.piece': '1 pezzo',
  'product.socialProof.pieces': '{count} pezzi',
  'product.demand.unitsSold': '{count} acquisti negli ultimi 30 giorni',
  'product.demand.recentBuyers': '{count} clienti hanno acquistato di recente',
  'product.card.addingAria': 'Aggiunta di {productName} al carrello in corso',
  'product.card.inCartAria': '{productName} nel carrello, quantità {count}',
  'product.card.inCartTitle': 'Nel carrello ({count})',
  'product.card.addAria': 'Aggiungi {productName} al carrello',
  'product.card.outOfStockAria': '{productName} fuori stock',
  'product.card.cartSr': 'Carrello',
  'product.slider.prev': 'Prodotti precedenti',
  'product.slider.next': 'Prodotti successivi',
  'login.title': 'Accedi',
  'login.welcomeTitle': 'Bentornato',
  'login.subtitle': 'Accedi al tuo account IdeaDiLuce.',
  'login.forgot': 'Password dimenticata?',
  'login.rememberMe': 'Ricordami su questo dispositivo',
  'login.passwordPlaceholder': '••••••••',
  'login.showPassword': 'Mostra password',
  'login.hidePassword': 'Nascondi password',
  'login.professionalPrompt': 'Sei un professionista?',
  'login.professionalCta': "Accedi all'area B2B",
  'register.title': 'Crea account',
  'register.subtitle': 'Crea il tuo account IdeaDiLuce.',
  'register.business': 'Account business (listino B2B)',
  'register.passwordHint': 'Password (min 8 caratteri)',
  'register.passwordPlaceholder': 'Min. 8 caratteri',
  'forgot.title': 'Recupero password',
  'forgot.subtitle': 'Ti invieremo un link per reimpostare la password.',
  'forgot.submit': 'Invia link',
  'forgot.error': 'Impossibile inviare il link. Riprova.',
  'forgot.sentMessage':
    'Se l’email è registrata, riceverai un link per reimpostare la password (email inviata dal portale). Controlla anche lo spam.',
  'reset.title': 'Nuova password',
  'reset.submit': 'Salva password',
  'reset.invalidLink': 'Link non valido.',
  'reset.expiredLink': 'Link scaduto o non valido. Richiedi un nuovo link.',
  'reset.passwordLabel': 'Nuova password (min 8 caratteri)',
  'reset.requestNewLink': 'Richiedi nuovo link',
  'reset.odooDelegated':
    'Il reset password avviene dal link che ricevi via email. Apri quel link, imposta la nuova password e poi accedi al sito con le nuove credenziali.',
  'cart.title': 'Carrello',
  'cart.pageTitle': 'Il tuo carrello',
  'cart.description': 'Controlla le righe, aggiorna le quantità e procedi al checkout.',
  'cart.clear': 'Svuota carrello',
  'cart.continueShopping': 'Continua lo shopping',
  'cart.itemCountOne': '{count} prodotto',
  'cart.itemCountMany': '{count} prodotti',
  'cart.variant': 'Variante:',
  'cart.perUnit': 'cad.',
  'cart.line.availableFast': 'Disponibile · spedito in 24/48h',
  'cart.line.availableLead': 'Disponibile · spedito in {days} giorni lavorativi',
  'cart.line.lowStock': 'Ultime unità · {qty} disponibili',
  'cart.line.orderable': 'Ordinabile — tempi di consegna da confermare',
  'cart.line.unavailable': 'Non disponibile',
  'cart.recommendationsTitle': 'Spesso acquistati insieme',
  'cart.recommendationsDescription': 'Compatibili con i prodotti nel carrello.',
  'cart.recommendationsLoading': 'Caricamento suggerimenti…',
  'cart.recommendationsEmpty': 'Nessun add-on consigliato per questi prodotti.',
  'cart.summary.title': 'Riepilogo',
  'cart.summary.subtotal': 'Subtotale',
  'cart.summary.tax': 'IVA',
  'cart.summary.shipping': 'Spedizione',
  'cart.summary.shippingFree': 'Gratis',
  'cart.summary.total': 'Totale',
  'cart.summary.taxIncluded': 'IVA {rate}% inclusa · {amount}',
  'cart.summary.securePayment': 'Pagamento sicuro · reso entro 50 giorni',
  'cart.summary.estimatesDisclaimer': 'Tasse e spedizione ricalcolate al checkout.',
  'cart.checkoutCta': 'Vai al checkout',
  'cart.remove': 'Rimuovi',
  'cart.empty.title': 'Il carrello è vuoto',
  'cart.empty.description': 'Aggiungi prodotti dal negozio o torna alla home.',
  'cart.empty.browseCatalog': 'Sfoglia il negozio',
  'cart.empty.backHome': 'Torna alla home',
  'cart.empty.popularCategories': 'Categorie popolari',
  'cart.empty.featured': 'Prodotti in evidenza',
  'cart.toast.added': 'Aggiunto al carrello',
  'cart.toast.quantity': 'Quantità:',
  'cart.toast.close': 'Chiudi notifica',
  'cart.toast.openCart': 'Apri carrello',
  'cart.stock.outOfStock': 'Non più disponibile',
  'cart.stock.insufficient': 'Quantità non disponibile',
  'cart.reservationExpired.title': 'Carrello scaduto',
  'cart.reservationExpired.description': 'La riserva è scaduta. Aggiorniamo disponibilità e prezzi.',
  'cart.reservationExpired.dismiss': 'Ho capito',
  'cart.freeShipping.progress': 'Progresso verso spedizione gratuita',
  'cart.freeShipping.remaining': 'Aggiungi {amount} per la spedizione gratuita',
  'cart.freeShipping.unlocked': 'Spedizione gratuita',
  'cart.freeShipping.unlockedDetail': 'hai raggiunto la soglia di {amount}. La consegna è inclusa.',
  'cart.compatibility.title': 'Non sei sicuro della compatibilità?',
  'cart.compatibility.description':
    'Inviaci una foto o il codice del vecchio prodotto: verifichiamo che alimentatore, attacco e potenza siano corretti prima dell\'ordine.',
  'cart.compatibility.cta': 'Chiedi un controllo',
  'cart.pricelist.b2b': 'Listino B2B',
  'cart.pricelist.b2c': 'Listino B2C',
  'cart.quoteCta': 'Richiedi preventivo',
  'cart.priceUpdated': 'Prezzo aggiornato',
  'cart.professional.badge': 'Condizioni professional attive',
  'cart.professional.banner': 'Stai visualizzando prezzi e condizioni riservate ai professionisti.',
  'cart.unpurchasable.badge': 'Non più disponibile',
  'cart.unpurchasable.limitedBadge': 'Disponibilità limitata',
  'cart.unpurchasable.blockedCheckout': 'Rimuovi o sposta in preferiti i prodotti non disponibili per procedere.',
  'cart.unpurchasable.moveToWishlist': 'Sposta in preferiti',
  'cart.unpurchasable.noPurchasableLines': 'Nessun articolo acquistabile nel carrello.',
  'cart.delivery.banner': 'Consegna unica entro {days} giorni lavorativi.',
  'cart.quote.title': 'Richiedi preventivo',
  'cart.quote.description': 'Invia una richiesta di preventivo per i prodotti nel carrello.',
  'cart.quote.stubMessage': 'Il flusso preventivo sarà disponibile a breve. Accedi al tuo account per continuare.',
  'cart.quote.backToCart': 'Torna al carrello',
  'cart.quote.loginCta': 'Accedi',
  'cart.quote.loginRequired': 'Accedi al tuo account per richiedere un preventivo.',
  'cart.quote.accountTitle': 'Account per il preventivo',
  'cart.quote.accountHint': 'Crea un account o accedi per inviare la richiesta. Il carrello resta collegato al tuo profilo.',
  'cart.quote.accountContinue': 'Continua con il preventivo',
  'cart.quote.reviewLines': 'Riepilogo prodotti',
  'cart.quote.emptyCart': 'Il carrello è vuoto.',
  'cart.quote.notesLabel': 'Note per il preventivo (opzionale)',
  'cart.quote.notesPlaceholder': 'Es. tempi di consegna, finiture, destinazione cantiere…',
  'cart.quote.submit': 'Invia richiesta preventivo',
  'cart.quote.success': 'Richiesta inviata. Ti contatteremo a breve.',
  'cart.quote.successPending': 'Puoi seguire lo stato del preventivo in area account. Quando sarà approvato potrai pagarlo online.',
  'cart.quote.frozenTitle': 'Preventivo congelato',
  'cart.quote.frozenDescription': 'Prezzi e righe bloccati — nessun ricalcolo automatico.',
  'cart.quote.frozenNotice': 'I prezzi mostrati sono quelli del preventivo al momento della richiesta.',
  'cart.quote.proceedCheckout': 'Procedi al checkout',
  'cart.quote.checkoutStarted': 'Checkout avviato con prezzi congelati.',
  'cart.quote.checkoutFailed': 'Impossibile avviare il checkout.',
  'cart.quote.steps.navLabel': 'Passaggi richiesta preventivo',
  'cart.quote.steps.group.account': 'Account',
  'cart.quote.steps.group.details': 'Dettagli',
  'cart.quote.steps.pageTitle.account': 'Accedi per richiedere il preventivo',
  'cart.quote.steps.pageTitle.accountConfirm': 'Conferma il tuo account',
  'cart.quote.steps.pageTitle.details': 'Completa la richiesta',
  'cart.quote.steps.pageSubtitle.account': 'Crea un account o accedi: il carrello resta collegato al tuo profilo.',
  'cart.quote.steps.pageSubtitle.details': 'Indica i dati di fatturazione e, se vuoi, aggiungi note per il team commerciale.',
  'cart.quote.estimateNotice': 'I totali nel riepilogo sono stime indicative. Riceverai un preventivo personalizzato via email.',
  'wishlist.title': 'Preferiti',
  'wishlist.descriptionGuest': 'Salva i prodotti che ti interessano. Accedi per sincronizzarli su tutti i dispositivi.',
  'wishlist.descriptionAccount': 'I tuoi prodotti preferiti, pronti per l’acquisto.',
  'wishlist.addAllToCart': 'Aggiungi tutti al carrello',
  'wishlist.emptyTitle': 'Lista vuota',
  'wishlist.emptyDescription': 'Aggiungi prodotti ai preferiti dal negozio.',
  'wishlist.unavailableTitle': 'Alcuni prodotti non sono più disponibili',
  'wishlist.unavailableDescription': 'Rimuovili dalla lista o controlla varianti alternative.',
  'wishlist.item.unavailable': 'Non più disponibile',
  'wishlist.item.notInCatalog': 'Prodotto non più nel negozio',
  'wishlist.item.addToCart': 'Aggiungi al carrello',
  'wishlist.heart.add': 'Aggiungi ai preferiti',
  'wishlist.heart.remove': 'Rimuovi dai preferiti',
  'checkout.processing': 'Elaborazione…',
  'checkout.confirmOrder': 'Conferma ordine',
  'checkout.payAmount': 'Paga {amount}',
  'checkout.contactInfo': 'Informazioni di contatto',
  'checkout.shippingAddress': 'Indirizzo di spedizione',
  'checkout.billingAddress': 'Indirizzo di fatturazione',
  'checkout.billingSameAsShipping': 'Uguale all’indirizzo di spedizione',
  'checkout.continue': 'Continua',
  'checkout.continueToShipping': 'Continua alla spedizione',
  'checkout.continueToPayment': 'Continua al pagamento',
  'checkout.selectShipping': 'Seleziona un metodo di spedizione',
  'checkout.payment': 'Metodo di pagamento',
  'checkout.paymentNote': 'Tutti i pagamenti sono protetti e cifrati.',
  'walletQuickPay.checkoutFallback': 'Apple Pay · Google Pay al checkout',
  'walletQuickPay.openCheckout': 'Vai al checkout',
  'checkout.steps.title': 'Completa il tuo ordine',
  'checkout.steps.pageTitle.account': 'Accedi o registrati',
  'checkout.steps.pageTitle.accountConfirm': 'Il tuo account',
  'checkout.steps.details': 'Dettagli',
  'checkout.steps.account': 'Account',
  'checkout.steps.customerType': 'Tipo cliente',
  'checkout.steps.addresses': 'Indirizzi',
  'checkout.steps.deliveryRecipient': 'Destinatario',
  'checkout.steps.review': 'Riepilogo',
  'checkout.steps.group.account': 'Account',
  'checkout.steps.group.anagrafica': 'Anagrafica',
  'checkout.steps.group.indirizzi': 'Indirizzi',
  'checkout.steps.group.shipping': 'Spedizione',
  'checkout.steps.group.payment': 'Pagamento',
  'checkout.steps.payment': 'Pagamento',
  'checkout.steps.shipping': 'Spedizione',
  'checkout.stepProgress': 'Passo {current} di {total}',
  'checkout.summary.subtotal': 'Subtotale',
  'checkout.summary.tax': 'IVA',
  'checkout.summary.shipping': 'Spedizione',
  'checkout.summary.free': 'Gratis',
  'checkout.summary.total': 'Totale',
  'checkout.backToCart': 'Torna al carrello',
  'checkout.shipping.title': 'Metodo di spedizione',
  'checkout.shipping.noMethods': 'Nessun metodo disponibile per questo indirizzo.',
  'checkout.shipping.addressIncomplete': 'Completa l’indirizzo per vedere le opzioni di spedizione.',
  'checkout.shipping.deliveryEstimate':
    'Consegna unica stimata entro {days} giorni lavorativi (tempo più lungo tra i prodotti nel carrello).',
  'checkout.shipping.pickupRomeOnly':
    'Il ritiro in sede è disponibile solo per clienti con sede a Roma.',
  'checkout.shipping.addressSubtitle': 'Dove consegniamo il pacco.',
  'checkout.shipping.diffAddressSubtitle':
    'Diverso dalla fatturazione — dove consegniamo il pacco.',
  'checkout.shipping.methodSubtitle': 'Scegli come ricevere il tuo ordine.',
  'checkout.shipping.diffFromBilling':
    'Spedisci a un indirizzo diverso da quello di fatturazione',
  'checkout.summary.showOrderSummary': 'Mostra riepilogo ordine',
  'checkout.summary.hideOrderSummary': 'Nascondi riepilogo ordine',
  'checkout.summary.promoHint': 'Hai un codice sconto o un buono regalo?',
  'checkout.summary.crossSellTitle': 'Aggiungi al tuo ordine',
  'checkout.summary.crossSellCompat': 'Compatibili',
  'checkout.summary.crossSellAdd': 'Aggiungi al carrello',
  'checkout.summary.secureBadge': 'Pagamento sicuro',
  'checkout.summary.securePayment': 'Pagamento sicuro',
  'checkout.summary.returns': 'Reso 50 giorni',
  'checkout.loading.dontClose': 'Non chiudere questa pagina',
  'checkout.loading.address': 'Verifica indirizzi…',
  'checkout.loading.shipping': 'Calcolo spedizione…',
  'checkout.loading.payment': 'Preparazione pagamento…',
  'checkout.payStore': 'Paga {store}',
  'checkout.steps.navLabel': 'Passaggi checkout',
  'checkout.address.fullName': 'Nome e cognome',
  'checkout.address.phoneOptional': 'Telefono (opzionale)',
  'checkout.address.line1': 'Via',
  'checkout.address.streetNumber': 'Civico',
  'checkout.address.isSnc': 'SNC',
  'checkout.address.streetNumberHint': 'Inserisci il numero civico o seleziona SNC.',
  'checkout.address.courierNotes': 'Note per il corriere (opz.)',
  'checkout.orderNotes': 'Note ordine',
  'checkout.orderNotesPlaceholder': 'Istruzioni aggiuntive per il negozio (opzionale)',
  'checkout.address.line2': 'Appartamento, interno, ecc. (opz.)',
  'checkout.address.city': 'Città',
  'checkout.address.postalCode': 'CAP',
  'checkout.address.detailsTitle': 'Dettagli indirizzo',
  'checkout.address.lockEdits': 'Blocca modifiche',
  'checkout.address.unlockEdits': 'Modifica dettagli manualmente',
  'checkout.address.changeAddress': 'Cambia indirizzo',
  'checkout.address.label': 'Indirizzo',
  'checkout.address.country': 'Paese',
  'checkout.address.selectedTitle': 'Indirizzo selezionato',
  'checkout.address.searchPlaceholder': 'Cerca indirizzo…',
  'checkout.address.googleHint':
    'Cerca e seleziona l’indirizzo dalla lista: potrai verificare e modificare i dettagli subito dopo.',
  'checkout.address.resolvingPrefill': 'Verifica indirizzo in corso…',
  'checkout.account.guestHint': 'Puoi completare l’ordine come ospite.',
  'checkout.account.continueAsGuest': 'Continua come ospite',
  'checkout.account.requiredHint': 'Accedi o crea un account per continuare.',
  'checkout.account.registerTab': 'Nuovo account',
  'checkout.account.loginTab': 'Accedi',
  'checkout.account.orDivider': 'oppure registrati',
  'checkout.account.createAndContinue': 'Crea account e continua',
  'checkout.account.registerError': 'Registrazione non riuscita. Riprova o accedi se hai già un account.',
  'checkout.register.firstName': 'Nome',
  'checkout.register.lastName': 'Cognome',
  'checkout.customerType.hint': 'Seleziona se acquisti come privato o azienda.',
  'checkout.register.changeCustomerType': 'Modifica tipo cliente',
  'checkout.customerType.retail.title': 'Privato',
  'checkout.customerType.business.title': 'Azienda',
  'checkout.deliveryRecipient.hint': 'Indica se la spedizione va al tuo indirizzo o a un destinatario diverso.',
  'checkout.deliveryRecipient.self.title': 'Spedisci a me',
  'checkout.deliveryRecipient.self.description': 'La merce arriva all’indirizzo di spedizione indicato.',
  'checkout.deliveryRecipient.other.title': 'Spedisci ad altro destinatario',
  'checkout.deliveryRecipient.other.description': 'Dropship verso cliente o cantiere (B2B).',
  'checkout.deliveryRecipient.company': 'Azienda / ragione sociale (opz.)',
  'checkout.deliveryRecipient.addressTitle': 'Indirizzo destinatario',
  'checkout.deliveryRecipient.notSavedHint': 'L’indirizzo non viene salvato in rubrica: vale solo per questo ordine.',
  'checkout.billing.professionalActive': 'Condizioni professional attive',
  'checkout.billing.subtitle': 'Inserisci i dati per fatturazione e consegna.',
  'checkout.addresses.subtitle': 'Indirizzo di spedizione e, se diverso, di fatturazione.',
  'checkout.billing.businessTitle': 'Dati fatturazione azienda',
  'checkout.billing.companyName': 'Ragione sociale',
  'checkout.billing.vatNumber': 'Partita IVA / VAT',
  'checkout.billing.fiscalCode': 'Codice fiscale',
  'checkout.billing.fiscalCodeOptional': 'Codice fiscale (opzionale)',
  'checkout.billing.pec': 'PEC',
  'checkout.billing.sdiCode': 'Codice destinatario SDI',
  'checkout.billing.pecOrSdiHint': 'Per fatturazione elettronica in Italia serve almeno PEC o codice SDI.',
  'checkout.billing.clientOrderRefOptional': 'Riferimento ordine cliente (opzionale)',
  'checkout.billing.fiscalCodeValid': 'Codice fiscale valido',
  'checkout.billing.fiscalCodeInvalid': 'Codice fiscale non valido',
  'checkout.billing.vatFormatValid': 'Partita IVA formalmente valida',
  'checkout.billing.vatFormatInvalid': 'Partita IVA non valida',
  'checkout.billing.verify': 'Verifica',
  'checkout.billing.verifying': 'Verifica…',
  'checkout.billing.verifyVatVies': 'Verifica partita IVA (VIES)',
  'checkout.billing.vatViesValid': 'Partita IVA verificata su VIES',
  'checkout.billing.vatViesInvalid': 'Partita IVA non presente su VIES',
  'checkout.billing.viesUnavailable':
    'Servizio VIES temporaneamente non disponibile: potrai continuare ma il dato sarà ricontrollato.',
  'checkout.billing.vatForceAccepted':
    'P.IVA non validata: proseguimento consentito dopo 3 tentativi.',
  'checkout.billing.vatAttempt': 'Tentativo {current}/{max} — verifica il numero inserito.',
  'checkout.review.clientOrderRef': 'Riferimento ordine',
  'checkout.review.hint': 'Verifica i dati prima di confermare e pagare.',
  'checkout.review.acceptTerms': 'Accetto i termini e condizioni di vendita',
  'checkout.review.summaryTitle': 'Riepilogo ordine',
  'checkout.review.detailsToggle': 'Dettagli ordine e indirizzi',
  'checkout.review.secureFooter': 'Powered by Stripe · transazione cifrata SSL',
  'checkout.payment.bankTransfer': 'Bonifico bancario',
  'checkout.payment.card': 'Carta / wallet',
  'checkout.account.loginPrompt': 'Hai già un account? Accedi',
  'checkout.account.loginError': 'Email o password non corretti.',
  'checkout.account.notYou': 'Non sei tu?',
  'checkout.account.logoutConfirmDescription':
    'Dovrai accedere di nuovo per ordini e profilo. I prezzi del carrello verranno ricalcolati senza il tuo listino personalizzato.',
  'bankTransfer.title': 'Coordinate per il bonifico',
  'bankTransfer.description':
    'Usa la causale indicata così possiamo associare il pagamento al tuo ordine.',
  'bankTransfer.copy': 'Copia',
  'bankTransfer.copied': 'Copiato',
  'bankTransfer.copyAll': 'Copia tutto',
  'bankTransfer.holder': 'Intestatario',
  'bankTransfer.iban': 'IBAN',
  'bankTransfer.bank': 'Banca',
  'bankTransfer.amount': 'Importo',
  'bankTransfer.reference': 'Causale',
  'bankTransfer.awaitingNote':
    'Dopo la conferma vedrai le coordinate bancarie e le istruzioni per completare il pagamento.',
  'paymentResult.loading': 'Verifica pagamento…',
  'paymentResult.notFound': 'Ordine non trovato',
  'paymentResult.fetchError': 'Errore recupero ordine',
  'paymentResult.syncNote': 'Sincronizzazione con Odoo quando configurato.',
  'paymentResult.orderPwa': 'Ordine PWA',
  'paymentResult.orderOdoo': 'Ordine Odoo',
  'paymentResult.paymentStatus': 'Stato pagamento',
  'paymentResult.total': 'Totale',
  'paymentResult.myOrders': 'I miei ordini',
  'paymentResult.catalog': 'Negozio',
  'paymentResult.status.paid': 'Pagamento completato',
  'paymentResult.status.pending': 'Pagamento in attesa',
  'paymentResult.status.failed': 'Pagamento non riuscito',
  'thankYou.hero.confirmedEyebrow': 'ORDINE CONFERMATO',
  'thankYou.hero.pendingEyebrow': 'ORDINE RICEVUTO',
  'thankYou.hero.failedEyebrow': 'PAGAMENTO NON RIUSCITO',
  'thankYou.hero.confirmedTitle': 'Grazie, {name}! Il tuo ordine è confermato.',
  'thankYou.hero.confirmedTitleGeneric': 'Grazie! Il tuo ordine è confermato.',
  'thankYou.hero.pendingTitle': 'Ordine registrato, in attesa di pagamento',
  'thankYou.hero.failedTitle': 'Non siamo riusciti a completare il pagamento',
  'thankYou.hero.emailPrefix': 'Abbiamo inviato la conferma a',
  'thankYou.hero.confirmedBody': '. Lo prepariamo subito e ti avvisiamo appena parte.',
  'thankYou.hero.pendingBody': '. Completa il pagamento per avviare la preparazione.',
  'thankYou.hero.failedBody': 'Riprova il checkout o scegli un altro metodo di pagamento.',
  'thankYou.hero.retryCheckout': 'Torna al checkout',
  'thankYou.hero.retryPayment': 'Riprova pagamento',
  'thankYou.orderNumber': 'Numero ordine',
  'thankYou.estimatedDelivery': 'Consegna stimata',
  'thankYou.deliverySoon': 'Entro pochi giorni lavorativi',
  'thankYou.tracker.title': "Stato dell'ordine",
  'thankYou.tracker.confirmed': 'Confermato',
  'thankYou.tracker.preparing': 'In preparazione',
  'thankYou.tracker.shipped': 'Spedito',
  'thankYou.tracker.delivered': 'Consegnato',
  'thankYou.tracker.now': 'Adesso',
  'thankYou.tracker.today': 'Entro oggi',
  'thankYou.tracker.afterPayment': 'Dopo il pagamento',
  'thankYou.tracker.trackingNote': "Riceverai un link di tracciamento via email appena l'ordine parte.",
  'thankYou.tracker.pickupNote':
    'Verrai contattato per organizzare il ritiro/consegna una volta elaborato l’ordine.',
  'thankYou.tracker.trackCta': 'Traccia ordine',
  'thankYou.lines.title': 'Riepilogo prodotti',
  'thankYou.lines.quantity': 'Quantità {count}',
  'thankYou.support.title': 'Hai un dubbio sul montaggio?',
  'thankYou.support.body':
    'Il nostro showroom di Roma ti aiuta a verificare collegamenti, compatibilità e installazione. Scrivici quando vuoi, anche dopo la consegna.',
  'thankYou.support.cta': 'Contatta un esperto',
  'thankYou.summary.title': 'Dettagli ordine',
  'thankYou.summary.subtotal': 'Subtotale',
  'thankYou.summary.shipping': 'Spedizione',
  'thankYou.summary.total': 'Totale',
  'thankYou.summary.vat': 'IVA 22% esclusa',
  'thankYou.summary.shipTo': 'Spedizione a',
  'thankYou.summary.payment': 'Pagamento',
  'thankYou.shippingFree': 'Gratis',
  'thankYou.account.title': 'Crea un account',
  'thankYou.account.body': "Salva l'ordine, segui le spedizioni e riordina i ricambi in un clic.",
  'thankYou.account.cta': 'Crea account con questa email',
  'thankYou.crossSell.eyebrow': "COMPLETA L'INSTALLAZIONE",
  'thankYou.crossSell.title': 'Accessori compatibili con il tuo ordine',
  'thankYou.crossSell.catalog': 'Vai al negozio',
  'purchaseError.securePayment': 'Pagamento sicuro · SSL',
  'purchaseError.supportPhone': 'Assistenza · (+39) 06 716 7111',
  'purchaseError.hero.title': 'Non siamo riusciti a completare il pagamento.',
  'purchaseError.hero.bodyPrefix': 'Nessun importo è stato addebitato e',
  'purchaseError.hero.bodyStrong': 'il tuo carrello è al sicuro',
  'purchaseError.hero.bodySuffix':
    '. Puoi riprovare ora o usare un altro metodo di pagamento — bastano pochi secondi.',
  'purchaseError.hero.retryPayment': 'Riprova il pagamento',
  'purchaseError.hero.changeMethod': 'Cambia metodo',
  'purchaseError.attemptRef': 'Riferimento tentativo ·',
  'purchaseError.causes.title': 'Perché può essere successo',
  'purchaseError.causes.intro': 'Quasi sempre si risolve in un attimo. Le cause più comuni:',
  'purchaseError.causes.card.title': 'Dati della carta da verificare',
  'purchaseError.causes.card.body':
    'Controlla numero, scadenza e CVC. Un errore di battitura è la causa più frequente.',
  'purchaseError.causes.secure3ds.title': 'Autorizzazione 3D Secure non completata',
  'purchaseError.causes.secure3ds.body':
    'La banca potrebbe aver richiesto una conferma via app o SMS non andata a buon fine.',
  'purchaseError.causes.limit.title': 'Limite o plafond insufficiente',
  'purchaseError.causes.limit.body':
    'Verifica il massimale della carta o prova con un altro metodo qui sotto.',
  'purchaseError.methods.title': 'Prova un altro metodo',
  'purchaseError.methods.card': 'Altra carta',
  'purchaseError.methods.paypal': 'PayPal',
  'purchaseError.methods.bankTransfer': 'Bonifico',
  'purchaseError.support.title': 'Continua a non funzionare?',
  'purchaseError.support.body':
    "Ti aiutiamo noi a completare l'ordine al telefono o via email — o lo finalizziamo per te. Nessun problema con la disponibilità: la teniamo da parte.",
  'purchaseError.support.cta': 'Contatta il supporto',
  'purchaseError.cart.title': 'Il tuo carrello è salvo',
  'purchaseError.cart.noCharge': 'Nessun importo addebitato',
  'purchaseError.cart.reserved': 'Prodotti tenuti da parte per te',
  'purchaseError.cart.ssl': 'Connessione cifrata SSL',
  'purchaseError.cart.backToShop': 'Torna al negozio',
  'purchaseError.taxIncluded': 'IVA 22% inclusa',
  'purchaseError.footer.company':
    'TLB Italy Srl · P.IVA IT17245551001 · Via Appia Pignatelli 450, Roma',
  'purchaseError.footer.help': 'Hai bisogno di aiuto?',
  'account.pricelist': 'Listino',
  'account.greeting.named': 'Ciao, {name}',
  'account.greeting.default': 'Ciao, bentornato',
  'account.overview.myOrders': 'I miei ordini',
  'account.overview.editProfile': 'Modifica profilo',
  'account.overview.recentOrders': 'Ordini recenti',
  'account.overview.allOrders': 'Tutti ({count})',
  'account.overview.noOrders': 'Nessun ordine ancora.',
  'account.overview.browseCatalog': 'Sfoglia il negozio',
  'account.overview.segmentB2b': '(B2B)',
  'account.overview.segmentB2c': '(B2C)',
  'account.overview.segmentProfessional': '(Professional)',
  'account.overview.accountType': 'Tipo account',
  'account.overview.recentQuotes': 'Preventivi recenti',
  'account.overview.recentInvoices': 'Fatture recenti',
  'account.overview.viewAllQuotes': 'Tutti i preventivi',
  'account.overview.viewAllInvoices': 'Tutte le fatture',
  'account.overview.noQuotes': 'Nessun preventivo ancora.',
  'account.overview.noInvoices': 'Nessuna fattura disponibile.',
  'account.overview.payableQuotesHint': '{count} preventivi pronti per il pagamento online.',
  'account.overview.professionalActive': 'Condizioni professional attive',
  'account.nav.overview': 'Panoramica',
  'account.nav.dashboard': 'Dashboard',
  'account.nav.profile': 'Profilo',
  'account.nav.orders': 'I miei ordini',
  'account.nav.parts': 'I miei ricambi',
  'account.nav.addresses': 'Indirizzi',
  'account.nav.payments': 'Pagamenti',
  'account.nav.data': 'Dati e password',
  'account.nav.support': 'Assistenza',
  'account.nav.wishlist': 'Preferiti',
  'account.nav.quotes': 'Preventivi',
  'account.nav.invoices': 'Fatture',
  'account.dashboard.totalOrders': 'Ordini totali',
  'account.dashboard.inProgress': 'In corso',
  'account.dashboard.savedParts': 'Ricambi salvati',
  'account.dashboard.ongoingOrder': 'Ordine in corso',
  'account.dashboard.details': 'Dettagli →',
  'account.dashboard.delivery': 'Consegna',
  'account.dashboard.deliverySoon': 'Entro pochi giorni',
  'account.dashboard.reorderParts': 'Riordina i tuoi ricambi',
  'account.dashboard.reorderPartsBody':
    'Hai già acquistato lampadine e alimentatori. Riordinali in un clic dalla tua lista ricambi.',
  'account.dashboard.goToParts': 'Vai ai ricambi',
  'account.dashboard.openQuotes': 'Preventivi',
  'account.dashboard.invoices': 'Fatture',
  'account.parts.title': 'I miei ricambi',
  'account.parts.description':
    'I prodotti tecnici che usi più spesso, pronti da riordinare.',
  'account.parts.savedCount': '{count} prodotti salvati',
  'account.addresses.current': 'Indirizzo attuale',
  'account.payments.title': 'Metodi di pagamento',
  'account.payments.current': 'Metodo preferito',
  'account.quotes.title': 'I tuoi preventivi',
  'account.quotes.description': 'Richieste inviate dal carrello e preventivi Odoo collegati al tuo account.',
  'account.quotes.empty': 'Nessun preventivo disponibile.',
  'account.quotes.view': 'Apri',
  'account.quotes.status.requested': 'Richiesto',
  'account.quotes.status.sent': 'Inviato',
  'account.quotes.status.checkout_started': 'Checkout avviato',
  'account.quotes.status.converted': 'Convertito',
  'account.quotes.status.draft': 'Bozza',
  'account.quotes.status.cancelled': 'Annullato',
  'account.quotes.badge.expired': 'Scaduto',
  'account.quotes.badge.payable': 'Pagabile online',
  'account.quotes.badge.pending': 'In attesa di approvazione',
  'account.quotes.badge.preparing': 'In preparazione',
  'account.quotes.message.expired': 'Questo preventivo è scaduto. Contattaci per un nuovo preventivo.',
  'account.quotes.message.notPayable': 'Questo preventivo non è ancora approvato per il pagamento online.',
  'account.quotes.message.not_sent': 'Stiamo preparando il preventivo. Ti avviseremo quando potrai pagarlo online.',
  'account.quotes.message.cancelled': 'Questo preventivo è stato annullato.',
  'account.quotes.message.converted': 'Questo preventivo è già stato convertito in ordine.',
  'account.quotes.message.draft': 'Il preventivo è ancora in preparazione.',
  'account.quotes.validUntil': 'Valido fino al',
  'account.quotes.linesTitle': 'Prodotti',
  'account.quotes.expiredContact': 'Richiedi aggiornamento preventivo',
  'account.quotes.viewOrder': 'Vedi ordine collegato',
  'account.quotes.checkout': 'Checkout',
  'account.invoices.title': 'Le tue fatture',
  'account.invoices.description': 'Fatture emesse dal gestionale collegate al tuo account.',
  'account.invoices.empty': 'Nessuna fattura disponibile.',
  'account.invoices.loadError': 'Impossibile caricare le fatture.',
  'account.invoices.download': 'Scarica PDF',
  'account.invoices.pdfPending': 'PDF in elaborazione',
  'account.invoices.pdfDownloadError': 'Impossibile scaricare il PDF.',
  'account.invoices.portalLink': 'Apri su portale',
  'checkout.frozenQuote.title': 'Checkout preventivo',
  'checkout.frozenQuote.loading': 'Caricamento prezzi congelati…',
  'account.profile.businessTitle': 'Dati aziendali',
  'account.profile.businessData': 'Dati aziendali',
  'account.profile.businessHint': 'Per fatturazione elettronica e condizioni B2B.',
  'account.overview.professionalCta': 'Sei un professionista? Attiva condizioni dedicate e listini riservati.',
  'account.overview.professionalCtaLink': 'Richiedi account professional',
  'account.overview.professionalPending': 'Richiesta account professional in valutazione. Ti contatteremo entro 24 ore lavorative.',
  'account.overview.professionalRejected': 'La tua richiesta account professional non è stata approvata. Puoi inviarne una nuova dalla pagina professionisti.',
  'account.shell.backToCatalog': 'Torna al negozio',
  'account.shell.backToShop': 'Torna al negozio',
  'account.shell.cart': 'Carrello',
  'account.shell.continueShopping': 'Continua lo shopping',
  'account.shell.logout': 'Esci dall’account',
  'account.shell.logoutShort': 'Esci',
  'account.shell.logoutConfirmTitle': 'Uscire dall’account?',
  'account.shell.logoutConfirmDescription': 'Dovrai accedere di nuovo per vedere ordini e profilo.',
  'account.profile.validationError': 'Completa tutti i campi obbligatori.',
  'account.profile.personalData': 'Dati personali',
  'account.profile.emailReadonly': 'L’email non può essere modificata da qui.',
  'account.profile.preferredPayment': 'Metodo di pagamento preferito',
  'account.profile.preferredPaymentHint': 'Useremo questa preferenza al checkout quando possibile.',
  'account.profile.shippingAddress': 'Indirizzo di spedizione',
  'account.profile.save': 'Salva modifiche',
  'account.profile.odooSyncWarning':
    'Modifiche salvate nel tuo account, ma la sincronizzazione con Odoo non è riuscita. Riprova più tardi o contattaci se il problema persiste.',
  'account.profile.saving': 'Salvataggio…',
  'account.section.orders.title': 'I tuoi ordini',
  'account.section.orders.description': 'Cronologia acquisti e stato dei pagamenti.',
  'account.section.profile.title': 'Profilo',
  'account.section.profile.description': 'Aggiorna dati personali, indirizzo e pagamento preferito.',
  'account.section.overview.description': 'Gestisci ordini, profilo e preferiti dal tuo account.',
  'account.meta.customer': 'Cliente',
  'account.meta.email': 'Email',
  'account.meta.phone': 'Telefono',
  'account.meta.shippingAddress': 'Indirizzo di spedizione',
  'account.meta.preferredPayment': 'Pagamento preferito',
  'account.meta.orders': 'Ordini',
  'account.orders.emptyTitle': 'Nessun ordine',
  'account.orders.emptyDescription': 'I tuoi acquisti compariranno qui.',
  'account.orders.track': 'Traccia →',
  'account.orders.reorder': 'Riordina',
  'account.orders.itemCount': '{count} articoli',
  'account.orders.table.order': 'Ordine',
  'account.orders.table.date': 'Data',
  'account.orders.table.total': 'Totale',
  'account.orders.table.status': 'Stato',
  'account.orders.table.detail': 'Dettaglio',
  'account.orders.table.reorder': 'Riordina',
  'account.orders.table.reordering': 'Riordino…',
  'orders.detail.loading': 'Caricamento ordine…',
  'orders.detail.back': 'Torna agli ordini',
  'orders.detail.reorder': 'Riordina',
  'orders.detail.items': 'Articoli',
  'orders.detail.quantity': 'Qtà {count}',
  'orders.detail.orderStatus': 'Stato ordine',
  'orders.detail.paymentStatus': 'Pagamento',
  'orders.detail.total': 'Totale',
  'orders.detail.date': 'Data',
  'orders.detail.pwaRef': 'Rif. PWA',
  'orders.detail.completeOrder': 'Completa il tuo ordine',
  'orders.detail.invoicePortal': 'Fattura e dettagli disponibili nel portale Odoo.',
  'orders.reorder.success': 'Prodotti aggiunti al carrello',
  'orders.reorder.error': 'Impossibile riordinare',
  'impersonate.invalidLink': 'Link di impersonazione non valido.',
  'impersonate.expiredLink': 'Link scaduto o non valido. Richiedine uno nuovo dal backoffice.',
  'impersonate.loading': 'Accesso in corso come cliente…',
  'breadcrumb.home': 'Home',
  'category.products': 'prodotti',
  'legal.terms': 'Termini',
  'legal.privacy': 'Privacy',
  'paymentMethod.stripe': 'Carta di credito / debito',
  'paymentMethod.stripeDescription': 'Visa, Mastercard, Amex, Apple Pay e Google Pay',
  'paymentMethod.bankTransfer': 'Bonifico bancario',
  'paymentMethod.bankTransferDescription': 'Confermi l’ordine e ricevi subito IBAN e causale',
  'orderStatus.cart_created': 'Carrello creato',
  'orderStatus.checkout_started': 'Checkout avviato',
  'orderStatus.payment_started': 'Pagamento avviato',
  'orderStatus.payment_pending': 'Pagamento in attesa',
  'orderStatus.paid': 'Pagato',
  'orderStatus.paid_sync_pending': 'Pagato, sincronizzazione in corso',
  'orderStatus.synced': 'Confermato',
  'orderStatus.payment_failed': 'Pagamento non riuscito',
  'orderStatus.abandoned': 'Abbandonato',
  'orderStatus.cancelled': 'Annullato',
  'orderStatus.confirmed': 'Confermato',
  'orderStatus.completed': 'Completato',
  'paymentStatus.not_started': 'Non avviato',
  'paymentStatus.created': 'Creato',
  'paymentStatus.pending': 'In attesa',
  'paymentStatus.captured': 'Pagato',
  'paymentStatus.failed': 'Non riuscito',
  'paymentStatus.cancelled': 'Annullato',
  'paymentStatus.refunded': 'Rimborsato',
  'impersonation.banner.viewing': 'Stai visualizzando la PWA come',
  'impersonation.banner.startedBy': '(impersonazione avviata da {admin})',
  'impersonation.banner.end': 'Esci da impersonazione',
  'cart.floating.close': 'Chiudi carrello',
  'cart.floating.loading': 'Caricamento mini carrello…',
  'cart.floating.items': 'Articoli',
  'cart.floating.estimatedTotal': 'Totale stimato',
  'cart.floating.moreLines': '+{count} righe nel carrello',
  'cart.floating.openCart': 'Apri carrello',
  'cart.floating.openMiniCart': 'Apri mini carrello',
  'checkout.payment.loadingModule': 'Caricamento modulo di pagamento',
  'checkout.payment.orPayWithCard': 'Oppure paga con carta',
  'checkout.payment.orderSr': 'Ordine {orderId}',
  'checkout.payment.prepareError': 'Impossibile preparare il pagamento.',
  'checkout.payment.failed': 'Pagamento non riuscito',
  'checkout.payment.cardholderName': 'Nome e cognome sulla carta',
  'checkout.payment.cardholderNamePlaceholder': 'Come riportato sulla carta',
  'checkout.payment.cardholderNameRequired': 'Inserisci il nome e cognome del titolare della carta.',
  'checkout.payment.formNotReady': 'Il modulo di pagamento non è ancora pronto. Attendi qualche secondo e riprova.',
  'checkout.payment.cardIncomplete': 'Completa i dati della carta prima di pagare.',
  'checkout.poweredByStripe': 'Powered by Stripe',
  'checkout.emailPlaceholder': 'email@esempio.com',
  'checkout.error.incompleteAddress':
    'Compila email e indirizzo di spedizione (e fatturazione se diverso).',
  'checkout.error.incompleteStep': 'Completa i campi richiesti per continuare.',
  'checkout.error.authRequired': 'Accedi o crea un account per completare l’ordine.',
  'checkout.error.generic': 'Errore checkout',
  'checkout.error.missingOrder': 'Ordine checkout mancante',
  'checkout.error.missingPayment': 'Pagamento mancante',
  'checkout.error.orderUnavailable': 'Ordine non disponibile dopo la conferma',
  'checkout.error.alreadyPaid': 'Questo ordine risulta già pagato.',
  'checkout.shipping.eta': 'Consegna stimata ~{days} giorni lavorativi',
  'checkout.address.typeToSearch': "Inizia a digitare l'indirizzo…",
  'breadcrumb.nav': 'Percorso di navigazione',
  'language.switcher.current': 'Lingua: {locale}. Cambia lingua',
  'language.switcher.other': 'Altre lingue',
  'theme.switcher.title': 'Tema classico, nero o scuro',
  'theme.switcher.toLight': 'Passa al tema nero',
  'theme.switcher.toDark': 'Passa al tema scuro',
  'theme.switcher.toClassic': 'Passa al tema classico (marrone)',
  'skeleton.loadingProducts': 'Caricamento prodotti…',
  'skeleton.loadingCart': 'Caricamento carrello…',
  'skeleton.loadingCartSummary': 'Caricamento riepilogo carrello…',
  'skeleton.loadingProduct': 'Caricamento prodotto…',
  'skeleton.loadingCheckout': 'Caricamento checkout…',
  'skeleton.loadingPageHeader': 'Caricamento intestazione pagina',
  'skeleton.loadingForm': 'Caricamento modulo',
  'skeleton.loadingPaymentResult': 'Caricamento esito pagamento',
  'skeleton.loadingCatalogFilters': 'Caricamento filtri negozio',
  'skeleton.loadingAccount': 'Caricamento area account',
  'skeleton.loadingList': 'Caricamento elenco…',
}

const EN: Record<MessageKey, string> = {
  ...IT,
  'brand.name': 'Idea di Luce',
  'common.loading': 'Loading…',
  'common.loadingCatalog': 'Loading shop…',
  'common.confirm': 'Confirm',
  'common.cancel': 'Cancel',
  'common.pleaseWait': 'Please wait…',
  'common.notAvailable': '—',
  'common.email': 'Email',
  'common.password': 'Password',
  'common.firstName': 'First name',
  'common.lastName': 'Last name',
  'common.phone': 'Phone',
  'common.quantity': 'Quantity',
  'common.remove': 'Remove',
  'common.all': 'All',
  'common.back': 'Back',
  'common.save': 'Save',
  'common.saving': 'Saving…',
  'common.close': 'Close',
  'common.menu': 'Menu',
  'nav.catalog': 'Shop',
  'nav.cart': 'Cart',
  'nav.account': 'Account',
  'nav.login': 'Sign in',
  'nav.register': 'Register',
  'nav.wishlist': 'Wishlist',
  'nav.checkout': 'Checkout',
  'nav.logout': 'Sign out',
  'footer.tagline': 'Idea di Luce · lighting for home and professionals',
  'error.genericTitle': 'Something went wrong',
  'notFound.metaTitle': 'Page not found',
  'notFound.eyebrow': 'ERROR 404',
  'notFound.title': 'The light went out here.',
  'notFound.description':
    'The page you are looking for has been moved, removed, or never existed. But you are not in the dark: let us start again from here.',
  'notFound.backHome': 'Back to home',
  'notFound.exploreCatalog': 'Explore the shop',
  'notFound.searchPlaceholder': 'Search by product, socket, code, or brand',
  'notFound.searchCta': 'Search',
  'notFound.assistenza': 'Support',
  'notFound.linkDesign': 'Design lighting',
  'notFound.linkTechnical': 'Technical products',
  'notFound.linkAttacco': 'Browse by socket',
  'notFound.linkGuide': 'Guides',
  'notFound.linkProductNotFound': 'Product not found?',
  'notFound.footer': 'TLB Italy Srl · Via Appia Pignatelli 450, Rome · info@ideadiluce.com',
  'productNotFound.formTitle': 'Tell us what you are looking for',
  'productNotFound.formDescription':
    'The more details you share, the faster we can find the right product.',
  'productNotFound.photoProduct': 'Product or socket photo',
  'productNotFound.photoProductHint': 'Drop the product photo here',
  'productNotFound.photoSocket': 'Socket photo',
  'productNotFound.photoSocketHint': 'Close-up of the socket',
  'productNotFound.nameLabel': 'Full name',
  'productNotFound.namePlaceholder': 'John Smith',
  'productNotFound.emailPlaceholder': 'john@email.com',
  'productNotFound.phoneLabel': 'Phone / WhatsApp',
  'productNotFound.phonePlaceholder': '+39 ___ ___ ____',
  'productNotFound.codeLabel': 'Code / EAN / MPN',
  'productNotFound.codePlaceholder': 'e.g. 8711500411990',
  'productNotFound.brandLabel': 'Brand (if known)',
  'productNotFound.brandPlaceholder': 'Philips, Osram…',
  'productNotFound.usage': 'Usage',
  'productNotFound.usageHome': 'Home',
  'productNotFound.usageShop': 'Shop',
  'productNotFound.usageOffice': 'Office',
  'productNotFound.usageOutdoor': 'Outdoor',
  'productNotFound.usageInstall': 'Installation',
  'productNotFound.urgency': 'Urgency',
  'productNotFound.urgencyLow': 'Low',
  'productNotFound.urgencyMedium': 'Medium',
  'productNotFound.urgencyHigh': 'High',
  'productNotFound.messageLabel': 'Message',
  'productNotFound.messagePlaceholder': 'Describe the product, where you used it, and what you need…',
  'productNotFound.submit': 'Send request',
  'productNotFound.privacyNote': 'By submitting you accept the',
  'productNotFound.privacyLink': 'Privacy Policy',
  'productNotFound.responseNote': 'We usually reply by email or WhatsApp within one business day.',
  'productNotFound.success': 'Request sent. We will get back to you soon.',
  'productNotFound.error': 'Could not send request',
  'productNotFound.stepsTitle': 'How it works',
  'productNotFound.preferTalk': 'PREFER TO TALK?',
  'productNotFound.whatsapp': 'Message us on WhatsApp',
  'productNotFound.professionalsTitle': 'For professionals too',
  'productNotFound.professionalsBody':
    'Long lists or recurring reorders? Upload a file with product codes and we will prepare a single quote.',
  'productNotFound.professionalsCta': 'Professional area',
  'productNotFound.showroomTitle': 'Rome showroom',
  'productNotFound.showroomBody':
    'Via Appia Pignatelli 450 · Mon–Fri 9–13 / 15–18. Bring the part: we identify it on the spot.',
  'productNotFound.showroomCta': 'Discover the showroom',
  'auth.sessionChecking': 'Checking session…',
  'auth.redirectingToLogin': 'Redirecting to sign in…',
  'auth.loggingIn': 'Signing in…',
  'auth.loggedIn': 'Signed in successfully.',
  'auth.loggedOut': 'You have been signed out.',
  'auth.loggedOutLocalOnly':
    'Local session cleared. If something looks wrong, refresh the page or try again.',
  'auth.loginSubmit': 'Sign in',
  'auth.registerSubmit': 'Register',
  'auth.registering': 'Registering…',
  'auth.noAccount': "Don't have an account?",
  'auth.hasAccount': 'Already have an account?',
  'auth.firstNamePlaceholder': 'John',
  'auth.lastNamePlaceholder': 'Smith',
  'auth.emailPlaceholder': 'name@email.com',
  'auth.loginError': 'Sign-in error',
  'auth.recaptchaRequired': 'Complete the anti-bot check before continuing.',
  'auth.recaptchaFailed': 'Anti-bot verification failed. Please try again.',
  'auth.recaptchaBanner': 'Google reCAPTCHA protection is active.',
  'auth.recaptchaPrivacy': 'Privacy',
  'auth.recaptchaTerms': 'Terms',
  'home.title': 'Idea di Luce',
  'home.subtitle': 'Lighting for home and professionals',
  'home.metaDescription': 'La luce pensata. Lighting for home and professionals.',
  'home.featuredTitle': 'Featured products',
  'home.featuredDescription': 'A selection from our shop.',
  'home.goToCatalog': 'Go to shop',
  'home.viewAll': 'View all products',
  'home.categories': 'Categories',
  'catalog.title': 'Shop',
  'catalog.description': 'Search products, filter by category, and sort results.',
  'catalog.metaDescription': 'Lighting shop — lamps, wall lights, and solutions for home and professionals.',
  'catalog.search': 'Search products',
  'catalog.searchLabel': 'Search the shop',
  'catalog.searchPlaceholder': 'Type at least 3 characters…',
  'catalog.clearSearch': 'Clear search',
  'catalog.noSuggestions': 'No suggestions in loaded products.',
  'catalog.suggestGroupAttacchi': 'Sockets',
  'catalog.suggestGroupBrands': 'Brands',
  'catalog.suggestGroupCategories': 'Categories',
  'catalog.suggestGroupProducts': 'Products',
  'catalog.suggestGroupHints': 'Suggestions',
  'catalog.suggestGroupQueries': 'Searches',
  'catalog.searchRecentLabel': 'Recent searches',
  'catalog.searchEmptyTitle': 'No results',
  'catalog.searchEmptyDescription': 'Try another term, socket code, or brand.',
  'catalog.searchViewAllResults': 'View all {count} results',
  'catalog.searchViewAllResultsNoCount': 'View all results',
  'catalog.searchKeyboardNavigate': 'Navigate',
  'catalog.searchKeyboardSelect': 'Select',
  'catalog.searchKeyboardClose': 'Close',
  'catalog.searchShortcutHint': 'Press {shortcut} to open search',
  'catalog.searchPopularLabel': 'Popular searches',
  'catalog.searchClearRecent': 'Clear',
  'header.openSearch': 'Open shop search',
  'catalog.inStock': 'In stock only',
  'catalog.inStockHint': 'Show only products available in warehouse.',
  'catalog.sort': 'Sort',
  'catalog.sortRelevance': 'Relevance',
  'catalog.sortPriceAsc': 'Price: low to high',
  'catalog.sortPriceDesc': 'Price: high to low',
  'catalog.sortName': 'Name A–Z',
  'catalog.minPrice': 'Min price (€)',
  'catalog.maxPrice': 'Max price (€)',
  'catalog.categoryLabel': 'Category',
  'catalog.allCategories': 'All categories',
  'catalog.clearCategory': 'Clear category',
  'catalog.hideCategories': 'Hide categories',
  'catalog.chooseCategory': 'Choose category ({count})',
  'catalog.searchCategoryPlaceholder': 'Search category…',
  'catalog.noCategoryFound': 'No category found.',
  'catalog.showingCount': 'Showing {shown} of {total} products',
  'catalog.inStockSuffix': ' in stock',
  'catalog.forQuery': ' for "{query}"',
  'catalog.seenAll': 'You have seen all products.',
  'catalog.emptyTitle': 'No products',
  'catalog.emptyDescription': 'Try a different filter.',
  'category.loading': 'Loading…',
  'category.empty': 'No products in this category.',
  'category.backToCatalog': '← {catalog}',
  'product.notAvailable': 'Product unavailable',
  'product.backToCatalog': 'Back to shop',
  'product.sectionDescription': 'Product description',
  'product.sectionSpecs': 'Technical specifications',
  'product.sectionActivity': 'Recent activity',
  'product.additionalInfo': 'Additional information',
  'product.addToCart': 'Add to cart',
  'product.addToCartShort': 'Add',
  'product.addingToCart': 'Adding…',
  'product.availability.available': 'Available',
  'product.availability.orderable': 'Orderable',
  'product.availability.outOfStock': 'Out of stock',
  'product.availability.shippedInDays': 'Ships in {days} business days',
  'product.availability.shippedByDate': 'Estimated shipping by {date}',
  'product.availability.orderableFallback':
    'Orderable — estimated shipping in 10 business days',
  'product.availability.lowStock': 'Only {count} left',
  'product.outOfStock': 'Out of stock',
  'product.unavailable': 'Unavailable',
  'product.available': 'Available',
  'product.lowStock': 'Only {count} left',
  'product.relatedTitle': 'You may also like…',
  'product.grid.empty': 'No products listed.',
  'product.card.noImage': 'No image',
  'product.quantityLabel': 'Quantity',
  'product.variantLabel': 'Variant',
  'product.variantSoldOut': 'Sold out',
  'product.meta.sku': 'SKU:',
  'product.meta.categories': 'Categories:',
  'product.meta.availability': 'Availability',
  'product.trust.secureTitle': '100% Secure',
  'product.trust.secureDescription': 'SSL encryption protects your transactions.',
  'product.trust.freeShippingTitle': 'Free shipping',
  'product.trust.freeShippingDescription': 'For orders from Italy of €200 or more (VAT included).',
  'product.trust.refundTitle': 'Satisfaction guaranteed',
  'product.trust.refundDescription': 'Return items within 14 days for a refund.',
  'product.restock.notifyCta': 'Notify me on restock',
  'product.requestProduct': 'Request product',
  'product.restock.title': 'Notify me when back in stock',
  'product.restock.description': 'Enter your email and desired quantity — we will contact you on restock.',
  'product.restock.quantityDesired': 'Desired quantity',
  'product.restock.confirmSent': 'We will notify {email} when {productName} is back in stock',
  'product.restock.submit': 'Request notification',
  'product.restock.submitting': 'Sending…',
  'product.restock.error': 'Unable to register your request. Please try again.',
  'product.socialProof.disabled': 'Recent activity notifications are not enabled for this shop.',
  'product.socialProof.noEvents': 'No recent purchases to show for this product',
  'product.socialProof.minQuantityHint': ' (min. {count} items)',
  'product.socialProof.purchased': '{buyer} purchased {quantity}',
  'product.socialProof.closeNotifications': 'Close purchase notifications',
  'product.socialProof.piece': '1 item',
  'product.socialProof.pieces': '{count} items',
  'product.demand.unitsSold': '{count} purchases in the last 30 days',
  'product.demand.recentBuyers': '{count} customers purchased recently',
  'product.card.addingAria': 'Adding {productName} to cart',
  'product.card.inCartAria': '{productName} in cart, quantity {count}',
  'product.card.inCartTitle': 'In cart ({count})',
  'product.card.addAria': 'Add {productName} to cart',
  'product.card.outOfStockAria': '{productName} out of stock',
  'product.card.cartSr': 'Cart',
  'product.slider.prev': 'Previous products',
  'product.slider.next': 'Next products',
  'login.title': 'Sign in',
  'login.welcomeTitle': 'Welcome back',
  'login.subtitle': 'Sign in to your IdeaDiLuce account.',
  'login.forgot': 'Forgot password?',
  'login.rememberMe': 'Remember me on this device',
  'login.passwordPlaceholder': '••••••••',
  'login.showPassword': 'Show password',
  'login.hidePassword': 'Hide password',
  'login.professionalPrompt': 'Are you a professional?',
  'login.professionalCta': 'Go to the B2B area',
  'register.title': 'Create account',
  'register.subtitle': 'Create your IdeaDiLuce account.',
  'register.business': 'Business account (B2B pricing)',
  'register.passwordHint': 'Password (min 8 characters)',
  'register.passwordPlaceholder': 'Min. 8 characters',
  'forgot.title': 'Password recovery',
  'forgot.subtitle': 'We will send you a link to reset your password.',
  'forgot.submit': 'Send link',
  'forgot.error': 'Unable to send the link. Please try again.',
  'forgot.sentMessage':
    'If the email is registered, you will receive a password reset link by email (sent from the portal). Check your spam folder too.',
  'reset.title': 'New password',
  'reset.submit': 'Save password',
  'reset.invalidLink': 'Invalid link.',
  'reset.expiredLink': 'Link expired or invalid. Request a new link.',
  'reset.passwordLabel': 'New password (min 8 characters)',
  'reset.requestNewLink': 'Request new link',
  'reset.odooDelegated':
    'Password reset happens via the link you receive by email. Open that link, set your new password, then sign in on the site with your new credentials.',
  'cart.title': 'Cart',
  'cart.pageTitle': 'Your cart',
  'cart.description': 'Review items, update quantities, and proceed to checkout.',
  'cart.clear': 'Clear cart',
  'cart.continueShopping': 'Continue shopping',
  'cart.itemCountOne': '{count} item',
  'cart.itemCountMany': '{count} items',
  'cart.variant': 'Variant:',
  'cart.perUnit': 'each',
  'cart.line.availableFast': 'Available · ships in 24/48h',
  'cart.line.availableLead': 'Available · ships in {days} business days',
  'cart.line.lowStock': 'Last units · {qty} available',
  'cart.line.orderable': 'Orderable — delivery time to be confirmed',
  'cart.line.unavailable': 'Unavailable',
  'cart.recommendationsTitle': 'Frequently bought together',
  'cart.recommendationsDescription': 'Compatible with items in your cart.',
  'cart.recommendationsLoading': 'Loading suggestions…',
  'cart.recommendationsEmpty': 'No recommended add-ons for these products.',
  'cart.summary.title': 'Summary',
  'cart.summary.subtotal': 'Subtotal (est.)',
  'cart.summary.tax': 'VAT (est.)',
  'cart.summary.shipping': 'Shipping',
  'cart.summary.shippingFree': 'Free',
  'cart.summary.total': 'Total',
  'cart.summary.taxIncluded': 'VAT {rate}% included · {amount}',
  'cart.summary.securePayment': 'Secure payment · 50-day returns',
  'cart.summary.estimatesDisclaimer': 'Tax and shipping are recalculated at checkout.',
  'cart.checkoutCta': 'Go to checkout',
  'cart.remove': 'Remove',
  'cart.empty.title': 'Your cart is empty',
  'cart.empty.description': 'Add products from the shop or return to the home page.',
  'cart.empty.browseCatalog': 'Browse shop',
  'cart.empty.backHome': 'Back to home',
  'cart.empty.popularCategories': 'Popular categories',
  'cart.empty.featured': 'Featured products',
  'cart.toast.added': 'Added to cart',
  'cart.toast.quantity': 'Quantity:',
  'cart.toast.close': 'Close notification',
  'cart.toast.openCart': 'Open cart',
  'cart.stock.outOfStock': 'No longer available',
  'cart.stock.insufficient': 'Quantity not available',
  'cart.reservationExpired.title': 'Cart expired',
  'cart.reservationExpired.description': 'Your reservation has expired. We are updating availability and prices.',
  'cart.reservationExpired.dismiss': 'Got it',
  'cart.freeShipping.progress': 'Progress toward free shipping',
  'cart.freeShipping.remaining': 'Add {amount} for free shipping',
  'cart.freeShipping.unlocked': 'Free shipping',
  'cart.freeShipping.unlockedDetail': 'you reached the {amount} threshold. Delivery is included.',
  'cart.compatibility.title': 'Not sure about compatibility?',
  'cart.compatibility.description':
    'Send us a photo or the code of your old product: we verify driver, socket and wattage before you order.',
  'cart.compatibility.cta': 'Request a check',
  'cart.pricelist.b2b': 'B2B pricing',
  'cart.pricelist.b2c': 'B2C pricing',
  'cart.quoteCta': 'Request a quote',
  'cart.priceUpdated': 'Price updated',
  'cart.professional.badge': 'Professional terms active',
  'cart.professional.banner': 'You are viewing prices and terms reserved for professionals.',
  'cart.unpurchasable.badge': 'No longer available',
  'cart.unpurchasable.limitedBadge': 'Limited availability',
  'cart.unpurchasable.blockedCheckout': 'Remove or move unavailable products to wishlist to continue.',
  'cart.unpurchasable.moveToWishlist': 'Move to wishlist',
  'cart.unpurchasable.noPurchasableLines': 'No purchasable items in your cart.',
  'cart.delivery.banner': 'Single delivery within {days} business days.',
  'cart.quote.title': 'Request a quote',
  'cart.quote.description': 'Send a quote request for the products in your cart.',
  'cart.quote.stubMessage': 'The quote flow will be available soon. Sign in to continue.',
  'cart.quote.backToCart': 'Back to cart',
  'cart.quote.loginCta': 'Sign in',
  'cart.quote.loginRequired': 'Sign in to request a quote.',
  'cart.quote.accountTitle': 'Account for your quote',
  'cart.quote.accountHint': 'Create an account or sign in to submit your request. Your cart stays linked to your profile.',
  'cart.quote.accountContinue': 'Continue to quote',
  'cart.quote.reviewLines': 'Product summary',
  'cart.quote.emptyCart': 'Your cart is empty.',
  'cart.quote.notesLabel': 'Quote notes (optional)',
  'cart.quote.notesPlaceholder': 'E.g. delivery times, finishes, site address…',
  'cart.quote.submit': 'Submit quote request',
  'cart.quote.success': 'Request sent. We will contact you shortly.',
  'cart.quote.successPending': 'Track your quote in your account area. You can pay online once it is approved.',
  'cart.quote.frozenTitle': 'Frozen quote',
  'cart.quote.frozenDescription': 'Locked lines and prices — no automatic recalculation.',
  'cart.quote.frozenNotice': 'Prices shown are those from the quote at request time.',
  'cart.quote.proceedCheckout': 'Proceed to checkout',
  'cart.quote.checkoutStarted': 'Checkout started with frozen prices.',
  'cart.quote.checkoutFailed': 'Unable to start checkout.',
  'cart.quote.steps.navLabel': 'Quote request steps',
  'cart.quote.steps.group.account': 'Account',
  'cart.quote.steps.group.details': 'Details',
  'cart.quote.steps.pageTitle.account': 'Sign in to request a quote',
  'cart.quote.steps.pageTitle.accountConfirm': 'Confirm your account',
  'cart.quote.steps.pageTitle.details': 'Complete your request',
  'cart.quote.steps.pageSubtitle.account': 'Create an account or sign in — your cart stays linked to your profile.',
  'cart.quote.steps.pageSubtitle.details': 'Enter billing details and optionally add notes for our sales team.',
  'cart.quote.estimateNotice': 'Totals in the summary are indicative estimates. You will receive a personalised quote by email.',
  'wishlist.title': 'Wishlist',
  'wishlist.descriptionGuest': 'Save products you like. Sign in to sync them across all your devices.',
  'wishlist.descriptionAccount': 'Your favorite products, ready to purchase.',
  'wishlist.addAllToCart': 'Add all to cart',
  'wishlist.emptyTitle': 'Empty list',
  'wishlist.emptyDescription': 'Add products to your wishlist from the shop.',
  'wishlist.unavailableTitle': 'Some products are no longer available',
  'wishlist.unavailableDescription': 'Remove them from the list or check alternative variants.',
  'wishlist.item.unavailable': 'No longer available',
  'wishlist.item.notInCatalog': 'Product no longer in shop',
  'wishlist.item.addToCart': 'Add to cart',
  'wishlist.heart.add': 'Add to wishlist',
  'wishlist.heart.remove': 'Remove from wishlist',
  'checkout.processing': 'Processing…',
  'checkout.confirmOrder': 'Confirm order',
  'checkout.payAmount': 'Pay {amount}',
  'checkout.contactInfo': 'Contact information',
  'checkout.shippingAddress': 'Shipping address',
  'checkout.billingAddress': 'Billing address',
  'checkout.billingSameAsShipping': 'Same as shipping address',
  'checkout.continue': 'Continue',
  'checkout.continueToShipping': 'Continue to shipping',
  'checkout.continueToPayment': 'Continue to payment',
  'checkout.selectShipping': 'Select a shipping method',
  'checkout.payment': 'Payment method',
  'checkout.paymentNote': 'All payments are protected and encrypted.',
  'walletQuickPay.checkoutFallback': 'Apple Pay · Google Pay at checkout',
  'walletQuickPay.openCheckout': 'Go to checkout',
  'checkout.steps.title': 'Complete your order',
  'checkout.steps.pageTitle.account': 'Sign in or register',
  'checkout.steps.pageTitle.accountConfirm': 'Your account',
  'checkout.steps.details': 'Details',
  'checkout.steps.account': 'Account',
  'checkout.steps.customerType': 'Customer type',
  'checkout.steps.addresses': 'Addresses',
  'checkout.steps.deliveryRecipient': 'Recipient',
  'checkout.steps.review': 'Review',
  'checkout.steps.group.account': 'Account',
  'checkout.steps.group.anagrafica': 'Personal details',
  'checkout.steps.group.indirizzi': 'Addresses',
  'checkout.steps.group.shipping': 'Shipping',
  'checkout.steps.group.payment': 'Payment',
  'checkout.steps.payment': 'Payment',
  'checkout.steps.shipping': 'Shipping',
  'checkout.stepProgress': 'Step {current} of {total}',
  'checkout.summary.subtotal': 'Subtotal',
  'checkout.summary.tax': 'VAT',
  'checkout.summary.shipping': 'Shipping',
  'checkout.summary.free': 'Free',
  'checkout.summary.total': 'Total',
  'checkout.backToCart': 'Back to cart',
  'checkout.shipping.title': 'Shipping method',
  'checkout.shipping.noMethods': 'No methods available for this address.',
  'checkout.shipping.addressIncomplete': 'Complete the address to see shipping options.',
  'checkout.shipping.deliveryEstimate':
    'Single combined delivery estimated within {days} business days (longest lead time in your cart).',
  'checkout.shipping.pickupRomeOnly': 'In-store pickup is only available for customers based in Rome.',
  'checkout.shipping.addressSubtitle': 'Where we deliver your package.',
  'checkout.shipping.diffAddressSubtitle': 'Different from billing — where we deliver the package.',
  'checkout.shipping.methodSubtitle': 'Choose how to receive your order.',
  'checkout.shipping.diffFromBilling': 'Ship to an address different from billing',
  'checkout.summary.showOrderSummary': 'Show order summary',
  'checkout.summary.hideOrderSummary': 'Hide order summary',
  'checkout.summary.promoHint': 'Have a discount code or gift voucher?',
  'checkout.summary.crossSellTitle': 'Add to your order',
  'checkout.summary.crossSellCompat': 'Compatible',
  'checkout.summary.crossSellAdd': 'Add to cart',
  'checkout.summary.secureBadge': 'Secure payment',
  'checkout.summary.securePayment': 'Secure payment',
  'checkout.summary.returns': '50-day returns',
  'checkout.loading.dontClose': 'Do not close this page',
  'checkout.loading.address': 'Verifying addresses…',
  'checkout.loading.shipping': 'Calculating shipping…',
  'checkout.loading.payment': 'Preparing payment…',
  'checkout.payStore': 'Pay {store}',
  'checkout.steps.navLabel': 'Checkout steps',
  'checkout.address.fullName': 'Full name',
  'checkout.address.phoneOptional': 'Phone (optional)',
  'checkout.address.line1': 'Street',
  'checkout.address.streetNumber': 'Street number',
  'checkout.address.isSnc': 'No street number',
  'checkout.address.streetNumberHint': 'Enter the street number or select no street number.',
  'checkout.address.courierNotes': 'Courier notes (optional)',
  'checkout.orderNotes': 'Order notes',
  'checkout.orderNotesPlaceholder': 'Additional instructions for the store (optional)',
  'checkout.address.line2': 'Apartment, suite, etc. (optional)',
  'checkout.address.city': 'City',
  'checkout.address.postalCode': 'Postal code',
  'checkout.address.detailsTitle': 'Address details',
  'checkout.address.lockEdits': 'Lock edits',
  'checkout.address.unlockEdits': 'Edit details manually',
  'checkout.address.changeAddress': 'Change address',
  'checkout.address.label': 'Address',
  'checkout.address.country': 'Country',
  'checkout.address.selectedTitle': 'Selected address',
  'checkout.address.searchPlaceholder': 'Search address…',
  'checkout.address.googleHint':
    'Search and select an address from the list — you can verify and edit details right after.',
  'checkout.address.resolvingPrefill': 'Verifying address…',
  'checkout.account.guestHint': 'You can complete your order as a guest.',
  'checkout.account.continueAsGuest': 'Continue as guest',
  'checkout.account.requiredHint': 'Sign in or create an account to continue.',
  'checkout.account.registerTab': 'New account',
  'checkout.account.loginTab': 'Sign in',
  'checkout.account.orDivider': 'or create an account',
  'checkout.account.createAndContinue': 'Create account and continue',
  'checkout.account.registerError': 'Registration failed. Try again or sign in if you already have an account.',
  'checkout.register.firstName': 'First name',
  'checkout.register.lastName': 'Last name',
  'checkout.customerType.hint': 'Choose whether you are buying as a private customer or a business.',
  'checkout.register.changeCustomerType': 'Change customer type',
  'checkout.customerType.retail.title': 'Private',
  'checkout.customerType.business.title': 'Business',
  'checkout.deliveryRecipient.hint': 'Choose whether the order ships to you or to another recipient.',
  'checkout.deliveryRecipient.self.title': 'Ship to me',
  'checkout.deliveryRecipient.self.description': 'Goods arrive at the shipping address you entered.',
  'checkout.deliveryRecipient.other.title': 'Ship to someone else',
  'checkout.deliveryRecipient.other.description': 'Dropship to client or job site (B2B).',
  'checkout.deliveryRecipient.company': 'Company name (optional)',
  'checkout.deliveryRecipient.addressTitle': 'Recipient address',
  'checkout.deliveryRecipient.notSavedHint': 'This address is not saved to your address book — it applies to this order only.',
  'checkout.billing.professionalActive': 'Professional pricing active',
  'checkout.billing.subtitle': 'Enter details for billing and delivery.',
  'checkout.addresses.subtitle': 'Shipping address and, if different, billing address.',
  'checkout.billing.businessTitle': 'Business billing details',
  'checkout.billing.companyName': 'Company name',
  'checkout.billing.vatNumber': 'VAT number',
  'checkout.billing.fiscalCode': 'Tax ID',
  'checkout.billing.fiscalCodeOptional': 'Tax ID (optional)',
  'checkout.billing.pec': 'PEC email',
  'checkout.billing.sdiCode': 'SDI recipient code',
  'checkout.billing.pecOrSdiHint': 'For Italian e-invoicing, provide at least a PEC address or SDI code.',
  'checkout.billing.clientOrderRefOptional': 'Your order reference (optional)',
  'checkout.billing.fiscalCodeValid': 'Tax ID valid',
  'checkout.billing.fiscalCodeInvalid': 'Invalid tax ID',
  'checkout.billing.vatFormatValid': 'VAT number formally valid',
  'checkout.billing.vatFormatInvalid': 'Invalid VAT number',
  'checkout.billing.verify': 'Verify',
  'checkout.billing.verifying': 'Verifying…',
  'checkout.billing.verifyVatVies': 'Verify VAT number (VIES)',
  'checkout.billing.vatViesValid': 'VAT verified on VIES',
  'checkout.billing.vatViesInvalid': 'VAT not found on VIES',
  'checkout.billing.viesUnavailable':
    'VIES service temporarily unavailable: you can continue but the data will be rechecked.',
  'checkout.billing.vatForceAccepted':
    'VAT not validated: you may continue after 3 attempts.',
  'checkout.billing.vatAttempt': 'Attempt {current}/{max} — check the number entered.',
  'checkout.review.clientOrderRef': 'Order reference',
  'checkout.review.hint': 'Review your details before confirming and paying.',
  'checkout.review.summaryTitle': 'Order summary',
  'checkout.review.detailsToggle': 'Order and address details',
  'checkout.review.secureFooter': 'Powered by Stripe · SSL encrypted transaction',
  'checkout.review.acceptTerms': 'I accept the terms and conditions of sale',
  'checkout.payment.bankTransfer': 'Bank transfer',
  'checkout.payment.card': 'Card / wallet',
  'checkout.account.loginPrompt': 'Already have an account? Sign in',
  'checkout.account.loginError': 'Incorrect email or password.',
  'checkout.account.notYou': 'Not you?',
  'checkout.account.logoutConfirmDescription':
    'You will need to sign in again for orders and profile. Cart prices will be recalculated without your custom price list.',
  'bankTransfer.title': 'Bank transfer details',
  'bankTransfer.description': 'Use the payment reference so we can match your payment to your order.',
  'bankTransfer.copy': 'Copy',
  'bankTransfer.copied': 'Copied',
  'bankTransfer.copyAll': 'Copy all',
  'bankTransfer.holder': 'Account holder',
  'bankTransfer.iban': 'IBAN',
  'bankTransfer.bank': 'Bank',
  'bankTransfer.amount': 'Amount',
  'bankTransfer.reference': 'Payment reference',
  'bankTransfer.awaitingNote':
    'After confirmation you will see bank details and instructions to complete payment.',
  'paymentResult.loading': 'Verifying payment…',
  'paymentResult.notFound': 'Order not found',
  'paymentResult.fetchError': 'Error retrieving order',
  'paymentResult.syncNote': 'Sync with Odoo when configured.',
  'paymentResult.orderPwa': 'PWA order',
  'paymentResult.orderOdoo': 'Odoo order',
  'paymentResult.paymentStatus': 'Payment status',
  'paymentResult.total': 'Total',
  'paymentResult.myOrders': 'My orders',
  'paymentResult.catalog': 'Shop',
  'paymentResult.status.paid': 'Payment completed',
  'paymentResult.status.pending': 'Payment pending',
  'paymentResult.status.failed': 'Payment failed',
  'thankYou.hero.confirmedEyebrow': 'ORDER CONFIRMED',
  'thankYou.hero.pendingEyebrow': 'ORDER RECEIVED',
  'thankYou.hero.failedEyebrow': 'PAYMENT FAILED',
  'thankYou.hero.confirmedTitle': 'Thank you, {name}! Your order is confirmed.',
  'thankYou.hero.confirmedTitleGeneric': 'Thank you! Your order is confirmed.',
  'thankYou.hero.pendingTitle': 'Order received, awaiting payment',
  'thankYou.hero.failedTitle': 'We could not complete your payment',
  'thankYou.hero.emailPrefix': 'We sent the confirmation to',
  'thankYou.hero.confirmedBody': '. We are preparing it now and will notify you when it ships.',
  'thankYou.hero.pendingBody': '. Complete payment to start preparation.',
  'thankYou.hero.failedBody': 'Try checkout again or choose another payment method.',
  'thankYou.hero.retryCheckout': 'Back to checkout',
  'thankYou.hero.retryPayment': 'Retry payment',
  'thankYou.orderNumber': 'Order number',
  'thankYou.estimatedDelivery': 'Estimated delivery',
  'thankYou.deliverySoon': 'Within a few business days',
  'thankYou.tracker.title': 'Order status',
  'thankYou.tracker.confirmed': 'Confirmed',
  'thankYou.tracker.preparing': 'Preparing',
  'thankYou.tracker.shipped': 'Shipped',
  'thankYou.tracker.delivered': 'Delivered',
  'thankYou.tracker.now': 'Now',
  'thankYou.tracker.today': 'Today',
  'thankYou.tracker.afterPayment': 'After payment',
  'thankYou.tracker.trackingNote': 'You will receive a tracking link by email once the order ships.',
  'thankYou.tracker.pickupNote':
    'We will contact you to arrange pickup or delivery once your order has been processed.',
  'thankYou.tracker.trackCta': 'Track order',
  'thankYou.lines.title': 'Product summary',
  'thankYou.lines.quantity': 'Qty {count}',
  'thankYou.support.title': 'Questions about installation?',
  'thankYou.support.body':
    'Our Rome showroom can help with wiring, compatibility and installation. Contact us anytime, even after delivery.',
  'thankYou.support.cta': 'Contact an expert',
  'thankYou.summary.title': 'Order details',
  'thankYou.summary.subtotal': 'Subtotal',
  'thankYou.summary.shipping': 'Shipping',
  'thankYou.summary.total': 'Total',
  'thankYou.summary.vat': 'VAT excluded',
  'thankYou.summary.shipTo': 'Ship to',
  'thankYou.summary.payment': 'Payment',
  'thankYou.shippingFree': 'Free',
  'thankYou.account.title': 'Create an account',
  'thankYou.account.body': 'Save your order, track shipments and reorder spare parts in one click.',
  'thankYou.account.cta': 'Create account with this email',
  'thankYou.crossSell.eyebrow': 'COMPLETE YOUR SETUP',
  'thankYou.crossSell.title': 'Compatible accessories for your order',
  'thankYou.crossSell.catalog': 'Go to shop',
  'purchaseError.securePayment': 'Secure payment · SSL',
  'purchaseError.supportPhone': 'Support · (+39) 06 716 7111',
  'purchaseError.hero.title': 'We could not complete your payment.',
  'purchaseError.hero.bodyPrefix': 'No amount was charged and',
  'purchaseError.hero.bodyStrong': 'your cart is safe',
  'purchaseError.hero.bodySuffix':
    '. You can try again now or use another payment method — it only takes a few seconds.',
  'purchaseError.hero.retryPayment': 'Retry payment',
  'purchaseError.hero.changeMethod': 'Change method',
  'purchaseError.attemptRef': 'Attempt reference ·',
  'purchaseError.causes.title': 'Why this may have happened',
  'purchaseError.causes.intro': 'It is usually fixed quickly. The most common causes:',
  'purchaseError.causes.card.title': 'Check your card details',
  'purchaseError.causes.card.body':
    'Verify number, expiry date and CVC. A typo is the most frequent cause.',
  'purchaseError.causes.secure3ds.title': '3D Secure authorization not completed',
  'purchaseError.causes.secure3ds.body':
    'Your bank may have requested app or SMS confirmation that did not go through.',
  'purchaseError.causes.limit.title': 'Insufficient limit or spending cap',
  'purchaseError.causes.limit.body':
    'Check your card limit or try another method below.',
  'purchaseError.methods.title': 'Try another method',
  'purchaseError.methods.card': 'Another card',
  'purchaseError.methods.paypal': 'PayPal',
  'purchaseError.methods.bankTransfer': 'Bank transfer',
  'purchaseError.support.title': 'Still not working?',
  'purchaseError.support.body':
    'We can help you complete the order by phone or email — or finalize it for you. Availability is not an issue: we hold the items for you.',
  'purchaseError.support.cta': 'Contact support',
  'purchaseError.cart.title': 'Your cart is safe',
  'purchaseError.cart.noCharge': 'No amount charged',
  'purchaseError.cart.reserved': 'Items held for you',
  'purchaseError.cart.ssl': 'Encrypted SSL connection',
  'purchaseError.cart.backToShop': 'Back to shop',
  'purchaseError.taxIncluded': 'VAT 22% included',
  'purchaseError.footer.company':
    'TLB Italy Srl · VAT IT17245551001 · Via Appia Pignatelli 450, Rome',
  'purchaseError.footer.help': 'Need help?',
  'account.pricelist': 'Pricing',
  'account.greeting.named': 'Hello, {name}',
  'account.greeting.default': 'Hello, welcome back',
  'account.overview.myOrders': 'My orders',
  'account.overview.editProfile': 'Edit profile',
  'account.overview.recentOrders': 'Recent orders',
  'account.overview.allOrders': 'All ({count})',
  'account.overview.noOrders': 'No orders yet.',
  'account.overview.browseCatalog': 'Browse shop',
  'account.overview.segmentB2b': '(B2B)',
  'account.overview.segmentB2c': '(B2C)',
  'account.overview.segmentProfessional': '(Professional)',
  'account.overview.accountType': 'Account type',
  'account.overview.recentQuotes': 'Recent quotes',
  'account.overview.recentInvoices': 'Recent invoices',
  'account.overview.viewAllQuotes': 'All quotes',
  'account.overview.viewAllInvoices': 'All invoices',
  'account.overview.noQuotes': 'No quotes yet.',
  'account.overview.noInvoices': 'No invoices available.',
  'account.overview.payableQuotesHint': '{count} quotes ready for online payment.',
  'account.overview.professionalActive': 'Condizioni professional attive',
  'account.nav.overview': 'Overview',
  'account.nav.dashboard': 'Dashboard',
  'account.nav.profile': 'Profile',
  'account.nav.orders': 'My orders',
  'account.nav.parts': 'My spare parts',
  'account.nav.addresses': 'Addresses',
  'account.nav.payments': 'Payments',
  'account.nav.data': 'Details & password',
  'account.nav.support': 'Support',
  'account.nav.wishlist': 'Wishlist',
  'account.nav.quotes': 'Quotes',
  'account.nav.invoices': 'Invoices',
  'account.dashboard.totalOrders': 'Total orders',
  'account.dashboard.inProgress': 'In progress',
  'account.dashboard.savedParts': 'Saved parts',
  'account.dashboard.ongoingOrder': 'Order in progress',
  'account.dashboard.details': 'Details →',
  'account.dashboard.delivery': 'Delivery',
  'account.dashboard.deliverySoon': 'Within a few days',
  'account.dashboard.reorderParts': 'Reorder your spare parts',
  'account.dashboard.reorderPartsBody':
    'You have already bought bulbs and drivers. Reorder them in one click from your parts list.',
  'account.dashboard.goToParts': 'Go to parts',
  'account.dashboard.openQuotes': 'Quotes',
  'account.dashboard.invoices': 'Invoices',
  'account.parts.title': 'My spare parts',
  'account.parts.description': 'Technical products you use most often, ready to reorder.',
  'account.parts.savedCount': '{count} saved products',
  'account.addresses.current': 'Current address',
  'account.payments.title': 'Payment methods',
  'account.payments.current': 'Preferred method',
  'account.quotes.title': 'Your quotes',
  'account.quotes.description': 'Cart quote requests and Odoo quotations linked to your account.',
  'account.quotes.empty': 'No quotes available.',
  'account.quotes.view': 'Open',
  'account.quotes.status.requested': 'Requested',
  'account.quotes.status.sent': 'Sent',
  'account.quotes.status.checkout_started': 'Checkout started',
  'account.quotes.status.converted': 'Converted',
  'account.quotes.status.draft': 'Draft',
  'account.quotes.status.cancelled': 'Cancelled',
  'account.quotes.badge.expired': 'Expired',
  'account.quotes.badge.payable': 'Pay online',
  'account.quotes.badge.pending': 'Awaiting approval',
  'account.quotes.badge.preparing': 'In preparation',
  'account.quotes.message.expired': 'This quote has expired. Contact us for a new quote.',
  'account.quotes.message.notPayable': 'This quote is not yet approved for online payment.',
  'account.quotes.message.not_sent': 'We are preparing your quote. We will notify you when you can pay online.',
  'account.quotes.message.cancelled': 'This quote was cancelled.',
  'account.quotes.message.converted': 'This quote has already been converted to an order.',
  'account.quotes.message.draft': 'The quote is still being prepared.',
  'account.quotes.validUntil': 'Valid until',
  'account.quotes.linesTitle': 'Products',
  'account.quotes.expiredContact': 'Request quote update',
  'account.quotes.viewOrder': 'View linked order',
  'account.invoices.title': 'Your invoices',
  'account.invoices.description': 'Invoices from the ERP linked to your account.',
  'account.invoices.empty': 'No invoices available.',
  'account.invoices.loadError': 'Unable to load invoices.',
  'account.invoices.download': 'Download PDF',
  'account.invoices.pdfPending': 'PDF pending',
  'account.invoices.pdfDownloadError': 'Unable to download the PDF.',
  'account.invoices.portalLink': 'Open in portal',
  'account.profile.businessData': 'Business details',
  'account.profile.businessHint': 'For e-invoicing and B2B terms.',
  'account.overview.professionalCta': 'Are you a professional? Unlock dedicated terms and pricing.',
  'account.overview.professionalCtaLink': 'Request professional account',
  'account.overview.professionalPending': 'Your professional account request is under review. We will contact you within 1 business day.',
  'account.overview.professionalRejected': 'Your professional account request was not approved. You can submit a new one from the professionals page.',
  'account.shell.backToCatalog': 'Back to shop',
  'account.shell.backToShop': 'Back to shop',
  'account.shell.cart': 'Cart',
  'account.shell.continueShopping': 'Continue shopping',
  'account.shell.logout': 'Sign out',
  'account.shell.logoutShort': 'Sign out',
  'account.shell.logoutConfirmTitle': 'Sign out of your account?',
  'account.shell.logoutConfirmDescription': 'You will need to sign in again to view orders and profile.',
  'account.profile.validationError': 'Please complete all required fields.',
  'account.profile.personalData': 'Personal details',
  'account.profile.emailReadonly': 'Email cannot be changed here.',
  'account.profile.preferredPayment': 'Preferred payment method',
  'account.profile.preferredPaymentHint': 'We will use this preference at checkout when possible.',
  'account.profile.shippingAddress': 'Shipping address',
  'account.profile.save': 'Save changes',
  'account.profile.odooSyncWarning':
    'Changes saved to your account, but syncing with Odoo failed. Try again later or contact us if the issue persists.',
  'account.profile.saving': 'Saving…',
  'account.section.orders.title': 'Your orders',
  'account.section.orders.description': 'Purchase history and payment status.',
  'account.section.profile.title': 'Profile',
  'account.section.profile.description': 'Update personal details, address, and preferred payment.',
  'account.section.overview.description': 'Manage orders, profile, and wishlist from your account.',
  'account.meta.customer': 'Customer',
  'account.meta.email': 'Email',
  'account.meta.phone': 'Phone',
  'account.meta.shippingAddress': 'Shipping address',
  'account.meta.preferredPayment': 'Preferred payment',
  'account.meta.orders': 'Orders',
  'account.orders.emptyTitle': 'No orders',
  'account.orders.emptyDescription': 'Your purchases will appear here.',
  'account.orders.track': 'Track →',
  'account.orders.reorder': 'Reorder',
  'account.orders.itemCount': '{count} items',
  'account.orders.table.order': 'Order',
  'account.orders.table.date': 'Date',
  'account.orders.table.total': 'Total',
  'account.orders.table.status': 'Status',
  'account.orders.table.detail': 'Details',
  'account.orders.table.reorder': 'Reorder',
  'account.orders.table.reordering': 'Reordering…',
  'orders.detail.loading': 'Loading order…',
  'orders.detail.back': 'Back to orders',
  'orders.detail.reorder': 'Reorder',
  'orders.detail.items': 'Items',
  'orders.detail.quantity': 'Qty {count}',
  'orders.detail.orderStatus': 'Order status',
  'orders.detail.paymentStatus': 'Payment',
  'orders.detail.total': 'Total',
  'orders.detail.date': 'Date',
  'orders.detail.pwaRef': 'PWA ref.',
  'orders.detail.completeOrder': 'Complete your order',
  'orders.detail.invoicePortal': 'Invoice and details available in the Odoo portal.',
  'orders.reorder.success': 'Products added to cart',
  'orders.reorder.error': 'Unable to reorder',
  'impersonate.invalidLink': 'Invalid impersonation link.',
  'impersonate.expiredLink': 'Link expired or invalid. Request a new one from the back office.',
  'impersonate.loading': 'Signing in as customer…',
  'breadcrumb.home': 'Home',
  'category.products': 'products',
  'legal.terms': 'Terms',
  'legal.privacy': 'Privacy',
  'paymentMethod.stripe': 'Credit / debit card',
  'paymentMethod.stripeDescription': 'Visa, Mastercard, Amex, Apple Pay, and Google Pay',
  'paymentMethod.bankTransfer': 'Bank transfer',
  'paymentMethod.bankTransferDescription': 'Confirm your order and receive IBAN and payment reference immediately',
  'orderStatus.cart_created': 'Cart created',
  'orderStatus.checkout_started': 'Checkout started',
  'orderStatus.payment_started': 'Payment started',
  'orderStatus.payment_pending': 'Payment pending',
  'orderStatus.paid': 'Paid',
  'orderStatus.paid_sync_pending': 'Paid, sync pending',
  'orderStatus.synced': 'Confirmed',
  'orderStatus.payment_failed': 'Payment failed',
  'orderStatus.abandoned': 'Abandoned',
  'orderStatus.cancelled': 'Cancelled',
  'orderStatus.confirmed': 'Confirmed',
  'orderStatus.completed': 'Completed',
  'paymentStatus.not_started': 'Not started',
  'paymentStatus.created': 'Created',
  'paymentStatus.pending': 'Pending',
  'paymentStatus.captured': 'Paid',
  'paymentStatus.failed': 'Failed',
  'paymentStatus.cancelled': 'Cancelled',
  'paymentStatus.refunded': 'Refunded',
  'impersonation.banner.viewing': 'You are viewing the shop as',
  'impersonation.banner.startedBy': '(impersonation started by {admin})',
  'impersonation.banner.end': 'End impersonation',
  'cart.floating.close': 'Close cart',
  'cart.floating.loading': 'Loading mini cart…',
  'cart.floating.items': 'Items',
  'cart.floating.estimatedTotal': 'Estimated total',
  'cart.floating.moreLines': '+{count} more lines in cart',
  'cart.floating.openCart': 'Open cart',
  'cart.floating.openMiniCart': 'Open mini cart',
  'checkout.payment.loadingModule': 'Loading payment form',
  'checkout.payment.orPayWithCard': 'Or pay with card',
  'checkout.payment.orderSr': 'Order {orderId}',
  'checkout.payment.prepareError': 'Unable to prepare payment.',
  'checkout.payment.failed': 'Payment failed',
  'checkout.payment.cardholderName': 'Name on card',
  'checkout.payment.cardholderNamePlaceholder': 'As shown on your card',
  'checkout.payment.cardholderNameRequired': 'Enter the cardholder name.',
  'checkout.payment.formNotReady': 'The payment form is not ready yet. Wait a moment and try again.',
  'checkout.payment.cardIncomplete': 'Complete your card details before paying.',
  'checkout.poweredByStripe': 'Powered by Stripe',
  'checkout.emailPlaceholder': 'email@example.com',
  'checkout.error.incompleteAddress':
    'Complete email and shipping address (and billing if different).',
  'checkout.error.incompleteStep': 'Complete the required fields to continue.',
  'checkout.error.authRequired': 'Sign in or create an account to complete your order.',
  'checkout.error.generic': 'Checkout error',
  'checkout.error.missingOrder': 'Checkout order missing',
  'checkout.error.missingPayment': 'Payment missing',
  'checkout.error.orderUnavailable': 'Order unavailable after confirmation',
  'checkout.error.alreadyPaid': 'This order has already been paid.',
  'checkout.shipping.eta': 'Estimated delivery ~{days} business days',
  'checkout.address.typeToSearch': 'Start typing the address…',
  'breadcrumb.nav': 'Breadcrumb',
  'language.switcher.current': 'Language: {locale}. Change language',
  'language.switcher.other': 'Other languages',
  'theme.switcher.title': 'Classic, black or dark theme',
  'theme.switcher.toLight': 'Switch to black theme',
  'theme.switcher.toDark': 'Switch to dark theme',
  'theme.switcher.toClassic': 'Switch to classic (brown) theme',
  'skeleton.loadingProducts': 'Loading products…',
  'skeleton.loadingCart': 'Loading cart…',
  'skeleton.loadingCartSummary': 'Loading cart summary…',
  'skeleton.loadingProduct': 'Loading product…',
  'skeleton.loadingCheckout': 'Loading checkout…',
  'skeleton.loadingPageHeader': 'Loading page header',
  'skeleton.loadingForm': 'Loading form',
  'skeleton.loadingPaymentResult': 'Loading payment result',
  'skeleton.loadingCatalogFilters': 'Loading shop filters',
  'skeleton.loadingAccount': 'Loading account area',
  'skeleton.loadingList': 'Loading list…',
}

const ES: Record<MessageKey, string> = {
  ...EN,
  'brand.name': 'Idea di Luce',
  'common.loading': 'Cargando…',
  'common.loadingCatalog': 'Cargando tienda…',
  'common.confirm': 'Confirmar',
  'common.cancel': 'Cancelar',
  'common.pleaseWait': 'Espere…',
  'common.notAvailable': '—',
  'common.email': 'Correo electrónico',
  'common.password': 'Contraseña',
  'common.firstName': 'Nombre',
  'common.lastName': 'Apellidos',
  'common.phone': 'Teléfono',
  'common.quantity': 'Cantidad',
  'common.remove': 'Eliminar',
  'common.all': 'Todos',
  'common.back': 'Volver',
  'common.save': 'Guardar',
  'common.saving': 'Guardando…',
  'common.close': 'Cerrar',
  'common.menu': 'Menú',
  'nav.catalog': 'Tienda',
  'nav.cart': 'Carrito',
  'nav.account': 'Cuenta',
  'nav.login': 'Iniciar sesión',
  'nav.register': 'Registrarse',
  'nav.wishlist': 'Favoritos',
  'nav.checkout': 'Checkout',
  'nav.logout': 'Cerrar sesión',
  'footer.tagline': 'Idea di Luce · iluminación para el hogar y profesionales',
  'error.genericTitle': 'Algo salió mal',
  'notFound.metaTitle': 'Página no encontrada',
  'notFound.eyebrow': 'ERROR 404',
  'notFound.title': 'Aquí la luz se apagó.',
  'notFound.description':
    'La página que buscas se ha movido, eliminado o nunca existió. Pero no te quedes a oscuras: retomemos desde aquí.',
  'notFound.backHome': 'Volver al inicio',
  'notFound.exploreCatalog': 'Explorar la tienda',
  'notFound.searchPlaceholder': 'Buscar por producto, casquillo, código o marca',
  'notFound.searchCta': 'Buscar',
  'notFound.assistenza': 'Asistencia',
  'notFound.linkDesign': 'Iluminación decorativa',
  'notFound.linkTechnical': 'Productos técnicos',
  'notFound.linkAttacco': 'Elegir por casquillo',
  'notFound.linkGuide': 'Guías',
  'notFound.linkProductNotFound': '¿Producto no encontrado?',
  'notFound.footer': 'TLB Italy Srl · Via Appia Pignatelli 450, Roma · info@ideadiluce.com',
  'productNotFound.formTitle': 'Cuéntanos qué buscas',
  'productNotFound.formDescription':
    'Cuanta más información nos des, más rápido encontraremos el producto correcto.',
  'productNotFound.photoProduct': 'Foto del producto o del casquillo',
  'productNotFound.photoProductHint': 'Arrastra la foto del producto',
  'productNotFound.photoSocket': 'Foto del casquillo',
  'productNotFound.photoSocketHint': 'Foto del casquillo de cerca',
  'productNotFound.nameLabel': 'Nombre y apellidos',
  'productNotFound.namePlaceholder': 'Mario Rossi',
  'productNotFound.emailPlaceholder': 'mario@email.it',
  'productNotFound.phoneLabel': 'Teléfono / WhatsApp',
  'productNotFound.phonePlaceholder': '+39 ___ ___ ____',
  'productNotFound.codeLabel': 'Código / EAN / MPN',
  'productNotFound.codePlaceholder': 'ej. 8711500411990',
  'productNotFound.brandLabel': 'Marca (si la conoces)',
  'productNotFound.brandPlaceholder': 'Philips, Osram…',
  'productNotFound.usage': 'Uso',
  'productNotFound.usageHome': 'Casa',
  'productNotFound.usageShop': 'Tienda',
  'productNotFound.usageOffice': 'Oficina',
  'productNotFound.usageOutdoor': 'Exterior',
  'productNotFound.usageInstall': 'Instalación',
  'productNotFound.urgency': 'Urgencia',
  'productNotFound.urgencyLow': 'Baja',
  'productNotFound.urgencyMedium': 'Media',
  'productNotFound.urgencyHigh': 'Alta',
  'productNotFound.messageLabel': 'Mensaje',
  'productNotFound.messagePlaceholder': 'Describe el producto, dónde lo usabas y qué necesitas…',
  'productNotFound.submit': 'Enviar solicitud',
  'productNotFound.privacyNote': 'Al enviar aceptas la',
  'productNotFound.privacyLink': 'Política de privacidad',
  'productNotFound.responseNote': 'Respondemos por email o WhatsApp, normalmente en el mismo día laborable.',
  'productNotFound.success': 'Solicitud enviada. Te responderemos pronto.',
  'productNotFound.error': 'No se pudo enviar la solicitud',
  'productNotFound.stepsTitle': 'Cómo funciona',
  'productNotFound.preferTalk': '¿PREFIERES HABLAR?',
  'productNotFound.whatsapp': 'Escríbenos por WhatsApp',
  'productNotFound.professionalsTitle': 'También para profesionales',
  'productNotFound.professionalsBody':
    '¿Listas largas o pedidos recurrentes? Súbenos un archivo con los códigos: te preparamos un presupuesto único.',
  'productNotFound.professionalsCta': 'Área profesionales',
  'productNotFound.showroomTitle': 'Showroom de Roma',
  'productNotFound.showroomBody':
    'Via Appia Pignatelli 450 · Lun–Vie 9–13 / 15–18. Trae la pieza: la identificamos al momento.',
  'productNotFound.showroomCta': 'Descubre el showroom',
  'auth.sessionChecking': 'Verificando sesión…',
  'auth.redirectingToLogin': 'Redirigiendo al inicio de sesión…',
  'auth.loggingIn': 'Iniciando sesión…',
  'auth.loggedIn': 'Sesión iniciada.',
  'auth.loggedOut': 'Has cerrado sesión.',
  'auth.loggedOutLocalOnly':
    'Sesión local cerrada. Si algo no cuadra, recarga la página o inténtalo de nuevo.',
  'auth.loginSubmit': 'Entrar',
  'auth.registerSubmit': 'Registrarse',
  'auth.registering': 'Registrando…',
  'auth.noAccount': '¿No tienes cuenta?',
  'auth.hasAccount': '¿Ya tienes cuenta?',
  'auth.firstNamePlaceholder': 'Juan',
  'auth.lastNamePlaceholder': 'García',
  'auth.emailPlaceholder': 'nombre@email.com',
  'home.title': 'Idea di Luce',
  'home.subtitle': 'Iluminación para el hogar y profesionales',
  'home.metaDescription': 'La luce pensata. Iluminación para el hogar y profesionales.',
  'home.featuredTitle': 'Productos destacados',
  'home.featuredDescription': 'Una selección de nuestra tienda disponible.',
  'home.goToCatalog': 'Ir a la tienda',
  'home.viewAll': 'Ver todos los productos',
  'home.categories': 'Categorías',
  'catalog.title': 'Tienda',
  'catalog.description': 'Busca productos, filtra por categoría y ordena los resultados.',
  'catalog.metaDescription': 'Tienda de iluminación — lámparas, apliques y soluciones para el hogar y profesionales.',
  'catalog.search': 'Buscar productos',
  'catalog.searchLabel': 'Buscar en la tienda',
  'catalog.searchPlaceholder': 'Escribe al menos 3 caracteres…',
  'catalog.clearSearch': 'Borrar búsqueda',
  'catalog.noSuggestions': 'Sin sugerencias en los productos cargados.',
  'catalog.suggestGroupAttacchi': 'Casquillos',
  'catalog.suggestGroupBrands': 'Marcas',
  'catalog.suggestGroupCategories': 'Categorías',
  'catalog.suggestGroupProducts': 'Productos',
  'catalog.suggestGroupHints': 'Sugerencias',
  'catalog.suggestGroupQueries': 'Búsquedas',
  'catalog.searchRecentLabel': 'Búsquedas recientes',
  'catalog.searchEmptyTitle': 'Sin resultados',
  'catalog.searchEmptyDescription': 'Prueba con otros términos, un casquillo o una marca.',
  'catalog.searchViewAllResults': 'Ver los {count} resultados',
  'catalog.searchViewAllResultsNoCount': 'Ver todos los resultados',
  'catalog.searchKeyboardNavigate': 'Navegar',
  'catalog.searchKeyboardSelect': 'Seleccionar',
  'catalog.searchKeyboardClose': 'Cerrar',
  'catalog.searchShortcutHint': 'Pulsa {shortcut} para abrir la búsqueda',
  'catalog.searchPopularLabel': 'Búsquedas populares',
  'catalog.searchClearRecent': 'Borrar',
  'header.openSearch': 'Abrir búsqueda de la tienda',
  'catalog.inStock': 'Solo disponibles',
  'catalog.inStockHint': 'Mostrar solo productos con stock en almacén.',
  'catalog.sort': 'Ordenar',
  'catalog.sortRelevance': 'Relevancia',
  'catalog.sortPriceAsc': 'Precio: menor a mayor',
  'catalog.sortPriceDesc': 'Precio: mayor a menor',
  'catalog.sortName': 'Nombre A–Z',
  'catalog.minPrice': 'Precio mín. (€)',
  'catalog.maxPrice': 'Precio máx. (€)',
  'catalog.categoryLabel': 'Categoría',
  'catalog.allCategories': 'Todas las categorías',
  'catalog.clearCategory': 'Borrar categoría',
  'catalog.hideCategories': 'Ocultar categorías',
  'catalog.chooseCategory': 'Elegir categoría ({count})',
  'catalog.searchCategoryPlaceholder': 'Buscar categoría…',
  'catalog.noCategoryFound': 'Ninguna categoría encontrada.',
  'catalog.showingCount': 'Mostrando {shown} de {total} productos',
  'catalog.inStockSuffix': ' disponibles',
  'catalog.forQuery': ' para "{query}"',
  'catalog.seenAll': 'Has visto todos los productos.',
  'catalog.emptyTitle': 'Sin productos',
  'catalog.emptyDescription': 'Prueba otro filtro.',
  'category.loading': 'Cargando…',
  'category.empty': 'No hay productos en esta categoría.',
  'category.backToCatalog': '← {catalog}',
  'product.notAvailable': 'Producto no disponible',
  'product.backToCatalog': 'Volver a la tienda',
  'product.sectionDescription': 'Descripción del producto',
  'product.sectionSpecs': 'Características técnicas',
  'product.sectionActivity': 'Actividad reciente',
  'product.additionalInfo': 'Información adicional',
  'product.addToCart': 'Añadir al carrito',
  'product.addToCartShort': 'Añadir',
  'product.addingToCart': 'Añadiendo…',
  'product.requestProduct': 'Solicitar producto',
  'product.availability.available': 'Disponible',
  'product.availability.orderable': 'Pedible',
  'product.availability.outOfStock': 'Fuera de stock',
  'product.availability.shippedInDays': 'Envío en {days} días laborables',
  'product.availability.shippedByDate': 'Envío estimado antes del {date}',
  'product.availability.orderableFallback':
    'Pedible — envío estimado en 10 días laborables',
  'product.availability.lowStock': 'Solo quedan {count}',
  'product.outOfStock': 'Agotado',
  'product.unavailable': 'No disponible',
  'product.available': 'Disponible',
  'product.lowStock': 'Solo quedan {count}',
  'product.relatedTitle': 'También te puede interesar…',
  'product.grid.empty': 'No hay productos en la lista.',
  'product.card.noImage': 'Sin imagen',
  'product.quantityLabel': 'Cantidad',
  'product.variantLabel': 'Variante',
  'product.variantSoldOut': 'Agotado',
  'login.title': 'Iniciar sesión',
  'login.welcomeTitle': 'Bienvenido de nuevo',
  'login.subtitle': 'Accede a tu cuenta IdeaDiLuce.',
  'login.forgot': '¿Olvidaste tu contraseña?',
  'login.rememberMe': 'Recordarme en este dispositivo',
  'login.passwordPlaceholder': '••••••••',
  'login.showPassword': 'Mostrar contraseña',
  'login.hidePassword': 'Ocultar contraseña',
  'login.professionalPrompt': '¿Eres un profesional?',
  'login.professionalCta': 'Accede al área B2B',
  'register.title': 'Crear cuenta',
  'register.subtitle': 'Crea tu cuenta IdeaDiLuce.',
  'register.business': 'Cuenta business (tarifa B2B)',
  'register.passwordHint': 'Contraseña (mín. 8 caracteres)',
  'register.passwordPlaceholder': 'Mín. 8 caracteres',
  'forgot.title': 'Recuperar contraseña',
  'forgot.subtitle': 'Te enviaremos un enlace para restablecer tu contraseña.',
  'forgot.submit': 'Enviar enlace',
  'forgot.error': 'No se pudo enviar el enlace. Inténtalo de nuevo.',
  'forgot.sentMessage': 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.',
  'reset.title': 'Nueva contraseña',
  'reset.submit': 'Guardar contraseña',
  'reset.invalidLink': 'Enlace no válido.',
  'reset.expiredLink': 'Enlace caducado o no válido. Solicita uno nuevo.',
  'reset.passwordLabel': 'Nueva contraseña (mín. 8 caracteres)',
  'reset.requestNewLink': 'Solicitar nuevo enlace',
  'reset.odooDelegated':
    'El restablecimiento de contraseña se realiza mediante el enlace que recibes por correo. Ábrelo, establece la nueva contraseña y luego inicia sesión en el sitio.',
  'cart.title': 'Carrito',
  'cart.pageTitle': 'Tu carrito',
  'cart.description': 'Revisa los artículos, actualiza las cantidades y procede al checkout.',
  'cart.clear': 'Vaciar carrito',
  'cart.continueShopping': 'Seguir comprando',
  'cart.itemCountOne': '{count} producto',
  'cart.itemCountMany': '{count} productos',
  'cart.variant': 'Variante:',
  'cart.perUnit': 'ud.',
  'cart.line.availableFast': 'Disponible · envío en 24/48h',
  'cart.line.availableLead': 'Disponible · envío en {days} días laborables',
  'cart.line.lowStock': 'Últimas unidades · {qty} disponibles',
  'cart.line.orderable': 'Pedible — plazo de entrega por confirmar',
  'cart.line.unavailable': 'No disponible',
  'cart.recommendationsTitle': 'Comprados juntos con frecuencia',
  'cart.recommendationsDescription': 'Compatibles con los productos del carrito.',
  'cart.recommendationsLoading': 'Cargando sugerencias…',
  'cart.recommendationsEmpty': 'No hay complementos recomendados para estos productos.',
  'cart.summary.title': 'Resumen',
  'cart.summary.subtotal': 'Subtotal (est.)',
  'cart.summary.tax': 'IVA (est.)',
  'cart.summary.shipping': 'Envío',
  'cart.summary.shippingFree': 'Gratis',
  'cart.summary.total': 'Total',
  'cart.summary.taxIncluded': 'IVA {rate}% incluida · {amount}',
  'cart.summary.securePayment': 'Pago seguro · devolución en 50 días',
  'cart.summary.estimatesDisclaimer': 'Impuestos y envío recalculados en el checkout.',
  'cart.checkoutCta': 'Ir al checkout',
  'cart.quoteCta': 'Solicitar presupuesto',
  'cart.priceUpdated': 'Precio actualizado',
  'cart.professional.badge': 'Condiciones professional activas',
  'cart.professional.banner': 'Estás viendo precios y condiciones reservados a profesionales.',
  'cart.unpurchasable.badge': 'Ya no disponible',
  'cart.unpurchasable.limitedBadge': 'Disponibilidad limitada',
  'cart.unpurchasable.blockedCheckout': 'Elimina o mueve a favoritos los productos no disponibles para continuar.',
  'cart.unpurchasable.moveToWishlist': 'Mover a favoritos',
  'cart.unpurchasable.noPurchasableLines': 'No hay artículos comprables en el carrito.',
  'cart.delivery.banner': 'Entrega única en {days} días laborables.',
  'cart.quote.title': 'Solicitar presupuesto',
  'cart.quote.description': 'Envía una solicitud de presupuesto para los productos del carrito.',
  'cart.quote.stubMessage': 'El flujo de presupuesto estará disponible pronto. Inicia sesión para continuar.',
  'cart.quote.backToCart': 'Volver al carrito',
  'cart.quote.loginCta': 'Iniciar sesión',
  'cart.quote.loginRequired': 'Inicia sesión para solicitar un presupuesto.',
  'cart.quote.accountTitle': 'Cuenta para el presupuesto',
  'cart.quote.accountHint': 'Crea una cuenta o inicia sesión para enviar la solicitud. El carrito permanece vinculado a tu perfil.',
  'cart.quote.accountContinue': 'Continuar con el presupuesto',
  'cart.quote.reviewLines': 'Resumen de productos',
  'cart.quote.emptyCart': 'El carrito está vacío.',
  'cart.quote.notesLabel': 'Notas del presupuesto (opcional)',
  'cart.quote.notesPlaceholder': 'Ej. plazos, acabados, dirección de obra…',
  'cart.quote.submit': 'Enviar solicitud de presupuesto',
  'cart.quote.success': 'Solicitud enviada. Te contactaremos pronto.',
  'cart.quote.successPending': 'Sigue el estado del presupuesto en tu área de cuenta. Podrás pagar online cuando esté aprobado.',
  'cart.quote.frozenTitle': 'Presupuesto congelado',
  'cart.quote.frozenDescription': 'Líneas y precios bloqueados — sin recálculo automático.',
  'cart.quote.frozenNotice': 'Los precios mostrados son los del presupuesto en el momento de la solicitud.',
  'cart.quote.proceedCheckout': 'Ir al checkout',
  'cart.quote.checkoutStarted': 'Checkout iniciado con precios congelados.',
  'cart.quote.checkoutFailed': 'No se pudo iniciar el checkout.',
  'cart.quote.steps.navLabel': 'Pasos de solicitud de presupuesto',
  'cart.quote.steps.group.account': 'Cuenta',
  'cart.quote.steps.group.details': 'Detalles',
  'cart.quote.steps.pageTitle.account': 'Inicia sesión para solicitar presupuesto',
  'cart.quote.steps.pageTitle.accountConfirm': 'Confirma tu cuenta',
  'cart.quote.steps.pageTitle.details': 'Completa la solicitud',
  'cart.quote.steps.pageSubtitle.account': 'Crea una cuenta o inicia sesión: el carrito permanece vinculado a tu perfil.',
  'cart.quote.steps.pageSubtitle.details': 'Indica los datos de facturación y, si quieres, añade notas para el equipo comercial.',
  'cart.quote.estimateNotice': 'Los totales del resumen son estimaciones orientativas. Recibirás un presupuesto personalizado por email.',
  'cart.remove': 'Eliminar',
  'cart.empty.title': 'Tu carrito está vacío',
  'cart.empty.description': 'Añade productos de la tienda o vuelve a la página de inicio.',
  'cart.empty.browseCatalog': 'Explorar la tienda',
  'cart.empty.backHome': 'Volver al inicio',
  'cart.empty.popularCategories': 'Categorías populares',
  'cart.empty.featured': 'Productos destacados',
  'cart.toast.added': 'Añadido al carrito',
  'cart.toast.quantity': 'Cantidad:',
  'cart.toast.close': 'Cerrar notificación',
  'cart.toast.openCart': 'Abrir carrito',
  'cart.stock.outOfStock': 'Ya no disponible',
  'cart.stock.insufficient': 'Cantidad no disponible',
  'cart.reservationExpired.title': 'Carrito caducado',
  'cart.reservationExpired.description': 'La reserva ha caducado. Actualizamos disponibilidad y precios.',
  'cart.reservationExpired.dismiss': 'Entendido',
  'cart.freeShipping.progress': 'Progreso hacia envío gratuito',
  'cart.freeShipping.remaining': 'Añade {amount} para envío gratuito',
  'cart.freeShipping.unlocked': 'Envío gratuito',
  'cart.freeShipping.unlockedDetail': 'has alcanzado el umbral de {amount}. La entrega está incluida.',
  'cart.compatibility.title': '¿No estás seguro de la compatibilidad?',
  'cart.compatibility.description':
    'Envíanos una foto o el código del producto antiguo: verificamos driver, casquillo y potencia antes del pedido.',
  'cart.compatibility.cta': 'Solicitar verificación',
  'cart.pricelist.b2b': 'Tarifa B2B',
  'cart.pricelist.b2c': 'Tarifa B2C',
  'wishlist.title': 'Favoritos',
  'wishlist.descriptionGuest': 'Guarda los productos que te interesan. Inicia sesión para sincronizarlos en todos tus dispositivos.',
  'wishlist.descriptionAccount': 'Tus productos favoritos, listos para comprar.',
  'wishlist.addAllToCart': 'Añadir todo al carrito',
  'wishlist.emptyTitle': 'Lista vacía',
  'wishlist.emptyDescription': 'Añade productos a favoritos desde la tienda.',
  'wishlist.unavailableTitle': 'Algunos productos ya no están disponibles',
  'wishlist.unavailableDescription': 'Elimínalos de la lista o consulta variantes alternativas.',
  'wishlist.item.unavailable': 'Ya no disponible',
  'wishlist.item.notInCatalog': 'Producto ya no en la tienda',
  'wishlist.item.addToCart': 'Añadir al carrito',
  'wishlist.heart.add': 'Añadir a favoritos',
  'wishlist.heart.remove': 'Quitar de favoritos',
  'checkout.processing': 'Procesando…',
  'checkout.confirmOrder': 'Confirmar pedido',
  'checkout.payAmount': 'Pagar {amount}',
  'checkout.contactInfo': 'Información de contacto',
  'checkout.shippingAddress': 'Dirección de envío',
  'checkout.billingAddress': 'Dirección de facturación',
  'checkout.billingSameAsShipping': 'Igual que la dirección de envío',
  'checkout.continue': 'Continuar',
  'checkout.selectShipping': 'Selecciona un método de envío',
  'checkout.payment': 'Método de pago',
  'checkout.paymentNote': 'Pagos con tarjeta (Stripe), Apple Pay y Google Pay. Transferencia bancaria disponible.',
  'walletQuickPay.checkoutFallback': 'Apple Pay · Google Pay en el checkout',
  'walletQuickPay.openCheckout': 'Ir al checkout',
  'checkout.steps.title': 'Completa tu pedido',
  'checkout.steps.pageTitle.account': 'Inicia sesión o regístrate',
  'checkout.steps.pageTitle.accountConfirm': 'Tu cuenta',
  'checkout.steps.details': 'Detalles',
  'checkout.steps.payment': 'Pago',
  'checkout.steps.shipping': 'Envío',
  'checkout.stepProgress': 'Paso {current} de {total}',
  'checkout.summary.subtotal': 'Subtotal',
  'checkout.summary.tax': 'IVA',
  'checkout.summary.shipping': 'Envío',
  'checkout.summary.free': 'Gratis',
  'checkout.summary.total': 'Total',
  'checkout.backToCart': 'Volver al carrito',
  'checkout.shipping.title': 'Método de envío',
  'checkout.shipping.noMethods': 'No hay métodos disponibles para esta dirección.',
  'checkout.shipping.addressIncomplete': 'Completa la dirección para ver las opciones de envío.',
  'checkout.shipping.deliveryEstimate':
    'Entrega única estimada en {days} días laborables (plazo más largo del carrito).',
  'checkout.shipping.pickupRomeOnly': 'La recogida en tienda solo está disponible para clientes con sede en Roma.',
  'paymentResult.loading': 'Verificando pago…',
  'paymentResult.notFound': 'Pedido no encontrado',
  'paymentResult.fetchError': 'Error al recuperar el pedido',
  'paymentResult.syncNote': 'Sincronización con Odoo cuando esté configurado.',
  'paymentResult.orderPwa': 'Pedido PWA',
  'paymentResult.orderOdoo': 'Pedido Odoo',
  'paymentResult.paymentStatus': 'Estado del pago',
  'paymentResult.total': 'Total',
  'paymentResult.myOrders': 'Mis pedidos',
  'paymentResult.catalog': 'Tienda',
  'paymentResult.status.paid': 'Pago completado',
  'paymentResult.status.pending': 'Pago pendiente',
  'paymentResult.status.failed': 'Pago fallido',
  'thankYou.hero.confirmedEyebrow': 'PEDIDO CONFIRMADO',
  'thankYou.hero.pendingEyebrow': 'PEDIDO RECIBIDO',
  'thankYou.hero.failedEyebrow': 'PAGO FALLIDO',
  'thankYou.hero.confirmedTitle': '¡Gracias, {name}! Tu pedido está confirmado.',
  'thankYou.hero.confirmedTitleGeneric': '¡Gracias! Tu pedido está confirmado.',
  'thankYou.hero.pendingTitle': 'Pedido registrado, pendiente de pago',
  'thankYou.hero.failedTitle': 'No pudimos completar el pago',
  'thankYou.hero.emailPrefix': 'Hemos enviado la confirmación a',
  'thankYou.hero.confirmedBody': '. Lo preparamos de inmediato y te avisamos cuando salga.',
  'thankYou.hero.pendingBody': '. Completa el pago para iniciar la preparación.',
  'thankYou.hero.failedBody': 'Vuelve al checkout o elige otro método de pago.',
  'thankYou.hero.retryCheckout': 'Volver al checkout',
  'thankYou.hero.retryPayment': 'Reintentar pago',
  'thankYou.orderNumber': 'Número de pedido',
  'thankYou.estimatedDelivery': 'Entrega estimada',
  'thankYou.deliverySoon': 'En pocos días laborables',
  'thankYou.tracker.title': 'Estado del pedido',
  'thankYou.tracker.confirmed': 'Confirmado',
  'thankYou.tracker.preparing': 'En preparación',
  'thankYou.tracker.shipped': 'Enviado',
  'thankYou.tracker.delivered': 'Entregado',
  'thankYou.tracker.now': 'Ahora',
  'thankYou.tracker.today': 'Hoy',
  'thankYou.tracker.afterPayment': 'Tras el pago',
  'thankYou.tracker.trackingNote': 'Recibirás un enlace de seguimiento por email cuando el pedido salga.',
  'thankYou.tracker.pickupNote':
    'Te contactaremos para organizar la recogida o entrega una vez procesado el pedido.',
  'thankYou.tracker.trackCta': 'Seguir pedido',
  'thankYou.lines.title': 'Resumen de productos',
  'thankYou.lines.quantity': 'Cantidad {count}',
  'thankYou.support.title': '¿Dudas sobre el montaje?',
  'thankYou.support.body':
    'Nuestro showroom en Roma te ayuda con conexiones, compatibilidad e instalación. Escríbenos cuando quieras.',
  'thankYou.support.cta': 'Contactar un experto',
  'thankYou.summary.title': 'Detalles del pedido',
  'thankYou.summary.subtotal': 'Subtotal',
  'thankYou.summary.shipping': 'Envío',
  'thankYou.summary.total': 'Total',
  'thankYou.summary.vat': 'IVA excluida',
  'thankYou.summary.shipTo': 'Envío a',
  'thankYou.summary.payment': 'Pago',
  'thankYou.shippingFree': 'Gratis',
  'thankYou.account.title': 'Crear una cuenta',
  'thankYou.account.body': 'Guarda el pedido, sigue los envíos y repite pedidos en un clic.',
  'thankYou.account.cta': 'Crear cuenta con este email',
  'thankYou.crossSell.eyebrow': 'COMPLETA LA INSTALACIÓN',
  'thankYou.crossSell.title': 'Accesorios compatibles con tu pedido',
  'thankYou.crossSell.catalog': 'Ir a la tienda',
  'purchaseError.securePayment': 'Pago seguro · SSL',
  'purchaseError.supportPhone': 'Asistencia · (+39) 06 716 7111',
  'purchaseError.hero.title': 'No pudimos completar el pago.',
  'purchaseError.hero.bodyPrefix': 'No se ha cargado ningún importe y',
  'purchaseError.hero.bodyStrong': 'tu carrito está a salvo',
  'purchaseError.hero.bodySuffix':
    '. Puedes volver a intentarlo ahora o usar otro método de pago — solo lleva unos segundos.',
  'purchaseError.hero.retryPayment': 'Reintentar pago',
  'purchaseError.hero.changeMethod': 'Cambiar método',
  'purchaseError.attemptRef': 'Referencia del intento ·',
  'purchaseError.causes.title': 'Por qué puede haber ocurrido',
  'purchaseError.causes.intro': 'Casi siempre se resuelve al momento. Las causas más comunes:',
  'purchaseError.causes.card.title': 'Revisa los datos de la tarjeta',
  'purchaseError.causes.card.body':
    'Comprueba número, caducidad y CVC. Un error de tecleo es la causa más frecuente.',
  'purchaseError.causes.secure3ds.title': 'Autorización 3D Secure no completada',
  'purchaseError.causes.secure3ds.body':
    'El banco pudo haber pedido confirmación por app o SMS que no se completó.',
  'purchaseError.causes.limit.title': 'Límite o tope insuficiente',
  'purchaseError.causes.limit.body':
    'Verifica el límite de la tarjeta o prueba otro método abajo.',
  'purchaseError.methods.title': 'Prueba otro método',
  'purchaseError.methods.card': 'Otra tarjeta',
  'purchaseError.methods.paypal': 'PayPal',
  'purchaseError.methods.bankTransfer': 'Transferencia',
  'purchaseError.support.title': '¿Sigue sin funcionar?',
  'purchaseError.support.body':
    'Te ayudamos a completar el pedido por teléfono o email — o lo finalizamos por ti. Sin problemas de disponibilidad: reservamos los productos.',
  'purchaseError.support.cta': 'Contactar soporte',
  'purchaseError.cart.title': 'Tu carrito está a salvo',
  'purchaseError.cart.noCharge': 'Ningún importe cargado',
  'purchaseError.cart.reserved': 'Productos reservados para ti',
  'purchaseError.cart.ssl': 'Conexión SSL cifrada',
  'purchaseError.cart.backToShop': 'Volver a la tienda',
  'purchaseError.taxIncluded': 'IVA 22% incluida',
  'purchaseError.footer.company':
    'TLB Italy Srl · CIF IT17245551001 · Via Appia Pignatelli 450, Roma',
  'purchaseError.footer.help': '¿Necesitas ayuda?',
  'account.pricelist': 'Tarifa',
  'account.greeting.named': 'Hola, {name}',
  'account.greeting.default': 'Hola, bienvenido de nuevo',
  'account.overview.myOrders': 'Mis pedidos',
  'account.overview.editProfile': 'Editar perfil',
  'account.overview.recentOrders': 'Pedidos recientes',
  'account.overview.allOrders': 'Todos ({count})',
  'account.overview.noOrders': 'Aún no hay pedidos.',
  'account.overview.browseCatalog': 'Explorar la tienda',
  'account.overview.segmentB2b': '(B2B)',
  'account.overview.segmentB2c': '(B2C)',
  'account.overview.segmentProfessional': '(Professional)',
  'account.overview.accountType': 'Tipo de cuenta',
  'account.overview.recentQuotes': 'Presupuestos recientes',
  'account.overview.recentInvoices': 'Facturas recientes',
  'account.overview.viewAllQuotes': 'Todos los presupuestos',
  'account.overview.viewAllInvoices': 'Todas las facturas',
  'account.overview.noQuotes': 'Aún no hay presupuestos.',
  'account.overview.noInvoices': 'No hay facturas disponibles.',
  'account.overview.payableQuotesHint': '{count} presupuestos listos para pago online.',
  'account.overview.professionalActive': 'Condizioni professional attive',
  'account.nav.overview': 'Resumen',
  'account.nav.dashboard': 'Panel',
  'account.nav.profile': 'Perfil',
  'account.nav.orders': 'Mis pedidos',
  'account.nav.parts': 'Mis repuestos',
  'account.nav.addresses': 'Direcciones',
  'account.nav.payments': 'Pagos',
  'account.nav.data': 'Datos y contraseña',
  'account.nav.support': 'Asistencia',
  'account.nav.wishlist': 'Favoritos',
  'account.nav.quotes': 'Presupuestos',
  'account.nav.invoices': 'Facturas',
  'account.dashboard.totalOrders': 'Pedidos totales',
  'account.dashboard.inProgress': 'En curso',
  'account.dashboard.savedParts': 'Repuestos guardados',
  'account.dashboard.ongoingOrder': 'Pedido en curso',
  'account.dashboard.details': 'Detalles →',
  'account.dashboard.delivery': 'Entrega',
  'account.dashboard.deliverySoon': 'En pocos días',
  'account.dashboard.reorderParts': 'Reordena tus repuestos',
  'account.dashboard.reorderPartsBody':
    'Ya has comprado bombillas y drivers. Reordénalos con un clic desde tu lista de repuestos.',
  'account.dashboard.goToParts': 'Ir a repuestos',
  'account.dashboard.openQuotes': 'Presupuestos',
  'account.dashboard.invoices': 'Facturas',
  'account.parts.title': 'Mis repuestos',
  'account.parts.description': 'Productos técnicos que usas a menudo, listos para reordenar.',
  'account.parts.savedCount': '{count} productos guardados',
  'account.addresses.current': 'Dirección actual',
  'account.payments.title': 'Métodos de pago',
  'account.payments.current': 'Método preferido',
  'account.quotes.title': 'Tus presupuestos',
  'account.quotes.description': 'Solicitudes del carrito y presupuestos Odoo vinculados a tu cuenta.',
  'account.quotes.empty': 'No hay presupuestos disponibles.',
  'account.quotes.view': 'Abrir',
  'account.quotes.status.requested': 'Solicitado',
  'account.quotes.status.sent': 'Enviado',
  'account.quotes.status.checkout_started': 'Checkout iniciado',
  'account.quotes.status.converted': 'Convertido',
  'account.quotes.status.draft': 'Borrador',
  'account.quotes.status.cancelled': 'Cancelado',
  'account.quotes.badge.expired': 'Caducado',
  'account.quotes.badge.payable': 'Pagable online',
  'account.quotes.badge.pending': 'Pendiente de aprobación',
  'account.quotes.badge.preparing': 'En preparación',
  'account.quotes.message.expired': 'Este presupuesto ha caducado. Contáctanos para uno nuevo.',
  'account.quotes.message.notPayable': 'Este presupuesto aún no está aprobado para pago online.',
  'account.quotes.message.not_sent': 'Estamos preparando tu presupuesto. Te avisaremos cuando puedas pagar online.',
  'account.quotes.message.cancelled': 'Este presupuesto fue cancelado.',
  'account.quotes.message.converted': 'Este presupuesto ya se convirtió en pedido.',
  'account.quotes.message.draft': 'El presupuesto aún se está preparando.',
  'account.quotes.validUntil': 'Válido hasta',
  'account.quotes.linesTitle': 'Productos',
  'account.quotes.expiredContact': 'Solicitar actualización del presupuesto',
  'account.quotes.viewOrder': 'Ver pedido vinculado',
  'account.invoices.title': 'Tus facturas',
  'account.invoices.description': 'Facturas del ERP vinculadas a tu cuenta.',
  'account.invoices.empty': 'No hay facturas disponibles.',
  'account.invoices.loadError': 'No se pudieron cargar las facturas.',
  'account.invoices.download': 'Descargar PDF',
  'account.invoices.pdfPending': 'PDF en preparación',
  'account.invoices.pdfDownloadError': 'No se pudo descargar el PDF.',
  'account.invoices.portalLink': 'Abrir en portal',
  'account.profile.businessData': 'Datos empresariales',
  'account.profile.businessHint': 'Para facturación electrónica y condiciones B2B.',
  'account.overview.professionalCta': '¿Eres profesional? Activa condiciones dedicadas y tarifas reservadas.',
  'account.overview.professionalCtaLink': 'Solicitar cuenta professional',
  'account.overview.professionalPending': 'Tu solicitud de cuenta professional está en revisión. Te contactaremos en un plazo de 24 horas laborables.',
  'account.overview.professionalRejected': 'Tu solicitud de cuenta professional no fue aprobada. Puedes enviar una nueva desde la página de profesionales.',
  'account.shell.backToCatalog': 'Volver a la tienda',
  'account.shell.backToShop': 'Volver a la tienda',
  'account.shell.cart': 'Carrito',
  'account.shell.continueShopping': 'Seguir comprando',
  'account.shell.logout': 'Cerrar sesión',
  'account.shell.logoutShort': 'Salir',
  'account.shell.logoutConfirmTitle': '¿Cerrar sesión?',
  'account.shell.logoutConfirmDescription': 'Tendrás que iniciar sesión de nuevo para ver pedidos y perfil.',
  'account.profile.validationError': 'Completa todos los campos obligatorios.',
  'account.profile.personalData': 'Datos personales',
  'account.profile.emailReadonly': 'El correo no se puede modificar aquí.',
  'account.profile.preferredPayment': 'Método de pago preferido',
  'account.profile.preferredPaymentHint': 'Usaremos esta preferencia en el checkout cuando sea posible.',
  'account.profile.shippingAddress': 'Dirección de envío',
  'account.profile.save': 'Guardar cambios',
  'account.profile.odooSyncWarning':
    'Cambios guardados en tu cuenta, pero la sincronización con Odoo falló. Inténtalo más tarde o contáctanos si persiste.',
  'account.profile.saving': 'Guardando…',
  'account.section.orders.title': 'Tus pedidos',
  'account.section.orders.description': 'Historial de compras y estado de los pagos.',
  'account.section.profile.title': 'Perfil',
  'account.section.profile.description': 'Actualiza datos personales, dirección y pago preferido.',
  'account.section.overview.description': 'Gestiona pedidos, perfil y favoritos desde tu cuenta.',
  'account.meta.customer': 'Cliente',
  'account.meta.email': 'Correo electrónico',
  'account.meta.phone': 'Teléfono',
  'account.meta.shippingAddress': 'Dirección de envío',
  'account.meta.preferredPayment': 'Pago preferido',
  'account.meta.orders': 'Pedidos',
  'account.orders.emptyTitle': 'Sin pedidos',
  'account.orders.emptyDescription': 'Tus compras aparecerán aquí.',
  'account.orders.track': 'Seguir →',
  'account.orders.reorder': 'Reordenar',
  'account.orders.itemCount': '{count} artículos',
  'account.orders.table.order': 'Pedido',
  'account.orders.table.date': 'Fecha',
  'account.orders.table.total': 'Total',
  'account.orders.table.status': 'Estado',
  'account.orders.table.detail': 'Detalle',
  'account.orders.table.reorder': 'Repetir pedido',
  'account.orders.table.reordering': 'Repitiendo pedido…',
  'orders.detail.loading': 'Cargando pedido…',
  'orders.detail.back': 'Volver a pedidos',
  'orders.detail.reorder': 'Repetir pedido',
  'orders.detail.items': 'Artículos',
  'orders.detail.quantity': 'Cant. {count}',
  'orders.detail.orderStatus': 'Estado del pedido',
  'orders.detail.paymentStatus': 'Pago',
  'orders.detail.total': 'Total',
  'orders.detail.date': 'Fecha',
  'orders.detail.pwaRef': 'Ref. PWA',
  'orders.detail.completeOrder': 'Completa tu pedido',
  'orders.detail.invoicePortal': 'Factura y detalles disponibles en el portal Odoo.',
  'orders.reorder.success': 'Productos añadidos al carrito',
  'orders.reorder.error': 'No se pudo repetir el pedido',
  'impersonate.invalidLink': 'Enlace de suplantación no válido.',
  'impersonate.expiredLink': 'Enlace caducado o no válido. Solicita uno nuevo desde el backoffice.',
  'impersonate.loading': 'Iniciando sesión como cliente…',
  'breadcrumb.home': 'Inicio',
  'category.products': 'productos',
  'legal.terms': 'Términos',
  'legal.privacy': 'Privacidad',
  'paymentMethod.stripe': 'Tarjeta de crédito / débito',
  'paymentMethod.stripeDescription': 'Visa, Mastercard, Amex, Apple Pay y Google Pay',
  'paymentMethod.bankTransfer': 'Transferencia bancaria',
  'paymentMethod.bankTransferDescription': 'Confirma el pedido y recibe al instante IBAN y concepto de pago',
  'orderStatus.cart_created': 'Carrito creado',
  'orderStatus.checkout_started': 'Checkout iniciado',
  'orderStatus.payment_started': 'Pago iniciado',
  'orderStatus.payment_pending': 'Pago pendiente',
  'orderStatus.paid': 'Pagado',
  'orderStatus.paid_sync_pending': 'Pagado, sincronización pendiente',
  'orderStatus.synced': 'Confirmado',
  'orderStatus.payment_failed': 'Pago fallido',
  'orderStatus.abandoned': 'Abandonado',
  'orderStatus.cancelled': 'Cancelado',
  'orderStatus.confirmed': 'Confirmado',
  'orderStatus.completed': 'Completado',
  'paymentStatus.not_started': 'No iniciado',
  'paymentStatus.created': 'Creado',
  'paymentStatus.pending': 'Pendiente',
  'paymentStatus.captured': 'Pagado',
  'paymentStatus.failed': 'Fallido',
  'paymentStatus.cancelled': 'Cancelado',
  'paymentStatus.refunded': 'Reembolsado',
  'checkout.payment.orPayWithCard': 'O pagar con tarjeta',
  'checkout.payment.orderSr': 'Pedido {orderId}',
  'checkout.payment.prepareError': 'No se pudo preparar el pago.',
  'checkout.payment.failed': 'Pago no realizado',
  'checkout.payment.cardholderName': 'Nombre en la tarjeta',
  'checkout.payment.cardholderNamePlaceholder': 'Como figura en la tarjeta',
  'checkout.payment.cardholderNameRequired': 'Introduce el nombre del titular de la tarjeta.',
  'checkout.payment.formNotReady': 'El formulario de pago aún no está listo. Espera un momento e inténtalo de nuevo.',
  'checkout.payment.cardIncomplete': 'Completa los datos de la tarjeta antes de pagar.',
  'checkout.emailPlaceholder': 'email@ejemplo.com',
  'checkout.error.incompleteAddress':
    'Completa el email y la dirección de envío (y facturación si es distinta).',
  'checkout.error.generic': 'Error en el checkout',
  'checkout.error.missingOrder': 'Pedido de checkout no encontrado',
  'checkout.error.missingPayment': 'Pago no encontrado',
  'checkout.error.orderUnavailable': 'Pedido no disponible tras la confirmación',
  'checkout.error.alreadyPaid': 'Este pedido ya está pagado.',
  'checkout.shipping.eta': 'Entrega estimada ~{days} días laborables',
  'checkout.address.typeToSearch': 'Empieza a escribir la dirección…',
  'breadcrumb.nav': 'Ruta de navegación',
  'language.switcher.current': 'Idioma: {locale}. Cambiar idioma',
  'language.switcher.other': 'Otros idiomas',
  'theme.switcher.title': 'Tema clásico, negro u oscuro',
  'theme.switcher.toLight': 'Cambiar a tema negro',
  'theme.switcher.toDark': 'Cambiar a tema oscuro',
  'theme.switcher.toClassic': 'Cambiar a tema clásico (marrón)',
  'skeleton.loadingProducts': 'Cargando productos…',
  'skeleton.loadingCart': 'Cargando carrito…',
  'skeleton.loadingCartSummary': 'Cargando resumen del carrito…',
  'skeleton.loadingProduct': 'Cargando producto…',
  'skeleton.loadingCheckout': 'Cargando checkout…',
  'skeleton.loadingPageHeader': 'Cargando encabezado de página',
  'skeleton.loadingForm': 'Cargando formulario',
  'skeleton.loadingPaymentResult': 'Cargando resultado del pago',
  'skeleton.loadingCatalogFilters': 'Cargando filtros de la tienda',
  'skeleton.loadingAccount': 'Cargando área de cuenta',
  'skeleton.loadingList': 'Cargando lista…',
}

const FR: Record<MessageKey, string> = {
  ...EN,
  'brand.name': 'Idea di Luce',
  'common.loading': 'Chargement…',
  'common.loadingCatalog': 'Chargement de la boutique…',
  'common.confirm': 'Confirmer',
  'common.cancel': 'Annuler',
  'common.pleaseWait': 'Veuillez patienter…',
  'common.notAvailable': '—',
  'common.email': 'E-mail',
  'common.password': 'Mot de passe',
  'common.firstName': 'Prénom',
  'common.lastName': 'Nom',
  'common.phone': 'Téléphone',
  'common.quantity': 'Quantité',
  'common.remove': 'Supprimer',
  'common.all': 'Tous',
  'common.back': 'Retour',
  'common.save': 'Enregistrer',
  'common.saving': 'Enregistrement…',
  'common.close': 'Fermer',
  'common.menu': 'Menu',
  'nav.catalog': 'Boutique',
  'nav.cart': 'Panier',
  'nav.account': 'Compte',
  'nav.login': 'Connexion',
  'nav.register': "S'inscrire",
  'nav.wishlist': 'Favoris',
  'nav.checkout': 'Checkout',
  'nav.logout': 'Déconnexion',
  'footer.tagline': 'Idea di Luce · éclairage pour la maison et les professionnels',
  'error.genericTitle': 'Une erreur est survenue',
  'notFound.metaTitle': 'Page introuvable',
  'notFound.eyebrow': 'ERREUR 404',
  'notFound.title': 'Ici, la lumière s’est éteinte.',
  'notFound.description':
    'La page que vous cherchez a été déplacée, supprimée ou n’a jamais existé. Mais ne restez pas dans le noir : reprenons à partir d’ici.',
  'notFound.backHome': 'Retour à l’accueil',
  'notFound.exploreCatalog': 'Explorer la boutique',
  'notFound.searchPlaceholder': 'Rechercher par produit, culot, code ou marque',
  'notFound.searchCta': 'Rechercher',
  'notFound.assistenza': 'Assistance',
  'notFound.linkDesign': 'Éclairage décoratif',
  'notFound.linkTechnical': 'Produits techniques',
  'notFound.linkAttacco': 'Choisir par culot',
  'notFound.linkGuide': 'Guides',
  'notFound.linkProductNotFound': 'Produit introuvable ?',
  'notFound.footer': 'TLB Italy Srl · Via Appia Pignatelli 450, Rome · info@ideadiluce.com',
  'productNotFound.formTitle': 'Dites-nous ce que vous cherchez',
  'productNotFound.formDescription':
    'Plus vous nous donnez d\'informations, plus vite nous trouverons le bon produit.',
  'productNotFound.photoProduct': 'Photo du produit ou du culot',
  'productNotFound.photoProductHint': 'Déposez la photo du produit',
  'productNotFound.photoSocket': 'Photo du culot',
  'productNotFound.photoSocketHint': 'Photo du culot de près',
  'productNotFound.nameLabel': 'Nom et prénom',
  'productNotFound.namePlaceholder': 'Mario Rossi',
  'productNotFound.emailPlaceholder': 'mario@email.it',
  'productNotFound.phoneLabel': 'Téléphone / WhatsApp',
  'productNotFound.phonePlaceholder': '+39 ___ ___ ____',
  'productNotFound.codeLabel': 'Code / EAN / MPN',
  'productNotFound.codePlaceholder': 'ex. 8711500411990',
  'productNotFound.brandLabel': 'Marque (si connue)',
  'productNotFound.brandPlaceholder': 'Philips, Osram…',
  'productNotFound.usage': 'Usage',
  'productNotFound.usageHome': 'Maison',
  'productNotFound.usageShop': 'Commerce',
  'productNotFound.usageOffice': 'Bureau',
  'productNotFound.usageOutdoor': 'Extérieur',
  'productNotFound.usageInstall': 'Installation',
  'productNotFound.urgency': 'Urgence',
  'productNotFound.urgencyLow': 'Faible',
  'productNotFound.urgencyMedium': 'Moyenne',
  'productNotFound.urgencyHigh': 'Élevée',
  'productNotFound.messageLabel': 'Message',
  'productNotFound.messagePlaceholder': 'Décrivez le produit, où vous l\'utilisiez et ce dont vous avez besoin…',
  'productNotFound.submit': 'Envoyer la demande',
  'productNotFound.privacyNote': 'En envoyant, vous acceptez la',
  'productNotFound.privacyLink': 'Politique de confidentialité',
  'productNotFound.responseNote': 'Nous répondons par e-mail ou WhatsApp, généralement dans la journée.',
  'productNotFound.success': 'Demande envoyée. Nous vous répondrons bientôt.',
  'productNotFound.error': 'Échec de l\'envoi',
  'productNotFound.stepsTitle': 'Comment ça marche',
  'productNotFound.preferTalk': 'VOUS PRÉFÉREZ EN PARLER ?',
  'productNotFound.whatsapp': 'Écrivez-nous sur WhatsApp',
  'productNotFound.professionalsTitle': 'Aussi pour les professionnels',
  'productNotFound.professionalsBody':
    'Listes longues ou réassorts récurrents ? Envoyez-nous un fichier de codes : nous préparons un devis unique.',
  'productNotFound.professionalsCta': 'Espace professionnels',
  'productNotFound.showroomTitle': 'Showroom de Rome',
  'productNotFound.showroomBody':
    'Via Appia Pignatelli 450 · Lun–Ven 9–13 / 15–18. Apportez la pièce : nous l\'identifions sur place.',
  'productNotFound.showroomCta': 'Découvrir le showroom',
  'auth.sessionChecking': 'Vérification de la session…',
  'auth.redirectingToLogin': 'Redirection vers la connexion…',
  'auth.loggingIn': 'Connexion…',
  'auth.loggedIn': 'Connexion réussie.',
  'auth.loggedOut': 'Vous êtes déconnecté.',
  'auth.loggedOutLocalOnly':
    'Session locale fermée. En cas de problème, actualisez la page ou réessayez.',
  'auth.loginSubmit': 'Se connecter',
  'auth.registerSubmit': "S'inscrire",
  'auth.registering': 'Inscription…',
  'auth.noAccount': "Vous n'avez pas de compte ?",
  'auth.hasAccount': 'Vous avez déjà un compte ?',
  'auth.firstNamePlaceholder': 'Jean',
  'auth.lastNamePlaceholder': 'Dupont',
  'auth.emailPlaceholder': 'nom@email.com',
  'home.title': 'Idea di Luce',
  'home.subtitle': 'Éclairage pour la maison et les professionnels',
  'home.metaDescription': 'La luce pensata. Éclairage pour la maison et les professionnels.',
  'home.featuredTitle': 'Produits en vedette',
  'home.featuredDescription': 'Une sélection de notre boutique disponible.',
  'home.goToCatalog': 'Aller à la boutique',
  'home.viewAll': 'Voir tous les produits',
  'home.categories': 'Catégories',
  'catalog.title': 'Boutique',
  'catalog.description': 'Recherchez des produits, filtrez par catégorie et triez les résultats.',
  'catalog.metaDescription': 'Boutique d\'éclairage — lampes, appliques et solutions pour la maison et les professionnels.',
  'catalog.search': 'Rechercher des produits',
  'catalog.searchLabel': 'Rechercher dans la boutique',
  'catalog.searchPlaceholder': 'Saisissez au moins 3 caractères…',
  'catalog.clearSearch': 'Effacer la recherche',
  'catalog.noSuggestions': 'Aucune suggestion dans les produits chargés.',
  'catalog.suggestGroupAttacchi': 'Culots',
  'catalog.suggestGroupBrands': 'Marques',
  'catalog.suggestGroupCategories': 'Catégories',
  'catalog.suggestGroupProducts': 'Produits',
  'catalog.suggestGroupHints': 'Suggestions',
  'catalog.suggestGroupQueries': 'Recherches',
  'catalog.searchRecentLabel': 'Recherches récentes',
  'catalog.searchEmptyTitle': 'Aucun résultat',
  'catalog.searchEmptyDescription': 'Essayez un autre terme, un culot ou une marque.',
  'catalog.searchViewAllResults': 'Voir les {count} résultats',
  'catalog.searchViewAllResultsNoCount': 'Voir tous les résultats',
  'catalog.searchKeyboardNavigate': 'Naviguer',
  'catalog.searchKeyboardSelect': 'Sélectionner',
  'catalog.searchKeyboardClose': 'Fermer',
  'catalog.searchShortcutHint': 'Appuyez sur {shortcut} pour ouvrir la recherche',
  'catalog.searchPopularLabel': 'Recherches populaires',
  'catalog.searchClearRecent': 'Effacer',
  'header.openSearch': 'Ouvrir la recherche boutique',
  'catalog.inStock': 'En stock uniquement',
  'catalog.inStockHint': 'Afficher uniquement les produits disponibles en entrepôt.',
  'catalog.sort': 'Trier',
  'catalog.sortRelevance': 'Pertinence',
  'catalog.sortPriceAsc': 'Prix croissant',
  'catalog.sortPriceDesc': 'Prix décroissant',
  'catalog.sortName': 'Nom A–Z',
  'catalog.minPrice': 'Prix min (€)',
  'catalog.maxPrice': 'Prix max (€)',
  'catalog.categoryLabel': 'Catégorie',
  'catalog.allCategories': 'Toutes les catégories',
  'catalog.clearCategory': 'Effacer la catégorie',
  'catalog.hideCategories': 'Masquer les catégories',
  'catalog.chooseCategory': 'Choisir une catégorie ({count})',
  'catalog.searchCategoryPlaceholder': 'Rechercher une catégorie…',
  'catalog.noCategoryFound': 'Aucune catégorie trouvée.',
  'catalog.showingCount': '{shown} sur {total} produits affichés',
  'catalog.inStockSuffix': ' disponibles',
  'catalog.forQuery': ' pour « {query} »',
  'catalog.seenAll': 'Vous avez vu tous les produits.',
  'catalog.emptyTitle': 'Aucun produit',
  'catalog.emptyDescription': 'Essayez un autre filtre.',
  'category.loading': 'Chargement…',
  'category.empty': 'Aucun produit dans cette catégorie.',
  'category.backToCatalog': '← {catalog}',
  'product.notAvailable': 'Produit indisponible',
  'product.backToCatalog': 'Retour à la boutique',
  'product.sectionDescription': 'Description du produit',
  'product.sectionSpecs': 'Caractéristiques techniques',
  'product.sectionActivity': 'Activité récente',
  'product.additionalInfo': 'Informations complémentaires',
  'product.addToCart': 'Ajouter au panier',
  'product.addToCartShort': 'Ajouter',
  'product.addingToCart': 'Ajout en cours…',
  'product.requestProduct': 'Demander le produit',
  'product.availability.available': 'Disponible',
  'product.availability.orderable': 'Commandable',
  'product.availability.outOfStock': 'Rupture de stock',
  'product.availability.shippedInDays': 'Expédié sous {days} jours ouvrés',
  'product.availability.shippedByDate': 'Expédition estimée avant le {date}',
  'product.availability.orderableFallback':
    'Commandable — expédition estimée sous 10 jours ouvrés',
  'product.availability.lowStock': 'Plus que {count} disponibles',
  'product.outOfStock': 'Rupture de stock',
  'product.unavailable': 'Indisponible',
  'product.available': 'Disponible',
  'product.lowStock': 'Plus que {count} disponibles',
  'product.relatedTitle': 'Vous pourriez aussi aimer…',
  'product.grid.empty': 'Aucun produit dans la liste.',
  'product.card.noImage': 'Pas d\'image',
  'product.quantityLabel': 'Quantité',
  'product.variantLabel': 'Variante',
  'product.variantSoldOut': 'Épuisé',
  'login.title': 'Connexion',
  'login.welcomeTitle': 'Bon retour',
  'login.subtitle': 'Connectez-vous à votre compte IdeaDiLuce.',
  'login.forgot': 'Mot de passe oublié ?',
  'login.rememberMe': 'Se souvenir de moi sur cet appareil',
  'login.passwordPlaceholder': '••••••••',
  'login.showPassword': 'Afficher le mot de passe',
  'login.hidePassword': 'Masquer le mot de passe',
  'login.professionalPrompt': 'Vous êtes un professionnel ?',
  'login.professionalCta': 'Accéder à l’espace B2B',
  'register.title': 'Créer un compte',
  'register.subtitle': 'Créez votre compte IdeaDiLuce.',
  'register.business': 'Compte professionnel (tarif B2B)',
  'register.passwordHint': 'Mot de passe (min. 8 caractères)',
  'register.passwordPlaceholder': 'Min. 8 caractères',
  'forgot.title': 'Récupération du mot de passe',
  'forgot.subtitle': 'Nous vous enverrons un lien pour réinitialiser votre mot de passe.',
  'forgot.submit': 'Envoyer le lien',
  'forgot.error': 'Impossible d\'envoyer le lien. Veuillez réessayer.',
  'forgot.sentMessage': 'Si l\'e-mail est enregistré, vous recevrez un lien pour réinitialiser votre mot de passe.',
  'reset.title': 'Nouveau mot de passe',
  'reset.submit': 'Enregistrer le mot de passe',
  'reset.invalidLink': 'Lien non valide.',
  'reset.expiredLink': 'Lien expiré ou non valide. Demandez un nouveau lien.',
  'reset.passwordLabel': 'Nouveau mot de passe (min. 8 caractères)',
  'reset.requestNewLink': 'Demander un nouveau lien',
  'reset.odooDelegated':
    'La réinitialisation du mot de passe se fait via le lien reçu par e-mail. Ouvrez ce lien, définissez votre nouveau mot de passe, puis connectez-vous au site.',
  'cart.title': 'Panier',
  'cart.pageTitle': 'Votre panier',
  'cart.description': 'Vérifiez les articles, mettez à jour les quantités et passez au checkout.',
  'cart.clear': 'Vider le panier',
  'cart.continueShopping': 'Continuer vos achats',
  'cart.itemCountOne': '{count} article',
  'cart.itemCountMany': '{count} articles',
  'cart.variant': 'Variante :',
  'cart.perUnit': 'l\'unité',
  'cart.line.availableFast': 'Disponible · expédié sous 24/48h',
  'cart.line.availableLead': 'Disponible · expédié sous {days} jours ouvrés',
  'cart.line.lowStock': 'Dernières unités · {qty} disponibles',
  'cart.line.orderable': 'Commandable — délai de livraison à confirmer',
  'cart.line.unavailable': 'Indisponible',
  'cart.recommendationsTitle': 'Souvent achetés ensemble',
  'cart.recommendationsDescription': 'Compatibles avec les produits du panier.',
  'cart.recommendationsLoading': 'Chargement des suggestions…',
  'cart.recommendationsEmpty': 'Aucun complément recommandé pour ces produits.',
  'cart.summary.title': 'Récapitulatif',
  'cart.summary.subtotal': 'Sous-total (est.)',
  'cart.summary.tax': 'TVA (est.)',
  'cart.summary.shipping': 'Livraison',
  'cart.summary.shippingFree': 'Gratuite',
  'cart.summary.total': 'Total',
  'cart.summary.taxIncluded': 'TVA {rate}% incluse · {amount}',
  'cart.summary.securePayment': 'Paiement sécurisé · retour sous 50 jours',
  'cart.summary.estimatesDisclaimer': 'Taxes et livraison recalculées au checkout.',
  'cart.checkoutCta': 'Aller au checkout',
  'cart.quoteCta': 'Demander un devis',
  'cart.priceUpdated': 'Prix mis à jour',
  'cart.professional.badge': 'Conditions professional actives',
  'cart.professional.banner': 'Vous consultez des prix et conditions réservés aux professionnels.',
  'cart.unpurchasable.badge': 'Plus disponible',
  'cart.unpurchasable.limitedBadge': 'Disponibilité limitée',
  'cart.unpurchasable.blockedCheckout': 'Retirez ou déplacez vers les favoris les produits indisponibles pour continuer.',
  'cart.unpurchasable.moveToWishlist': 'Déplacer vers les favoris',
  'cart.unpurchasable.noPurchasableLines': 'Aucun article achetable dans le panier.',
  'cart.delivery.banner': 'Livraison unique sous {days} jours ouvrés.',
  'cart.quote.title': 'Demander un devis',
  'cart.quote.description': 'Envoyez une demande de devis pour les produits du panier.',
  'cart.quote.stubMessage': 'Le parcours devis sera bientôt disponible. Connectez-vous pour continuer.',
  'cart.quote.backToCart': 'Retour au panier',
  'cart.quote.loginCta': 'Se connecter',
  'cart.quote.loginRequired': 'Connectez-vous pour demander un devis.',
  'cart.quote.accountTitle': 'Compte pour le devis',
  'cart.quote.accountHint': 'Créez un compte ou connectez-vous pour envoyer la demande. Le panier reste lié à votre profil.',
  'cart.quote.accountContinue': 'Continuer vers le devis',
  'cart.quote.reviewLines': 'Récapitulatif produits',
  'cart.quote.emptyCart': 'Le panier est vide.',
  'cart.quote.notesLabel': 'Notes devis (optionnel)',
  'cart.quote.notesPlaceholder': 'Ex. délais, finitions, adresse chantier…',
  'cart.quote.submit': 'Envoyer la demande de devis',
  'cart.quote.success': 'Demande envoyée. Nous vous contacterons bientôt.',
  'cart.quote.successPending': 'Suivez votre devis dans votre espace compte. Vous pourrez payer en ligne une fois approuvé.',
  'cart.quote.frozenTitle': 'Devis gelé',
  'cart.quote.frozenDescription': 'Lignes et prix verrouillés — pas de recalcul automatique.',
  'cart.quote.frozenNotice': 'Les prix affichés sont ceux du devis au moment de la demande.',
  'cart.quote.proceedCheckout': 'Passer au checkout',
  'cart.quote.checkoutStarted': 'Checkout démarré avec prix gelés.',
  'cart.quote.checkoutFailed': 'Impossible de démarrer le checkout.',
  'cart.quote.steps.navLabel': 'Étapes de demande de devis',
  'cart.quote.steps.group.account': 'Compte',
  'cart.quote.steps.group.details': 'Détails',
  'cart.quote.steps.pageTitle.account': 'Connectez-vous pour demander un devis',
  'cart.quote.steps.pageTitle.accountConfirm': 'Confirmez votre compte',
  'cart.quote.steps.pageTitle.details': 'Finalisez votre demande',
  'cart.quote.steps.pageSubtitle.account': 'Créez un compte ou connectez-vous — votre panier reste lié à votre profil.',
  'cart.quote.steps.pageSubtitle.details': 'Indiquez vos coordonnées de facturation et, si besoin, des notes pour l’équipe commerciale.',
  'cart.quote.estimateNotice': 'Les totaux du récapitulatif sont des estimations indicatives. Vous recevrez un devis personnalisé par e-mail.',
  'cart.remove': 'Supprimer',
  'cart.empty.title': 'Votre panier est vide',
  'cart.empty.description': 'Ajoutez des produits depuis la boutique ou retournez à l\'accueil.',
  'cart.empty.browseCatalog': 'Parcourir la boutique',
  'cart.empty.backHome': 'Retour à l\'accueil',
  'cart.empty.popularCategories': 'Catégories populaires',
  'cart.empty.featured': 'Produits en vedette',
  'cart.toast.added': 'Ajouté au panier',
  'cart.toast.quantity': 'Quantité :',
  'cart.toast.close': 'Fermer la notification',
  'cart.toast.openCart': 'Ouvrir le panier',
  'cart.stock.outOfStock': 'Plus disponible',
  'cart.stock.insufficient': 'Quantité non disponible',
  'cart.reservationExpired.title': 'Panier expiré',
  'cart.reservationExpired.description': 'La réservation a expiré. Nous mettons à jour les disponibilités et les prix.',
  'cart.reservationExpired.dismiss': 'Compris',
  'cart.freeShipping.progress': 'Progression vers la livraison gratuite',
  'cart.freeShipping.remaining': 'Ajoutez {amount} pour la livraison gratuite',
  'cart.freeShipping.unlocked': 'Livraison gratuite',
  'cart.freeShipping.unlockedDetail': 'vous avez atteint le seuil de {amount}. La livraison est incluse.',
  'cart.compatibility.title': 'Pas sûr de la compatibilité ?',
  'cart.compatibility.description':
    'Envoyez-nous une photo ou le code de l\'ancien produit : nous vérifions driver, culot et puissance avant la commande.',
  'cart.compatibility.cta': 'Demander une vérification',
  'cart.pricelist.b2b': 'Tarif B2B',
  'cart.pricelist.b2c': 'Tarif B2C',
  'wishlist.title': 'Favoris',
  'wishlist.descriptionGuest': 'Enregistrez les produits qui vous intéressent. Connectez-vous pour les synchroniser sur tous vos appareils.',
  'wishlist.descriptionAccount': 'Vos produits favoris, prêts à l\'achat.',
  'wishlist.addAllToCart': 'Tout ajouter au panier',
  'wishlist.emptyTitle': 'Liste vide',
  'wishlist.emptyDescription': 'Ajoutez des produits aux favoris depuis la boutique.',
  'wishlist.unavailableTitle': 'Certains produits ne sont plus disponibles',
  'wishlist.unavailableDescription': 'Retirez-les de la liste ou consultez d\'autres variantes.',
  'wishlist.item.unavailable': 'Plus disponible',
  'wishlist.item.notInCatalog': 'Produit retiré de la boutique',
  'wishlist.item.addToCart': 'Ajouter au panier',
  'wishlist.heart.add': 'Ajouter aux favoris',
  'wishlist.heart.remove': 'Retirer des favoris',
  'checkout.processing': 'Traitement…',
  'checkout.confirmOrder': 'Confirmer la commande',
  'checkout.payAmount': 'Payer {amount}',
  'checkout.contactInfo': 'Coordonnées',
  'checkout.shippingAddress': 'Adresse de livraison',
  'checkout.billingAddress': 'Adresse de facturation',
  'checkout.billingSameAsShipping': 'Identique à l\'adresse de livraison',
  'checkout.continue': 'Continuer',
  'checkout.selectShipping': 'Sélectionnez un mode de livraison',
  'checkout.payment': 'Mode de paiement',
  'checkout.paymentNote': 'Paiements par carte (Stripe), Apple Pay et Google Pay. Virement bancaire disponible.',
  'walletQuickPay.checkoutFallback': 'Apple Pay · Google Pay au checkout',
  'walletQuickPay.openCheckout': 'Aller au checkout',
  'checkout.steps.title': 'Finalisez votre commande',
  'checkout.steps.pageTitle.account': 'Connectez-vous ou inscrivez-vous',
  'checkout.steps.pageTitle.accountConfirm': 'Votre compte',
  'checkout.steps.details': 'Détails',
  'checkout.steps.payment': 'Paiement',
  'checkout.steps.shipping': 'Livraison',
  'checkout.stepProgress': 'Étape {current} sur {total}',
  'checkout.summary.subtotal': 'Sous-total',
  'checkout.summary.tax': 'TVA',
  'checkout.summary.shipping': 'Livraison',
  'checkout.summary.free': 'Gratuit',
  'checkout.summary.total': 'Total',
  'checkout.backToCart': 'Retour au panier',
  'checkout.shipping.title': 'Mode de livraison',
  'checkout.shipping.noMethods': 'Aucun mode disponible pour cette adresse.',
  'checkout.shipping.addressIncomplete': 'Complétez l\'adresse pour voir les options de livraison.',
  'checkout.shipping.deliveryEstimate':
    'Livraison unique estimée sous {days} jours ouvrés (délai le plus long du panier).',
  'checkout.shipping.pickupRomeOnly':
    'Le retrait en magasin est réservé aux clients domiciliés à Rome.',
  'paymentResult.loading': 'Vérification du paiement…',
  'paymentResult.notFound': 'Commande introuvable',
  'paymentResult.fetchError': 'Erreur lors de la récupération de la commande',
  'paymentResult.syncNote': 'Synchronisation avec Odoo lorsque configurée.',
  'paymentResult.orderPwa': 'Commande PWA',
  'paymentResult.orderOdoo': 'Commande Odoo',
  'paymentResult.paymentStatus': 'Statut du paiement',
  'paymentResult.total': 'Total',
  'paymentResult.myOrders': 'Mes commandes',
  'paymentResult.catalog': 'Boutique',
  'paymentResult.status.paid': 'Paiement effectué',
  'paymentResult.status.pending': 'Paiement en attente',
  'paymentResult.status.failed': 'Paiement échoué',
  'thankYou.hero.confirmedEyebrow': 'COMMANDE CONFIRMÉE',
  'thankYou.hero.pendingEyebrow': 'COMMANDE REÇUE',
  'thankYou.hero.failedEyebrow': 'PAIEMENT ÉCHOUÉ',
  'thankYou.hero.confirmedTitle': 'Merci {name} ! Votre commande est confirmée.',
  'thankYou.hero.confirmedTitleGeneric': 'Merci ! Votre commande est confirmée.',
  'thankYou.hero.pendingTitle': 'Commande enregistrée, paiement en attente',
  'thankYou.hero.failedTitle': 'Nous n’avons pas pu finaliser le paiement',
  'thankYou.hero.emailPrefix': 'Nous avons envoyé la confirmation à',
  'thankYou.hero.confirmedBody': '. Nous la préparons et vous préviendrons dès l’expédition.',
  'thankYou.hero.pendingBody': '. Finalisez le paiement pour lancer la préparation.',
  'thankYou.hero.failedBody': 'Réessayez le checkout ou choisissez un autre moyen de paiement.',
  'thankYou.hero.retryCheckout': 'Retour au checkout',
  'thankYou.hero.retryPayment': 'Réessayer le paiement',
  'thankYou.orderNumber': 'Numéro de commande',
  'thankYou.estimatedDelivery': 'Livraison estimée',
  'thankYou.deliverySoon': 'Sous quelques jours ouvrés',
  'thankYou.tracker.title': 'Statut de la commande',
  'thankYou.tracker.confirmed': 'Confirmée',
  'thankYou.tracker.preparing': 'En préparation',
  'thankYou.tracker.shipped': 'Expédiée',
  'thankYou.tracker.delivered': 'Livrée',
  'thankYou.tracker.now': 'Maintenant',
  'thankYou.tracker.today': "Aujourd'hui",
  'thankYou.tracker.afterPayment': 'Après paiement',
  'thankYou.tracker.trackingNote': 'Vous recevrez un lien de suivi par email dès l’expédition.',
  'thankYou.tracker.pickupNote':
    'Nous vous contacterons pour organiser le retrait ou la livraison une fois la commande traitée.',
  'thankYou.tracker.trackCta': 'Suivre la commande',
  'thankYou.lines.title': 'Récapitulatif produits',
  'thankYou.lines.quantity': 'Quantité {count}',
  'thankYou.support.title': 'Une question sur le montage ?',
  'thankYou.support.body':
    'Notre showroom à Rome vous aide sur câblage, compatibilité et installation. Contactez-nous à tout moment.',
  'thankYou.support.cta': 'Contacter un expert',
  'thankYou.summary.title': 'Détails commande',
  'thankYou.summary.subtotal': 'Sous-total',
  'thankYou.summary.shipping': 'Livraison',
  'thankYou.summary.total': 'Total',
  'thankYou.summary.vat': 'TVA exclue',
  'thankYou.summary.shipTo': 'Livraison à',
  'thankYou.summary.payment': 'Paiement',
  'thankYou.shippingFree': 'Gratuit',
  'thankYou.account.title': 'Créer un compte',
  'thankYou.account.body': 'Enregistrez la commande, suivez les livraisons et recommandez en un clic.',
  'thankYou.account.cta': 'Créer un compte avec cet email',
  'thankYou.crossSell.eyebrow': 'COMPLÉTEZ L’INSTALLATION',
  'thankYou.crossSell.title': 'Accessoires compatibles avec votre commande',
  'thankYou.crossSell.catalog': 'Aller à la boutique',
  'purchaseError.securePayment': 'Paiement sécurisé · SSL',
  'purchaseError.supportPhone': 'Assistance · (+39) 06 716 7111',
  'purchaseError.hero.title': 'Nous n’avons pas pu finaliser le paiement.',
  'purchaseError.hero.bodyPrefix': 'Aucun montant n’a été débité et',
  'purchaseError.hero.bodyStrong': 'votre panier est en sécurité',
  'purchaseError.hero.bodySuffix':
    '. Vous pouvez réessayer maintenant ou utiliser un autre moyen de paiement — cela ne prend que quelques secondes.',
  'purchaseError.hero.retryPayment': 'Réessayer le paiement',
  'purchaseError.hero.changeMethod': 'Changer de méthode',
  'purchaseError.attemptRef': 'Référence de la tentative ·',
  'purchaseError.causes.title': 'Pourquoi cela a pu arriver',
  'purchaseError.causes.intro': 'Cela se règle presque toujours rapidement. Les causes les plus courantes :',
  'purchaseError.causes.card.title': 'Vérifier les données de la carte',
  'purchaseError.causes.card.body':
    'Contrôlez le numéro, la date d’expiration et le CVC. Une faute de frappe est la cause la plus fréquente.',
  'purchaseError.causes.secure3ds.title': 'Autorisation 3D Secure non terminée',
  'purchaseError.causes.secure3ds.body':
    'La banque a peut-être demandé une confirmation par app ou SMS qui n’a pas abouti.',
  'purchaseError.causes.limit.title': 'Plafond ou limite insuffisant',
  'purchaseError.causes.limit.body':
    'Vérifiez le plafond de la carte ou essayez une autre méthode ci-dessous.',
  'purchaseError.methods.title': 'Essayer une autre méthode',
  'purchaseError.methods.card': 'Autre carte',
  'purchaseError.methods.paypal': 'PayPal',
  'purchaseError.methods.bankTransfer': 'Virement',
  'purchaseError.support.title': 'Ça ne fonctionne toujours pas ?',
  'purchaseError.support.body':
    'Nous vous aidons à finaliser la commande par téléphone ou email — ou nous la finalisons pour vous. Pas de souci de disponibilité : nous gardons les produits de côté.',
  'purchaseError.support.cta': 'Contacter le support',
  'purchaseError.cart.title': 'Votre panier est en sécurité',
  'purchaseError.cart.noCharge': 'Aucun montant débité',
  'purchaseError.cart.reserved': 'Produits mis de côté pour vous',
  'purchaseError.cart.ssl': 'Connexion SSL chiffrée',
  'purchaseError.cart.backToShop': 'Retour à la boutique',
  'purchaseError.taxIncluded': 'TVA 22 % incluse',
  'purchaseError.footer.company':
    'TLB Italy Srl · TVA IT17245551001 · Via Appia Pignatelli 450, Rome',
  'purchaseError.footer.help': 'Besoin d’aide ?',
  'account.pricelist': 'Tarif',
  'account.greeting.named': 'Bonjour, {name}',
  'account.greeting.default': 'Bonjour, ravi de vous revoir',
  'account.overview.myOrders': 'Mes commandes',
  'account.overview.editProfile': 'Modifier le profil',
  'account.overview.recentOrders': 'Commandes récentes',
  'account.overview.allOrders': 'Toutes ({count})',
  'account.overview.noOrders': 'Aucune commande pour le moment.',
  'account.overview.browseCatalog': 'Parcourir la boutique',
  'account.overview.segmentB2b': '(B2B)',
  'account.overview.segmentB2c': '(B2C)',
  'account.overview.segmentProfessional': '(Professional)',
  'account.overview.accountType': 'Type de compte',
  'account.overview.recentQuotes': 'Devis récents',
  'account.overview.recentInvoices': 'Factures récentes',
  'account.overview.viewAllQuotes': 'Tous les devis',
  'account.overview.viewAllInvoices': 'Toutes les factures',
  'account.overview.noQuotes': 'Aucun devis pour le moment.',
  'account.overview.noInvoices': 'Aucune facture disponible.',
  'account.overview.payableQuotesHint': '{count} devis prêts pour le paiement en ligne.',
  'account.overview.professionalActive': 'Condizioni professional attive',
  'account.nav.overview': 'Aperçu',
  'account.nav.dashboard': 'Tableau de bord',
  'account.nav.profile': 'Profil',
  'account.nav.orders': 'Mes commandes',
  'account.nav.parts': 'Mes pièces détachées',
  'account.nav.addresses': 'Adresses',
  'account.nav.payments': 'Paiements',
  'account.nav.data': 'Données et mot de passe',
  'account.nav.support': 'Assistance',
  'account.nav.wishlist': 'Favoris',
  'account.nav.quotes': 'Devis',
  'account.nav.invoices': 'Factures',
  'account.dashboard.totalOrders': 'Commandes totales',
  'account.dashboard.inProgress': 'En cours',
  'account.dashboard.savedParts': 'Pièces enregistrées',
  'account.dashboard.ongoingOrder': 'Commande en cours',
  'account.dashboard.details': 'Détails →',
  'account.dashboard.delivery': 'Livraison',
  'account.dashboard.deliverySoon': 'Sous quelques jours',
  'account.dashboard.reorderParts': 'Recommandez vos pièces détachées',
  'account.dashboard.reorderPartsBody':
    'Vous avez déjà acheté ampoules et drivers. Recommandez-les en un clic depuis votre liste.',
  'account.dashboard.goToParts': 'Voir les pièces',
  'account.dashboard.openQuotes': 'Devis',
  'account.dashboard.invoices': 'Factures',
  'account.parts.title': 'Mes pièces détachées',
  'account.parts.description':
    'Les produits techniques que vous utilisez le plus, prêts à être recommandés.',
  'account.parts.savedCount': '{count} produits enregistrés',
  'account.addresses.current': 'Adresse actuelle',
  'account.payments.title': 'Moyens de paiement',
  'account.payments.current': 'Méthode préférée',
  'account.quotes.title': 'Vos devis',
  'account.quotes.description': 'Demandes panier et devis Odoo liés à votre compte.',
  'account.quotes.empty': 'Aucun devis disponible.',
  'account.quotes.view': 'Ouvrir',
  'account.quotes.status.requested': 'Demandé',
  'account.quotes.status.sent': 'Envoyé',
  'account.quotes.status.checkout_started': 'Checkout démarré',
  'account.quotes.status.converted': 'Converti',
  'account.quotes.status.draft': 'Brouillon',
  'account.quotes.status.cancelled': 'Annulé',
  'account.quotes.badge.expired': 'Expiré',
  'account.quotes.badge.payable': 'Payable en ligne',
  'account.quotes.badge.pending': 'En attente d\'approbation',
  'account.quotes.badge.preparing': 'En préparation',
  'account.quotes.message.expired': 'Ce devis a expiré. Contactez-nous pour un nouveau devis.',
  'account.quotes.message.notPayable': 'Ce devis n\'est pas encore approuvé pour le paiement en ligne.',
  'account.quotes.message.not_sent': 'Nous préparons votre devis. Nous vous préviendrons quand vous pourrez payer en ligne.',
  'account.quotes.message.cancelled': 'Ce devis a été annulé.',
  'account.quotes.message.converted': 'Ce devis a déjà été converti en commande.',
  'account.quotes.message.draft': 'Le devis est encore en préparation.',
  'account.quotes.validUntil': 'Valable jusqu\'au',
  'account.quotes.linesTitle': 'Produits',
  'account.quotes.expiredContact': 'Demander une mise à jour du devis',
  'account.quotes.viewOrder': 'Voir la commande liée',
  'account.invoices.title': 'Vos factures',
  'account.invoices.description': 'Factures ERP liées à votre compte.',
  'account.invoices.empty': 'Aucune facture disponible.',
  'account.invoices.loadError': 'Impossible de charger les factures.',
  'account.invoices.download': 'Télécharger le PDF',
  'account.invoices.pdfPending': 'PDF en cours',
  'account.invoices.pdfDownloadError': 'Impossible de télécharger le PDF.',
  'account.invoices.portalLink': 'Ouvrir sur le portail',
  'account.profile.businessData': 'Données entreprise',
  'account.profile.businessHint': 'Pour facturation électronique et conditions B2B.',
  'account.overview.professionalCta': 'Vous êtes professionnel ? Activez des conditions dédiées et tarifs réservés.',
  'account.overview.professionalCtaLink': 'Demander un compte professional',
  'account.overview.professionalPending': 'Votre demande de compte professional est en cours d\'évaluation. Nous vous contacterons sous 24 h ouvrées.',
  'account.overview.professionalRejected': 'Votre demande de compte professional n\'a pas été approuvée. Vous pouvez en soumettre une nouvelle depuis la page professionnels.',
  'account.shell.backToCatalog': 'Retour à la boutique',
  'account.shell.backToShop': 'Retour à la boutique',
  'account.shell.cart': 'Panier',
  'account.shell.continueShopping': 'Continuer vos achats',
  'account.shell.logout': 'Se déconnecter',
  'account.shell.logoutShort': 'Quitter',
  'account.shell.logoutConfirmTitle': 'Se déconnecter du compte ?',
  'account.shell.logoutConfirmDescription': 'Vous devrez vous reconnecter pour voir vos commandes et votre profil.',
  'account.profile.validationError': 'Veuillez remplir tous les champs obligatoires.',
  'account.profile.personalData': 'Informations personnelles',
  'account.profile.emailReadonly': 'L\'e-mail ne peut pas être modifié ici.',
  'account.profile.preferredPayment': 'Mode de paiement préféré',
  'account.profile.preferredPaymentHint': 'Nous utiliserons cette préférence au checkout lorsque possible.',
  'account.profile.shippingAddress': 'Adresse de livraison',
  'account.profile.save': 'Enregistrer les modifications',
  'account.profile.odooSyncWarning':
    'Modifications enregistrées sur votre compte, mais la synchronisation Odoo a échoué. Réessayez plus tard ou contactez-nous si le problème persiste.',
  'account.profile.saving': 'Enregistrement…',
  'account.section.orders.title': 'Vos commandes',
  'account.section.orders.description': 'Historique des achats et statut des paiements.',
  'account.section.profile.title': 'Profil',
  'account.section.profile.description': 'Mettez à jour vos informations, adresse et paiement préféré.',
  'account.section.overview.description': 'Gérez commandes, profil et favoris depuis votre compte.',
  'account.meta.customer': 'Client',
  'account.meta.email': 'E-mail',
  'account.meta.phone': 'Téléphone',
  'account.meta.shippingAddress': 'Adresse de livraison',
  'account.meta.preferredPayment': 'Paiement préféré',
  'account.meta.orders': 'Commandes',
  'account.orders.emptyTitle': 'Aucune commande',
  'account.orders.emptyDescription': 'Vos achats apparaîtront ici.',
  'account.orders.track': 'Suivre →',
  'account.orders.reorder': 'Recommander',
  'account.orders.itemCount': '{count} articles',
  'account.orders.table.order': 'Commande',
  'account.orders.table.date': 'Date',
  'account.orders.table.total': 'Total',
  'account.orders.table.status': 'Statut',
  'account.orders.table.detail': 'Détail',
  'account.orders.table.reorder': 'Commander à nouveau',
  'account.orders.table.reordering': 'Nouvelle commande…',
  'orders.detail.loading': 'Chargement de la commande…',
  'orders.detail.back': 'Retour aux commandes',
  'orders.detail.reorder': 'Commander à nouveau',
  'orders.detail.items': 'Articles',
  'orders.detail.quantity': 'Qté {count}',
  'orders.detail.orderStatus': 'Statut de la commande',
  'orders.detail.paymentStatus': 'Paiement',
  'orders.detail.total': 'Total',
  'orders.detail.date': 'Date',
  'orders.detail.pwaRef': 'Réf. PWA',
  'orders.detail.completeOrder': 'Finalisez votre commande',
  'orders.detail.invoicePortal': 'Facture et détails disponibles sur le portail Odoo.',
  'orders.reorder.success': 'Produits ajoutés au panier',
  'orders.reorder.error': 'Impossible de commander à nouveau',
  'impersonate.invalidLink': 'Lien d\'impersonation non valide.',
  'impersonate.expiredLink': 'Lien expiré ou non valide. Demandez-en un nouveau depuis le backoffice.',
  'impersonate.loading': 'Connexion en tant que client…',
  'breadcrumb.home': 'Accueil',
  'category.products': 'produits',
  'legal.terms': 'Conditions',
  'legal.privacy': 'Confidentialité',
  'paymentMethod.stripe': 'Carte de crédit / débit',
  'paymentMethod.stripeDescription': 'Visa, Mastercard, Amex, Apple Pay et Google Pay',
  'paymentMethod.bankTransfer': 'Virement bancaire',
  'paymentMethod.bankTransferDescription': 'Confirmez la commande et recevez immédiatement IBAN et libellé de virement',
  'orderStatus.cart_created': 'Panier créé',
  'orderStatus.checkout_started': 'Checkout démarré',
  'orderStatus.payment_started': 'Paiement démarré',
  'orderStatus.payment_pending': 'Paiement en attente',
  'orderStatus.paid': 'Payé',
  'orderStatus.paid_sync_pending': 'Payé, synchronisation en cours',
  'orderStatus.synced': 'Confirmé',
  'orderStatus.payment_failed': 'Paiement échoué',
  'orderStatus.abandoned': 'Abandonné',
  'orderStatus.cancelled': 'Annulé',
  'orderStatus.confirmed': 'Confirmé',
  'orderStatus.completed': 'Terminé',
  'paymentStatus.not_started': 'Non démarré',
  'paymentStatus.created': 'Créé',
  'paymentStatus.pending': 'En attente',
  'paymentStatus.captured': 'Payé',
  'paymentStatus.failed': 'Échoué',
  'paymentStatus.cancelled': 'Annulé',
  'paymentStatus.refunded': 'Remboursé',
  'checkout.payment.orPayWithCard': 'Ou payer par carte',
  'checkout.payment.orderSr': 'Commande {orderId}',
  'checkout.payment.prepareError': 'Impossible de préparer le paiement.',
  'checkout.payment.failed': 'Paiement échoué',
  'checkout.payment.cardholderName': 'Nom sur la carte',
  'checkout.payment.cardholderNamePlaceholder': 'Tel qu’indiqué sur la carte',
  'checkout.payment.cardholderNameRequired': 'Saisissez le nom du titulaire de la carte.',
  'checkout.payment.formNotReady': 'Le formulaire de paiement n’est pas encore prêt. Patientez puis réessayez.',
  'checkout.payment.cardIncomplete': 'Complétez les informations de carte avant de payer.',
  'checkout.emailPlaceholder': 'email@exemple.com',
  'checkout.error.incompleteAddress':
    'Renseignez l’e-mail et l’adresse de livraison (et de facturation si différente).',
  'checkout.error.generic': 'Erreur checkout',
  'checkout.error.missingOrder': 'Commande checkout manquante',
  'checkout.error.missingPayment': 'Paiement manquant',
  'checkout.error.orderUnavailable': 'Commande indisponible après confirmation',
  'checkout.error.alreadyPaid': 'Cette commande est déjà payée.',
  'checkout.shipping.eta': 'Livraison estimée ~{days} jours ouvrés',
  'checkout.address.typeToSearch': 'Commencez à saisir l’adresse…',
  'breadcrumb.nav': "Fil d'Ariane",
  'language.switcher.current': 'Langue : {locale}. Changer de langue',
  'language.switcher.other': 'Autres langues',
  'theme.switcher.title': 'Thème classique, noir ou sombre',
  'theme.switcher.toLight': 'Passer au thème noir',
  'theme.switcher.toDark': 'Passer au thème sombre',
  'theme.switcher.toClassic': 'Passer au thème classique (marron)',
  'skeleton.loadingProducts': 'Chargement des produits…',
  'skeleton.loadingCart': 'Chargement du panier…',
  'skeleton.loadingCartSummary': 'Chargement du récapitulatif panier…',
  'skeleton.loadingProduct': 'Chargement du produit…',
  'skeleton.loadingCheckout': 'Chargement du checkout…',
  'skeleton.loadingPageHeader': 'Chargement de l’en-tête de page',
  'skeleton.loadingForm': 'Chargement du formulaire',
  'skeleton.loadingPaymentResult': 'Chargement du résultat de paiement',
  'skeleton.loadingCatalogFilters': 'Chargement des filtres boutique',
  'skeleton.loadingAccount': 'Chargement de l’espace compte',
  'skeleton.loadingList': 'Chargement de la liste…',
}

const DE: Record<MessageKey, string> = {
  ...EN,
  'brand.name': 'Idea di Luce',
  'common.loading': 'Wird geladen…',
  'common.loadingCatalog': 'Shop wird geladen…',
  'common.confirm': 'Bestätigen',
  'common.cancel': 'Abbrechen',
  'common.pleaseWait': 'Bitte warten…',
  'common.notAvailable': '—',
  'common.email': 'E-Mail',
  'common.password': 'Passwort',
  'common.firstName': 'Vorname',
  'common.lastName': 'Nachname',
  'common.phone': 'Telefon',
  'common.quantity': 'Menge',
  'common.remove': 'Entfernen',
  'common.all': 'Alle',
  'common.back': 'Zurück',
  'common.save': 'Speichern',
  'common.saving': 'Wird gespeichert…',
  'common.close': 'Schließen',
  'common.menu': 'Menü',
  'nav.catalog': 'Shop',
  'nav.cart': 'Warenkorb',
  'nav.account': 'Konto',
  'nav.login': 'Anmelden',
  'nav.register': 'Registrieren',
  'nav.wishlist': 'Merkliste',
  'nav.checkout': 'Checkout',
  'nav.logout': 'Abmelden',
  'footer.tagline': 'Idea di Luce · Beleuchtung für Zuhause und Profis',
  'error.genericTitle': 'Etwas ist schiefgelaufen',
  'notFound.metaTitle': 'Seite nicht gefunden',
  'notFound.eyebrow': 'FEHLER 404',
  'notFound.title': 'Hier ist das Licht erloschen.',
  'notFound.description':
    'Die gesuchte Seite wurde verschoben, entfernt oder hat nie existiert. Aber bleiben Sie nicht im Dunkeln: wir starten von hier neu.',
  'notFound.backHome': 'Zur Startseite',
  'notFound.exploreCatalog': 'Shop entdecken',
  'notFound.searchPlaceholder': 'Suche nach Produkt, Sockel, Code oder Marke',
  'notFound.searchCta': 'Suchen',
  'notFound.assistenza': 'Support',
  'notFound.linkDesign': 'Designbeleuchtung',
  'notFound.linkTechnical': 'Technische Produkte',
  'notFound.linkAttacco': 'Nach Sockel wählen',
  'notFound.linkGuide': 'Ratgeber',
  'notFound.linkProductNotFound': 'Produkt nicht gefunden?',
  'notFound.footer': 'TLB Italy Srl · Via Appia Pignatelli 450, Rom · info@ideadiluce.com',
  'productNotFound.formTitle': 'Sagen Sie uns, was Sie suchen',
  'productNotFound.formDescription':
    'Je mehr Informationen Sie geben, desto schneller finden wir das richtige Produkt.',
  'productNotFound.photoProduct': 'Foto vom Produkt oder Sockel',
  'productNotFound.photoProductHint': 'Produktfoto hier ablegen',
  'productNotFound.photoSocket': 'Sockelfoto',
  'productNotFound.photoSocketHint': 'Nahaufnahme des Sockels',
  'productNotFound.nameLabel': 'Vor- und Nachname',
  'productNotFound.namePlaceholder': 'Max Mustermann',
  'productNotFound.emailPlaceholder': 'max@email.de',
  'productNotFound.phoneLabel': 'Telefon / WhatsApp',
  'productNotFound.phonePlaceholder': '+39 ___ ___ ____',
  'productNotFound.codeLabel': 'Code / EAN / MPN',
  'productNotFound.codePlaceholder': 'z. B. 8711500411990',
  'productNotFound.brandLabel': 'Marke (falls bekannt)',
  'productNotFound.brandPlaceholder': 'Philips, Osram…',
  'productNotFound.usage': 'Verwendung',
  'productNotFound.usageHome': 'Zuhause',
  'productNotFound.usageShop': 'Geschäft',
  'productNotFound.usageOffice': 'Büro',
  'productNotFound.usageOutdoor': 'Außen',
  'productNotFound.usageInstall': 'Anlage',
  'productNotFound.urgency': 'Dringlichkeit',
  'productNotFound.urgencyLow': 'Niedrig',
  'productNotFound.urgencyMedium': 'Mittel',
  'productNotFound.urgencyHigh': 'Hoch',
  'productNotFound.messageLabel': 'Nachricht',
  'productNotFound.messagePlaceholder': 'Beschreiben Sie das Produkt, wo Sie es verwendet haben und was Sie brauchen…',
  'productNotFound.submit': 'Anfrage senden',
  'productNotFound.privacyNote': 'Mit dem Absenden akzeptieren Sie die',
  'productNotFound.privacyLink': 'Datenschutzerklärung',
  'productNotFound.responseNote': 'Wir antworten per E-Mail oder WhatsApp, meist noch am selben Werktag.',
  'productNotFound.success': 'Anfrage gesendet. Wir melden uns bald.',
  'productNotFound.error': 'Senden fehlgeschlagen',
  'productNotFound.stepsTitle': 'So funktioniert es',
  'productNotFound.preferTalk': 'LIEBER DIREKT SPRECHEN?',
  'productNotFound.whatsapp': 'Schreiben Sie uns auf WhatsApp',
  'productNotFound.professionalsTitle': 'Auch für Profis',
  'productNotFound.professionalsBody':
    'Lange Listen oder wiederkehrende Nachbestellungen? Laden Sie eine Datei mit Codes hoch – wir erstellen ein Gesamtangebot.',
  'productNotFound.professionalsCta': 'Profi-Bereich',
  'productNotFound.showroomTitle': 'Showroom in Rom',
  'productNotFound.showroomBody':
    'Via Appia Pignatelli 450 · Mo–Fr 9–13 / 15–18. Bringen Sie das Teil mit – wir identifizieren es sofort.',
  'productNotFound.showroomCta': 'Showroom entdecken',
  'auth.sessionChecking': 'Sitzung wird geprüft…',
  'auth.redirectingToLogin': 'Weiterleitung zur Anmeldung…',
  'auth.loggingIn': 'Anmeldung…',
  'auth.loggedIn': 'Anmeldung erfolgreich.',
  'auth.loggedOut': 'Sie wurden abgemeldet.',
  'auth.loggedOutLocalOnly':
    'Lokale Sitzung beendet. Bei Auffälligkeiten Seite neu laden oder erneut versuchen.',
  'auth.loginSubmit': 'Anmelden',
  'auth.registerSubmit': 'Registrieren',
  'auth.registering': 'Registrierung…',
  'auth.noAccount': 'Noch kein Konto?',
  'auth.hasAccount': 'Bereits ein Konto?',
  'auth.firstNamePlaceholder': 'Max',
  'auth.lastNamePlaceholder': 'Müller',
  'auth.emailPlaceholder': 'name@email.com',
  'home.title': 'Idea di Luce',
  'home.subtitle': 'Beleuchtung für Zuhause und Profis',
  'home.metaDescription': 'La luce pensata. Beleuchtung für Zuhause und Profis.',
  'home.featuredTitle': 'Empfohlene Produkte',
  'home.featuredDescription': 'Eine Auswahl aus unserem Shop.',
  'home.goToCatalog': 'Zum Shop',
  'home.viewAll': 'Alle Produkte anzeigen',
  'home.categories': 'Kategorien',
  'catalog.title': 'Shop',
  'catalog.description': 'Produkte suchen, nach Kategorie filtern und Ergebnisse sortieren.',
  'catalog.metaDescription': 'Beleuchtungsshop — Lampen, Wandleuchten und Lösungen für Zuhause und Profis.',
  'catalog.search': 'Produkte suchen',
  'catalog.searchLabel': 'Im Shop suchen',
  'catalog.searchPlaceholder': 'Mindestens 3 Zeichen eingeben…',
  'catalog.clearSearch': 'Suche löschen',
  'catalog.noSuggestions': 'Keine Vorschläge in den geladenen Produkten.',
  'catalog.suggestGroupAttacchi': 'Fassungen',
  'catalog.suggestGroupBrands': 'Marken',
  'catalog.suggestGroupCategories': 'Kategorien',
  'catalog.suggestGroupProducts': 'Produkte',
  'catalog.suggestGroupHints': 'Vorschläge',
  'catalog.suggestGroupQueries': 'Suchen',
  'catalog.searchRecentLabel': 'Letzte Suchen',
  'catalog.searchEmptyTitle': 'Keine Ergebnisse',
  'catalog.searchEmptyDescription': 'Versuchen Sie einen anderen Begriff, eine Fassung oder eine Marke.',
  'catalog.searchViewAllResults': 'Alle {count} Ergebnisse anzeigen',
  'catalog.searchViewAllResultsNoCount': 'Alle Ergebnisse anzeigen',
  'catalog.searchKeyboardNavigate': 'Navigieren',
  'catalog.searchKeyboardSelect': 'Auswählen',
  'catalog.searchKeyboardClose': 'Schließen',
  'catalog.searchShortcutHint': '{shortcut} drücken, um die Suche zu öffnen',
  'catalog.searchPopularLabel': 'Beliebte Suchen',
  'catalog.searchClearRecent': 'Löschen',
  'header.openSearch': 'Shop-Suche öffnen',
  'catalog.inStock': 'Nur verfügbare',
  'catalog.inStockHint': 'Nur Produkte mit Lagerbestand anzeigen.',
  'catalog.sort': 'Sortieren',
  'catalog.sortRelevance': 'Relevanz',
  'catalog.sortPriceAsc': 'Preis aufsteigend',
  'catalog.sortPriceDesc': 'Preis absteigend',
  'catalog.sortName': 'Name A–Z',
  'catalog.minPrice': 'Mindestpreis (€)',
  'catalog.maxPrice': 'Höchstpreis (€)',
  'catalog.categoryLabel': 'Kategorie',
  'catalog.allCategories': 'Alle Kategorien',
  'catalog.clearCategory': 'Kategorie löschen',
  'catalog.hideCategories': 'Kategorien ausblenden',
  'catalog.chooseCategory': 'Kategorie wählen ({count})',
  'catalog.searchCategoryPlaceholder': 'Kategorie suchen…',
  'catalog.noCategoryFound': 'Keine Kategorie gefunden.',
  'catalog.showingCount': '{shown} von {total} Produkten angezeigt',
  'catalog.inStockSuffix': ' verfügbar',
  'catalog.forQuery': ' für „{query}"',
  'catalog.seenAll': 'Sie haben alle Produkte gesehen.',
  'catalog.emptyTitle': 'Keine Produkte',
  'catalog.emptyDescription': 'Versuchen Sie einen anderen Filter.',
  'category.loading': 'Wird geladen…',
  'category.empty': 'Keine Produkte in dieser Kategorie.',
  'category.backToCatalog': '← {catalog}',
  'product.notAvailable': 'Produkt nicht verfügbar',
  'product.backToCatalog': 'Zurück zum Shop',
  'product.sectionDescription': 'Produktbeschreibung',
  'product.sectionSpecs': 'Technische Daten',
  'product.sectionActivity': 'Letzte Aktivität',
  'product.additionalInfo': 'Zusätzliche Informationen',
  'product.addToCart': 'In den Warenkorb',
  'product.addToCartShort': 'Hinzufügen',
  'product.addingToCart': 'Wird hinzugefügt…',
  'product.requestProduct': 'Produkt anfragen',
  'product.availability.available': 'Verfügbar',
  'product.availability.orderable': 'Bestellbar',
  'product.availability.outOfStock': 'Nicht auf Lager',
  'product.availability.shippedInDays': 'Versand in {days} Werktagen',
  'product.availability.shippedByDate': 'Voraussichtlicher Versand bis {date}',
  'product.availability.orderableFallback':
    'Bestellbar — voraussichtlicher Versand in 10 Werktagen',
  'product.availability.lowStock': 'Nur noch {count} verfügbar',
  'product.outOfStock': 'Nicht auf Lager',
  'product.unavailable': 'Nicht verfügbar',
  'product.available': 'Verfügbar',
  'product.lowStock': 'Nur noch {count} verfügbar',
  'product.relatedTitle': 'Das könnte Ihnen auch gefallen…',
  'product.grid.empty': 'Keine Produkte in der Liste.',
  'product.card.noImage': 'Kein Bild',
  'product.quantityLabel': 'Menge',
  'product.variantLabel': 'Variante',
  'product.variantSoldOut': 'Ausverkauft',
  'login.title': 'Anmelden',
  'login.welcomeTitle': 'Willkommen zurück',
  'login.subtitle': 'Melden Sie sich bei Ihrem IdeaDiLuce-Konto an.',
  'login.forgot': 'Passwort vergessen?',
  'login.rememberMe': 'Auf diesem Gerät merken',
  'login.passwordPlaceholder': '••••••••',
  'login.showPassword': 'Passwort anzeigen',
  'login.hidePassword': 'Passwort verbergen',
  'login.professionalPrompt': 'Sind Sie Fachhändler?',
  'login.professionalCta': 'Zum B2B-Bereich',
  'register.title': 'Konto erstellen',
  'register.subtitle': 'Erstellen Sie Ihr IdeaDiLuce-Konto.',
  'register.business': 'Business-Konto (B2B-Preisliste)',
  'register.passwordHint': 'Passwort (mind. 8 Zeichen)',
  'register.passwordPlaceholder': 'Mind. 8 Zeichen',
  'forgot.title': 'Passwort zurücksetzen',
  'forgot.subtitle': 'Wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.',
  'forgot.submit': 'Link senden',
  'forgot.error': 'Link konnte nicht gesendet werden. Bitte erneut versuchen.',
  'forgot.sentMessage': 'Wenn die E-Mail registriert ist, erhalten Sie einen Link zum Zurücksetzen des Passworts.',
  'reset.title': 'Neues Passwort',
  'reset.submit': 'Passwort speichern',
  'reset.invalidLink': 'Ungültiger Link.',
  'reset.expiredLink': 'Link abgelaufen oder ungültig. Fordern Sie einen neuen Link an.',
  'reset.passwordLabel': 'Neues Passwort (mind. 8 Zeichen)',
  'reset.requestNewLink': 'Neuen Link anfordern',
  'reset.odooDelegated':
    'Das Zurücksetzen des Passworts erfolgt über den Link in der E-Mail. Öffnen Sie diesen Link, legen Sie ein neues Passwort fest und melden Sie sich dann auf der Website an.',
  'cart.title': 'Warenkorb',
  'cart.pageTitle': 'Ihr Warenkorb',
  'cart.description': 'Artikel prüfen, Mengen aktualisieren und zum Checkout gehen.',
  'cart.clear': 'Warenkorb leeren',
  'cart.continueShopping': 'Weiter einkaufen',
  'cart.itemCountOne': '{count} Artikel',
  'cart.itemCountMany': '{count} Artikel',
  'cart.variant': 'Variante:',
  'cart.perUnit': 'Stk.',
  'cart.line.availableFast': 'Verfügbar · Versand in 24/48 Std.',
  'cart.line.availableLead': 'Verfügbar · Versand in {days} Werktagen',
  'cart.line.lowStock': 'Letzte Stücke · {qty} verfügbar',
  'cart.line.orderable': 'Bestellbar — Lieferzeit wird bestätigt',
  'cart.line.unavailable': 'Nicht verfügbar',
  'cart.recommendationsTitle': 'Häufig zusammen gekauft',
  'cart.recommendationsDescription': 'Kompatibel mit den Produkten im Warenkorb.',
  'cart.recommendationsLoading': 'Vorschläge werden geladen…',
  'cart.recommendationsEmpty': 'Keine empfohlenen Ergänzungen für diese Produkte.',
  'cart.summary.title': 'Übersicht',
  'cart.summary.subtotal': 'Zwischensumme (gesch.)',
  'cart.summary.tax': 'MwSt. (gesch.)',
  'cart.summary.shipping': 'Versand',
  'cart.summary.shippingFree': 'Gratis',
  'cart.summary.total': 'Gesamt',
  'cart.summary.taxIncluded': 'MwSt. {rate}% inkl. · {amount}',
  'cart.summary.securePayment': 'Sichere Zahlung · Rückgabe innerhalb von 50 Tagen',
  'cart.summary.estimatesDisclaimer': 'Steuern und Versand werden beim Checkout neu berechnet.',
  'cart.checkoutCta': 'Zum Checkout',
  'cart.remove': 'Entfernen',
  'cart.empty.title': 'Ihr Warenkorb ist leer',
  'cart.empty.description': 'Fügen Sie Produkte aus dem Shop hinzu oder kehren Sie zur Startseite zurück.',
  'cart.empty.browseCatalog': 'Shop durchstöbern',
  'cart.empty.backHome': 'Zur Startseite',
  'cart.empty.popularCategories': 'Beliebte Kategorien',
  'cart.empty.featured': 'Empfohlene Produkte',
  'cart.toast.added': 'Zum Warenkorb hinzugefügt',
  'cart.toast.quantity': 'Menge:',
  'cart.toast.close': 'Benachrichtigung schließen',
  'cart.toast.openCart': 'Warenkorb öffnen',
  'cart.stock.outOfStock': 'Nicht mehr verfügbar',
  'cart.stock.insufficient': 'Menge nicht verfügbar',
  'cart.reservationExpired.title': 'Warenkorb abgelaufen',
  'cart.reservationExpired.description': 'Die Reservierung ist abgelaufen. Verfügbarkeit und Preise werden aktualisiert.',
  'cart.reservationExpired.dismiss': 'Verstanden',
  'cart.freeShipping.progress': 'Fortschritt zum kostenlosen Versand',
  'cart.freeShipping.remaining': 'Noch {amount} für kostenlosen Versand',
  'cart.freeShipping.unlocked': 'Kostenloser Versand',
  'cart.freeShipping.unlockedDetail': 'Sie haben die Schwelle von {amount} erreicht. Die Lieferung ist inbegriffen.',
  'cart.compatibility.title': 'Unsicher bei der Kompatibilität?',
  'cart.compatibility.description':
    'Senden Sie uns ein Foto oder den Code des alten Produkts: Wir prüfen Treiber, Sockel und Leistung vor der Bestellung.',
  'cart.compatibility.cta': 'Prüfung anfordern',
  'cart.pricelist.b2b': 'B2B-Preisliste',
  'cart.pricelist.b2c': 'B2C-Preisliste',
  'cart.quoteCta': 'Angebot anfordern',
  'cart.priceUpdated': 'Preis aktualisiert',
  'cart.professional.badge': 'Professional-Bedingungen aktiv',
  'cart.professional.banner': 'Sie sehen Preise und Konditionen für Fachkunden.',
  'cart.unpurchasable.badge': 'Nicht mehr verfügbar',
  'cart.unpurchasable.limitedBadge': 'Eingeschränkte Verfügbarkeit',
  'cart.unpurchasable.blockedCheckout': 'Entfernen oder nicht verfügbare Produkte zu Favoriten verschieben, um fortzufahren.',
  'cart.unpurchasable.moveToWishlist': 'Zu Favoriten verschieben',
  'cart.unpurchasable.noPurchasableLines': 'Keine kaufbaren Artikel im Warenkorb.',
  'cart.delivery.banner': 'Einzelne Lieferung innerhalb von {days} Werktagen.',
  'cart.quote.title': 'Angebot anfordern',
  'cart.quote.description': 'Senden Sie eine Angebotsanfrage für die Produkte im Warenkorb.',
  'cart.quote.stubMessage': 'Der Angebotsprozess ist in Kürze verfügbar. Melden Sie sich an, um fortzufahren.',
  'cart.quote.backToCart': 'Zurück zum Warenkorb',
  'cart.quote.loginCta': 'Anmelden',
  'cart.quote.loginRequired': 'Melden Sie sich an, um ein Angebot anzufordern.',
  'cart.quote.accountTitle': 'Konto für Ihr Angebot',
  'cart.quote.accountHint': 'Erstellen Sie ein Konto oder melden Sie sich an, um die Anfrage zu senden. Der Warenkorb bleibt mit Ihrem Profil verknüpft.',
  'cart.quote.accountContinue': 'Weiter zum Angebot',
  'cart.quote.reviewLines': 'Produktübersicht',
  'cart.quote.emptyCart': 'Der Warenkorb ist leer.',
  'cart.quote.notesLabel': 'Angebotsnotizen (optional)',
  'cart.quote.notesPlaceholder': 'z. B. Lieferzeiten, Ausführungen, Baustellenadresse…',
  'cart.quote.submit': 'Angebotsanfrage senden',
  'cart.quote.success': 'Anfrage gesendet. Wir melden uns in Kürze.',
  'cart.quote.successPending': 'Verfolgen Sie Ihr Angebot im Konto-Bereich. Nach Freigabe können Sie online bezahlen.',
  'cart.quote.frozenTitle': 'Eingefrorenes Angebot',
  'cart.quote.frozenDescription': 'Gesperrte Positionen und Preise — keine automatische Neuberechnung.',
  'cart.quote.frozenNotice': 'Die angezeigten Preise entsprechen dem Angebot zum Zeitpunkt der Anfrage.',
  'cart.quote.proceedCheckout': 'Zur Kasse',
  'cart.quote.checkoutStarted': 'Checkout mit eingefrorenen Preisen gestartet.',
  'cart.quote.checkoutFailed': 'Checkout konnte nicht gestartet werden.',
  'cart.quote.steps.navLabel': 'Schritte der Angebotsanfrage',
  'cart.quote.steps.group.account': 'Konto',
  'cart.quote.steps.group.details': 'Details',
  'cart.quote.steps.pageTitle.account': 'Anmelden, um ein Angebot anzufragen',
  'cart.quote.steps.pageTitle.accountConfirm': 'Konto bestätigen',
  'cart.quote.steps.pageTitle.details': 'Anfrage abschließen',
  'cart.quote.steps.pageSubtitle.account': 'Konto erstellen oder anmelden — der Warenkorb bleibt mit Ihrem Profil verknüpft.',
  'cart.quote.steps.pageSubtitle.details': 'Rechnungsdaten angeben und optional Notizen für das Vertriebsteam hinzufügen.',
  'cart.quote.estimateNotice': 'Die Summen in der Übersicht sind Richtwerte. Sie erhalten ein personalisiertes Angebot per E-Mail.',
  'wishlist.title': 'Merkliste',
  'wishlist.descriptionGuest': 'Speichern Sie interessante Produkte. Melden Sie sich an, um sie auf allen Geräten zu synchronisieren.',
  'wishlist.descriptionAccount': 'Ihre Lieblingsprodukte, bereit zum Kauf.',
  'wishlist.addAllToCart': 'Alle in den Warenkorb',
  'wishlist.emptyTitle': 'Liste leer',
  'wishlist.emptyDescription': 'Fügen Sie Produkte aus dem Shop zur Merkliste hinzu.',
  'wishlist.unavailableTitle': 'Einige Produkte sind nicht mehr verfügbar',
  'wishlist.unavailableDescription': 'Entfernen Sie sie aus der Liste oder prüfen Sie alternative Varianten.',
  'wishlist.item.unavailable': 'Nicht mehr verfügbar',
  'wishlist.item.notInCatalog': 'Produkt nicht mehr im Shop',
  'wishlist.item.addToCart': 'In den Warenkorb',
  'wishlist.heart.add': 'Zur Merkliste hinzufügen',
  'wishlist.heart.remove': 'Von Merkliste entfernen',
  'checkout.processing': 'Wird verarbeitet…',
  'checkout.confirmOrder': 'Bestellung bestätigen',
  'checkout.payAmount': '{amount} bezahlen',
  'checkout.contactInfo': 'Kontaktdaten',
  'checkout.shippingAddress': 'Lieferadresse',
  'checkout.billingAddress': 'Rechnungsadresse',
  'checkout.billingSameAsShipping': 'Gleich wie Lieferadresse',
  'checkout.continue': 'Weiter',
  'checkout.selectShipping': 'Versandart auswählen',
  'checkout.payment': 'Zahlungsmethode',
  'checkout.paymentNote': 'Kartenzahlung (Stripe), Apple Pay und Google Pay. Überweisung verfügbar.',
  'walletQuickPay.checkoutFallback': 'Apple Pay · Google Pay im Checkout',
  'walletQuickPay.openCheckout': 'Zum Checkout',
  'checkout.steps.title': 'Bestellung abschließen',
  'checkout.steps.pageTitle.account': 'Anmelden oder registrieren',
  'checkout.steps.pageTitle.accountConfirm': 'Ihr Konto',
  'checkout.steps.details': 'Details',
  'checkout.steps.payment': 'Zahlung',
  'checkout.steps.shipping': 'Versand',
  'checkout.stepProgress': 'Schritt {current} von {total}',
  'checkout.summary.subtotal': 'Zwischensumme',
  'checkout.summary.tax': 'MwSt.',
  'checkout.summary.shipping': 'Versand',
  'checkout.summary.free': 'Kostenlos',
  'checkout.summary.total': 'Gesamt',
  'checkout.backToCart': 'Zurück zum Warenkorb',
  'checkout.shipping.title': 'Versandart',
  'checkout.shipping.noMethods': 'Keine Versandarten für diese Adresse verfügbar.',
  'checkout.shipping.addressIncomplete': 'Adresse vervollständigen, um Versandoptionen zu sehen.',
  'checkout.shipping.deliveryEstimate':
    'Einzelne Lieferung voraussichtlich innerhalb von {days} Werktagen (längste Vorlaufzeit im Warenkorb).',
  'checkout.shipping.pickupRomeOnly': 'Abholung vor Ort ist nur für Kunden mit Sitz in Rom verfügbar.',
  'paymentResult.loading': 'Zahlung wird geprüft…',
  'paymentResult.notFound': 'Bestellung nicht gefunden',
  'paymentResult.fetchError': 'Fehler beim Abrufen der Bestellung',
  'paymentResult.syncNote': 'Synchronisation mit Odoo, wenn konfiguriert.',
  'paymentResult.orderPwa': 'PWA-Bestellung',
  'paymentResult.orderOdoo': 'Odoo-Bestellung',
  'paymentResult.paymentStatus': 'Zahlungsstatus',
  'paymentResult.total': 'Gesamt',
  'paymentResult.myOrders': 'Meine Bestellungen',
  'paymentResult.catalog': 'Shop',
  'paymentResult.status.paid': 'Zahlung abgeschlossen',
  'paymentResult.status.pending': 'Zahlung ausstehend',
  'paymentResult.status.failed': 'Zahlung fehlgeschlagen',
  'thankYou.hero.confirmedEyebrow': 'BESTELLUNG BESTÄTIGT',
  'thankYou.hero.pendingEyebrow': 'BESTELLUNG ERHALTEN',
  'thankYou.hero.failedEyebrow': 'ZAHLUNG FEHLGESCHLAGEN',
  'thankYou.hero.confirmedTitle': 'Danke, {name}! Ihre Bestellung ist bestätigt.',
  'thankYou.hero.confirmedTitleGeneric': 'Danke! Ihre Bestellung ist bestätigt.',
  'thankYou.hero.pendingTitle': 'Bestellung erfasst, Zahlung ausstehend',
  'thankYou.hero.failedTitle': 'Die Zahlung konnte nicht abgeschlossen werden',
  'thankYou.hero.emailPrefix': 'Die Bestätigung wurde gesendet an',
  'thankYou.hero.confirmedBody': '. Wir bereiten sie vor und informieren Sie beim Versand.',
  'thankYou.hero.pendingBody': '. Schließen Sie die Zahlung ab, um die Vorbereitung zu starten.',
  'thankYou.hero.failedBody': 'Versuchen Sie den Checkout erneut oder wählen Sie eine andere Zahlungsart.',
  'thankYou.hero.retryCheckout': 'Zurück zum Checkout',
  'thankYou.hero.retryPayment': 'Zahlung erneut versuchen',
  'thankYou.orderNumber': 'Bestellnummer',
  'thankYou.estimatedDelivery': 'Voraussichtliche Lieferung',
  'thankYou.deliverySoon': 'Innerhalb weniger Werktage',
  'thankYou.tracker.title': 'Bestellstatus',
  'thankYou.tracker.confirmed': 'Bestätigt',
  'thankYou.tracker.preparing': 'In Vorbereitung',
  'thankYou.tracker.shipped': 'Versendet',
  'thankYou.tracker.delivered': 'Zugestellt',
  'thankYou.tracker.now': 'Jetzt',
  'thankYou.tracker.today': 'Heute',
  'thankYou.tracker.afterPayment': 'Nach Zahlung',
  'thankYou.tracker.trackingNote': 'Sie erhalten einen Tracking-Link per E-Mail, sobald die Bestellung versendet wird.',
  'thankYou.tracker.pickupNote':
    'Wir melden uns bei Ihnen zur Organisation der Abholung oder Lieferung, sobald die Bestellung bearbeitet wurde.',
  'thankYou.tracker.trackCta': 'Bestellung verfolgen',
  'thankYou.lines.title': 'Produktübersicht',
  'thankYou.lines.quantity': 'Menge {count}',
  'thankYou.support.title': 'Fragen zur Montage?',
  'thankYou.support.body':
    'Unser Showroom in Rom hilft bei Anschluss, Kompatibilität und Installation. Schreiben Sie uns jederzeit.',
  'thankYou.support.cta': 'Experten kontaktieren',
  'thankYou.summary.title': 'Bestelldetails',
  'thankYou.summary.subtotal': 'Zwischensumme',
  'thankYou.summary.shipping': 'Versand',
  'thankYou.summary.total': 'Gesamt',
  'thankYou.summary.vat': 'MwSt. exklusive',
  'thankYou.summary.shipTo': 'Lieferung an',
  'thankYou.summary.payment': 'Zahlung',
  'thankYou.shippingFree': 'Kostenlos',
  'thankYou.account.title': 'Konto erstellen',
  'thankYou.account.body': 'Bestellung speichern, Sendungen verfolgen und Ersatzteile mit einem Klick nachbestellen.',
  'thankYou.account.cta': 'Konto mit dieser E-Mail erstellen',
  'thankYou.crossSell.eyebrow': 'INSTALLATION VERVOLLSTÄNDIGEN',
  'thankYou.crossSell.title': 'Kompatible Zubehörteile zu Ihrer Bestellung',
  'thankYou.crossSell.catalog': 'Zum Shop',
  'purchaseError.securePayment': 'Sichere Zahlung · SSL',
  'purchaseError.supportPhone': 'Support · (+39) 06 716 7111',
  'purchaseError.hero.title': 'Die Zahlung konnte nicht abgeschlossen werden.',
  'purchaseError.hero.bodyPrefix': 'Es wurde kein Betrag belastet und',
  'purchaseError.hero.bodyStrong': 'Ihr Warenkorb ist sicher',
  'purchaseError.hero.bodySuffix':
    '. Sie können es jetzt erneut versuchen oder eine andere Zahlungsart wählen — das dauert nur wenige Sekunden.',
  'purchaseError.hero.retryPayment': 'Zahlung erneut versuchen',
  'purchaseError.hero.changeMethod': 'Methode ändern',
  'purchaseError.attemptRef': 'Versuchsreferenz ·',
  'purchaseError.causes.title': 'Warum das passiert sein kann',
  'purchaseError.causes.intro': 'Meist lässt sich das schnell beheben. Die häufigsten Ursachen:',
  'purchaseError.causes.card.title': 'Kartendaten prüfen',
  'purchaseError.causes.card.body':
    'Prüfen Sie Nummer, Ablaufdatum und CVC. Ein Tippfehler ist die häufigste Ursache.',
  'purchaseError.causes.secure3ds.title': '3D-Secure-Autorisierung nicht abgeschlossen',
  'purchaseError.causes.secure3ds.body':
    'Die Bank hat möglicherweise eine Bestätigung per App oder SMS verlangt, die nicht geklappt hat.',
  'purchaseError.causes.limit.title': 'Limit oder Verfügbarkeit nicht ausreichend',
  'purchaseError.causes.limit.body':
    'Prüfen Sie das Kartenlimit oder probieren Sie unten eine andere Methode.',
  'purchaseError.methods.title': 'Andere Methode versuchen',
  'purchaseError.methods.card': 'Andere Karte',
  'purchaseError.methods.paypal': 'PayPal',
  'purchaseError.methods.bankTransfer': 'Überweisung',
  'purchaseError.support.title': 'Funktioniert es immer noch nicht?',
  'purchaseError.support.body':
    'Wir helfen Ihnen telefonisch oder per E-Mail beim Abschluss — oder schließen die Bestellung für Sie ab. Verfügbarkeit ist kein Problem: Wir halten die Artikel für Sie bereit.',
  'purchaseError.support.cta': 'Support kontaktieren',
  'purchaseError.cart.title': 'Ihr Warenkorb ist sicher',
  'purchaseError.cart.noCharge': 'Kein Betrag belastet',
  'purchaseError.cart.reserved': 'Artikel für Sie reserviert',
  'purchaseError.cart.ssl': 'Verschlüsselte SSL-Verbindung',
  'purchaseError.cart.backToShop': 'Zurück zum Shop',
  'purchaseError.taxIncluded': 'MwSt. 22 % inklusive',
  'purchaseError.footer.company':
    'TLB Italy Srl · USt-IdNr. IT17245551001 · Via Appia Pignatelli 450, Rom',
  'purchaseError.footer.help': 'Brauchen Sie Hilfe?',
  'account.pricelist': 'Preisliste',
  'account.greeting.named': 'Hallo, {name}',
  'account.greeting.default': 'Hallo, willkommen zurück',
  'account.overview.myOrders': 'Meine Bestellungen',
  'account.overview.editProfile': 'Profil bearbeiten',
  'account.overview.recentOrders': 'Letzte Bestellungen',
  'account.overview.allOrders': 'Alle ({count})',
  'account.overview.noOrders': 'Noch keine Bestellungen.',
  'account.overview.browseCatalog': 'Shop durchstöbern',
  'account.overview.segmentB2b': '(B2B)',
  'account.overview.segmentB2c': '(B2C)',
  'account.overview.segmentProfessional': '(Professional)',
  'account.overview.accountType': 'Kontotyp',
  'account.overview.recentQuotes': 'Aktuelle Angebote',
  'account.overview.recentInvoices': 'Aktuelle Rechnungen',
  'account.overview.viewAllQuotes': 'Alle Angebote',
  'account.overview.viewAllInvoices': 'Alle Rechnungen',
  'account.overview.noQuotes': 'Noch keine Angebote.',
  'account.overview.noInvoices': 'Keine Rechnungen verfügbar.',
  'account.overview.payableQuotesHint': '{count} Angebote bereit für Online-Zahlung.',
  'account.overview.professionalActive': 'Condizioni professional attive',
  'account.nav.overview': 'Übersicht',
  'account.nav.dashboard': 'Dashboard',
  'account.nav.profile': 'Profil',
  'account.nav.orders': 'Meine Bestellungen',
  'account.nav.parts': 'Meine Ersatzteile',
  'account.nav.addresses': 'Adressen',
  'account.nav.payments': 'Zahlungen',
  'account.nav.data': 'Daten & Passwort',
  'account.nav.support': 'Support',
  'account.nav.wishlist': 'Merkliste',
  'account.nav.quotes': 'Angebote',
  'account.nav.invoices': 'Rechnungen',
  'account.dashboard.totalOrders': 'Bestellungen gesamt',
  'account.dashboard.inProgress': 'In Bearbeitung',
  'account.dashboard.savedParts': 'Gespeicherte Teile',
  'account.dashboard.ongoingOrder': 'Laufende Bestellung',
  'account.dashboard.details': 'Details →',
  'account.dashboard.delivery': 'Lieferung',
  'account.dashboard.deliverySoon': 'In wenigen Tagen',
  'account.dashboard.reorderParts': 'Ersatzteile nachbestellen',
  'account.dashboard.reorderPartsBody':
    'Sie haben bereits Lampen und Treiber gekauft. Bestellen Sie sie mit einem Klick aus Ihrer Teileliste.',
  'account.dashboard.goToParts': 'Zu den Teilen',
  'account.dashboard.openQuotes': 'Angebote',
  'account.dashboard.invoices': 'Rechnungen',
  'account.parts.title': 'Meine Ersatzteile',
  'account.parts.description': 'Technische Produkte, die Sie oft nutzen – bereit zur Nachbestellung.',
  'account.parts.savedCount': '{count} gespeicherte Produkte',
  'account.addresses.current': 'Aktuelle Adresse',
  'account.payments.title': 'Zahlungsmethoden',
  'account.payments.current': 'Bevorzugte Methode',
  'account.quotes.title': 'Ihre Angebote',
  'account.quotes.description': 'Warenkorb-Anfragen und Odoo-Angebote zu Ihrem Konto.',
  'account.quotes.empty': 'Keine Angebote verfügbar.',
  'account.quotes.view': 'Öffnen',
  'account.quotes.status.requested': 'Angefragt',
  'account.quotes.status.sent': 'Gesendet',
  'account.quotes.status.checkout_started': 'Checkout gestartet',
  'account.quotes.status.converted': 'Umgewandelt',
  'account.quotes.status.draft': 'Entwurf',
  'account.quotes.status.cancelled': 'Storniert',
  'account.quotes.badge.expired': 'Abgelaufen',
  'account.quotes.badge.payable': 'Online zahlbar',
  'account.quotes.badge.pending': 'Genehmigung ausstehend',
  'account.quotes.badge.preparing': 'In Vorbereitung',
  'account.quotes.message.expired': 'Dieses Angebot ist abgelaufen. Kontaktieren Sie uns für ein neues Angebot.',
  'account.quotes.message.notPayable': 'Dieses Angebot ist noch nicht für Online-Zahlung freigegeben.',
  'account.quotes.message.not_sent': 'Wir bereiten Ihr Angebot vor. Wir benachrichtigen Sie, wenn Sie online zahlen können.',
  'account.quotes.message.cancelled': 'Dieses Angebot wurde storniert.',
  'account.quotes.message.converted': 'Dieses Angebot wurde bereits in eine Bestellung umgewandelt.',
  'account.quotes.message.draft': 'Das Angebot wird noch vorbereitet.',
  'account.quotes.validUntil': 'Gültig bis',
  'account.quotes.linesTitle': 'Produkte',
  'account.quotes.expiredContact': 'Angebotsaktualisierung anfragen',
  'account.quotes.viewOrder': 'Verknüpfte Bestellung anzeigen',
  'account.invoices.title': 'Ihre Rechnungen',
  'account.invoices.description': 'ERP-Rechnungen zu Ihrem Konto.',
  'account.invoices.empty': 'Keine Rechnungen verfügbar.',
  'account.invoices.loadError': 'Rechnungen konnten nicht geladen werden.',
  'account.invoices.download': 'PDF herunterladen',
  'account.invoices.pdfPending': 'PDF in Bearbeitung',
  'account.invoices.pdfDownloadError': 'PDF konnte nicht heruntergeladen werden.',
  'account.invoices.portalLink': 'Im Portal öffnen',
  'account.profile.businessData': 'Unternehmensdaten',
  'account.profile.businessHint': 'Für E-Rechnung und B2B-Konditionen.',
  'account.overview.professionalCta': 'Sind Sie Profi? Aktivieren Sie dedizierte Konditionen und Preise.',
  'account.overview.professionalCtaLink': 'Professional-Konto anfragen',
  'account.overview.professionalPending': 'Ihre Professional-Konto-Anfrage wird geprüft. Wir melden uns innerhalb von 24 Arbeitsstunden.',
  'account.overview.professionalRejected': 'Ihre Professional-Konto-Anfrage wurde nicht genehmigt. Sie können eine neue Anfrage über die Profi-Seite senden.',
  'account.shell.backToCatalog': 'Zurück zum Shop',
  'account.shell.backToShop': 'Zurück zum Shop',
  'account.shell.cart': 'Warenkorb',
  'account.shell.continueShopping': 'Weiter einkaufen',
  'account.shell.logout': 'Abmelden',
  'account.shell.logoutShort': 'Abmelden',
  'account.shell.logoutConfirmTitle': 'Vom Konto abmelden?',
  'account.shell.logoutConfirmDescription': 'Sie müssen sich erneut anmelden, um Bestellungen und Profil zu sehen.',
  'account.profile.validationError': 'Bitte alle Pflichtfelder ausfüllen.',
  'account.profile.personalData': 'Persönliche Daten',
  'account.profile.emailReadonly': 'E-Mail kann hier nicht geändert werden.',
  'account.profile.preferredPayment': 'Bevorzugte Zahlungsmethode',
  'account.profile.preferredPaymentHint': 'Wir verwenden diese Präferenz beim Checkout, wenn möglich.',
  'account.profile.shippingAddress': 'Lieferadresse',
  'account.profile.save': 'Änderungen speichern',
  'account.profile.odooSyncWarning':
    'Änderungen in Ihrem Konto gespeichert, aber die Odoo-Synchronisation ist fehlgeschlagen. Versuchen Sie es später erneut oder kontaktieren Sie uns.',
  'account.profile.saving': 'Wird gespeichert…',
  'account.section.orders.title': 'Ihre Bestellungen',
  'account.section.orders.description': 'Kaufhistorie und Zahlungsstatus.',
  'account.section.profile.title': 'Profil',
  'account.section.profile.description': 'Persönliche Daten, Adresse und bevorzugte Zahlung aktualisieren.',
  'account.section.overview.description': 'Bestellungen, Profil und Merkliste in Ihrem Konto verwalten.',
  'account.meta.customer': 'Kunde',
  'account.meta.email': 'E-Mail',
  'account.meta.phone': 'Telefon',
  'account.meta.shippingAddress': 'Lieferadresse',
  'account.meta.preferredPayment': 'Bevorzugte Zahlung',
  'account.meta.orders': 'Bestellungen',
  'account.orders.emptyTitle': 'Keine Bestellungen',
  'account.orders.emptyDescription': 'Ihre Einkäufe erscheinen hier.',
  'account.orders.track': 'Verfolgen →',
  'account.orders.reorder': 'Nachbestellen',
  'account.orders.itemCount': '{count} Artikel',
  'account.orders.table.order': 'Bestellung',
  'account.orders.table.date': 'Datum',
  'account.orders.table.total': 'Gesamt',
  'account.orders.table.status': 'Status',
  'account.orders.table.detail': 'Details',
  'account.orders.table.reorder': 'Erneut bestellen',
  'account.orders.table.reordering': 'Wird erneut bestellt…',
  'orders.detail.loading': 'Bestellung wird geladen…',
  'orders.detail.back': 'Zurück zu Bestellungen',
  'orders.detail.reorder': 'Erneut bestellen',
  'orders.detail.items': 'Artikel',
  'orders.detail.quantity': 'Menge {count}',
  'orders.detail.orderStatus': 'Bestellstatus',
  'orders.detail.paymentStatus': 'Zahlung',
  'orders.detail.total': 'Gesamt',
  'orders.detail.date': 'Datum',
  'orders.detail.pwaRef': 'PWA-Ref.',
  'orders.detail.completeOrder': 'Bestellung abschließen',
  'orders.detail.invoicePortal': 'Rechnung und Details im Odoo-Portal verfügbar.',
  'orders.reorder.success': 'Produkte zum Warenkorb hinzugefügt',
  'orders.reorder.error': 'Erneute Bestellung nicht möglich',
  'impersonate.invalidLink': 'Ungültiger Impersonations-Link.',
  'impersonate.expiredLink': 'Link abgelaufen oder ungültig. Fordern Sie einen neuen im Backoffice an.',
  'impersonate.loading': 'Anmeldung als Kunde…',
  'breadcrumb.home': 'Startseite',
  'category.products': 'Produkte',
  'legal.terms': 'AGB',
  'legal.privacy': 'Datenschutz',
  'paymentMethod.stripe': 'Kredit- / Debitkarte',
  'paymentMethod.stripeDescription': 'Visa, Mastercard, Amex, Apple Pay und Google Pay',
  'paymentMethod.bankTransfer': 'Banküberweisung',
  'paymentMethod.bankTransferDescription': 'Bestellung bestätigen und sofort IBAN und Verwendungszweck erhalten',
  'orderStatus.cart_created': 'Warenkorb erstellt',
  'orderStatus.checkout_started': 'Checkout gestartet',
  'orderStatus.payment_started': 'Zahlung gestartet',
  'orderStatus.payment_pending': 'Zahlung ausstehend',
  'orderStatus.paid': 'Bezahlt',
  'orderStatus.paid_sync_pending': 'Bezahlt, Synchronisierung ausstehend',
  'orderStatus.synced': 'Bestätigt',
  'orderStatus.payment_failed': 'Zahlung fehlgeschlagen',
  'orderStatus.abandoned': 'Abgebrochen',
  'orderStatus.cancelled': 'Storniert',
  'orderStatus.confirmed': 'Bestätigt',
  'orderStatus.completed': 'Abgeschlossen',
  'paymentStatus.not_started': 'Nicht gestartet',
  'paymentStatus.created': 'Erstellt',
  'paymentStatus.pending': 'Ausstehend',
  'paymentStatus.captured': 'Bezahlt',
  'paymentStatus.failed': 'Fehlgeschlagen',
  'paymentStatus.cancelled': 'Storniert',
  'paymentStatus.refunded': 'Erstattet',
  'checkout.payment.orPayWithCard': 'Oder mit Karte bezahlen',
  'checkout.payment.orderSr': 'Bestellung {orderId}',
  'checkout.payment.prepareError': 'Zahlung konnte nicht vorbereitet werden.',
  'checkout.payment.failed': 'Zahlung fehlgeschlagen',
  'checkout.payment.cardholderName': 'Name auf der Karte',
  'checkout.payment.cardholderNamePlaceholder': 'Wie auf der Karte angegeben',
  'checkout.payment.cardholderNameRequired': 'Bitte geben Sie den Namen des Karteninhabers ein.',
  'checkout.payment.formNotReady': 'Das Zahlungsformular ist noch nicht bereit. Bitte kurz warten und erneut versuchen.',
  'checkout.payment.cardIncomplete': 'Bitte vervollständigen Sie die Kartendaten vor der Zahlung.',
  'checkout.emailPlaceholder': 'email@beispiel.de',
  'checkout.error.incompleteAddress':
    'E-Mail und Lieferadresse ausfüllen (und Rechnungsadresse, falls abweichend).',
  'checkout.error.generic': 'Checkout-Fehler',
  'checkout.error.missingOrder': 'Checkout-Bestellung fehlt',
  'checkout.error.missingPayment': 'Zahlung fehlt',
  'checkout.error.orderUnavailable': 'Bestellung nach Bestätigung nicht verfügbar',
  'checkout.error.alreadyPaid': 'Diese Bestellung ist bereits bezahlt.',
  'checkout.shipping.eta': 'Voraussichtliche Lieferung ~{days} Werktage',
  'checkout.address.typeToSearch': 'Adresse eingeben…',
  'breadcrumb.nav': 'Brotkrumen-Navigation',
  'language.switcher.current': 'Sprache: {locale}. Sprache ändern',
  'language.switcher.other': 'Weitere Sprachen',
  'theme.switcher.title': 'Klassisches, schwarzes oder dunkles Design',
  'theme.switcher.toLight': 'Zum schwarzen Design wechseln',
  'theme.switcher.toDark': 'Zum dunklen Design wechseln',
  'theme.switcher.toClassic': 'Zum klassischen (braunen) Design wechseln',
  'skeleton.loadingProducts': 'Produkte werden geladen…',
  'skeleton.loadingCart': 'Warenkorb wird geladen…',
  'skeleton.loadingCartSummary': 'Warenkorbübersicht wird geladen…',
  'skeleton.loadingProduct': 'Produkt wird geladen…',
  'skeleton.loadingCheckout': 'Checkout wird geladen…',
  'skeleton.loadingPageHeader': 'Seitenkopf wird geladen',
  'skeleton.loadingForm': 'Formular wird geladen',
  'skeleton.loadingPaymentResult': 'Zahlungsergebnis wird geladen',
  'skeleton.loadingCatalogFilters': 'Shop-Filter werden geladen',
  'skeleton.loadingAccount': 'Kontobereich wird geladen',
  'skeleton.loadingList': 'Liste wird geladen…',
}

export const MAP: Record<PwaLocale, Record<MessageKey, string>> = {
  IT,
  EN,
  ES,
  FR,
  DE,
}

export function t(locale: PwaLocale, key: MessageKey): string {
  return MAP[locale][key] ?? IT[key] ?? key
}

export function tParams(
  locale: PwaLocale,
  key: MessageKey,
  params: Record<string, string | number>,
): string {
  let text = t(locale, key)
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
  }
  return text
}
