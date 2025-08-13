import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Server,
  Activity,
  Globe,
  Shield,
  Database,
  BarChart3,
  Users,
  Settings,
  ExternalLink,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock
} from "lucide-react";

interface ServerStatus {
  name: string;
  status: "online" | "offline" | "maintenance";
  uptime: string;
  lastChecked: string;
  responseTime?: number;
  cpuUsage?: number;
  memoryUsage?: number;
}

interface Dashboard {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  status: "online" | "offline";
  category: string;
}

interface SystemInfo {
  totalServers: number;
  onlineServers: number;
  offlineServers: number;
  lastUpdate: string;
}

export default function Index() {
  const [serverStatuses, setServerStatuses] = useState<ServerStatus[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const [dashboards] = useState<Dashboard[]>([
    {
      id: "analytics",
      title: "Analytics Dashboard",
      description: "View website traffic, user behavior, and performance metrics",
      url: "https://analytics.example.com",
      icon: <BarChart3 className="h-6 w-6" />,
      status: "online",
      category: "Analytics"
    },
    {
      id: "user-management",
      title: "User Management",
      description: "Manage users, roles, and permissions across all systems",
      url: "https://users.example.com",
      icon: <Users className="h-6 w-6" />,
      status: "online",
      category: "Management"
    },
    {
      id: "server-monitor",
      title: "Server Monitoring",
      description: "Real-time server performance and health monitoring",
      url: "https://monitoring.example.com",
      icon: <Activity className="h-6 w-6" />,
      status: "online",
      category: "Infrastructure"
    },
    {
      id: "security",
      title: "Security Center",
      description: "Security logs, threat detection, and vulnerability scanning",
      url: "https://security.example.com",
      icon: <Shield className="h-6 w-6" />,
      status: "online",
      category: "Security"
    },
    {
      id: "database",
      title: "Database Admin",
      description: "Database management, queries, and performance optimization",
      url: "https://db.example.com",
      icon: <Database className="h-6 w-6" />,
      status: "online",
      category: "Infrastructure"
    },
    {
      id: "settings",
      title: "System Settings",
      description: "Configure system-wide settings and preferences",
      url: "https://settings.example.com",
      icon: <Settings className="h-6 w-6" />,
      status: "online",
      category: "Management"
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-online";
      case "offline":
        return "text-offline";
      case "maintenance":
        return "text-warning";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "online":
        return "default";
      case "offline":
        return "destructive";
      case "maintenance":
        return "secondary";
      default:
        return "outline";
    }
  };

  const fetchServerStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Versuche zuerst Proxmox API
      try {
        const proxmoxResponse = await fetch("/api/proxmox/status");
        if (proxmoxResponse.ok) {
          const data = await proxmoxResponse.json();
          if (data.servers && data.servers.length > 0) {
            setServerStatuses(data.servers);
            setSystemInfo(data.systemInfo);
            setLastRefresh(new Date());
            return;
          }
        }
      } catch (proxmoxError) {
        console.log("Proxmox API not available, trying fallback...");
      }

      // Fallback zu simulierten Daten via API
      try {
        const fallbackResponse = await fetch("/api/status");
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          setServerStatuses(data.servers);
          setSystemInfo(data.systemInfo);
          setLastRefresh(new Date());
          return;
        }
      } catch (fallbackError) {
        console.log("Fallback API also failed, using hardcoded demo data");
      }

      // Final fallback: Hardcoded demo data
      const demoData = {
        servers: [
          {
            name: "TMMNets-Server-01",
            status: "online" as const,
            uptime: "99.9%",
            lastChecked: new Date().toISOString(),
            responseTime: 15
          },
          {
            name: "TMMNets-Server-02",
            status: "online" as const,
            uptime: "99.7%",
            lastChecked: new Date().toISOString(),
            responseTime: 23
          },
          {
            name: "TMMNets-Server-03",
            status: "online" as const,
            uptime: "99.8%",
            lastChecked: new Date().toISOString(),
            responseTime: 18
          }
        ],
        systemInfo: {
          totalServers: 3,
          onlineServers: 3,
          offlineServers: 0,
          lastUpdate: new Date().toISOString()
        }
      };

      setServerStatuses(demoData.servers);
      setSystemInfo(demoData.systemInfo);
      setLastRefresh(new Date());

    } catch (error) {
      console.error("Error fetching server status:", error);
      setError("Failed to fetch server status. Using demo data.");

      // Even if there's an error, show demo data
      const demoData = {
        servers: [
          {
            name: "TMMNets-Demo-01",
            status: "online" as const,
            uptime: "Demo",
            lastChecked: new Date().toISOString(),
            responseTime: 10
          }
        ],
        systemInfo: {
          totalServers: 1,
          onlineServers: 1,
          offlineServers: 0,
          lastUpdate: new Date().toISOString()
        }
      };

      setServerStatuses(demoData.servers);
      setSystemInfo(demoData.systemInfo);
      setLastRefresh(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastChecked = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  };

  useEffect(() => {
    fetchServerStatus();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const groupedDashboards = dashboards.reduce((acc, dashboard) => {
    if (!acc[dashboard.category]) {
      acc[dashboard.category] = [];
    }
    acc[dashboard.category].push(dashboard);
    return acc;
  }, {} as Record<string, Dashboard[]>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Server className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">TMMNets Home Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {systemInfo && (
                <div className="hidden md:flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">Nodes:</span>
                    <span className="text-success font-medium">{systemInfo.onlineServers}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-foreground">{systemInfo.totalServers}</span>
                  </div>
                  {(systemInfo as any).clusterHost && (
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">Cluster:</span>
                      <span className="text-foreground font-mono text-xs">{(systemInfo as any).clusterHost}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {formatLastChecked(lastRefresh.toISOString())}
                    </span>
                  </div>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchServerStatus}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-online rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground">
                  {(systemInfo as any)?.clusterHost ? 'Proxmox Connected' : 'Demo Mode'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Server Status Section */}
        <section className="mb-8">
          <div className="flex items-center space-x-2 mb-6">
            <Activity className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Server Status</h2>
          </div>
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}
          {!(systemInfo as any)?.clusterHost && !error && (
            <div className="mb-4 p-4 bg-info/10 border border-info/20 rounded-lg">
              <p className="text-info text-sm">
                <strong>Demo Mode:</strong> Configure Proxmox environment variables to see real server data.
                Add PROXMOX_CLUSTER_HOST, PROXMOX_USER, and PROXMOX_PASSWORD to your .env file.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isLoading && serverStatuses.length === 0 ? (
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="border-border">
                  <CardHeader className="pb-3">
                    <div className="h-5 bg-muted rounded animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded animate-pulse"></div>
                      <div className="h-4 bg-muted rounded animate-pulse"></div>
                      <div className="h-4 bg-muted rounded animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              serverStatuses.map((server, index) => (
              <Card key={index} className="border-border hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="text-foreground">{server.name}</span>
                    <div className="flex items-center space-x-2">
                      {server.status === "online" ? (
                        <Wifi className={`h-4 w-4 ${getStatusColor(server.status)}`} />
                      ) : (
                        <WifiOff className={`h-4 w-4 ${getStatusColor(server.status)}`} />
                      )}
                      <Badge variant={getStatusBadgeVariant(server.status)}>
                        {server.status}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Uptime:</span>
                      <span className="font-medium text-success">{server.uptime}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Checked:</span>
                      <span className="text-foreground">
                        {formatLastChecked(server.lastChecked)}
                      </span>
                    </div>
                    {server.responseTime && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Response Time:</span>
                        <span className="text-foreground">{server.responseTime}ms</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              ))
            )}
          </div>
        </section>

        {/* Dashboards Section */}
        <section>
          <div className="flex items-center space-x-2 mb-6">
            <Globe className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Admin Dashboards</h2>
          </div>
          
          {Object.entries(groupedDashboards).map(([category, dashboards]) => (
            <div key={category} className="mb-8">
              <h3 className="text-lg font-medium text-foreground mb-4">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboards.map((dashboard) => (
                  <Card key={dashboard.id} className="border-border hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            {dashboard.icon}
                          </div>
                          <span className="text-foreground">{dashboard.title}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className={`h-2 w-2 rounded-full ${
                            dashboard.status === "online" ? "bg-online" : "bg-offline"
                          }`}></div>
                        </div>
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {dashboard.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        className="w-full" 
                        onClick={() => window.open(dashboard.url, '_blank')}
                        disabled={dashboard.status === "offline"}
                      >
                        <span>Open Dashboard</span>
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
