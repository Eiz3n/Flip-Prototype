# GPS — Claude Project Setup

> **Claude-specific build of GPS V2.** Forked from `GPS - Guided Project Setup.md` (agent-agnostic V2). Optimised for Claude Code and Claude Cowork: defaults to `CLAUDE.md` as the schema filename so Claude auto-reads it at session start. Architecture unchanged from V2 — ~50% smaller than the original V1 Claude controller, single-source-of-truth rules, parallel-batched execution, minimal token output.

---

## ⚙️ Agent Instructions — Read First

**On session open (file detected in directory):**
1. Read this Agent Instructions block and §0 Internal Navigation Index **only**. Do not read any other section.
2. Confirm to user: *"GPS Claude setup file loaded. Say **'Setup System'** to begin, or **'Setup Help'** for an overview."*
3. Wait.

**Triggers**

| Phrase | Action |
|--------|--------|
| `Setup System` | Execute §2 Setup Sequence in full |
| `Reinstall System` | Execute §1.8 REINSTALL Workflow |
| `Setup Help` | Print §4 Cheatsheet only |

**Minimal-read rule** (do not deviate)

- Read §1 (Canonical Rules) only when generating or updating the schema file (Phase 3 of setup) or answering rule questions.
- Read §3 (Templates) only during setup phases — §3.0–§3.7 in Phase 2, §3.8 in Phase 4, §3.9 in Phase 5. Jump directly to the specific §3.X sub-template needed.
- Never read end-to-end. Use §0 Internal Index to jump.

**Claude auto-read behaviour — CANONICAL STATEMENT**
(Referenced from §2.3 and the post-setup Cheatsheet. Do not duplicate this content elsewhere in the file.)

- Claude Code and Claude Cowork automatically read `CLAUDE.md` at the start of every session. This is why CLAUDE.md is the default schema filename for this build — once setup completes, the schema is active without any user prompt.
- If the agent in use is not Claude, see the OS + Schema-naming canonical statement below for the rename mapping.

**OS + Schema-naming compatibility — CANONICAL STATEMENT**
(Referenced from all other sections. Do not duplicate this content elsewhere in the file.)

- All paths use forward slashes `/`. Works natively on macOS, Linux (Debian/Arch), and Windows (PowerShell, CMD, WSL, Git, VS Code).
- Schema file is named `CLAUDE.md` by default. Rename per agent: keep `CLAUDE.md` for Claude Code/Cowork, use `AGENTS.md` for OpenAI Codex, fall back to `SCHEMA.md` for other agents. Contents identical regardless of filename.
- Agent uses OS-native file operations automatically. No platform-specific logic required.

**Maintenance/ folder — CANONICAL STATEMENT**
(Referenced from §1.2 and §1.8. Do not duplicate this content elsewhere.)

- AI-managed only. User must never edit, move, or delete files inside `Maintenance/`.
- If user attempts: warn and decline.
- Updated only by: setup completion, Reinstall System, structural-change events.

---

## §0 — Internal Navigation Index

Use this index to jump directly to the section needed. Each entry uses an exact heading search string as the jump target (line numbers shift on edits; search strings are stable).

### Top-level map

| § | Heading search string | Purpose | Read when... |
|---|------------------------|---------|--------------|
| — | `## ⚙️ Agent Instructions — Read First` | Triggers + minimal-read + Claude auto-read + OS/schema/Maintenance canonical statements | File first opens, on every trigger |
| §0 | `## §0 — Internal Navigation Index` | This index | First open |
| §1 | `## §1 — Canonical Rules` | Single source of truth for all system rules. Embedded into schema file at setup. | Generating schema; answering rule questions |
| §1.1 | `### §1.1 — Folder Structure` | Directory tree | Building/verifying folders |
| §1.2 | `### §1.2 — Folder Rules` | Per-folder allowed/disallowed actions | Determining what is allowed in a folder |
| §1.3 | `### §1.3 — Index Files` | Format and maintenance rules for every index | Creating/updating an index file |
| §1.4 | `### §1.4 — Log Files` | wiki-log + directory-log formats | Appending log entries |
| §1.5 | `### §1.5 — Decision Log Rule` | Required Decision Log block at bottom of every .md | Before editing any .md file |
| §1.6 | `### §1.6 — Workflows` | All 7 operational workflows | See §1.6 sub-index below |
| §1.7 | `### §1.7 — Cross-Reference Rule` | Bidirectional wiki linking | Creating/updating wiki pages |
| §1.8 | `### §1.8 — Maintenance + Reinstall + Structural Change` | Recovery system + structural-change dual-write | Maintenance ops; Reinstall System trigger |
| §2 | `## §2 — Setup Sequence` | Executable setup procedure (Phases 1–5) | On "Setup System" trigger |
| §2.5 | `## §2.5 — Phase 5: Verification Pass` | Post-setup 41-check verification + Verification Report | After Phase 4; for audit |
| §3 | `## §3 — Templates` | File templates referenced by §2 | During Phase 2 of setup |
| §4 | `## §4 — Cheatsheet` | 10-line post-setup printout for user | End of setup; "Setup Help" trigger |
| — | `## Decision Log` | Edit history of this file | Before editing this file |

### §1.6 Workflows sub-index

| § | Heading search string | Trigger | Use |
|---|------------------------|---------|-----|
| 1.6.1 | `#### §1.6.1 — SESSION START` | Auto on session open | Check incomplete ingests, read context, offer LINT |
| 1.6.2 | `#### §1.6.2 — INGEST` | "process [filename]" / "ingest [filename]" | Source → wiki pages |
| 1.6.3 | `#### §1.6.3 — QUERY` | Any project question | Wiki-first answer; optional file-back |
| 1.6.4 | `#### §1.6.4 — LINT` | "lint" / "health check" | Orphans, stale claims, gaps |
| 1.6.5 | `#### §1.6.5 — Working → Final → Raw` | User declares file Final | Promote + ingest |
| 1.6.6 | `#### §1.6.6 — Output Generation` | Export request (DOCX/PDF/XLSX) | Version bump + save |
| 1.6.7 | `#### §1.6.7 — Reference File Added` | New file in Reference Files/ | Update reference-index.md |

### §2 Setup Sequence sub-index

| Phase | Heading search string | Purpose |
|-------|------------------------|---------|
| 1 | `### §2.1 — Phase 1: Collect Data` | One question (with inference) → name + domain + scope |
| 2 | `### §2.2 — Phase 2: Build Structure` | Batch mkdir + parallel file writes |
| 3 | `### §2.3 — Phase 3: Embed Schema` | Generate CLAUDE.md from §1 |
| 4 | `### §2.4 — Phase 4: Finalize` | setup-log, archive controller, log entry |
| 5 | `## §2.5 — Phase 5: Verification Pass` | 41-check verification + Verification Report + final user message |

### Quick-lookup

| Looking for... | Section |
|----------------|---------|
| Trigger words | Agent Instructions |
| Claude auto-read behaviour | Agent Instructions (canonical statement) |
| What goes in raw/ vs Working Files/ vs Output/ | §1.2 |
| Format of main-index / ingest-log / output-index | §1.3 |
| Format of wiki-log / directory-log | §1.4 |
| Decision Log block | §1.5 |
| How to ingest a new source | §1.6.2 |
| How to export DOCX/PDF/XLSX | §1.6.6 |
| Reinstall System procedure | §1.8 |
| What happens on "Setup System" trigger | §2 |
| File templates (initial state of indexes, setup-log) | §3 |

---

## §1 — Canonical Rules

> Single source of truth for all system rules. The schema file (CLAUDE.md) is generated by copying §1.2 through §1.8 verbatim into a schema scaffold (see §2.3 Phase 3). No rule should appear elsewhere in this file.

### §1.1 — Folder Structure

```
ProjectName/
├── CLAUDE.md                       ← Agent schema (rename per agent if not Claude)
│
├── raw/                            ← Immutable source documents
│   └── (Ingested) DD-MM-YY/        ← Archived after ingest
│
├── Reference Files/                ← Read-only reference material
│   └── reference-index.md
│
├── Working Files/                  ← In-progress documents
│   └── working-files-index.md
│
├── Output/                         ← Final exports (DOCX/PDF/XLSX)
│   ├── Deprecated/
│   ├── MD Files/
│   └── output-index.md
│
├── wiki/                           ← LLM-maintained synthesized pages
│   ├── systems/
│   ├── entities/
│   ├── concepts/
│   └── sources/
│
├── Commands and Logs/              ← Control files
│   ├── main-index.md
│   ├── wiki-log.md
│   ├── ingest-log.md
│   └── directory-log.md
│
└── Maintenance/                    ← AI-managed only
    ├── wiki-setup-controller.md
    └── setup-log.md
```

(Path notation + OS rules: see Agent Instructions canonical statement. Do not duplicate here.)

### §1.2 — Folder Rules

**`raw/`** — Immutable. Read from here; never create, edit, or delete files. After ingest, source files move into `raw/(Ingested) DD-MM-YY/`.

**`Reference Files/`** — Read-only. Never create, edit, or delete files. Always navigate via `reference-index.md`. If file not in index: ask *"File not found — Perform Broad Search? Yes / No / Enter file path yourself"*.

**`Working Files/`** — In-progress documents only. On finalize: move to `raw/DD-MM-YY/`. Always navigate via `working-files-index.md`. Missing-file prompt as above.

**`Output/`** — Final exports only. Read-only. Allowed formats: `.docx`, `.pdf`, `.xlsx`. Naming: `Filename_Version x.x`. New version → move old to `Deprecated/`. If multiple deprecated versions exist for the same file, consolidate into `Deprecated/[Filename]/`. MD files not permitted; if requested, warn + confirm, save to `MD Files/` only. All events logged in `output-index.md`.

**`wiki/`** — Fully LLM-owned. Subfolders: `systems/` (design-level), `entities/` (classes, configs, enums, parameters), `concepts/` (algorithms, logic rules, patterns), `sources/` (one summary per ingested source).

**`Commands and Logs/`** — All control files (indexes, logs, instructions). All new instruction or rule files go here only — never elsewhere.

**`Maintenance/`** — See Agent Instructions canonical statement. Contents and operational rules: §1.8.

### §1.3 — Index Files

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
- [Page Title](wiki/systems/page.md) — one-line description

## Entities
- [Page Title](wiki/entities/page.md) — one-line description

## Concepts
- [Page Title](wiki/concepts/page.md) — one-line description

## Source Summaries
- [Source Title](wiki/sources/page.md) — one-line description
```

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

### §1.4 — Log Files

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

### §1.5 — Decision Log Rule

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
- **Exception:** append-only log files (`wiki-log.md`, `directory-log.md`, `ingest-log.md`) are themselves the historical record and do not require a Decision Log block. Item 40 in §2.5 verification reflects this: only the four navigation indexes are checked for Decision Log presence.

### §1.6 — Workflows

#### §1.6.1 — SESSION START

Runs automatically at the start of every session.

1. Read `Commands and Logs/ingest-log.md`. Scan for `⏳ Incomplete`.
2. If any incomplete: list them, ask *"Uningested files found. Run Ingest now? Yes / No"*.
   - Yes → run §1.6.2 INGEST for each in order, return here.
   - No → note, remind next session.
3. Read in order: `main-index.md`, `wiki-log.md`, `directory-log.md`.
4. Ask *"Run LINT check? Yes / No"*. Yes → run §1.6.4.

#### §1.6.2 — INGEST

Trigger: "process [filename]" or "ingest [filename]", or via §1.6.1 prompt.

1. Read source at `raw/<filename>` in full.
2. Summarize 3–5 key takeaways. Confirm emphasis with user: *"Confirm emphasis before I write pages? Yes / Adjust"*.
3. Write `wiki/sources/<slug>.md` — what the source is, key facts, links to pages it informed.
4. Create or update pages in `wiki/systems/`, `wiki/entities/`, `wiki/concepts/`. When updating, preserve accurate content, revise stale claims, note contradictions explicitly. When creating, read `main-index.md` first for related pages and link bidirectionally (see §1.7).
5. Update `main-index.md` — add new entries, revise descriptions.
6. Append to `wiki-log.md`: `## [DD-MM-YY] ingest | <source title>` + one-line summary.
7. Update `ingest-log.md` — set Status to `✅ Complete`, Date Ingested to today.
8. Archive source: move `raw/<filename>` → `raw/(Ingested) DD-MM-YY/` (create folder if missing).
9. Append to `directory-log.md` — INGESTED + MOVED events (combine if same minute).

#### §1.6.3 — QUERY

Trigger: any project question.

1. Read `main-index.md`. Identify relevant wiki pages.
2. Read only those pages.
3. Synthesize answer with citations linking to wiki pages (never to raw source files).
4. If wiki insufficient or user asks: prompt *"Wiki or Grep?"* before searching raw files.
5. If answer is non-trivial and likely to be asked again: offer *"File as wiki page? Yes / No"*.

#### §1.6.4 — LINT

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

#### §1.6.5 — Working → Final → Raw

1. Create file in `Working Files/`. Update `working-files-index.md`. Append to `directory-log.md` (CREATED).
2. Edit in place. Update file's Decision Log per session. Update index if status changes.
3. On user "Final": create `raw/DD-MM-YY/` if needed. Move file from `Working Files/` to `raw/DD-MM-YY/`. Update `working-files-index.md` (mark Finalized + note destination). Append to `directory-log.md` (MOVED).
4. Run §1.6.2 INGEST. On completion, rename folder `raw/DD-MM-YY/` → `raw/(Ingested) DD-MM-YY/`.

#### §1.6.6 — Output Generation

1. Confirm source MD is ready in `Working Files/`.
2. Check `output-index.md` for current version. Increment: minor (x.1) for small updates, major (x.0) for revisions.
3. If a current version exists in `Output/`: move it to `Output/Deprecated/`. If multiple deprecated versions of the same file already exist, consolidate into `Output/Deprecated/[Filename]/`. Update output-index Deprecated table.
4. Export to requested format (DOCX/PDF/XLSX). **Omit the Decision Log from the export.** Name: `Filename_Version x.x.ext`. Save to `Output/`.
5. Append to source MD Decision Log: `- **Printed:** <format> exported on DD-MM-YY`.
6. Update `output-index.md` Current Outputs table. Append to `directory-log.md` (OUTPUT + DEPRECATED if applicable).

#### §1.6.7 — Reference File Added

1. Detect new file in `Reference Files/` not yet in `reference-index.md`.
2. Add entry to `reference-index.md` with one-line description under correct section.
3. Append to `directory-log.md` (CREATED).

### §1.7 — Cross-Reference Rule

When creating or updating any wiki page:
1. Read `main-index.md` first.
2. Identify related pages.
3. Add links to those related pages in the body of the page being written.
4. If a new page was created, go back to the most relevant existing pages and add a link to the new page from them. Bidirectional linkage required.

### §1.8 — Maintenance + Reinstall + Structural Change

#### Maintenance/ folder

User-restriction rule: see Agent Instructions canonical statement.

**Contents (operational reference — single source of truth):**
- `wiki-setup-controller.md` — original setup file archived here on setup completion; used by REINSTALL Workflow below.
- `setup-log.md` — setup record, decisions made, original structure snapshot, Verification Report, structural change log, reinstall history.

#### REINSTALL Workflow

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

#### Structural Change Rule

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

## §2 — Setup Sequence

> Executes on "Setup System" trigger. Five phases. Each phase batches independent operations. Do not pause between phases unless required data is missing.

### §2.1 — Phase 1: Collect Data

Set `[TODAY]` to today's date in DD-MM-YY format.
Set `[CONTROLLER SOURCE PATH]` to the path where the GPS file was triggered from (typically `Working Files/GPS - Claude Project Setup.md`). Phase 5 item 35 uses this to verify the file was moved, not copied.

Check current working directory name.

**Inference pass first.** Scan directory for clues — README files, project config files (`package.json`, `*.csproj`, `*.unity`, `pyproject.toml`, etc.), existing markdown content. If a clear domain is inferrable (e.g., "Unity C# project", "Python ML library", "personal research"), propose it.

**Ask ONE combined question** (pick the branch matching dir state):

If directory name meaningful AND domain inferred:
> *"Setting up GPS wiki for: **[directory name]**. Detected domain: **[inferred domain]**. Confirm or correct, and provide scope (what belongs in the wiki). Setup runs automatically after your reply."*

If directory name meaningful, domain not inferrable:
> *"Setting up GPS wiki for: **[directory name]**. Provide: (1) domain — what is this project? (2) scope — what belongs in the wiki? Setup runs automatically after your reply."*

If directory untitled:
> *"Directory is untitled. Provide: (1) project name (2) domain (3) scope. Setup runs automatically after your reply."*

Wait for one reply. Set `[PROJECT NAME]`, `[DOMAIN]`, `[SCOPE]` from the reply (or inference + confirmation). Then proceed without further prompts.

### §2.2 — Phase 2: Build Structure

Execute as a **single parallel batch** wherever the tooling allows.

**Folder creation — one shell call:**
```
mkdir -p "raw" "Reference Files" "Working Files" "Output/Deprecated" "Output/MD Files" "wiki/systems" "wiki/entities" "wiki/concepts" "wiki/sources" "Commands and Logs" "Maintenance"
```
`mkdir -p` is idempotent — no per-folder confirmation needed. Verify once at the end with a single `ls -d */`.

**Initial file creation — issue all 7 writes in a single batch** (parallel tool calls):

| Target path | Template |
|-------------|----------|
| `Commands and Logs/main-index.md` | §3.1 |
| `Commands and Logs/wiki-log.md` | §3.2 |
| `Commands and Logs/ingest-log.md` | §3.3 |
| `Commands and Logs/directory-log.md` | §3.4 |
| `Reference Files/reference-index.md` | §3.5 |
| `Working Files/working-files-index.md` | §3.6 |
| `Output/output-index.md` | §3.7 |

**Skip-existing rule:** Before the batch, run one `ls` over each target folder. Build a skip-list of files that already exist. Write only missing files. Note skipped files for the final report.

Substitute `[PROJECT NAME]` and `[TODAY]` tokens in all templates. Expand the `<<decision-log: Initial setup>>` macro using §3.0.

### §2.3 — Phase 3: Embed Schema

Determine schema filename: default `CLAUDE.md` (Claude Code/Cowork — auto-read at session start per the Claude auto-read canonical statement in Agent Instructions). Use `AGENTS.md` only if the agent is OpenAI Codex; use `SCHEMA.md` for any other non-Claude agent.

**Existence check — single grep:**
- If schema file exists and contains the literal heading `## Priority Access Order`: it is current. Confirm to user *"Schema file is up to date."* Skip to Phase 4.
- Otherwise: generate.

**Generation procedure:**

1. Write the **Identity preamble** (project-specific) at top:
   ```markdown
   # [PROJECT NAME] Wiki — Agent Schema

   ## Identity

   This is an LLM-maintained knowledge base for the [PROJECT NAME] project. Scope: [DOMAIN] — [SCOPE]. Nothing outside this domain belongs here.

   ## Priority Access Order

   At the start of every session and before any task, read in this order:
   1. `Commands and Logs/ingest-log.md` — check for incomplete ingests
   2. `Commands and Logs/main-index.md` — map of all wiki pages
   3. `Commands and Logs/wiki-log.md` — wiki session history
   4. `Commands and Logs/directory-log.md` — full directory event history

   All new instruction files and rule documents must be added to `Commands and Logs/` only.
   ```

2. **Append §1.2 through §1.8** from this GPS file with three transforms applied in order:
   - **Strip the `§N.X — ` heading prefix** from every heading (e.g., `### §1.2 — Folder Rules` → `### Folder Rules`; `#### §1.6.1 — SESSION START` → `#### SESSION START`).
   - **Promote heading levels by one**: `###` → `##` and `####` → `###`. So `### §1.2 — Folder Rules` becomes `## Folder Rules`; `#### REINSTALL Workflow` becomes `### REINSTALL Workflow`.
   - **Substitute** `[PROJECT NAME]`, `[DOMAIN]`, `[SCOPE]` tokens where they appear.

   Result: schema has level-2 (`##`) headings for the seven major rule blocks (Folder Rules, Index Files, Log Files, Decision Log Rule, Workflows, Cross-Reference Rule, Maintenance + Reinstall + Structural Change) and level-3 (`###`) headings for their sub-sections (individual workflows under Workflows; Maintenance/ folder + REINSTALL Workflow + Structural Change Rule under the Maintenance umbrella). These sections are the canonical ruleset.

3. Append **two** canonical blocks from Agent Instructions: the OS-compatibility + schema-naming paragraph **and** the Maintenance/ folder paragraph. Both are referenced from §1.2 and §1.8 in the embedded ruleset, so the schema must contain them as self-contained statements (otherwise references in the generated schema dangle). The Claude auto-read canonical statement is **not** appended — it describes setup-time agent behaviour, not a project rule, so it lives only in this controller file.

4. Append the file's own Decision Log per §1.5:
   ```markdown
   ---

   ## Decision Log

   ### [TODAY] — Initial schema generated by GPS (Claude build)
   - **Added:** Full schema generated from GPS §1.2–§1.8 with project-specific identity preamble.
   - **Notes:** Generated by GPS Claude V2 setup sequence. Schema filename defaulted to CLAUDE.md for Claude auto-read.
   ```

### §2.4 — Phase 4: Finalize

Execute as a **single parallel batch**:

1. **Create `Maintenance/setup-log.md`** from §3.8 template. Populate with project name, domain, scope, today's date + time, folder list created, file list created, schema action (created/updated/already-current). Include the directory snapshot — generate dynamically via:
   ```
   find . -maxdepth 3 -not -path '*/\.*' | sort
   ```
   (or `tree -L 3` if available). Capture the actual structure at this moment — do not template a guess.

2. **Move this GPS file to `Maintenance/wiki-setup-controller.md`.** Use `mv` (single op), not copy + delete.

3. **Append a single combined entry to `Commands and Logs/directory-log.md`:**
   ```
   ### [TODAY HH:MM] — SETUP | Initial GPS setup completed
   - **Action:** Folder structure built. Control files initialized. Schema generated (CLAUDE.md). Setup log + archived controller created in Maintenance/.
   - **Location:** project root
   - **Reason:** Initial setup via GPS Setup System trigger.
   - **Source Log:** Maintenance/setup-log.md
   ```

**Phase 4 produces no user-facing message.** The final user message is composed and sent from §2.5 Phase 5 after the Verification Report is written — this allows the message to include verification status.

Proceed immediately to §2.5 Phase 5 — Verification Pass.

---

## §2.5 — Phase 5: Verification Pass

> Runs immediately after Phase 4. The agent walks through the 41-item checklist below, records pass/fail for each item, appends a Verification Report to `Maintenance/setup-log.md`, then sends the final user message including verification status. Purpose: confirm no agent mistakes during setup before handing the system over.

**Execution rule:** Batch related checks. Required ops (approx 6–8 tool calls):
- 1 `ls -la` over all expected paths — covers groups A, B + items 30, 31, 32, 33, 35 (existence + emptiness + Maintenance/ file count + source-path absence).
- 1 grep of the schema file for sentinel headings + token absence (items 24–27 + 41).
- 1 `head` of `Maintenance/wiki-setup-controller.md` first line (item 34) + 1 read of `Maintenance/setup-log.md` Setup Record section (item 36).
- 1 recursive grep of token leaks over `Commands and Logs/`, `Reference Files/`, `Working Files/`, `Output/` (items 28, 29).
- 1 tail check over 4 index files for Decision Log block (item 40 — main-index, reference-index, working-files-index, output-index).
- 1 read of `directory-log.md`, `wiki-log.md`, `ingest-log.md` (items 37–39).

Do not prompt the user during verification — collect all results first, then report once.

### Verification Checklist

**A. Folder existence (13 checks — CRITICAL)**

1. `raw/` exists
2. `Reference Files/` exists
3. `Working Files/` exists
4. `Output/` exists
5. `Output/Deprecated/` exists
6. `Output/MD Files/` exists
7. `wiki/` exists
8. `wiki/systems/` exists
9. `wiki/entities/` exists
10. `wiki/concepts/` exists
11. `wiki/sources/` exists
12. `Commands and Logs/` exists
13. `Maintenance/` exists

**B. Control file existence (10 checks — CRITICAL)**

14. Schema file exists (`CLAUDE.md` for Claude — default; `AGENTS.md` or `SCHEMA.md` only if a non-Claude agent was chosen)
15. `Commands and Logs/main-index.md` exists
16. `Commands and Logs/wiki-log.md` exists
17. `Commands and Logs/ingest-log.md` exists
18. `Commands and Logs/directory-log.md` exists
19. `Reference Files/reference-index.md` exists
20. `Working Files/working-files-index.md` exists
21. `Output/output-index.md` exists
22. `Maintenance/setup-log.md` exists
23. `Maintenance/wiki-setup-controller.md` exists

**C. Schema file integrity (4 checks — CRITICAL)**

24. Schema contains literal heading `## Identity`
25. Schema contains literal heading `## Priority Access Order`
26. Schema contains all of: `## Folder Rules`, `## Index Files`, `## Log Files`, `## Decision Log Rule`, `## Workflows`, `## Cross-Reference Rule`, `### REINSTALL Workflow`, `### Structural Change Rule` (single grep call: 8 heading matches expected — 6 at level 2, 2 at level 3, matching the §2.3 Step 2 transform output)
27. Schema has no unsubstituted tokens — grep `[PROJECT NAME]`, `[DOMAIN]`, `[SCOPE]`, `[TODAY]` returns zero matches

**D. Token substitution across control files (2 checks — WARNING)**

28. Single recursive grep `'\[PROJECT NAME\]\|\[TODAY\]'` across `Commands and Logs/`, `Reference Files/`, `Working Files/`, `Output/` returns zero matches
29. No file contains the unexpanded macro literal `<<decision-log: Initial setup>>`

**E. Initial state correctness (3 checks — WARNING)**

30. `raw/` is empty (no files, no subfolders) on fresh setup. Archive subfolders are created only after first ingest.
31. `wiki/systems/`, `wiki/entities/`, `wiki/concepts/`, `wiki/sources/` are all empty
32. `Output/` contains only `output-index.md` and the two subfolders (no exports yet)

**F. Maintenance integrity (4 checks — CRITICAL)**

33. `Maintenance/` contains exactly two files
34. `Maintenance/wiki-setup-controller.md` first heading is `# GPS — Claude Project Setup` (confirms it's the moved GPS file)
35. Original GPS file no longer exists at the source path recorded in Phase 1 (confirms `mv`, not copy). Phase 1 must record the source path before Phase 4 archives the controller.
36. `Maintenance/setup-log.md` Setup Record block is fully populated (Project, Domain, Scope, Setup completed timestamp — no `[TOKEN]` placeholders remaining)

**G. Log cross-reference integrity (3 checks — WARNING)**

37. `directory-log.md` contains the SETUP completion entry written in Phase 4 step 3
38. `wiki-log.md` contains the initial bootstrap entry from §3.2 template
39. `ingest-log.md` has the header table present and zero data rows (table body empty)

**H. Decision Log presence (2 checks — WARNING)**

40. Every newly created index .md ends with a `## Decision Log` block (main-index, reference-index, working-files-index, output-index)
41. Schema file ends with a `## Decision Log` block

### Verification Report — appended to `Maintenance/setup-log.md`

Use the template at **§3.9**. Populate it with the per-check results from the checklist above, then append the populated block to `setup-log.md` between the Original File Structure Snapshot and the Structural Change Log (the §3.8 template has the scaffold position marked).

### Final User Message

After the Verification Report has been written to setup-log.md, send a single message to the user using this template:

```
[HEADER]
- Folders: 11 expected, [M] created, [N] pre-existing
- Files: 7 control files + schema
- Schema: [created | updated | already current]
- Setup log + archived controller: Maintenance/
- Verification: [VERIFICATION_LINE]

[ACTION_BLOCK]

Full system rules: see schema file or GPS §1.
```

**Template variables — choose row based on verification outcome:**

| Variable | No critical failures | Any critical failures |
|----------|-----------------------|-----------------------|
| `[HEADER]` | `✅ [PROJECT NAME] wiki is live.` | `⚠️ [PROJECT NAME] wiki setup completed with [N] critical failure(s).` |
| `[VERIFICATION_LINE]` | `✅ 41/41 passed` (or `⚠️ [N] warnings, 0 critical` if any warnings) | `❌ [N] critical, [M] warnings — see Verification Report` |
| `[ACTION_BLOCK]` | See **pass action block** below | See **failure action block** below |

**Pass action block:**
```
Next:
1. Drop sources into raw/ → say "ingest [filename]"
2. Ask a project question
3. Say "Setup Help" for the workflow cheatsheet

Done. Operate from the schema file (CLAUDE.md) from this point onward — Claude auto-reads it every session.
```

**Failure action block:**
```
Failed checks: [list check numbers + one-line description for each]

Suggested actions:
1. Read Maintenance/setup-log.md → Verification Report for full diagnostics
2. Say "Reinstall System" to attempt automatic repair
3. Or fix the listed items manually, then re-run verification

System is partially set up. Do not begin ingesting sources until verification passes.
```

---

## §3 — Templates

> Initial-state content for files created during Phase 2. Tokens: `[PROJECT NAME]`, `[TODAY]` (DD-MM-YY).

### §3.0 — Decision Log snippet (shared macro)

Every template below ends with this block. Referenced as `<<decision-log: Initial setup>>`.

```markdown
---

## Decision Log

### [TODAY] — Initial setup by GPS (Claude build)
- **Added:** File created by GPS setup sequence.
- **Notes:** Updated as content is added.
```

### §3.1 — main-index.md

```markdown
# [PROJECT NAME] Wiki Index

## Systems
_(none yet)_

## Entities
_(none yet)_

## Concepts
_(none yet)_

## Source Summaries
_(none yet)_

<<decision-log: Initial setup>>
```

### §3.2 — wiki-log.md

```markdown
# [PROJECT NAME] Wiki Log

## [TODAY] setup | Initial wiki bootstrap
Created folder structure, schema file (CLAUDE.md), main-index.md, wiki-log.md, ingest-log.md, directory-log.md via GPS Claude V2.
```

### §3.3 — ingest-log.md

```markdown
# Ingest Log

Tracks all files in `raw/`. Updated on every move to raw/ and every completed ingest.

| File | Date Added | Status | Date Ingested |
|------|------------|--------|---------------|
_(empty — rows added as files are placed in raw/)_
```

### §3.4 — directory-log.md

```markdown
# Directory Log

Append-only master history of all events in the [PROJECT NAME] directory.

## Log

_(empty — first entry is appended by §2.4 Phase 4 step 3 during setup)_
```

### §3.5 — reference-index.md

```markdown
# Reference Files Index

Navigation index for all files in `Reference Files/`. Always use this index first. If file not in index: ask *"File not found — Perform Broad Search? Yes / No / Enter file path yourself"*.

## Files
_(empty — entries added as reference files are detected)_

<<decision-log: Initial setup>>
```

### §3.6 — working-files-index.md

```markdown
# Working Files Index

Navigation index for all files in `Working Files/`. Always use this index first. Missing-file prompt as in reference-index.md.

| File | Description | Status |
|------|-------------|--------|
_(empty — entries added as working files are created)_

<<decision-log: Initial setup>>
```

### §3.7 — output-index.md

```markdown
# Output Index

Navigation index for all files in `Output/`. Always use this index first. Missing-file prompt as in reference-index.md.

## Current Outputs
| File | Version | Format | Date Added |
|------|---------|--------|------------|
_(none yet)_

## Deprecated
| File | Version | Format | Date Deprecated | Location |
|------|---------|--------|-----------------|----------|
_(none yet)_

## MD Files (Exception Saves)
| File | Date Saved | Confirmed By |
|------|------------|--------------|
_(none yet)_

<<decision-log: Initial setup>>
```

### §3.8 — setup-log.md

````markdown
# Setup Log — [PROJECT NAME]

## ⚠️ Maintenance File — AI Managed Only
Managed exclusively by the AI. User must never edit, move, or delete.
To restore: say "Reinstall System".

---

## Setup Record

- **Project:** [PROJECT NAME]
- **Domain:** [DOMAIN]
- **Scope:** [SCOPE]
- **Setup completed:** [TODAY HH:MM]
- **Setup version:** GPS Claude V2

### Created
- Folders: 11 (raw, Reference Files, Working Files, Output, Output/Deprecated, Output/MD Files, wiki/{systems,entities,concepts,sources}, Commands and Logs, Maintenance)
- Files: 7 control files + schema (CLAUDE.md)
- Schema action: [created | updated | already current]

---

## Original File Structure Snapshot
Captured at [TODAY HH:MM]:

```
[insert output of `find . -maxdepth 3 -not -path '*/\.*' | sort` here]
```

---

## Verification Report
*(Populated by §2.5 Phase 5 immediately after setup. Records all 41 verification checks with pass/fail status. Canonical record that setup completed without agent mistakes.)*

*(not yet generated)*

---

## Structural Change Log
Append every structural change. Dual-written with `Commands and Logs/directory-log.md` per §1.8.

*(no changes since setup)*

---

## Reinstall History

*(no reinstalls yet)*
````

### §3.9 — Verification Report template

Populated by §2.5 Phase 5 and appended to `Maintenance/setup-log.md` between the Original File Structure Snapshot and the Structural Change Log. Severity column matches the group classification from §2.5 (CRIT = critical, WARN = warning).

```markdown
---

## Verification Report
Generated at [TODAY HH:MM] — Phase 5 of GPS setup.

### Summary
- **Total checks:** 41
- **Passed:** [N]
- **Failed (critical):** [N]
- **Failed (warning):** [N]
- **Overall:** [✅ PASS | ⚠️ PASS WITH WARNINGS | ❌ FAIL]

### Detailed Results
| # | Group | Severity | Check | Result | Notes |
|---|-------|----------|-------|--------|-------|
| 1 | A | CRIT | raw/ exists | ✅ | — |
| 2 | A | CRIT | Reference Files/ exists | ✅ | — |
| ... | ... | ... | ... | ... | ... |
| 41 | H | WARN | Schema ends with Decision Log | ✅ | — |

### Critical Failures (if any)
*(For each failed critical check: check number, expected vs actual, file path, suggested remediation. Omit if none.)*

### Warnings (if any)
*(For each failed warning check: check number, what was unexpected, why it's non-critical. Omit if none.)*

### Recommendation
- ✅ PASS → System ready for use.
- ⚠️ PASS WITH WARNINGS → System usable; review warnings before first ingest.
- ❌ FAIL → Run "Reinstall System" or address critical failures manually before using the system.
```

---

## §4 — Cheatsheet

Print this on `Setup Help` trigger, or after setup completion. **Do NOT** print the full §1 ruleset to the user — that lives in the schema file (CLAUDE.md) for reference.

```
GPS WIKI — QUICK REFERENCE (Claude build)

TRIGGERS
- "Setup System"     → run setup (already done if you see this file)
- "Reinstall System" → recover missing/broken structure
- "Setup Help"       → print this cheatsheet

FOLDERS
- raw/               drop sources here, then say "ingest [filename]"
- Working Files/     all in-progress edits live here
- Reference Files/   read-only reference material
- Output/            final exports (DOCX/PDF/XLSX) only
- wiki/              LLM-owned synthesized pages
- Commands and Logs/ indexes + logs
- Maintenance/       AI-only, hands-off

WORKFLOWS
- ingest [filename]  raw/ source → wiki pages
- (any question)     wiki-first answer, cite pages
- lint               health check the wiki
- "final"            promote working file → raw/ → ingest
- export             version + save → Output/

DECISION LOG
Every .md ends with a Decision Log block. Read it before editing.
Omitted from PDF/DOCX/XLSX exports.

SCHEMA FILE
CLAUDE.md is the schema. Claude Code / Cowork auto-reads it every session.
Rename only if you're using a different agent (AGENTS.md for Codex,
SCHEMA.md for others). Contents identical regardless of filename.

FULL RULES
See CLAUDE.md or GPS §1.
```

---

## Decision Log

### [28-05-26] — GPS Claude V2 forked from GPS V2 (agent-agnostic)
- **Added:** New file `GPS - Claude Project Setup.md` in `Working Files/`. Forked structure verbatim from `GPS - Guided Project Setup.md` (V2). Claude-specific adaptations: title and §3.8 setup-log "Setup version" both read "GPS Claude V2"; default schema filename swapped from `SCHEMA.md` to `CLAUDE.md` throughout (§1.1 tree, §2.3 default + sentinel-search, §2.5 item 14, §2.5 item 34 first-heading check, §3.2 wiki-log bootstrap text, §3.8 setup-log "Files" line, §4 cheatsheet schema-file section, Phase 4 step 3 directory-log entry); new "Claude auto-read behaviour" canonical statement added to Agent Instructions block; §0 top-level map and Quick-lookup updated to surface the new canonical statement; §2.3 step 3 clarified that the Claude auto-read statement is NOT appended to the generated schema (it is setup-time agent behaviour, not a project rule); pass action block updated to mention CLAUDE.md auto-read. All Decision Log entries pre-existing in V2 stripped (per user instruction in prior V1→V2 fork: fresh Decision Log for forked file).
- **Removed:** V1 Claude-specific file `(Claude) Project Wiki System — Setup Controller.md` is the source this file supersedes; that file's verbose 9-step setup, embedded V0 "LLM Wiki" philosophy block, duplicate ruleset (folder rules + Step 3 CLAUDE.md template + Step 6 printed rules), and standalone print-rules step are all collapsed into V2's single-source-of-truth §1 + parallel-batched §2 + minimal §4 cheatsheet. No content from V1 is uniquely preserved that did not already exist in V2 — the Claude auto-read note from V1 §⚙️ instructions is the only V1-original element retained, now elevated to a named canonical statement.
- **Choices given:** User instructed: (1) name the file "GPS - Claude Project Setup" (2) build it as the V2 version of the prior Claude-specific controller (3) audit after conversion (4) delete the V1 from Working Files. → **Chosen:** all four honoured in this session; §3.8 setup-log identifier set to "GPS Claude V2" to distinguish from the agent-agnostic GPS V2 build; default schema filename is CLAUDE.md throughout (the rename mapping in the OS canonical statement still applies if a user adopts this controller for a non-Claude agent — contents are filename-independent).
- **Notes:** This file is functionally identical to the agent-agnostic GPS V2 except for the schema-filename default and the added Claude auto-read canonical statement. The V2 audit fixes (Final full audit pass — 13 fixes documented in the source V2 Decision Log) are inherited automatically: balanced code fences (23 triple-backtick pairs + 1 four-backtick pair in §3.8 = 24 fence-block pairs total — V2's "24 triple-backtick pairs" claim was off-by-one; this Claude build records the corrected count), no nested-fence rendering bugs, all §0 anchors resolve, no orphan content. A post-fork audit pass is logged as a separate Decision Log entry below.

### [28-05-26] — Post-fork audit pass (1 fix + 10 verifications)
- **Added:** §2 sub-index entry for §2.5 corrected — anchor was `### §2.5 — Phase 5: Verification Pass` (inherited bug from V2 source) but the actual heading is at `##` level. Changed to `## §2.5 — Phase 5: Verification Pass` so the anchor resolves under §0's "exact heading search string" convention. This is the only structural/content change made during the audit.
- **Verified (no change needed):**
  1. Fence balance — `grep -c '^\`\`\`'` returns 48 across both this file and V2 source; pure-triple count 46 (= 23 pairs) + quad-pair 2 (= 1 pair) → 24 fence-block pairs total. Identical to V2 source.
  2. All 16 §0 top-level map anchors resolve to actual headings at the correct level.
  3. All 7 §1.6 Workflows sub-index anchors resolve (#### §1.6.1–§1.6.7).
  4. All 5 §2 Setup Sequence sub-index anchors resolve after the §2.5 fix.
  5. §0 Quick-lookup table includes the "Claude auto-read behaviour" row as promised by the upstream Decision Log entry.
  6. Schema-filename references consistent throughout: CLAUDE.md is the default (Claude Code/Cowork auto-read); AGENTS.md (Codex) and SCHEMA.md (other) appear only as alternates in the OS canonical statement, §2.3 default, §2.5 item 14, and §4 cheatsheet — never as the primary recommendation.
  7. §2.1 `[CONTROLLER SOURCE PATH]` example uses the correct filename `Working Files/GPS - Claude Project Setup.md`.
  8. §2.5 item 34 first-heading check (`# GPS — Claude Project Setup`) matches the actual line 1 of this file exactly (em-dash + spacing).
  9. §2.3 Step 3 unambiguously specifies which two canonical blocks are appended to the schema (OS + Maintenance/) and explicitly excludes the Claude auto-read statement with rationale — no risk of an over-appending generation.
  10. No accidental token leaks in narrative prose. Every `[PROJECT NAME]`, `[DOMAIN]`, `[SCOPE]`, `[TODAY]`, `[CONTROLLER SOURCE PATH]` occurrence is inside a template fence, inline code-tick wrapper, or a sentence describing token-substitution behaviour. The Phase-5 verification items 27–28 are therefore correct as written.
- **Removed:** Nothing.
- **Choices given:** Audit pass scope per user request: "structure, errors, instructional confusion". → **Chosen:** all three covered. Structure (heading hierarchy + fence balance), errors (anchor mismatch), instructional confusion (cross-checked Claude vs non-Claude schema-filename guidance, §2.3 inclusion/exclusion rules, source-path consistency).
- **Notes:** Audit-pass instrumentation used: ripgrep heading list, fence-line counts (triple + quad), recursive token search across the file body, anchor-vs-heading cross-table. Total audit ops: 6 shell calls + 3 read calls. No regression risk from the one fix — single anchor-string change in a table cell, no cross-reference to it elsewhere.
