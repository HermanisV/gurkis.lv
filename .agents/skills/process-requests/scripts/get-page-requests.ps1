<#
.SYNOPSIS
    Fetches user requests submitted via the "Pievienot ko jaunu" (/pievienot/) page on Gurķis LV
    (GitHub Issues).

.PARAMETER Repo
    GitHub repository in "owner/repo" format. Defaults to "HermanisV/gurkis.lv".

.PARAMETER State
    Issue state filter: "open" (default), "closed", or "all".

.PARAMETER IssueNumber
    Optional specific GitHub Issue number to fetch.
#>
param(
    [string]$Repo = "HermanisV/gurkis.lv",

    [ValidateSet("open", "closed", "all")]
    [string]$State = "open",

    [int]$IssueNumber = 0
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$headers = @{
    "User-Agent" = "gurkis-lv-request-harvester"
    "Accept"     = "application/vnd.github+json"
}

function Invoke-GitHubApi {
    param([string]$Uri)
    return Invoke-RestMethod -Uri $Uri -Headers $headers
}

function Get-RequestType {
    param($Issue)
    $title = [string]$Issue.title
    $labelNames = @()
    if ($null -ne $Issue.labels) {
        foreach ($l in $Issue.labels) {
            $labelNames += ([string]$l.name).ToLowerInvariant()
        }
    }
    if ($labelNames -contains "jauna-recepte" -or $title -match '(?i)\[jauna recepte\]') {
        return "new-recipe"
    }
    if ($labelNames -contains "lapas-uzlabojums" -or $title -match '(?i)\[lapas uzlabojums\]') {
        return "site-change"
    }
    return "general-request"
}

$rawIssues = @()
if ($IssueNumber -gt 0) {
    $singleUri = "https://api.github.com/repos/$Repo/issues/$IssueNumber"
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

$requests = @()

foreach ($iss in $rawIssues) {
    if ($null -ne $iss.pull_request) { continue }

    $author = [string]$iss.user.login
    $title = [string]$iss.title
    $isUtterances = ($author -eq "utterances-bot" -or $title -match '^receptes/')

    if ($isUtterances -and $IssueNumber -eq 0) {
        continue
    }

    # Fetch comments inside the issue
    $commentsText = @()
    if ([int]$iss.comments -gt 0 -and -not [string]::IsNullOrWhiteSpace($iss.comments_url)) {
        try {
            $cResp = Invoke-GitHubApi -Uri $iss.comments_url
            if ($null -ne $cResp) {
                foreach ($c in $cResp) {
                    $cAuthor = [string]$c.user.login
                    $cDate = ([datetimeoffset]::Parse($c.created_at)).ToString("yyyy-MM-dd HH:mm:ss zzz")
                    $cBody = ([string]$c.body -replace '\r\n', "`n").Trim()
                    $commentsText += "  - Comment #$($c.id) by @$cAuthor on $cDate ($($c.html_url)):`n    $cBody"
                }
            }
        } catch {
            Write-Warning "Could not fetch comments for Issue #$($iss.number): $_"
        }
    }

    $requests += [PSCustomObject]@{
        IssueNumber = $iss.number
        State       = $iss.state
        RequestType = Get-RequestType -Issue $iss
        Title       = $title
        Author      = $author
        CreatedAt   = ([datetimeoffset]::Parse($iss.created_at)).ToString("yyyy-MM-dd HH:mm:ss zzz")
        UpdatedAt   = ([datetimeoffset]::Parse($iss.updated_at)).ToString("yyyy-MM-dd HH:mm:ss zzz")
        Url         = $iss.html_url
        Body        = ([string]$iss.body -replace '\r\n', "`n").Trim()
        Comments    = $commentsText
    }
}

Write-Host "============================================================"
Write-Host "GURĶIS LV PAGE REQUESTS HARVESTER ($Repo | State: $State)"
Write-Host "============================================================"
Write-Host "Requests Found: $($requests.Count)"
Write-Host "------------------------------------------------------------"

if ($requests.Count -eq 0) {
    Write-Host "No matching requests found."
    exit 0
}

$idx = 1
foreach ($r in $requests) {
    Write-Host "[$idx] ISSUE #$($r.IssueNumber) [$($r.State.ToUpper())] [$($r.RequestType)]"
    Write-Host "    Title   : $($r.Title)"
    Write-Host "    Author  : @$($r.Author) (Created: $($r.CreatedAt) | Updated: $($r.UpdatedAt))"
    Write-Host "    URL     : $($r.Url)"
    Write-Host "    Body    :"
    foreach ($line in ($r.Body -split "`n")) {
        Write-Host "      $line"
    }
    if ($r.Comments.Count -gt 0) {
        Write-Host "    Comments ($($r.Comments.Count)):"
        foreach ($cBlock in $r.Comments) {
            Write-Host $cBlock
        }
    }
    Write-Host "------------------------------------------------------------"
    $idx++
}
