# MemeForge

## Current State
- FeedPage (homepage) has a hero section, trending tags, and meme grid
- Footer component exists with nav links and social icons
- CreatePage has a canvas-based editor with text layers (2 by default: top/bottom), fonts, drag-to-move, size/color/stroke/rotation/alignment controls
- Users can add more text layers via a small "+" icon in the right panel, but this is not obvious

## Requested Changes (Diff)

### Add
- Website share section at the bottom of the homepage (FeedPage), above the footer, with:
  - Share buttons: Copy Link, Share on Twitter/X, Share on WhatsApp
  - Visual sharing card with tagline and the site URL
- More prominent "Add Text" button in CreatePage editor with clear label
- Font preview in text layer list items (show font name in the actual font)
- "Duplicate Layer" button for selected text layer
- Additional fonts: Oswald, Lobster, Bangers, Times New Roman, Trebuchet MS
- Opacity control slider for selected text layer
- X/Y position inputs for precise positioning of selected text layer

### Modify
- Text layers section in right panel: make the Add Text button more prominent with a label "Add Text" instead of just a + icon
- Default text layers on new meme: show 3 layers by default (top, middle, bottom) with clear labels
- Right panel: show font name in list item using the actual font style so user can see which font is applied

### Remove
- Nothing removed

## Implementation Plan
1. FeedPage: Add a share section near bottom of page (before memes end / after grid) with Copy Link, Twitter share, WhatsApp share buttons
2. CreatePage: Make "Add Text" more prominent - replace the small icon button with a visible labeled button
3. CreatePage: Add more fonts to FONTS array
4. CreatePage: Add opacity field to TextLayer interface and rendering
5. CreatePage: Add opacity slider in text layer controls
6. CreatePage: Add X/Y position inputs for precise placement
7. CreatePage: Add Duplicate Layer button
8. CreatePage: Show font applied in layer list
