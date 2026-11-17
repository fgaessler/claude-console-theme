# Console theme for Claude Code

A starship-console look for the Claude Code desktop app:

- **Colours for the whole app**: near-black panels with a violet cast, warm peach text, orange, lilac and butter accents (dark mode).
- **A C-shaped console frame** behind the conversation: a curved corner, a column in the gap left of the messages, and thin bars along the top and bottom edges.
- **A status band** above the message box with real session facts only: working or standing by, turns, tool calls, and how long the last turn took.
- **REQUEST / RESPONSE tags** above each message, with a bar across the message column.
- **Console wording on the working line** (ANALYZING, ACCESSING, COMPOSING, EXECUTING) beside the app's own time and token count.

Rule of the theme: shapes and colours are decoration; every word shown is real information about the session.

## Install

At the prompt of a terminal session:

```
/plugin install console-theme --marketplace fgaessler/claude-console-theme
```

Answer `y` to add the marketplace, then pick a scope (the user scope loads it in every session).

From a shell:

```
claude plugin install console-theme --marketplace fgaessler/claude-console-theme
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `fgaessler/claude-console-theme`, then Add plugin.

## Use

- `/plain` goes back to the app's own look (remembered across sessions).
- `/console` turns the console look on again.

## Notes

- Made for the desktop app. The terminal and editors draw no backdrop or colours; the status band and tags draw on the desktop only.
- The frame's position is tuned to one layout (sidebar about 413 app pixels wide, title bar 35). If the column sits behind your text, change `SIDEBAR` and `TITLE_BAR` near the top of the frame section in `hooks/register.tsx`.
- `hooks/make-colors.js` builds the colour palette from a few anchor colours; it comes from Claude Code's mod-authoring kit.

## Font

The labels use Antonio Bold, embedded in each drawing. Copyright 2013 The Antonio Project Authors, licensed under the SIL Open Font License 1.1: see [`fonts/ANTONIO-OFL.txt`](fonts/ANTONIO-OFL.txt).
