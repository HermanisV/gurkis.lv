# Validates all recipe Markdown files in _recipes/*.md
# Checks:
# 1. Lowercase ASCII hyphenated slug filename
# 2. Valid YAML frontmatter delimiters and required keys
# 3. No forbidden imperial units (cups, oz, lbs, F, inches) in ingredients or body

$ErrorActionPreference = "Stop"
$recipesDir = Join-Path $PSScriptRoot "..\..\..\..\_recipes"

if (-not (Test-Path $recipesDir)) {
    Write-Host "No _recipes directory found at $recipesDir" -ForegroundColor Yellow
    exit 0
}

$files = Get-ChildItem -Path $recipesDir -Filter "*.md"
$hasErrors = $false

$requiredKeys = @(
    "layout:\s*recipe",
    "title:\s*.+",
    "description:\s*.+",
    "categories:",
    "servings:\s*\d+",
    "ingredients:"
)

# Forbidden imperial patterns (using Unicode escapes for PowerShell 5.1 compatibility)
$forbiddenPatterns = @(
    @{ Pattern = "\b\d+(\.\d+)?\s*(cups?|tbsp|tsp|oz|ounces?|lbs?|pounds?|sticks?|inches|inch|fl\s*oz)\b"; Label = "Imperial/English unit (convert to g, ml, cm, tk, ek)" },
    @{ Pattern = "\b\d+\s*\u00B0\s*F\b"; Label = "Fahrenheit temperature (convert to C)" },
    @{ Pattern = "\bgl\u0101z(e|es|\u012Bte|\u012Btes)\b"; Label = "Volumetric 'glaze' (convert to g or ml)" }
)

foreach ($file in $files) {
    $fileErrors = @()

    # 1. Check filename slug
    if ($file.BaseName -notmatch "^[a-z0-9-]+$") {
        $fileErrors += "Filename '$($file.Name)' must only contain lowercase ASCII letters, numbers, and hyphens."
    }

    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)

    # 2. Check frontmatter boundaries
    if ($content -notmatch "(?s)^---\r?\n(.*?)\r?\n---\r?\n(.*)$") {
        $fileErrors += "Missing valid YAML frontmatter block (--- ... ---)."
    } else {
        $frontmatter = $Matches[1]
        $body = $Matches[2]

        foreach ($req in $requiredKeys) {
            if ($frontmatter -notmatch "(?m)^$req") {
                $fileErrors += "Missing or invalid required frontmatter field matching: $req"
            }
        }

        # Optional image path check
        if ($frontmatter -match "(?m)^image:\s*[`"']?([^`"'\r\n]+)[`"']?") {
            $imgPath = $Matches[1].Trim()
            if ($imgPath -ne "" -and $imgPath -notmatch "^(/assets/|https?://)") {
                $fileErrors += "Frontmatter 'image' should start with '/assets/' or 'http(s)://' (got '$imgPath')."
            }
        }

        if ([string]::IsNullOrWhiteSpace($body)) {
            $fileErrors += "Recipe instruction body is empty."
        }
    }

    # 3. Check for forbidden imperial units
    foreach ($rule in $forbiddenPatterns) {
        if ($content -match "(?i)$($rule.Pattern)") {
            $matchedText = $Matches[0]
            $fileErrors += "Found forbidden measurement '$matchedText' - $($rule.Label)"
        }
    }

    if ($fileErrors.Count -gt 0) {
        $hasErrors = $true
        Write-Host "[FAIL] $($file.Name)" -ForegroundColor Red
        foreach ($err in $fileErrors) {
            Write-Host "  - $err" -ForegroundColor Red
        }
    } else {
        Write-Host "[OK]   $($file.Name)" -ForegroundColor Green
    }
}

if ($hasErrors) {
    Write-Error "Recipe validation failed. Please fix the errors above."
    exit 1
} else {
    Write-Host "`nAll $($files.Count) recipe(s) passed validation!" -ForegroundColor Cyan
    exit 0
}

