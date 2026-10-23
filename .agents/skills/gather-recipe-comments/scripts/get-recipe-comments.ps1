<#
.SYNOPSIS
    Fetches comments and improvement notes left on a Gurķis LV recipe page (via Utterances / GitHub Issues)
    and compares their timestamps against the newest Git commit version of the recipe.

.PARAMETER Slug
    Recipe slug (e.g., "alabamas-balta-merce"), file path ("_recipes/alabamas-balta-merce.md"),
    or full recipe URL ("https://hermanisv.github.io/gurkis.lv/receptes/alabamas-balta-merce/").

.PARAMETER Repo
    GitHub repository in "owner/repo" format. Defaults to "HermanisV/gurkis.lv".

.PARAMETER Branch
    Target branch to check latest recipe commit version against. Defaults to "main".

.PARAMETER OnlyNewestVersion
    When set, outputs only comments created/updated after the latest commit to the recipe file.
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$Slug,

    [string]$Repo = "HermanisV/gurkis.lv",

    [string]$Branch = "main",

    [switch]$OnlyNewestVersion
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Invoke-GitHubApiArray {
    param([string]$Uri, [hashtable]$Headers)
    $resp = Invoke-RestMethod -Uri $Uri -Headers $Headers
    $list = New-Object System.Collections.Generic.List[object]
    if ($null -ne $resp) {
        foreach ($item in $resp) {
            $list.Add($item)
        }
    }
    return ,$list.ToArray()
}

# Normalize Slug from URL, file path, or raw slug
$normalizedSlug = $Slug.Trim()
if ($normalizedSlug -match '/receptes/([^/?#]+)') {
    $normalizedSlug = $matches[1]
}
$normalizedSlug = $normalizedSlug -replace '^_recipes[/\\]', '' -replace '\.md$', '' -replace '^/+|/+$', ''

$recipePath = "_recipes/$normalizedSlug.md"
$headers = @{
    "User-Agent" = "gurkis-lv-comment-harvester"
    "Accept"     = "application/vnd.github+json"
}

# 1. Fetch Commit History for the Recipe File to identify the newest version
$commitsUrl = "https://api.github.com/repos/$Repo/commits?path=$([uri]::EscapeDataString($recipePath))&sha=$([uri]::EscapeDataString($Branch))&per_page=10"
$commits = @()
try {
    $commits = Invoke-GitHubApiArray -Uri $commitsUrl -Headers $headers
} catch {
    Write-Warning "Could not fetch commits from GitHub API for '$recipePath': $_"
}

$latestCommitSha = $null
$latestCommitDate = [datetimeoffset]::MinValue
$latestCommitMessage = ""
$totalVersions = $commits.Count

if ($totalVersions -gt 0) {
    $latest = $commits[0]
    $latestCommitSha = $latest.sha
    $latestCommitMessage = ($latest.commit.message -split "\r?\n")[0]
    $latestCommitDate = [datetimeoffset]::Parse($latest.commit.author.date)
}

function Get-CommentVersionLabel {
    param([datetimeoffset]$CommentDate, [array]$CommitsList)
    if ($null -eq $CommitsList -or $CommitsList.Count -eq 0) {
        return "v1"
    }
    $total = $CommitsList.Count
    for ($i = 0; $i -lt $total; $i++) {
        $cDate = [datetimeoffset]::Parse($CommitsList[$i].commit.author.date)
        if ($cDate -le $CommentDate) {
            $vNum = $total - $i
            $shortSha = $CommitsList[$i].sha.Substring(0, 7)
            return "v$vNum ($shortSha)"
        }
    }
    $oldestSha = $CommitsList[$total - 1].sha.Substring(0, 7)
    return "v1 ($oldestSha)"
}

# 2. Fetch Issues matching this recipe slug (Utterances threads + manual Improvement Issues)
$issuesUrl = "https://api.github.com/repos/$Repo/issues?state=all&per_page=100"
$allIssues = Invoke-GitHubApiArray -Uri $issuesUrl -Headers $headers

$matchingIssues = @()
foreach ($issue in $allIssues) {
    if ($null -ne $issue.pull_request) { continue }
    $title = [string]$issue.title
    $body = [string]$issue.body
    if ($title -match [regex]::Escape($normalizedSlug) -or $body -match "receptes/$([regex]::Escape($normalizedSlug))(/|$|\s|\))") {
        $matchingIssues += $issue
    }
}

$collectedComments = @()

foreach ($issue in $matchingIssues) {
    $issueAuthor = [string]$issue.user.login
    $isUtterancesThread = ($issueAuthor -eq "utterances-bot" -or $issue.title -match "receptes/$([regex]::Escape($normalizedSlug))")

    # If the issue itself was opened manually as an improvement issue (not an Utterances container thread), include its body
    if (-not $isUtterancesThread -and -not [string]::IsNullOrWhiteSpace($issue.body)) {
        $issueCreated = [datetimeoffset]::Parse($issue.created_at)
        $issueUpdated = [datetimeoffset]::Parse($issue.updated_at)
        $effectiveDate = if ($issueUpdated -gt $issueCreated) { $issueUpdated } else { $issueCreated }
        $isNewest = ($effectiveDate -ge $latestCommitDate)
        $writtenOnVer = Get-CommentVersionLabel -CommentDate $issueCreated -CommitsList $commits

        if (-not $OnlyNewestVersion -or $isNewest) {
            $collectedComments += [PSCustomObject]@{
                SourceType         = "GitHub Issue #$($issue.number) Body ($($issue.title))"
                IssueNumber        = $issue.number
                IssueState         = $issue.state
                Author             = $issueAuthor
                CreatedAt          = $issueCreated.ToString("yyyy-MM-dd HH:mm:ss zzz")
                UpdatedAt          = $issueUpdated.ToString("yyyy-MM-dd HH:mm:ss zzz")
                WrittenOnVersion   = $writtenOnVer
                IsForNewestVersion = $isNewest
                Url                = $issue.html_url
                Text               = ($issue.body -replace '\r\n', "`n").Trim()
            }
        }
    }

    # Fetch all comments inside the issue thread
    if ([int]$issue.comments -gt 0) {
        $issueComments = Invoke-GitHubApiArray -Uri $issue.comments_url -Headers $headers
        foreach ($c in $issueComments) {
            $cCreated = [datetimeoffset]::Parse($c.created_at)
            $cUpdated = [datetimeoffset]::Parse($c.updated_at)
            $effectiveDate = if ($cUpdated -gt $cCreated) { $cUpdated } else { $cCreated }
            $isNewest = ($effectiveDate -ge $latestCommitDate)
            $writtenOnVer = Get-CommentVersionLabel -CommentDate $cCreated -CommitsList $commits

            if (-not $OnlyNewestVersion -or $isNewest) {
                $collectedComments += [PSCustomObject]@{
                    SourceType         = "Page Comment (Issue #$($issue.number))"
                    IssueNumber        = $issue.number
                    IssueState         = $issue.state
                    Author             = [string]$c.user.login
                    CreatedAt          = $cCreated.ToString("yyyy-MM-dd HH:mm:ss zzz")
                    UpdatedAt          = $cUpdated.ToString("yyyy-MM-dd HH:mm:ss zzz")
                    WrittenOnVersion   = $writtenOnVer
                    IsForNewestVersion = $isNewest
                    Url                = $c.html_url
                    Text               = ($c.body -replace '\r\n', "`n").Trim()
                }
            }
        }
    }
}

Write-Host "============================================================"
Write-Host "RECIPE COMMENT HARVESTER: $normalizedSlug ($recipePath)"
Write-Host "============================================================"
if ($latestCommitSha) {
    Write-Host "Latest Version : v$totalVersions ($($latestCommitSha.Substring(0, 7)))"
    Write-Host "Commit Date    : $($latestCommitDate.ToString('yyyy-MM-dd HH:mm:ss zzz'))"
    Write-Host "Commit Message : $latestCommitMessage"
} else {
    Write-Host "Latest Version : No commit history found on '$Branch'"
}
Write-Host "Matching Issues: $($matchingIssues.Count)"
Write-Host "Comments Found : $($collectedComments.Count)"
Write-Host "------------------------------------------------------------"

if ($collectedComments.Count -eq 0) {
    Write-Host "No comments found matching criteria."
    exit 0
}

$idx = 1
foreach ($item in $collectedComments) {
    $badge = if ($item.IsForNewestVersion) { "[NEWEST VERSION]" } else { "[OLDER VERSION]" }
    Write-Host "[$idx] $badge [Pie versijas $($item.WrittenOnVersion)] $($item.SourceType) by @$($item.Author) on $($item.UpdatedAt)"
    Write-Host "    URL : $($item.Url)"
    Write-Host "    Text: $($item.Text)"
    Write-Host ""
    $idx++
}
