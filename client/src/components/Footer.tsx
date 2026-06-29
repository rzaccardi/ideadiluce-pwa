'use client'

import { Container } from '@/components/Container'
import { useI18n } from '@/hooks/use-i18n'

export function Footer() {
  const { t } = useI18n()

  return (
    <footer className="mt-auto border-t border-zinc-200 bg-idl-tech-panel py-8 text-zinc-500">
      <Container className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>{t('footer.tagline')}</p>
      </Container>
    </footer>
  )
}
