"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MapPin, 
  Clock, 
  User, 
  Car, 
  AlertTriangle,
  Eye,
  MessageSquare,
  Share2,
  TrendingUp,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Image as ImageIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from '@/lib/supabase/client';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { Trash2 } from 'lucide-react';
import { createClient as createServerClient } from '@/lib/supabase/server';

interface Report {
  id: string;
  subject: string;
  description: string | undefined;
  report_type: string;
  last_seen_location: string;
  last_seen_at: string;
  created_at: string;
  status: string;
  sighting_count: number;
  reporter_id?: string;
  reporter?: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  blockchain_tx_hash?: string;
  stored_on_chain?: boolean;
  progress?: {
    stage: string;
    percentage: number;
    last_update: string;
  };
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    type: string;
  }>;
}

interface RealTimeReportsFeedProps {
  initialReports: Report[];
  userLocation?: { lat: number; lng: number };
  currentUserId?: string | null;
}

export function RealTimeReportsFeed({ initialReports = [], userLocation, currentUserId }: RealTimeReportsFeedProps) {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>(initialReports || []);
  const [filteredReports, setFilteredReports] = useState<Report[]>(initialReports || []);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const supabase = createClient();

  // Real-time subscription to reports
  useEffect(() => {
    console.log('Setting up real-time subscription...');
    
    const channel = supabase
      .channel('reports')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'reports',
          filter: 'status=eq.active'
        }, 
        (payload) => {
          console.log('Real-time update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            console.log('New report inserted:', payload.new);
            // New report added
            setReports(prev => [payload.new as Report, ...prev]);
            setLastRefresh(new Date());
          } else if (payload.eventType === 'UPDATE') {
            console.log('Report updated:', payload.new);
            // Report updated
            setReports(prev => 
              prev.map(report => 
                report.id === payload.new.id ? payload.new as Report : report
              )
            );
            setLastRefresh(new Date());
          } else if (payload.eventType === 'DELETE') {
            console.log('Report deleted:', payload.old);
            // Report removed
            setReports(prev => prev.filter(report => report.id !== payload.old.id));
            setLastRefresh(new Date());
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up subscription...');
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-refresh on component mount
  useEffect(() => {
    console.log('Component mounted, triggering initial refresh...');
    refreshReports();
  }, []);

  // Manual refresh function
  const handleDeleteReport = async (report: Report) => {
    setReportToDelete(report);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!reportToDelete) return;
    
    console.log('Starting delete confirmation for report:', reportToDelete);
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      const response = await fetch(`/api/reports/${reportToDelete.id}/delete`, {
        method: 'DELETE',
      });
      
      console.log('Delete response status:', response.status);
      
      if (response.ok) {
        // Remove report from local state
        setReports(prev => prev.filter(r => r.id !== reportToDelete.id));
        setFilteredReports(prev => prev.filter(r => r.id !== reportToDelete.id));
        setDeleteDialogOpen(false);
        setReportToDelete(null);
        console.log('Report deleted successfully from UI');
      } else {
        const errorData = await response.json();
        console.error('Delete failed:', errorData);
        setDeleteError(errorData.error || 'Failed to delete report');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setDeleteError(`An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setReportToDelete(null);
    setDeleteError(null);
  };

  const canDeleteReport = (report: Report) => {
    return currentUserId && (report.reporter?.id === currentUserId || report.reporter_id === currentUserId);
  };

  const refreshReports = async () => {
    console.log('Manual refresh triggered...');
    setLoading(true);
    try {
      // First, check if there are any attachments at all
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('report_attachments')
        .select('*')
        .limit(5);
      
      console.log('Direct attachments query:', { attachmentsData, attachmentsError });

      const { data: reportsData, error } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:profiles!reporter_id(id, full_name, avatar_url),
          attachments:report_attachments(*),
          sightings(count)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20);

      console.log('Refresh data:', { reportsData, error });
      
      // Debug: Check first report's attachments
      if (reportsData && reportsData.length > 0) {
        console.log('First report attachments:', reportsData[0].attachments);
        console.log('First report attachments type:', typeof reportsData[0].attachments);
        console.log('First report attachments length:', reportsData[0].attachments?.length);
        console.log('First report full data:', reportsData[0]);
        
        // Check if any report has attachments
        const reportsWithAttachments = reportsData.filter(r => r.attachments && r.attachments.length > 0);
        console.log('Reports with attachments count:', reportsWithAttachments.length);
        if (reportsWithAttachments.length > 0) {
          console.log('Sample report with attachments:', reportsWithAttachments[0]);
        }
      }

      if (!error && reportsData) {
        const reportsWithCounts = reportsData.map((report: any) => ({
          ...report,
          sighting_count: report.sightings?.[0]?.count || 0,
          // Add mock progress data
          progress: {
            stage: Math.random() > 0.5 ? "investigating" : "following_leads",
            percentage: Math.floor(Math.random() * 80) + 20,
            last_update: report.created_at
          }
        }));
        
        console.log('Setting reports:', reportsWithCounts);
        setReports(reportsWithCounts);
        setLastRefresh(new Date());
      } else {
        console.error('Error fetching reports:', error);
      }
    } catch (error) {
      console.error('Error refreshing reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and sorting
  useEffect(() => {
    let filtered = reports;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.last_seen_location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter(report => report.report_type === filterType);
    }

    // Apply sorting
    switch (sortBy) {
      case "recent":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "urgent":
        filtered.sort((a, b) => {
          const urgency = { missing_child: 3, general_incident: 2, missing_item: 1 };
          return (urgency[b.report_type as keyof typeof urgency] || 0) - (urgency[a.report_type as keyof typeof urgency] || 0);
        });
        break;
      case "activity":
        filtered.sort((a, b) => b.sighting_count - a.sighting_count);
        break;
      case "location":
        if (userLocation) {
          // Sort by distance (simplified - would need real geolocation)
          filtered.sort((a, b) => {
            const aDistance = Math.random(); // Replace with real distance calculation
            const bDistance = Math.random();
            return aDistance - bDistance;
          });
        }
        break;
    }

    setFilteredReports(filtered);
  }, [reports, searchTerm, filterType, sortBy, userLocation]);

  const getReportIcon = (type: string) => {
    switch (type) {
      case "missing_child":
        return <User className="h-4 w-4 text-red-600" />;
      case "missing_item":
        return <Car className="h-4 w-4 text-blue-600" />;
      case "general_incident":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-red-100 text-red-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "investigating":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProgressStage = (progress?: any) => {
    if (!progress) return null;
    
    const stages = {
      "reported": { color: "bg-blue-500", label: "Reported" },
      "investigating": { color: "bg-yellow-500", label: "Investigating" },
      "following_leads": { color: "bg-orange-500", label: "Following Leads" },
      "near_resolution": { color: "bg-green-500", label: "Near Resolution" },
      "resolved": { color: "bg-green-600", label: "Resolved" }
    };
    
    return stages[progress.stage as keyof typeof stages] || stages.reported;
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return "just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const calculateDistance = (report: Report): string => {
    // Simplified distance calculation - replace with real geolocation
    if (!userLocation) return "";
    const distance = Math.random() * 10; // Random distance for demo
    return `${distance.toFixed(1)} km`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Live Reports ({filteredReports?.length || 0})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Updated {formatTimeAgo(lastRefresh.toISOString())}
              </Badge>
              <Button size="sm" variant="outline" onClick={refreshReports} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="missing_child">Missing Person</SelectItem>
                <SelectItem value="missing_item">Missing Item</SelectItem>
                <SelectItem value="general_incident">General Incident</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <TrendingUp className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="urgent">Most Urgent</SelectItem>
                <SelectItem value="activity">Most Activity</SelectItem>
                <SelectItem value="location">Nearest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* New Report Notification */}
      {(reports?.length || 0) > (initialReports?.length || 0) && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-800 font-medium">
                {(reports?.length || 0) - (initialReports?.length || 0)} new report{(reports?.length || 0) - (initialReports?.length || 0) > 1 ? 's' : ''} added
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports?.map((report) => {
          const progressStage = getProgressStage(report.progress);
          const distance = calculateDistance(report);
          
          // Debug: Log report data
          console.log('Report data:', {
            id: report.id,
            subject: report.subject,
            hasAttachments: !!report.attachments,
            attachmentsCount: report.attachments?.length || 0,
            attachments: report.attachments
          });
          
          return (
            <Card key={report.id} className="hover:shadow-lg transition-shadow overflow-hidden">
              {/* Full width hero image for report */}
              <div className="relative aspect-video w-full bg-muted overflow-hidden">
                {(report.attachments && report.attachments.length > 0) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={report.attachments[0]?.url}
                    alt={report.subject || 'Report image'}
                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                    onError={(e) => {
                      console.error('Image failed to load:', report.attachments[0]?.url, e);
                      // Fallback to placeholder on error
                      const target = e.target as HTMLImageElement;
                      target.src = `https://picsum.photos/seed/${report.report_type}-${report.id}/600/400.jpg`;
                      target.style.opacity = '0.8';
                    }}
                    onLoad={(e) => {
                      console.log('Image loaded successfully:', report.attachments[0]?.url);
                    }}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://picsum.photos/seed/${report.report_type}-${report.id}/600/400.jpg`}
                    alt={`${report.report_type} placeholder`}
                    className="w-full h-full object-cover opacity-80 transition-transform hover:scale-105 duration-300"
                  />
                )}
              </div>
              <CardHeader className="pb-3 pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getReportIcon(report.report_type)}
                    <Badge variant="outline" className={getStatusColor(report.status)}>
                      {report.status}
                    </Badge>
                    {report.stored_on_chain && (
                      <Badge variant="outline" className="bg-purple-50">
                        Blockchain
                      </Badge>
                    )}
                  </div>
                  {distance && (
                    <Badge variant="outline" className="text-xs">
                      {distance}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg line-clamp-2">
                  {report.subject}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progress Tracking */}
                {report.progress && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Progress</span>
                      <span>{report.progress.percentage}%</span>
                    </div>
                    <Progress value={report.progress.percentage} className="h-2" />
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${progressStage?.color}`} />
                      <span className="text-xs text-gray-600">{progressStage?.label}</span>
                      <span className="text-xs text-gray-400">
                        Updated {formatTimeAgo(report.progress.last_update)}
                      </span>
                    </div>
                  </div>
                )}
                

                
                {/* Report Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{report.last_seen_location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{formatTimeAgo(report.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {report.description}
                  </p>
                </div>
                
                {/* Activity Stats */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{report.sighting_count || 0} sighting{report.sighting_count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={report.reporter?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {report.reporter?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link href={`/reports/${report.id}`}>
                      View Details
                    </Link>
                  </Button>
                  
                  {/* Delete Button - Only show for report creator */}
                  {canDeleteReport(report) && (
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDeleteReport(report)}
                      className="w-9 h-9 p-0 bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700 shadow-red-200 hover:shadow-red-300 transition-all duration-200 hover:scale-105"
                      title="Delete Report (Dangerous Action)"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      const url = `${window.location.origin}/reports/${report.id}`;
                      const typeLabel = report.report_type === 'missing_child' ? '🚨 MISSING PERSON' : report.report_type === 'missing_item' ? '⚠️ MISSING ITEM' : '📢 ALERT';
                      const text = encodeURIComponent(`${typeLabel}: ${report.subject}\n\n${report.description?.slice(0, 150) || ''}\n\nPlease share!\n${url}`);
                      window.open(`https://wa.me/?text=${text}`, '_blank');
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {filteredReports.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Eye className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Found</h3>
            <p className="text-gray-600 text-center">
              {searchTerm || filterType !== "all" 
                ? "Try adjusting your filters or search terms"
                : "Be the first to report something in your community"
              }
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        title={reportToDelete?.subject || 'Report'}
        description={`Are you sure you want to delete "${reportToDelete?.subject || 'this report'}"? This action cannot be undone and will also delete all related sightings.`}
        isDeleting={isDeleting}
        error={deleteError}
      />
    </div>
  );
}
