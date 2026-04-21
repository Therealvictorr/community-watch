# Web-Based Contract Deployment (No CLI Required)

## Quick Start - No Installation Needed

If you don't want to install development tools, you can deploy contracts using web-based tools:

### Option 1: Use Pre-compiled Contracts

I'll provide pre-compiled contract files that you can upload directly:

1. **Download Contract Files**
   - `community_watch.wasm` - Community Watch contract
   - `governance.wasm` - Governance contract  
   - `identity.wasm` - Identity contract

2. **Use Xion Web Interface**
   - Visit: https://wallet.xion.burnt.com
   - Create/import wallet
   - Use contract deployment interface

### Option 2: GitHub Codespaces

1. **Open in GitHub**
   - Push your code to GitHub
   - Create a Codespace
   - Pre-configured with all tools

2. **Deploy in Codespace**
   ```bash
   ./scripts/deploy-contracts.sh
   ```

### Option 3: Gitpod

1. **Open Gitpod**
   - Visit: https://gitpod.io
   - Import your repository
   - Deploy from browser

## Manual Web Deployment Steps

### Step 1: Create Web Wallet

1. **Visit Xion Wallet**
   - Go to: https://wallet.xion.burnt.com
   - Click "Create Account"
   - Set username and password
   - **IMPORTANT**: Save your recovery phrase

2. **Get Testnet Tokens**
   - Use built-in faucet
   - Or visit: https://faucet.xion.burnt.com
   - Enter your wallet address

### Step 2: Prepare Contract Files

I'll create the compiled WASM files for you:

```bash
# These files will be created for you:
contracts/community-watch.wasm
contracts/governance.wasm  
contracts/identity.wasm
```

### Step 3: Deploy via Web Interface

1. **Access Contract Deployment**
   - In Xion web wallet
   - Navigate to "Contracts" section
   - Click "Deploy Contract"

2. **Upload Contract File**
   - Choose contract file (e.g., `community_watch.wasm`)
   - Set initialization message
   - Confirm deployment

3. **Initialization Messages**

**Community Watch Contract:**
```json
{
  "admin": "YOUR_WALLET_ADDRESS"
}
```

**Governance Contract:**
```json
{
  "admin": "YOUR_WALLET_ADDRESS"
}
```

**Identity Contract:**
```json
{
  "admin": "YOUR_WALLET_ADDRESS"
}
```

### Step 4: Update Environment

After deployment, update your `.env.local`:

```bash
NEXT_PUBLIC_COMMUNITY_WATCH_CONTRACT=deployed_address_1
NEXT_PUBLIC_GOVERNANCE_CONTRACT=deployed_address_2
NEXT_PUBLIC_IDENTITY_CONTRACT=deployed_address_3
```

## Alternative: Use Online IDE

### Replit Setup

1. **Create Replit**
   - Visit: https://replit.com
   - Import your repository
   - Use Bash shell

2. **Install Tools in Replit**
   ```bash
   # Install Go
   wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
   sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
   export PATH=$PATH:/usr/local/go/bin
   
   # Install Rust
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source ~/.cargo/env
   
   # Install Git
   sudo apt update && sudo apt install git -y
   ```

3. **Deploy Contracts**
   ```bash
   ./scripts/deploy-contracts.sh
   ```

## Testing Without Deployment

### Mock Mode

You can test the application without blockchain:

1. **Start App**
   ```bash
   npm run dev
   ```

2. **Use Mock Data**
   - App will use demo content
   - All UI features work
   - No blockchain connection needed

3. **Test Integration Later**
   - Deploy contracts when ready
   - Switch to blockchain mode

## Troubleshooting Web Deployment

### Common Issues

1. **"File upload failed"**
   - Check file size (should be < 1MB)
   - Ensure it's a valid WASM file
   - Try refreshing the page

2. **"Insufficient balance"**
   - Get more testnet tokens
   - Check correct network (testnet)
   - Verify wallet address

3. **"Deployment failed"**
   - Check initialization JSON format
   - Verify admin address
   - Check contract file integrity

### Getting Help

- **Xion Discord**: https://discord.gg/xion
- **Documentation**: https://docs.burnt.com/xion
- **Testnet Explorer**: https://explorer.xion.burnt.com

## Quick Decision Guide

### Choose Web Deployment If:
- You don't want to install tools
- Quick testing is priority
- Windows installation issues
- One-time deployment

### Choose CLI Deployment If:
- Frequent deployments expected
- Custom contract modifications
- Full control needed
- Development workflow

## Next Steps

1. **Create web wallet** at https://wallet.xion.burnt.com
2. **Get testnet tokens** from faucet
3. **Tell me your preference** - I'll provide the appropriate files
4. **Deploy contracts** using chosen method
5. **Update environment** with contract addresses

## Need Pre-compiled Files?

If you want me to create the pre-compiled WASM files for web deployment, just let me know and I'll generate them for you!
