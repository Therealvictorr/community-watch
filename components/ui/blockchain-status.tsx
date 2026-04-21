"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useXionWallet } from "@/hooks/use-xion-wallet";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  ExternalLink,
  RefreshCw,
  Database
} from "lucide-react";

interface TransactionStatus {
  hash: string;
  status: "pending" | "confirmed" | "failed";
  timestamp: number;
  description: string;
}

interface BlockchainStatusProps {
  transactions?: TransactionStatus[];
  onRefresh?: () => void;
}

export function BlockchainStatus({ transactions = [], onRefresh }: BlockchainStatusProps) {
  const { isConnected, address, balance } = useXionWallet();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  const formatBalance = (balance: string) => {
    const xionBalance = parseInt(balance) / 1000000;
    return `${xionBalance.toFixed(6)} XION`;
  };

  const getExplorerUrl = (hash: string) => {
    // This would be the Xion blockchain explorer URL
    return `https://explorer.xion.burnt.com/tx/${hash}`;
  };

  if (!isConnected) {
    return (
      <Alert>
        <Database className="h-4 w-4" />
        <AlertDescription>
          Connect your Xion wallet to see blockchain status and transactions.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Wallet Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Blockchain Status
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Wallet Address</div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {formatAddress(address || "")}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (address) navigator.clipboard.writeText(address);
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Balance</div>
              <Badge variant="secondary" className="text-sm">
                {formatBalance(balance)}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
            <span className="text-sm text-gray-600">
              Xion Testnet
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.map((tx, index) => (
                <div key={tx.hash} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(tx.status)}
                    <div>
                      <div className="font-medium text-sm">{tx.description}</div>
                      <div className="text-xs text-gray-500 font-mono">
                        {tx.hash.slice(0, 12)}...{tx.hash.slice(-12)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(tx.status)}>
                      {tx.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <a
                        href={getExplorerUrl(tx.hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {transactions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Database className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions</h3>
            <p className="text-gray-600 text-center">
              Your blockchain transaction history will appear here once you start using the system.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
