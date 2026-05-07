import type { RetroPhase } from '@/types/retro'

export interface PhaseCapabilities {
  canAddCards: boolean
  canEditCards: boolean
  canVote: boolean
  isRevealed: boolean
  showExport: boolean
}

export function getPhaseCapabilities(phase: RetroPhase): PhaseCapabilities {
  switch (phase) {
    case 'writing':
      return { canAddCards: true,  canEditCards: true,  canVote: false, isRevealed: false, showExport: false }
    case 'grouping':
      return { canAddCards: false, canEditCards: false, canVote: false, isRevealed: true,  showExport: false }
    case 'voting':
      return { canAddCards: false, canEditCards: false, canVote: true,  isRevealed: true,  showExport: false }
    case 'results':
      return { canAddCards: false, canEditCards: false, canVote: false, isRevealed: true,  showExport: true  }
  }
}

export function getNextPhase(phase: RetroPhase): RetroPhase | null {
  const order: RetroPhase[] = ['writing', 'grouping', 'voting', 'results']
  const idx = order.indexOf(phase)
  return idx < order.length - 1 ? order[idx + 1] : null
}

export function getPrevPhase(phase: RetroPhase): RetroPhase | null {
  const order: RetroPhase[] = ['writing', 'grouping', 'voting', 'results']
  const idx = order.indexOf(phase)
  return idx > 0 ? order[idx - 1] : null
}

export function getPhaseDbPatch(phase: RetroPhase): { phase: RetroPhase; is_revealed: boolean; is_locked: boolean } {
  const caps = getPhaseCapabilities(phase)
  return {
    phase,
    is_revealed: caps.isRevealed,
    is_locked: !caps.canAddCards,
  }
}
