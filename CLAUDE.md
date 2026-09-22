# Flip-Prototype Wiki — Agent Schema

## Identity

This is an LLM-maintained knowledge base for the Flip-Prototype project. Scope: HTML5 Canvas game prototype — full game design spec + code will be built here. Nothing outside this domain belongs here.

## Priority Access Order

At the start of every session and before any task, read in this order:
1. `Commands and Logs/ingest-log.md` — check for incomplete ingests
2. `Commands and Logs/main-index.md` — map of all wiki pages
3. `Commands and Logs/wiki-log.md` — wiki session history
4. `Commands and Logs/directory-log.md` — full directory event history

All new instruction files and rule documents must be added to `Commands and Logs/` only.

---

## Folder Rules

**`raw/`** — Immutable. Read from here; never create, edit, or delete files. After ingest, source files move into `raw/(Ingested) DD-MM-YY/`.

**`Reference Files/`** — Read-only. Never create, edit, or delete files. Always navigate via `reference-index.md`. If file not in index: ask *"File not found — Perform Broad Search? Yes / No / Enter file path yourself"*.

**`Working Files/`** — In-progress documents only. On finalize: move to `raw/DD-MM-YY/`. Always navigate via `working-files-index.md`. Missing-file prompt as above.

**`Output/`** — Final exports only. Read-only. Allowed formats: `.docx`, `.pdf`, `.xlsx`. Naming: `Filename_Version x.x`. New version → move old to `Deprecated/`. If multiple deprecated versions exist for the same file, consolidate into `Deprecated/[Filename]/`. MD files not permitted; if requested, warn + confirm, save to `MD Files/` only. All events logged in `output-index.md`.

**`wiki/`** — Fully LLM-owned. Subfolders: `systems/` (design-level), `entities/` (classes, configs, enums, parameters), `concepts/` (algorithms, logic rules, patterns), `sources/` (one summary per ingested source).

**`Commands and Logs/`** — All control files (indexes, logs, instructions). All new instruction or rule files go here only — never elsewhere.

**`Maintenance/`** — See the Maintenance/ folder canonical statement at the bottom of this file. Contents and operational rules: the Maintenance + Reinstall + Structural Change section below.

## Index Files

Every folder has an index. The agent reads the index first, opens only the specific file needed. Never broad-search.

| Index | Folder | Maintained on |
|-------|--------|---------------|
| `Commands and Logs/main-index.md` | `wiki/` | Every ingest |
| `Commands and Logs/ingest-log.md` | `raw/` | Every move to raw/ and every completed ingest |
| `Reference Files/reference-index.md` | `Reference Files/` | New file detected |
| `Working Files/working-files-index.md` | `Working Files/` | Every add, move, finalize |
| `Output/output-index.md` | `Output/` | Every output, deprecation, MD exception |

**main-index.md format:**
```markdown
## Systems
- [Page Title](../wiki/systems/page.md) — one-line description

## Entities
- [Page Title](../wiki/entities/page.md) — one-line description

## Concepts
- [Page Title](../wiki/concepts/page.md) — one-line description

## Source Summaries
- [Source Title](../wiki/sources/page.md) — one-line description
```

Links are relative to `main-index.md`'s own location in `Commands and Logs/`, hence the `../` prefix. The GPS §1.3 template omits it; that form resolves to `Commands and Logs/wiki/` and does not open.

**ingest-log.md format:**
```markdown
| File | Date Added | Status | Date Ingested |
|------|------------|--------|---------------|
| filename.md | DD-MM-YY | ✅ Complete | DD-MM-YY |
| filename.md | DD-MM-YY | ⏳ Incomplete | — |
```

**output-index.md format:**
```markdown
## Current Outputs
| File | Version | Format | Date Added |

## Deprecated
| File | Version | Format | Date Deprecated | Location |

## MD Files (Exception Saves)
| File | Date Saved | Confirmed By |
```

## Log Files

**`wiki-log.md`** — Wiki operations only. Append-only. Never edit past entries.
```markdown
## [DD-MM-YY] <operation> | <title>
<one-line summary>
```
Operations: `ingest` | `query` | `lint` | `update` | `setup`

**`directory-log.md`** — Master history of every file operation across the entire directory. Append-only.
```markdown
### [DD-MM-YY HH:MM] — <EVENT TYPE> | <target>
- **Action:** <what happened>
- **Location:** <path>
- **Reason:** <why>
- **Source Log:** <which other log records this, or — if none>
```
Event types: `CREATED` | `EDITED` | `MOVED` | `RENAMED` | `DELETED` | `INGESTED` | `OUTPUT` | `DEPRECATED` | `ARCHIVED` | `SETUP`

**Rule:** If file history or operation order is in question in a new session, read `directory-log.md` first before grepping any files.

## Decision Log Rule

Every `.md` file created or edited must have a Decision Log block appended at the end. The agent reads it first when opening a file in a new session.

```markdown
---

## Decision Log

### [DD-MM-YY] — <one-line description of session>
- **Added:** <what was added>
- **Removed:** <what was removed, if any>
- **Choices given:** <options presented> → **Chosen:** <what was selected>
- **Notes:** <any other relevant decisions>
```

Rules:
- Append-only — never delete past entries.
- One entry per session/edit pass.
- Read before editing — gives context on prior decisions.
- Present in `.md` files only — omit entirely from PDF/DOCX/XLSX exports.
- On export, append to the source MD Decision Log: `- **Printed:** <format> exported on DD-MM-YY`.
- **Exception:** append-only log files (`wiki-log.md`, `directory-log.md`, `ingest-log.md`) are themselves the historical record and do not require a Decision Log block. Only the four navigation indexes are checked for Decision Log presence.

## Workflows

### SESSION START

Runs automatically at the start of every session.

1. Read `Commands and Logs/ingest-log.md`. Scan for `⏳ Incomplete`.
2. If any incomplete: list them, ask *"Uningested files found. Run Ingest now? Yes / No"*.
   - Yes → run INGEST for each in order, return here.
   - No → note, remind next session.
3. Read in order: `main-index.md`, `wiki-log.md`, `directory-log.md`.
4. Ask *"Run LINT check? Yes / No"*. Yes → run LINT.

### INGEST

Trigger: "process [filename]" or "ingest [filename]", or via the SESSION START prompt.

1. Read source at `raw/<filename>` in full.
2. Summarize 3–5 key takeaways. Confirm emphasis with user: *"Confirm emphasis before I write pages? Yes / Adjust"*.
3. Write `wiki/sources/<slug>.md` — what the source is, key facts, links to pages it informed.
4. Create or update pages in `wiki/systems/`, `wiki/entities/`, `wiki/concepts/`. When updating, preserve accurate content, revise stale claims, note contradictions explicitly. When creating, read `main-index.md` first for related pages and link bidirectionally (see Cross-Reference Rule).
5. Update `main-index.md` — add new entries, revise descriptions.
6. Append to `wiki-log.md`: `## [DD-MM-YY] ingest | <source title>` + one-line summary.
7. Update `ingest-log.md` — set Status to `✅ Complete`, Date Ingested to today.
8. Archive source: move `raw/<filename>` → `raw/(Ingested) DD-MM-YY/` (create folder if missing).
9. Append to `directory-log.md` — INGESTED + MOVED events (combine if same minute).

### QUERY

Trigger: any project question.

1. Read `main-index.md`. Identify relevant wiki pages.
2. Read only those pages.
3. Synthesize answer with citations linking to wiki pages (never to raw source files).
4. If wiki insufficient or user asks: prompt *"Wiki or Grep?"* before searching raw files.
5. If answer is non-trivial and likely to be asked again: offer *"File as wiki page? Yes / No"*.

### LINT

Trigger: "lint" or "health check".

1. Read every page in `wiki/systems/`, `wiki/entities/`, `wiki/concepts/`, `wiki/sources/`.
2. Check for:
   - Orphan pages — no inbound links
   - Stale claims — superseded by newer ingested sources
   - Contradictions — conflicting claims across pages
   - Missing cross-references — related pages not linked
   - Undocumented concepts — terms mentioned but lacking own page
   - Data gaps — thin topics fillable by new sources
3. Report findings as numbered checklist.
4. Suggest new questions worth investigating and new sources worth adding.
5. Fix items one at a time on user approval.
6. Append to `wiki-log.md`: `## [DD-MM-YY] lint | Health check — N issues fixed`.

### Working → Final → Raw

1. Create file in `Working Files/`. Update `working-files-index.md`. Append to `directory-log.md` (CREATED).
2. Edit in place. Update file's Decision Log per session. Update index if status changes.
3. On user "Final": create `raw/DD-MM-YY/` if needed. Move file from `Working Files/` to `raw/DD-MM-YY/`. Update `working-files-index.md` (mark Finalized + note destination). Append to `directory-log.md` (MOVED).
4. Run INGEST. On completion, rename folder `raw/DD-MM-YY/` → `raw/(Ingested) DD-MM-YY/`.

### Output Generation

1. Confirm source MD is ready in `Working Files/`.
2. Check `output-index.md` for current version. Increment: minor (x.1) for small updates, major (x.0) for revisions.
3. If a current version exists in `Output/`: move it to `Output/Deprecated/`. If multiple deprecated versions of the same file already exist, consolidate into `Output/Deprecated/[Filename]/`. Update output-index Deprecated table.
4. Export to requested format (DOCX/PDF/XLSX). **Omit the Decision Log from the export.** Name: `Filename_Version x.x.ext`. Save to `Output/`.
5. Append to source MD Decision Log: `- **Printed:** <format> exported on DD-MM-YY`.
6. Update `output-index.md` Current Outputs table. Append to `directory-log.md` (OUTPUT + DEPRECATED if applicable).

### Reference File Added

1. Detect new file in `Reference Files/` not yet in `reference-index.md`.
2. Add entry to `reference-index.md` with one-line description under correct section.
3. Append to `directory-log.md` (CREATED).

## Cross-Reference Rule

When creating or updating any wiki page:
1. Read `main-index.md` first.
2. Identify related pages.
3. Add links to those related pages in the body of the page being written.
4. If a new page was created, go back to the most relevant existing pages and add a link to the new page from them. Bidirectional linkage required.

## Maintenance + Reinstall + Structural Change

### Maintenance/ folder

User-restriction rule: see the Maintenance/ folder canonical statement at the bottom of this file.

**Contents (operational reference — single source of truth):**
- `wiki-setup-controller.md` — original setup file archived here on setup completion; used by REINSTALL Workflow below.
- `setup-log.md` — setup record, decisions made, original structure snapshot, Verification Report, structural change log, reinstall history.

### REINSTALL Workflow

Triggered when user says "Reinstall System".

1. Read `Maintenance/wiki-setup-controller.md` — the original setup file archived there.
2. Read `Maintenance/setup-log.md` — the original file structure snapshot section.
3. Compare snapshot vs current directory state. List every folder and file in the snapshot; check each exists.
4. Identify missing folders, missing files, misplaced files, broken index references.
5. Rebuild only what is missing or broken — never overwrite files that exist and are correct.
6. Append repair report to `Maintenance/setup-log.md` under Reinstall History:
   ```
   ### [DD-MM-YY HH:MM] — REINSTALL
   - **Triggered by:** User
   - **Issues found:** <list>
   - **Repaired:** <what was rebuilt>
   - **Not touched:** <what was already correct>
   ```
7. Report to user what was found and fixed.

### Structural Change Rule

Whenever any folder is created, file moved, file renamed, file deleted, or new subfolder added anywhere in the directory, the agent must:

1. Append an entry to `Maintenance/setup-log.md` Structural Change Log.
2. Append an entry to `Commands and Logs/directory-log.md`.

Dual-write ensures both the live audit trail (directory-log) and the recovery baseline (setup-log) stay current.

Entry format:
```
### [DD-MM-YY HH:MM] — <EVENT TYPE> | <target>
- **Action:** <what happened>
- **Location:** <path>
- **Reason:** <why>
- **Linkages/References affected:** <any indexes, logs, or wiki pages that reference this path>
```

---

## OS + Schema-naming compatibility — CANONICAL STATEMENT

- All paths use forward slashes `/`. Works natively on macOS, Linux (Debian/Arch), and Windows (PowerShell, CMD, WSL, Git, VS Code).
- Schema file is named `CLAUDE.md` by default. Rename per agent: keep `CLAUDE.md` for Claude Code/Cowork, use `AGENTS.md` for OpenAI Codex, fall back to `SCHEMA.md` for other agents. Contents identical regardless of filename.
- Agent uses OS-native file operations automatically. No platform-specific logic required.

## Maintenance/ folder — CANONICAL STATEMENT

- AI-managed only. User must never edit, move, or delete files inside `Maintenance/`.
- If user attempts: warn and decline.
- Updated only by: setup completion, Reinstall System, structural-change events.

---

## Decision Log

### [22-09-26] — Initial schema generated by GPS (Claude build)
- **Added:** Full schema generated from GPS §1.2–§1.8 with project-specific identity preamble.
- **Notes:** Generated by GPS Claude V2 setup sequence. Schema filename defaulted to CLAUDE.md for Claude auto-read.

### [22-09-26] — main-index.md link format corrected
- **Removed:** `wiki/<folder>/page.md` link form in the Index Files section.
- **Added:** `../wiki/<folder>/page.md` form plus a note explaining the prefix.
- **Notes:** Deviation from the GPS §1.3 template, made deliberately. `main-index.md` lives in `Commands and Logs/`, so the template's link form resolves to `Commands and Logs/wiki/` and the links do not open. Caught by a link check during the Flip TDD ingest, which reported 16 broken links; corrected in `main-index.md` and here so future ingests use the working form. All 225 wiki links verified resolving after the fix.
