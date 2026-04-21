import { SigningStargateClient, StargateClient } from "@cosmjs/stargate";
import { DirectSecp256k1HdWallet, OfflineDirectSigner } from "@cosmjs/proto-signing";
import { fromBase64, toBase64 } from "@cosmjs/encoding";

export interface XionConfig {
  rpcUrl: string;
  chainId: string;
  denom: string;
  prefix: string;
}

export const XION_CONFIG: XionConfig = {
  rpcUrl: process.env.NEXT_PUBLIC_XION_RPC_URL || "https://rpc.xion-testnet-1.burnt.com",
  chainId: process.env.NEXT_PUBLIC_XION_CHAIN_ID || "xion-testnet-1",
  denom: process.env.NEXT_PUBLIC_XION_DENOM || "uxion",
  prefix: process.env.NEXT_PUBLIC_XION_PREFIX || "xion",
};

export class XionClient {
  private client: SigningStargateClient | null = null;
  private wallet: OfflineDirectSigner | null = null;
  private address: string | null = null;

  async connect(mnemonic?: string): Promise<string> {
    try {
      if (mnemonic) {
        this.wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
          prefix: XION_CONFIG.prefix,
        });
      } else {
        // Generate a new wallet for demo purposes
        this.wallet = DirectSecp256k1HdWallet.generate(12, {
          prefix: XION_CONFIG.prefix,
        });
      }

      const accounts = await this.wallet.getAccounts();
      this.address = accounts[0].address;

      this.client = await SigningStargateClient.connectWithSigner(
        XION_CONFIG.rpcUrl,
        this.wallet
      );

      return this.address;
    } catch (error) {
      console.error("Failed to connect to Xion:", error);
      throw new Error("Failed to connect to Xion blockchain");
    }
  }

  async disconnect(): Promise<void> {
    this.client = null;
    this.wallet = null;
    this.address = null;
  }

  getAddress(): string | null {
    return this.address;
  }

  isConnected(): boolean {
    return this.client !== null && this.address !== null;
  }

  async getBalance(): Promise<string> {
    if (!this.client || !this.address) {
      throw new Error("Not connected to blockchain");
    }

    try {
      const queryClient = await StargateClient.connect(XION_CONFIG.rpcUrl);
      const balance = await queryClient.getBalance(this.address, XION_CONFIG.denom);
      return balance.amount;
    } catch (error) {
      console.error("Failed to get balance:", error);
      throw new Error("Failed to get balance");
    }
  }

  async sendTransaction(
    contractAddress: string,
    msg: any,
    memo?: string
  ): Promise<string> {
    if (!this.client || !this.address) {
      throw new Error("Not connected to blockchain");
    }

    try {
      const fee = {
        amount: [{ denom: XION_CONFIG.denom, amount: "1000" }],
        gas: "200000",
      };

      const result = await this.client.signAndBroadcast(
        this.address,
        [
          {
            typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
            value: {
              sender: this.address,
              contract: contractAddress,
              msg: toBase64(JSON.stringify(msg)),
              funds: [],
            },
          },
        ],
        fee,
        memo
      );

      return result.transactionHash;
    } catch (error) {
      console.error("Failed to send transaction:", error);
      throw new Error("Failed to send transaction");
    }
  }

  async queryContract(contractAddress: string, queryMsg: any): Promise<any> {
    if (!this.client) {
      throw new Error("Not connected to blockchain");
    }

    try {
      const queryClient = await StargateClient.connect(XION_CONFIG.rpcUrl);
      const result = await queryClient.queryContractSmart(
        contractAddress,
        queryMsg
      );
      return result;
    } catch (error) {
      console.error("Failed to query contract:", error);
      throw new Error("Failed to query contract");
    }
  }

  async getAccountInfo(): Promise<any> {
    if (!this.address) {
      throw new Error("Not connected to blockchain");
    }

    try {
      const queryClient = await StargateClient.connect(XION_CONFIG.rpcUrl);
      const account = await queryClient.getAccount(this.address);
      return account;
    } catch (error) {
      console.error("Failed to get account info:", error);
      throw new Error("Failed to get account info");
    }
  }
}

// Singleton instance
export const xionClient = new XionClient();
