#!/bin/bash

# Xion Smart Contract Deployment Script
# This script helps deploy all three contracts to Xion testnet

set -e

# Configuration
NETWORK="xion-testnet-1"
RPC_URL="https://rpc.xion-testnet-1.burnt.com"
CHAIN_ID="xion-testnet-1"
DENOM="uxion"
PREFIX="xion"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Xion Smart Contract Deployment Script ===${NC}"
echo ""

# Check if xiond is installed
if ! command -v xiond &> /dev/null; then
    echo -e "${RED}Error: xiond is not installed. Please install Xion CLI tools first.${NC}"
    echo "Visit: https://docs.burnt.com/xion/developers/getting-started"
    exit 1
fi

# Check if wallet is configured
echo -e "${YELLOW}Checking wallet configuration...${NC}"
if ! xiond keys list --keyring-backend test 2>/dev/null | grep -q "default"; then
    echo -e "${YELLOW}No default wallet found. Creating a new wallet...${NC}"
    echo "Please enter a password for your new wallet (remember it!):"
    xiond keys add default --keyring-backend test
    echo ""
    echo -e "${GREEN}Wallet created successfully!${NC}"
    echo "IMPORTANT: Save your mnemonic phrase securely!"
    echo ""
else
    echo -e "${GREEN}Default wallet found.${NC}"
fi

# Get wallet address
WALLET_ADDRESS=$(xiond keys show default --address --keyring-backend test)
echo -e "${GREEN}Wallet Address: ${WALLET_ADDRESS}${NC}"
echo ""

# Check balance
echo -e "${YELLOW}Checking wallet balance...${NC}"
BALANCE=$(xiond query bank balances $WALLET_ADDRESS --node $RPC_URL --output json | jq -r '.balances[0].amount' 2>/dev/null || echo "0")

if [ "$BALANCE" -eq 0 ]; then
    echo -e "${RED}Wallet has no balance. Please get testnet tokens first.${NC}"
    echo "Visit: https://faucet.xion.burnt.com"
    echo "Or request tokens from the Xion Discord."
    exit 1
fi

echo -e "${GREEN}Current Balance: $(echo $BALANCE | awk '{printf "%.6f", $1/1000000}') XION${NC}"
echo ""

# Function to deploy contract
deploy_contract() {
    local CONTRACT_NAME=$1
    local CONTRACT_FILE=$2
    local INIT_MSG=$3
    
    echo -e "${YELLOW}Deploying ${CONTRACT_NAME} contract...${NC}"
    
    # Check if contract file exists
    if [ ! -f "contracts/${CONTRACT_NAME}/artifacts/${CONTRACT_FILE}" ]; then
        echo -e "${RED}Contract file not found: contracts/${CONTRACT_NAME}/artifacts/${CONTRACT_FILE}${NC}"
        echo "Please build the contracts first with 'cargo build'"
        return 1
    fi
    
    # Store contract
    echo "Storing contract code..."
    STORE_RESULT=$(xiond tx wasm store "contracts/${CONTRACT_NAME}/artifacts/${CONTRACT_FILE}" \
        --from default \
        --node $RPC_URL \
        --chain-id $CHAIN_ID \
        --gas auto \
        --gas-adjustment 1.3 \
        --keyring-backend test \
        --broadcast-mode block \
        -y \
        --output json)
    
    CODE_ID=$(echo $STORE_RESULT | jq -r '.logs[0].events[-1].attributes[-1].value')
    echo -e "${GREEN}Contract stored with Code ID: ${CODE_ID}${NC}"
    
    # Instantiate contract
    echo "Instantiating contract..."
    INSTANTIATE_RESULT=$(xiond tx wasm instantiate $CODE_ID "$INIT_MSG" \
        --from default \
        --node $RPC_URL \
        --chain-id $CHAIN_ID \
        --gas auto \
        --gas-adjustment 1.3 \
        --keyring-backend test \
        --label "${CONTRACT_NAME}" \
        --no-admin \
        --broadcast-mode block \
        -y \
        --output json)
    
    CONTRACT_ADDRESS=$(echo $INSTANTIATE_RESULT | jq -r '.logs[0].events[-1].attributes[-1].value')
    echo -e "${GREEN}Contract deployed at: ${CONTRACT_ADDRESS}${NC}"
    
    # Save contract address to file
    echo "${CONTRACT_ADDRESS}" > ".${CONTRACT_NAME}_address"
    
    return 0
}

# Build contracts first
echo -e "${YELLOW}Building contracts...${NC}"
cd contracts
cargo build --release --target wasm32-unknown-unknown
cd ..

echo -e "${YELLOW}Optimizing contracts...${NC}"
# Optimize contracts (optional but recommended)
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/optimizer:0.16.1

echo ""
echo -e "${GREEN}=== Starting Contract Deployment ===${NC}"
echo ""

# Deploy Community Watch Contract
deploy_contract "community-watch" "community_watch.wasm" "{\"admin\":\"$WALLET_ADDRESS\"}"
if [ $? -eq 0 ]; then
    COMMUNITY_WATCH_ADDRESS=$(cat .community-watch_address)
    echo -e "${GREEN}Community Watch Contract: ${COMMUNITY_WATCH_ADDRESS}${NC}"
fi
echo ""

# Deploy Governance Contract  
deploy_contract "governance" "governance.wasm" "{\"admin\":\"$WALLET_ADDRESS\"}"
if [ $? -eq 0 ]; then
    GOVERNANCE_ADDRESS=$(cat .governance_address)
    echo -e "${GREEN}Governance Contract: ${GOVERNANCE_ADDRESS}${NC}"
fi
echo ""

# Deploy Identity Contract
deploy_contract "identity" "identity.wasm" "{\"admin\":\"$WALLET_ADDRESS\"}"
if [ $? -eq 0 ]; then
    IDENTITY_ADDRESS=$(cat .identity_address)
    echo -e "${GREEN}Identity Contract: ${IDENTITY_ADDRESS}${NC}"
fi
echo ""

# Update .env.local file
echo -e "${YELLOW}Updating .env.local file...${NC}"
if [ -f ".env.local" ]; then
    # Update existing file
    sed -i.bak "s/NEXT_PUBLIC_COMMUNITY_WATCH_CONTRACT=.*/NEXT_PUBLIC_COMMUNITY_WATCH_CONTRACT=${COMMUNITY_WATCH_ADDRESS}/" .env.local
    sed -i.bak "s/NEXT_PUBLIC_GOVERNANCE_CONTRACT=.*/NEXT_PUBLIC_GOVERNANCE_CONTRACT=${GOVERNANCE_ADDRESS}/" .env.local  
    sed -i.bak "s/NEXT_PUBLIC_IDENTITY_CONTRACT=.*/NEXT_PUBLIC_IDENTITY_CONTRACT=${IDENTITY_ADDRESS}/" .env.local
    rm .env.local.bak
else
    # Create new file from example
    cp .env.local.example .env.local
    sed -i "s/NEXT_PUBLIC_COMMUNITY_WATCH_CONTRACT=.*/NEXT_PUBLIC_COMMUNITY_WATCH_CONTRACT=${COMMUNITY_WATCH_ADDRESS}/" .env.local
    sed -i "s/NEXT_PUBLIC_GOVERNANCE_CONTRACT=.*/NEXT_PUBLIC_GOVERNANCE_CONTRACT=${GOVERNANCE_ADDRESS}/" .env.local
    sed -i "s/NEXT_PUBLIC_IDENTITY_CONTRACT=.*/NEXT_PUBLIC_IDENTITY_CONTRACT=${IDENTITY_ADDRESS}/" .env.local
fi

echo ""
echo -e "${GREEN}=== Deployment Complete! ===${NC}"
echo ""
echo "Contract Addresses:"
echo "Community Watch: ${COMMUNITY_WATCH_ADDRESS}"
echo "Governance: ${GOVERNANCE_ADDRESS}"  
echo "Identity: ${IDENTITY_ADDRESS}"
echo ""
echo "Your .env.local file has been updated with the contract addresses."
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Copy .env.local.example to .env.local (if not done automatically)"
echo "2. Add your Supabase configuration to .env.local"
echo "3. Start the development server: npm run dev"
echo "4. Connect your wallet in the app"
echo ""
echo -e "${GREEN}Happy building!${NC}"
