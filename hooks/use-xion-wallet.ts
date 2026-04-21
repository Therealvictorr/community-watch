"use client";

import { useState, useEffect, useCallback } from "react";
import { xionClient } from "@/lib/xion-client";

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string;
  isLoading: boolean;
  error: string | null;
}

export function useXionWallet() {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: "0",
    isLoading: false,
    error: null,
  });

  const connect = useCallback(async (mnemonic?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const address = await xionClient.connect(mnemonic);
      
      setState({
        isConnected: true,
        address,
        balance: "0",
        isLoading: false,
        error: null,
      });

      // Fetch balance after connection
      try {
        const balance = await xionClient.getBalance();
        setState(prev => ({ ...prev, balance }));
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to connect wallet",
      }));
    }
  }, []);

  const disconnect = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await xionClient.disconnect();
      setState({
        isConnected: false,
        address: null,
        balance: "0",
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to disconnect wallet",
      }));
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!state.isConnected) return;
    
    try {
      const balance = await xionClient.getBalance();
      setState(prev => ({ ...prev, balance }));
    } catch (error) {
      console.error("Failed to refresh balance:", error);
    }
  }, [state.isConnected]);

  const getAccountInfo = useCallback(async () => {
    if (!state.isConnected) return null;
    
    try {
      return await xionClient.getAccountInfo();
    } catch (error) {
      console.error("Failed to get account info:", error);
      return null;
    }
  }, [state.isConnected]);

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    if (!state.isConnected) return;

    const interval = setInterval(() => {
      refreshBalance();
    }, 30000);

    return () => clearInterval(interval);
  }, [state.isConnected, refreshBalance]);

  return {
    ...state,
    connect,
    disconnect,
    refreshBalance,
    getAccountInfo,
  };
}
