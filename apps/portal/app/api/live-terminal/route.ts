import { NextRequest } from 'next/server'

// This endpoint provides Server-Sent Events (SSE) for streaming build output
// It queries the AntFarm SQLite DB for real-time logs

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder()

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      try {
        // Send initial connection message
        sendEvent({
          type: 'connected',
          message: 'Connected to live terminal',
          timestamp: new Date().toISOString(),
        })

        // In production, you would:
        // 1. Connect to AntFarm SQLite DB on the Raspberry Pi
        // 2. Poll for new log entries
        // 3. Send logs as SSE events

        // Example polling logic (simplified):
        let lastLogId = 0

        const pollInterval = setInterval(async () => {
          try {
            // Query AntFarm SQLite DB for logs since lastLogId
            // This is a placeholder - in production, you'd use proper DB connection
            const newLogs = await fetchNewLogs(lastLogId)

            if (newLogs.length > 0) {
              newLogs.forEach((log) => {
                sendEvent({
                  type: 'log',
                  level: log.level,
                  message: log.message,
                  timestamp: log.timestamp,
                  runId: log.runId,
                })

                lastLogId = Math.max(lastLogId, log.id)
              })
            }
          } catch (error) {
            console.error('Error polling logs:', error)
            sendEvent({
              type: 'error',
              message: 'Error fetching logs',
            })
          }
        }, 1000) // Poll every second

        // Keep connection alive
        const keepAliveInterval = setInterval(() => {
          sendEvent({
            type: 'keepalive',
            timestamp: new Date().toISOString(),
          })
        }, 30000) // Send keepalive every 30 seconds

        // Clean up on client disconnect
        req.signal.addEventListener('abort', () => {
          clearInterval(pollInterval)
          clearInterval(keepAliveInterval)
          controller.close()
        })
      } catch (error) {
        sendEvent({
          type: 'error',
          message: error instanceof Error ? error.message : 'Internal server error',
        })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  })
}

// Placeholder function to fetch new logs from AntFarm SQLite DB
async function fetchNewLogs(sinceId: number): Promise<
  Array<{
    id: number
    level: string
    message: string
    timestamp: string
    runId: string
  }>
> {
  // In production, this would:
  // 1. Connect to the AntFarm SQLite DB on the Raspberry Pi
  // 2. Query the logs table for entries with id > sinceId
  // 3. Return the results

  // For now, return empty array
  return []

  // Example query (when AntFarm DB is accessible):
  // const db = getAntFarmDb()
  // const logs = db.prepare('SELECT * FROM logs WHERE id > ? ORDER BY id').all(sinceId)
  // return logs
}
