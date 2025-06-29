# HTTP Server from Scratch

A complete HTTP/1.1 server implementation built from scratch using Node.js TCP sockets, demonstrating low-level network programming and HTTP protocol implementation.

## Project Overview

This project contains two implementations:

1. **`socket.ts`** - A simple TCP echo server (foundation)
2. **`http-server-clean.ts`** - A complete HTTP/1.1 server implementation
3. **`HTTP_SERVER_GUIDE.md`** - Detailed step-by-step explanation

## Features

### HTTP Server Features

- ✅ HTTP/1.1 protocol implementation
- ✅ GET and POST method support
- ✅ Keep-alive connections
- ✅ Content-Length handling
- ✅ Header parsing and validation
- ✅ Error handling with proper HTTP status codes
- ✅ Echo server functionality
- ✅ Dynamic buffer management
- ✅ Promise-based socket API
- ✅ Streaming request body reading

### What Makes This Special

- **From Scratch**: No HTTP frameworks used - built directly on TCP sockets
- **Educational**: Every line is explained with comments and documentation
- **Production Concepts**: Implements real-world concerns like buffer management, error handling, and HTTP compliance
- **Modern TypeScript**: Uses async/await and proper typing throughout

## Quick Start

### Prerequisites

```bash
npm install typescript @types/node ts-node
```

### Running the HTTP Server

```bash
# Start the server
npx ts-node http-server-clean.ts

# In another terminal, test it
curl http://127.0.0.1:3000/
curl http://127.0.0.1:3000/echo -d "Hello World"

# Or run the test suite
./test-server.sh
```

### Running the TCP Echo Server

```bash
# Start the echo server
npx ts-node socket.ts

# In another terminal, test with netcat
echo "hello" | nc 127.0.0.1 1234
```

## API Examples

### Basic Request

```bash
curl http://127.0.0.1:3000/
# Response: hello world.
```

### Echo Server

```bash
curl http://127.0.0.1:3000/echo -d "Your message here"
# Response: Your message here
```

### JSON Echo

```bash
curl http://127.0.0.1:3000/echo \
  -H "Content-Type: application/json" \
  -d '{"name": "test", "value": 123}'
# Response: {"name": "test", "value": 123}
```

### With Custom Headers

```bash
curl -H "X-Custom-Header: value" http://127.0.0.1:3000/echo -d "data"
# The server will echo back: data
```

## Architecture

### Layer Structure

```
┌─────────────────────────────────┐
│     Application Layer           │  ← handleReq() - Business logic
├─────────────────────────────────┤
│     HTTP Protocol Layer         │  ← HTTP parsing, response generation
├─────────────────────────────────┤
│     Buffer Management Layer     │  ← Dynamic buffers, message framing
├─────────────────────────────────┤
│     Promise Socket Layer        │  ← soRead(), soWrite() - Promise API
├─────────────────────────────────┤
│     TCP Socket Layer            │  ← Raw Node.js net.Socket
└─────────────────────────────────┘
```

### Key Components

#### 1. **HTTPError Class**

Custom error handling with HTTP status codes

#### 2. **Dynamic Buffer (DynBuf)**

- Grows automatically as needed
- Efficient append/remove operations
- Handles variable-length HTTP messages

#### 3. **TCP Connection Wrapper (TCPConn)**

- Converts event-based sockets to Promise-based API
- Handles errors, EOF, and data events
- Enables clean async/await usage

#### 4. **Body Reader Interface**

- Streaming interface for large request bodies
- Memory-efficient for file uploads
- Supports both Content-Length and chunked encoding

#### 5. **HTTP Parser**

- Parses request line, headers, and body
- Validates HTTP format compliance
- Generates proper HTTP responses

## File Structure

```
web-server/
├── socket.ts              # TCP echo server (foundation)
├── http-server-clean.ts   # Complete HTTP server implementation
├── HTTP_SERVER_GUIDE.md   # Detailed implementation guide
├── test-server.sh         # Test script
├── package.json           # Node.js dependencies
├── tsconfig.json          # TypeScript configuration
└── README.md             # This file
```

## Implementation Highlights

### 1. **Promise-Based Socket API**

```typescript
// Convert callback-based socket to Promise-based
async function soRead(conn: TCPConn): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    conn.reader = { resolve, reject };
    conn.socket.resume();
  });
}
```

### 2. **Dynamic Buffer Management**

```typescript
// Efficient buffer that grows by powers of 2
function bufPush(buf: DynBuf, data: Buffer): void {
  let cap = Math.max(buf.data.length, 32);
  while (cap < newLen) {
    cap *= 2; // Double capacity when needed
  }
}
```

### 3. **HTTP Message Parsing**

```typescript
// Parse complete HTTP requests from byte stream
function cutMessage(buf: DynBuf): null | HTTPReq {
  const indx = buf.data.indexOf("\r\n\r\n");
  if (indx < 0) return null; // Incomplete message
  // Parse and remove from buffer
}
```

### 4. **Streaming Body Reading**

```typescript
// Handle large request bodies without loading into memory
type BodyReader = {
  length: number;
  read: () => Promise<Buffer>;
};
```

## Learning Objectives

This implementation teaches:

1. **Network Programming**: TCP sockets, event handling, buffers
2. **HTTP Protocol**: Request/response format, headers, status codes
3. **Async Programming**: Converting callbacks to Promises, async/await
4. **Buffer Management**: Dynamic sizing, efficient memory usage
5. **Error Handling**: Network errors, protocol errors, graceful degradation
6. **TypeScript**: Advanced types, interfaces, error handling

## Testing

The project includes comprehensive tests:

```bash
# Run all tests
./test-server.sh

# Manual testing
curl -v http://127.0.0.1:3000/
curl -X POST http://127.0.0.1:3000/echo -d "test data"
curl -H "Content-Type: application/json" http://127.0.0.1:3000/echo -d '{"test": true}'
```

## Limitations & Future Work

### Current Limitations

- No HTTPS/TLS support
- No chunked transfer encoding
- No compression (gzip)
- No file serving
- Basic routing only

### Potential Extensions

- **TLS/HTTPS**: Add encryption layer
- **HTTP/2**: Binary protocol, multiplexing
- **Chunked Encoding**: Unknown content length support
- **Compression**: Response compression
- **Static Files**: File serving with proper MIME types
- **Routing**: Pattern matching, middleware system
- **Authentication**: Basic auth, JWT support
- **WebSocket**: Upgrade from HTTP

## Performance Considerations

- **Memory Efficient**: Streaming body processing
- **Connection Reuse**: HTTP/1.1 keep-alive support
- **Buffer Management**: Power-of-2 growth prevents fragmentation
- **Error Handling**: Proper cleanup prevents memory leaks

## Educational Value

This implementation is designed for learning:

- **Complete**: Every aspect of HTTP is implemented
- **Documented**: Extensive comments explain the "why"
- **Testable**: Includes test scripts and examples
- **Extensible**: Clean architecture allows easy additions
- **Real-world**: Handles edge cases and error conditions

## License

MIT License - Feel free to use this for learning and educational purposes.

## Contributing

This is an educational project. If you find bugs or have suggestions for better explanations, please open an issue!

---

Built with ❤️ for understanding how HTTP really works under the hood.
