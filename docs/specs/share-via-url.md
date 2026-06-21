# Share Workout Plan via URL

## 1. Summary

Users can share their active workout plan by generating a self-contained URL
that encodes the entire plan. Recipients open the link and get a preview page
with an explicit **Import** action that overwrites their active plan. There is
no server, no storage, no analytics — the URL is the entire payload.

## 2. Goals

- A user on Device A can send their plan to a user on Device B using a single
  copy-pasteable URL.
- The URL is safe to share in chat clients, email, and QR codes (no `+`, `/`,
  `=` padding characters from base64; no `&` / `?` clashes with query params).
- Recipient's local data is never overwritten without an explicit Import click.
- The feature works fully offline once the app is loaded (PWA-friendly).
- The encoding is forward-compatible: a v1 decoder can reject v2 payloads
  with a clear error, and a v2 decoder can still read v1.

## 3. Non-goals

- Multiple named plans / plan library. (The current model has a single active
  plan and this feature does not change that.)
- Live editing / collaborative plans.
- Round-tripping session history through a URL.
- Server-side shortening, analytics, or any backend.

## 4. User-facing behavior

### 4.1 Generating a share URL (sender)

On the Plan Editor page (`/plan`), next to the existing **Save** button, there
is a new **Share** button. It is enabled only when there is a saved plan with
at least one exercise whose name is non-empty.

Clicking **Share** opens a modal that:
1. Shows a read-only text input pre-filled with the full share URL,
   formatted as `<origin><base>share#data=<payload>`. The `<base>` is
   the configured Vite `BASE` (e.g. `/personal-gym/`).
2. Shows a **Copy** button that copies the URL to the clipboard and shows a
   brief "Copied!" confirmation.
3. Shows the decoded exercise count and a one-line summary
   (e.g. "5 exercises, ~1.2 KB encoded").

The modal has a **Close** button. No data is written to storage by opening
or closing the modal.

### 4.2 Opening a share URL (recipient)

Visiting any URL whose hash starts with `#data=` routes to a new
`/share` page (the route accepts the same hash regardless of how the user
arrives — typed, clicked, or scanned).

The `/share` page:
1. Reads and decodes the payload from `window.location.hash`.
2. On success, renders a **preview** of the plan: each exercise's name, sets,
   reps, rest seconds, and instructions (collapsed by default, expandable).
3. Shows two buttons: **Import this plan** (primary) and **Cancel** (secondary).
4. On decode failure, shows a friendly error
   ("This share link is invalid or corrupted.") with a link back to `/`.

#### 4.2.1 Import

Clicking **Import this plan**:
1. Calls `planRepo.savePlan({ exercises })` using the **normalised** exercises
   from the decoded payload (i.e. exercises go through the same
   `normaliseExercise` pipeline as the editor).
2. On success, clears the hash from the URL and navigates to `/plan` so the
   user sees their newly imported plan in the editor.
3. On failure, shows an inline error and keeps the preview visible. The user
   can retry.

Import always **replaces** the active plan. The previous plan is gone after
import; session history is untouched.

#### 4.2.2 Cancel

Clicking **Cancel**, pressing Escape, or clicking the page backdrop navigates
to `/` with the hash cleared. Nothing is saved.

### 4.3 Visible URL length

A realistic 10-exercise plan with English names, short instructions, and
numeric fields encodes to under **600 characters** of base64url. The total
URL stays under 2000 characters even on the largest plans we expect
(~20 exercises), which is well within practical limits for chat clients and
QR codes.

## 5. URL & payload format

### 5.1 URL shape

```
<origin><base>share#data=<payload>
```

Examples:
- Local dev: `http://localhost:5173/personal-gym/share#data=eyJ2Ijox...`
- GitHub Pages: `https://nnn.github.io/personal-gym/share#data=eyJ2Ijox...`

The hash fragment is used (not the query string) so:
- The payload is never sent to any server in the `Referer` header.
- React Router can read it from `window.location.hash` without coupling to
  URL parsing libraries.

### 5.2 Wire format

The `<payload>` is:

1. A JSON object:
   ```json
   { "v": 1, "exercises": [ /* Exercise[] in display order */ ] }
   ```
   - `v`: integer, schema version. **This feature defines v1.**
   - `exercises`: array of `Exercise` (id, name, sets, reps, instructions,
     restSeconds, order) **without** the surrounding `WorkoutPlan` envelope
     (no `id`, `createdAt`, `updatedAt`).
2. Serialised to UTF-8 JSON bytes.
3. Compressed with the gzip format via the platform `CompressionStream` API.
4. Encoded as **base64url** (RFC 4648 §5: `A-Z a-z 0-9 - _`, no padding).

### 5.3 Versioning

- A decoder MUST reject a payload whose `v` is greater than the highest
  version it supports, with a clear error: "This share link was created with
  a newer version of the app."
- A decoder MUST reject a payload whose `v` is less than `1` (i.e. missing
  or non-integer), with: "This share link is invalid or corrupted."
- Adding fields to an existing exercise is allowed in a future v1.x; a v1
  decoder ignores unknown fields. (Not implemented in this spec, but the
  decoder is structured to permit it.)

## 6. Functional requirements

### 6.1 Encoding

`encodePlanToPayload(plan) -> string` (base64url string):
1. Build a v1 envelope: `{ v: 1, exercises: plan.exercises }`.
2. Stringify with `JSON.stringify`.
3. Encode to UTF-8 bytes (`new TextEncoder().encode`).
4. Pipe through `CompressionStream('gzip')`, collect chunks, concatenate.
5. Encode bytes to base64url: standard base64 with `+`→`-`, `/`→`_`,
   `=` padding stripped.
6. Return the resulting string.

### 6.2 Decoding

`decodePayloadToPlan(payload) -> { v: 1, exercises: Exercise[] }`:
1. Validate that the input is a non-empty base64url string
   (`^[A-Za-z0-9_-]+$`).
2. Re-add base64 padding to a multiple of 4 (append `=` chars).
3. Decode base64 to bytes (`atob` on each char's byte value, then
   `Uint8Array`).
4. Pipe bytes through `DecompressionStream('gzip')`, collect chunks,
   concatenate.
5. Decode UTF-8 (`new TextDecoder().decode`).
6. `JSON.parse` and validate the result with a schema check:
   - `v` is the integer `1`.
   - `exercises` is an array of objects with the required string/number
     fields (or that can be coerced by `normaliseExercise`).
7. Run each exercise through `normaliseExercise` to guarantee the shape
   the rest of the app expects.
8. Return `{ v, exercises }`.

On any failure (invalid base64, bad gzip, bad JSON, schema mismatch,
unsupported version), throw a `SharePayloadError` whose `code` is one of:
`EMPTY`, `INVALID_BASE64`, `INVALID_GZIP`, `INVALID_JSON`, `INVALID_SCHEMA`,
`UNSUPPORTED_VERSION`.

### 6.3 Building a share URL

`buildShareUrl({ origin, base, payload }) -> string`:
- Returns `${origin}${base}share#data=${payload}`.
- The `BASE` is the same constant the app uses elsewhere
  (`/${REPO_NAME}/`, defaulting to `/` if not set). To avoid a hard import
  coupling, the function accepts the origin and base as arguments and the
  UI layer composes them. The pure function does not read `window`.

### 6.4 Parsing a share URL into a payload

`extractPayloadFromHash(hash) -> string | null`:
- If `hash` is falsy or does not start with `#data=`, return `null`.
- Otherwise return the substring after `#data=`, URL-decoded once.
- Never throw.

### 6.5 UI integration

- `PlanEditorPage` adds a **Share** button that:
  - is disabled when the in-memory plan is empty or no exercise has a name;
  - on click, computes the payload from the **last saved** plan (from
    `usePlan().plan`), generates the URL, and opens the Share modal.
- `App.jsx` adds a route `<Route path="share" element={<SharePage />} />`.
- `SharePage` reads the hash, decodes, previews, and handles Import / Cancel.

## 7. Non-functional requirements

- **Performance**: encoding + decoding a 20-exercise plan completes in
  under 50 ms on a mid-range mobile device.
- **Browser support**: requires `CompressionStream`, `DecompressionStream`,
  `crypto.randomUUID`, `TextEncoder`, `TextDecoder`, and `atob`. All are
  available in every browser the app already supports.
- **Test environment**: `jsdom` (used by Vitest) does not implement
  `CompressionStream`. Encoding/decoding helpers MUST be split so the pure
  envelope + base64url logic is unit-testable in jsdom, and the compression
  step is tested via Playwright e2e. The unit test suite polyfills
  `CompressionStream` / `DecompressionStream` for the encoding module only.
- **No new dependencies**. The base64url + gzip pipeline is implemented in
  the standard library.
- **Determinism**: `encodePlanToPayload` is **not** required to be
  byte-deterministic across runs (gzip timestamps, etc.). The unit test
  asserts round-trip identity, not byte equality.

## 8. Failure modes

| Trigger                                  | User-visible behavior                                          |
| ---------------------------------------- | -------------------------------------------------------------- |
| Recipient's app is older than sender's   | "This share link was created with a newer version of the app." |
| URL truncated or mistyped                | "This share link is invalid or corrupted."                     |
| Recipient imports while offline          | Works (everything is local).                                   |
| User clicks Share on an unsaved editor   | Button is disabled.                                            |
| User clicks Share on a plan with no named exercise | Button is disabled.                                    |
| User opens share URL, then opens another share URL | Page re-renders with the new payload. No state leaks.     |
| Import fails (e.g. IndexedDB quota)      | Inline error, preview remains visible, retry possible.         |

## 9. Out of scope (deferred)

- QR code generation in the share modal.
- Short links (would need a server, contradicting §1).
- Read-only "view this plan" mode that does not require the recipient to
  have the app installed.
- Plan name / metadata in the payload (current model has none).
