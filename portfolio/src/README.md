# Colour plan: one plain wall, glass cards in the air

The portfolio is **one continuous wall**. Each section has its own flat colour taken from the dark
fabric palette, in the order of the fabric picture. The colour only changes in a short soft blend where
one section meets the next, so it reads as one wall, never as separate boxes. There are no gradients,
glows or painted effects inside a section.

Everything that sits on the wall (cards, big text) is lit and given depth so it looks real and in the air.

## Wall colours (the fabric picture, in order, without Onyx and Flint)

| Order | Section | Wall colour | Hex |
|---|---|---|---|
| 1 | Hero | Jet Black | `#0a0a0c` |
| 2 | What I do | Midnight | `#0f1524` |
| 3 | Projects | Obsidian | `#0b0b10` |
| 4 | About | Charcoal | `#211a1d` |
| 5 | Education | Slate | `#2f3544` |
| 6 | Experience | Carbon | `#232726` |
| 7 | Contact | Moss Black | `#1a201d` |
| 8 | Footer | Cloud Grey (the only light surface, so footer text turns dark) | `#8b8c90` |

The thin stack strip under the hero is a bridge: it keeps the hero colours and has no wall colour.

## Content colours and the ratio

Every section uses the same ratio: **main 70%, detail 10%, secondary 10%, text 10%**.

| Section | Main (70%) | Detail (10%) borders, rules, icons | Secondary (10%) soft fills, hover washes | Text (10%) | Glass tint |
|---|---|---|---|---|---|
| Hero | Red `#d61a29` | Old gold `#b08d4d` | Deep green `#21402d` | White `#f2efeb` | Burgundy |
| What I do | Burgundy `#b8344a` | Camel `#c4a068` | Chocolate `#5a3a2c` | Cream `#efe8da` | Burgundy |
| Projects | Eucalyptus `#98aa9d` | Mist `#b3c9d6` | Moss `#697c70` | Plaster `#f2efe2` | Soot `#2d3536` |
| About | Gold `#c9a25a` | Cream `#efe8da` | Chocolate `#5a3a2c` | Cream `#efe8da` | Copper |
| Education | Mist `#b3c9d6` | Eucalyptus `#98aa9d` | Moss `#697c70` | Plaster `#f2efe2` | Slate blue |
| Experience | Eucalyptus `#98aa9d` | Camel `#c4a068` | Soot `#2d3536` | Cream `#efe8da` | Soot |
| Contact | Red `#d61a29` | Old gold `#b08d4d` | Deep green `#21402d` | White `#f2efeb` | Burgundy |
| Footer | Dark red `#8c1422` | Bronze `#6b5224` | Graphite `#3a3b3f` | Near black `#151517` | Frosted white |

The hero uses the red, old gold and deep green palette. What I do uses the burgundy, cream, camel and
chocolate palette. Projects uses the eucalyptus, mist, plaster, soot and moss palette. The other rows are
ready for the next steps and can be changed freely.

## How it is built

- `theme/palette.js` is the single source of truth for every colour above.
- `components/ui/Wall.jsx` builds the wall: one vertical blend of the section colours, a fine fabric texture
  (a soft-light noise with vertical pile) and a light vignette that darkens the screen corners.
- Each `data-env` section gets CSS variables from `palette.js`. Tailwind classes recolour themselves:
  `text-red` and `bg-red` (main), `text-gold` and `border-gold` (detail), `bg-deep` (secondary),
  `text-ink` (text), `border-line`, and `rgb(var(--env-rgb) / 0.4)` for glows.

## Glass, depth and light (`styles/global.css`, `engine/swarmBuild.jsx`)

- **Cards are cubes of glass** (`Shell`): a tinted, blurred pane lit from the top left, a bright top bevel,
  a dark thick bottom edge, an inner rim for thickness, a deep floating shadow with a faint underglow in
  the section's colour, and a glass glint plus a lit border that follow the mouse. All corners are round.
- **They hang in the air** (`.float`): a slow drift of a few pixels, and a 3D tilt toward the mouse on hover
  with the text inside moving slightly the other way (parallax).
- **Big text stands off the wall** (`.text-3d`): a stacked extrusion with a soft shadow beneath.

## Hover effects

- Hero: any letter of the name, title or paragraph spins through other letters and lands on itself again.
  The PORTFOLIO letters flow like liquid around the mouse inside a radius and spring back. Stat rows slide,
  glow and light up their divider. The name shows a design-tool selection outline.
- Glass cards (What I do, Projects): 3D tilt, mouse glint, lit border, text parallax, title underline draw,
  chips lift and glow, links fill with a slide and pull towards the mouse.
- The project screenshots have no hover effect.

## Add or change a section

1. Add an entry to `ENVS` in `theme/palette.js`.
2. Put `data-env="that-id"` on the section element (use `data-wall="skip"` for a thin bridge section).
3. No section background and no `border-t`: the wall shows through.
4. Cards use `Shell` from `engine/swarmBuild.jsx`. Use `text-red`, `text-gold`, `bg-deep`, `text-ink`,
   `border-line` for colour. Never type a hex colour for an accent.
