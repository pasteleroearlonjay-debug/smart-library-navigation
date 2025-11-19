"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Clock, CheckCircle, AlertTriangle, Mail, BookOpen, Calendar } from 'lucide-react'

interface UserNotification {
  id: number
  type: string
  title: string
  message: string
  isRead: boolean
  created_at: string
  read_at?: string
}

interface Stats {
  totalNotifications: number
  unreadNotifications: number
  overdueItems: number
  dueSoonItems: number
}

export default function UserNotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [stats, setStats] = useState<Stats>({
    totalNotifications: 0,
    unreadNotifications: 0,
    overdueItems: 0,
    dueSoonItems: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('userToken')
    const user = localStorage.getItem('userData')

    if (!token || !user) {
      router.push('/')
      return
    }

    // Validate token with server before loading data
    validateUserSession(token)
  }, [router])

  const validateUserSession = async (token: string) => {
    try {
      // Verify the token is valid by making a test API call
      const response = await fetch('/api/user/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        // Token is valid, load notifications
        fetchNotifications()
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

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('userToken')
      
      const response = await fetch('/api/user/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setStats({
          totalNotifications: data.notifications?.length || 0,
          unreadNotifications: data.notifications?.filter((n: UserNotification) => !n.isRead).length || 0,
          overdueItems: data.overdueItems || 0,
          dueSoonItems: data.dueSoonItems || 0
        })
      } else {
        console.error('Failed to fetch notifications')
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('userToken')
      
      const response = await fetch(`/api/user/notifications/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true, read_at: new Date().toISOString() }
              : notification
          )
        )
        
        // Update stats
        setStats(prev => ({
          ...prev,
          unreadNotifications: prev.unreadNotifications - 1
        }))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('userToken')
      
      const unreadIds = notifications
        .filter(n => !n.isRead)
        .map(n => n.id)

      for (const id of unreadIds) {
        await markNotificationAsRead(id)
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "due_reminder":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Due Reminder</Badge>
      case "overdue":
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Overdue</Badge>
      case "book_ready":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Book Ready</Badge>
      case "welcome":
        return <Badge className="bg-blue-100 text-blue-800"><Mail className="h-3 w-3 mr-1" />Welcome</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Notifications</h1>
          <p className="text-lg text-gray-600">Stay updated with your library activities</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalNotifications}</p>
                </div>
                <Bell className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unread</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.unreadNotifications}</p>
                </div>
                <Mail className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Due Soon</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.dueSoonItems}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overdueItems}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        {stats.unreadNotifications > 0 && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">You have {stats.unreadNotifications} unread notifications</h3>
                  <p className="text-sm text-gray-600">Click on notifications to mark them as read</p>
                </div>
                <Button onClick={markAllAsRead} variant="outline">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark All as Read
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Your library notifications and reminders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      notification.isRead 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                    }`}
                    onClick={() => !notification.isRead && markNotificationAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getTypeBadge(notification.type)}
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <h4 className={`font-medium mb-1 ${
                          notification.isRead ? 'text-gray-700' : 'text-blue-900'
                        }`}>
                          {notification.title}
                        </h4>
                        <p className={`text-sm ${
                          notification.isRead ? 'text-gray-600' : 'text-blue-700'
                        }`}>
                          {notification.message}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 ml-4">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(notification.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
                <p className="text-gray-600 mb-6">
                  You'll receive notifications about book deadlines, ready requests, and other library updates here.
                </p>
                <Button onClick={() => router.push('/user-dashboard')} variant="outline">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
