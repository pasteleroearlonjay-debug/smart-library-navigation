"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen, User, Lock, Mail, Shield, AlertCircle, Eye, EyeOff } from 'lucide-react'

export default function WelcomePage() {
  const router = useRouter()
  const [showUserLogin, setShowUserLogin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // User login state
  const [userLogin, setUserLogin] = useState({
    email: "",
    password: ""
  })

  // User signup state
  const [userSignup, setUserSignup] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch('/api/user/login-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userLogin),
      })

      const data = await response.json()

      if (response.ok) {
        // Store user session
        localStorage.setItem('userToken', data.token)
        localStorage.setItem('userData', JSON.stringify(data.user))
        
        // Redirect to user dashboard
        router.push('/user-dashboard')
      } else {
        setError(data.error || 'Invalid credentials')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (userSignup.password !== userSignup.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/user/signup-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userSignup.name,
          email: userSignup.email,
          password: userSignup.password
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setError("")
        alert("Account created successfully! Please check your email for verification.")
        setShowSignup(false)
        setShowUserLogin(true)
      } else {
        setError(data.error || 'Signup failed')
      }
    } catch (err) {
      setError('Signup failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminLogin = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-6 rounded-full shadow-lg">
              <BookOpen className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Smart Library System
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            ESP32-Enabled LED Lighting System with Intelligent Book Management
          </p>
          <div className="mt-6">
            <Button
              onClick={handleAdminLogin}
              variant="outline"
              className="bg-white hover:bg-gray-50 border-2 border-blue-600 text-blue-600 hover:text-blue-700 px-6 py-3"
            >
              <Shield className="h-5 w-5 mr-2" />
              Admin Login
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left Side - Welcome Content */}
          <div className="space-y-8">
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Welcome to Our Smart Library</CardTitle>
                <CardDescription className="text-center text-lg">
                  Experience the future of library management with intelligent LED lighting and seamless book discovery.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                    <div className="bg-blue-600 p-2 rounded-full">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">Smart Search</h3>
                      <p className="text-sm text-blue-700">Find books instantly with LED guidance</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                    <div className="bg-green-600 p-2 rounded-full">
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-900">Email Notifications</h3>
                      <p className="text-sm text-green-700">Stay updated on deadlines and requests</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-6 rounded-lg">
                  <h3 className="font-bold text-lg mb-3 text-gray-800">System Features:</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      ESP32-powered LED shelf lighting
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      Real-time book availability tracking
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      Automated deadline reminders
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      Book request and notification system
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - User Login/Signup */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md shadow-2xl border-0">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">
                  {showSignup ? "Create Account" : "User Login"}
                </CardTitle>
                <CardDescription>
                  {showSignup 
                    ? "Join our smart library community" 
                    : "Access your library account"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!showUserLogin && !showSignup ? (
                  <div className="space-y-4">
                    <Button
                      onClick={() => setShowUserLogin(true)}
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg"
                    >
                      <User className="h-5 w-5 mr-2" />
                      User Login
                    </Button>
                    <Button
                      onClick={() => setShowSignup(true)}
                      variant="outline"
                      className="w-full h-12 text-lg"
                    >
                      <Mail className="h-5 w-5 mr-2" />
                      Create New Account
                    </Button>
                  </div>
                ) : showSignup ? (
                  <form onSubmit={handleUserSignup} className="space-y-4">
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Full Name
                      </Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={userSignup.name}
                        onChange={(e) => setUserSignup({...userSignup, name: e.target.value})}
                        required
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={userSignup.email}
                        onChange={(e) => setUserSignup({...userSignup, email: e.target.value})}
                        required
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showSignupPassword ? "text" : "password"}
                          placeholder="Create a password"
                          value={userSignup.password}
                          onChange={(e) => setUserSignup({...userSignup, password: e.target.value})}
                          required
                          className="h-11 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Confirm Password
                      </Label>
                      <Input
                        id="signup-confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        value={userSignup.confirmPassword}
                        onChange={(e) => setUserSignup({...userSignup, confirmPassword: e.target.value})}
                        required
                        className="h-11"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 bg-blue-600 hover:bg-blue-700"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Creating Account...
                        </div>
                      ) : (
                        'Create Account'
                      )}
                    </Button>

                    <Button
                      type="button"
                      onClick={() => setShowSignup(false)}
                      variant="ghost"
                      className="w-full"
                    >
                      Back to Login
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleUserLogin} className="space-y-4">
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="user-email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </Label>
                      <Input
                        id="user-email"
                        type="email"
                        placeholder="Enter your email"
                        value={userLogin.email}
                        onChange={(e) => setUserLogin({...userLogin, email: e.target.value})}
                        required
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user-password" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="user-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={userLogin.password}
                          onChange={(e) => setUserLogin({...userLogin, password: e.target.value})}
                          required
                          className="h-11 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 bg-blue-600 hover:bg-blue-700"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Logging in...
                        </div>
                      ) : (
                        'Login'
                      )}
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowSignup(true)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Don't have an account? Create one
                      </button>
                    </div>

                    <Button
                      type="button"
                      onClick={() => setShowUserLogin(false)}
                      variant="ghost"
                      className="w-full"
                    >
                      Back
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-gray-600">
          <p>© 2024 Smart Library System. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
