from pathlib import Path

# Helper function to create content and write to file
def write_file_content(file_path_str, content, mode="w", encoding='utf-8'):
    file_path = Path(file_path_str)
    file_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        with open(file_path, mode, encoding=encoding) as f:
            f.write(content)
        print(f"Successfully wrote to {file_path}")
    except Exception as e:
        print(f"Error writing to {file_path}: {e}")

# --- Modify modernApp/app.js ---
app_js_path = Path('modernApp/app.js')
app_js_original_content = ""
try:
    app_js_original_content = app_js_path.read_text(encoding='utf-8')
except FileNotFoundError:
    print(f"Error: {app_js_path} not found. Cannot apply updates.")
    exit()

# Define the new code blocks and markers
# Block 1: Add the global initialization flag
start_marker_flag = "// modernApp/app.js" # First line of the file
new_code_for_flag = """
// modernApp/app.js
let isAppInitializedGlobally = false; // Guard against multiple initializations
"""

# Block 2: Modify the DOMContentLoaded listener
start_marker_dom_listener = "document.addEventListener('DOMContentLoaded', async () => {"
end_marker_dom_listener_original = """window.modernCharacterBuilder = app; // Make app globally accessible for debugging
    } catch (error) {
        Logger.error('[App] Failed to start application:', error);
        document.body.style.visibility = 'visible';
        document.body.classList.add('loaded');
        const container = document.getElementById('tab-content') || document.body;
        container.innerHTML = `
            <div class="error-screen" style="padding: 20px; text-align: center;">
                <h1>Startup Error</h1>
                <p>The application failed to start.</p>
                <p><strong>Error:</strong> ${error.message}</p>
                <pre>${error.stack || 'No stack trace'}</pre>
                <button onclick="location.reload()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
                    Reload Page
                </button>
            </div>
        `;
    }
});""" # This is the original end of the listener block

# The new DOMContentLoaded listener content
# We need to be careful with triple backticks inside this string if it were Python multiline.
# Since it's JS content for a JS file, it's fine here.
new_dom_listener_content = """
    if (isAppInitializedGlobally) {
        Logger.warn('[App] DOMContentLoaded fired, but app already initialized. Preventing re-initialization.');
        return;
    }
    isAppInitializedGlobally = true; // Set the guard
    Logger.info('[App] DOM loaded, initializing app...');
    
    try {
        const app = new ModernCharacterBuilder();
        await app.init();
        window.modernCharacterBuilder = app; // Make app globally accessible for debugging
    } catch (error) {
        Logger.error('[App] Failed to start application:', error);
        document.body.style.visibility = 'visible';
        document.body.classList.add('loaded');
        const container = document.getElementById('tab-content') || document.body;
        container.innerHTML = `
            <div class="error-screen" style="padding: 20px; text-align: center;">
                <h1>Startup Error</h1>
                <p>The application failed to start.</p>
                <p><strong>Error:</strong> ${error.message}</p>
                <pre>${error.stack || 'No stack trace'}</pre>
                <button onclick="location.reload()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
                    Reload Page
                </button>
            </div>
        `;
    }
""" # Note: The final '});' will be part of the end_marker_dom_listener

app_js_modified_content = app_js_original_content

# --- Apply Block 1: Add the global initialization flag ---
# Replace the first line with the new code for flag and the original first line.
if app_js_original_content.startswith(start_marker_flag):
    app_js_modified_content = new_code_for_flag + app_js_original_content[len(start_marker_flag):]
else:
    print(f"Warning: Start marker '{start_marker_flag}' not found as expected for flag insertion in {app_js_path}. Prepending flag.")
    app_js_modified_content = new_code_for_flag.replace(start_marker_flag, "") + app_js_original_content


# --- Apply Block 2: Modify the DOMContentLoaded listener ---
# We need to find the start of the listener and its original end.
dom_listener_start_index = app_js_modified_content.find(start_marker_dom_listener)
if dom_listener_start_index != -1:
    # Find the end of the original block. This is a bit tricky due to nested structures.
    # We'll assume the original end marker is unique enough.
    # The `end_marker_dom_listener_original` needs to be precise.
    # Let's find the opening brace and match it to its closing brace.

    original_listener_block_start = dom_listener_start_index + len(start_marker_dom_listener)
    
    # A simple way for this specific structure: find the `});` that ends the listener
    # and then find the `try {` block before it to delimit the content to replace.
    # This is fragile. A better way is to parse, but for this script, we'll be careful.

    # Let's find the `Logger.info('[App] DOM loaded, initializing app...');` line
    # as a more stable internal start point for replacement.
    internal_start_marker = "Logger.info('[App] DOM loaded, initializing app...');"
    internal_start_index_in_listener = app_js_modified_content[original_listener_block_start:].find(internal_start_marker)

    if internal_start_index_in_listener != -1:
        # Point of insertion for new content
        insertion_point = original_listener_block_start + internal_start_index_in_listener

        # Find the end of the `try...catch` block within the listener
        # The original content for replacement starts WITH `Logger.info...` and ends BEFORE the final `});`
        
        # Find the `export { ModernCharacterBuilder };` which should be after the listener
        export_line_index = app_js_modified_content.rfind("export { ModernCharacterBuilder };")
        if export_line_index != -1:
            # The end of the listener content is just before this export line, usually `});\n\nexport...`
            # We're looking for the `});` that specifically closes `DOMContentLoaded`
            # This is hard to do reliably without a parser.
            # Let's assume the structure is:
            # document.addEventListener('DOMContentLoaded', async () => {
            #   // ORIGINAL CONTENT TO BE REPLACED BY NEW_DOM_LISTENER_CONTENT
            # });
            #
            # export { ModernCharacterBuilder };

            # Find the last '});' before the export line.
            temp_end_index = app_js_modified_content.rfind("});", 0, export_line_index)
            
            if temp_end_index != -1 and temp_end_index > dom_listener_start_index :
                # Content to replace is from after the opening "{" of the arrow function
                # up to before the closing "});"
                content_start_replace_index = original_listener_block_start
                content_end_replace_index = temp_end_index
                
                app_js_modified_content = (
                    app_js_modified_content[:content_start_replace_index] +
                    new_dom_listener_content +
                    app_js_modified_content[content_end_replace_index:]
                )
            else:
                print(f"Error: Could not reliably find the end of the DOMContentLoaded listener block in {app_js_path} to modify it.")
                app_js_modified_content = app_js_original_content # Revert to original if modification failed
        else:
            print(f"Error: Could not find the export line after DOMContentLoaded in {app_js_path}. Cannot reliably modify listener.")
            app_js_modified_content = app_js_original_content # Revert
    else:
        print(f"Error: Could not find internal start marker '{internal_start_marker}' in DOMContentLoaded listener in {app_js_path}.")
        app_js_modified_content = app_js_original_content # Revert

else:
    print(f"Error: Start marker '{start_marker_dom_listener}' not found in {app_js_path}. Cannot modify DOMContentLoaded listener.")
    app_js_modified_content = app_js_original_content # Revert


# Write the modified app.js content
if app_js_modified_content != app_js_original_content:
    write_file_content(str(app_js_path), app_js_modified_content)
else:
    print(f"No changes made to {app_js_path} as markers or structure for modification were not found as expected.")


print("\\nPython script finished.")
if app_js_modified_content != app_js_original_content:
    print(f"{app_js_path} has been modified.")
else:
    print(f"Attempted to modify {app_js_path}, but no changes were applied due to marker/structure issues.")