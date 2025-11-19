import { NextResponse } from "next/server"

// LED states for each subject area
const ledStates: Record<number, { state: "on" | "off"; subject: string; timestamp: number }> = {}

// Subject to LED pin mapping
const subjectToLedPin: Record<string, number> = {
  "Mathematics": 1,
  "Science": 2,
  "Social Studies": 3,
  "PEHM": 4,
  "Values Education": 5,
  "TLE": 6
}

/**
 * API endpoint to control LED for a specific subject area.
 * The frontend sends commands here when a user searches for a book.
 */
export async function POST(request: Request) {
  try {
    const { subject, ledPin, state } = await request.json()

    if (!subject || !["on", "off"].includes(state)) {
      return NextResponse.json({ error: "Invalid subject or state" }, { status: 400 })
    }

    // Use the provided LED pin or get it from subject mapping
    const pin = ledPin || subjectToLedPin[subject]
    
    if (!pin || pin < 1 || pin > 6) {
      return NextResponse.json({ error: "Invalid LED pin" }, { status: 400 })
    }

    // Store the command for the ESP32 to retrieve
    ledStates[pin] = { state, subject, timestamp: Date.now() }
    console.log(`Command received: Turn ${subject} LED (Pin ${pin}) ${state}`)

    return NextResponse.json({ 
      success: true, 
      message: `Command to set ${subject} LED (Pin ${pin}) to ${state} has been queued.`,
      ledPin: pin,
      subject: subject
    })
  } catch (error) {
    console.error("Error in /api/led/control:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/**
 * API endpoint for the ESP32 to poll for LED commands.
 * Returns the current state of all LEDs.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ledPin = searchParams.get("ledPin")

    if (ledPin) {
      // Return specific LED state
      const pin = parseInt(ledPin)
      const state = ledStates[pin]
      
      if (state) {
        // Clear the command after it's been fetched
        delete ledStates[pin]
        return NextResponse.json({ 
          ledPin: pin, 
          state: state.state, 
          subject: state.subject 
        })
      } else {
        return NextResponse.json({ ledPin: pin, state: "off", subject: "" })
      }
    } else {
      // Return all LED states
      const allStates = {}
      for (let pin = 1; pin <= 6; pin++) {
        const state = ledStates[pin]
        allStates[pin] = {
          state: state ? state.state : "off",
          subject: state ? state.subject : "",
          timestamp: state ? state.timestamp : null
        }
      }
      return NextResponse.json(allStates)
    }
  } catch (error) {
    console.error("Error in /api/led/control GET:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
