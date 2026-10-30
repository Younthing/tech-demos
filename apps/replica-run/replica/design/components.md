# Components

Measured from the 1440×900 and 390×844 shots: one centered column near 480px, a mode row, large digits, one wide button, a two-line caption, a task heading, then either a dashed add control or a light task row. Spacing follows an 8px step. Type is an open sans (Geist). Radius on the card is moderate. The page background is the mode colour. Ripen's hues are olive, gold, and violet, checked in `contrast.txt`.

## Button

  variants  primary (paper on the mode field), ghost
  sizes     md about 48px tall for the main control, sm for the header
  states    default, hover, focus-visible, disabled
  tokens    bg paper, text paper-ink, radius md
  a11y      real button, visible focus, name from the label
  used on   S01, S02, S04

## Mode switch

  variants  focus, short rest, long rest
  states    selected, idle
  tokens    selected chip on the card, muted ink otherwise
  a11y      tablist, aria-selected
  used on   S01, S04

## Digits

  variants  one
  states    idle, running, paused
  tokens    ink on the card, tabular nums
  a11y      role timer, name is the remaining time, not a live region every second
  used on   S01, S04

## Task row

  variants  open
  states    active title shown above, finished with a strike
  tokens    paper surface, paper ink
  a11y      checkbox labelled with the title, edit and delete labelled
  used on   S04

## Dialog

  variants  settings, report
  states    open, closed
  tokens    the neutral study surface, not the mode field
  a11y      title, description, focus trapped by the dialog primitive
  used on   S02, report

## Study pages

  variants  parity, complaints, pipeline
  states    filled from the checked-in JSON
  tokens    neutral background, text, muted
  a11y      headings in order, links named
  used on   the three study routes
