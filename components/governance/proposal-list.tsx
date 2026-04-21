"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useXionWallet } from "@/hooks/use-xion-wallet";
import { governanceContract } from "@/lib/xion-contracts";
import { Proposal, Vote } from "@/lib/xion-contracts";
import { 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Play,
  Vote as VoteIcon,
  ExternalLink
} from "lucide-react";

export function ProposalList() {
  const { isConnected, address } = useXionWallet();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voting, setVoting] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    try {
      setLoading(true);
      const activeProposals = await governanceContract.getActiveProposals();
      setProposals(activeProposals);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load proposals");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (proposalId: string, voteType: "For" | "Against" | "Abstain") => {
    if (!isConnected || !address) return;

    try {
      setVoting(prev => ({ ...prev, [proposalId]: true }));
      
      await governanceContract.vote(proposalId, voteType);
      
      // Refresh proposals after voting
      await loadProposals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to vote");
    } finally {
      setVoting(prev => ({ ...prev, [proposalId]: false }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-blue-100 text-blue-800";
      case "Passed":
        return "bg-green-100 text-green-800";
      case "Failed":
        return "bg-red-100 text-red-800";
      case "Executed":
        return "bg-purple-100 text-purple-800";
      case "Expired":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active":
        return <Clock className="h-4 w-4" />;
      case "Passed":
        return <CheckCircle className="h-4 w-4" />;
      case "Failed":
        return <XCircle className="h-4 w-4" />;
      case "Executed":
        return <Play className="h-4 w-4" />;
      case "Expired":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatTimeRemaining = (expiresAt: number) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = expiresAt - now;
    
    if (remaining <= 0) return "Expired";
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  const calculateVotePercentage = (votesFor: string, votesAgainst: string) => {
    const total = parseInt(votesFor) + parseInt(votesAgainst);
    if (total === 0) return 0;
    return (parseInt(votesFor) / total) * 100;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (proposals.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <VoteIcon className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Proposals</h3>
          <p className="text-gray-600 text-center mb-4">
            There are currently no active governance proposals. Be the first to create one!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Active Proposals</h2>
        <Badge variant="outline" className="bg-blue-50">
          {proposals.length} Active
        </Badge>
      </div>

      {proposals.map((proposal) => (
        <Card key={proposal.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg mb-2">{proposal.title}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {proposal.description}
                </CardDescription>
              </div>
              <div className="ml-4">
                <Badge className={getStatusColor(proposal.status)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(proposal.status)}
                    {proposal.status}
                  </span>
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {proposal.total_voters} voters
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatTimeRemaining(proposal.expires_at)}
              </div>
              <Badge variant="outline" className="text-xs">
                {proposal.proposal_type}
              </Badge>
            </div>

            {/* Vote Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-600">For: {proposal.votes_for}</span>
                <span className="text-red-600">Against: {proposal.votes_against}</span>
              </div>
              <Progress 
                value={calculateVotePercentage(proposal.votes_for, proposal.votes_against)} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{calculateVotePercentage(proposal.votes_for, proposal.votes_against).toFixed(1)}%</span>
                <span>{proposal.quorum_met ? "Quorum met" : "Quorum not met"}</span>
              </div>
            </div>

            {/* Voting Buttons */}
            {proposal.status === "Active" && isConnected && (
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  size="sm"
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleVote(proposal.id, "For")}
                  disabled={voting[proposal.id]}
                >
                  {voting[proposal.id] ? "Voting..." : "Vote For"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleVote(proposal.id, "Against")}
                  disabled={voting[proposal.id]}
                >
                  {voting[proposal.id] ? "Voting..." : "Vote Against"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleVote(proposal.id, "Abstain")}
                  disabled={voting[proposal.id]}
                >
                  {voting[proposal.id] ? "Voting..." : "Abstain"}
                </Button>
              </div>
            )}

            {!isConnected && proposal.status === "Active" && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Connect your wallet to vote on this proposal
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
