"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, Loader2, Mail } from 'lucide-react'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [message, setMessage] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    const token = searchParams.get('token')
    const email = searchParams.get('email')
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success === 'true' && email) {
      setStatus('success')
      setMessage('Your email has been successfully verified!')
      setUserEmail(email)
    } else if (error) {
      setStatus('error')
      setMessage(decodeURIComponent(error))
    } else if (token && email) {
      verifyEmail(token, email)
    } else {
      setStatus('error')
      setMessage('Invalid verification link. Please check your email and try again.')
    }
  }, [searchParams])

  const verifyEmail = async (token: string, email: string) => {
    try {
      const response = await fetch('/api/user/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, email }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(data.message)
        setUserEmail(email)
      } else {
        if (data.error.includes('expired')) {
          setStatus('expired')
          setMessage(data.error)
        } else {
          setStatus('error')
          setMessage(data.error)
        }
        setUserEmail(email)
      }
    } catch (error) {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  const resendVerificationEmail = async () => {
    if (!userEmail) return

    setIsResending(true)
    try {
      const response = await fetch('/api/user/resend-verification-working', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('New verification email sent! Please check your inbox.')
      } else {
        setMessage(data.error || 'Failed to resend verification email.')
      }
    } catch (error) {
      setMessage('Network error. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-600" />
      case 'error':
      case 'expired':
        return <AlertCircle className="h-16 w-16 text-red-600" />
      default:
        return <Mail className="h-16 w-16 text-blue-600" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600'
      case 'success':
        return 'text-green-600'
      case 'error':
      case 'expired':
        return 'text-red-600'
      default:
        return 'text-blue-600'
    }
  }

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'Verifying Your Email...'
      case 'success':
        return 'Email Verified Successfully!'
      case 'error':
        return 'Verification Failed'
      case 'expired':
        return 'Verification Link Expired'
      default:
        return 'Email Verification'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className={`text-2xl ${getStatusColor()}`}>
            {getStatusTitle()}
          </CardTitle>
          <CardDescription className="text-center">
            {status === 'loading' && 'Please wait while we verify your email address...'}
            {status === 'success' && 'Your email has been successfully verified!'}
            {status === 'error' && 'There was an issue verifying your email.'}
            {status === 'expired' && 'Your verification link has expired.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              {message}
            </p>
            {userEmail && (
              <p className="text-sm font-medium text-gray-800">
                Email: {userEmail}
              </p>
            )}
          </div>

          {status === 'success' && (
            <div className="space-y-3">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 text-center">
                  🎉 Great! You can now log in to your Smart Library account and enjoy all the features.
                </p>
              </div>
              <Button 
                onClick={() => router.push('/')} 
                className="w-full"
              >
                Go to Login
              </Button>
            </div>
          )}

          {(status === 'error' || status === 'expired') && (
            <div className="space-y-3">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 text-center">
                  {status === 'expired' 
                    ? 'Your verification link has expired. Please request a new one.'
                    : 'There was an issue with your verification link. Please try again.'
                  }
                </p>
              </div>
              <Button 
                onClick={resendVerificationEmail}
                disabled={isResending}
                className="w-full"
                variant="outline"
              >
                {isResending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </Button>
              <Button 
                onClick={() => router.push('/')} 
                className="w-full"
                variant="ghost"
              >
                Back to Home
              </Button>
            </div>
          )}

          {status === 'loading' && (
            <div className="text-center">
              <p className="text-sm text-gray-500">
                This may take a few moments...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
