"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MapPin, 
  Filter, 
  Layers, 
  ZoomIn, 
  ZoomOut,
  Navigation,
  AlertTriangle,
  User,
  Car,
  Eye,
  RefreshCw
} from "lucide-react";

interface Report {
  id: string;
  subject: string;
  report_type: string;
  last_seen_location: string;
  last_seen_at: string;
  status: string;
  sighting_count: number;
  latitude?: number;
  longitude?: number;
  related_reports?: string[]; // IDs of related reports for trajectory
}

interface InteractiveMapProps {
  reports: Report[];
  userLocation?: { lat: number; lng: number };
  onReportClick?: (report: Report) => void;
}

export function InteractiveMap({ reports, userLocation, onReportClick }: InteractiveMapProps) {
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 }); // Default to NYC
  const [zoom, setZoom] = useState(12);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);
  const [clusteringEnabled, setClusteringEnabled] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Mock coordinates for demonstration (in real app, these would come from geocoding)
  const mockCoordinates = reports.map((report, index) => ({
    ...report,
    latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
    longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
  }));

  const filteredReports = mockCoordinates.filter(report => {
    if (selectedFilter === "all") return true;
    return report.report_type === selectedFilter;
  });

  const getReportIcon = (type: string) => {
    switch (type) {
      case "missing_child":
        return { icon: User, color: "red", bgColor: "bg-red-100" };
      case "missing_item":
        return { icon: Car, color: "blue", bgColor: "bg-blue-100" };
      case "general_incident":
        return { icon: AlertTriangle, color: "yellow", bgColor: "bg-yellow-100" };
      default:
        return { icon: AlertTriangle, color: "gray", bgColor: "bg-gray-100" };
    }
  };

  const getHotspotAreas = () => {
    // Calculate hotspot areas based on report density
    const hotspots = [];
    const gridSize = 0.01; // Rough grid size for clustering
    
    for (let lat = 40.7; lat <= 40.8; lat += gridSize) {
      for (let lng = -74.05; lng <= -73.95; lng += gridSize) {
        const nearbyReports = filteredReports.filter(report => 
          report.latitude && report.longitude &&
          Math.abs(report.latitude - lat) < gridSize/2 &&
          Math.abs(report.longitude - lng) < gridSize/2
        );
        
        if (nearbyReports.length >= 3) {
          hotspots.push({
            center: { lat, lng },
            intensity: nearbyReports.length,
            reports: nearbyReports
          });
        }
      }
    }
    
    return hotspots.sort((a, b) => b.intensity - a.intensity).slice(0, 5);
  };

  const getTrajectoryLines = () => {
    // Group reports by subject to identify related reports
    const reportGroups: { [key: string]: Report[] } = {};
    
    filteredReports.forEach(report => {
      const key = report.subject.toLowerCase().replace(/\s+/g, '');
      if (!reportGroups[key]) {
        reportGroups[key] = [];
      }
      reportGroups[key].push(report);
    });
    
    // Sort each group by time and create trajectory lines
    const trajectoryLines = [];
    Object.values(reportGroups).forEach(group => {
      const sortedGroup = group.sort((a, b) => 
        new Date(a.last_seen_at).getTime() - new Date(b.last_seen_at).getTime()
      );
      
      // Create lines between consecutive reports
      for (let i = 0; i < sortedGroup.length - 1; i++) {
        const start = sortedGroup[i];
        const end = sortedGroup[i + 1];
        
        if (start.latitude && start.longitude && end.latitude && end.longitude) {
          trajectoryLines.push({
            start: { lat: start.latitude, lng: start.longitude },
            end: { lat: end.latitude, lng: end.longitude },
            reportType: start.report_type
          });
        }
      }
    });
    
    return trajectoryLines;
  };

  const hotspots = getHotspotAreas();
  const trajectoryLines = getTrajectoryLines();

  const handleReportClick = (report: Report) => {
    setSelectedReport(report);
    if (onReportClick) {
      onReportClick(report);
    }
  };

  const handleAddReport = () => {
    // Navigate to new report page
    window.location.href = '/reports/new';
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 1, 18));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 1, 1));
  };

  const centerOnUser = () => {
    if (userLocation) {
      setMapCenter(userLocation);
      setZoom(14);
    }
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

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Interactive Map
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50">
              {filteredReports.length} Reports
            </Badge>
            {hotspots.length > 0 && (
              <Badge variant="outline" className="bg-red-50">
                {hotspots.length} Hotspots
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Map Controls */}
        <div className="absolute top-4 left-4 z-10 space-y-2">
          <div className="bg-white rounded-lg shadow-md p-2 space-y-2">
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-[150px] h-8">
                <Filter className="h-3 w-3 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="missing_child">Missing Person</SelectItem>
                <SelectItem value="missing_item">Missing Item</SelectItem>
                <SelectItem value="general_incident">Incident</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={handleZoomIn}>
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleZoomOut}>
                <ZoomOut className="h-3 w-3" />
              </Button>
            </div>
            
            {userLocation && (
              <Button size="sm" variant="outline" onClick={centerOnUser}>
                <Navigation className="h-3 w-3" />
              </Button>
            )}
            
            <Button size="sm" variant="default" onClick={handleAddReport} className="bg-blue-600 hover:bg-blue-700">
              <MapPin className="h-3 w-3 mr-1" />
              Add Report
            </Button>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={heatmapEnabled}
                  onChange={(e) => setHeatmapEnabled(e.target.checked)}
                  className="rounded"
                />
                <Layers className="h-3 w-3" />
                Heatmap
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={clusteringEnabled}
                  onChange={(e) => setClusteringEnabled(e.target.checked)}
                  className="rounded"
                />
                <Eye className="h-3 w-3" />
                Clustering
              </label>
            </div>
          </div>
        </div>

        {/* Map Visualization (Mock) */}
        <div className="flex-1 relative bg-gray-100">
          {/* Map Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50">
            {/* Grid lines for map effect */}
            <div className="absolute inset-0 opacity-20">
              {[...Array(10)].map((_, i) => (
                <div key={`h-${i}`} className="absolute w-full border-b border-gray-300" style={{ top: `${i * 10}%` }} />
              ))}
              {[...Array(10)].map((_, i) => (
                <div key={`v-${i}`} className="absolute h-full border-r border-gray-300" style={{ left: `${i * 10}%` }} />
              ))}
            </div>
          </div>

          {/* User Location */}
          {userLocation && (
            <div 
              className="absolute w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg z-20"
              style={{
                left: `${((userLocation.lng - (-74.1)) / 0.2) * 100}%`,
                top: `${((40.8 - userLocation.lat) / 0.2) * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping" />
            </div>
          )}

          {/* Heatmap Overlay */}
          {heatmapEnabled && hotspots.map((hotspot, index) => (
            <div
              key={index}
              className="absolute rounded-full bg-red-500 opacity-30 z-10"
              style={{
                left: `${((hotspot.center.lng - (-74.1)) / 0.2) * 100}%`,
                top: `${((40.8 - hotspot.center.lat) / 0.2) * 100}%`,
                width: `${hotspot.intensity * 3}%`,
                height: `${hotspot.intensity * 3}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}

          {/* Trajectory Lines */}
          {trajectoryLines.map((line, index) => (
            <svg
              key={`trajectory-${index}`}
              className="absolute inset-0 pointer-events-none z-20"
              style={{
                left: `${((line.start.lng - (-74.1)) / 0.2) * 100}%`,
                top: `${((40.8 - line.start.lat) / 0.2) * 100}%`,
                width: `${((line.end.lng - line.start.lng) / 0.2) * 100}%`,
                height: `${((line.start.lat - line.end.lat) / 0.2) * 100}%`,
              }}
            >
              <line
                x1="0"
                y1="0"
                x2={`${((line.end.lng - line.start.lng) / 0.2) * 100}%`}
                y2={`${((line.start.lat - line.end.lat) / 0.2) * 100}%`}
                stroke={line.reportType === 'missing_child' ? '#dc2626' : line.reportType === 'missing_item' ? '#2563eb' : '#ca8a04'}
                strokeWidth="2"
                strokeDasharray="5,5"
                className="opacity-60"
              />
            </svg>
          ))}

          {/* Report Markers */}
          {filteredReports.map((report) => {
            const iconConfig = getReportIcon(report.report_type);
            if (!report.latitude || !report.longitude) return null;
            
            return (
              <div
                key={report.id}
                className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 z-30"
                style={{
                  left: `${((report.longitude - (-74.1)) / 0.2) * 100}%`,
                  top: `${((40.8 - report.lat) / 0.2) * 100}%`,
                }}
                onClick={() => handleReportClick(report)}
              >
                <div className={`w-6 h-6 ${iconConfig.bgColor} rounded-full border-2 border-white shadow-lg flex items-center justify-center`}>
                  <iconConfig.icon className={`h-3 w-3 text-${iconConfig.color}-600`} />
                </div>
                {report.sighting_count > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white text-xs text-white flex items-center justify-center">
                    {report.sighting_count}
                  </div>
                )}
              </div>
            );
          })}

          {/* Selected Report Details */}
          {selectedReport && (
            <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 z-40">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {(() => {
                      const iconConfig = getReportIcon(selectedReport.report_type);
                      return <iconConfig.icon className={`h-4 w-4 text-${iconConfig.color}-600`} />;
                    })()}
                    <h3 className="font-semibold">{selectedReport.subject}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{selectedReport.last_seen_location}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{formatTimeAgo(selectedReport.created_at)}</span>
                    <span>{selectedReport.sighting_count} sightings</span>
                  </div>
                </div>
                <Button size="sm" onClick={() => setSelectedReport(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Hotspot Labels */}
          {hotspots.map((hotspot, index) => (
            <div
              key={`hotspot-${index}`}
              className="absolute bg-red-600 text-white text-xs px-2 py-1 rounded-full z-25"
              style={{
                left: `${((hotspot.center.lng - (-74.1)) / 0.2) * 100}%`,
                top: `${((40.8 - hotspot.center.lat) / 0.2) * 100}%`,
                transform: 'translate(-50%, -100%)'
              }}
            >
              Hotspot ({hotspot.intensity})
            </div>
          ))}

          {/* Map Info */}
          <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-md p-2 text-xs">
            <div>Zoom: {zoom}</div>
            <div>Center: {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
