# ==============================================================================
# PowerShell Script to Refactor character-builder.css (v5 - CONCATENATION)
#
# FIX: Abandons browser-based @import. This script now acts as a build tool,
#      reading all partial CSS files and concatenating them into a single,
#      production-ready character-builder.css file. This is the correct
#      approach to solve the 404 errors and unstyled content issue.
#
# USAGE:
# 1. Open PowerShell.
# 2. Navigate to the root of your 'vitality_system_rulebook' project.
# 3. Paste and run this entire script.
# 4. Commit & Push
# 5. Hard Refresh Browser (Ctrl + F5)
# ==============================================================================

# --- Configuration ---
Write-Host "Initializing CSS Build Script (v5 - Concatenation)..." -ForegroundColor Cyan
$basePath = "frontend\character-builder\assets\css"
$outputCssFile = Join-Path $basePath "character-builder.css"

# Define the exact order for concatenation
$importOrder = @(
    "base/_variables.css",
    "base/_globals.css",
    "base/_typography.css",
    "base/_layout.css",
    "components/_buttons.css",
    "components/_cards.css",
    "components/_forms.css",
    "components/_tabs.css",
    "tabs/_welcome-screen.css",
    "tabs/_archetypes.css",
    "tabs/_attributes.css",
    "tabs/_main-pool.css",
    "tabs/_special-attacks.css",
    "tabs/_utility.css",
    "tabs/_summary.css",
    "utils/_animations.css",
    "utils/_utilities.css",
    "utils/_misc.css"
)

# --- Script Start ---
Write-Host "Starting CSS build process..." -ForegroundColor Cyan

# 1. Initialize an empty string to hold all CSS content
$allCssContent = ""

# 2. Read each file in the specified order and append its content
Write-Host "Reading and concatenating partial CSS files..."
foreach ($partialFile in $importOrder) {
    $filePath = Join-Path $basePath $partialFile
    if (Test-Path $filePath) {
        $fileContent = Get-Content -Path $filePath -Raw
        $allCssContent += "/* --- Start of $partialFile --- */`n"
        $allCssContent += $fileContent
        $allCssContent += "`n/* --- End of $partialFile --- */`n`n"
        Write-Host "  Appended: $partialFile" -ForegroundColor Green
    }
    else {
        Write-Host "  WARNING: Partial file not found, skipping: $partialFile" -ForegroundColor Yellow
    }
}

# 3. Write the concatenated content to the main character-builder.css file
Write-Host "Writing to final output file: $outputCssFile"
Set-Content -Path $outputCssFile -Value $allCssContent.Trim()
Write-Host "Main CSS file has been successfully built." -ForegroundColor Green

# --- Script End ---
Write-Host "CSS build complete! The file '$outputCssFile' now contains all styles." -ForegroundColor Cyan
Write-Host "Please clear your browser cache and reload the character builder."

