import { Router } from 'express'
import { authRouter } from '../../modules/auth/auth.routes.js'
import { catalogRouter } from '../../modules/catalog/catalog.routes.js'
import { wishlistRouter } from '../../modules/wishlist/wishlist.routes.js'
import { cartRouter } from '../../modules/cart/cart.routes.js'
import { checkoutRouter } from '../../modules/checkout/checkout.routes.js'
import { ordersRouter } from '../../modules/orders/orders.routes.js'
import { paymentsRouter } from '../../modules/payments/payments.routes.js'
import { usersRouter } from '../../modules/users/users.routes.js'
import { integrationsApiRouter } from '../../modules/integrations/integrations.routes.js'
import { shippingRouter } from '../../modules/shipping/shipping.routes.js'
import { shippingAdminRouter } from '../../modules/shipping/shipping.admin.routes.js'
import { socialProofAdminRouter } from '../../modules/social-proof/social-proof-admin.routes.js'
import { ordersAdminRouter } from '../../modules/orders-admin/orders-admin.routes.js'
import { abandonedCartsAdminRouter } from '../../modules/abandoned-carts-admin/abandoned-carts-admin.routes.js'
import { adminAuthRouter } from '../../modules/admin-auth/admin-auth.routes.js'
import { addressRouter } from '../../modules/address/address.routes.js'
import { seoRouter } from '../../modules/seo/seo.routes.js'
import { siteRouter } from '../../modules/site/site.routes.js'
import { siteAdminRouter } from '../../modules/site/site-admin.routes.js'
import { siteGuidesAdminRouter } from '../../modules/site-guides/site-guides-admin.routes.js'
import { professionalAccountRouter } from '../../modules/professional-account/professional-account.routes.js'
import { professionalRequestsAdminRouter } from '../../modules/professional-requests-admin/professional-requests-admin.routes.js'
import { odooAdminRouter } from '../../modules/odoo/odoo-admin.routes.js'
import { quotesRouter } from '../../modules/quotes/quotes.routes.js'
import { invoicesRouter } from '../../modules/invoices/invoices.routes.js'
import { integrationLogsAdminRouter } from '../../modules/integration-logs-admin/integration-logs-admin.routes.js'
import { documentDownloadsAdminRouter } from '../../modules/document-downloads-admin/document-downloads-admin.routes.js'
import { restockAdminRouter } from '../../modules/restock-admin/restock-admin.routes.js'

import { taxAdminRouter } from '../../modules/tax/tax.admin.routes.js'
import { taxRouter, vatRouter } from '../../modules/tax/tax.routes.js'

export const v1Router = Router()

v1Router.use('/auth', authRouter)
v1Router.use('/address', addressRouter)
v1Router.use('/catalog', catalogRouter)
v1Router.use('/seo', seoRouter)
v1Router.use('/site', siteRouter)
v1Router.use('/site/professional-requests', professionalAccountRouter)
v1Router.use('/admin/site', siteAdminRouter)
v1Router.use('/admin/guides', siteGuidesAdminRouter)
v1Router.use('/wishlist', wishlistRouter)
v1Router.use('/cart', cartRouter)
v1Router.use('/tax', taxRouter)
v1Router.use('/vat', vatRouter)
v1Router.use('/shipping', shippingRouter)
v1Router.use('/admin/auth', adminAuthRouter)
v1Router.use('/admin/shipping', shippingAdminRouter)
v1Router.use('/admin/tax-rules', taxAdminRouter)
v1Router.use('/admin/social-proof', socialProofAdminRouter)
v1Router.use('/admin/orders', ordersAdminRouter)
v1Router.use('/admin/abandoned-carts', abandonedCartsAdminRouter)
v1Router.use('/admin/professional-requests', professionalRequestsAdminRouter)
v1Router.use('/admin/odoo', odooAdminRouter)
v1Router.use('/admin/integration-logs', integrationLogsAdminRouter)
v1Router.use('/admin/document-downloads', documentDownloadsAdminRouter)
v1Router.use('/admin/customers/restock-requests', restockAdminRouter)
v1Router.use('/checkout', checkoutRouter)
v1Router.use('/quotes', quotesRouter)
v1Router.use('/invoices', invoicesRouter)
v1Router.use('/payments', paymentsRouter)
v1Router.use('/orders', ordersRouter)
v1Router.use('/users', usersRouter)
v1Router.use('/integrations', integrationsApiRouter)
