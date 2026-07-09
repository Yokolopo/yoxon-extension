# Chrome Web Store Submission — Yoxon (v1.2.0)

## Single purpose

> Yoxon is a LinkedIn job-search companion. It adds a "Tailor CV with Yoxon"
> button to LinkedIn job postings that opens the posting in Yoxon's CV
> Builder, and its toolbar popup offers two tightly-related tools for the
> same workflow: a ghost-job risk check for a pasted job posting, and a
> personal application tracker. All three features exist to help a single
> user prepare for, evaluate, and keep track of their LinkedIn job
> applications — there is no unrelated functionality.

## Permission justifications

| Permission | Justification (one sentence, as read by the reviewer) |
|---|---|
| `storage` | Stores the user's self-entered job-application tracker entries (company, role, status) locally via `chrome.storage.local`; this data is never transmitted anywhere. |
| `host_permissions: https://www.linkedin.com/*` | Needed so the content script can detect the Apply / Easy Apply button on LinkedIn job posting pages and inject the "Tailor CV with Yoxon" button next to it. |
| `host_permissions: https://yoxon.co/*` | Needed so the popup can call the yoxon.co ghost-job-check API and open the CV Builder pre-filled with the job posting content, without being blocked by cross-origin restrictions. |

`activeTab` and `scripting` were requested in a prior version but are unused
by any code path (content-script injection is fully static via manifest
`content_scripts`) — both have been removed to minimize the permission
footprint.

## Data disclosure

**What is read:** the title and description text of the LinkedIn job posting
the user is actively viewing when they click "Tailor CV with Yoxon" — or
whatever job-posting text the user manually pastes into the popup's Ghost
Job Checker.

**What is transmitted, and where:**
- Tailor CV flow: the job title/description is passed as URL query
  parameters to `https://yoxon.co/cvbuilder`, opened in a new tab, only at
  the moment the user clicks the button.
- Ghost Job Checker flow: the pasted text is sent as a POST body to
  `https://yoxon.co/api/ghost-job-check`, only at the moment the user clicks
  "Check for red flags."
- Application Tracker: company/role/status entries the user types are
  stored in `chrome.storage.local` on-device only and are never sent to any
  server.

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
