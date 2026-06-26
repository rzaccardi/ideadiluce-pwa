'use client'

import { useCallback, useState } from 'react'
import { Reveal } from '@/components/motion'
import { useLocalePath } from '@/hooks/use-locale-path'
import type { AttaccoSocketKey } from '@/lib/attacco.defaults'
import { AttaccoWizardModal } from './AttaccoWizardModal'
import { AttaccoConsultSection } from './sections/AttaccoConsultSection'
import { AttaccoGuideSection } from './sections/AttaccoGuideSection'
import { AttaccoHeroSection } from './sections/AttaccoHeroSection'
import { AttaccoSearchSection } from './sections/AttaccoSearchSection'
import { AttaccoShapeGridSection } from './sections/AttaccoShapeGridSection'
import { AttaccoSocketGridSection } from './sections/AttaccoSocketGridSection'

export function AttaccoView() {
  const lp = useLocalePath()
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1)
  const [wizardShape, setWizardShape] = useState<AttaccoSocketKey | null>(null)

  const openWizard = useCallback(() => {
    setWizardStep(1)
    setWizardShape(null)
    setWizardOpen(true)
  }, [])

  const closeWizard = useCallback(() => setWizardOpen(false), [])

  const onShape = useCallback((shape: AttaccoSocketKey) => {
    setWizardShape(shape)
    setWizardStep(3)
  }, [])

  const restartWizard = useCallback(() => {
    setWizardStep(1)
    setWizardShape(null)
  }, [])

  return (
    <div className="bg-white">
      <Reveal immediate>
        <AttaccoHeroSection lp={lp} onOpenWizard={openWizard} />
      </Reveal>
      <Reveal>
        <AttaccoSearchSection lp={lp} />
      </Reveal>
      <Reveal>
        <AttaccoSocketGridSection lp={lp} />
      </Reveal>
      <Reveal>
        <AttaccoShapeGridSection lp={lp} />
      </Reveal>
      <Reveal>
        <AttaccoGuideSection lp={lp} />
      </Reveal>
      <Reveal>
        <AttaccoConsultSection lp={lp} onOpenWizard={openWizard} />
      </Reveal>
      <AttaccoWizardModal
        open={wizardOpen}
        step={wizardStep}
        shape={wizardShape}
        lp={lp}
        onClose={closeWizard}
        onStep={setWizardStep}
        onShape={onShape}
        onRestart={restartWizard}
      />
    </div>
  )
}
