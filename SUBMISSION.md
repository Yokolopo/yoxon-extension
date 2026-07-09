# Chrome Web Store Submission — Yoxon (v1.2.2)

## Single purpose

> Yoxon is a LinkedIn job-search companion. Its content script adds a
> "Tailor CV with Yoxon" button to LinkedIn job postings that opens the
> posting in Yoxon's CV Builder. Its toolbar popup is the launcher for that
> same workflow plus two tightly-related tools: a ghost-job risk check for a
> pasted job posting, and a personal application tracker. All three exist to
> help a single user prepare for, evaluate, and keep track of their LinkedIn
> job applications — there is no unrelated functionality.

## Permission justifications

| Permission | Justification (one sentence, as read by the reviewer) |
|---|---|
| `storage` | Stores the user's self-entered job-application tracker entries (company, role, status) locally via `chrome.storage.local`; this data is never transmitted anywhere. |
| `host_permissions: https://www.linkedin.com/*` | The content script uses this solely to detect job posting pages and insert the "Tailor CV with Yoxon" button next to the Easy Apply button. The script transmits nothing on its own; only when the user clicks the button does it read the currently-viewed posting's title and description and pass them as URL parameters to `yoxon.co/cvbuilder` in a new tab, so the CV Builder opens pre-filled with the job the user chose. No background reading, storage, or transmission occurs. |
| `host_permissions: https://yoxon.co/*` | Our own service. Used for one user-initiated feature: job postings the user submits via the popup's Ghost Job Check tab are sent to yoxon.co's API for analysis (identical processing to the Ghost Job Detector on our website). The extension communicates with no hosts other than LinkedIn job pages and our own domain. **Load-bearing:** `/api/ghost-job-check` sends no `Access-Control-Allow-*` headers (verified live, 2026-07-09), so this permission is the only thing making that fetch work — removing it silently breaks the Ghost Job Checker rather than just tightening scope. |

`activeTab` and `scripting` were requested in a prior version but are unused
by any code path (content-script injection is fully static via manifest
`content_scripts`) — both have been removed to minimize the permission
footprint.

## Data disclosure

**What is read:** the title and description text of the LinkedIn job posting
the user is actively viewing when they click "Tailor CV with Yoxon" — or
whatever job-posting text the user manually pastes into the popup's Ghost
Job Checker.

**What is transmitted, and where:** Job-posting content is transmitted in
exactly two user-initiated flows, both to yoxon.co and no other host:
- **Tailor CV flow** — clicking the button reads the currently-viewed
  posting's title/description and passes them as URL query parameters to
  `https://yoxon.co/cvbuilder`, opened in a new tab. The content script does
  nothing until this click: no background reading, storage, or
  transmission.
- **Ghost Job Checker flow** — the pasted posting text is sent as a POST
  body to `https://yoxon.co/api/ghost-job-check`, only at the moment the
  user clicks "Check for red flags." This is the one flow that makes a
  direct network call from the popup itself rather than opening a link.

Neither flow touches any host besides yoxon.co. The popup's three "Open
full X on yoxon.co" links (CV Builder, Ghost Checker, Tracker) are plain
outbound links, not data transmissions.

**Application Tracker** (separate from the above — no job-posting content
involved): company/role/status entries the user types are stored in
`chrome.storage.local` on-device only and are never sent to any server.

**What is NOT collected:** no browsing history, no LinkedIn profile/contacts/
messages, no analytics or telemetry, no background or passive data
collection — the extension only acts on data the user explicitly triggers
an action on.

## Store listing screenshots (1280×800)

1. A LinkedIn job posting (split view or full page) with the teal "⚡ Tailor
   CV with Yoxon" button visible next to the Apply / Easy Apply button —
   this is the extension's core moment, show it clearly, ideally with a
   real (non-sensitive) job posting.
2. The resulting `yoxon.co/cvbuilder` tab opened after clicking the button,
   showing the job title/description pre-filled into the builder — proves
   the end-to-end flow works.
3. (Optional) The extension's toolbar popup showing the CV Builder tab, to
   introduce the popup UI in the listing.

## Notes

- `background.js` exists in the source tree but is not referenced by
  `manifest.json` (no `"background"` key) and contains no logic — it is
  excluded from the upload zip.
- No source maps or build tooling are used; `dist/` is a straight copy of
  the runtime files.
