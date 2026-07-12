# AI Pair Programmer

A real-time coding assistant. Monaco editor on the left, an AI that can read your
file and write straight into it on the right — and a shareable room link so two
people can edit the same file at the same time.

MERN stack, 100% free tier, no credit card anywhere.

---

## Status

| # | Feature | State |
|---|---------|-------|
| — | **Accounts** — register / sign in, JWT, bcrypt, MongoDB | ✅ done |
| 1 | **Editor + AI chat** — Monaco, streaming replies from Groq, AI writes into the editor | ✅ done |
| 2 | Code execution (Wandbox, multi-language) | ⬜ next |
| 3 | Explain selected code | ⬜ |
| 4 | Live bug detection (debounced) | ⬜ |
| 5 | Debugging helper (paste an error) | ⬜ |
| 6 | Project memory (file structure, recent turns) | ⬜ |
| 7 | Voice conversation (Web Speech API) | ⬜ |
| 8 | **Private rooms** — invite-only, live cursors, CRDT sync, persisted to Mongo | ✅ done |

Feature 8 was built out of order, on request. Features 2–7 are still on the list
and get built next, in order.

---

## Quick start

You need Node 20+, and two free things (neither wants a credit card):

- a Groq API key — [console.groq.com/keys](https://console.groq.com/keys)
- a MongoDB Atlas M0 cluster — [cloud.mongodb.com](https://cloud.mongodb.com).
  Under **Network Access**, allow `0.0.0.0/0`, or Render won't be able to reach it.

```bash
# 1. install both halves
npm run install:all

# 2. configure the backend
cp server/.env.example server/.env
#    fill in GROQ_API_KEY, MONGODB_URI, and JWT_SECRET.
#    generate a secret with:
#    node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 3. run both at once
npm run dev
```

Frontend on `http://localhost:5173`, backend on `http://localhost:5000`.

The client needs no `.env` locally — Vite proxies `/api` and `/socket.io` to the
backend, so there's no CORS to fight in development.

### Try it

Create an account, then:

- Type `create a react navbar with a mobile menu` into the chat. The reply
  streams in, and the code lands in the editor. `Ctrl/Cmd+Z` undoes it.
- Turn off **Auto-apply** if you'd rather use the Insert / Replace buttons on
  each code block yourself.
- **Rooms → Start a new room.** It's private. Copy the link, open it in a second
  browser (or an incognito window) as a *different* account — you'll be turned
  away. Now **Manage → Invite** that person by email, reload, and they're in.
  Type in one window; watch the named cursor move in the other. Then ask the AI
  for code in one window and watch it land in *both*.
- Or flip the room to **Anyone with the link** in Manage, if you just want a
  quick demo without inviting anyone.

---

## How it works

### The AI chat

```
ChatInput ──► useChat ──► POST /api/ai/chat  ──► Groq (stream: true)
                                │
                                └── Server-Sent Events, one token per event
                                        │
                       parseMessage ◄───┘
                       ├─ prose  ──► rendered as text
                       └─ ```code``` ──► CodeBlock  ──► editor.executeEdits()
```

The backend is a **relay, not a buffer**. It opens a streaming request to Groq,
reads Groq's SSE, and immediately re-emits each token as its own SSE event. You
see words appear as the model produces them.

Two details worth knowing, because both cost me a debugging session:

- **`res.on('close')`, not `req.on('close')`.** Since Node 16, a request's
  `close` event fires as soon as the *body* has been read — which
  `express.json()` does instantly. Aborting on `req` close would cancel every
  Groq call before it started. See `server/src/controllers/ai.controller.js`.
- **Errors mid-stream can't use a status code.** The `200` header is already on
  the wire, so a failure has to travel *inside* the stream as
  `{"type":"error"}`. The client throws on that event.

### Accounts

Register or sign in, and the server hands back a JWT. bcrypt hashes the password
(10 rounds); the hash never leaves the server — `User.toPublic()` is the only
shape that's ever serialised, and it doesn't include one.

The token goes in `localStorage`, and `lib/api.js` attaches it to every request
in one place, so no route can forget it. On page load the client asks
`GET /api/auth/me` whether the stored token still means anything — a token in
localStorage is only a *claim* until the server agrees with it.

`POST /api/ai/chat` requires auth too. That's not ceremony: it's what stops a
stranger who finds your Render URL from spending your Groq quota.

Login failures deliberately say the same thing whether the email doesn't exist or
the password was wrong. Telling an attacker *which* half was wrong tells them
which emails have accounts.

### Private rooms

A room is `?room=k3f9x2` in the URL, but the link alone gets you nothing.

Each room has an `owner`, a `members` list, and an access mode:

- **private** (the default) — only people on `members` can open it. Everyone else
  gets *"This room is private. Ask the owner to invite you."*
- **anyone with the link** — any signed-in person with the link can open it, and
  doing so puts them on `members`. So they keep access even if the owner later
  switches the room back to private.

The owner invites by email or username, and can remove people again.

**The rule lives in exactly one place** — `Room.allows(userId)` on the model. Both
the REST API and the websocket call it. If that check lived in two places, one of
them would eventually be wrong.

And the websocket has the *same* lock as the REST API:

```js
io.use((socket, next) => {
  const payload = verifyToken(socket.handshake.auth?.token);
  if (!payload) return next(new Error('unauthorized'));
  ...
});
```

Without that, guessing a six-character room id would be enough to read and edit
someone's private document, and the access check on `GET /api/rooms/:id` would be
purely decorative.

Rooms **persist**. The Yjs document is saved to MongoDB as a binary snapshot
(`Y.encodeStateAsUpdate`), throttled to at most one write every 2s while someone
is typing, and flushed when the last person leaves. A room survives a restart, and
**Rooms** in the top bar is how you find your way back into one.

### How the sync works

```
Monaco model  ◄──►  MonacoBinding  ◄──►  Y.Text  ◄──►  Socket.IO  ◄──►  server
                                            │                            │
                                        Awareness                    Y.Doc per room
                                     (cursors, names)                    │
                                                                     MongoDB
                                                              (snapshot, throttled)
```

[Yjs](https://yjs.dev) does the hard part. Every edit becomes a CRDT update that
can be applied in any order and still converge — so two people typing into the
same spot at the same instant end up with the same file, and **the server never
has to resolve a conflict.** It just moves opaque binary blobs between everyone
in the room.

The server keeps its own `Y.Doc` per room for exactly one reason: so someone who
joins an hour late gets the current document without needing another client to
be online to send it to them.

**The nice consequence:** `MonacoBinding` watches the editor's *model*. So when
the AI writes code into your editor, that's an ordinary model edit — and it syncs
to your collaborator with no extra plumbing at all. Ask the AI for a navbar; your
partner watches it appear.

Presence (cursors, names, colours) is deliberately **not** part of the document.
It's throwaway state that should vanish when you close the tab, not history. It
lives in a separate Yjs `Awareness` instance, and the peer list and the coloured
remote cursors are both just views of it — so they can never disagree.

### One thing that shapes the whole frontend

**Monaco is uncontrolled.** React sets the starting text and then never touches
the content again. Everything that writes code — you typing, the AI applying a
snippet, a collaborator's keystrokes arriving over the network — goes through
Monaco's own model.

That buys three things:

- no React re-render on every keystroke (React never sees the text)
- one undo stack, so `Ctrl/Cmd+Z` undoes the AI exactly like it undoes you
- Yjs only has to watch one thing

Whoever needs the code (the AI, when building context) reads it on demand with
`editor.getValue()`.

---

## Project structure

```
server/
  src/
    index.js                 Express + Socket.IO, wired to one HTTP server
    config/
      env.js                 all process.env access, once, validated at startup
      cors.js                one origin rule, shared by Express and Socket.IO
      db.js                  mongoose connection
    models/
      User.js                bcrypt hashing lives on the model, so no route can skip it
      Room.js                owner, members, access mode — and `allows()`, the one rule
    routes/                  auth.routes.js, room.routes.js, ai.routes.js
    controllers/
      auth.controller.js     register / login / me
      room.controller.js     create, list, invite, remove, set access
      ai.controller.js       SSE streaming, abort handling
    services/
      groq.service.js        calls Groq, yields tokens as an async generator
      token.js               sign / verify JWTs
    prompts/pairProgrammer.js      every instruction the model sees, in one place
    middleware/
      auth.js                requireAuth — the Bearer token gate
      asyncHandler.js        Express 4 doesn't catch async rejections. This does.
      rateLimiter.js         caps requests before they can burn the Groq quota
      errorHandler.js
    collab/
      socket.js              the room protocol, behind the same JWT gate
      rooms.js               live Y.Docs, throttled snapshots to Mongo

client/
  src/
    App.jsx                  the auth gate: splash, sign-in page, or workspace
    Workspace.jsx            the app once you're in. Holds no code text.
    auth/
      AuthProvider.jsx       who you are; restores the session on reload
      AuthPage.jsx           form on the left, illustration on the right
      AuthForm.jsx           sign in / create account
      AuthArt.jsx            flat SVG: two carets in one file, AI writing into it
    lib/
      monacoSetup.js         bundles Monaco — read the comment, it matters
      api.js                 fetch + manual SSE parsing (EventSource can't POST)
      parseMessage.js        splits a reply into prose and code blocks
      remoteCursors.js       colours the collaborators' carets
      token.js  room.js  languages.js  cn.js
    hooks/
      useChat.js             the conversation and its streaming state
      useCollab.js           Yjs + Socket.IO + MonacoBinding, authed handshake
      useMediaQuery.js
    theme/
      ThemeProvider.jsx      dark/light — one `dark` class on <html>
      monacoThemes.js        editor themes built from the same palette as the app
    components/
      layout/     TopBar, RoomBar, StatusBar, SplitPane
      editor/     CodeEditor, LanguageSelect
      chat/       ChatPanel, ChatMessage, ChatInput, CodeBlock, EmptyState
      rooms/      RoomSettings (access + invites), RoomsMenu
      ui/         Toggle, Field, Modal, ThemeToggle
```

---

## Design

Dark and light, no gradients anywhere — flat surfaces and hairline borders only.

Every colour in the app is a CSS variable defined once at the top of
`client/src/index.css`. Tailwind reads them, and so does the Monaco theme
(`theme/monacoThemes.js`), so the editor is genuinely part of the page rather
than a widget dropped into it. Change a value in that one block and the whole
app — chat panel, editor, syntax highlighting — follows.

Warm stone neutrals with a single amber accent. IBM Plex Sans for the interface,
JetBrains Mono for anything that is code or acts like code (the editor, code
blocks, the status bar, cursor labels).

---

## Known limitations

Being honest about these is more useful than pretending they don't exist.

- **Rooms are held in memory while in use, and only snapshotted to Mongo.** That
  works on one Render instance. Scaling to several would need a shared adapter
  (Redis) so two instances don't hold divergent copies of the same room.
- **Undo in a room is Monaco's, not Yjs's.** `Ctrl/Cmd+Z` can undo a
  collaborator's edit rather than only your own. The fix is `Y.UndoManager`
  scoped to your own client ID.
- **The selected language isn't shared.** If the AI switches you to Python, your
  collaborator's editor still says JavaScript (the *code* syncs fine — only the
  syntax highlighting label doesn't). A `Y.Map` for room metadata fixes it.
- **The chat isn't shared.** Each person has their own conversation; only the
  code is common ground.
- **No email verification or password reset.** Registration trusts the address
  you type. Fine for a portfolio project; not fine for real users.
- **Monaco is ~640 KB gzipped**, plus a lazily-loaded TypeScript worker. It's
  split into its own chunk so the app shell paints first. Self-hosting it is not
  optional — see the comment in `lib/monacoSetup.js`.

## Watch out for

- **Groq's free tier is ~30 requests/minute.** The backend rate-limits to 20/min
  per IP before a request can ever reach Groq. Raise `RATE_LIMIT_MAX` if you need
  to, but don't go above 30.
- **Groq retires models.** If the app reports the model is unavailable, pick a
  current one from [console.groq.com/docs/models](https://console.groq.com/docs/models)
  and set `GROQ_MODEL` in `server/.env`. The error message tells you this too.
- **Render's free tier sleeps after 15 minutes idle.** The first request after a
  break takes ~30s. The status bar shows whether the backend is actually awake.

---

## Deploying

**Backend → Render.** Root directory `server`, build `npm install`, start
`npm start`. Set `GROQ_API_KEY`, `GROQ_MODEL`, `MONGODB_URI`, `JWT_SECRET`, and
`ALLOWED_ORIGINS` (your Vercel URL). Render supports websockets on the free tier,
so rooms work.

In MongoDB Atlas, allow `0.0.0.0/0` under **Network Access** — Render's outbound
IP isn't fixed on the free tier, so an allowlist of one address won't work.

**Frontend → Vercel.** Root directory `client`, framework Vite. Set
`VITE_API_URL` to your Render URL.

The backend already accepts any `*.vercel.app` origin by pattern, so preview
deployments work without touching config.

---

## Planned / future work

Deliberately not built. Listed here so it's clear they were a choice, not an
oversight:

- Whiteboard-to-code
- Live diagram generation
- DSA interview mode
- Git integration
- Style learning (matching your personal coding style)
- Full code-review suite
- Shared chat transcript inside a room
- Email verification and password reset
- Refresh tokens (right now a JWT is valid for 7 days and can't be revoked)
- Syntax highlighting inside chat code blocks
