"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { BookOpen, Lightbulb, BarChart3, Bell, Clock, AlertTriangle, CheckCircle, Calendar, Plus, RefreshCw, ThumbsUp, XCircle, Package } from 'lucide-react'
import Link from "next/link"

export default function UserDashboard() {
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [dashboardStats, setDashboardStats] = useState({
    booksBorrowed: 0,
    overdueItems: 0,
    readyBooks: 0,
    collectedBooks: 0,
    unreadNotifications: 0
  })
  const [dueSoonBooks, setDueSoonBooks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [books, setBooks] = useState<any[]>([])
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [selectedBook, setSelectedBook] = useState<any>(null)
  const [borrowingDays, setBorrowingDays] = useState(7)
  const [currentTime, setCurrentTime] = useState(Date.now())
  const [isRefreshing, setIsRefreshing] = useState(false)

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

  // Timer updates every second for live countdown
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    return () => clearInterval(timerInterval)
  }, [])

  // Refresh dashboard data every 10 seconds to get new notifications and stats
  useEffect(() => {
    if (!userData || isLoading) return
    
    const refreshInterval = setInterval(() => {
      loadDashboardData()
    }, 10000) // Refresh every 10 seconds for better real-time feel
    
    return () => clearInterval(refreshInterval)
  }, [userData, isLoading])

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
        loadDashboardData()
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

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('userToken')
      if (!token) return
      
      const response = await fetch('/api/user/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (response.ok) {
        console.log('Loaded notifications:', data.notifications?.length || 0)
        console.log('Notification data:', data.notifications)
        setNotifications(data.notifications || [])
        setDashboardStats({
          booksBorrowed: data.booksBorrowed || 0,
          overdueItems: data.overdueItems || 0,
          readyBooks: data.readyBooksCount || 0,
          collectedBooks: data.collectedBooksCount || 0,
          unreadNotifications: data.unreadCount || 0
        })
        setDueSoonBooks(data.dueSoonBooks || [])
      } else {
        console.error('Failed to load dashboard data:', data)
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
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
        loadDashboardData()
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
      const token = localStorage.getItem('userToken')
      await fetch(`/api/user/notifications/${notificationId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ isRead: true })
      })
      loadDashboardData()
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

  const formatCountdown = (dueDate: string) => {
    try {
      const due = new Date(dueDate)
      if (isNaN(due.getTime())) return 'Invalid date'
      
      const diffMs = due.getTime() - currentTime
      const absMs = Math.abs(diffMs)
      const totalSeconds = Math.floor(absMs / 1000)
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60

      if (diffMs <= 0) {
        const overdueHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60))
        const overdueMinutes = Math.floor((Math.abs(diffMs) % (1000 * 60 * 60)) / (1000 * 60))
        return `Overdue ${overdueHours}h ${overdueMinutes}m`
      }

      if (hours >= 24) {
        const days = Math.floor(hours / 24)
        const remainingHours = hours % 24
        return `${days}d ${remainingHours}h`
      }

      // Show countdown in format: "Xh Ym" or "Xh Ym Zs" if less than 1 hour
      if (hours > 0) {
        return `${hours}h ${minutes}m`
      } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`
      } else {
        return `${seconds}s`
      }
    } catch (error) {
      return 'Error calculating time'
    }
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
      value: dashboardStats.booksBorrowed, 
      icon: BookOpen, 
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    { 
      title: "Overdue Items", 
      value: dashboardStats.overdueItems, 
      icon: AlertTriangle, 
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "Ready Books",
      value: dashboardStats.readyBooks,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Collected Books",
      value: dashboardStats.collectedBooks,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ]

  // Show empty recent activity for new users (no hardcoded activities)
  const recentActivity: any[] = []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1"></div>
            <h1 className="text-4xl font-bold text-gray-900">User Dashboard</h1>
            <div className="flex-1 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadDashboardData(true)}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
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
            {/* Due Soon Countdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Due Soon (Next 24 Hours)
                </CardTitle>
                <CardDescription>
                  Track books that need to be returned or renewed soon
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dueSoonBooks.length > 0 ? (
                  <div className="space-y-3">
                    {dueSoonBooks.map((book) => {
                      const dueDate = new Date(book.dueDate)
                      const diffMs = dueDate.getTime() - currentTime
                      const hoursRemaining = Math.ceil(diffMs / (1000 * 60 * 60))
                      const isOverdue = diffMs < 0
                      const isUrgent = !isOverdue && hoursRemaining <= 6
                      const isWarning = !isOverdue && hoursRemaining <= 12
                      
                      return (
                        <div
                          key={book.id}
                          className={`border rounded-lg p-4 transition-all ${
                            isOverdue 
                              ? 'bg-red-50 border-red-200' 
                              : isUrgent 
                              ? 'bg-orange-50 border-orange-200' 
                              : isWarning 
                              ? 'bg-yellow-50 border-yellow-200' 
                              : 'bg-green-50 border-green-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 mb-1">{book.title}</p>
                              <p className="text-xs text-gray-500">
                                Due {dueDate.toLocaleString()}
                              </p>
                            </div>
                            <div className="ml-4 text-right">
                              <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-sm font-bold ${
                                isOverdue 
                                  ? 'bg-red-100 text-red-700' 
                                  : isUrgent 
                                  ? 'bg-orange-100 text-orange-700' 
                                  : isWarning 
                                  ? 'bg-yellow-100 text-yellow-700' 
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                <Clock className="h-4 w-4" />
                                <span>{formatCountdown(book.dueDate)}</span>
                              </div>
                            </div>
                          </div>
                          {/* Progress bar */}
                          {!isOverdue && (
                            <div className="mt-3">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all ${
                                    isUrgent ? 'bg-orange-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ 
                                    width: `${Math.min(100, Math.max(0, (hoursRemaining / 24) * 100))}%` 
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center text-sm text-gray-500 py-4">
                    No books due within the next 24 hours.
                  </div>
                )}
              </CardContent>
            </Card>

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
                      {recentActivity.length > 0 ? (
                        recentActivity.map((activity, index) => (
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
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 text-center py-2">
                          No recent activity. Start by searching for books!
                        </div>
                      )}
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
                  {dashboardStats.unreadNotifications > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {dashboardStats.unreadNotifications} new
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Book deadlines and ready requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-3">
                   {notifications && notifications.length > 0 ? (
                     notifications.slice(0, 5).map((notification) => {
                       const isRead = notification.is_read === true || notification.isRead === true
                       const notificationType = notification.type || ''
                       
                       // Get icon and color based on notification type
                       let IconComponent = Bell
                       let iconColor = 'text-blue-500'
                       let bgColor = isRead ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                       
                       if (notificationType.includes('approved') || notificationType === 'book_approved') {
                         IconComponent = ThumbsUp
                         iconColor = 'text-green-500'
                         bgColor = isRead ? 'bg-gray-50 border-gray-200' : 'bg-green-50 border-green-200'
                       } else if (notificationType.includes('declined') || notificationType === 'book_declined') {
                         IconComponent = XCircle
                         iconColor = 'text-red-500'
                         bgColor = isRead ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-200'
                       } else if (notificationType.includes('received') || notificationType === 'book_received' || notificationType === 'book_ready') {
                         IconComponent = Package
                         iconColor = 'text-purple-500'
                         bgColor = isRead ? 'bg-gray-50 border-gray-200' : 'bg-purple-50 border-purple-200'
                       } else if (notificationType.includes('overdue') || notificationType === 'overdue_notice') {
                         IconComponent = AlertTriangle
                         iconColor = 'text-red-500'
                         bgColor = isRead ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-200'
                       } else if (notificationType.includes('deadline') || notificationType === 'deadline_reminder') {
                         IconComponent = Clock
                         iconColor = 'text-orange-500'
                         bgColor = isRead ? 'bg-gray-50 border-gray-200' : 'bg-orange-50 border-orange-200'
                       }
                       
                       return (
                         <div 
                           key={notification.id} 
                           className={`p-3 rounded-lg border cursor-pointer transition-colors ${bgColor}`}
                           onClick={() => !isRead && markNotificationAsRead(notification.id)}
                         >
                           <div className="flex items-start gap-3">
                             <div className={`mt-0.5 ${iconColor}`}>
                               <IconComponent className="h-5 w-5" />
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className={`text-sm font-medium ${
                                 isRead ? 'text-gray-700' : 'text-gray-900'
                               }`}>
                                 {notification.title || 'Notification'}
                               </p>
                               <p className={`text-xs mt-1 ${
                                 isRead ? 'text-gray-500' : 'text-gray-700'
                               }`}>
                                 {notification.message || ''}
                               </p>
                               {notification.type && (
                                 <Badge variant="outline" className="mt-1 text-xs">
                                   {notification.type.replace('_', ' ')}
                                 </Badge>
                               )}
                             </div>
                             <div className="flex flex-col items-end gap-1">
                               <span className="text-xs text-gray-400">
                                 {notification.created_at 
                                   ? new Date(notification.created_at).toLocaleDateString()
                                   : 'Recently'}
                               </span>
                               {!isRead && (
                                 <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                               )}
                             </div>
                           </div>
                         </div>
                       )
                     })
                   ) : (
                     <div className="text-center py-4">
                       <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                       <p className="text-sm text-gray-500">No notifications yet</p>
                       <p className="text-xs text-gray-400 mt-1">
                         You'll see notifications here when your book requests are updated
                       </p>
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
