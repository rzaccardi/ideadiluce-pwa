import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../types/errors.js'
import {
  importSocialProofFromOdoo,
  odooSocialProofAvailable,
} from '../../adapters/odoo/odooSocialProofImport.js'
import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'
import {
  getSocialProofSettings,
  mapSettingsRow,
  type SocialProofSettingsDTO,
} from './social-proof.settings.js'

export type SocialProofAdminSettingsDTO = SocialProofSettingsDTO & {
  odooConfigured: boolean
  cachedOdooEvents: number
}

export const socialProofAdminService = {
  async getSettings(): Promise<SocialProofAdminSettingsDTO> {
    const row = await getSocialProofSettings()
    const cachedOdooEvents = await prisma.socialProofOdooEvent.count()
    return {
      ...mapSettingsRow(row),
      // Feed unificato: se Odoo è configurato, lo storico entra sempre nel social proof.
      odooImportEnabled: odooSocialProofAvailable() ? true : row.odooImportEnabled,
      odooConfigured: odooSocialProofAvailable(),
      cachedOdooEvents,
    }
  },

  async patchSettings(
    input: Partial<{
      enabled: boolean
      minQuantity: number
      lookbackDays: number
      maxEvents: number
      odooImportEnabled: boolean
    }>,
  ): Promise<SocialProofAdminSettingsDTO> {
    // odooImportEnabled non è più un toggle: con Odoo configurato lo storico è sempre nel feed.
    const data: {
      enabled?: boolean
      minQuantity?: number
      lookbackDays?: number
      maxEvents?: number
    } = {}
    if (input.enabled !== undefined) data.enabled = input.enabled
    if (input.minQuantity !== undefined) data.minQuantity = input.minQuantity
    if (input.lookbackDays !== undefined) data.lookbackDays = input.lookbackDays
    if (input.maxEvents !== undefined) data.maxEvents = input.maxEvents

    if (Object.keys(data).length === 0) {
      return this.getSettings()
    }

    await getSocialProofSettings()
    await prisma.socialProofSettings.update({
      where: { id: 'default' },
      data,
    })
    return this.getSettings()
  },

  async syncFromOdoo(ctx: OdooCallContext): Promise<{
    imported: number
    deletedStale: number
    skippedPwa: number
    settings: SocialProofAdminSettingsDTO
  }> {
    if (!odooSocialProofAvailable()) {
      throw new AppError(
        'ODOO_NOT_CONFIGURED',
        'Odoo not configured',
        'Configura Odoo (ODOO_ENABLED, credenziali) per sincronizzare lo storico ordini.',
        400,
        false,
      )
    }

    const row = await getSocialProofSettings()

    try {
      const result = await importSocialProofFromOdoo(ctx, row.lookbackDays)
      await prisma.socialProofSettings.update({
        where: { id: 'default' },
        data: {
          odooImportEnabled: true,
          odooLastSyncAt: new Date(),
          odooLastSyncCount: result.imported,
          odooLastSyncError: null,
        },
      })
      return {
        ...result,
        settings: await this.getSettings(),
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Errore import Odoo'
      await prisma.socialProofSettings.update({
        where: { id: 'default' },
        data: { odooLastSyncError: msg.slice(0, 500) },
      })
      throw e
    }
  },
}
