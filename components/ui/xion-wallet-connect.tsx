"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useXionWallet } from "@/hooks/use-xion-wallet";
import { Wallet, Wallet2, Copy, RefreshCw, LogOut } from "lucide-react";

export function XionWalletConnect() {
  const { 
    isConnected, 
    address, 
    balance, 
    isLoading, 
    error, 
    connect, 
    disconnect, 
    refreshBalance 
  } = useXionWallet();
  
  const [mnemonic, setMnemonic] = useState("");
  const [showMnemonic, setShowMnemonic] = useState(false);

  const handleConnect = () => {
    if (mnemonic.trim()) {
      connect(mnemonic.trim());
    } else {
      // Connect with generated wallet
      connect();
    }
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 10)}...${addr.slice(-10)}`;
  };

  if (isConnected && address) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet2 className="h-5 w-5" />
            Xion Wallet Connected
          </CardTitle>
          <CardDescription>
            Your wallet is connected to the Xion blockchain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Address</Label>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {formatAddress(address)}
              </Badge>
              <Button size="sm" variant="outline" onClick={copyAddress}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Balance</Label>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {(parseInt(balance) / 1000000).toFixed(6)} XION
              </Badge>
              <Button size="sm" variant="outline" onClick={refreshBalance}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-green-500">
              Connected
            </Badge>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={disconnect}
              disabled={isLoading}
            >
              <LogOut className="h-3 w-3 mr-1" />
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Connect Xion Wallet
        </CardTitle>
        <CardDescription>
          Connect your wallet to interact with the blockchain
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMnemonic(!showMnemonic)}
            className="w-full"
          >
            {showMnemonic ? "Hide" : "Show"} Mnemonic Input
          </Button>
          
          {showMnemonic && (
            <div className="space-y-2">
              <Label htmlFor="mnemonic">Mnemonic Phrase (Optional)</Label>
              <Input
                id="mnemonic"
                type="password"
                placeholder="Enter your 12-word mnemonic phrase"
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to generate a new wallet for demo purposes
              </p>
            </div>
          )}
        </div>

        <Button 
          onClick={handleConnect} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Connecting..." : "Connect Wallet"}
        </Button>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>By connecting, you agree to interact with the Xion blockchain.</p>
          <p>No private keys are stored - connection is session-based.</p>
        </div>
      </CardContent>
    </Card>
  );
}
