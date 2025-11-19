"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { BookOpen, Users, Lightbulb, Mail, BarChart3, Bell, Clock, AlertTriangle, CheckCircle, Calendar, Plus } from 'lucide-react'
import Link from "next/link"

export default function UserDashboard() {
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [books, setBooks] = useState<any[]>([])
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [selectedBook, setSelectedBook] = useState<any>(null)
  const [borrowingDays, setBorrowingDays] = useState(7)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('userToken')
    const user = localStorage.getItem('userData')

    if (!token || !user) {
      router.push('/')
      return
    }

    // Validate token with server
    validateUserSession(token, user)
  }, [router])

  const validateUserSession = async (token: string, userString: string) => {
    try {
      // Verify the token is valid by making a test API call
      const response = await fetch('/api/user/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        // Token is valid, set user data and load notifications
        const userData = JSON.parse(userString)
        setUserData(userData)
        loadNotifications()
        loadBooks()
        setIsLoading(false)
      } else {
        // Token is invalid, clear storage and redirect
        console.error('Invalid or expired token')
        localStorage.removeItem('userToken')
        localStorage.removeItem('userData')
        router.push('/')
      }
    } catch (error) {
      console.error('Session validation failed:', error)
      localStorage.removeItem('userToken')
      localStorage.removeItem('userData')
      router.push('/')
    }
  }

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('userToken')
      const response = await fetch('/api/user/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (response.ok) {
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }

  const loadBooks = async () => {
    try {
      const response = await fetch('/api/books')
      const data = await response.json()
      
      if (response.ok) {
        setBooks(data.books || [])
      }
    } catch (error) {
      console.error('Failed to load books:', error)
    }
  }

  const handleRequestBook = (book: any) => {
    setSelectedBook(book)
    setShowRequestDialog(true)
  }

  const submitBookRequest = async () => {
    if (!selectedBook || !userData) return

    try {
      const token = localStorage.getItem('userToken')
      // Get the numeric user ID from library_members table
      let userId = 1 // Default fallback
      
      if (userData.email) {
        // Try to get the numeric ID from library_members by email
        const memberResponse = await fetch('/api/user/get-member-id', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: userData.email, name: userData.name || userData.full_name })
        })
        
        if (memberResponse.ok) {
          const memberData = await memberResponse.json()
          userId = memberData.memberId || 1
        }
      } else {
        userId = userData.id || userData.user_id || 1
      }
      
      const response = await fetch('/api/user/request-book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookId: selectedBook.id,
          borrowingDays: borrowingDays,
          userId: userId,
          email: userData.email,
          name: userData.name || userData.full_name
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Book request submitted successfully! Admin will review your request.')
        setShowRequestDialog(false)
        setSelectedBook(null)
        setBorrowingDays(7)
        loadBooks() // Refresh book availability
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error submitting book request:', error)
      alert('Failed to submit book request. Please try again.')
    }
  }

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      await fetch(`/api/user/notifications/${notificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      })
      loadNotifications(userData.id)
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/user/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData?.id })
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
    
    localStorage.removeItem('userToken')
    localStorage.removeItem('userData')
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const stats = [
    { 
      title: "Books Borrowed", 
      value: userData?.borrowedCount || 0, 
      icon: BookOpen, 
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    { 
      title: "Overdue Items", 
      value: userData?.overdueCount || 0, 
      icon: AlertTriangle, 
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    { 
      title: "Ready Books", 
      value: "2", 
      icon: CheckCircle, 
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    { 
      title: "Notifications", 
      value: unreadCount.toString(), 
      icon: Bell, 
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ]

  const recentActivity = [
    { action: "Book borrowed", book: "Algebra Fundamentals", time: "2 days ago", status: "active" },
    { action: "Book returned", book: "Physics Principles", time: "1 week ago", status: "completed" },
    { action: "Book requested", book: "Advanced Calculus", time: "3 days ago", status: "ready" },
    { action: "Deadline reminder", book: "Chemistry Basics", time: "1 day ago", status: "warning" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">User Dashboard</h1>
          <p className="text-lg text-gray-600">Welcome to your Smart Library account</p>
          {userData && (
            <div className="mt-2">
              <Badge variant="secondary" className="text-sm">
                {userData.name} • {userData.email}
              </Badge>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <IconComponent className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Dashboard & Search & Light */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dashboard Tab */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Dashboard
                </CardTitle>
                <CardDescription>
                  Your library activity overview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Recent Activity</h3>
                    <div className="space-y-2">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              activity.status === 'active' ? 'bg-blue-500' :
                              activity.status === 'completed' ? 'bg-green-500' :
                              activity.status === 'ready' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`} />
                            <span>{activity.action}</span>
                          </div>
                          <span className="text-gray-500">{activity.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search & Light Tab */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Search & Light
                </CardTitle>
                <CardDescription>
                  Find books with intelligent LED guidance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">Quick Search</h3>
                    <p className="text-sm text-green-700 mb-3">
                      Search for books and get LED guidance to their location
                    </p>
                    <Link href="/search">
                      <Button className="w-full">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Go to Search & Light
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Books Tab */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Available Books
                </CardTitle>
                <CardDescription>
                  Browse and request books to borrow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {books.length > 0 ? (
                    books.slice(0, 5).map((book) => (
                      <div key={book.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{book.title}</h4>
                            <p className="text-sm text-gray-600">by {book.author}</p>
                            <p className="text-xs text-gray-500 mt-1">Subject: {book.subject}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">Available: {book.available ? 'Yes' : 'No'}</Badge>
                              {book.quantity && (
                                <Badge variant="secondary">Qty: {book.quantity}</Badge>
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            {book.available ? (
                              <Button 
                                size="sm" 
                                onClick={() => handleRequestBook(book)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Request
                              </Button>
                            ) : (
                              <Button size="sm" disabled variant="outline">
                                Unavailable
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Loading books...</p>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push('/books')}
                    >
                      View All Books
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Notifications */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </div>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {unreadCount} new
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Book deadlines and ready requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          notification.isRead 
                            ? 'bg-gray-50 border-gray-200' 
                            : 'bg-blue-50 border-blue-200'
                        }`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              notification.isRead ? 'text-gray-700' : 'text-blue-900'
                            }`}>
                              {notification.title}
                            </p>
                            <p className={`text-xs mt-1 ${
                              notification.isRead ? 'text-gray-500' : 'text-blue-700'
                            }`}>
                              {notification.message}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No notifications yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions removed per request */}
          </div>
        </div>
      </div>

      {/* Book Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Book</DialogTitle>
            <DialogDescription>
              Submit a request to borrow "{selectedBook?.title}"
            </DialogDescription>
          </DialogHeader>
          {selectedBook && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold">{selectedBook.title}</h4>
                <p className="text-sm text-gray-600">by {selectedBook.author}</p>
                <p className="text-sm text-gray-500">Subject: {selectedBook.subject}</p>
              </div>
              
              <div>
                <Label htmlFor="borrowing-days">Borrowing Period (Days)</Label>
                <Input
                  id="borrowing-days"
                  type="number"
                  min="1"
                  max="30"
                  value={borrowingDays}
                  onChange={(e) => setBorrowingDays(parseInt(e.target.value) || 7)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Choose how many days you want to borrow this book (1-30 days)
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowRequestDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={submitBookRequest}>
                  Submit Request
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
