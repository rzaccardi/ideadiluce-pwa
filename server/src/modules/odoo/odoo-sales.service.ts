// @ts-nocheck
import { detectOdooOrderSource, ODOO_ORDER_SOURCE_LABEL } from './odoo-order-source.js';
export { detectOdooOrderSource, ODOO_ORDER_SOURCE_LABEL };
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { odooExecuteKw } from '../../adapters/odoo/odooClient.js';
import { AppError } from '../../types/errors.js';
const PRICELIST_DESIRED_FIELDS = [
    'id',
    'name',
    'active',
    'currency_id',
    'company_id',
    'discount_policy',
    'item_ids',
];
const SALE_ORDER_DESIRED_FIELDS = [
    'id',
    'name',
    'state',
    'date_order',
    'amount_total',
    'amount_untaxed',
    'amount_tax',
    'currency_id',
    'partner_id',
    'invoice_status',
    'validity_date',
    'commitment_date',
    'client_order_ref',
    'pricelist_id',
    'order_line',
    'origin',
    'website_id',
    'x_pwa_cart_token',
    'x_pwa_session_id',
    'x_pwa_checkout_status',
];
let pricelistFieldsCache = null;
let saleOrderFieldsCache = null;
function many2OneId(value) {
    return Array.isArray(value) ? value[0] : null;
}
function many2OneName(value) {
    return Array.isArray(value) ? value[1] : null;
}
function text(value) {
    return typeof value === 'string' && value.trim() ? value : null;
}
function moneyToCents(value) {
    return typeof value === 'number' && Number.isFinite(value) ? Math.round(value * 100) : null;
}
function totalPages(total, pageSize) {
    return Math.max(1, Math.ceil(total / pageSize));
}
function dateFloorForDays(days) {
    return new Date(Date.now() - days * 86400000).toISOString().slice(0, 19).replace('T', ' ');
}
function saleOrderContext() {
    return { lang: env.ODOO_CATALOG_LANG };
}
async function availableModelFields(ctx, model, cache) {
    if (cache.current)
        return cache.current;
    const fields = await odooExecuteKw(ctx, model, 'fields_get', [], {
        attributes: ['string'],
        context: saleOrderContext(),
    });
    cache.current = new Set(Object.keys(fields));
    return cache.current;
}
async function pricelistReadFields(ctx) {
    const available = await availableModelFields(ctx, 'product.pricelist', {
        current: pricelistFieldsCache,
    });
    pricelistFieldsCache = available;
    return PRICELIST_DESIRED_FIELDS.filter((f) => available.has(f));
}
async function saleOrderReadFields(ctx) {
    const available = await availableModelFields(ctx, 'sale.order', { current: saleOrderFieldsCache });
    saleOrderFieldsCache = available;
    return SALE_ORDER_DESIRED_FIELDS.filter((f) => available.has(f));
}
function mapSaleOrder(row, partnerEmail) {
    const source = detectOdooOrderSource({
        clientOrderRef: text(row.client_order_ref),
        origin: text(row.origin),
        websiteId: many2OneId(row.website_id),
        xPwaCartToken: text(row.x_pwa_cart_token),
        xPwaSessionId: text(row.x_pwa_session_id),
        xPwaCheckoutStatus: text(row.x_pwa_checkout_status),
        dateOrder: text(row.date_order),
    });
    return {
        id: row.id,
        name: text(row.name) ?? `SO${row.id}`,
        state: text(row.state) ?? 'unknown',
        dateOrder: text(row.date_order),
        amountTotalCents: moneyToCents(row.amount_total),
        amountUntaxedCents: moneyToCents(row.amount_untaxed),
        amountTaxCents: moneyToCents(row.amount_tax),
        currencyCode: many2OneName(row.currency_id),
        partnerId: many2OneId(row.partner_id),
        partnerName: many2OneName(row.partner_id),
        partnerEmail: partnerEmail ?? null,
        invoiceStatus: text(row.invoice_status),
        validityDate: text(row.validity_date),
        commitmentDate: text(row.commitment_date),
        clientOrderRef: text(row.client_order_ref),
        origin: text(row.origin),
        pricelistId: many2OneId(row.pricelist_id),
        pricelistName: many2OneName(row.pricelist_id),
        lineCount: Array.isArray(row.order_line) ? row.order_line.length : 0,
        source,
        sourceLabel: ODOO_ORDER_SOURCE_LABEL[source],
    };
}
function mapSaleOrderLine(row) {
    return {
        id: row.id,
        productId: many2OneId(row.product_id),
        productName: many2OneName(row.product_id) ?? text(row.name),
        quantity: typeof row.product_uom_qty === 'number' ? row.product_uom_qty : 0,
        unitPriceCents: moneyToCents(row.price_unit),
        subtotalCents: moneyToCents(row.price_subtotal),
    };
}
function mapPricelist(row) {
    return {
        id: row.id,
        name: text(row.name) ?? `Listino ${row.id}`,
        active: row.active !== false,
        currencyCode: many2OneName(row.currency_id),
        companyName: many2OneName(row.company_id),
        discountPolicy: text(row.discount_policy),
        itemCount: Array.isArray(row.item_ids) ? row.item_ids.length : 0,
    };
}
async function findPartnerRowsByEmail(ctx, email, limit = 10) {
    return odooExecuteKw(ctx, 'res.partner', 'search_read', [[['email', 'ilike', email.toLowerCase().trim()]]], {
        fields: ['id', 'name', 'email', 'property_product_pricelist'],
        limit,
        context: saleOrderContext(),
    });
}
async function partnerIdsForQuery(ctx, query) {
    if (query.partnerId != null)
        return [query.partnerId];
    if (!query.email?.trim())
        return null;
    const partners = await findPartnerRowsByEmail(ctx, query.email);
    return partners.map((p) => p.id);
}
async function saleDocumentList(ctx, query, defaultStates) {
    const partnerIds = await partnerIdsForQuery(ctx, query);
    if (partnerIds?.length === 0) {
        return {
            items: [],
            page: query.page,
            pageSize: query.pageSize,
            total: 0,
            totalPages: 1,
            configured: true,
        };
    }
    const states = query.state ? [query.state] : defaultStates;
    const domain = [['state', 'in', states]];
    if (partnerIds)
        domain.push(['partner_id', 'in', partnerIds]);
    if (query.days)
        domain.push(['date_order', '>=', dateFloorForDays(query.days)]);
    const q = query.q?.trim();
    if (q) {
        domain.push('|', ['name', 'ilike', q], ['partner_id', 'ilike', q]);
    }
    const offset = (query.page - 1) * query.pageSize;
    const readFields = await saleOrderReadFields(ctx);
    const [total, rows] = await Promise.all([
        odooExecuteKw(ctx, 'sale.order', 'search_count', [domain], {
            context: saleOrderContext(),
        }),
        odooExecuteKw(ctx, 'sale.order', 'search_read', [domain], {
            fields: readFields,
            limit: query.pageSize,
            offset,
            order: 'date_order desc, id desc',
            context: saleOrderContext(),
        }),
    ]);
    const rowPartnerIds = [...new Set(rows.map((r) => many2OneId(r.partner_id)).filter((id) => id != null))];
    const partnerEmails = new Map();
    if (rowPartnerIds.length > 0) {
        const partners = await odooExecuteKw(ctx, 'res.partner', 'read', [rowPartnerIds], { fields: ['email'], context: saleOrderContext() });
        for (const p of partners) {
            const email = text(p.email);
            if (email)
                partnerEmails.set(p.id, email);
        }
    }
    return {
        items: rows.map((row) => mapSaleOrder(row, partnerEmails.get(many2OneId(row.partner_id) ?? -1) ?? null)),
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: totalPages(total, query.pageSize),
        configured: true,
    };
}
export const odooSalesService = {
    listConfirmedOrders(ctx, query) {
        return saleDocumentList(ctx, query, ['sale', 'done']);
    },
    listQuotations(ctx, query) {
        return saleDocumentList(ctx, query, ['draft', 'sent']);
    },
    async listPricelists(ctx, query) {
        const domain = [];
        if (query.active != null)
            domain.push(['active', '=', query.active]);
        if (query.q?.trim())
            domain.push(['name', 'ilike', query.q.trim()]);
        const offset = (query.page - 1) * query.pageSize;
        const readFields = await pricelistReadFields(ctx);
        const [total, rows] = await Promise.all([
            odooExecuteKw(ctx, 'product.pricelist', 'search_count', [domain], {
                context: saleOrderContext(),
            }),
            odooExecuteKw(ctx, 'product.pricelist', 'search_read', [domain], {
                fields: readFields,
                limit: query.pageSize,
                offset,
                order: 'name asc',
                context: saleOrderContext(),
            }),
        ]);
        return {
            items: rows.map(mapPricelist),
            page: query.page,
            pageSize: query.pageSize,
            total,
            totalPages: totalPages(total, query.pageSize),
            configured: true,
        };
    },
    async findPartnerPricelist(ctx, partnerId) {
        const rows = await odooExecuteKw(ctx, 'res.partner', 'read', [[partnerId]], { fields: ['id', 'name', 'email', 'property_product_pricelist'], context: saleOrderContext() });
        const partner = rows[0];
        if (!partner)
            return null;
        return {
            partnerId: partner.id,
            partnerName: text(partner.name),
            partnerEmail: text(partner.email),
            pricelistId: many2OneId(partner.property_product_pricelist),
            pricelistName: many2OneName(partner.property_product_pricelist),
        };
    },
    async assignPricelistToPartner(ctx, partnerId, pricelistId) {
        await odooExecuteKw(ctx, 'res.partner', 'write', [[partnerId], { property_product_pricelist: pricelistId }], { context: saleOrderContext() });
        const updated = await this.findPartnerPricelist(ctx, partnerId);
        if (!updated) {
            throw new AppError('ODOO_PARTNER_NOT_FOUND', 'Odoo partner not found after pricelist assignment', 'Cliente Odoo non trovato dopo l’assegnazione listino.', 404, false);
        }
        return updated;
    },
    async resolvePartnerIdForUserOrEmail(ctx, input) {
        if (input.partnerId != null) {
            return { partnerId: input.partnerId, userId: input.userId ?? null, email: input.email ?? null };
        }
        let email = input.email?.trim() || null;
        if (input.userId) {
            const user = await prisma.user.findUnique({
                where: { id: input.userId },
                select: { id: true, email: true },
            });
            if (!user) {
                throw new AppError('USER_NOT_FOUND', 'User not found', 'Utente non trovato.', 404, false);
            }
            email = email ?? user.email;
            const map = await prisma.odooCustomerMap.findUnique({ where: { userId: user.id } });
            if (map)
                return { partnerId: map.odooPartnerId, userId: user.id, email };
        }
        if (!email) {
            throw new AppError('ODOO_TARGET_MISSING', 'Missing user, email or partner', 'Indica un utente, una email o un partner Odoo.', 400, false);
        }
        const partners = await findPartnerRowsByEmail(ctx, email, 1);
        const partner = partners[0];
        if (!partner) {
            throw new AppError('ODOO_PARTNER_NOT_FOUND', 'Odoo partner not found', 'Nessun cliente Odoo trovato per questa email.', 404, false);
        }
        return { partnerId: partner.id, userId: input.userId ?? null, email };
    },
    async getOrderById(ctx, orderId) {
        const readFields = await saleOrderReadFields(ctx);
        const rows = await odooExecuteKw(ctx, 'sale.order', 'read', [[orderId]], {
            fields: readFields,
            context: saleOrderContext(),
        });
        const row = rows[0];
        if (!row)
            return null;
        let partnerEmail = null;
        const partnerId = many2OneId(row.partner_id);
        if (partnerId != null) {
            const partners = await odooExecuteKw(ctx, 'res.partner', 'read', [[partnerId]], { fields: ['email'], context: saleOrderContext() });
            partnerEmail = text(partners[0]?.email);
        }
        return mapSaleOrder(row, partnerEmail);
    },
    async getOrderLines(ctx, orderId) {
        const order = await this.getOrderById(ctx, orderId);
        if (!order)
            return [];
        const orderRows = await odooExecuteKw(ctx, 'sale.order', 'read', [[orderId]], {
            fields: ['order_line'],
            context: saleOrderContext(),
        });
        const lineIds = orderRows[0]?.order_line;
        if (!Array.isArray(lineIds) || lineIds.length === 0)
            return [];
        const lines = await odooExecuteKw(ctx, 'sale.order.line', 'read', [lineIds], {
            fields: ['product_id', 'name', 'product_uom_qty', 'price_unit', 'price_subtotal'],
            context: saleOrderContext(),
        });
        return lines.map(mapSaleOrderLine);
    },
    async getOrderNote(ctx, orderId) {
        const available = await availableModelFields(ctx, 'sale.order', { current: saleOrderFieldsCache });
        saleOrderFieldsCache = available;
        const noteField = ['note', 'internal_note'].find((f) => available.has(f));
        if (!noteField)
            return null;
        const rows = await odooExecuteKw(ctx, 'sale.order', 'read', [[orderId]], { fields: [noteField], context: saleOrderContext() });
        const row = rows[0];
        if (!row)
            return null;
        return text(row.note) ?? text(row.internal_note);
    },
    async getQuotationDetail(ctx, quotationId) {
        const row = await this.getOrderById(ctx, quotationId);
        if (!row || !['draft', 'sent'].includes(row.state))
            return null;
        const [lines, note] = await Promise.all([
            this.getOrderLines(ctx, quotationId),
            this.getOrderNote(ctx, quotationId),
        ]);
        return { ...row, note, lines };
    },
    async listInvoices(ctx, query) {
        const partnerIds = await partnerIdsForQuery(ctx, query);
        if (partnerIds?.length === 0) {
            return {
                items: [],
                page: query.page,
                pageSize: query.pageSize,
                total: 0,
                totalPages: 1,
                configured: true,
            };
        }
        const domain = [
            ['move_type', 'in', ['out_invoice', 'out_refund']],
            ['state', '!=', 'cancel'],
        ];
        if (partnerIds)
            domain.push(['partner_id', 'in', partnerIds]);
        const offset = (query.page - 1) * query.pageSize;
        const [total, rows] = await Promise.all([
            odooExecuteKw(ctx, 'account.move', 'search_count', [domain], {
                context: saleOrderContext(),
            }),
            odooExecuteKw(ctx, 'account.move', 'search_read', [domain], {
                fields: ['id', 'name', 'state', 'payment_state', 'amount_total', 'currency_id', 'invoice_date'],
                limit: query.pageSize,
                offset,
                order: 'invoice_date desc, id desc',
                context: saleOrderContext(),
            }),
        ]);
        return {
            items: rows.map((row) => ({
                id: row.id,
                name: text(row.name) ?? `INV${row.id}`,
                state: text(row.state) ?? 'unknown',
                paymentState: text(row.payment_state),
                amountTotalCents: moneyToCents(row.amount_total),
                currencyCode: many2OneName(row.currency_id),
                invoiceDate: text(row.invoice_date),
            })),
            page: query.page,
            pageSize: query.pageSize,
            total,
            totalPages: totalPages(total, query.pageSize),
            configured: true,
        };
    },
};
//# sourceMappingURL=odoo-sales.service.js.map
