#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  Tool,
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { TwilioCallService } from './services/twilio/call.service.js';
import twilio from 'twilio';

dotenv.config();

// Tool definitions
const TRIGGER_CALL_TOOL: Tool = {
  name: 'trigger-call',
  description: `
Trigger an outbound phone call via Twilio.

**Best for:** Making phone calls to any phone number with custom context.
**Usage Example:**
\`\`\`json
{
  "name": "trigger-call",
  "arguments": {
    "toNumber": "+1234567890",
    "callContext": "Hello, this is a test call from the MCP server."
  }
}
\`\`\`
**Returns:** Call SID and status information.
`,
  inputSchema: {
    type: 'object',
    properties: {
      toNumber: {
        type: 'string',
        description: 'The phone number to call (must be in E.164 format, e.g., +1234567890)',
      },
      callContext: {
        type: 'string',
        description: 'Context or message for the call',
      },
    },
    required: ['toNumber'],
  },
};

// Server implementation
const server = new Server(
  {
    name: 'voice-call-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize Twilio services
let twilioCallService: TwilioCallService;
let twilioCallbackUrl: string = '';

// Initialize Twilio client and services
function initializeTwilioServices() {
  const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  twilioCallService = new TwilioCallService(twilioClient);
}

// Setup ngrok tunnel for Twilio webhooks
async function setupNgrokTunnel(portNumber: number): Promise<string> {
  try {
    const { default: ngrok } = await import('@ngrok/ngrok');
    const listener = await ngrok.forward({
      addr: portNumber,
      authtoken_from_env: true
    });

    const url = listener.url();
    if (!url) {
      throw new Error('Failed to obtain ngrok URL');
    }

    return url;
  } catch (error) {
    console.error('Failed to setup ngrok tunnel:', error);
    throw error;
  }
}

// Tool handlers
server.setRequestHandler(
  ListToolsRequestSchema,
  async function listToolsRequestHandler() {
    return {
      tools: [TRIGGER_CALL_TOOL],
    };
  }
);

server.setRequestHandler(
  CallToolRequestSchema,
  async function callToolRequestHandler(request) {
    const startTime = Date.now();
    
    try {
      const { name, arguments: args } = request.params;

      // Log incoming request
      console.error(`[${new Date().toISOString()}] Received request for tool: ${name}`);

      if (!args) {
        throw new Error('No arguments provided');
      }

      switch (name) {
        case 'trigger-call': {
          const { toNumber, callContext = '' } = args as { toNumber: string; callContext?: string };

          if (!toNumber) {
            throw new Error('Phone number is required');
          }

          // Validate phone number format (basic E.164 check)
          if (!toNumber.startsWith('+') || toNumber.length < 10) {
            throw new Error('Phone number must be in E.164 format (e.g., +1234567890)');
          }

          try {
            // Initialize services if not already done
            if (!twilioCallService) {
              initializeTwilioServices();
            }

            // Setup ngrok tunnel if not already done
            if (!twilioCallbackUrl) {
              const portNumber = parseInt(process.env.PORT || '3004');
              twilioCallbackUrl = await setupNgrokTunnel(portNumber);
            }

            const callSid = await twilioCallService.makeCall(twilioCallbackUrl, toNumber, callContext);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    status: 'success',
                    message: 'Call triggered successfully',
                    callSid: callSid,
                    toNumber: toNumber,
                    callContext: callContext
                  }, null, 2)
                }
              ],
              isError: false,
            };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Call trigger error:', errorMessage);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    status: 'error',
                    message: `Failed to trigger call: ${errorMessage}`
                  }, null, 2)
                }
              ],
              isError: true,
            };
          }
        }

        default:
          return {
            content: [
              { type: 'text', text: `Unknown tool: ${name}` },
            ],
            isError: true,
          };
      }
    } catch (error) {
      console.error('Request failed:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    } finally {
      console.error(`Request completed in ${Date.now() - startTime}ms`);
    }
  }
);

// Server startup functions
async function runStdioServer() {
  try {
    console.error('Initializing Voice Call MCP Server...');

    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('Voice Call MCP Server running on stdio');
  } catch (error) {
    console.error('Fatal error running server:', error);
    process.exit(1);
  }
}

async function runSSEServer() {
  const app = express();

  app.get('/sse', async (req, res) => {
    const transport = new SSEServerTransport(`/messages`, res);
    res.on('close', () => {
      // Handle connection close
    });
    await server.connect(transport);
  });

  app.post('/messages', (req, res) => {
    // Handle SSE messages
  });

  const PORT = process.env.PORT || 3000;
  console.log('Starting SSE server on port', PORT);
  
  try {
    app.listen(PORT, () => {
      console.log(`MCP SSE Server listening on http://localhost:${PORT}`);
      console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
      console.log(`Message endpoint: http://localhost:${PORT}/messages`);
    });
  } catch (error) {
    console.error('Error starting SSE server:', error);
  }
}

// Main execution
if (process.env.SSE_LOCAL === 'true') {
  runSSEServer().catch((error: any) => {
    console.error('Fatal error running SSE server:', error);
    process.exit(1);
  });
} else {
  // Default to stdio transport (for Cursor and Claude Desktop)
  runStdioServer().catch((error: any) => {
    console.error('Fatal error running stdio server:', error);
    process.exit(1);
  });
} 