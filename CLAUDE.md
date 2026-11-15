# Project guidance

This repo carries the shared Pekaya skill set in `.claude/skills/` (index: `.claude/skills/INDEX.md`):
18 prompt skills (research, summary, ideas, strategy, marketing, content, social, YouTube script, email,
code, debug, website, presentation, learning plan, automation, personas, competitors, custom workflow)
plus video skills (`video-2d-infographic-style`, `video-storyboard`, `shot-list`, `short-form-video-script`, `voiceover-script`, `video-thumbnail-title`, `video-content-calendar`) with templates in `.claude/templates/video/`.
Extra BM video skills: `video-script-bm`, `video-hook-library`, `video-remotion-builder`, `video-sound-and-captions`, with Remotion components in `templates/video/remotion/`.

- Use the matching skill whenever the user's request fits; adapt it to context rather than copying it rigidly.
- Reply in the user's language (Bahasa Melayu / English).
- When creating a NEW repo, run `.claude/scripts/sync-skills.sh <new-repo-path>` to copy these skills into it.

Also included: 52 marketing skills from marketingskills (start with `product-marketing`; upstream `marketing-plan` is `marketing-plan-corey`) and `free-llm-apis`. Sources: `.claude/skills/SOURCES.md`.

## Working rules (from the owner)
- Do exactly what is asked. Do not change, add or remove anything that was not requested.
- Never skip a requested item; re-check the full list of requests before saying it is done.
- Reply in simple Bahasa Melayu, short and step by step. Never cancel running builds.
- **Selepas SETIAP kerja/kemas kini (banyak atau sikit), hantar SEMUA pautan ini secara automatik tanpa diminta** (semak dahulu bahawa ia kod 200 dan nyatakan versi aplikasi terkini):
  - Awam: EXE `https://github.com/GeniusDigitalDeveloper/global-streamer-releases-exe-apps/releases/latest/download/Global-Streamer-Setup.exe`, Zip `.../Global-Streamer-Portable.zip`, laman pelanggan Netlify `https://aquamarine-froyo-927fac.netlify.app`, Netlify Deploys `https://app.netlify.com/projects/aquamarine-froyo-927fac/deploys`.
  - Admin: panel `https://geniusdigitaldeveloper-stack.github.io/global-streamer-releases-exe-apps/admin/` (dipasang sebagai aplikasi melalui Chrome), halaman muat turun pemilik `https://geniusdigitaldeveloper-stack.github.io/global-streamer-releases-exe-apps/`.
  - Tetapan: GitHub Pages `https://github.com/geniusdigitaldeveloper-stack/global-streamer-releases-exe-apps/settings/pages`, Firebase `https://console.firebase.google.com/project/global-streamer-izzul`.
  - Jika ada pautan baharu ditambah kemudian, masukkan juga ke dalam senarai ini.

