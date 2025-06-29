# HTTP Server Demo - Hosting Guide

This guide explains how to host and showcase the HTTP server implementation with its interactive demo webpage.

## Quick Start

### 1. Start the Server

```bash
# Option 1: Use the start script
./start-demo.sh

# Option 2: Start manually
npx ts-node http-server-clean.ts
```

### 2. Open the Demo

Navigate to: **http://127.0.0.1:3000**

## Demo Features

The interactive webpage provides:

### 🌐 Basic GET Request Testing

- Test different URL paths
- View response headers and timing
- See server responses in real-time

### 🔄 Echo Server Testing

- Send POST/PUT/PATCH requests to `/echo`
- Test different content types (JSON, XML, plain text)
- See exact request/response data

### 📋 Custom Headers Testing

- Add custom headers to requests
- Verify header handling
- Test CORS functionality

### 💻 Code Examples

- Ready-to-copy curl commands
- Examples for different use cases
- API reference

## Server Capabilities Demonstrated

### 1. **HTTP Protocol Compliance**

- ✅ HTTP/1.1 support
- ✅ Keep-alive connections
- ✅ Proper status codes
- ✅ Header parsing and generation

### 2. **CORS Support**

- ✅ `Access-Control-Allow-Origin: *`
- ✅ Multiple HTTP methods supported
- ✅ Custom headers allowed
- ✅ Preflight request handling

### 3. **Content Types**

- ✅ HTML serving for the demo page
- ✅ Plain text responses
- ✅ JSON echo functionality
- ✅ Proper charset specification

### 4. **Error Handling**

- ✅ Graceful error responses
- ✅ Proper HTTP status codes
- ✅ Fallback content when files missing

## Hosting for Production Demo

### For Local Development

```bash
# Start the server
npx ts-node http-server-clean.ts

# Server runs on http://127.0.0.1:3000
# Demo page available at http://127.0.0.1:3000/
```

### For Public Demo (Network Access)

1. **Modify the server to listen on all interfaces:**

   ```typescript
   // In http-server-clean.ts, change:
   server.listen({ host: "0.0.0.0", port: 3000 }, () => {
     console.log("HTTP Server listening on http://0.0.0.0:3000");
   });
   ```

2. **Update the demo page URL:**

   ```javascript
   // In public/index.html, change:
   const BASE_URL = "http://YOUR_SERVER_IP:3000";
   ```

3. **Ensure firewall allows port 3000:**

   ```bash
   # Ubuntu/Debian
   sudo ufw allow 3000

   # CentOS/RHEL
   sudo firewall-cmd --add-port=3000/tcp --permanent
   sudo firewall-cmd --reload
   ```

### For Cloud Hosting (Heroku, Railway, etc.)

1. **Make port configurable:**

   ```typescript
   const port = process.env.PORT || 3000;
   server.listen({ host: "0.0.0.0", port: port }, () => {
     console.log(`HTTP Server listening on port ${port}`);
   });
   ```

2. **Add start script to package.json:**

   ```json
   {
     "scripts": {
       "start": "ts-node http-server-clean.ts",
       "demo": "ts-node http-server-clean.ts"
     }
   }
   ```

3. **Create Procfile for Heroku:**
   ```
   web: npm start
   ```

## Testing the Demo

### Automated Tests

```bash
# Run the comprehensive test suite
./test-server.sh
```

### Manual Testing Endpoints

1. **Basic functionality:**

   ```bash
   curl http://127.0.0.1:3000/
   ```

2. **Echo server:**

   ```bash
   curl -X POST http://127.0.0.1:3000/echo -d "Hello World"
   ```

3. **JSON echo:**

   ```bash
   curl -X POST http://127.0.0.1:3000/echo \
     -H "Content-Type: application/json" \
     -d '{"message": "test", "id": 123}'
   ```

4. **Custom headers:**

   ```bash
   curl -X POST http://127.0.0.1:3000/echo \
     -H "X-Custom-Header: my-value" \
     -d "Testing custom headers"
   ```

5. **CORS preflight:**
   ```bash
   curl -X OPTIONS http://127.0.0.1:3000/echo \
     -H "Access-Control-Request-Method: POST" \
     -H "Origin: http://example.com"
   ```

## Demo Page Structure

```
web-server/
├── public/
│   └── index.html          # Interactive demo webpage
├── http-server-clean.ts    # Main server implementation
├── start-demo.sh          # Demo start script
├── test-server.sh         # Test script
└── README.md              # Documentation
```

## Key Demo Features Explained

### 1. **Real-time Testing**

The webpage uses JavaScript `fetch()` to make real HTTP requests to the server, demonstrating:

- Actual HTTP communication
- Response timing measurement
- Header inspection
- Error handling

### 2. **CORS Demonstration**

The server includes CORS headers that allow the demo page to make cross-origin requests, showing:

- Preflight request handling
- Header allowlisting
- Method permissions

### 3. **Interactive Examples**

Users can:

- Modify request data
- Add custom headers
- Choose different HTTP methods
- See formatted responses

### 4. **Educational Value**

The demo helps understand:

- HTTP request/response cycle
- Header functionality
- Content-Type handling
- Echo server concepts

## Performance Characteristics

- **Startup Time:** < 1 second
- **Memory Usage:** ~20-50MB (Node.js baseline)
- **Request Latency:** < 5ms for local requests
- **Concurrent Connections:** Handles multiple simultaneous connections
- **Keep-Alive:** Supports connection reuse

## Troubleshooting

### Common Issues

1. **Port already in use:**

   ```bash
   # Find and kill process using port 3000
   lsof -ti:3000 | xargs kill
   ```

2. **Permission denied:**

   ```bash
   # Make scripts executable
   chmod +x start-demo.sh test-server.sh
   ```

3. **Cannot connect from other machines:**

   - Change host from "127.0.0.1" to "0.0.0.0"
   - Check firewall settings
   - Verify network configuration

4. **Demo page not loading:**
   - Ensure `public/index.html` exists
   - Check file permissions
   - Verify server is serving HTML content type

## Browser Compatibility

The demo webpage works in:

- ✅ Chrome/Chromium (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

Features used:

- ES6+ JavaScript (fetch, async/await)
- CSS Grid and Flexbox
- Modern HTML5 features

## Security Considerations

**Note:** This is a demo server for educational purposes:

- 🚨 No authentication
- 🚨 No input validation beyond basic HTTP parsing
- 🚨 No rate limiting
- 🚨 CORS allows all origins (`*`)
- 🚨 No HTTPS support

For production use, implement proper security measures.

---

## Next Steps

1. **Extend the demo** with more interactive features
2. **Add HTTPS support** for secure connections
3. **Implement authentication** for protected endpoints
4. **Add file upload handling** for larger demos
5. **Create API documentation** with OpenAPI/Swagger

The demo successfully showcases the HTTP server's capabilities while providing an educational and interactive experience!
