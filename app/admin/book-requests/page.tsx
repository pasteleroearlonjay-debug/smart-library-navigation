"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BookOpen, Clock, CheckCircle, XCircle, RefreshCw, Calendar, User, Mail, Trash2, Package } from 'lucide-react'
import { AdminSidebar } from "@/components/admin-sidebar"

interface BookRequest {
  id: number
  member_id: number
  book_id: number
  requested_days: number
  due_date: string
  status: string
  request_date: string
  processed_date?: string
  library_members: {
    id: number
    name: string
    email: string
  }
  books: {
    id: number
    title: string
    author: string
    subject: string
  }
}

interface Stats {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  declinedRequests: number
}

export default function AdminBookRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<BookRequest[]>([])
  const [stats, setStats] = useState<Stats>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    declinedRequests: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(Date.now())
  const [selectedRequests, setSelectedRequests] = useState<Set<number>>(new Set())
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)

  useEffect(() => {
    // Check admin authentication
    const adminToken = localStorage.getItem('adminToken')
    const adminUser = localStorage.getItem('adminUser')

    if (!adminToken || !adminUser) {
      router.push('/login')
      return
    }

    fetchBookRequests()
    
    // Timer updates every second for live countdown
    const timerInterval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    
    // Auto-refresh requests every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchBookRequests()
    }, 30000)
    
    return () => {
      clearInterval(timerInterval)
      clearInterval(refreshInterval)
    }
  }, [router])

  const fetchBookRequests = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const adminUser = localStorage.getItem('adminUser')
      
      const response = await fetch('/api/admin/book-requests-bulletproof', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-user': adminUser || ''
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
        setStats(data.stats)
        if (data.message) {
          console.log('API Message:', data.message)
        }
      } else {
        const errorData = await response.json()
        console.error('Failed to fetch book requests:', errorData.error)
      }
    } catch (error) {
      console.error('Error fetching book requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestAction = async (requestId: number, action: 'approve' | 'decline' | 'collect') => {
    setIsProcessing(requestId)
    try {
      const adminToken = localStorage.getItem('adminToken')
      const adminUser = localStorage.getItem('adminUser')
      
      const response = await fetch('/api/admin/book-requests-bulletproof', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-user': adminUser || ''
        },
        body: JSON.stringify({
          requestId,
          action
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`${data.message}!`)
        fetchBookRequests() // Refresh the list
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error processing request:', error)
      alert('Failed to process request')
    } finally {
      setIsProcessing(null)
    }
  }

  const handleDeleteRequest = async (requestId: number) => {
    if (!confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
      return
    }

    setIsProcessing(requestId)
    
    try {
      const adminToken = localStorage.getItem('adminToken')
      const adminUser = localStorage.getItem('adminUser')
      
      const response = await fetch('/api/admin/book-requests-bulletproof', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-user': adminUser || ''
        },
        body: JSON.stringify({
          requestId
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`${data.message}!`)
        fetchBookRequests() // Refresh the list
        setSelectedRequests(new Set()) // Clear selection
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting request:', error)
      alert('Failed to delete request')
    } finally {
      setIsProcessing(null)
    }
  }

  const handleToggleSelect = (requestId: number) => {
    const newSelected = new Set(selectedRequests)
    if (newSelected.has(requestId)) {
      newSelected.delete(requestId)
    } else {
      newSelected.add(requestId)
    }
    setSelectedRequests(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedRequests.size === requests.length) {
      setSelectedRequests(new Set())
    } else {
      setSelectedRequests(new Set(requests.map(r => r.id)))
    }
  }

  const handleBulkAction = async (action: 'approve' | 'decline' | 'collect' | 'delete') => {
    if (selectedRequests.size === 0) {
      alert('Please select at least one request')
      return
    }

    const actionMessages = {
      approve: 'approve',
      decline: 'decline',
      collect: 'mark as collected',
      delete: 'delete'
    }

    if (!confirm(`Are you sure you want to ${actionMessages[action]} ${selectedRequests.size} request(s)?`)) {
      return
    }

    setIsBulkProcessing(true)
    const requestIds = Array.from(selectedRequests)
    let successCount = 0
    let errorCount = 0

    try {
      const adminToken = localStorage.getItem('adminToken')
      const adminUser = localStorage.getItem('adminUser')

      for (const requestId of requestIds) {
        try {
          if (action === 'delete') {
            const response = await fetch('/api/admin/book-requests-bulletproof', {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
                'x-admin-user': adminUser || ''
              },
              body: JSON.stringify({ requestId })
            })
            if (response.ok) successCount++
            else errorCount++
          } else {
            const response = await fetch('/api/admin/book-requests-bulletproof', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
                'x-admin-user': adminUser || ''
              },
              body: JSON.stringify({ requestId, action })
            })
            if (response.ok) successCount++
            else errorCount++
          }
        } catch (error) {
          console.error(`Error processing request ${requestId}:`, error)
          errorCount++
        }
      }

      alert(`${successCount} request(s) ${actionMessages[action]}d successfully${errorCount > 0 ? `. ${errorCount} failed.` : ''}`)
      fetchBookRequests()
      setSelectedRequests(new Set())
    } catch (error) {
      console.error('Bulk action error:', error)
      alert('Failed to process bulk action')
    } finally {
      setIsBulkProcessing(false)
    }
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case "accepted":
      case "approved":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Accepted</Badge>
      case "ready":
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="h-3 w-3 mr-1" />Ready</Badge>
      case "collected":
        return <Badge className="bg-purple-100 text-purple-800"><CheckCircle className="h-3 w-3 mr-1" />Collected</Badge>
      case "cancelled":
      case "declined":
      case "rejected":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading book requests...</p>
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
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Request Management</h1>
              <p className="text-lg text-gray-600">Review and manage library book borrowing requests</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Requests</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Approved</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.approvedRequests}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Declined</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.declinedRequests}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Book Requests Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Book Requests</CardTitle>
                    <CardDescription>Review and approve/decline book borrowing requests</CardDescription>
                  </div>
                  <Button variant="outline" onClick={fetchBookRequests} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
                {/* Bulk Actions */}
                {selectedRequests.size > 0 && (
                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    <div className="text-sm text-gray-600 mr-2">
                      {selectedRequests.size} selected
                    </div>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleBulkAction('approve')}
                      disabled={isBulkProcessing}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approve Selected
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleBulkAction('decline')}
                      disabled={isBulkProcessing}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Decline Selected
                    </Button>
                    <Button
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={() => handleBulkAction('collect')}
                      disabled={isBulkProcessing}
                    >
                      <Package className="h-3 w-3 mr-1" />
                      Mark Collected
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => handleBulkAction('delete')}
                      disabled={isBulkProcessing}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete Selected
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedRequests(new Set())}
                      disabled={isBulkProcessing}
                    >
                      Clear Selection
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {requests.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={selectedRequests.size === requests.length && requests.length > 0}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300"
                          />
                        </TableHead>
                        <TableHead>Request ID</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Book</TableHead>
                        <TableHead>Request Date</TableHead>
                        <TableHead>Borrowing Period</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedRequests.has(request.id)}
                              onChange={() => handleToggleSelect(request.id)}
                              className="rounded border-gray-300"
                            />
                          </TableCell>
                          <TableCell className="font-medium">#{request.id}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{request.user_name || `User ${request.member_id}`}</div>
                              <div className="text-sm text-gray-500">{request.user_email || `ID: ${request.member_id}`}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{request.book_title || `Book ID: ${request.book_id}`}</div>
                              <div className="text-sm text-gray-500">{request.book_author || 'Unknown Author'}</div>
                              <div className="text-xs text-gray-400">Request #{request.id}</div>
                            </div>
                          </TableCell>
                          <TableCell>{request.request_date ? new Date(request.request_date).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{request.requested_days} days</Badge>
                          </TableCell>
                          <TableCell>
                            {request.due_date && ['accepted', 'approved', 'ready', 'collected'].includes(request.status) ? (
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-gray-400" />
                                    <span className="text-xs text-gray-600">
                                      {new Date(request.due_date).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {new Date(request.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                {/* Circular Timer */}
                                {(() => {
                                  const dueDate = new Date(request.due_date)
                                  const diffMs = dueDate.getTime() - currentTime
                                  const totalSeconds = Math.abs(Math.floor(diffMs / 1000))
                                  const days = Math.floor(totalSeconds / (3600 * 24))
                                  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600)
                                  const minutes = Math.floor((totalSeconds % 3600) / 60)
                                  const seconds = totalSeconds % 60
                                  const isOverdue = diffMs < 0
                                  
                                  // Calculate progress (30 days = 100%)
                                  const maxBorrowingDays = 30
                                  const totalDays = totalSeconds / (3600 * 24)
                                  const progress = isOverdue 
                                    ? 100 
                                    : Math.max(0, Math.min(100, ((maxBorrowingDays - totalDays) / maxBorrowingDays) * 100))
                                  
                                  // Color based on urgency
                                  let strokeColor = '#10b981' // green
                                  let textColor = 'text-green-600'
                                  
                                  if (isOverdue) {
                                    strokeColor = '#ef4444' // red
                                    textColor = 'text-red-600'
                                  } else if (days === 0 && hours < 12) {
                                    strokeColor = '#f59e0b' // orange
                                    textColor = 'text-orange-600'
                                  } else if (days === 0 || days === 1) {
                                    strokeColor = '#eab308' // yellow
                                    textColor = 'text-yellow-600'
                                  }
                                  
                                  const size = 80
                                  const radius = (size - 16) / 2
                                  const circumference = 2 * Math.PI * radius
                                  const strokeDashoffset = circumference - (progress / 100) * circumference
                                  
                                  // Format time display with seconds
                                  let timeDisplay = ''
                                  let timeLabel = ''
                                  
                                  if (isOverdue) {
                                    if (days > 0) {
                                      timeDisplay = `${days}d ${hours}h`
                                      timeLabel = `${minutes}m ${seconds}s`
                                    } else if (hours > 0) {
                                      timeDisplay = `${hours}h ${minutes}m`
                                      timeLabel = `${seconds}s`
                                    } else if (minutes > 0) {
                                      timeDisplay = `${minutes}m ${seconds}s`
                                      timeLabel = 'Over'
                                    } else {
                                      timeDisplay = `${seconds}s`
                                      timeLabel = 'Over'
                                    }
                                  } else {
                                    if (days > 0) {
                                      timeDisplay = `${days}d ${hours}h`
                                      timeLabel = `${minutes}m ${seconds}s`
                                    } else if (hours > 0) {
                                      timeDisplay = `${hours}h ${minutes}m`
                                      timeLabel = `${seconds}s`
                                    } else if (minutes > 0) {
                                      timeDisplay = `${minutes}m ${seconds}s`
                                      timeLabel = 'left'
                                    } else {
                                      timeDisplay = `${seconds}s`
                                      timeLabel = 'left'
                                    }
                                  }
                                  
                                  return (
                                    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
                                      <svg
                                        width={size}
                                        height={size}
                                        className="transform -rotate-90"
                                      >
                                        {/* Background circle */}
                                        <circle
                                          cx={size / 2}
                                          cy={size / 2}
                                          r={radius}
                                          stroke="#e5e7eb"
                                          strokeWidth="8"
                                          fill="none"
                                        />
                                        {/* Progress circle */}
                                        <circle
                                          cx={size / 2}
                                          cy={size / 2}
                                          r={radius}
                                          stroke={strokeColor}
                                          strokeWidth="8"
                                          fill="none"
                                          strokeDasharray={circumference}
                                          strokeDashoffset={strokeDashoffset}
                                          strokeLinecap="round"
                                          className="transition-all duration-1000 ease-out"
                                        />
                                      </svg>
                                      {/* Center text with seconds */}
                                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <div className={`text-center ${textColor}`}>
                                          <div className="text-sm font-bold leading-tight font-mono">
                                            {timeDisplay}
                                          </div>
                                          <div className="text-[10px] opacity-75 mt-0.5 font-mono">
                                            {timeLabel}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })()}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                <span className="text-sm">
                                  {request.due_date ? new Date(request.due_date).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell>
                            {request.status === 'pending' ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleRequestAction(request.id, 'approve')}
                                  disabled={isProcessing === request.id}
                                >
                                  {isProcessing === request.id ? (
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                  )}
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRequestAction(request.id, 'decline')}
                                  disabled={isProcessing === request.id}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Decline
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                  onClick={() => handleDeleteRequest(request.id)}
                                  disabled={isProcessing === request.id}
                                >
                                  {isProcessing === request.id ? (
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3 mr-1" />
                                  )}
                                  Delete
                                </Button>
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm text-gray-500">
                                  {request.processed_date && `Processed: ${new Date(request.processed_date).toLocaleDateString()}`}
                                </div>
                                {['accepted', 'approved', 'ready'].includes(request.status) && (
                                  <Button
                                    size="sm"
                                    className="bg-purple-600 hover:bg-purple-700"
                                    onClick={() => handleRequestAction(request.id, 'collect')}
                                    disabled={isProcessing === request.id}
                                  >
                                    {isProcessing === request.id ? (
                                      <RefreshCw className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                    )}
                                    Mark as Collected
                                  </Button>
                                )}
                                {(request.status === 'accepted' ||
                                  request.status === 'approved' ||
                                  request.status === 'ready' ||
                                  request.status === 'collected' ||
                                  request.status === 'cancelled' ||
                                  request.status === 'declined' ||
                                  request.status === 'rejected') && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                    onClick={() => handleDeleteRequest(request.id)}
                                    disabled={isProcessing === request.id}
                                  >
                                    {isProcessing === request.id ? (
                                      <RefreshCw className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3 w-3 mr-1" />
                                    )}
                                    Delete
                                  </Button>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No book requests found</h3>
                    <p className="text-gray-600 mb-4">There are currently no book borrowing requests to review.</p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                      <h4 className="font-medium text-blue-900 mb-2">Database Connection Issue</h4>
                      <p className="text-sm text-blue-700 mb-3">
                        There seems to be an issue accessing your book_requests table. This could be a column structure mismatch.
                      </p>
                      <div className="text-xs text-blue-600 font-mono bg-blue-100 p-2 rounded">
                        Run: TEST_TABLE_ACCESS.sql to diagnose
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
