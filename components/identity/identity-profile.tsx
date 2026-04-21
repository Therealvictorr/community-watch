"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useXionWallet } from "@/hooks/use-xion-wallet";
import { identityContract } from "@/lib/xion-contracts";
import { Identity } from "@/lib/xion-contracts";
import { 
  User, 
  Shield, 
  Star, 
  Award, 
  CheckCircle, 
  Clock,
  Edit,
  Upload,
  AlertCircle
} from "lucide-react";

export function IdentityProfile() {
  const { isConnected, address } = useXionWallet();
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);

  // Form state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [verificationLevel, setVerificationLevel] = useState("");
  const [documents, setDocuments] = useState<string[]>([]);
  const [newDocument, setNewDocument] = useState("");

  useEffect(() => {
    if (isConnected && address) {
      loadIdentity();
    }
  }, [isConnected, address]);

  const loadIdentity = async () => {
    if (!address) return;

    try {
      setLoading(true);
      const userIdentity = await identityContract.getIdentity(address);
      setIdentity(userIdentity);
      setUsername(userIdentity.username);
      setEmail(userIdentity.email || "");
      setPhone(userIdentity.phone || "");
    } catch (err) {
      // If identity doesn't exist, we can create one
      if (err instanceof Error && err.message.includes("not found")) {
        setIdentity(null);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load identity");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIdentity = async () => {
    if (!isConnected || !address) return;

    try {
      setLoading(true);
      await identityContract.createIdentity(username, email || undefined, phone || undefined);
      await loadIdentity();
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create identity");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateIdentity = async () => {
    if (!isConnected || !address) return;

    try {
      setLoading(true);
      await identityContract.updateIdentity(
        username !== identity?.username ? username : undefined,
        email !== identity?.email ? email : undefined,
        phone !== identity?.phone ? phone : undefined
      );
      await loadIdentity();
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update identity");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestVerification = async () => {
    if (!isConnected || !address || !verificationLevel) return;

    try {
      setVerificationLoading(true);
      await identityContract.requestVerification(verificationLevel, documents);
      setEditing(false);
      setVerificationLevel("");
      setDocuments([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request verification");
    } finally {
      setVerificationLoading(false);
    }
  };

  const addDocument = () => {
    if (newDocument.trim()) {
      setDocuments([...documents, newDocument.trim()]);
      setNewDocument("");
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const getVerificationColor = (level: string) => {
    switch (level) {
      case "Basic":
        return "bg-blue-100 text-blue-800";
      case "Verified":
        return "bg-green-100 text-green-800";
      case "Trusted":
        return "bg-purple-100 text-purple-800";
      case "Moderator":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getReputationColor = (score: number) => {
    if (score >= 100) return "bg-purple-500";
    if (score >= 50) return "bg-green-500";
    if (score >= 25) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (!isConnected) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please connect your Xion wallet to view and manage your identity profile.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading && !identity) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!identity) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Create Your Identity
          </CardTitle>
          <CardDescription>
            Establish your on-chain identity for the community watch system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleCreateIdentity(); }} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                placeholder="Choose a unique username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create Identity"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Identity Profile</CardTitle>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(!editing)}
            >
              <Edit className="h-4 w-4 mr-1" />
              {editing ? "Cancel" : "Edit"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-username">Username</Label>
                  <Input
                    id="edit-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateIdentity} disabled={loading}>
                  {loading ? "Updating..." : "Update Profile"}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Username</Label>
                    <p className="text-lg font-semibold">{identity.username}</p>
                  </div>
                  {identity.email && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Email</Label>
                      <p className="text-sm">{identity.email}</p>
                    </div>
                  )}
                  {identity.phone && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Phone</Label>
                      <p className="text-sm">{identity.phone}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Verification Level</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getVerificationColor(identity.verification_level)}>
                        <Shield className="h-3 w-3 mr-1" />
                        {identity.verification_level}
                      </Badge>
                      {identity.is_moderator && (
                        <Badge variant="outline" className="bg-red-50">
                          <Award className="h-3 w-3 mr-1" />
                          Moderator
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Account Status</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={identity.is_active ? "default" : "secondary"}>
                        {identity.is_active ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reputation & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Reputation Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-bold">{identity.reputation_score}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Score</p>
                  <p className="text-lg font-semibold">{identity.reputation_score} / 1000</p>
                </div>
              </div>
              <Progress 
                value={(identity.reputation_score / 1000) * 100} 
                className="h-2"
              />
              <div className="text-xs text-gray-500">
                Higher reputation increases your influence in governance and verification
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Activity Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{identity.reports_created}</div>
                <div className="text-sm text-gray-600">Reports Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{identity.sightings_contributed}</div>
                <div className="text-sm text-gray-600">Sightings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{identity.verification_count}</div>
                <div className="text-sm text-gray-600">Verifications</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{identity.disputes_count}</div>
                <div className="text-sm text-gray-600">Disputes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verification Request */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Request Verification
          </CardTitle>
          <CardDescription>
            Upgrade your verification level to gain more trust and privileges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="verification-level">Verification Level</Label>
                <select
                  id="verification-level"
                  value={verificationLevel}
                  onChange={(e) => setVerificationLevel(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select level</option>
                  <option value="Basic">Basic (10 reputation)</option>
                  <option value="Verified">Verified (50 reputation)</option>
                  <option value="Trusted">Trusted (100 reputation)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Supporting Documents</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add document URL or reference"
                  value={newDocument}
                  onChange={(e) => setNewDocument(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDocument())}
                />
                <Button type="button" onClick={addDocument} variant="outline">
                  Add
                </Button>
              </div>
              {documents.length > 0 && (
                <div className="space-y-2">
                  {documents.map((doc, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <span className="text-sm flex-1">{doc}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeDocument(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={handleRequestVerification}
              disabled={!verificationLevel || documents.length === 0 || verificationLoading}
            >
              {verificationLoading ? "Submitting..." : "Request Verification"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
