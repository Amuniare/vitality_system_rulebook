# Gemini AI - Workflow & Command Protocol

This document outlines a set of standing orders and commands to make our collaboration more efficient, reliable, and predictable, especially for file modifications.

## 1. Core Principles

1.  **Plan First, Code Second:** For any non-trivial change, ask me to create a plan first. We will review and agree on the plan before I generate any code. This is the most efficient way to work.
2.  **Context is King:** Always provide the relevant file paths and, if necessary, paste the code sections we are discussing. This ensures I have the necessary context to provide accurate solutions.
3.  **Explicit is Better:** Use the explicit commands defined below for all file operations. This avoids the ambiguity that can lead to execution errors.

## 2. Command Syntax

When you want me to write code to a file, use the following syntax in your prompt after we have agreed on the code to be written.

-   `--write-code [--mode=replace|append] [file_path]`
-   `--create-file [file_path]`
-   `--create-dev-log`

---




## 3. Dev Log Generation Protocol (with Contextual Directory Targeting)

To standardize and automate our documentation process, we will use the following protocol for creating development logs. This ensures each log is consistent, context-rich, and filed in the correct location based on the scope of work.

### Command Syntax

`--create-dev-log "[Optional: Custom Title]"`

*   **`[Optional: Custom Title]`**: If you provide a title in quotes, I will use it for the dev log. If omitted, I will generate a title based on my analysis.

**Example Usage:**

*   `--create-dev-log "Resolved Data Contract Violation in Summary Tab"`
*   `--create-dev-log`

### Workflow

When you issue this command, I will initiate the following automated documentation sequence:

1.  **Acknowledge and Analyze:** I will confirm that I am entering Dev Log Generation Mode. My first action will be to perform a comprehensive analysis of our recent conversation history and the `git diff` of modified files.
    *   **Crucially, I will determine the primary work directory (`frontend` or `src`) based on the paths of the modified files.** This deterministic logic will dictate the location of the dev log.

2.  **Propose a Plan:** Based on my analysis, I will present a clear proposal for the dev log, which will include:
    *   **Proposed File Path:** A generated, full, and sequential file path. This path will be determined by the primary work directory and the next numerical phase. For example: `frontend/docs/dev_logs/30-39_New_Phase/30A_Talent_Expertise_System.md`.
    *   **Directory Creation:** The plan will explicitly state if a new phase directory (e.g., `30-39_...`) needs to be created.
    *   **Proposed Title:** A descriptive title for the log.
    *   **Summary of Work:** A brief, bulleted list of the key changes to be documented.

3.  **Await Approval:** I will stop and wait for your explicit approval of this plan. No file or directory will be written until you confirm all details are correct.

4.  **Generate and Create:** Upon your approval, I will execute the plan:
    *   First, I will create the target directory if it does not already exist.
    *   Second, I will generate the full Markdown content for the dev log, meticulously following our standard template.
    *   Finally, I will use our file creation protocol to write the complete content to the approved file path.

5.  **Confirm and Conclude:** I will output a final confirmation message stating that the dev log has been successfully created, and I will provide the full path to the new file for your records.


---

## 4. Bugfix Workflow Command

When we encounter a recurring bug in a specific part of the codebase, we will use the following command to initiate a structured debugging process based on our documented architectural patterns.

### Command Syntax

`--bugfix [recipe_name]: "[problem_description]"`

*   **`[recipe_name]`**: The name of the solution pattern to apply (e.g., `Data-Contract-Violation`, `Stale-Listener-Lifecycle`).
*   **`"[problem_description]"`**: A concise description of the bug's symptoms (e.g., "Situational expertise purchase fails with 'category.basic is undefined'").

### Workflow

When I receive this command, my first action will be to open **`frontend/character-builder/CLAUDE.md`** and locate the specified recipe. I will then use that recipe's principles to analyze the problem and propose a step-by-step plan for the fix.

**Example Usage:**
`--bugfix Data-Contract-Violation: "Situational expertise purchase fails with 'category.basic is undefined'"`


---

## 5. Roadmap Execution Protocol

To initiate a structured, step-by-step execution of a development plan, use the following command. This protocol ensures a supervised, verifiable workflow.

### Command Syntax

`--follow-roadmap [file_path]`

*   **`[file_path]`**: The relative path to the `roadmap.md` file to be executed.

**Example Usage:**
`--follow-roadmap docs/roadmap.md`

### Workflow

When I receive this command, I will enter a strict execution mode and adhere to the following sequence for **every single step** in the roadmap:

1.  **Acknowledge and Load:** My first response will be to confirm that I am entering Roadmap Execution Mode. I will read the specified `roadmap.md` file and display its full content for your review, highlighting the first unchecked task.
2.  **State Intent for ONE Step:** I will explicitly state which step I am about to begin. For example: *"I will now begin Step 1.1: Analyze Character Data Model."* I will not execute anything yet.
3.  **Await Confirmation:** I will stop and wait for your explicit command to proceed (e.g., "continue", "proceed", "ok").
4.  **Execute a Single Step:** Once you give the confirmation, I will execute **only the single step I just stated**. This may involve reading a file, proposing code, or generating a command.
5.  **Present Results and Await Next Command:** After completing the step, I will present the results (e.g., the file content, the proposed code, the `git diff`). I will then stop and wait for your next command. I will not automatically proceed to the next step.
6.  **Proceed to Next Step:** Only when you give the next "continue" or "proceed" command will I move to the next unchecked item in the roadmap and repeat this process from Step 2.

This rigid, step-by-step protocol ensures that you have full control and verification at every stage of the implementation, aligning perfectly with the core principles of our collaboration.


