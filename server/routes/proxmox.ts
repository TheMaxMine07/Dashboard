import { RequestHandler } from "express";
import https from "https";

interface ProxmoxConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  realm: string;
}

interface ProxmoxTicket {
  ticket: string;
  CSRFPreventionToken: string;
}

interface ProxmoxNode {
  node: string;
  status: string;
  uptime: number;
  cpu: number;
  mem: number;
  maxmem: number;
  disk: number;
  maxdisk: number;
}

class ProxmoxAPI {
  private config: ProxmoxConfig;
  private ticket: string | null = null;
  private csrfToken: string | null = null;

  constructor(config: ProxmoxConfig) {
    this.config = config;
  }

  // Proxmox API Request Helper
  private async makeRequest(method: string, path: string, data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.config.host,
        port: this.config.port,
        path: path,
        method: method,
        rejectUnauthorized: false, // Für selbstsignierte Zertifikate
        headers: {
          'Content-Type': 'application/json',
          ...(this.ticket && { 'Cookie': `PVEAuthCookie=${this.ticket}` }),
          ...(this.csrfToken && { 'CSRFPreventionToken': this.csrfToken })
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            resolve(parsed);
          } catch (error) {
            reject(new Error(`JSON Parse Error: ${error}`));
          }
        });
      });

      req.on('error', reject);
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  // Authentifizierung bei Proxmox
  async authenticate(): Promise<void> {
    try {
      const authData = {
        username: `${this.config.username}@${this.config.realm}`,
        password: this.config.password
      };

      const response = await this.makeRequest('POST', '/api2/json/access/ticket', authData);
      
      if (response.data) {
        this.ticket = response.data.ticket;
        this.csrfToken = response.data.CSRFPreventionToken;
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      throw new Error(`Proxmox authentication failed: ${error}`);
    }
  }

  // Alle Nodes abrufen
  async getNodes(): Promise<ProxmoxNode[]> {
    try {
      if (!this.ticket) await this.authenticate();
      
      const response = await this.makeRequest('GET', '/api2/json/nodes');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching Proxmox nodes:', error);
      throw error;
    }
  }

  // Node-Status abrufen
  async getNodeStatus(nodeName: string): Promise<any> {
    try {
      if (!this.ticket) await this.authenticate();
      
      const response = await this.makeRequest('GET', `/api2/json/nodes/${nodeName}/status`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching status for node ${nodeName}:`, error);
      throw error;
    }
  }

  // VMs für einen Node abrufen
  async getVMs(nodeName: string): Promise<any[]> {
    try {
      if (!this.ticket) await this.authenticate();
      
      const response = await this.makeRequest('GET', `/api2/json/nodes/${nodeName}/qemu`);
      return response.data || [];
    } catch (error) {
      console.error(`Error fetching VMs for node ${nodeName}:`, error);
      return [];
    }
  }
}

// Proxmox-Konfigurationen für deine Server
const proxmoxServers: ProxmoxConfig[] = [
  {
    host: process.env.PROXMOX_HOST_1 || 'proxmox1.example.com',
    port: parseInt(process.env.PROXMOX_PORT || '8006'),
    username: process.env.PROXMOX_USER || 'root',
    password: process.env.PROXMOX_PASSWORD || 'password',
    realm: process.env.PROXMOX_REALM || 'pam'
  },
  // Weitere Proxmox-Server hier hinzufügen
  // {
  //   host: 'proxmox2.example.com',
  //   port: 8006,
  //   username: 'root',
  //   password: 'password',
  //   realm: 'pam'
  // }
];

// API Endpoint für Server-Status via Proxmox
export const getProxmoxStatus: RequestHandler = async (req, res) => {
  try {
    const servers = [];
    let totalOnline = 0;

    for (const [index, config] of proxmoxServers.entries()) {
      const api = new ProxmoxAPI(config);
      
      try {
        // Nodes von diesem Proxmox-Server abrufen
        const nodes = await api.getNodes();
        
        for (const node of nodes) {
          const status = node.status === 'online' ? 'online' : 'offline';
          if (status === 'online') totalOnline++;

          // CPU und Memory Usage berechnen
          const cpuUsage = Math.round(node.cpu * 100);
          const memoryUsage = Math.round((node.mem / node.maxmem) * 100);

          servers.push({
            name: `${config.host} - ${node.node}`,
            status: status,
            uptime: `${Math.round(node.uptime / 86400)}d`,
            lastChecked: new Date().toISOString(),
            responseTime: Math.floor(Math.random() * 50) + 10, // Kann durch echte Ping-Zeit ersetzt werden
            cpuUsage: cpuUsage,
            memoryUsage: memoryUsage,
            diskUsage: Math.round((node.disk / node.maxdisk) * 100)
          });
        }
      } catch (error) {
        // Falls ein Proxmox-Server nicht erreichbar ist
        servers.push({
          name: `${config.host} - Unreachable`,
          status: 'offline' as const,
          uptime: '0%',
          lastChecked: new Date().toISOString(),
          responseTime: null,
          error: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    const response = {
      servers,
      systemInfo: {
        totalServers: servers.length,
        onlineServers: totalOnline,
        offlineServers: servers.length - totalOnline,
        lastUpdate: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getProxmoxStatus:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Proxmox status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Einzelnen Proxmox-Node pingen
export const pingProxmoxNode: RequestHandler = async (req, res) => {
  const { serverName } = req.params;
  
  try {
    // Finde den entsprechenden Server
    const config = proxmoxServers.find(s => s.host === serverName);
    if (!config) {
      return res.status(404).json({ error: 'Server not found' });
    }

    const api = new ProxmoxAPI(config);
    const start = Date.now();
    
    await api.getNodes();
    const responseTime = Date.now() - start;

    res.json({
      serverName,
      status: 'online',
      responseTime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      serverName,
      status: 'offline',
      responseTime: null,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
