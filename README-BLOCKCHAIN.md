# Xion Blockchain Integration

This document describes the Xion blockchain integration implemented in the Community Watch application.

## Overview

The application now includes comprehensive Xion blockchain functionality for:
- **Smart Contracts**: Storing reports and sightings on-chain
- **Governance**: Community voting mechanisms  
- **Identity**: On-chain user identity and verification
- **Wallet Integration**: Xion wallet connection and authentication

## Architecture

### Smart Contracts

#### 1. Community Watch Contract (`contracts/community-watch/`)
- Stores reports and sightings permanently on-chain
- Supports verification and dispute mechanisms
- Location-based queries and category filtering
- Gasless transaction support through Xion's fee abstraction

#### 2. Governance Contract (`contracts/governance/`)
- Proposal creation and voting system
- Quorum-based decision making
- Multiple proposal types (resource allocation, rule changes, etc.)
- Automatic execution of passed proposals

#### 3. Identity Contract (`contracts/identity/`)
- On-chain user profiles with reputation scores
- Multi-tier verification system (Basic, Verified, Trusted, Moderator)
- Reputation tracking for community contributions
- Identity verification with document support

### Frontend Components

#### Wallet Integration
- **XionWalletConnect**: Connect/disconnect wallet functionality
- **useXionWallet**: React hook for wallet state management
- **XionClient**: Low-level blockchain interaction client

#### UI Components
- **BlockchainReportForm**: Enhanced report form with blockchain storage option
- **ProposalForm**: Create governance proposals
- **ProposalList**: View and vote on active proposals
- **IdentityProfile**: Manage on-chain identity and verification
- **BlockchainStatus**: Display wallet status and transaction history
- **TransactionMonitor**: Real-time transaction status tracking

## Setup Instructions

### 1. Environment Configuration

Copy `.env.local.example` to `.env.local` and fill in the values:

```bash
cp .env.local.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_XION_RPC_URL`: Xion network RPC endpoint
- `NEXT_PUBLIC_XION_CHAIN_ID`: Chain identifier
- `NEXT_PUBLIC_XION_DENOM`: Native token denomination
- `NEXT_PUBLIC_XION_PREFIX`: Address prefix
- Contract addresses (after deployment)

### 2. Smart Contract Deployment

#### Prerequisites
- Rust toolchain
- CosmWasm tools
- Xion CLI tools

#### Build Contracts
```bash
cd contracts
cargo build --release --target wasm32-unknown-unknown
```

#### Optimize Contracts
```bash
# Install optimizer
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/optimizer:0.16.1

# Or use local optimizer
docker run --rm -v "$(pwd)":/code \
  cosmwasm/workspace-optimizer:0.12.13
```

#### Deploy Contracts
```bash
# Deploy Community Watch contract
xiond tx wasm instantiate community-watch.wasm '{"admin":"<your-address>"}' \
  --from <your-key> --label "community-watch" --no-admin

# Deploy Governance contract  
xiond tx wasm instantiate governance.wasm '{"admin":"<your-address>"}' \
  --from <your-key> --label "governance" --no-admin

# Deploy Identity contract
xiond tx wasm instantiate identity.wasm '{"admin":"<your-address>"}' \
  --from <your-key> --label "identity" --no-admin
```

Update contract addresses in `.env.local`.

### 3. Frontend Dependencies

The blockchain integration requires these additional dependencies:
```json
{
  "@cosmjs/stargate": "^0.32.0",
  "@cosmjs/proto-signing": "^0.32.0", 
  "@cosmjs/encoding": "^0.32.0",
  "dotenv": "^16.4.5"
}
```

## Features

### 1. Blockchain Report Storage

Users can optionally store reports on the Xion blockchain:
- **Permanent Storage**: Reports stored immutably on-chain
- **Verification System**: Community members can verify/dispute reports
- **Location Queries**: Find reports by geographic area
- **Category Filtering**: Browse reports by type

### 2. Governance System

Community-driven decision making:
- **Proposal Creation**: Submit proposals for community vote
- **Voting Mechanism**: Cast votes (For/Against/Abstain) on proposals
- **Quorum Requirements**: Minimum participation for validity
- **Automatic Execution**: Passed proposals execute automatically

### 3. Identity & Reputation

On-chain identity management:
- **User Profiles**: Username, contact info, verification status
- **Reputation System**: Earn reputation through contributions
- **Verification Levels**: Basic, Verified, Trusted, Moderator tiers
- **Activity Tracking**: Reports created, sightings contributed, etc.

### 4. Wallet Integration

Seamless blockchain interaction:
- **Account Abstraction**: No seed phrases required (Xion feature)
- **Gasless Transactions**: Fee abstraction for user-friendly experience
- **Transaction Monitoring**: Real-time status updates
- **Explorer Integration**: View transactions on blockchain explorer

## Usage

### Creating Blockchain Reports

1. Connect your Xion wallet
2. Fill out the report form
3. Toggle "Store on Blockchain" option
4. Submit - report stored in both database and blockchain

### Participating in Governance

1. Navigate to `/governance`
2. View active proposals
3. Cast your vote on proposals
4. Create new proposals for community consideration

### Managing Identity

1. Go to `/identity`
2. Create your on-chain identity profile
3. Request verification with supporting documents
4. Build reputation through community contributions

## Security Considerations

- **Private Keys**: Never stored in the application
- **Session-Based**: Wallet connection is temporary
- **Validation**: All contract inputs validated on-chain
- **Access Control**: Role-based permissions for sensitive operations

## Monitoring

### Transaction Status

The application includes real-time transaction monitoring:
- Automatic status updates for pending transactions
- Progress tracking for batch operations
- Error handling and retry mechanisms
- Explorer links for detailed transaction info

### Blockchain Status

Monitor wallet connection and blockchain state:
- Connection status indicators
- Balance tracking
- Network information
- Recent transaction history

## Future Enhancements

- **NFT Integration**: Mint NFTs for verified reports
- **Token Rewards**: Reward system for contributions
- **Cross-Chain**: Support for additional blockchains
- **Mobile App**: Native mobile wallet integration
- **Advanced Analytics**: Blockchain data visualization

## Troubleshooting

### Common Issues

1. **Wallet Connection Fails**
   - Check network configuration
   - Verify RPC endpoint accessibility
   - Ensure correct chain ID

2. **Transaction Failures**
   - Insufficient balance for gas fees
   - Contract not deployed or wrong address
   - Network connectivity issues

3. **Identity Creation Fails**
   - Username already taken
   - Wallet not connected
   - Insufficient reputation for verification

### Debug Mode

Enable debug logging:
```javascript
// In browser console
localStorage.setItem('xion-debug', 'true')
```

## Support

For issues related to:
- **Smart Contracts**: Check contract logs and error messages
- **Frontend**: Review browser console and network requests
- **Xion Network**: Consult Xion documentation and community resources

## Resources

- [Xion Documentation](https://docs.burnt.com/xion)
- [CosmWasm Documentation](https://cosmwasm.com/)
- [Xion Explorer](https://explorer.xion.burnt.com)
- [Community Discord](https://discord.gg/xion)
