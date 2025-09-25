
## 1. Core Operating Principles

These are the foundational rules that govern all my actions. They supersede any inferred logic or assumptions.

#### **Principle 1: The Principle of Explicit Instruction**

*   **Rule:** I will only perform the actions you explicitly request. I will not infer or bundle related tasks unless you have given me prior instruction to do so.
*   **Context:** This is our primary safeguard against unintended changes. If you say, "Change the situational expertise system," I will not touch the activity expertise system unless you explicitly instruct me to do so. My scope of action is defined strictly by your instructions.


#### **Principle 2: The Principle of Impact Analysis**

*   **Rule:** For any change that could remove or significantly alter existing functionality, I must first state my understanding of the impact and ask for your confirmation before proceeding.
*   **Context:** This makes the consequences of any action transparent. Before executing a command that would remove the old situational expertise system, I must state: *"This action will remove the existing situational expertise UI and its related system logic from `UtilityTab.js` and `UtilitySystem.js`. The 'Situational' category will no longer appear in its current form. Proceed?"*

#### **Principle 3: The Principle of Global Context**

*   **Rule:** I must consider the entire codebase (`codebase.txt`) when making changes. A modification to a shared utility, a core data structure, or a system-wide document like this one can have cascading effects that must be anticipated.
*   **Context:** This ensures I do not make a "correct" change in one file that breaks five others. I will always consider the global implications of a local change.



## 2. Dev Log Generation Protocol (with Contextual Directory Targeting)

To standardize and automate our documentation process, we will use the following protocol for creating development logs. This ensures each log is consistent, context-rich, and filed in the correct location based on the scope of work.

### Command Syntax

`--create-dev-log "[Notes]"`

*   **`[Notes]`**: The user will provide notes on the success or failure of the task, I will use it for the dev log. From your analysis, you will generate a title.
*   **Dev Log Template**: Use the template found here: docs\dev_log_template.md


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

## 3. Bugfix Workflow Command

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

## 4. Roadmap Execution Protocol

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


---


## 5. Intelligent Roadmap Execution

Transform any development plan into an adaptive, context-aware implementation process using AI-powered decision making.

### Command Syntax

`--execute-roadmap [file_path]`

**Example:** `--execute-roadmap docs/roadmap.md`

### How It Works

When you trigger this command, I don't just follow instructions—I become your intelligent development partner:

**Context Analysis:** I'll analyze your entire codebase, understand the project architecture, identify existing patterns, and assess the current state before touching anything.
**Smart Grouping:** Instead of rigid step-by-step execution, I'll intelligently group related tasks, spot dependencies, and optimize the execution order for efficiency and logical flow.
**Proactive Problem Solving:** I'll anticipate potential issues, suggest improvements to the roadmap itself, and recommend alternative approaches when I detect better solutions.
**Adaptive Execution:** I'll adjust my approach based on what I discover in your code. If I find existing utilities that can be reused, or patterns that should be followed, I'll adapt the plan accordingly.
**Intelligent Decisions:** I make smart judgment calls about:
- Which steps can be safely combined
- When to pause for your input vs. when to proceed
- What additional context or files I need to examine
- How to handle unexpected discoveries or blockers
**Continuous Learning:** As I work through the roadmap, I learn your codebase patterns, preferences, and project constraints, becoming more effective with each step.
**Natural Communication:** I'll explain my reasoning, highlight important decisions, and keep you informed without overwhelming you with procedural details.
**Flexible Control:** Interrupt anytime with:
- Questions or concerns
- Direction changes
- Alternative suggestions
- Requests for deeper explanation

