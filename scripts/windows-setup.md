# Windows Setup Guide for Xion Development

## Prerequisites Installation

### 1. Install Git for Windows
**Download**: https://git-scm.com/download/win

1. Run the installer
2. Use default settings (recommended)
3. Restart PowerShell/Command Prompt after installation

**Verify Installation**:
```powershell
git --version
```

### 2. Install Go for Windows
**Download**: https://golang.org/dl/

1. Download the Windows installer (e.g., `go1.21.x.windows-amd64.msi`)
2. Run the installer with default settings
3. Restart PowerShell/Command Prompt

**Verify Installation**:
```powershell
go version
```

### 3. Install Rust (for smart contracts)
**Download**: https://rustup.rs/

1. Download `rustup-init.exe`
2. Run the installer
3. Restart PowerShell/Command Prompt

**Verify Installation**:
```powershell
rustc --version
cargo --version
```

## Alternative: Web-Based Deployment

If you prefer not to install CLI tools, you can use the web-based approach:

### Option 1: Use Xion Web Wallet
1. Visit: https://wallet.xion.burnt.com
2. Create a wallet account
3. Get testnet tokens from faucet
4. Use web interface for contract deployment (when available)

### Option 2: Use Online IDE
1. Use GitHub Codespaces or Gitpod
2. Pre-configured with all tools
3. Deploy directly from browser

### Option 3: Use Docker
```powershell
# Install Docker Desktop for Windows
# Download from: https://www.docker.com/products/docker-desktop

# Use pre-built Xion Docker image
docker run -it burntlabs/xion:latest
```

## Windows PowerShell Setup Script

Save this as `setup-windows.ps1`:

```powershell
# Windows Setup Script for Xion Development
Write-Host "=== Xion Development Setup for Windows ===" -ForegroundColor Green

# Check Git
try {
    $gitVersion = git --version
    Write-Host "Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "Git not found. Please install from https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}

# Check Go
try {
    $goVersion = go version
    Write-Host "Go found: $goVersion" -ForegroundColor Green
} catch {
    Write-Host "Go not found. Please install from https://golang.org/dl/" -ForegroundColor Red
    exit 1
}

# Check Rust
try {
    $rustVersion = rustc --version
    Write-Host "Rust found: $rustVersion" -ForegroundColor Green
} catch {
    Write-Host "Rust not found. Please install from https://rustup.rs/" -ForegroundColor Red
    exit 1
}

Write-Host "All prerequisites installed!" -ForegroundColor Green
```

## Simplified Deployment (No CLI Required)

### Using Pre-compiled Contracts

I can provide pre-compiled contract files that you can deploy using the web interface:

1. **Get Pre-compiled Contracts**
   - I'll create `.wasm` files for you
   - No compilation needed

2. **Use Web Deployment**
   - Visit Xion web interface
   - Upload contract files
   - Deploy with web forms

### Manual Contract Compilation (Windows)

If you want to compile contracts yourself:

```powershell
# Install Rust targets
rustup target add wasm32-unknown-unknown

# Navigate to contracts directory
cd contracts

# Build contracts
cargo build --release --target wasm32-unknown-unknown

# Contracts will be in: target/wasm32-unknown-unknown/release/
```

## Quick Start Options

### Option A: Install All Tools (Recommended)
```powershell
# 1. Install Git from https://git-scm.com/download/win
# 2. Install Go from https://golang.org/dl/
# 3. Install Rust from https://rustup.rs/
# 4. Restart PowerShell
# 5. Run deployment script
./scripts/deploy-contracts.sh
```

### Option B: Web-Based Only
```powershell
# 1. Use Xion web wallet: https://wallet.xion.burnt.com
# 2. Get testnet tokens from faucet
# 3. Use web interface for deployment
```

### Option C: Docker Approach
```powershell
# 1. Install Docker Desktop
# 2. Pull Xion image
docker pull burntlabs/xion:latest
# 3. Run deployment in container
```

## Testing Without Deployment

You can test the blockchain features without deploying contracts:

1. **Use Mock Mode**
   - Contracts work with mock data
   - No blockchain connection needed
   - Full UI functionality

2. **Use Testnet Faucet**
   - Get free testnet tokens
   - Deploy to testnet only
   - No real money involved

## Troubleshooting Windows Issues

### "Command not found" Errors
- Restart PowerShell after installations
- Check PATH environment variable
- Use PowerShell instead of Command Prompt

### Permission Issues
- Run PowerShell as Administrator
- Check Windows Defender settings
- Verify execution policy: `Get-ExecutionPolicy`

### Path Issues
```powershell
# Check if Go is in PATH
go env GOPATH
go env GOROOT

# Add to PATH if needed (temporary)
$env:PATH += ";C:\Program Files\Go\bin"
```

## Next Steps

1. **Choose your approach**: CLI tools, web-based, or Docker
2. **Install prerequisites** if using CLI
3. **Test installation** with verification commands
4. **Deploy contracts** using your chosen method
5. **Update .env.local** with contract addresses

## Need Help?

- **Windows Git**: https://git-scm.com/book/en/v2/Getting-Started-Installing-Git
- **Windows Go**: https://golang.org/doc/install
- **Windows Rust**: https://rust-lang.org/tools/install
- **Xion Discord**: https://discord.gg/xion
