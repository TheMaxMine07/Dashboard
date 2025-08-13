import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { getServerStatus, pingServer } from "./routes/status";
import { getProxmoxStatus, pingProxmoxNode } from "./routes/proxmox";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Server status monitoring routes
  app.get("/api/status", getServerStatus);
  app.get("/api/ping/:serverName", pingServer);

  // Proxmox API routes
  app.get("/api/proxmox/status", getProxmoxStatus);
  app.get("/api/proxmox/ping/:serverName", pingProxmoxNode);

  return app;
}
