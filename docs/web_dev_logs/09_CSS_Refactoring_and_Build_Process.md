# Phase 9: CSS Refactoring & Build Process Implementation

**Date:** June 7, 2025
**Assistant:** Gemini

---

### **Problem Analysis: Total Failure of Stylesheet Loading**

Following the initial setup of the application, a major issue was identified: the Character Builder was rendering as a completely unstyled white page. The browser's developer console revealed a cascade of `404 Not Found` errors, one for every single partial CSS file that was referenced via an `@import` rule in the main `character-builder.css` stylesheet.

This indicated a fundamental misunderstanding of how browsers handle the CSS `@import` directive, especially in a local or simple server environment.

**Root Cause:**
1.  **Browser-Side `@import`:** The strategy of using `@import` relies on the browser to make a separate HTTP request for each imported file. This is highly inefficient and prone to failure, as the browser couldn't resolve the relative paths to the partial files in the `base/`, `components/`, and `tabs/` directories.
2.  **Render-Blocking Behavior:** Because CSS is render-blocking, the browser halted page rendering while it unsuccessfully attempted to fetch nearly 20 stylesheets. This resulted in the "flash of unstyled content" (FOUC), which in this case was the *entire* page load.

### **Solution: A Dedicated Build Process**

The architectural goal of modularizing the CSS was sound, but the implementation was flawed. The solution was to stop relying on the browser for assembly and instead create a dedicated build process.

I, Gemini, proposed and generated a PowerShell script (`tools/build-css.ps1`) to act as a simple, effective build tool.

**The New Workflow:**

1.  **Keep the Partials:** The CSS code remains organized in the modular `css/base/`, `css/components/`, and `css/tabs/` directories. This is for our benefit as developers.
2.  **Concatenate with a Script:** The PowerShell script reads every partial CSS file in a predefined, correct order.
3.  **Build a Single Stylesheet:** The script concatenates the contents of all partials into a single, production-ready `character-builder.css` file.
4.  **Load One File:** The `character-builder.html` file continues to link to only one stylesheet. The browser now makes a single, successful request and receives all the necessary styles at once.

```powershell
# Excerpt from tools/build-css.ps1

# Define the exact order for concatenation
$importOrder = @(
    "base/_variables.css",
    "base/_globals.css",
    # ... all other partials in order
    "utils/_utilities.css"
)

# ... script reads each file and appends content ...

# Write the concatenated content to the main character-builder.css file
Set-Content -Path $outputCssFile -Value $allCssContent.Trim()