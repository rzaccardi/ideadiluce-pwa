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
    if (input.odooImportEnabled && !odooSocialProofAvailable()) {
      throw new AppError(
        'ODOO_NOT_CONFIGURED',
        'Odoo not configured',
        'Abilita e configura Odoo (ODOO_ENABLED, credenziali) prima di importare gli ordini.',
        400,
        false,
      )
    }

    await getSocialProofSettings()
    const row = await prisma.socialProofSettings.update({
      where: { id: 'default' },
      data: input,
    })
    const cachedOdooEvents = await prisma.socialProofOdooEvent.count()
    return {
      ...mapSettingsRow(row),
      odooConfigured: odooSocialProofAvailable(),
      cachedOdooEvents,
    }
  },

  async syncFromOdoo(ctx: OdooCallContext): Promise<{
    imported: number
    deletedStale: number
    settings: SocialProofAdminSettingsDTO
  }> {
    const row = await getSocialProofSettings()
    if (!row.odooImportEnabled) {
      throw new AppError(
        'ODOO_IMPORT_DISABLED',
        'Odoo import disabled',
        'Attiva l’import da Odoo nelle impostazioni social proof.',
        400,
        false,
      )
    }

    try {
      const result = await importSocialProofFromOdoo(ctx, row.lookbackDays)
      const updated = await prisma.socialProofSettings.update({
        where: { id: 'default' },
        data: {
          odooLastSyncAt: new Date(),
          odooLastSyncCount: result.imported,
          odooLastSyncError: null,
        },
      })
      const cachedOdooEvents = await prisma.socialProofOdooEvent.count()
      return {
        ...result,
        settings: {
          ...mapSettingsRow(updated),
          odooConfigured: odooSocialProofAvailable(),
          cachedOdooEvents,
        },
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
