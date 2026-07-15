# Chrome Web Store Submission — Yoxon (v1.3.0)

## Single purpose

> Yoxon is a LinkedIn job-search companion. Its content script adds a
> "Tailor CV with Yoxon" button to LinkedIn job postings that opens the
> posting in Yoxon's CV Studio. Its toolbar popup is a simple launcher to
> three related tools on yoxon.co: CV Studio, the Ghost Job Detector, and
> the Resume Auditor — each a plain outbound link, opened in a new tab.
> All of it exists to help a single user prepare for, evaluate, and tailor
> their applications to LinkedIn job postings — there is no unrelated
> functionality.

## Permission justifications

| Permission | Justification (one sentence, as read by the reviewer) |
|---|---|
| `host_permissions: https://www.linkedin.com/*` | The content script uses this solely to detect job posting pages and insert the "Tailor CV with Yoxon" button next to the Easy Apply button. The script transmits nothing on its own; only when the user clicks the button does it read the currently-viewed posting's title and description and pass them as URL parameters to `yoxon.co/cvbuilder` in a new tab, so CV Studio opens pre-filled with the job the user chose. No background reading, storage, or transmission occurs. |

No other permissions are requested. `activeTab`/`scripting` were requested
in a prior version but were unused and removed; `storage` and the
`https://yoxon.co/*` host permission were required by the popup's old
Ghost Job Checker (an in-popup fetch call) and Application Tracker
(`chrome.storage.local`) — both features have been removed (see below), so
both permissions are gone too. The extension now requests the single
minimum permission its one remaining data-reading behavior needs.

## Data disclosure

**What is read:** the title and description text of the LinkedIn job
posting the user is actively viewing, and only when they click "Tailor CV
with Yoxon."

**What is transmitted, and where:** exactly one flow, to yoxon.co and no
other host — clicking "Tailor CV with Yoxon" passes the posting's
title/description as URL query parameters to `https://yoxon.co/cvbuilder`,
opened in a new tab. The content script does nothing until this click: no
background reading, storage, or transmission.

**The popup makes no network requests and stores nothing.** Its three tabs
(Resume Auditor, Ghost Job Detector, CV Studio) are each a plain
`<a href target="_blank">` link to a yoxon.co page — functionally
identical to clicking a bookmark. No fetch, no `chrome.storage`, no data of
any kind leaves the browser from the popup.

**What is NOT collected:** no browsing history, no LinkedIn profile/
contacts/messages, no analytics or telemetry, no background or passive
data collection — the extension only acts on data the user explicitly
triggers an action on, and only in the one flow above.

## Store listing screenshots (1280×800)

1. A LinkedIn job posting (split view or full page) with the teal "⚡ Tailor
   CV with Yoxon" button visible next to the Apply / Easy Apply button —
   this is the extension's core moment, show it clearly, ideally with a
   real (non-sensitive) job posting.
2. The resulting `yoxon.co/cvbuilder` tab opened after clicking the button,
   showing the job title/description pre-filled into CV Studio — proves
   the end-to-end flow works.
3. (Optional) The extension's toolbar popup showing its three tabs
   (Resume Auditor, Ghost Job Detector, CV Studio), to introduce the popup
   UI in the listing.

## Notes

- `background.js` exists in the source tree but is not referenced by
  `manifest.json` (no `"background"` key) and contains no logic — it is
  excluded from the upload zip.
- No source maps or build tooling are used; `dist/` is a straight copy of
  the runtime files.
- v1.3.0 removed the popup's Ghost Job Checker (in-popup fetch) and
  Application Tracker (`chrome.storage.local`) tabs, replacing them with
  plain outbound links to the same tools now hosted at yoxon.co
  (`/ghost-checker`, `/profile-audit`) alongside CV Studio
  (`/cvbuilder`) — this is why `storage` and the `https://yoxon.co/*` host
  permission are no longer requested.
