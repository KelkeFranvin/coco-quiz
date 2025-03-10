import { Server } from 'socket.io'
import type { NextApiRequest, NextApiResponse } from 'next'

const ioHandler = (req: NextApiRequest, res: NextApiResponse) => {
  // @ts-expect-error Server implementation type mismatch
  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server...')
    // @ts-expect-error Server implementation type mismatch
    const io = new Server(res.socket.server, {
      path: '/api/socketio',
      addTrailingSlash: false,
    })
    
    io.on('connection', socket => {
      console.log('Client connected:', socket.id)

      socket.on('reset-quiz', data => {
        console.log('Reset quiz event:', data)
        io.emit('quiz-reset', data)
      })

      socket.on('new-answer', data => {
        console.log('New answer event:', data)
        io.emit('answer-submitted', data)
      })

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })
    })

    // @ts-expect-error Server implementation type mismatch
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