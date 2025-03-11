import { Server } from "socket.io"
import type { NextApiRequest } from "next"
import type { NextApiResponse } from "next"
import type { Server as HTTPServer } from "http"
import type { Socket as NetSocket } from "net"

interface SocketServer extends HTTPServer {
  io?: Server | undefined
}

interface SocketWithIO extends NetSocket {
  server: SocketServer
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO
}

const ioHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.IO server...")
    const io = new Server(res.socket.server, {
      path: "/api/socketio",
      addTrailingSlash: false,
    })

    // Socket.IO Events
    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id)

      socket.on("submit-answer", (data) => {
        console.log("New answer event:", data)
        io.emit("answer-submitted", data)
      })

      socket.on("quiz-reset", (data) => {
        console.log("Reset quiz event:", data)
        io.emit("quiz-reset", data)
      })

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id)
      })
    })

    res.socket.server.io = io
  }

  res.end()
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export default ioHandler