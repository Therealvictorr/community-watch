"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Users, 
  MessageSquare,
  Eye,
  TrendingUp,
  Calendar,
  MapPin,
  RefreshCw,
  Bell,
  Share2
} from "lucide-react";

interface ProgressUpdate {
  id: string;
  type: "status_change" | "sighting" | "verification" | "note";
  message: string;
  timestamp: string;
  author: {
    name: string;
    avatar?: string;
    role: string;
  };
}

interface ReportProgress {
  reportId: string;
  currentStage: string;
  percentage: number;
  lastUpdate: string;
  estimatedResolution?: string;
  updates: ProgressUpdate[];
  teamMembers: Array<{
    name: string;
    role: string;
    avatar?: string;
  }>;
  stats: {
    views: number;
    shares: number;
    sightings: number;
    verifications: number;
  };
}

interface ReportProgressTrackerProps {
  reportId: string;
  reportTitle: string;
  reportType: string;
}

export function ReportProgressTracker({ reportId, reportTitle, reportType }: ReportProgressTrackerProps) {
  const [progress, setProgress] = useState<ReportProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Mock data - in real app, this would come from API/blockchain
  useEffect(() => {
    const mockProgress: ReportProgress = {
      reportId,
      currentStage: "investigating",
      percentage: 65,
      lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      estimatedResolution: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
      updates: [
        {
          id: "1",
          type: "status_change",
          message: "Report created and verified",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          author: {
            name: "System",
            role: "Automated",
          }
        },
        {
          id: "2", 
          type: "sighting",
          message: "New sighting reported near Central Park",
          timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
          author: {
            name: "Sarah Chen",
            role: "Community Member",
            avatar: "/avatars/sarah.jpg"
          }
        },
        {
          id: "3",
          type: "status_change", 
          message: "Investigation team assigned to case",
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          author: {
            name: "Officer Mike",
            role: "Lead Investigator",
            avatar: "/avatars/mike.jpg"
          }
        },
        {
          id: "4",
          type: "verification",
          message: "2 sightings verified by community",
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          author: {
            name: "Jane Doe",
            role: "Verifier",
            avatar: "/avatars/jane.jpg"
          }
        },
        {
          id: "5",
          type: "note",
          message: "Following up on promising leads in downtown area",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          author: {
            name: "Officer Mike",
            role: "Lead Investigator",
            avatar: "/avatars/mike.jpg"
          }
        }
      ],
      teamMembers: [
        {
          name: "Officer Mike",
          role: "Lead Investigator",
          avatar: "/avatars/mike.jpg"
        },
        {
          name: "Detective Sarah",
          role: "Case Analyst",
          avatar: "/avatars/sarah.jpg"
        },
        {
          name: "Community Watch",
          role: "Volunteer"
        }
      ],
      stats: {
        views: 234,
        shares: 18,
        sightings: 7,
        verifications: 12
      }
    };

    setTimeout(() => {
      setProgress(mockProgress);
      setLoading(false);
    }, 1000);
  }, [reportId]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // In real app, fetch latest progress
      console.log("Refreshing progress...");
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStageInfo = (stage: string) => {
    const stages = {
      "reported": { 
        color: "bg-blue-500", 
        label: "Reported", 
        description: "Initial report received and verified"
      },
      "investigating": { 
        color: "bg-yellow-500", 
        label: "Investigating", 
        description: "Team actively investigating the case"
      },
      "following_leads": { 
        color: "bg-orange-500", 
        label: "Following Leads", 
        description: "Promising leads being pursued"
      },
      "near_resolution": { 
        color: "bg-green-500", 
        label: "Near Resolution", 
        description: "Case close to resolution"
      },
      "resolved": { 
        color: "bg-green-600", 
        label: "Resolved", 
        description: "Case successfully resolved"
      }
    };
    
    return stages[stage as keyof typeof stages] || stages.reported;
  };

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case "status_change":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "sighting":
        return <Eye className="h-4 w-4 text-green-600" />;
      case "verification":
        return <Users className="h-4 w-4 text-purple-600" />;
      case "note":
        return <MessageSquare className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const formatEstimatedTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (hours < 24) return `~${hours} hours`;
    return `~${days} days`;
  };

  if (loading) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </Card>
    );
  }

  if (!progress) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Progress Data</h3>
          <p className="text-gray-600">Progress tracking not available for this report</p>
        </div>
      </Card>
    );
  }

  const stageInfo = getStageInfo(progress.currentStage);

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progress Tracking
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setAutoRefresh(!autoRefresh)}>
                <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              </Button>
              <Button size="sm" variant="outline">
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Stage */}
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${stageInfo.color}`} />
            <div>
              <h3 className="font-semibold">{stageInfo.label}</h3>
              <p className="text-sm text-gray-600">{stageInfo.description}</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span>{progress.percentage}%</span>
            </div>
            <Progress value={progress.percentage} className="h-3" />
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{progress.stats.views}</div>
              <div className="text-xs text-gray-600">Views</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{progress.stats.sightings}</div>
              <div className="text-xs text-gray-600">Sightings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{progress.stats.verifications}</div>
              <div className="text-xs text-gray-600">Verifications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{progress.stats.shares}</div>
              <div className="text-xs text-gray-600">Shares</div>
            </div>
          </div>
          
          {/* Timeline */}
          <div className="flex items-center gap-4 text-sm">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>Last updated: {formatTimeAgo(progress.lastUpdate)}</span>
            {progress.estimatedResolution && (
              <>
                <span>·</span>
                <span>Est. resolution: {formatEstimatedTime(progress.estimatedResolution)}</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {progress.teamMembers.map((member, index) => (
              <div key={index} className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback className="text-xs">
                    {member.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium">{member.name}</div>
                  <div className="text-xs text-gray-600">{member.role}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress Updates Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Progress Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {progress.updates.map((update, index) => (
              <div key={update.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    {getUpdateIcon(update.type)}
                  </div>
                  {index < progress.updates.length - 1 && (
                    <div className="w-0.5 h-16 bg-gray-200" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={update.author.avatar} />
                      <AvatarFallback className="text-xs">
                        {update.author.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{update.author.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {update.author.role}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(update.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{update.message}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
