# Xion Wallet Setup Guide

## Which Wallet to Use?

For Xion blockchain, you have several options:

### 1. **Xion Native Wallet (Recommended for Development)**
- **Best for**: Development and testing
- **Features**: Full control, CLI integration, testnet support
- **Setup**: Command-line wallet

### 2. **Xion Web Wallet**
- **Best for**: End users, simple interface
- **Features**: Browser-based, account abstraction
- **Setup**: Visit https://wallet.xion.burnt.com

### 3. **Keplr Wallet Extension**
- **Best for**: Browser integration, multiple chains
- **Features**: Chrome extension, supports Xion
- **Setup**: Install from Chrome Web Store

## Quick Setup for Development

### Option 1: CLI Wallet (Recommended for Developers)

1. **Install Xion CLI**
```bash
# Install Go first (required)
go version

# Install Xion CLI
git clone https://github.com/burnt-labs/xion.git
cd xion
make install
```

2. **Create a New Wallet**
```bash
# Create wallet (will prompt for password)
xiond keys add default --keyring-backend test

# Show wallet address
xiond keys show default --address --keyring-backend test

# Show mnemonic (save this securely!)
xiond keys show default --mnemonic --keyring-backend test
```

3. **Get Testnet Tokens**
```bash
# Request from faucet
curl -X POST https://faucet.xion-testnet-1.burnt.com/api/v1/accounts/claim \
  -H "Content-Type: application/json" \
  -d '{"address":"YOUR_WALLET_ADDRESS"}'

# Or visit: https://faucet.xion.burnt.com
```

4. **Check Balance**
```bash
xiond query bank balances YOUR_WALLET_ADDRESS --node https://rpc.xion-testnet-1.burnt.com
```

### Option 2: Web Wallet (For End Users)

1. **Visit Web Wallet**
   - Go to: https://wallet.xion.burnt.com
   - Click "Create Wallet"

2. **Create Account**
   - Choose username
   - Set password
   - Save recovery phrase

3. **Get Testnet Tokens**
   - Use the built-in faucet
   - Or visit: https://faucet.xion.burnt.com

## Connecting in the Application

### For Development (CLI Wallet)

The app supports connecting with mnemonic phrases:

1. **Get Your Mnemonic**
```bash
xiond keys show default --mnemonic --keyring-backend test
```

2. **Connect in App**
   - Open the Xion Wallet Connect component
   - Click "Show Mnemonic Input"
   - Enter your 12-word mnemonic phrase
   - Click "Connect Wallet"

### For End Users (Web Wallet)

1. **Use Web Wallet**
   - Visit https://wallet.xion.burnt.com
   - Create/import wallet
   - Get tokens from faucet

2. **Connect to App**
   - The app will integrate with web wallet (future feature)
   - For now, use the mnemonic input method

## Wallet Security

### **IMPORTANT SECURITY NOTES**

1. **Never share your mnemonic phrase**
2. **Store mnemonics offline** (paper, encrypted storage)
3. **Use testnet only** for development
4. **Never use mainnet** without proper security
5. **Different wallets** for different projects

### **Best Practices**

```bash
# Use test backend for development
--keyring-backend test

# Never use mainnet for testing
--node https://rpc.xion-testnet-1.burnt.com

# Always verify addresses before sending
xiond keys show default --address
```

## Troubleshooting

### **Common Issues**

1. **"No default wallet found"**
   ```bash
   xiond keys add default --keyring-backend test
   ```

2. **"Insufficient balance"**
   - Get tokens from faucet
   - Check correct network (testnet)

3. **"Invalid mnemonic"**
   - Ensure 12 words exactly
   - Check spelling and spacing

4. **"Connection failed"**
   - Verify RPC URL
   - Check network connectivity

### **Reset Wallet (If Needed)**
```bash
# WARNING: This deletes your wallet!
xiond keys delete default --keyring-backend test

# Create new one
xiond keys add default --keyring-backend test
```

## Next Steps

1. **Set up wallet** using CLI or web wallet
2. **Get testnet tokens** from faucet
3. **Deploy contracts** using the deployment script
4. **Connect wallet** in the application
5. **Test blockchain features**

## Need Help?

- **Xion Documentation**: https://docs.burnt.com/xion
- **Discord Community**: https://discord.gg/xion
- **Testnet Faucet**: https://faucet.xion.burnt.com
- **Explorer**: https://explorer.xion.burnt.com
