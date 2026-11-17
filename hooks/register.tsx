import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import type { Stats } from '../types'
import { ANTONIO_WOFF2 } from './antonio.js'
import { makeColors } from './make-colors.js'

// A starship-console look for the desktop app: console colours for the whole
// app, a still frame at the window's edges, a status band, a tag on each
// message and console wording while working. /plain restores the app's own
// look (remembered across sessions); /console brings this back.
//
// Rule: the shapes and colours are decoration; every word shown is real
// information about the session. No made-up numbers, dates or labels.

const SCENE = 'console-frame'

const C = {
  orange: '#FF9900',
  apricot: '#FF9966',
  peach: '#FFCC99',
  butter: '#FFCC66',
  lilac: '#CC99CC',
  violet: '#9999FF',
  periwinkle: '#9999CC',
  rust: '#CC6666',
  ink: '#000000',
}

// --- the app's colours ------------------------------------------------------
// Near-black panels with a violet cast, warm peach text, console accents.
// Dark only, as the real panels are.

const { theme: COLORS, problems } = makeColors({
  label: 'Starship console',
  only: 'dark',
  roles: { accent: '#FF9900', danger: '#E0605A', success: '#8FCF7A', warning: '#FFCC66', pro: '#CC99CC' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#07060b',
        'surface-1': '#0e0c14',
        'surface-2': '#141119',
        'surface-3': '#1a1621',
        'text-primary': '#FFE6C8',
        'text-secondary': '#EBCBA6',
        'text-muted': '#BBA28A',
      },
    },
    git: { added: '#8FCF7A', removed: '#E0605A', modified: '#FFCC66', merged: '#CC99CC' },
  },
})

const LOOK: ThemeSetArgs = {
  colors: COLORS,
  backdrop: { scene: SCENE, glass: { blur: 0, tint: '#07060b', opacity: 0.5 } },
  overrideColorScheme: 'dark',
}

const isOn = atom({ plugin: 'console-theme', key: 'isOn' } as const, false)
const stats = atom({ plugin: 'console-theme', key: 'stats' } as const, {
  tools: 0,
  turns: 0,
  lastSeconds: null,
} as Stats, { shape: 'stats-1' })

const pad = (n: number, width = 2) => String(n).padStart(width, '0')

// Squeezes a label into at most `room` pixels whatever font the surface
// has: condensed glyphs, as on the real panels.
const fit = (text: string, size: number, room: number) =>
  `textLength="${Math.min(room, Math.round(text.length * size * 0.44))}" lengthAdjust="spacingAndGlyphs"`

// Antonio Bold, a free condensed face close to the console lettering (SIL
// Open Font License, see fonts/ANTONIO-OFL.txt), embedded in each drawing
// since the app loads no font files. Bahnschrift, which ships with Windows,
// and the rest are fallbacks.
const FONT_FAMILY = `'Antonio Label', 'Bahnschrift SemiBold Condensed', 'Bahnschrift Condensed', Bahnschrift, 'Arial Narrow', sans-serif`
const FONT = `font-family="${FONT_FAMILY}" font-stretch="condensed" font-weight="700"`
const FONT_FACE = `<defs><style>@font-face { font-family: 'Antonio Label'; font-weight: 700; src: url(data:font/woff2;base64,${ANTONIO_WOFF2}) format('woff2'); }</style></defs>`

// --- the frame --------------------------------------------------------------
// Shapes only: one C-shaped console frame around the main area, its column
// in the gap left of the messages and its arms at the top and bottom edges,
// so no colour sits behind text. The arms run to the window's right edge: an
// open right panel (solid) covers their ends. No viewBox:
// coordinates are the app's pixels; pieces anchored to the right or bottom sit
// in nested <svg>s placed at 100%.

const SIDEBAR = 413 // where the main area starts
const TITLE_BAR = 35 // height of the window's title bar

// The main area's frame, from its left edge.
const X0 = SIDEBAR + 3 // the column sits in the gap left of the messages
const COL = 22 // column width
const BAR = 7 // bar height
const RO = 34 // outer corner radius
const RI = 12 // inner corner radius

const mainTop = () => {
  const y0 = TITLE_BAR + 2
  return `<path d="M${X0} ${y0 + RO} A${RO} ${RO} 0 0 1 ${X0 + RO} ${y0} L${X0 + 300} ${y0} L${X0 + 300} ${y0 + BAR} L${X0 + COL + RI} ${y0 + BAR} A${RI} ${RI} 0 0 0 ${X0 + COL} ${y0 + BAR + RI} L${X0 + COL} ${y0 + 190} L${X0} ${y0 + 190} Z" fill="${C.orange}"/>
  <rect x="${X0 + 306}" y="${y0}" width="64" height="${BAR}" fill="${C.rust}"/>
  <rect x="${X0 + 376}" y="${y0}" width="180" height="${BAR}" fill="${C.lilac}"/>
  <rect x="${X0 + 562}" y="${y0}" width="100%" height="${BAR}" fill="${C.periwinkle}"/>
  <rect x="${X0}" y="${y0 + 196}" width="${COL}" height="130" fill="${C.lilac}"/>
  <rect x="${X0}" y="${y0 + 332}" width="${COL}" height="44" fill="${C.rust}"/>
  <rect x="${X0}" y="${y0 + 382}" width="${COL}" height="4000" fill="${C.violet}"/>`
}

const mainBottom = () =>
  `<svg x="0" y="100%" overflow="visible">
    <rect x="${X0}" y="-206" width="${COL}" height="206" fill="#000"/>
    <path d="M${X0} -200 L${X0 + COL} -200 L${X0 + COL} -${BAR + RI} A${RI} ${RI} 0 0 0 ${X0 + COL + RI} -${BAR} L${X0 + 300} -${BAR} L${X0 + 300} 0 L${X0 + RO} 0 A${RO} ${RO} 0 0 1 ${X0} -${RO} Z" fill="${C.peach}"/>
    <rect x="${X0 + 306}" y="-${BAR}" width="56" height="${BAR}" fill="${C.orange}"/>
    <rect x="${X0 + 368}" y="-${BAR}" width="200" height="${BAR}" fill="${C.butter}"/>
    <rect x="${X0 + 574}" y="-${BAR}" width="100%" height="${BAR}" fill="${C.lilac}"/>
  </svg>`

// Rounded caps at the window's right edge. When the right panel is open it is
// solid and covers the arms' ends; when it is hidden the arms run to the edge.
const mainRightEnd = () => {
  const y0 = TITLE_BAR + 2
  const cap = (y: number, fill: string) =>
    `<rect x="-${BAR * 2 + 6}" y="${y}" width="6" height="${BAR}" fill="#000"/>` +
    `<rect x="-${BAR * 2}" y="${y}" width="${BAR * 2}" height="${BAR}" rx="${BAR / 2}" fill="${fill}"/>` +
    `<rect x="-${BAR * 2}" y="${y}" width="${BAR}" height="${BAR}" fill="${fill}"/>`
  return `<svg x="100%" y="0" overflow="visible">${cap(y0, C.periwinkle)}</svg>
  <svg x="100%" y="100%" overflow="visible">${cap(-BAR, C.lilac)}</svg>`
}

const FRAME = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#000"/>
  ${mainTop()}
  ${mainBottom()}
  ${mainRightEnd()}
</svg>`

// --- the status band above the prompt --------------------------------------
// Real session facts only: what Claude is doing, turns, tool calls and how
// long the last turn took.

const bandSvg = (width: number, s: Stats, isWorking: boolean) => {
  const H = 34
  const segments: Array<{ w: number; fill: string; text: string }> = [
    { w: 172, fill: isWorking ? C.butter : C.orange, text: isWorking ? 'STATUS · WORKING' : 'STATUS · STANDING BY' },
    { w: 104, fill: C.lilac, text: `TURNS ${pad(s.turns)}` },
    { w: 142, fill: C.periwinkle, text: `TOOL CALLS ${pad(s.tools, 3)}` },
    { w: 142, fill: C.peach, text: s.lastSeconds === null ? 'LAST TURN --' : `LAST TURN ${pad(s.lastSeconds, 3)} S` },
  ]
  const parts: string[] = []
  // left rounded cap
  parts.push(`<rect x="0" y="0" width="${H * 1.5}" height="${H}" rx="${H / 2}" fill="${C.apricot}"/>`)
  parts.push(`<rect x="${H / 2}" y="0" width="${H}" height="${H}" fill="${C.apricot}"/>`)
  let x = H * 1.5 + 5
  for (const seg of segments) {
    parts.push(`<rect x="${x}" y="0" width="${seg.w}" height="${H}" fill="${seg.fill}"/>`)
    parts.push(
      `<text x="${x + seg.w - 8}" y="${H - 8}" ${FONT} font-size="15" fill="${C.ink}" text-anchor="end" ${fit(seg.text, 15, seg.w - 14)}>${seg.text}</text>`,
    )
    x += seg.w + 5
  }
  // filler bar and right rounded cap
  const end = width - H * 1.5
  if (end > x) parts.push(`<rect x="${x}" y="0" width="${end - x}" height="${H}" fill="${C.violet}"/>`)
  parts.push(`<rect x="${end + 5}" y="0" width="${H * 1.5 - 5}" height="${H}" rx="${H / 2}" fill="${C.rust}"/>`)
  parts.push(`<rect x="${end + 5}" y="0" width="${H / 2}" height="${H}" fill="${C.rust}"/>`)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${H}" viewBox="0 0 ${width} ${H}">${FONT_FACE}${parts.join('')}</svg>`
}

// --- the tag above each prompt and reply -----------------------------------

// 1000 units wide, drawn across the whole message column (about 740 app
// pixels), so one unit is about 0.74 pixels: a 26-unit tag, 17-unit lettering,
// and a bar running on to the column's end.
const TAG_H = 26
const TAG_FONT = 17

const tagSvg = (label: string, cap: string, body: string, tail: string) => {
  const H = TAG_H
  const capW = H * 1.5
  const bodyW = 190
  const tailX = capW + 4 + bodyW + 8
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="${H}" viewBox="0 0 1000 ${H}">
    ${FONT_FACE}
    <rect x="0" y="0" width="${capW}" height="${H}" rx="${H / 2}" fill="${cap}"/>
    <rect x="${H / 2}" y="0" width="${H}" height="${H}" fill="${cap}"/>
    <rect x="${capW + 4}" y="0" width="${bodyW}" height="${H}" fill="${body}"/>
    <text x="${capW + 4 + bodyW - 10}" y="${H - 6}" ${FONT} font-size="${TAG_FONT}" fill="${C.ink}" text-anchor="end" ${fit(label, TAG_FONT, bodyW - 20)}>${label}</text>
    <rect x="${tailX}" y="${(H - 8) / 2}" width="${1000 - tailX}" height="8" fill="${tail}" opacity="0.6"/>
  </svg>`
}

// --- the working line -----------------------------------------------------

const escapeXml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Drawn on the message tags' scale (same height and lettering), so the two
// match once sized by TAG_SCALE.
const spinnerSvg = (verb: string, step: string) => {
  const H = TAG_H
  const size = TAG_FONT
  const blockW = Math.round(verb.length * size * 0.44) + 16
  const stepText = step.length > 60 ? `${step.slice(0, 59)}…` : step
  const stepW = stepText ? Math.round(stepText.length * size * 0.5) + 12 : 0
  const width = H * 1.5 + 4 + blockW + stepW
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${H}" viewBox="0 0 ${width} ${H}">
    ${FONT_FACE}
    <rect x="0" y="0" width="${H * 1.5}" height="${H}" rx="${H / 2}" fill="${C.butter}"/>
    <rect x="${H / 2}" y="0" width="${H}" height="${H}" fill="${C.butter}"/>
    <rect x="${H * 1.5 + 4}" y="0" width="${blockW}" height="${H}" fill="${C.orange}"/>
    <text x="${H * 1.5 + 4 + blockW - 6}" y="${H - 6}" ${FONT} font-size="${size}" fill="${C.ink}" text-anchor="end">${verb}</text>
    ${stepText ? `<text x="${H * 1.5 + 4 + blockW + 10}" y="${H - 6}" ${FONT} font-size="${size}" fill="${C.peach}">${escapeXml(stepText)}</text>` : ''}
  </svg>`
  return { source, width }
}

// The tags span the message column, about 740 app pixels wide in the
// person's window, so one of their 1000 units is drawn about 0.74 pixels wide.
const TAG_SCALE = 0.74

// --- the working indicator --------------------------------------------------

const VERB: Record<string, string> = {
  thinking: 'ANALYZING',
  requesting: 'ACCESSING',
  responding: 'COMPOSING',
  'tool-use': 'EXECUTING',
  'tool-input': 'EXECUTING',
}

const setTheme = ($: EngineInterface) => $.theme.set(LOOK)

const turnOff = async ($: EngineInterface) => {
  await $.store.set('isOn-v2', false)
  await update($, isOn, () => false)
  await $.theme.clear()
}

export const register: Register = on => {
  let startedAt = 0

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'console',
      description: 'Turn on the starship-console look',
    })
    await $.command.register({
      name: 'plain',
      description: "Go back to the app's own look",
    })

    // Say so if the app would refuse the colours.
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) $.ui.toast(unpainted)

    // On unless the person chose /plain last time.
    const wantsOn = (await $.store.get('isOn-v2')) !== false
    await update($, isOn, () => wantsOn)
    if (wantsOn) await setTheme($)

    return next(e)
  })

  on('command.run', { command: 'console' }, async $ => {
    await $.store.set('isOn-v2', true)
    await update($, isOn, () => true)
    const set = await setTheme($)

    return { text: set.isDrawn ? 'Console look on.' : `Console look set; ${set.reason}` }
  })

  on('command.run', { command: 'plain' }, async $ => {
    await turnOff($)

    return { text: "Back to the app's own look. /console turns the console look on again." }
  })

  on('prompt.submit', async ($, e, next) => {
    void $.clock.now().then(t => { startedAt = t }).catch(() => {})

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    void update($, stats, s => ({ ...s, tools: s.tools + 1 })).catch(() => {})

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const seconds = startedAt ? Math.round(((await $.clock.now()) - startedAt) / 1000) : null
    await update($, stats, s => ({ ...s, turns: s.turns + 1, lastSeconds: seconds }))

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.props.plugin !== $.plugin.name || e.props.scene !== SCENE) return next(e)
    // Tuned to the desktop layout; other surfaces keep their own look.
    if (e.surface !== 'desktop') return next(e)
    const { Svg } = $.ui.resolve(e)

    return <Svg source={FRAME} alt="Console frame of orange, lilac and violet bars around the main area" />
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.surface !== 'desktop' || e.props.hasSurvey) return next(e)
    if (!(await read($, isOn))) return next(e)
    const s = await read($, stats)
    const { Svg } = $.ui.resolve(e)
    // The four blocks and both caps need 682px; the filler bar takes the rest.
    const width = 720

    return (
      <Svg
        source={bandSvg(width, s, e.props.isWorking)}
        alt={`Status: ${e.props.isWorking ? 'working' : 'standing by'}, ${s.turns} turns, ${s.tools} tool calls`}
      />
    )
  })

  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
    if (e.surface !== 'desktop' || !(await read($, isOn))) return next(e)
    const row = await next(e)
    const { Box, Svg } = $.ui.resolve(e)

    return (
      <Box flexDirection="column" gap="xs">
        <Box width="100%">
          <Svg source={tagSvg('REQUEST', C.orange, C.peach, C.apricot)} alt="Request" />
        </Box>
        {row}
      </Box>
    )
  })

  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    if (e.surface !== 'desktop' || !e.props.isFirstOfReply || !(await read($, isOn))) return next(e)
    const row = await next(e)
    const { Box, Svg } = $.ui.resolve(e)

    return (
      <Box flexDirection="column" gap="xs">
        <Box width="100%">
          <Svg source={tagSvg('RESPONSE', C.violet, C.lilac, C.periwinkle)} alt="Response" />
        </Box>
        {row}
      </Box>
    )
  })

  // The working line: a console pill with the verb and the step in Antonio,
  // then the app's own part, kept for the elapsed time and tokens.
  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    if (e.surface !== 'desktop' || !(await read($, isOn))) return next(e)
    const verb = VERB[e.props.mode] ?? 'PROCESSING'
    const step = e.props.message ?? (e.props.word === 'Working' ? '' : e.props.word)
    const rest = await next({ ...e, props: { ...e.props, word: '', message: null } })
    const { Box, Svg } = $.ui.resolve(e)
    // Drawn at the size the tags come out at in the person's window.
    const pill = spinnerSvg(verb, step)

    return (
      <Box flexDirection="row" alignItems="center" gap="xs">
        <Svg
          source={pill.source}
          alt={step ? `${verb}: ${step}` : verb}
          width={Math.round(pill.width * TAG_SCALE)}
          height={Math.round(TAG_H * TAG_SCALE)}
        />
        {rest}
      </Box>
    )
  })
}
