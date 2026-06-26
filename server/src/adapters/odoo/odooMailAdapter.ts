import { env } from '../../config/env.js'
import { sendMail } from '../../lib/mail.js'
import { logger } from '../../lib/logger.js'
import { normalizeOdooCreateId } from './odooId.js'
import { isOdooConfigured, odooExecuteKw, type OdooCallContext } from './odooClient.js'

export type OdooMailInput = {
  emailTo: string
  subject: string
  bodyText: string
  bodyHtml?: string
}

/** Invia email transazionale tramite Odoo (`mail.mail`); fallback SMTP PWA se Odoo off. */
export async function sendOdooTransactionalMail(
  ctx: OdooCallContext,
  input: OdooMailInput,
): Promise<void> {
  const to = input.emailTo.toLowerCase().trim()

  if (!env.ODOO_ENABLED || !isOdooConfigured()) {
    await sendMail({ to, subject: input.subject, text: input.bodyText })
    return
  }

  try {
    const bodyHtml = input.bodyHtml ?? input.bodyText.replace(/\n/g, '<br>')
    const created = await odooExecuteKw<unknown>(
      ctx,
      'mail.mail',
      'create',
      [
        {
          email_to: to,
          subject: input.subject,
          body_html: `<div>${bodyHtml}</div>`,
          body: input.bodyText,
          auto_delete: true,
        },
      ],
      {},
    )
    const mailId = normalizeOdooCreateId(created)
    await odooExecuteKw(ctx, 'mail.mail', 'send', [[mailId]], {})
  } catch (e) {
    logger.warn('odoo.mail_send_failed', {
      correlationId: ctx.correlationId,
      to,
      error: e instanceof Error ? e.message : String(e),
    })
    await sendMail({ to, subject: input.subject, text: input.bodyText })
  }
}
