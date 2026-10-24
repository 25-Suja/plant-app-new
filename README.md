# GlowBots Plant Scanner

A field guide web app from the **Avonwood GlowBots**, a FIRST LEGO League team from Avon, CT. Take photos of a plant, even in a shaded forest, and the app identifies it. It then checks whether the plant is native, introduced, or invasive in your state or province, and explains how to remove and dispose of invasive plants so they don't grow back.

This is the web version of the team's original Python/Flet desktop app. It keeps every screen from that app and adds a **Disposal** tab and a **woodland-ready field camera**.

## Features

- **Welcome & introduction:** demo email entry and the animated 16-second story that unlocks the app (remembered on the device).
- **Scan a Plant**
  - Search for a state or province worldwide (iNaturalist places).
  - Field camera: uses the rear lens; hardware zoom (or digital zoom), torch, and exposure control when the phone supports them; tap to focus; a live light and sharpness meter; burst capture that keeps the sharpest of 4 frames.
  - Woodland light correction: brightens dark shots and removes the green tint from canopy light.
  - Up to 5 photos of the same plant, each tagged as leaf, flower, fruit, stem/bark, or whole plant.
  - Two-engine identification: Pl@ntNet ranks candidates using every photo and plant part, then an AI botanist model checks those candidates against the photos and your region. Agreement raises confidence and disagreement caps it. The result lists the features seen, look-alikes and how to tell them apart, and which extra photos would confirm the ID.
  - iNaturalist native status for the selected place (falling back to the country), with the flashing **INVASIVE** alert for confirmed invasives and a direct link to that plant's disposal guide.
- **Disposal:** six general rules (bag & trash, solarize, dry on site, never compost, clean boots, local rules) plus step-by-step remove / dispose / follow-up guides for 15 common invasive species. Hazard warnings are included, for example giant hogweed.
- **Maps:** a zoomable, pannable map that colors states and provinces by recorded status for any species.
- **About Us:** the team's story.

## Tech

TanStack Start (React 19), Tailwind CSS 4, and shadcn/ui, deployed on Netlify. Plant identification runs in a TanStack server function that calls Pl@ntNet and a vision model through Netlify AI Gateway (no AI key needed). iNaturalist is called directly from the browser.

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `PLANTNET_API_KEY` | Recommended | Turns on the Pl@ntNet engine. Without it, the app identifies with the AI botanist alone. Set it in Netlify → Project configuration → Environment variables. |

To show the team logo, add it as `public/glowbots-logo.png`. Until then a leaf emblem is shown.

## Run locally

```bash
pnpm install
netlify dev   # http://localhost:8888, with AI Gateway emulation
```

The field camera needs HTTPS or `localhost`. On phones, use the deployed site.
