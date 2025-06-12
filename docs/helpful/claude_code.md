### 1. How to Use Me More Efficiently (Best Practices)

The core principle is to treat me less like a search engine and more like an active collaborator or a junior developer on your team.

**Setup & Configuration (Do this once):**
*   **Create a `CLAUDE.md` file:** This is the most important step. Create a file named `CLAUDE.md` in the root of your project. Use it to document essential project information like:
    *   **Common Commands:** `npm run test`, `python main.py sync`, etc. This stops me from having to search for them.
    *   **Architectural Rules:** Briefly state the key patterns, like "All UI components must be stateless" or "Use the `RenderUtils` class for creating cards."
    *   **File Locations:** Point out critical files, e.g., "Main entry point: `app.js`".
*   **Customize Tools:** Use the `/permissions` command or edit `.claude/settings.json` to grant me permission for safe, common tasks you trust me with, like editing files (`Edit`) or committing changes (`Bash(git commit:*)`). This reduces the number of times I have to ask for permission.

**Workflow & Interaction (Do this every time):**
*   **Give Me Context First:** Before asking me to write code, tell me which files are relevant. Use `tab-completion` to mention files, or paste in code snippets and error messages.
*   **Plan, Then Execute:** For complex tasks, don't just ask me to "implement feature X." Instead, say: **"First, make a plan to implement feature X."** Review the plan, correct it, and then ask me to execute it. This is more efficient than having me write incorrect code and then fixing it.
*   **Use "Think" for Complex Problems:** When you have a hard problem (e.g., "design a new caching system"), use the word "think" in your prompt. For example: **"Think hard about the best way to refactor this module."** This gives me more time and resources to come up with a better solution.
*   **Be Specific:** Vague prompts lead to generic code. Instead of "add tests," say "write a new test case for `my_function` that covers the edge case where the input is null."
*   **Iterate:** My first attempt might not be perfect. The most effective workflow is to ask me to write code, then provide feedback ("that's good, but now add error handling") and iterate until it's right.

### 2. Updating Your Architecture Files (`CLAUDE.md`)

Based on a review of your `dev_logs`, several key architectural patterns and lessons have emerged. These should absolutely be added to your `CLAUDE.md` files to ensure I (and any other developer) adhere to them.
