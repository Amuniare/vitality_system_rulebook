# Vitality System - AI Development Guide (ROOT)

This guide is the master document for our collaboration on the Vitality System project. It outlines our workflow, architectural principles, and automated processes.

## 1. Project Overview

This is a personal RPG management system with two main, independent parts:
1.  **JavaScript Web Character Builder:** A browser-based application for creating characters for the Vitality RPG system. Located in `frontend/`.
2.  **Python Roll20 Automation:** A backend system for uploading/downloading character data to and from a Roll20 campaign. Located in `src/`.

These two systems only interact through the character JSON files.

## 2. Collaboration Principles

Let's work together as a team. To be most effective, please follow these guidelines:

-   **Be an Active Collaborator:** Instead of just giving commands, guide my approach. Ask me to make a plan, think through alternatives, or explain my reasoning. Course-correct me early if I'm on the wrong path.
-   **Provide Context:** Mention relevant files, business goals, or even paste in error messages. The more context I have, the better my solutions will be.
-   **Use Checklists for Complex Tasks:** For multi-step work, ask me to generate a plan with Markdown checkboxes (`- [ ]`). We can track our progress together, ensuring no steps are missed.

## 3. Project Architecture & Local Guides

The codebase is organized into distinct sections, each with its own architectural rules. To understand these rules, **always refer to the `CLAUDE.md` file within the relevant directory.** These local guides contain the specific "contracts" for that area of the code.

-   ### For the **JavaScript Web Character Builder**:
    > Your master guide is **`frontend/character-builder/CLAUDE.md`**.
    > It contains the architectural constitution for the entire frontend application.

-   ### For the **Python Roll20 Automation**:
    > Your guide is **`src/CLAUDE.md`**.
    > It outlines the architecture of the backend system and points to further documentation in `src/docs/`.

## 4. Automated Workflows

This section defines special, context-aware workflows that I can execute on your command.

### **Development Log Creation**

This workflow standardizes our project's documentation process.

#### **Trigger Command**

At the end of a work session, simply tell me:

> **"Create the dev log for what we just did."**

#### **My Process**

Upon receiving the command, I will perform the following steps:

1.  **Analyze Context:** I will review our recent conversation and the list of files we've modified.
2.  **Infer Details:**
    *   **Area:** I'll determine if the work was on the `web` (frontend) or `src` (backend) based on the file paths.
    *   **ID:** I'll scan the appropriate `dev_logs` directory to find the last log ID and propose the next logical one (e.g., `23A` -> `23B`).
    *   **Title:** I'll synthesize a concise title from the main objective we accomplished.
3.  **Propose & Confirm:** I will present the proposed filename and title for your approval before creating any files.
4.  **Generate File:** Once you confirm, I will create the new Markdown file in the correct directory, using the standard template below.

#### **Standard Log Template**

This is the exact template I will use for every new development log.

```markdown
# Phase [ID]: [Title]

**Date:** [I will fill this with the current date]
**Status:** ✅ Completed | ❌ Failed | 🚧 In Progress
**Objective:** [A brief, one-sentence goal for this development phase.]

---

## 1. Problem Analysis

[A clear description of the problem that was being solved. What was broken? Why was this change necessary? What was the user impact or technical debt?]

### Root Cause

[A specific analysis of *why* the problem was occurring. Was it a logical error, a data mismatch, a race condition, or a violation of an architectural principle?]

---

## 2. Solution Implemented

[A description of the technical solution. What was the high-level approach? What specific changes were made to the code?]

### Key Changes:
- **[Component/File]:** [Description of the specific change made.]
- **[Component/File]:** [Description of the specific change made.]
- **[Component/File]:** [Description of the specific change made.]

\`\`\`javascript
// A key code snippet that best illustrates the "before" and "after" of the fix.
// BEFORE:
const oldProblematicCode = "example";

// AFTER:
const newCorrectCode = "solution";
\`\`\`

---

## 3. Architectural Impact & Lessons Learned

-   **Impact:** [How did this change affect the project's overall architecture? Did it introduce new patterns, fix an anti-pattern, or improve performance/maintainability?]

-   **Lessons:** [What was the key takeaway from this task? What did we learn about the codebase or our workflow that we should apply in the future?]

-   **New Patterns:** [Optional: If a new reusable pattern was established (e.g., "The Advisory Budget Pattern"), define it here.]

---

## 4. Files Modified

-   `path/to/file1.js`
-   `path/to/file2.css`
-   `path/to/another/file.md`
---
```

## 5. Common Commands

Here are some essential commands for managing the project:

-   **Run the Web Character Builder:**
    -   Start a local server: `python -m http.server`
    -   Open: `http://localhost:8000/frontend/character-builder/character-builder.html`

-   **Upload Characters to Roll20:**
    -   `python main.py sync`

-   **Run Frontend Tests (Once Implemented):**
    -   `npm test`
```

