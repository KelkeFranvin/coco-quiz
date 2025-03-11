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
        console.log("New answer event received:", data)
        // Broadcast to all clients including sender
        io.emit("answer-submitted", data)
        console.log("Answer-submitted event emitted to all clients")
      })

      socket.on("quiz-reset", (data) => {
        console.log("Reset quiz event received:", data)
        // Broadcast to all clients including sender
        io.emit("quiz-reset", data)
        console.log("Quiz-reset event emitted to all clients")
      })

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id)
      })

      socket.on("error", (error) => {
        console.error("Socket error:", error)
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