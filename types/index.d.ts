export type Stats = { tools: number; turns: number; lastSeconds: number | null }

declare module 'claude-code' {
  interface PluginState {
    'console-theme': { isOn: boolean; stats: Shaped<Stats> }
  }
}
