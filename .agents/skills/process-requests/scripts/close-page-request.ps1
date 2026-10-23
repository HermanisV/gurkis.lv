<#
.SYNOPSIS
    Adds a Latvian completion comment and closes a Gurķis LV page request GitHub Issue.

.PARAMETER IssueNumber
    The GitHub Issue number to close (e.g., 21).

.PARAMETER Comment
    Latvian summary comment explaining how the request was implemented (e.g., PR link, branch name, or added recipe).

.PARAMETER Repo
    GitHub repository in "owner/repo" format. Defaults to "HermanisV/gurkis.lv".
#>
param(
    [Parameter(Mandatory = $true)]
    [int]$IssueNumber,

    [Parameter(Mandatory = $true)]
    [string]$Comment,

    [string]$Repo = "HermanisV/gurkis.lv"
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Prefer gh CLI if authenticated
$ghCmd = Get-Command gh -ErrorAction SilentlyContinue
if ($null -ne $ghCmd) {
    Write-Host "Closing Issue #$IssueNumber in $Repo via GitHub CLI..."
    & gh issue close $IssueNumber --repo $Repo --comment $Comment
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Issue #$IssueNumber commented and closed."
        exit 0
    }
    Write-Warning "gh issue close exited with code $LASTEXITCODE. Falling back to GITHUB_TOKEN REST API if available..."
}

$token = $env:GITHUB_TOKEN
if ([string]::IsNullOrWhiteSpace($token)) {
    $token = $env:GH_TOKEN
}

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Error "Could not close Issue #$IssueNumber automatically: neither authenticated 'gh' CLI nor GITHUB_TOKEN/GH_TOKEN was available. Ensure 'Closes #$IssueNumber' is included in the commit message / PR description."
    exit 1
}

$headers = @{
    "User-Agent"    = "gurkis-lv-request-closer"
    "Accept"        = "application/vnd.github+json"
    "Authorization" = "Bearer $token"
}

$commentUri = "https://api.github.com/repos/$Repo/issues/$IssueNumber/comments"
$commentBody = @{ body = $Comment } | ConvertTo-Json -Compress
Invoke-RestMethod -Method Post -Uri $commentUri -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($commentBody)) -ContentType "application/json; charset=utf-8" | Out-Null

$issueUri = "https://api.github.com/repos/$Repo/issues/$IssueNumber"
$closeBody = @{ state = "closed"; state_reason = "completed" } | ConvertTo-Json -Compress
Invoke-RestMethod -Method Patch -Uri $issueUri -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($closeBody)) -ContentType "application/json; charset=utf-8" | Out-Null

Write-Host "[OK] Issue #$IssueNumber commented and closed via GitHub REST API."
