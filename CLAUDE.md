# AI Collaboration Best Practices

This guide outlines advanced patterns for collaborating with your AI assistant, inspired by expert workflows. Following these principles will lead to more accurate, efficient, and predictable results.

## 1. Workflow & Interaction

**A. Isolate Context: Start New Threads Often**
*   For each new, distinct task, use the `/clear` command to start a fresh conversation. This prevents context from a previous task from unpredictably influencing the current one.

**B. Be Precise: The More Context, The Better**
*   Provide all relevant context you have. Mention edge cases, constraints, and desired outcomes explicitly.
*   Instead of abstract terms ("make it modern"), provide concrete examples ("make it look like Linear's UI").
*   The AI cannot read your mind. The quality of the output is directly proportional to the quality of the prompt.

**C. Refine and Iterate: Edit Previous Prompts**
*   If a result isn't what you expected, use the `Escape` key twice to edit your previous prompt. Refining the prompt is often more effective than trying to correct the course with follow-up messages.

## 2. Task Execution & Supervision

**A. Decompose, Don't One-Shot**
*   For large tasks, do not attempt to solve them with a single, massive prompt.
*   **The Recommended Workflow:**
    1.  Ask the AI to create a plan with Markdown checkboxes (`- [ ]`).
    2.  Discuss and refine the plan.
    3.  Instruct the AI to execute one step at a time.
    4.  Review the result of each step before proceeding.

**B. Let the AI Read the Manual (RTFM)**
*   For tasks involving new frameworks or libraries, instruct the AI to read the official documentation first. You can provide a link or ask it to perform a research task. This avoids outdated or "hallucinated" setups.

**C. You Are the Human in the Loop**
*   The most effective feedback loop is your own. Instead of setting up complex autonomous testing feedback, run the code yourself and paste any errors or stack traces directly into the chat. Provide direct, corrective feedback.

**D. Stage Early, Stage Often**
*   After every successful change you approve, it's a good practice to stage the changes using `git add .`. This creates a safe restore point you can easily revert to if the AI makes a mistake in a subsequent step.

## 3. Automated Workflows

### **Automated Code Implementation (`--build`)**

This workflow allows you to instruct me to generate the code from an approved plan as a series of executable PowerShell commands, rather than just displaying it.

#### **Trigger Command**

After we have agreed on a plan, and I am about to generate the code for a specific step, respond with:

> **`--build`**

#### **My Process**

Upon receiving the `--build` command, I will:

1.  **Acknowledge the Command:** I will confirm that I am entering build mode.
2.  **Generate PowerShell Commands:** Instead of showing you the code in markdown blocks, I will generate a script that performs the file operations.
    *   **File Creation:** `New-Item -Path 'path/to/your/file.js' -ItemType File -Force`
    *   **Content Population:** `Add-Content -Path 'path/to/your/file.js' -Value @'\n[CODE CONTENT HERE]\n'@` (using PowerShell "here-strings" to handle multi-line code correctly).
    *   **File Moves/Renames:** `Move-Item -Path '...' -Destination '...'`
3.  **Present for Execution:** I will provide the complete script within a single `powershell` code block for you to copy and execute directly in your terminal.

#### **Example Workflow**

**Standard Interaction (Without `--build`):**
> **You:** Okay, the plan for `IdentityTab.js` looks good. Proceed.
>
> **Me:** Great. Here is the code for `frontend/character-builder/features/identity/IdentityTab.js`:
>
> ```javascript
> // ... JavaScript code ...
> ```

**New Interaction (With `--build`):**
> **You:** Okay, the plan for `IdentityTab.js` looks good. Proceed.
> **`--build`**
>
> **Me:** Acknowledged. Entering build mode. Here are the PowerShell commands to create the file and its content:
>
> ```powershell
> # Create directory if it doesn't exist
> New-Item -Path 'frontend/character-builder/features/identity' -ItemType Directory -Force
>
> # Create and populate the file
> $content = @'
> // ... JavaScript code ...
> '@
> Set-Content -Path 'frontend/character-builder/features/identity/IdentityTab.js' -Value $content
> ```

## 4. Advanced Techniques

**A. Parallel Workstreams with Git Worktrees**
*   To work on multiple, independent tasks in the same repository without conflict, use `git worktree`. This creates a separate working directory linked to a new branch.
    *   `git worktree add ../project-feature-b feature-b-branch`

**B. Use Sub-Tasks for Deep Analysis**
*   For complex analysis, ask the AI to spawn sub-tasks with different "personas" (e.g., a security expert, a performance expert, a design expert) and then synthesize their findings.

**C. Automate Your Workflow**
*   If you find yourself repeating a prompt, ask the AI to help you create a custom slash command or a shell script to automate the task.
