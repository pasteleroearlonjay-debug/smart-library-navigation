"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Mail, Send, CheckCircle, AlertTriangle } from 'lucide-react'

export default function TestEmailPage() {
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("Test Email from Smart Library System")
  const [message, setMessage] = useState("This is a test email to verify that the email system is working correctly.")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{success: boolean, message: string} | null>(null)

  const handleSendTestEmail = async () => {
    if (!email || !subject || !message) {
      setResult({ success: false, message: "Please fill in all fields" })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: subject,
          message: message,
          type: 'test'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: "Email sent successfully! Check your inbox." })
      } else {
        setResult({ success: false, message: data.error || "Failed to send email" })
      }
    } catch (error) {
      setResult({ success: false, message: "Network error. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const sendSampleNotifications = async () => {
    const sampleEmails = [
      {
        to: email,
        subject: "📚 Book Due Reminder",
        message: `Dear Student,\n\nYour book "Mathematics Fundamentals" is due in 2 days (January 25, 2024).\n\nPlease return it to the library or renew it online.\n\nThank you!`,
        type: 'due_reminder'
      },
      {
        to: email,
        subject: "📖 Book Ready for Pickup",
        message: `Dear Student,\n\nYour requested book "Advanced Physics" is now ready for pickup!\n\nPlease visit the library during operating hours to collect your book.\n\nLocation: Main Library, Desk 3\n\nThank you!`,
        type: 'book_ready'
      },
      {
        to: email,
        subject: "👋 Welcome to Smart Library System",
        message: `Welcome to our Smart Library System!\n\nYour account has been created successfully.\n\nYou can now:\n- Search and borrow books\n- Request books online\n- Track your borrowing history\n- Receive email notifications\n\nLogin at: ${process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}\n\nThank you for joining us!`,
        type: 'welcome'
      }
    ]

    setIsLoading(true)
    setResult(null)

    try {
      for (const emailData of sampleEmails) {
        const response = await fetch('/api/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData)
        })

        if (!response.ok) {
          throw new Error(`Failed to send ${emailData.type}`)
        }

        // Wait 1 second between emails
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      setResult({ success: true, message: "All sample notifications sent successfully!" })
    } catch (error) {
      setResult({ success: false, message: "Failed to send some notifications" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📧 Email System Test</h1>
          <p className="text-lg text-gray-600">Test the email functionality of your Smart Library System</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Email Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Send Test Email
              </CardTitle>
              <CardDescription>
                Send a custom test email to verify the system is working
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Recipient Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your-email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleSendTestEmail} 
                disabled={isLoading}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {isLoading ? 'Sending...' : 'Send Test Email'}
              </Button>
            </CardContent>
          </Card>

          {/* Sample Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Sample Notifications
              </CardTitle>
              <CardDescription>
                Send sample library notifications to test different email types
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Badge variant="outline">Due Reminder</Badge>
                  <span className="text-sm">Book due in 2 days</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <Badge variant="outline">Book Ready</Badge>
                  <span className="text-sm">Requested book is ready</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                  <Badge variant="outline">Welcome</Badge>
                  <span className="text-sm">New user welcome email</span>
                </div>
              </div>
              <Button 
                onClick={sendSampleNotifications} 
                disabled={isLoading || !email}
                variant="outline"
                className="w-full"
              >
                <Mail className="h-4 w-4 mr-2" />
                {isLoading ? 'Sending...' : 'Send All Samples'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Result Display */}
        {result && (
          <Card className="mt-8">
            <CardContent className="pt-6">
              <div className={`flex items-center gap-3 p-4 rounded-lg ${
                result.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                {result.success ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                )}
                <div>
                  <p className={`font-medium ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.success ? 'Success!' : 'Error'}
                  </p>
                  <p className={`text-sm ${
                    result.success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {result.message}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Email Service Status */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Email Service Status</CardTitle>
            <CardDescription>
              Current email service configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Service Type</h4>
                <p className="text-sm text-gray-600">
                  {process.env.NEXT_PUBLIC_EMAIL_SERVICE || 'Not configured'}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">From Email</h4>
                <p className="text-sm text-gray-600">
                  {process.env.NEXT_PUBLIC_FROM_EMAIL || 'Not configured'}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Status</h4>
                <Badge variant={process.env.NEXT_PUBLIC_EMAIL_SERVICE ? "default" : "destructive"}>
                  {process.env.NEXT_PUBLIC_EMAIL_SERVICE ? 'Configured' : 'Not Configured'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

