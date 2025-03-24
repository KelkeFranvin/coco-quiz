import { Server } from "socket.io"
import type { NextApiRequest } from "next"
import type { NextApiResponse } from "next"
import type { Server as HTTPServer } from "http"
import type { Socket as NetSocket } from "net"
import { supabase } from "@/lib/supabaseClient"

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

      socket.on("submit-answer", async (data) => {
        console.log("New answer event received:", data)
        // Broadcast the answer to all clients
        io.emit("answer-submitted", data)
        console.log("Answer-submitted event emitted to all clients")
      })

      socket.on("quiz-reset", async (data) => {
        console.log("Reset quiz event received:", data)
        try {
          // First get all non-reset answers
          const { data: answersToReset, error: fetchError } = await supabase
            .from('answers')
            .select('*')
            .eq('reset', false)

          if (fetchError) {
            console.error("Failed to fetch answers:", fetchError)
            return
          }

          console.log("Answers to reset:", JSON.stringify(answersToReset, null, 2))

          if (answersToReset && answersToReset.length > 0) {
            // Insert into reset_answers
            const { data: insertedAnswers, error: insertError } = await supabase
              .from('reset_answers')
              .insert(answersToReset.map(answer => ({
                ...answer,
                resetTimestamp: new Date().toISOString()
              })))
              .select()

            if (insertError) {
              console.error("Failed to insert into reset_answers:", JSON.stringify(insertError, null, 2))
              return
            }

            console.log("Successfully inserted into reset_answers:", JSON.stringify(insertedAnswers, null, 2))

            // Delete from answers
            const { error: deleteError } = await supabase
              .from('answers')
              .delete()
              .eq('reset', false)

            if (deleteError) {
              console.error("Failed to delete from answers:", JSON.stringify(deleteError, null, 2))
              return
            }

            console.log("Successfully deleted from answers")
          } else {
            console.log("No answers to reset")
          }

          // Broadcast to all clients including sender
          io.emit("quiz-reset", data)
          console.log("Quiz-reset event emitted to all clients")
        } catch (error) {
          console.error("Error resetting quiz:", JSON.stringify(error, null, 2))
        }
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