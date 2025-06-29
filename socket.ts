import * as net from "net";
//A dynamic-sized buffer
type DynBuf = {
    data: Buffer,
    length:number,
}

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
function bufPush(buf: DynBuf, data: Buffer): void{
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
function bufPop(buf: DynBuf, indx: number): void{
    buf.data.copyWithin(0, indx, buf.length);
    buf.length -= indx;
}


function soInit(socket: net.Socket): TCPConn {
  const conn: TCPConn = {
      socket: socket,
      err: null,
      ended:false,
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
    
    socket.on('end', (err: Error) => {
        //errors are also delivered to the current read
        conn.err = err;
        if (conn.reader) {
            conn.reader.reject(err);
            conn.reader = null;
        }
        
    })
  return conn;
}

function soRead(conn: TCPConn): Promise<Buffer>{
    console.assert(!conn.reader); //no cuncurrent calls


    return new Promise((resolve, reject) => {
        if (conn.err) {
            reject(conn.err);
            return;
        }
        if (conn.ended) {
            resolve(Buffer.from('')); //EOF
        }
        //save promise callbacks
        conn.reader = { resolve: resolve, reject: reject };
        //and resume the data event to fullfill promise later
        conn.socket.resume();
    });
}

function soWrite(conn: TCPConn, data: Buffer): Promise<void>{
    console.assert(data.length > 0);
    return new Promise((resolve, reject) => {
        if (conn.err) {
            reject(conn.err);
            return;
        }
        conn.socket.write(data, (err?:Error)=> {
            if(err) {
                reject(err);
                return;
            }else{
                resolve();
            }
        })
    })
};

function cutMsg(buf: DynBuf): null | Buffer{
    //msgs are seprated by \n

    const indx = buf.data.subarray(0, buf.length).indexOf('\n');
    if (indx < 0) {
        return null; //msg not complete
    }

    //make a copy of the msg and move the reamaing data to the front
    const msg = Buffer.from(buf.data.subarray(0, indx + 1));
    bufPop(buf, indx + 1);
    return msg;
}

async function serverClient(socket:net.Socket):Promise<void> {
    const conn: TCPConn = soInit(socket);
    const buf: DynBuf = { data: Buffer.alloc(0), length:0};
    while (true) {
        const msg: null | Buffer = cutMsg(buf);
        if(!msg) {
            const data: Buffer = await soRead(conn);
            bufPush(buf, data);

            if (data.length === 0) {
            console.log('end connection');
            return;
            }
            continue;
        }
        if (msg.equals(Buffer.from('quit\n'))) {
            await soWrite(conn,Buffer.from('Bye.\n'))
            socket.destroy();
            return;
        } else {
            const reply=Buffer.concat([Buffer.from('ECHO: '),msg])
            await soWrite(conn,reply)
        }

    }
}

async function newConn(socket: net.Socket): Promise<void> {
  console.log("new connection", socket.remoteAddress, socket.remotePort);
try {
    await serverClient(socket);
} catch (exc) {
    console.error("exception : " + exc);
} finally {
    socket.destroy;
}
}

let server = net.createServer({ pauseOnConnect: true }); //since data event is paused until we read
server.on("connection", newConn);
server.listen({ host: "127.0.0.1", port: 1234 });
server.on("error", (err: Error) => {
  throw err;
});
