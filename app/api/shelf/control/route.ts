import { NextResponse } from "next/server"

// In a real application, this would store the state for each shelf
// and could be a database or a cache like Redis.
const shelfStates: Record<string, { state: "on" | "off" | "blinking"; timestamp: number }> = {}

/**
 * API endpoint to control a shelf's LED.
 * The frontend sends commands here.
 */
export async function POST(request: Request) {
  try {
    const { shelfId, state } = await request.json()

    if (!shelfId || !["on", "off", "blinking"].includes(state)) {
      return NextResponse.json({ error: "Invalid shelfId or state" }, { status: 400 })
    }

    // Store the command for the ESP32 to retrieve
    shelfStates[shelfId] = { state, timestamp: Date.now() }
    console.log(`Command received: Turn shelf ${shelfId} LED ${state}`)

    // In a real-world scenario with a push mechanism (like MQTT or WebSockets),
    // you would publish the command here.

    return NextResponse.json({ success: true, message: `Command to set shelf ${shelfId} to ${state} has been queued.` })
  } catch (error) {
    console.error("Error in /api/shelf/control:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/**
 * API endpoint for the ESP32 to poll for commands.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const shelfId = searchParams.get("shelfId")

  if (!shelfId) {
    return NextResponse.json({ error: "shelfId is required" }, { status: 400 })
  }

  const command = shelfStates[shelfId]

  // Clear the command after it's been fetched to avoid re-execution.
  // A timestamp check prevents clearing a very recent command before it's processed.
  if (command) {
    delete shelfStates[shelfId]
  }

  if (command) {
    return NextResponse.json({ state: command.state })
  } else {
    // No new command, so return 'off' or no-op
    return NextResponse.json({ state: "off" })
  }
}
