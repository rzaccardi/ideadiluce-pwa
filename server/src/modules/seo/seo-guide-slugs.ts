import { siteGuideRepository } from '../site-guides/site-guides.repository.js'
import { AMBIENTI_ROOM_SLUGS } from './seo-sitemap.constants.js'

/** Guide pubblicate e indicizzabili (da BO → SiteGuide). */
export async function listIndexedGuideSlugs(): Promise<string[]> {
  const guides = await siteGuideRepository.listAll()
  return guides.filter((g) => g.published && g.indexed).map((g) => g.slug)
}

export function listAmbienteRoomSlugs(): string[] {
  return [...AMBIENTI_ROOM_SLUGS]
}
