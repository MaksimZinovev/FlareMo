# FAQ

Context: FlareMo is your self-hosted notes app at `https://flaremo.yoursubdomainname.workers.dev`,
behind Cloudflare Access. A Service Token (CF-Access-Client-Id + CF-Access-Client-Secret)
lets scripts reach the API. The pi coding agent has that token in its session context.

## Does the agent have access to FlareMo via MCP or API?

Yes — both paths work (tested live with curl + the Service Token):

- **REST API** ✅ — `GET /api/v1/memos` returns your memos (e.g. `Hellow\n#memo`).
  The agent can list/create/get/edit/delete memos via curl right now.
- **MCP endpoint** ✅ — `/api/v1/mcp` answers JSON-RPC `tools/list` with
  `list_memos`, `create_memo`, `get_memo`, … But it is **not registered as a native
  pi MCP server**, so the agent curls it manually rather than calling `mcp({tool:...})`.
  To make it native, add it to `~/.pi/agent/mcp.json` (HTTP transport + the two Access headers).

```
        pi agent
           │  curl + Service Token headers
           ▼
   Cloudflare Access  ──(Service Auth policy)──▶  FlareMo Worker
           │                                         │
        (blocks                                       ├──▶ D1  (notes)
        tokenless)                                    └──▶ R2  (attachments)
           │
   REST:  /api/v1/memos      → 200 JSON
   MCP :  /api/v1/mcp        → JSON-RPC tools/list, create_memo, ...
```

Transparency: the token sits in this session, so the agent can read/write your notes unless told not to; rotate it in the dashboard to revoke.