"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Loader2
} from "lucide-react";

interface Transaction {
  hash: string;
  status: "pending" | "confirmed" | "failed";
  description: string;
  timestamp: number;
  blockNumber?: number;
  gasUsed?: string;
  error?: string;
}

interface TransactionMonitorProps {
  transactions: Transaction[];
  onTransactionUpdate?: (hash: string, status: Transaction["status"]) => void;
}

export function TransactionMonitor({ 
  transactions, 
  onTransactionUpdate 
}: TransactionMonitorProps) {
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  const checkTransactionStatus = useCallback(async (hash: string) => {
    if (updating.has(hash)) return;
    
    setUpdating(prev => new Set(prev).add(hash));
    
    try {
      // Simulate checking transaction status on blockchain
      // In a real implementation, you would query the blockchain
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Randomly determine status for demo
      const statuses: Transaction["status"][] = ["confirmed", "confirmed", "failed"];
      const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      if (onTransactionUpdate) {
        onTransactionUpdate(hash, newStatus);
      }
    } catch (error) {
      console.error("Failed to check transaction status:", error);
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(hash);
        return newSet;
      });
      setLastUpdate(Date.now());
    }
  }, [updating, onTransactionUpdate]);

  // Auto-refresh pending transactions
  useEffect(() => {
    const pendingTxs = transactions.filter(tx => tx.status === "pending");
    if (pendingTxs.length === 0) return;

    const interval = setInterval(() => {
      pendingTxs.forEach(tx => {
        checkTransactionStatus(tx.hash);
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [transactions, checkTransactionStatus]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return updating.has("all") || updating.size > 0 ? 
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin" /> : 
          <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getExplorerUrl = (hash: string) => {
    return `https://explorer.xion.burnt.com/tx/${hash}`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const refreshAll = () => {
    setUpdating(prev => new Set(prev).add("all"));
    
    transactions.forEach(tx => {
      if (tx.status === "pending") {
        checkTransactionStatus(tx.hash);
      }
    });
    
    setTimeout(() => {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete("all");
        return newSet;
      });
    }, 3000);
  };

  const pendingCount = transactions.filter(tx => tx.status === "pending").length;
  const confirmedCount = transactions.filter(tx => tx.status === "confirmed").length;
  const failedCount = transactions.filter(tx => tx.status === "failed").length;

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertTriangle className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions</h3>
          <p className="text-gray-600 text-center">
            Your transaction history will appear here once you start using the blockchain features.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction Monitor</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                Updated {formatTimeAgo(lastUpdate)}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={refreshAll}
                disabled={updating.has("all")}
              >
                <RefreshCw className={`h-4 w-4 ${updating.has("all") ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{confirmedCount}</div>
              <div className="text-sm text-gray-600">Confirmed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{failedCount}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </div>
          
          {pendingCount > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing Progress</span>
                <span>{pendingCount} pending</span>
              </div>
              <Progress value={((confirmedCount + failedCount) / transactions.length) * 100} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction List */}
      <div className="space-y-3">
        {transactions.map((tx) => (
          <Card key={tx.hash} className="transition-all hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(tx.status)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {tx.description}
                    </div>
                    <div className="text-xs text-gray-500 font-mono truncate">
                      {tx.hash.slice(0, 10)}...{tx.hash.slice(-10)}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(tx.timestamp)}
                      </span>
                      {tx.blockNumber && (
                        <span className="text-xs text-gray-500">
                          Block #{tx.blockNumber}
                        </span>
                      )}
                      {tx.gasUsed && (
                        <span className="text-xs text-gray-500">
                          Gas: {tx.gasUsed}
                        </span>
                      )}
                    </div>
                    {tx.error && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertDescription className="text-xs">
                          {tx.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Badge className={getStatusColor(tx.status)}>
                    {tx.status}
                  </Badge>
                  
                  {tx.status === "pending" && !updating.has(tx.hash) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => checkTransactionStatus(tx.hash)}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  )}
                  
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
