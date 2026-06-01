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

export const v1Router = Router()

v1Router.use('/auth', authRouter)
v1Router.use('/catalog', catalogRouter)
v1Router.use('/wishlist', wishlistRouter)
v1Router.use('/cart', cartRouter)
v1Router.use('/shipping', shippingRouter)
v1Router.use('/admin/shipping', shippingAdminRouter)
v1Router.use('/checkout', checkoutRouter)
v1Router.use('/payments', paymentsRouter)
v1Router.use('/orders', ordersRouter)
v1Router.use('/users', usersRouter)
v1Router.use('/integrations', integrationsApiRouter)
