# Higgsfield MCP + Claude Code

Repo ini ada `.mcp.json` yang daftarkan server MCP Higgsfield (hosted, HTTP):

```
https://mcp.higgsfield.ai/mcp
```

## Cara guna (Claude Code di komputer sendiri)

1. `cd` ke repo ini dan jalankan `claude`. Claude Code akan tanya sama ada mahu
   percaya server `higgsfield` dalam `.mcp.json` — pilih **approve**.
2. Taip `/mcp` → pilih `higgsfield` → **Authenticate**. Browser akan buka untuk
   login akaun Higgsfield (OAuth). Tiada API key disimpan dalam repo.
3. Semak: `claude mcp list` sepatutnya tunjuk `higgsfield ... ✓ Connected`.

Alternatif (tanpa repo ini, untuk semua projek):

```bash
claude mcp add --transport http --scope user higgsfield https://mcp.higgsfield.ai/mcp
```

## Claude.ai / Claude app

Settings → Connectors → **Add custom connector** → URL `https://mcp.higgsfield.ai/mcp`
→ Connect dan login Higgsfield. Selepas itu sesi Claude Code di web juga boleh guna.

## Nota

- Penjanaan imej/video guna kredit akaun Higgsfield anda.
- Sahkan URL terkini di https://higgsfield.ai/mcp jika sambungan gagal.
- Tiada tool default: Claude auto-pilih Higgsfield, Hyperframes, Remotion atau
  Canva ikut keperluan dan menggabungkannya. Aliran penuh: skill
  `video-auto-pipeline`.
