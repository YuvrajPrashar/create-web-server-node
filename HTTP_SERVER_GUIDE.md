# HTTP Server Implementation - Step by Step Guide

This HTTP server is built from scratch using Node.js TCP sockets, implementing the HTTP/1.1 protocol. Here's how each part works and why we implemented it this way:

## Architecture Overview

The server follows a layered architecture:

1. **TCP Socket Layer** - Handles raw network connections
2. **Buffer Management Layer** - Manages dynamic buffers for data
3. **HTTP Protocol Layer** - Parses and generates HTTP messages
4. **Application Layer** - Handles business logic (echo server)

## Step-by-Step Explanation

### Step 1: Error Handling Foundation

```typescript
class HTTPError extends Error {
  constructor(public code: number, message: string) {
    super(message);
    this.name = "HTTPError";
  }
}
```

**Why:** We need a custom error class to handle HTTP-specific errors with status codes. This allows us to send proper HTTP error responses to clients.

### Step 2: HTTP Parsing Utilities

#### splitlines() Function

**Purpose:** Split HTTP headers into individual lines
**Why:** HTTP headers are separated by `\r\n` (CRLF), and we need to parse each line separately

#### parseRequestLine() Function

**Purpose:** Parse the first line: "GET /path HTTP/1.1"
**Why:** The request line contains the HTTP method, URI, and version - essential for routing requests

#### validateHeader() Function

**Purpose:** Ensure headers follow the "name:value" format
**Why:** Malformed headers can cause security issues or parsing errors

#### fieldGet() Function

**Purpose:** Extract header values by name (case-insensitive)
**Why:** HTTP header names are case-insensitive, and we need to find specific headers like Content-Length

#### encodeHTTPResp() Function

**Purpose:** Convert our HTTP response object into a raw HTTP response string
**Why:** We need to send properly formatted HTTP responses that browsers can understand

### Step 3: Dynamic Buffer Management

```typescript
type DynBuf = {
  data: Buffer;
  length: number;
};
```

**Why:** HTTP messages can be of varying sizes. A dynamic buffer grows as needed and allows efficient manipulation of binary data.

#### bufPush() Function

**Purpose:** Append data to the buffer, growing capacity by powers of 2
**Why:** This prevents frequent memory reallocations and provides O(1) amortized append time

#### bufPop() Function

**Purpose:** Remove processed data from the front of the buffer
**Why:** After parsing headers or body chunks, we need to remove them to process the next message

### Step 4: Promise-Based Socket API

```typescript
type TCPConn = {
  socket: net.Socket;
  err: null | Error;
  ended: boolean;
  reader: null | { resolve: Function; reject: Function };
};
```

**Why:** Node.js sockets are event-based, but async/await is easier to work with. This wrapper converts events to promises.

#### soInit() Function

**Purpose:** Initialize the socket wrapper and set up event handlers
**Why:** We need to convert socket events (data, end, error) into promise resolutions/rejections

#### soRead() Function

**Purpose:** Read data as a Promise
**Why:** Allows us to use async/await syntax instead of complex event handling

#### soWrite() Function

**Purpose:** Write data as a Promise
**Why:** Ensures writes complete before continuing, preventing race conditions

### Step 5: HTTP Body Reading

```typescript
type BodyReader = {
  length: number;
  read: () => Promise<Buffer>;
};
```

**Why:** HTTP bodies can be huge (file uploads, etc.) and may not fit in memory. Streaming allows processing large requests efficiently.

#### readerFromReq() Function

**Purpose:** Create a body reader based on Content-Length or Transfer-Encoding headers
**Why:** Different HTTP requests use different ways to indicate body size

#### readerFromConnLength() Function

**Purpose:** Read a known amount of data from the connection
**Why:** When Content-Length is specified, we know exactly how much data to read

### Step 6: HTTP Message Processing

#### cutMessage() Function

**Purpose:** Extract complete HTTP request headers from the buffer
**Why:** HTTP headers end with `\r\n\r\n`. We need to wait for complete headers before parsing.

#### parseHTTPReq() Function

**Purpose:** Parse complete HTTP request headers into structured data
**Why:** Converts raw bytes into usable request object with method, URI, version, and headers

### Step 7: Request Handling

#### handleReq() Function

**Purpose:** Process the HTTP request and generate a response
**Why:** This is where application logic lives - routing, business logic, etc.

**Current Features:**

- `/echo` - Returns the request body as response
- Default - Returns "hello world"

### Step 8: Main Server Loop

#### serverClient() Function

**Purpose:** Handle a single client connection, processing multiple requests
**Why:** HTTP/1.1 supports keep-alive connections, so one TCP connection can handle multiple HTTP requests

**Key Steps:**

1. Try to parse a complete HTTP request from buffer
2. If incomplete, read more data from socket
3. Process request and send response
4. For HTTP/1.0, close connection; for HTTP/1.1, continue loop
5. Ensure request body is fully consumed before next request

#### newConn() Function

**Purpose:** Handle new client connections
**Why:** Creates the socket wrapper and handles connection-level errors

### Step 9: Server Initialization

**Purpose:** Start the TCP server and listen for connections
**Why:** This is the entry point - creates the server socket and begins accepting connections

## Key Design Decisions

### 1. **Promise-based API over Events**

- **Why:** Easier to write sequential logic with async/await
- **Trade-off:** Slightly more memory usage but much cleaner code

### 2. **Dynamic Buffers**

- **Why:** HTTP messages vary greatly in size
- **Trade-off:** More complex than fixed buffers but handles real-world scenarios

### 3. **Streaming Body Reading**

- **Why:** Supports large uploads without running out of memory
- **Trade-off:** More complex than loading entire body into memory

### 4. **Binary-first Approach**

- **Why:** HTTP can contain non-UTF8 data in headers and URIs
- **Trade-off:** Must convert to strings when needed, but more robust

### 5. **Explicit Error Handling**

- **Why:** Network programming requires handling many error conditions
- **Trade-off:** More code but more reliable

## Testing the Server

1. Start the server:

   ```bash
   npx ts-node http-server-clean.ts
   ```

2. Test basic functionality:

   ```bash
   curl http://127.0.0.1:3000/
   ```

3. Test echo functionality:

   ```bash
   curl http://127.0.0.1:3000/echo -d "Hello World"
   ```

4. Test with headers:
   ```bash
   curl -H "Content-Type: application/json" http://127.0.0.1:3000/echo -d '{"test": "data"}'
   ```

## Future Enhancements

1. **Chunked Transfer Encoding** - For unknown content lengths
2. **HTTP/2 Support** - Binary framing, multiplexing
3. **TLS/HTTPS** - Encryption layer
4. **Compression** - Gzip response compression
5. **Static File Serving** - Serve files from disk
6. **Routing Framework** - More sophisticated URL routing
7. **Middleware System** - Authentication, logging, etc.

This implementation provides a solid foundation for understanding HTTP protocol implementation and can be extended for production use cases.
