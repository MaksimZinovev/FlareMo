# 07 — Use it

**Goal:** write your first note — three ways.

## This file's flow
```
browser ─▶ type ─▶ save     (you)
REST   ─▶ POST /api/v1/memos    (agent / script)
MCP    ─▶ tools/call create_memo (agent / MCP client)
```

## You do — browser
Open `https://flaremo.<your-subdomain>.workers.dev` → log in via Access → click the editor → write → **Save**. Your note appears on the timeline. Tags use `#hashtag`.

## Agent does — REST API
```bash
curl -s -H "CF-Access-Client-Id: $CID" -H "CF-Access-Client-Secret: $CSEC" \
     -H "content-type: application/json" \
     -X POST "$B/api/v1/memos" \
     --data '{"content":"Hello from the API #first"}'        # → 201
```

## Agent does — MCP endpoint (JSON-RPC)
```bash
curl -s -H "CF-Access-Client-Id: $CID" -H "CF-Access-Client-Secret: $CSEC" \
     -H "content-type: application/json" \
     -X POST "$B/api/v1/mcp" \
     --data '{"jsonrpc":"2.0","id":1,"method":"tools/call",
              "params":{"name":"create_memo","arguments":{"content":"Hello from MCP #first"}}}'
```
Other MCP tools: `list_memos`, `get_memo`. Run `{"method":"tools/list"}` to see them all.

## ASCII — three ways in
```
   You (browser) ─────────┐
   Script (REST API) ─────┼─▶ FlareMo Worker ─▶ D1 (notes) + R2 (attachments)
   Agent (MCP server) ────┘
```

## Good to know
- FlareMo is **single-user**: anyone who logs in shares the same notebook (no per-user privacy).
- Attachments live in R2; everything else (notes, tags, shares, settings) lives in D1.
- Public share links: create one in the UI, send the URL — anyone can view, no login.

## Done
→ [Troubleshooting](./troubleshooting.md) · [Glossary](./glossary.md) · [References](./references.md)

📚 Docs: [FlareMo repo](https://github.com/realchendahuang/FlareMo) · [Memos API](https://github.com/usememos/memos)