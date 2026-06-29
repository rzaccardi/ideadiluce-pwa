import { z } from 'zod'

export const wpMigrationCreateRunBodySchema = z.object({
  externalJobId: z.string().min(1).max(64),
  exportType: z.string().min(1).max(64),
  options: z.record(z.unknown()).optional(),
  sourceUrl: z.string().max(2000).optional(),
})

export const wpMigrationBatchBodySchema = z.object({
  batchNumber: z.number().int().min(0),
  phase: z.string().max(64).optional(),
  processed: z.number().int().min(0).optional(),
  message: z.string().max(2000).optional(),
  rows: z.array(z.record(z.unknown())).max(100),
})

export const wpMigrationProgressBodySchema = z.object({
  phase: z.string().max(64).optional(),
  processed: z.number().int().min(0).optional(),
  message: z.string().max(2000).optional(),
  status: z.enum(['running', 'failed']).optional(),
  errorMessage: z.string().max(2000).optional(),
})

export const wpMigrationCompleteBodySchema = z.object({
  processed: z.number().int().min(0).optional(),
  message: z.string().max(2000).optional(),
})

export const wpMigrationRunsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['running', 'complete', 'failed']).optional(),
})

export const wpMigrationRecordsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  recordType: z.string().max(64).optional(),
  q: z.string().max(200).optional(),
})

export const wpMigrationRecordPatchBodySchema = z.object({
  nextjsTargetUrl: z.string().max(2000).nullable().optional(),
  seoPriority: z.string().max(64).nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
  recommendedAction: z.string().max(128).nullable().optional(),
})
