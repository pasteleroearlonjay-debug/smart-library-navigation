"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Clock, CheckCircle, AlertTriangle, Send, RefreshCw, Bell } from 'lucide-react'
import { AdminSidebar } from "@/components/admin-sidebar"

interface EmailNotification {
  id: number
  type: string
  user: string
  email: string
  book: string
  dueDate: string
  daysUntilDue: number
  status: string
  scheduledTime: string
  sentTime?: string
  message?: string
}

interface UserNotification {
  id: number
  type: string
  user: string
  email: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  readAt?: string
}

interface DueDateAnalysis {
  id: number
  user: string
  email: string
  book: string
  dueDate: string
  daysUntilDue: number
  status: string
  borrowedDate: string
}

interface Stats {
  totalEmailNotifications: number
  pendingEmailNotifications: number
  sentEmailNotifications: number
  totalUserNotifications: number
  unreadUserNotifications: number
  overdueItems: number
  dueSoonItems: number
}

export default function NotificationsPage() {
  const router = useRouter()
  const [emailNotifications, setEmailNotifications] = useState<EmailNotification[]>([])
  const [userNotifications, setUserNotifications] = useState<UserNotification[]>([])
  const [dueDateAnalysis, setDueDateAnalysis] = useState<DueDateAnalysis[]>([])
  const [stats, setStats] = useState<Stats>({
    totalEmailNotifications: 0,
    pendingEmailNotifications: 0,
    sentEmailNotifications: 0,
    totalUserNotifications: 0,
    unreadUserNotifications: 0,
    overdueItems: 0,
    dueSoonItems: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // Check admin authentication
    const adminToken = localStorage.getItem('adminToken')
    const adminUser = localStorage.getItem('adminUser')

    if (!adminToken || !adminUser) {
      router.push('/login')
      return
    }

    fetchNotifications()
  }, [router])

  const fetchNotifications = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const adminUser = localStorage.getItem('adminUser')
      
      const response = await fetch('/api/admin/notifications', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-user': adminUser || ''
        }
      })

      if (response.ok) {
        const data = await response.json()
        setEmailNotifications(data.emailNotifications)
        setUserNotifications(data.userNotifications)
        setDueDateAnalysis(data.dueDateAnalysis)
        setStats(data.stats)
      } else {
        console.error('Failed to fetch notifications')
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendPending = async () => {
    setIsProcessing(true)
    try {
      const adminToken = localStorage.getItem('adminToken')
      const adminUser = localStorage.getItem('adminUser')
      
      const pendingIds = emailNotifications
        .filter(n => n.status === 'pending')
        .map(n => n.id)

      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-user': adminUser || ''
        },
        body: JSON.stringify({
          action: 'send_pending',
          notificationIds: pendingIds
        })
      })

      if (response.ok) {
        alert('Pending notifications sent successfully!')
        fetchNotifications() // Refresh the data
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error sending notifications:', error)
      alert('Failed to send notifications')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateReminders = async () => {
    setIsProcessing(true)
    try {
      const adminToken = localStorage.getItem('adminToken')
      const adminUser = localStorage.getItem('adminUser')
      
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-user': adminUser || ''
        },
        body: JSON.stringify({
          action: 'create_reminders'
        })
      })

      if (response.ok) {
        alert('Automatic reminders created successfully!')
        fetchNotifications() // Refresh the data
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating reminders:', error)
      alert('Failed to create reminders')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case "sent":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Sent</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "due_reminder":
        return <Badge variant="outline">Due Reminder</Badge>
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>
      case "return_confirmation":
        return <Badge className="bg-blue-100 text-blue-800">Return Confirmation</Badge>
      case "book_ready":
        return <Badge className="bg-green-100 text-green-800">Book Ready</Badge>
      case "welcome":
        return <Badge className="bg-purple-100 text-purple-800">Welcome</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  const getDueDateStatusBadge = (status: string, daysUntilDue: number) => {
    if (status === 'overdue') {
      return <Badge variant="destructive">{Math.abs(daysUntilDue)} days overdue</Badge>
    } else if (status === 'due_soon') {
      return <Badge className="bg-yellow-100 text-yellow-800">{daysUntilDue} days left</Badge>
    } else {
      return <Badge variant="outline">{daysUntilDue} days left</Badge>
    }
  }

  const pendingEmailNotifications = emailNotifications.filter(n => n.status === 'pending')
  const sentEmailNotifications = emailNotifications.filter(n => n.status === 'sent')
  const unreadUserNotifications = userNotifications.filter(n => !n.isRead)

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
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar />
        
        {/* Main Content */}
        <div className="flex-1">
          <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notification Management System</h1>
          <p className="text-lg text-gray-600">Manage email notifications and user alerts</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Email Notifications</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEmailNotifications}</p>
                </div>
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">User Notifications</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUserNotifications}</p>
                </div>
                <Bell className="h-8 w-8 text-purple-600" />
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
                  <p className="text-sm font-medium text-gray-600">Overdue Items</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overdueItems}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Notification Actions</CardTitle>
            <CardDescription>
              Manage email notifications and create automatic reminders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <Button 
                onClick={handleSendPending} 
                disabled={isProcessing || pendingEmailNotifications.length === 0}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Send Pending ({pendingEmailNotifications.length})
              </Button>
              <Button 
                onClick={handleCreateReminders} 
                disabled={isProcessing}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                Create Auto Reminders
              </Button>
              <Button 
                onClick={fetchNotifications} 
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Notifications Overview</CardTitle>
                <CardDescription>Manage email notifications and user alerts</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="email">Email Notifications ({stats.totalEmailNotifications})</TabsTrigger>
                <TabsTrigger value="user">User Notifications ({stats.totalUserNotifications})</TabsTrigger>
                <TabsTrigger value="due">Due Date Analysis ({stats.dueSoonItems + stats.overdueItems})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({pendingEmailNotifications.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="email">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Book</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Days Until Due</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Scheduled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emailNotifications.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{notification.user}</div>
                            <div className="text-sm text-gray-500">{notification.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{notification.book}</TableCell>
                        <TableCell>{getTypeBadge(notification.type)}</TableCell>
                        <TableCell>{notification.dueDate}</TableCell>
                        <TableCell>
                          <Badge variant={notification.daysUntilDue < 0 ? "destructive" : notification.daysUntilDue <= 1 ? "secondary" : "outline"}>
                            {notification.daysUntilDue < 0 ? `${Math.abs(notification.daysUntilDue)} days overdue` : `${notification.daysUntilDue} days`}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(notification.status)}</TableCell>
                        <TableCell className="text-sm text-gray-500">{notification.scheduledTime}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="user">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userNotifications.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{notification.user}</div>
                            <div className="text-sm text-gray-500">{notification.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(notification.type)}</TableCell>
                        <TableCell className="font-medium">{notification.title}</TableCell>
                        <TableCell className="max-w-xs truncate">{notification.message}</TableCell>
                        <TableCell>
                          {notification.isRead ? (
                            <Badge className="bg-green-100 text-green-800">Read</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800">Unread</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="due">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Book</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Days Until Due</TableHead>
                      <TableHead>Borrowed Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dueDateAnalysis.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{record.user}</div>
                            <div className="text-sm text-gray-500">{record.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{record.book}</TableCell>
                        <TableCell>{new Date(record.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>{getDueDateStatusBadge(record.status, record.daysUntilDue)}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(record.borrowedDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{getTypeBadge(record.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              
              <TabsContent value="pending">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Book</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Days Until Due</TableHead>
                      <TableHead>Scheduled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingEmailNotifications.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{notification.user}</div>
                            <div className="text-sm text-gray-500">{notification.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{notification.book}</TableCell>
                        <TableCell>{getTypeBadge(notification.type)}</TableCell>
                        <TableCell>{notification.dueDate}</TableCell>
                        <TableCell>
                          <Badge variant={notification.daysUntilDue <= 1 ? "secondary" : "outline"}>
                            {notification.daysUntilDue} days
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{notification.scheduledTime}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
