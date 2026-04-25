import type { LiveConnectionState } from '~/utils/binance'

type LiveBadgeTone = 'active' | 'muted'

interface LiveBadgeContext {
  enabled: boolean
  hasAssets: boolean
  state: LiveConnectionState
}

interface LiveBadgePreset {
  label: string
  tone: LiveBadgeTone
}

const badgeToneClasses: Record<LiveBadgeTone, string> = {
  active: 'border-positive/30 bg-positive/10 text-positive',
  muted: 'border-border text-muted'
}

const connectionStatePresets: Record<LiveConnectionState, LiveBadgePreset> = {
  idle: {
    label: 'Fallback active',
    tone: 'muted'
  },
  connecting: {
    label: 'Connecting live',
    tone: 'muted'
  },
  reconnecting: {
    label: 'Connecting live',
    tone: 'muted'
  },
  open: {
    label: 'Live (Binance)',
    tone: 'active'
  },
  closed: {
    label: 'Fallback active',
    tone: 'muted'
  },
  error: {
    label: 'Fallback active',
    tone: 'muted'
  }
}

const baseBadgePresets = [
  {
    matches: ({ hasAssets }: LiveBadgeContext) => !hasAssets,
    preset: {
      label: 'Ready',
      tone: 'muted'
    } satisfies LiveBadgePreset
  },
  {
    matches: ({ enabled }: LiveBadgeContext) => !enabled,
    preset: {
      label: 'Polling only',
      tone: 'muted'
    } satisfies LiveBadgePreset
  }
]

export const resolveLiveBadge = (context: LiveBadgeContext) => {
  const preset = baseBadgePresets.find((candidate) => candidate.matches(context))?.preset
    ?? connectionStatePresets[context.state]

  return {
    className: badgeToneClasses[preset.tone],
    label: preset.label
  }
}
