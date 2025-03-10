import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { WebSocket, WebSocketServer } from 'ws'
import type { IncomingMessage } from 'http'
import type { Duplex } from 'stream'

const wss = new WebSocketServer({ noServer: true })

export async function GET(request: NextRequest) {
  if (request.headers.get('upgrade') !== 'websocket') {
    return new NextResponse('Expected WebSocket connection', { status: 400 })
  }

  const { socket, response } = await new Promise<{ socket: WebSocket; response: Response }>((resolve) => {
    wss.handleUpgrade(request as IncomingMessage, request.socket as Duplex, Buffer.alloc(0), (ws: WebSocket) => {
      resolve({ socket: ws, response: new Response(null, { status: 101 }) })
    })
  })

  socket.on('message', (data: Buffer) => {
    wss.clients.forEach((client) => {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(data)
      }
    })
  })

  return response
}

export const runtime = 'edge'