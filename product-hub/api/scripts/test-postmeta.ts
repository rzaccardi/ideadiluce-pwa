import { loadPostMetaFromDump } from './parse-wp-postmeta.js'

const m = await loadPostMetaFromDump('../import/cvtg56_wp687_1780322176.sql')
console.log({
  thumbs: m.thumbnailIdByPost.size,
  galleries: m.galleryIdsByPost.size,
  files: m.attachedFileByAttachment.size,
  variantAttrs: m.variantAttributeByPost.size,
  guids: m.attachmentGuidByPost.size,
})
