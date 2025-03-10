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
    const io = new Server(res.socket.server, {
      path: "/api/socketio",
      addTrailingSlash: false,
    })

    // Socket.IO Events
    io.on("connection", (socket) => {
      console.log("Client connected")

      socket.on("new-answer", (data) => {
        console.log("New answer received:", data)
        io.emit("answer-submitted", data)
      })

      socket.on("reset-quiz", (data) => {
        console.log("Quiz reset received:", data)
        io.emit("quiz-reset", data)
      })

      socket.on("disconnect", () => {
        console.log("Client disconnected")
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