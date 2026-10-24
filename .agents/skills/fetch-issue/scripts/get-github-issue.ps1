<#
.SYNOPSIS
    Fetches one or more GitHub Issues for Gurķis LV (by full URL, #number, or state filter),
    extracts metadata, labels, URLs, related recipe slugs, and comments, and outputs
    structured context for investigation, implementation planning, and issue-aware development.

.PARAMETER Issue
    GitHub Issue URL (e.g., "https://github.com/HermanisV/gurkis.lv/issues/29"),
    issue reference ("#29"), or issue number ("29"). Leave empty to list issues by -State.

.PARAMETER Repo
    GitHub repository in "owner/repo" format. Defaults to "HermanisV/gurkis.lv".

.PARAMETER State
    Issue state filter when listing multiple issues: "open" (default), "closed", or "all".

.PARAMETER IncludeUtterances
    When listing multiple issues, include Utterances comment threads. (Single issue fetches always return the requested issue.)
#>
param(
    [Alias("IssueNumber", "Url")]
    [string]$Issue = "",

    [string]$Repo = "HermanisV/gurkis.lv",

    [ValidateSet("open", "closed", "all")]
    [string]$State = "open",

    [switch]$IncludeUtterances
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$headers = @{
    "User-Agent" = "gurkis-lv-issue-fetcher"
    "Accept"     = "application/vnd.github+json"
}

function Invoke-GitHubApi {
    param([string]$Uri)
    return Invoke-RestMethod -Uri $Uri -Headers $headers
}

# Parse -Issue parameter (supports full URL, "#29", or "29")
$targetIssueNumber = 0
$trimmedIssue = $Issue.Trim()

if (-not [string]::IsNullOrWhiteSpace($trimmedIssue)) {
    if ($trimmedIssue -match 'github\.com/([^/]+/[^/]+)/issues/(\d+)') {
        $Repo = $matches[1]
        $targetIssueNumber = [int]$matches[2]
    } elseif ($trimmedIssue -match '^#?(\d+)$') {
        $targetIssueNumber = [int]$matches[1]
    } else {
        Write-Error "Invalid -Issue value '$Issue'. Provide a GitHub Issue URL (https://github.com/owner/repo/issues/N), '#N', or 'N'."
        exit 1
    }
}

function Get-IssueClassification {
    param($IssueObj)
    $title = [string]$IssueObj.title
    $body = [string]$IssueObj.body
    $labelNames = @()
    if ($null -ne $IssueObj.labels) {
        foreach ($l in $IssueObj.labels) {
            if ($null -ne $l.name) {
                $labelNames += ([string]$l.name).ToLowerInvariant()
            }
        }
    }

    if ($labelNames -contains "jauna-recepte" -or $title -match '(?i)\[jauna recepte\]') {
        return "new-recipe"
    }
    if ($labelNames -contains "lapas-uzlabojums" -or $title -match '(?i)\[lapas uzlabojums\]') {
        return "site-change"
    }
    if ($labelNames -contains "bug" -or $labelNames -contains "kļūda" -or $labelNames -contains "kluda" -or $title -match '(?i)\[(bug|kļūda|kluda)\]') {
        return "bug"
    }
    if ($title -match '_recipes/([a-z0-9-]+)\.md' -or $body -match '_recipes/([a-z0-9-]+)\.md' -or $title -match '/receptes/([a-z0-9-]+)' -or $body -match '/receptes/([a-z0-9-]+)') {
        return "recipe-update"
    }
    return "general-issue"
}

function Get-RelatedRecipeSlug {
    param([string]$Title, [string]$Body)
    $combined = "$Title`n$Body"
    if ($combined -match '_recipes/([a-z0-9-]+)\.md') {
        return $matches[1]
    }
    if ($combined -match '/receptes/([a-z0-9-]+)') {
        return $matches[1]
    }
    return ""
}

function Get-ExtractedUrls {
    param([string]$Body, [array]$CommentBodies, [string]$SelfUrl)
    $allText = "$Body`n" + ($CommentBodies -join "`n")
    $urlMatches = [regex]::Matches($allText, 'https?://[^\s\)\]>"]+')
    $urls = New-Object System.Collections.Generic.List[string]
    foreach ($m in $urlMatches) {
        $u = $m.Value.TrimEnd('.', ',', ';', ':')
        if ($u -ne $SelfUrl -and -not $urls.Contains($u)) {
            $urls.Add($u)
        }
    }
    return ,$urls.ToArray()
}

function Get-SuggestedBranchPattern {
    param([int]$Num, [string]$IssueType, [string]$RelatedSlug)
    $slugPart = if (-not [string]::IsNullOrWhiteSpace($RelatedSlug)) { $RelatedSlug } else { "<slug>" }
    switch ($IssueType) {
        "new-recipe"    { return "feat/$Num-$slugPart" }
        "site-change"   { return "feat/$Num-$slugPart (or fix/$Num-$slugPart for bugfixes)" }
        "recipe-update" { return "fix/$Num-$slugPart" }
        "bug"           { return "fix/$Num-$slugPart" }
        Default         { return "feat/$Num-$slugPart (new feature/recipe) or fix/$Num-$slugPart (fix/update)" }
    }
}

$rawIssues = @()
if ($targetIssueNumber -gt 0) {
    $singleUri = "https://api.github.com/repos/$Repo/issues/$targetIssueNumber"
    $single = Invoke-GitHubApi -Uri $singleUri
    if ($null -ne $single) {
        $rawIssues = @($single)
    }
} else {
    $listUri = "https://api.github.com/repos/$Repo/issues?state=$State&per_page=100"
    $resp = Invoke-GitHubApi -Uri $listUri
    if ($null -ne $resp) {
        foreach ($item in $resp) {
            $rawIssues += $item
        }
    }
}

$parsedIssues = @()

foreach ($iss in $rawIssues) {
    if ($null -ne $iss.pull_request) { continue }

    $author = [string]$iss.user.login
    $title = [string]$iss.title
    $isUtterances = ($author -eq "utterances-bot" -or $title -match '^receptes/')

    if ($isUtterances -and $targetIssueNumber -eq 0 -and -not $IncludeUtterances) {
        continue
    }

    $labelsList = @()
    if ($null -ne $iss.labels) {
        foreach ($l in $iss.labels) {
            if ($null -ne $l.name) {
                $labelsList += [string]$l.name
            }
        }
    }

    $commentsFormatted = @()
    $rawCommentBodies = @()
    if ([int]$iss.comments -gt 0 -and -not [string]::IsNullOrWhiteSpace($iss.comments_url)) {
        try {
            $cResp = Invoke-GitHubApi -Uri $iss.comments_url
            if ($null -ne $cResp) {
                foreach ($c in $cResp) {
                    $cAuthor = [string]$c.user.login
                    $cDate = ([datetimeoffset]::Parse($c.created_at)).ToString("yyyy-MM-dd HH:mm:ss zzz")
                    $cBody = ([string]$c.body -replace '\r\n', "`n").Trim()
                    $rawCommentBodies += $cBody
                    $commentsFormatted += "  - Comment #$($c.id) by @$cAuthor on $cDate ($($c.html_url)):`n    " + ($cBody -replace "`n", "`n    ")
                }
            }
        } catch {
            Write-Warning "Could not fetch comments for Issue #$($iss.number): $_"
        }
    }

    $bodyClean = ([string]$iss.body -replace '\r\n', "`n").Trim()
    $issueType = Get-IssueClassification -IssueObj $iss
    $relatedSlug = Get-RelatedRecipeSlug -Title $title -Body $bodyClean
    $extractedUrls = Get-ExtractedUrls -Body $bodyClean -CommentBodies $rawCommentBodies -SelfUrl ([string]$iss.html_url)
    $branchPattern = Get-SuggestedBranchPattern -Num ([int]$iss.number) -IssueType $issueType -RelatedSlug $relatedSlug

    $parsedIssues += [PSCustomObject]@{
        IssueNumber     = [int]$iss.number
        State           = [string]$iss.state
        StateReason     = [string]$iss.state_reason
        IssueType       = $issueType
        Labels          = ($labelsList -join ", ")
        Title           = $title
        Author          = $author
        CreatedAt       = ([datetimeoffset]::Parse($iss.created_at)).ToString("yyyy-MM-dd HH:mm:ss zzz")
        UpdatedAt       = ([datetimeoffset]::Parse($iss.updated_at)).ToString("yyyy-MM-dd HH:mm:ss zzz")
        Url             = [string]$iss.html_url
        RelatedSlug     = $relatedSlug
        ExtractedUrls   = $extractedUrls
        BranchPattern   = $branchPattern
        CommitSuffix    = "(Closes #$($iss.number))"
        Body            = $bodyClean
        Comments        = $commentsFormatted
    }
}

Write-Host "============================================================"
if ($targetIssueNumber -gt 0) {
    Write-Host "GURĶIS LV GITHUB ISSUE FETCHER ($Repo | Issue #$targetIssueNumber)"
} else {
    Write-Host "GURĶIS LV GITHUB ISSUE FETCHER ($Repo | State: $State)"
}
Write-Host "============================================================"
Write-Host "Issues Found: $($parsedIssues.Count)"
Write-Host "------------------------------------------------------------"

if ($parsedIssues.Count -eq 0) {
    Write-Host "No matching GitHub issues found."
    exit 0
}

$idx = 1
foreach ($item in $parsedIssues) {
    Write-Host "[$idx] ISSUE #$($item.IssueNumber) [$($item.State.ToUpper())] [Type: $($item.IssueType)]"
    Write-Host "    Title            : $($item.Title)"
    Write-Host "    URL              : $($item.Url)"
    Write-Host "    Author           : @$($item.Author) (Created: $($item.CreatedAt) | Updated: $($item.UpdatedAt))"
    if (-not [string]::IsNullOrWhiteSpace($item.Labels)) {
        Write-Host "    Labels           : $($item.Labels)"
    }
    if (-not [string]::IsNullOrWhiteSpace($item.RelatedSlug)) {
        Write-Host "    Related Recipe   : _recipes/$($item.RelatedSlug).md"
    }
    if ($item.ExtractedUrls.Count -gt 0) {
        Write-Host "    Extracted URLs   : $($item.ExtractedUrls -join ', ')"
    }
    Write-Host "    Branch Pattern   : $($item.BranchPattern)"
    Write-Host "    Commit Suffix    : $($item.CommitSuffix)"
    Write-Host "    Body             :"
    if ([string]::IsNullOrWhiteSpace($item.Body)) {
        Write-Host "      (empty)"
    } else {
        foreach ($line in ($item.Body -split "`n")) {
            Write-Host "      $line"
        }
    }
    if ($item.Comments.Count -gt 0) {
        Write-Host "    Comments ($($item.Comments.Count)):"
        foreach ($cBlock in $item.Comments) {
            Write-Host $cBlock
        }
    }
    Write-Host "------------------------------------------------------------"
    $idx++
}
