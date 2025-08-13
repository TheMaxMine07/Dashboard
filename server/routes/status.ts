import { RequestHandler } from "express";

interface ServerStatusResponse {
  servers: Array<{
    name: string;
    status: "online" | "offline" | "maintenance";
    uptime: string;
    lastChecked: string;
    responseTime?: number;
    cpuUsage?: number;
    memoryUsage?: number;
  }>;
  systemInfo: {
    totalServers: number;
    onlineServers: number;
    offlineServers: number;
    lastUpdate: string;
  };
}

export const getServerStatus: RequestHandler = (req, res) => {
  // Simulate server status checks
  const servers = [
    {
      name: "Main Server",
      status: "online" as const,
      uptime: "99.9%",
      lastChecked: new Date().toISOString(),
      responseTime: Math.floor(Math.random() * 50) + 10, // 10-60ms
      cpuUsage: Math.floor(Math.random() * 30) + 20, // 20-50%
      memoryUsage: Math.floor(Math.random() * 40) + 30, // 30-70%
    },
    {
      name: "Database Server",
      status: "online" as const,
      uptime: "99.7%",
      lastChecked: new Date().toISOString(),
      responseTime: Math.floor(Math.random() * 30) + 15, // 15-45ms
      cpuUsage: Math.floor(Math.random() * 25) + 15, // 15-40%
      memoryUsage: Math.floor(Math.random() * 35) + 40, // 40-75%
    },
    {
      name: "API Gateway",
      status: "online" as const,
      uptime: "99.8%",
      lastChecked: new Date().toISOString(),
      responseTime: Math.floor(Math.random() * 40) + 20, // 20-60ms
      cpuUsage: Math.floor(Math.random() * 20) + 10, // 10-30%
      memoryUsage: Math.floor(Math.random() * 30) + 25, // 25-55%
    },
  ];

  const onlineServers = servers.filter(
    (server) => server.status === "online",
  ).length;
  const offlineServers = servers.filter(
    (server) => server.status === "offline",
  ).length;

  const response: ServerStatusResponse = {
    servers,
    systemInfo: {
      totalServers: servers.length,
      onlineServers,
      offlineServers,
      lastUpdate: new Date().toISOString(),
    },
  };

  res.json(response);
};

export const pingServer: RequestHandler = (req, res) => {
  const { serverName } = req.params;

  // Simulate server ping
  const pingTime = Math.floor(Math.random() * 100) + 10; // 10-110ms
  const isOnline = Math.random() > 0.05; // 95% chance of being online

  res.json({
    serverName,
    status: isOnline ? "online" : "offline",
    responseTime: isOnline ? pingTime : null,
    timestamp: new Date().toISOString(),
  });
};
