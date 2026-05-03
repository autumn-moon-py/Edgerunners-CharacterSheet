function isEnvEnabled(value: string | undefined): boolean {
  return value === 'true'
}

export function isCardManagerEnabled(): boolean {
  return isEnvEnabled(process.env.NEXT_PUBLIC_ENABLE_CARD_MANAGER)
}
