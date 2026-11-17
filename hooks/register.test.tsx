import { expect, test } from 'claude-code/testing'

const BAND = {
  plugin: 'console-theme',
  component: 'AbovePrompt',
  requestId: 'above-prompt',
  surface: 'desktop',
  props: {
    hasSurvey: false,
    isCollapsed: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 9 },
    view: {},
  },
} as const

const BACKDROP = {
  plugin: 'console-theme',
  component: 'Backdrop',
  requestId: 'backdrop',
  surface: 'desktop',
  props: {
    scene: 'console-frame',
    plugin: 'console-theme',
    glass: { blur: 0, tint: '#07060b', opacity: 0.5 },
    overrideColorScheme: 'dark',
  },
} as const

const engine = (on: any) => {
  on('command.register', (_: unknown, e: any) => ({ value: { command: e.name } }))
  on('theme.set', () => ({ value: { isDrawn: true, requestId: 'backdrop' } }))
  on('theme.clear', () => ({ value: { isDrawn: false, reason: 'cleared' } }))
  on('session.start', (_: unknown, e: any) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: {} }))
  on('clock.now', () => ({ value: Date.UTC(2026, 10, 17, 15, 0) }))
  const store: Record<string, unknown> = {}
  on('store.get', (_: unknown, e: any) => ({ value: store[e.key] }))
  on('store.set', (_: unknown, e: any) => {
    store[e.key] = e.value
    return { value: undefined }
  })
}

test('the band shows the console blocks once the session starts', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.tool.call({ tool: 'Bash', command: 'ls' })

  const ui = await $.ui.mount(BAND)
  const band = JSON.stringify(await ui.find({ type: 'Svg' }))
  expect(band).toContain('STANDING BY')
  expect(band).toContain('TOOL CALLS 001')
  await ui.unmount()
})

test('the backdrop draws the frame', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount(BACKDROP)
  const frame = await ui.find({ type: 'Svg' })
  expect(frame).toBeTruthy()
  await ui.unmount()
})

test('the band has no button', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Svg' })).toBeTruthy()
  expect(await ui.find({ type: 'Button' })).toBeFalsy()
  await ui.unmount()
})

test('nothing made up: the frame has no text and the band only session facts', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const frame = JSON.stringify(await (await $.ui.mount(BACKDROP)).find({ type: 'Svg' }))
  expect(frame).not.toContain('<text')
  const band = JSON.stringify(await (await $.ui.mount(BAND)).find({ type: 'Svg' }))
  expect(band).not.toContain('STARDATE')
})

test('the labels carry the embedded font', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const band = JSON.stringify(await (await $.ui.mount(BAND)).find({ type: 'Svg' }))
  expect(band).toContain('Antonio Label')
  expect(band).toContain('data:font/woff2;base64,')
})

test('the working line draws the verb and step in the console font and keeps the app part', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({
    plugin: 'console-theme',
    component: 'Spinner',
    requestId: 'main',
    surface: 'desktop',
    props: { word: 'Creating notes.md', message: null, suffix: '…', mode: 'tool-use' },
  } as const)
  const svg = JSON.stringify(await ui.find({ type: 'Svg' }))
  expect(svg).toContain('EXECUTING')
  expect(svg).toContain('Creating notes.md')
  expect(svg).toContain('Antonio Label')
  await ui.unmount()
})
