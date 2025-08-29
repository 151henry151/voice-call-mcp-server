# Voice Call MCP Server - Cursor Compatible Version

A Model Context Protocol (MCP) server that enables Cursor and other AI assistants to initiate and manage voice calls using Twilio and OpenAI (GPT-4o Realtime model).

This is a Cursor-compatible fork of the original voice-call-mcp-server, updated with the latest MCP SDK and multiple transport support.

## Key Improvements for Cursor Compatibility

- **Latest MCP SDK**: Updated to version 1.17.4
- **Multiple Transport Support**: stdio (default), SSE, and HTTP transports
- **Proper ES Modules**: Consistent module system throughout
- **Better Error Handling**: Enhanced error handling and logging
- **Simplified Architecture**: Streamlined for better compatibility

## Features

- Make outbound phone calls via Twilio 📞
- Process call audio in real-time with GPT-4o Realtime model 🎙️
- Real-time language switching during calls 🌐
- Pre-built prompts for common calling scenarios 🍽️
- Automatic public URL tunneling with ngrok 🔄
- Secure handling of credentials 🔒
- **Cursor and Claude Desktop compatible** 🖥️

## Requirements

- Node.js >= 18
- Twilio account with API credentials
- OpenAI API key
- Ngrok Authtoken

## Installation

1. Clone this repository
   ```bash
   git clone https://github.com/151henry151/voice-call-mcp-server.git
   cd voice-call-mcp-server
   ```

2. Install dependencies and build
   ```bash
   npm install
   npm run build
   ```

## Configuration

The server requires several environment variables:

- `TWILIO_ACCOUNT_SID`: Your Twilio account SID
- `TWILIO_AUTH_TOKEN`: Your Twilio auth token
- `TWILIO_NUMBER`: Your Twilio number
- `OPENAI_API_KEY`: Your OpenAI API key
- `NGROK_AUTHTOKEN`: Your ngrok authtoken
- `RECORD_CALLS`: Set to "true" to record calls (optional)

## Cursor Configuration

To use this server with Cursor, add the following to your Cursor settings:

1. Open Cursor Settings (Cmd/Ctrl + ,)
2. Go to "Extensions" → "MCP Servers"
3. Add a new server configuration:

```json
{
  "name": "voice-call",
  "command": "node",
  "args": ["/path/to/your/voice-call-mcp-server/dist/index.js"],
  "env": {
    "TWILIO_ACCOUNT_SID": "your_account_sid",
    "TWILIO_AUTH_TOKEN": "your_auth_token",
    "TWILIO_NUMBER": "your_e.164_format_number",
    "OPENAI_API_KEY": "your_openai_api_key",
    "NGROK_AUTHTOKEN": "your_ngrok_authtoken"
  }
}
```

Alternatively, you can configure it via the command line:

```bash
cursor --mcp-server voice-call=node:/path/to/your/voice-call-mcp-server/dist/index.js
```

## Claude Desktop Configuration

For Claude Desktop compatibility, add to your configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "voice-call": {
      "command": "node",
      "args": ["/path/to/your/voice-call-mcp-server/dist/index.js"],
      "env": {
        "TWILIO_ACCOUNT_SID": "your_account_sid",
        "TWILIO_AUTH_TOKEN": "your_auth_token",
        "TWILIO_NUMBER": "your_e.164_format_number",
        "OPENAI_API_KEY": "your_openai_api_key",
        "NGROK_AUTHTOKEN": "your_ngrok_authtoken"
      }
    }
  }
}
```

## Usage

### Transport Modes

The server supports multiple transport modes:

1. **stdio (default)**: For Cursor and Claude Desktop
   ```bash
   node dist/index.js
   ```

2. **SSE (Server-Sent Events)**: For web-based clients
   ```bash
   SSE_LOCAL=true node dist/index.js
   ```

3. **HTTP**: For custom integrations
   ```bash
   HTTP_STREAMABLE_SERVER=true node dist/index.js
   ```

### Example Interactions

Here are some natural ways to interact with the server:

1. Simple call:
```
Can you call +1-123-456-7890 and let them know I'll be 15 minutes late for our meeting?
```

2. Restaurant reservation:
```
Please call Delicious Restaurant at +1-123-456-7890 and make a reservation for 4 people tonight at 7:30 PM. Please speak in German.
```

3. Appointment scheduling:
```
Please call Expert Dental NYC (+1-123-456-7899) and reschedule my Monday appointment to next Friday between 4–6pm.
```

## Available Tools

### trigger-call

Triggers an outbound phone call via Twilio.

**Parameters:**
- `toNumber` (required): Phone number in E.164 format (e.g., +1234567890)
- `callContext` (optional): Context or message for the call

**Example:**
```json
{
  "name": "trigger-call",
  "arguments": {
    "toNumber": "+1234567890",
    "callContext": "Hello, this is a test call from the MCP server."
  }
}
```

## Development

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Testing

The server can be tested locally by running:

```bash
node dist/index.js
```

## Troubleshooting

### Common Issues

1. **"Phone number must be in E.164 format"**
   - Make sure the phone number starts with "+" and includes country code

2. **"Invalid credentials"**
   - Double-check your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN

3. **"OpenAI API error"**
   - Verify your OPENAI_API_KEY is correct and has sufficient credits

4. **"Ngrok tunnel failed to start"**
   - Ensure your NGROK_AUTHTOKEN is valid and not expired

5. **"MCP server not connecting"**
   - Check that the path to `dist/index.js` is correct
   - Ensure all environment variables are set
   - Try running the server manually to check for errors

### Debug Mode

To run with debug logging:

```bash
DEBUG=* node dist/index.js
```

## Differences from Original

This Cursor-compatible version includes:

- Updated MCP SDK (1.17.4 vs 1.8.0)
- Multiple transport support
- Simplified architecture
- Better error handling
- ES module consistency
- Improved logging

## Contributing

Contributions are welcome! This fork is specifically designed for Cursor compatibility while maintaining all the original functionality.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Security

Please do not include any sensitive information (like phone numbers or API credentials) in GitHub issues or pull requests. This server handles sensitive communications; deploy it responsibly and ensure all credentials are kept secure. 