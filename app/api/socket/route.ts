import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  if (request.headers.get('upgrade') !== 'websocket') {
    return new NextResponse('Expected WebSocket connection', { status: 400 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    // Hier können wir optional Token-Validierung durchführen
    if (token) {
      console.log('Token received:', token)
    }

    const webSocketServerURL = process.env.WEBSOCKET_SERVER_URL || 'ws://localhost:3001'
    const upgradeHeader = request.headers.get('upgrade') || ''

    if (upgradeHeader.toLowerCase() !== 'websocket') {
      return new NextResponse('Expected WebSocket connection', { status: 400 })
    }

    return new NextResponse(null, {
      status: 101,
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Accept': request.headers.get('sec-websocket-key') || '',
        'Sec-WebSocket-Protocol': request.headers.get('sec-websocket-protocol') || '',
      },
    })
  } catch (error) {
    console.error('WebSocket setup error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export const runtime = 'edge'