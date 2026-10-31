
import "dotenv/config";
import http from "node:http";
import {
  buildGrid,
  evaluatePrice
} from "./grid-engine.js";

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";

const agentName = process.env.AGENT_NAME || "GridSentry";

const demoConfig = {
  lowerPrice: 500,
  upperPrice: 700,
  levels: 5,
  orderSize: 1
};

const agentCard = {
  name: agentName,
  description: "Grid Trading AI Agent for BNB Chain Testnet",
  version: "0.1.0",
  url: process.env.PUBLIC_AGENT_URL || `http://localhost:${PORT}`,
  capabilities: {
    streaming: false
  },
  skills: [
    {
      id: "grid-strategy-simulation",
      name: "Grid Strategy Simulation",
      description: "Simulates grid trading signals."
    }
  ],
  defaultInputModes: ["application/json"],
  defaultOutputModes: ["application/json"]
};

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json"
  });

  res.end(JSON.stringify(data, null, 2));
}

const server = http.createServer((req, res) => {
  const url = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  );

  if (req.method === "GET" && url.pathname === "/health") {
    return sendJson(res, 200, {
      status: "ok",
      agent: agentName,
      network: process.env.NETWORK || "bsc-testnet",
      chainId: Number(process.env.CHAIN_ID || 97),
      mode: "simulation",
      timestamp: new Date().toISOString()
    });
  }

  if (
    req.method === "GET" &&
    url.pathname === "/.well-known/agent-card.json"
  ) {
    return sendJson(res, 200, agentCard);
  }

  if (req.method === "GET" && url.pathname === "/grid") {
    return sendJson(res, 200, {
      mode: "simulation",
      executed: false,
      levels: buildGrid(demoConfig)
    });
  }

  if (req.method === "POST" && url.pathname === "/evaluate") {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const input = JSON.parse(body || "{}");

        const result = evaluatePrice(
          input.config || demoConfig,
          input.marketPrice,
          input.previousPrice ?? null
        );

        return sendJson(res, 200, result);
      } catch (error) {
        return sendJson(res, 400, {
          error: error.message
        });
      }
    });

    return;
  }

  return sendJson(res, 404, {
    error: "Endpoint not found"
  });
});

server.listen(PORT, HOST, () => {
  console.log(`${agentName} running on port ${PORT}`);
  console.log("SIMULATION MODE: no transactions executed.");
});
      
