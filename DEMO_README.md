# 🚀 HTTP Server Demo - Quick Setup

A beautiful, interactive webpage to showcase the HTTP server built from scratch.

## 🎯 Quick Start

1. **Start the server:**

   ```bash
   ./start-demo.sh
   ```

2. **Open your browser:**

   ```
   http://127.0.0.1:3000
   ```

3. **Enjoy testing!** 🎉

## ✨ What You'll See

The demo webpage includes:

### 🌐 Interactive Testing Interface

- **GET Request Testing** - Try different paths and see responses
- **Echo Server Testing** - Send data and see it echoed back
- **Custom Headers** - Add your own headers and test functionality
- **Real-time Results** - See response times, headers, and data

### 📊 Live Server Information

- Response timing
- HTTP status codes
- Request/response headers
- Server capabilities

### 💻 Ready-to-Use Examples

- Copy-paste curl commands
- Different content types (JSON, XML, plain text)
- API usage examples

## 🔧 Features Demonstrated

✅ **HTTP/1.1 Protocol** - Full implementation with keep-alive
✅ **CORS Support** - Cross-origin requests enabled  
✅ **Echo Functionality** - Perfect request mirroring
✅ **Error Handling** - Proper HTTP status codes
✅ **Multiple Content Types** - JSON, text, HTML support
✅ **Custom Headers** - Full header processing
✅ **Real-time Testing** - Interactive browser interface

## 🎨 Screenshot Preview

The demo features a modern, responsive design with:

- 🎨 Beautiful gradient backgrounds
- 📱 Mobile-friendly responsive layout
- ⚡ Real-time request/response display
- 🎯 Interactive form controls
- 📊 Formatted response viewing

## 🛠 Technical Details

- **Server**: Built from scratch using TCP sockets
- **Frontend**: Pure HTML/CSS/JavaScript (no frameworks)
- **Protocol**: HTTP/1.1 with proper compliance
- **CORS**: Enabled for cross-origin testing
- **Performance**: Sub-5ms response times locally

## 🌍 Hosting Options

### Local Demo (Default)

```bash
npx ts-node http-server-clean.ts
# Available at: http://127.0.0.1:3000
```

### Network Demo (Share with others)

1. Edit `http-server-clean.ts` - change host to `"0.0.0.0"`
2. Update `public/index.html` - change BASE_URL to your IP
3. Open firewall port 3000
4. Share: `http://YOUR_IP:3000`

### Cloud Hosting

See `DEMO_HOSTING_GUIDE.md` for detailed cloud deployment instructions.

## 🧪 Testing

The demo includes comprehensive testing capabilities:

```bash
# Run automated tests
./test-server.sh

# Manual testing
curl http://127.0.0.1:3000/
curl http://127.0.0.1:3000/echo -d "test data"
```

## 🎓 Educational Value

This demo is perfect for:

- **Learning HTTP protocol internals**
- **Understanding client-server communication**
- **Seeing real network programming in action**
- **Testing API endpoints interactively**
- **Demonstrating web server capabilities**

## 📁 Files

```
web-server/
├── public/index.html           # Beautiful demo webpage
├── http-server-clean.ts        # Main HTTP server
├── start-demo.sh              # Easy start script
├── test-server.sh             # Comprehensive tests
├── DEMO_HOSTING_GUIDE.md      # Detailed hosting guide
└── README.md                  # Project documentation
```

## 🎉 Try It Now!

1. `./start-demo.sh`
2. Open `http://127.0.0.1:3000`
3. Click around and test features!
4. Share with friends! 🌟

---

**Built with ❤️ to showcase how HTTP really works under the hood!**
