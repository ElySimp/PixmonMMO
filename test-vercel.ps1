# Vercel Test Script
# This script helps you test your Vercel deployment locally

# Function to show colored text
function Write-ColorText {
    param (
        [string]$Text,
        [string]$ForegroundColor = "White"
    )
    Write-Host $Text -ForegroundColor $ForegroundColor
}

$header = @"

  VERCEL LOCAL TESTING TOOL
  Choose how you want to test your Vercel project locally

"@

Write-ColorText $header "Cyan"
Write-ColorText "`nChoose a testing method:`n" "White"

Write-ColorText "  1. Express-based local production server" "Green"
Write-ColorText "     Simulates Vercel production using Express"
Write-ColorText "     Doesn't require Vercel CLI"
Write-ColorText "     Faster startup but less accurate"
Write-ColorText ""

Write-ColorText "  2. Vercel CLI development server" "Blue"
Write-ColorText "     Uses official Vercel CLI 'vercel dev' command"
Write-ColorText "     More accurate simulation of production"
Write-ColorText "     Requires Vercel CLI and login"
Write-ColorText ""

Write-ColorText "  3. Create Vercel preview deployment" "Magenta"
Write-ColorText "     Creates an actual deployment preview URL"
Write-ColorText "     Most accurate testing environment"
Write-ColorText "     Does not affect production"
Write-ColorText ""

$choice = Read-Host "Enter your choice (1/2/3)"

switch ($choice) {
    "1" {
        Write-ColorText "`nStarting Express-based local production server...`n" "Yellow"
        node local-production-test.js
    }
    "2" {
        Write-ColorText "`nStarting Vercel development server...`n" "Yellow"
        node vercel-dev.js
    }
    "3" {
        Write-ColorText "`nCreating Vercel preview deployment...`n" "Yellow"
        vercel
    }
    default {
        Write-ColorText "`nInvalid choice. Please run the script again.`n" "Yellow"
        exit 1
    }
}
