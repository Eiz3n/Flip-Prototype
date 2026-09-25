# Directory Log

Append-only master history of all events in the Flip-Prototype directory.

## Log

### [22-09-26 15:10] — SETUP | Initial GPS setup completed
- **Action:** Folder structure built. Control files initialized. Schema generated (CLAUDE.md). Setup log + archived controller created in Maintenance/.
- **Location:** project root
- **Reason:** Initial setup via GPS Setup System trigger.
- **Source Log:** Maintenance/setup-log.md

### [22-09-26 15:12] — CREATED | Reference Files/Flip-TDD.md
- **Action:** User added the Flip technical design document to Reference Files/. Indexed in reference-index.md.
- **Location:** Reference Files/Flip-TDD.md
- **Reason:** Source material for wiki ingest.
- **Source Log:** Reference Files/reference-index.md

### [22-09-26 15:14] — INGESTED | Reference Files/Flip-TDD.md
- **Action:** Source ingested into 16 wiki pages across wiki/systems (5), wiki/entities (3), wiki/concepts (7), wiki/sources (1). main-index.md populated; wiki-log.md appended.
- **Location:** wiki/
- **Reason:** User ingest request, emphasis confirmed as implementation-weighted.
- **Source Log:** Commands and Logs/wiki-log.md
- **Note:** Source left in Reference Files/ (read-only folder). INGEST steps 7-8 (ingest-log update, archive to raw/(Ingested) DD-MM-YY/) not applicable — ingest-log.md tracks raw/ only.

### [22-09-26 15:15] — EDITED | CLAUDE.md
- **Action:** main-index.md link format in the Index Files section corrected from `wiki/...` to `../wiki/...`.
- **Location:** CLAUDE.md
- **Reason:** Template form resolved to Commands and Logs/wiki/ and did not open; 16 broken links found by link check during the Flip TDD ingest.
- **Source Log:** Maintenance/setup-log.md

### [22-09-26 15:24] — CREATED | .gitkeep placeholders
- **Action:** Added `.gitkeep` to `raw/`, `Output/Deprecated/` and `Output/MD Files/` so the three empty GPS folders survive a git clone.
- **Location:** raw/, Output/Deprecated/, Output/MD Files/
- **Reason:** Git does not track empty directories; the GPS structure requires all three.
- **Source Log:** Maintenance/setup-log.md

### [22-09-26 15:28] — CREATED | README.md
- **Action:** Added project README at repository root — game summary, stack, repo layout, spec entry points, build order, branch roles, wiki working rules.
- **Location:** README.md
- **Reason:** Repository had no landing documentation.
- **Source Log:** Maintenance/setup-log.md

### [23-09-26 20:24] — CREATED | Working Files/2026-09-23-flip-v1-design.md
- **Action:** Wrote the Flip v1 design spec (2 custom rooms, art from the Claude Design canvas "Flip Art"). Indexed in working-files-index.md.
- **Location:** Working Files/2026-09-23-flip-v1-design.md
- **Reason:** Brainstorming session output; user asked for the spec before implementation.
- **Source Log:** Working Files/working-files-index.md

### [23-09-26 21:24] — CREATED | Working Files/2026-09-23-flip-v1-dev-plan.md
- **Action:** Wrote the Flip v1 dev implementation plan (13 TDD tasks: engine, config/theme, per-room level files, sim, state machine, view core, blockout art slots, build gate). Indexed in working-files-index.md.
- **Location:** Working Files/2026-09-23-flip-v1-dev-plan.md
- **Reason:** User asked for separate dev and art implementation plans; this is the dev plan.
- **Source Log:** Working Files/working-files-index.md

### [23-09-26 21:59] — EDITED | Working Files/2026-09-23-flip-v1-dev-plan.md
- **Action:** Applied the nine minor findings from the subagent plan review (tests, validator rules, repel bot, art-contract normalisation, next-room reset, launch assist and latency changes, font and HUD notes).
- **Location:** Working Files/2026-09-23-flip-v1-dev-plan.md
- **Reason:** User asked to fix all minor review findings.
- **Source Log:** —

### [23-09-26 22:14] — EDITED | Working Files/2026-09-23-flip-v1-dev-plan.md
- **Action:** Applied review finding M1: obstacle friction once per contact, configurable stall death, tests and deviation rows.
- **Location:** Working Files/2026-09-23-flip-v1-dev-plan.md
- **Reason:** User asked to fix M1, choosing stall death with a configurable time.
- **Source Log:** —

### [24-09-26 00:45] — MOVED | repository root
- **Action:** Whole repository copied (including `.git` and uncommitted files) from `D:\Personal\#Resume & CV\Applications 2026\Lila Games - Test\Flip Prototype Game\Flip-Prototype` to `D:\Gitlab\Lila Test`. Verified: same branch, same HEAD, same working-tree status, `git fsck` clean. Old copy left for the user to delete.
- **Location:** D:\Gitlab\Lila Test
- **Reason:** `&` and `#` in the old path break npm, Vite and Vitest on Windows (plan review B1).
- **Source Log:** Maintenance/setup-log.md

### [24-09-26 00:50] — CREATED | Reference Files/Flip Art.html
- **Action:** Detected the untracked design-canvas export and indexed it in reference-index.md.
- **Location:** Reference Files/Flip Art.html
- **Reason:** Reference File Added workflow; the file had not been indexed when it was added.
- **Source Log:** Reference Files/reference-index.md

### [25-09-26 10:51] — EDITED | Working Files/2026-09-23-flip-v1-dev-plan.md
- **Action:** Fixed review B2 (death tests start at x 18) and aligned shaft post geometry with the Flip Art canvas.
- **Location:** Working Files/2026-09-23-flip-v1-dev-plan.md
- **Reason:** User asked to fix B2 before the art plan; the canvas read for the art plan showed the post mismatch.
- **Source Log:** —

### [25-09-26 11:02] — CREATED | Working Files/2026-09-25-flip-v1-art-plan.md
- **Action:** Wrote the Flip v1 Art & Design implementation plan (9 TDD tasks) from the Flip Art canvas. Indexed in working-files-index.md.
- **Location:** Working Files/2026-09-25-flip-v1-art-plan.md
- **Reason:** User asked for a separate art and design plan after the dev plan.
- **Source Log:** Working Files/working-files-index.md

### [25-09-26 11:16] — EDITED | Working Files/2026-09-23-flip-v1-design.md
- **Action:** Applied user decisions: the title tap waits for the logo flip; spec chevron wording follows the canvas.
- **Location:** Working Files/2026-09-23-flip-v1-design.md
- **Reason:** User answered both open questions from the art plan.
- **Source Log:** —

### [25-09-26 11:16] — EDITED | Working Files/2026-09-23-flip-v1-dev-plan.md
- **Action:** Applied user decisions: the title tap waits for the logo flip; spec chevron wording follows the canvas.
- **Location:** Working Files/2026-09-23-flip-v1-dev-plan.md
- **Reason:** User answered both open questions from the art plan.
- **Source Log:** —

### [25-09-26 11:16] — EDITED | Working Files/2026-09-25-flip-v1-art-plan.md
- **Action:** Applied user decisions: the title tap waits for the logo flip; spec chevron wording follows the canvas.
- **Location:** Working Files/2026-09-25-flip-v1-art-plan.md
- **Reason:** User answered both open questions from the art plan.
- **Source Log:** —

### [25-09-26 13:49] — EDITED | Working Files/2026-09-25-flip-v1-art-plan.md
- **Action:** Applied all art-plan review findings (M1, M2, m1–m13).
- **Location:** Working Files/2026-09-25-flip-v1-art-plan.md
- **Reason:** User asked to fix all review findings.
- **Source Log:** —

### [25-09-26 13:49] — EDITED | Working Files/2026-09-23-flip-v1-dev-plan.md
- **Action:** Added project-log constraints and a Task 1 logging step.
- **Location:** Working Files/2026-09-23-flip-v1-dev-plan.md
- **Reason:** Same gap as art-plan review finding m12.
- **Source Log:** —

### [25-09-26 13:58] — EDITED | Working Files/2026-09-25-flip-v1-art-plan.md
- **Action:** Applied the re-verification fixes (compat chevronSpacing, Task 4 fail count).
- **Location:** Working Files/2026-09-25-flip-v1-art-plan.md
- **Reason:** Subagent re-run found a Task 2–3 regression.
- **Source Log:** —
