import * as net from "net";

// Step 1: Define HTTPError class for proper error handling
class HTTPError extends Error {
  constructor(public code: number, message: string) {
    super(message);
    this.name = "HTTPError";
  }
}

// Step 2: Utility functions for HTTP parsing

// Split buffer into lines separated by \r\n
function splitlines(data: Buffer): Buffer[] {
  const lines: Buffer[] = [];
  let start = 0;

  for (let i = 0; i < data.length - 1; i++) {
    if (data[i] === 0x0d && data[i + 1] === 0x0a) {
      // \r\n
      lines.push(data.subarray(start, i));
      start = i + 2;
      i++; // skip the \n
    }
  }

  // Add the last line if it doesn't end with \r\n
  if (start < data.length) {
    lines.push(data.subarray(start));
  }

  return lines;
}

// Parse the first line of HTTP request: "METHOD URI VERSION"
function parseRequestLine(line: Buffer): [string, Buffer, string] {
  const parts = line.toString("latin1").split(" ");
  if (parts.length !== 3) {
    throw new HTTPError(400, "Invalid request line");
  }

  const [method, uriStr, version] = parts;

  // Validate HTTP version
  if (!version.startsWith("HTTP/")) {
    throw new HTTPError(400, "Invalid HTTP version");
  }

  return [method, Buffer.from(uriStr, "latin1"), version.substring(5)]; // Remove "HTTP/"
}

// Validate HTTP header format (name:value)
function validateHeader(header: Buffer): boolean {
  const headerStr = header.toString("latin1");
  const colonIndex = headerStr.indexOf(":");

  if (colonIndex <= 0) return false; // No colon or colon at start

  const name = headerStr.substring(0, colonIndex).trim();
  const value = headerStr.substring(colonIndex + 1).trim();

  // Basic validation: name should not be empty and contain valid characters
  if (name.length === 0) return false;
  if (!/^[a-zA-Z0-9\-_]+$/.test(name)) return false;

  return true;
}

// Get header field value by name (case-insensitive)
function fieldGet(headers: Buffer[], fieldName: string): Buffer | null {
  const targetName = fieldName.toLowerCase();

  for (const header of headers) {
    const headerStr = header.toString("latin1");
    const colonIndex = headerStr.indexOf(":");

    if (colonIndex > 0) {
      const name = headerStr.substring(0, colonIndex).trim().toLowerCase();
      if (name === targetName) {
        const value = headerStr.substring(colonIndex + 1).trim();
        return Buffer.from(value, "latin1");
      }
    }
  }

  return null;
}

// Parse decimal number from string
function parseDec(str: string): number {
  const num = parseInt(str, 10);
  return isNaN(num) ? NaN : num;
}

// Encode HTTP response into a buffer
function encodeHTTPResp(resp: HTTPRes): Buffer {
  let statusLine = `HTTP/1.1 ${resp.code}`;

  // Add standard status messages
  const statusMessages: { [key: number]: string } = {
    200: "OK",
    400: "Bad Request",
    404: "Not Found",
    413: "Payload Too Large",
    501: "Not Implemented",
  };

  if (statusMessages[resp.code]) {
    statusLine += ` ${statusMessages[resp.code]}`;
  }

  statusLine += "\r\n";

  // Add headers
  let headerStr = statusLine;
  for (const header of resp.headers) {
    headerStr += header.toString("latin1") + "\r\n";
  }
  headerStr += "\r\n"; // Empty line to end headers

  return Buffer.from(headerStr, "latin1");
}

//A dynamic-sized buffer
type DynBuf = {
  data: Buffer;
  length: number;
};

//promise based-api for TCP sockets.
type TCPConn = {
  //js socket object
  socket: net.Socket;
  //from error event
  err: null | Error;
  //EOF,from the 'end' event
  ended: boolean;
  // the callbacks of the promise of the current read
  reader: null | {
    resolve: (value: Buffer) => void;
    reject: (reason: Error) => void;
  };
};

//append data to DYnBuff
function bufPush(buf: DynBuf, data: Buffer): void {
  const newLen = buf.length + data.length;
  if (buf.data.length < newLen) {
    //growing the capacity by the power of 2
    let cap = Math.max(buf.data.length, 32);
    while (cap < newLen) {
      cap *= 2;
    }
    const grown = Buffer.alloc(cap);
    buf.data.copy(grown, 0, 0);
    buf.data = grown;
  }
  data.copy(buf.data, buf.length, 0);
  buf.length = newLen;
}

//remove data from buffer
function bufPop(buf: DynBuf, indx: number): void {
  buf.data.copyWithin(0, indx, buf.length);
  buf.length -= indx;
}

function soInit(socket: net.Socket): TCPConn {
  const conn: TCPConn = {
    socket: socket,
    err: null,
    ended: false,
    reader: null,
  };

  socket.on("data", (data: Buffer) => {
    console.assert(conn.reader);
    //pausing data event until next read.

    conn.socket.pause();
    //fullfill the promise of the current read
    conn.reader!.resolve(data);
    conn.reader = null;
  });

  // Step 15: Handle connection end (no error parameter needed)
  socket.on("end", () => {
    // Mark connection as ended
    conn.ended = true;
    if (conn.reader) {
      // Resolve with empty buffer to signal EOF
      conn.reader.resolve(Buffer.from(""));
      conn.reader = null;
    }
  });

  // Step 16: Handle connection errors
  socket.on("error", (err: Error) => {
    // Store error and reject current read operation
    conn.err = err;
    if (conn.reader) {
      conn.reader.reject(err);
      conn.reader = null;
    }
  });

  return conn;
}

function soRead(conn: TCPConn): Promise<Buffer> {
  console.assert(!conn.reader); //no cuncurrent calls

  return new Promise((resolve, reject) => {
    if (conn.err) {
      reject(conn.err);
      return;
    }
    if (conn.ended) {
      resolve(Buffer.from("")); //EOF
    }
    //save promise callbacks
    conn.reader = { resolve: resolve, reject: reject };
    //and resume the data event to fullfill promise later
    conn.socket.resume();
  });
}

function soWrite(conn: TCPConn, data: Buffer): Promise<void> {
  console.assert(data.length > 0);
  return new Promise((resolve, reject) => {
    if (conn.err) {
      reject(conn.err);
      return;
    }
    conn.socket.write(data, (err?: Error | null) => {
      if (err) {
        reject(err);
        return;
      } else {
        resolve();
      }
    });
  });
}

//reading -writing data from&to the http body
type BodyReader = {
  //the content-length,-1 if unkown
  length: number;
  //read-data,returns an empty buffer after EOF.
  read: () => Promise<Buffer>; //The payload body can be arbitrarily long, it may not even fit in memory, thus we have to use the read() function to read from it instead of a simple Buffer. The read() function follows the convention of the soRead() function — the end of data is signaled by an empty Buffer.
  //    And when using chunked encoding, the length of the body is not known, which is another reason why this interface is needed.
};

type HTTPReq = {
  method: string;
  uri: Buffer;
  version: string;
  headers: Buffer[];
};
//We use Buffer instead of string for the URI and header fields. Although HTTP is mostly plaintext, there is no guarantee that URI and header fields must be ASCII or UTF-8 strings. So we just leave them as bytes until we need to parse them.
type HTTPRes = {
  code: number;
  headers: Buffer[];
  body: BodyReader;
};

//Build  splitLines(), parseRequestLine(), and validateHeader() functions according to RFC's
const kMaxHeaderLen = 1024 * 8; //max len of header

//parse & remove the header from the begging of the buffer if possible
function cutMessage(buf: DynBuf): null | HTTPReq {
  //the end of the header is marked by \r\n\r\n
  const indx = buf.data.subarray(0, buf.length).indexOf("\r\n\r\n");
  if (indx < 0) {
    if (buf.length >= kMaxHeaderLen) {
      throw new HTTPError(413, "header is too large");
    }
    return null; //need more data
  }
  //parse and remove the header
  const msg = parseHTTPReq(buf.data.subarray(0, indx + 4));
  bufPop(buf, indx + 4);
  return msg;
}

//parse an HTTP req header
function parseHTTPReq(data: Buffer): HTTPReq {
  //split the data into lines
  const lines: Buffer[] = splitlines(data);
  //first line is method uri version
  const [method, uri, version] = parseRequestLine(lines[0]);
  //followed by header fields in the format of name:value
  const headers: Buffer[] = [];
  for (let i = 1; i < lines.length - 1; i++) {
    const h = Buffer.from(lines[i]); //copy
    if (!validateHeader(h)) {
      throw new HTTPError(404, "Bad field");
    }
    headers.push(h);
  }
  // the header ends by an empty line
  console.assert(lines[lines.length - 1].length === 0);
  return {
    method: method,
    uri: uri,
    version: version,
    headers: headers,
  };
}
// BodyReader from an HTTP request
function readerFromReq(conn: TCPConn, buf: DynBuf, req: HTTPReq): BodyReader {
  let bodyLen = -1;
  const contentLen = fieldGet(req.headers, "Content-Length");
  if (contentLen) {
    bodyLen = parseDec(contentLen.toString("latin1"));
    if (isNaN(bodyLen)) {
      throw new HTTPError(400, "bad Content-Length.");
    }
  }
  const bodyAllowed = !(
    req.method === "GET" ||
    req.method === "HEAD" ||
    req.method === "OPTIONS"
  );
  const chunked =
    fieldGet(req.headers, "Transfer-Encoding")?.equals(
      Buffer.from("chunked")
    ) || false;
  if (!bodyAllowed && (bodyLen > 0 || chunked)) {
    throw new HTTPError(400, "HTTP body not allowed.");
  }
  if (!bodyAllowed) {
    bodyLen = 0;
  }

  if (bodyLen >= 0) {
    // "Content-Length" is present or body not allowed
    return readerFromConnLength(conn, buf, bodyLen);
  } else if (chunked) {
    // chunked encoding
    throw new HTTPError(501, "Chunked encoding not implemented");
  } else {
    // read the rest of the connection - for methods that allow body but no Content-Length
    // For simplicity, assume no body if no Content-Length specified
    return readerFromConnLength(conn, buf, 0);
    throw new HTTPError(501, "TODO");
  }
}
// BodyReader from a socket with a known length
function readerFromConnLength(
  conn: TCPConn,
  buf: DynBuf,
  remain: number
): BodyReader {
  return {
    length: remain,
    read: async (): Promise<Buffer> => {
      if (remain === 0) {
        return Buffer.from(""); // done
      }
      if (buf.length === 0) {
        // try to get some data if there is none
        const data = await soRead(conn);
        bufPush(buf, data);
        if (data.length === 0) {
          // expect more data!
          throw new Error("Unexpected EOF from HTTP body");
        }
      }
      // consume data from the buffer
      const consume = Math.min(buf.length, remain);
      remain -= consume;
      const data = Buffer.from(buf.data.subarray(0, consume));
      bufPop(buf, consume);
      return data;
    },
  };
}

// a sample request handler
async function handleReq(req: HTTPReq, body: BodyReader): Promise<HTTPRes> {
  // act on the request URI
  const uri = req.uri.toString("latin1");
  let resp: BodyReader;
  let headers: Buffer[] = [
    Buffer.from("Server: my_first_http_server"),
    Buffer.from("Access-Control-Allow-Origin: *"),
    Buffer.from(
      "Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS"
    ),
    Buffer.from("Access-Control-Allow-Headers: Content-Type, X-Custom-Header"),
  ];

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    resp = readerFromMemory(Buffer.from(""));
    return {
      code: 204,
      headers: headers,
      body: resp,
    };
  }

  switch (uri) {
    case "/":
      // Serve the demo webpage
      try {
        const fs = require("fs");
        const path = require("path");
        const htmlPath = path.join(__dirname, "public", "index.html");
        const htmlContent = fs.readFileSync(htmlPath);
        headers.push(Buffer.from("Content-Type: text/html; charset=utf-8"));
        resp = readerFromMemory(htmlContent);
      } catch (error) {
        // Fallback if HTML file doesn't exist
        const fallbackHtml = `
<!DOCTYPE html>
<html>
<head><title>HTTP Server Demo</title></head>
<body>
    <h1>HTTP Server from Scratch</h1>
    <p>Server is running! The demo page should be at <code>public/index.html</code></p>
    <p>Try these endpoints:</p>
    <ul>
        <li><a href="/echo">/echo</a> - Echo server (POST data)</li>
        <li><a href="/test">/test</a> - Default response</li>
    </ul>
</body>
</html>`;
        headers.push(Buffer.from("Content-Type: text/html; charset=utf-8"));
        resp = readerFromMemory(Buffer.from(fallbackHtml));
      }
      break;
    case "/echo":
      // http echo server
      resp = body;
      headers.push(Buffer.from("Content-Type: text/plain; charset=utf-8"));
      break;
    default:
      resp = readerFromMemory(Buffer.from("hello world.\n"));
      headers.push(Buffer.from("Content-Type: text/plain; charset=utf-8"));
      break;
  }

  return {
    code: 200,
    headers: headers,
    body: resp,
  };
}

// BodyReader from in-memory data
function readerFromMemory(data: Buffer): BodyReader {
  let done = false;
  return {
    length: data.length,
    read: async (): Promise<Buffer> => {
      if (done) {
        return Buffer.from(""); // no more data
      } else {
        done = true;
        return data;
      }
    },
  };
}

// send an HTTP response through the socket
async function writeHTTPResp(conn: TCPConn, resp: HTTPRes): Promise<void> {
  if (resp.body.length < 0) {
    throw new Error("TODO: chunked encoding");
  }
  // set the "Content-Length" field
  console.assert(!fieldGet(resp.headers, "Content-Length"));
  resp.headers.push(Buffer.from(`Content-Length: ${resp.body.length}`));
  // write the header
  await soWrite(conn, encodeHTTPResp(resp));
  // write the body
  while (true) {
    const data = await resp.body.read();
    if (data.length === 0) {
      break;
    }
    await soWrite(conn, data);
  }
}

async function serverClient(conn: TCPConn): Promise<void> {
  const buf: DynBuf = { data: Buffer.alloc(0), length: 0 };
  while (true) {
    // Step 3: Try to get 1 request header from the buffer
    const msg: null | HTTPReq = cutMessage(buf);
    if (!msg) {
      // Step 4: Need more data - read from connection
      const data = await soRead(conn);
      bufPush(buf, data);
      // Step 5: Check for EOF (End of File)
      if (data.length === 0 && buf.length === 0) {
        return; // no more requests
      }
      if (data.length === 0) {
        throw new HTTPError(400, "Unexpected EOF.");
      }
      // Got some data, try parsing again
      continue;
    }

    // Step 6: Process the message and send the response
    const reqBody: BodyReader = readerFromReq(conn, buf, msg);
    const res: HTTPRes = await handleReq(msg, reqBody);
    await writeHTTPResp(conn, res);

    // Step 7: Close connection for HTTP/1.0
    if (msg.version === "1.0") {
      return;
    }

    // Step 8: Make sure that the request body is consumed completely
    // This prevents buffer overflow and ensures clean state for next request
    while ((await reqBody.read()).length > 0) {}
  } // loop for IO
}

async function newConn(socket: net.Socket): Promise<void> {
  const conn: TCPConn = soInit(socket);
  try {
    await serverClient(conn);
  } catch (exc) {
    console.error("Exception : " + exc);
    if (exc instanceof HTTPError) {
      // Step 9: Send error response to client
      const resp: HTTPRes = {
        code: exc.code,
        headers: [],
        body: readerFromMemory(Buffer.from(exc.message + "\n")),
      };
      try {
        await writeHTTPResp(conn, resp);
      } catch (exc) {
        // Ignore errors when sending error response
      }
    }
  } finally {
    // Step 10: Always clean up the socket connection
    socket.destroy();
  }
}

// Step 11: Create and start the HTTP server
// Create the TCP server that will handle HTTP connections
const server = net.createServer({
  pauseOnConnect: true, // Pause data events until we're ready to handle them
});

// Step 12: Set up connection handler
server.on("connection", newConn);

const port = process.env.PORT || 3000; 
const host = process.env.PORT || "0.0.0.0"; 

// Step 13: Start listening on specified host and port
server.listen({ host, port }, () => {
  console.log(`HTTP Server listening on http://${host}:${port}`);
  console.log("Try:");
  console.log(`  curl http://${host}:${port}/`);
  console.log(`  curl http://${host}:${port}/echo -d 'Hello World'`);
});

// Step 14: Handle server errors
server.on("error", (err: Error) => {
  console.error("Server error:", err);
  throw err;
});
