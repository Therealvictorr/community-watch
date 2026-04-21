"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useXionWallet } from "@/hooks/use-xion-wallet";
import { governanceContract } from "@/lib/xion-contracts";
import { AlertCircle, Send, Vote } from "lucide-react";

interface ProposalFormProps {
  onSuccess?: () => void;
}

export function ProposalForm({ onSuccess }: ProposalFormProps) {
  const { isConnected, address } = useXionWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [proposalType, setProposalType] = useState("");
  const [executionData, setExecutionData] = useState("");

  const generateProposalId = () => {
    return `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!isConnected || !address) {
      setError("Please connect your wallet to create a proposal");
      setLoading(false);
      return;
    }

    try {
      const proposalId = generateProposalId();
      const txHash = await governanceContract.createProposal(
        proposalId,
        title,
        description,
        proposalType,
        executionData || undefined
      );

      setSuccess(`Proposal created successfully! Transaction hash: ${txHash}`);
      setTitle("");
      setDescription("");
      setProposalType("");
      setExecutionData("");

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create proposal"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please connect your Xion wallet to create governance proposals.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Create Governance Proposal
        </CardTitle>
        <CardDescription>
          Submit a proposal for community voting
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Proposal Title *</Label>
            <Input
              id="title"
              placeholder="Enter a clear, concise title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Provide detailed information about your proposal..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proposalType">Proposal Type *</Label>
            <Select value={proposalType} onValueChange={setProposalType}>
              <SelectTrigger id="proposalType">
                <SelectValue placeholder="Select proposal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ReportVerification">
                  Report Verification
                </SelectItem>
                <SelectItem value="ResourceAllocation">
                  Resource Allocation
                </SelectItem>
                <SelectItem value="RuleChange">Rule Change</SelectItem>
                <SelectItem value="CommunityGuidelines">
                  Community Guidelines
                </SelectItem>
                <SelectItem value="ModeratorAppointment">
                  Moderator Appointment
                </SelectItem>
                <SelectItem value="TreasurySpend">Treasury Spend</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="executionData">Execution Data (Optional)</Label>
            <Textarea
              id="executionData"
              placeholder="JSON data for proposal execution (advanced)"
              value={executionData}
              onChange={(e) => setExecutionData(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Optional: JSON data that will be used if the proposal passes
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Spinner className="mr-2" /> : null}
              {loading ? "Creating..." : "Create Proposal"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
