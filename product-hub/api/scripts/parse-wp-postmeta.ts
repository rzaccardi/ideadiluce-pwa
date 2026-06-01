/**
 * Estrae meta WooCommerce rilevanti dalle righe INSERT wpidl_postmeta.
 */
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'

const WOO_UPLOADS = 'https://ideadiluce.com/wp-content/uploads/'

export type PostMetaMaps = {
  thumbnailIdByPost: Map<number, number>
  galleryIdsByPost: Map<number, number[]>
  attachedFileByAttachment: Map<number, string>
  variantAttributeByPost: Map<number, Record<string, string>>
  productExcerptByPost: Map<number, string>
  productContentByPost: Map<number, string>
  attachmentGuidByPost: Map<number, string>
}

const META_KEYS = new Set([
  '_thumbnail_id',
  '_product_image_gallery',
  '_wp_attached_file',
])

function unescapeSql(s: string): string {
  return s.replace(/\\'/g, "'").replace(/\\\\/g, '\\')
}

/** Tuple postmeta: (meta_id, post_id, 'key', 'value') — value senza apici interni per le chiavi che ci interessano. */
function extractPostmetaTuples(line: string): Array<{ postId: number; key: string; value: string }> {
  const out: Array<{ postId: number; key: string; value: string }> = []
  const re =
    /\(\d+,(\d+),'(_thumbnail_id|_product_image_gallery|_wp_attached_file|attribute_[^']+)','([^']*)'\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(line)) !== null) {
    out.push({
      postId: Number(m[1]),
      key: m[2],
      value: unescapeSql(m[3]),
    })
  }
  return out
}

/** Da riga posts WP: attachment guid (URL completo) — colonne fisse, post_type attachment. */
function extractAttachmentGuids(line: string): Array<{ id: number; guid: string }> {
  const out: Array<{ id: number; guid: string }> = []
  const re =
    /\((\d+),\d+,'[^']*','[^']*','[^']*','[^']*','[^']*','[^']*','[^']*','[^']*','[^']*','[^']*','[^']*','[^']*',(\d+),'(https:\/\/ideadiluce\.com\/wp-content\/uploads\/[^']+)',0,'attachment','[^']+',0\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(line)) !== null) {
    out.push({ id: Number(m[1]), guid: m[3] })
  }
  return out
}

/** Estratto semplificato post_content / post_excerpt per product (post_type product, publish). */
function extractProductContent(line: string): Array<{ id: number; excerpt: string; content: string }> {
  const out: Array<{ id: number; excerpt: string; content: string }> = []
  // Cerca pattern ,ID,...,'product','...',0) con excerpt/content embedded — troppo fragile su righe intere.
  // Usiamo regex più stretto: post_type 'product' dopo guid
  const chunks = line.split("),'product',")
  for (let i = 1; i < chunks.length; i++) {
    const chunk = chunks[i]
    const idMatch = /\((\d+),/.exec(chunks[i - 1].slice(-30) + '(' + chunk.slice(0, 5))
    if (!idMatch) continue
    // skip — parsing full posts too fragile
  }
  return out
}

export function attachmentUrl(
  attachmentId: number,
  attachedFileByAttachment: Map<number, string>,
  attachmentGuidByPost: Map<number, string>,
): string | null {
  const guid = attachmentGuidByPost.get(attachmentId)
  if (guid?.startsWith('http')) return guid
  const path = attachedFileByAttachment.get(attachmentId)
  if (path) return `${WOO_UPLOADS}${path.replace(/^\//, '')}`
  return null
}

export async function loadPostMetaFromDump(dumpPath: string): Promise<PostMetaMaps> {
  const thumbnailIdByPost = new Map<number, number>()
  const galleryIdsByPost = new Map<number, number[]>()
  const attachedFileByAttachment = new Map<number, string>()
  const variantAttributeByPost = new Map<number, Record<string, string>>()
  const productExcerptByPost = new Map<number, string>()
  const productContentByPost = new Map<number, string>()
  const attachmentGuidByPost = new Map<number, string>()

  const rl = createInterface({ input: createReadStream(dumpPath, { encoding: 'utf8' }) })

  for await (const line of rl) {
    if (line.includes('INSERT INTO `wpidl_postmeta`')) {
      for (const { postId, key, value } of extractPostmetaTuples(line)) {
        if (key === '_thumbnail_id' && /^\d+$/.test(value)) {
          thumbnailIdByPost.set(postId, Number(value))
        } else if (key === '_product_image_gallery' && value) {
          const ids = value
            .split(',')
            .map((s) => Number(s.trim()))
            .filter((n) => n > 0)
          if (ids.length) galleryIdsByPost.set(postId, ids)
        } else if (key === '_wp_attached_file' && value) {
          attachedFileByAttachment.set(postId, value)
        } else if (key.startsWith('attribute_') && value) {
          const attrs = variantAttributeByPost.get(postId) ?? {}
          const name = key.replace(/^attribute_/, '').replace(/^pa_/, '')
          attrs[name] = value
          variantAttributeByPost.set(postId, attrs)
        }
      }
    }
    if (line.includes('INSERT INTO `wpidl_posts`') && line.includes('attachment')) {
      for (const { id, guid } of extractAttachmentGuids(line)) {
        attachmentGuidByPost.set(id, guid)
      }
    }
  }

  return {
    thumbnailIdByPost,
    galleryIdsByPost,
    attachedFileByAttachment,
    variantAttributeByPost,
    productExcerptByPost,
    productContentByPost,
    attachmentGuidByPost,
  }
}

export function resolveGalleryUrls(
  postId: number,
  maps: PostMetaMaps,
): string[] {
  const urls: string[] = []
  const seen = new Set<string>()

  const add = (id: number) => {
    const url = attachmentUrl(id, maps.attachedFileByAttachment, maps.attachmentGuidByPost)
    if (url && !seen.has(url)) {
      seen.add(url)
      urls.push(url)
    }
  }

  const thumb = maps.thumbnailIdByPost.get(postId)
  if (thumb) add(thumb)

  const gallery = maps.galleryIdsByPost.get(postId) ?? []
  for (const id of gallery) add(id)

  return urls
}
