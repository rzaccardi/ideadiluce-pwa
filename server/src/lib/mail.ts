import nodemailer from 'nodemailer'
import { env } from '../config/env.js'
import { logger } from './logger.js'

let transporter: nodemailer.Transporter | null = null

/** True se SMTP di fallback è configurato per consegna reale (non solo log `mail.dev`). */
export function isSmtpConfigured(): boolean {
  return Boolean(env.SMTP_ENABLED && env.SMTP_HOST)
}

function getTransporter(): nodemailer.Transporter | null {
  if (!isSmtpConfigured()) return null
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
          : undefined,
    })
  }
  return transporter
}

export async function sendMail(options: {
  to: string
  subject: string
  text: string
  html?: string
  replyTo?: string
  attachments?: Array<{ filename: string; content: Buffer }>
}): Promise<void> {
  const from = env.SMTP_FROM ?? 'noreply@ideadiluce.it'
  const transport = getTransporter()

  if (!transport) {
    logger.warn('mail.dev', {
      to: options.to,
      subject: options.subject,
      text: options.text,
      hint: 'SMTP_ENABLED/SMTP_HOST assenti: messaggio non consegnato, solo log locale',
    })
    return
  }

  await transport.sendMail({
    from,
    to: options.to,
    replyTo: options.replyTo,
    subject: options.subject,
    text: options.text,
    html: options.html ?? options.text.replace(/\n/g, '<br>'),
    attachments: options.attachments,
  })
}

export function publicAppUrl(path: string): string {
  const base = (env.APP_PUBLIC_URL ?? env.PUBLIC_SITE_URL).replace(/\/$/, '')
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}
