# Project guidance

This repo carries the shared Pekaya skill set in `.claude/skills/` (index: `.claude/skills/INDEX.md`):
18 prompt skills (research, summary, ideas, strategy, marketing, content, social, YouTube script, email,
code, debug, website, presentation, learning plan, automation, personas, competitors, custom workflow)
plus video skills (`video-2d-infographic-style`, `video-storyboard`, `shot-list`, `short-form-video-script`, `voiceover-script`, `video-thumbnail-title`, `video-content-calendar`) with templates in `.claude/templates/video/`.

- Use the matching skill whenever the user's request fits; adapt it to context rather than copying it rigidly.
- Reply in the user's language (Bahasa Melayu / English).
- When creating a NEW repo, run `.claude/scripts/sync-skills.sh <new-repo-path>` to copy these skills into it.
