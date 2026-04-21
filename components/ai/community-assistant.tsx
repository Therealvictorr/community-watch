"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  Send, 
  AlertTriangle, 
  MapPin, 
  Clock,
  TrendingUp,
  Eye,
  Sparkles
} from "lucide-react";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface CommunityAssistantProps {
  reports?: any[];
  userLocation?: { lat: number; lng: number };
}

export function CommunityAssistant({ reports = [], userLocation }: CommunityAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content: "Hi! I'm your Community Watch AI assistant powered by Groq. I can analyze reports, identify patterns, and provide safety insights from live data. What would you like to know?",
      timestamp: new Date(),
      suggestions: [
        "Show recent missing person reports",
        "What are the hotspots in my area?",
        "How many reports are active?",
        "Summarize all current incidents"
      ]
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          reports: reports.map(r => ({
            id: r.id,
            subject: r.subject,
            report_type: r.report_type,
            status: r.status,
            description: r.description,
            last_seen_location: r.last_seen_location,
            created_at: r.created_at,
            sighting_count: r.sighting_count || 0,
          })),
        }),
      });

      const data = await res.json();

      const assistantResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: data.response || data.error || "Sorry, something went wrong.",
        timestamp: new Date(),
        suggestions: [
          "Show nearby reports",
          "Analyze safety trends",
          "Find missing person reports",
          "Get statistics"
        ]
      };

      setMessages(prev => [...prev, assistantResponse]);
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "Sorry, I couldn't reach the AI service. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => sendMessage(input);

  const handleSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const getQuickStats = () => {
    const recent = reports.filter(r => {
      const reportDate = new Date(r.created_at);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return reportDate > dayAgo;
    });

    return {
      total: reports.length,
      recent: recent.length,
      urgent: reports.filter(r => r.report_type === 'missing_child').length,
    };
  };

  const stats = getQuickStats();

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          Community AI Assistant
        </CardTitle>
        <div className="flex gap-2 text-xs">
          <Badge variant="outline" className="bg-blue-50">
            <Eye className="h-3 w-3 mr-1" />
            {stats.total} Active
          </Badge>
          <Badge variant="outline" className="bg-green-50">
            <TrendingUp className="h-3 w-3 mr-1" />
            {stats.recent} Today
          </Badge>
          <Badge variant="outline" className="bg-red-50">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {stats.urgent} Urgent
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === "user"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {message.type === "assistant" && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <Bot className="h-3.5 w-3.5 text-purple-600" />
                      <span className="text-xs font-medium text-purple-600">AI</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.suggestions && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {message.suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          size="sm"
                          variant="outline"
                          className="text-xs h-6"
                          onClick={() => handleSuggestion(suggestion)}
                          disabled={isLoading}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-purple-600 animate-pulse" />
                    <span className="text-sm text-gray-600">Analyzing reports...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollEndRef} />
          </div>
        </div>
        
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about reports, safety, or community insights..."
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={isLoading}
            />
            <Button size="icon" onClick={handleSend} disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="outline" onClick={() => handleSuggestion("Show recent reports")} disabled={isLoading}>
              <Clock className="h-3 w-3 mr-1" />
              Recent
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleSuggestion("What are the safety hotspots?")} disabled={isLoading}>
              <MapPin className="h-3 w-3 mr-1" />
              Hotspots
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleSuggestion("Show statistics")} disabled={isLoading}>
              <TrendingUp className="h-3 w-3 mr-1" />
              Stats
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
