import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { isSpacesConfigured, spacesPublicUrl, uploadProductImage } from '../../adapters/spaces/spaces.storage.js'
import { env } from '../../config/env.js'
import { sendMail } from '../../lib/mail.js'
import { logger } from '../../lib/logger.js'
import { prisma } from '../../lib/prisma.js'
import type { SiteInquiryInput } from './site-inquiry.validators.js'

const INQUIRY_TO = 'info@ideadiluce.com'

export function kindLabel(kind: SiteInquiryInput['kind']) {
  switch (kind) {
    case 'product-not-found':
      return 'Prodotto non trovato / ricambio'
    case 'b2b':
      return 'Attivazione account business'
    case 'professional-quote':
      return 'Richiesta preventivo / consulenza professionisti'
    default:
      return 'Contatto sito'
  }
}

type InquiryAttachment = {
  filename: string
  content: Buffer
  mimetype?: string
}

type AttachmentMeta = {
  filename: string
  url: string | null
}

async function storeInquiryAttachment(
  inquiryId: string,
  file: InquiryAttachment,
): Promise<AttachmentMeta> {
  const filename = file.filename || 'foto.jpg'
  const mimetype = file.mimetype || 'image/jpeg'

  if (isSpacesConfigured()) {
    try {
      const ext = path.extname(filename).toLowerCase() || '.jpg'
      const key = `site-inquiries/${inquiryId}/${randomUUID()}${ext}`
      const client = new S3Client({
        endpoint: env.SPACES_ENDPOINT!.trim(),
        region: env.SPACES_REGION?.trim() || 'us-east-1',
        credentials: {
          accessKeyId: env.SPACES_KEY!.trim(),
          secretAccessKey: env.SPACES_SECRET!.trim(),
        },
        forcePathStyle: false,
      })
      await client.send(
        new PutObjectCommand({
          Bucket: env.SPACES_BUCKET!.trim(),
          Key: key,
          Body: file.content,
          ContentType: mimetype,
          ACL: 'public-read',
        }),
      )
      return { filename, url: spacesPublicUrl(key) }
    } catch (err) {
      logger.warn('site.inquiry.attachment_upload_failed', {
        inquiryId,
        filename,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  try {
    const uploaded = await uploadProductImage(`inquiry-${inquiryId}`, {
      buffer: file.content,
      originalname: filename,
      mimetype,
    })
    return { filename, url: uploaded.url }
  } catch {
    return { filename, url: null }
  }
}

export const siteInquiryService = {
  async submit(input: SiteInquiryInput, attachments: InquiryAttachment[] = []) {
    const row = await prisma.siteInquiry.create({
      data: {
        kind: input.kind,
        name: input.name,
        email: input.email,
        phone: input.phone?.trim() || null,
        message: input.message?.trim() || null,
        productCode: input.productCode?.trim() || null,
        brand: input.brand?.trim() || null,
        quantity: input.quantity ?? null,
        usage: input.usage?.trim() || null,
        urgency: input.urgency?.trim() || null,
        locale: input.locale?.trim() || null,
        status: 'NEW',
      },
    })

    const attachmentMeta: AttachmentMeta[] = []
    for (const file of attachments) {
      attachmentMeta.push(await storeInquiryAttachment(row.id, file))
    }

    if (attachmentMeta.length) {
      await prisma.siteInquiry.update({
        where: { id: row.id },
        data: { attachmentMeta },
      })
    }

    const lines = [
      `Tipo: ${kindLabel(input.kind)}`,
      `Nome: ${input.name}`,
      `Email: ${input.email}`,
      input.phone ? `Telefono: ${input.phone}` : null,
      input.productCode ? `Codice/EAN: ${input.productCode}` : null,
      input.brand ? `Marca: ${input.brand}` : null,
      input.quantity ? `Quantità: ${input.quantity}` : null,
      input.usage ? `Uso: ${input.usage}` : null,
      input.urgency ? `Urgenza: ${input.urgency}` : null,
      input.locale ? `Lingua: ${input.locale}` : null,
      `ID richiesta: ${row.id}`,
      attachmentMeta.length
        ? `Allegati: ${attachmentMeta.map((a) => (a.url ? `${a.filename} (${a.url})` : a.filename)).join(', ')}`
        : null,
      '',
      input.message?.trim() || '(nessun messaggio)',
    ].filter(Boolean)

    const text = lines.join('\n')
    const subject = `[Idea di Luce] ${kindLabel(input.kind)} — ${input.name}`

    logger.info('site.inquiry', {
      id: row.id,
      kind: input.kind,
      email: input.email,
      attachments: attachments.length,
    })

    const emailAttachments = attachments.filter((_, i) => !attachmentMeta[i]?.url)
    await sendMail({
      to: INQUIRY_TO,
      subject,
      text,
      attachments: emailAttachments.length
        ? emailAttachments.map((a) => ({ filename: a.filename, content: a.content }))
        : undefined,
    })

    return { submitted: true, id: row.id }
  },
}
