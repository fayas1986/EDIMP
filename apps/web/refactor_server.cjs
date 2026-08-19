const fs = require('fs');

const code = fs.readFileSync('server.ts', 'utf8');
const lines = code.split('\n');

let isAppRoute = false;
let isIoRoute = false;

let coreLines = [];
let routeLines = [];
let gatewayLines = [];

// A quick and dirty state machine to extract top-level app.* and io.* blocks
let braceDepth = 0;
let currentBlock = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Count braces
  const openBraces = (line.match(/\{/g) || []).length;
  const closeBraces = (line.match(/\}/g) || []).length;
  
  if (braceDepth === 0) {
    if (line.match(/^app\.(get|post|put|delete)\(/)) {
      isAppRoute = true;
    } else if (line.match(/^io\.on\(/)) {
      isIoRoute = true;
    }
  }
  
  currentBlock.push(line);
  braceDepth += openBraces - closeBraces;
  
  if (braceDepth === 0 && currentBlock.length > 0) {
    if (isAppRoute) {
      routeLines.push(...currentBlock);
    } else if (isIoRoute) {
      gatewayLines.push(...currentBlock);
    } else {
      coreLines.push(...currentBlock);
    }
    
    currentBlock = [];
    isAppRoute = false;
    isIoRoute = false;
  }
}

if (currentBlock.length > 0) {
  coreLines.push(...currentBlock);
}

if (!fs.existsSync('src-server')) {
  fs.mkdirSync('src-server');
  fs.mkdirSync('src-server/routes');
  fs.mkdirSync('src-server/gateways');
}

fs.writeFileSync('src-server/routes/api.routes.ts', `import { Express } from 'express';\n\nexport function registerRoutes(app: Express) {\n${routeLines.join('\n')}\n}\n`);
fs.writeFileSync('src-server/gateways/app.gateway.ts', `import { Server as SocketIOServer } from 'socket.io';\n\nexport function registerGateways(io: SocketIOServer) {\n${gatewayLines.join('\n')}\n}\n`);
fs.writeFileSync('src-server/index.ts', coreLines.join('\n'));

console.log('Extraction complete. Check src-server/');
