# Windows Setup Script for Xion Development
Write-Host "=== Xion Development Setup for Windows ===" -ForegroundColor Green

# Check Git
try {
    $gitVersion = git --version
    Write-Host "Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "Git not found. Please install from https://git-scm.com/download/win" -ForegroundColor Red
    Write-Host "After installation, restart PowerShell and run this script again." -ForegroundColor Yellow
    exit 1
}

# Check Go
try {
    $goVersion = go version
    Write-Host "Go found: $goVersion" -ForegroundColor Green
} catch {
    Write-Host "Go not found. Please install from https://golang.org/dl/" -ForegroundColor Red
    Write-Host "Download the Windows MSI installer and restart PowerShell." -ForegroundColor Yellow
    exit 1
}

# Check Rust
try {
    $rustVersion = rustc --version
    Write-Host "Rust found: $rustVersion" -ForegroundColor Green
} catch {
    Write-Host "Rust not found. Please install from https://rustup.rs/" -ForegroundColor Red
    Write-Host "Download rustup-init.exe and restart PowerShell." -ForegroundColor Yellow
    exit 1
}

Write-Host "All prerequisites installed!" -ForegroundColor Green
Write-Host "You can now run the deployment script." -ForegroundColor Yellow
Write-Host "./scripts/deploy-contracts.sh" -ForegroundColor Cyan
