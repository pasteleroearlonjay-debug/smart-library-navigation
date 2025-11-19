"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BookOpen, Clock, CheckCircle, XCircle, RefreshCw, Calendar, User, Mail, Trash2 } from 'lucide-react'
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

  useEffect(() => {
    // Check admin authentication
    const adminToken = localStorage.getItem('adminToken')
    const adminUser = localStorage.getItem('adminUser')

    if (!adminToken || !adminUser) {
      router.push('/login')
      return
    }

    fetchBookRequests()
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

  const handleRequestAction = async (requestId: number, action: 'approve' | 'decline') => {
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
              </CardHeader>
              <CardContent>
                {requests.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
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
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              {request.due_date ? new Date(request.due_date).toLocaleDateString() : 'N/A'}
                            </div>
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
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="text-sm text-gray-500">
                                  {request.processed_date && `Processed: ${new Date(request.processed_date).toLocaleDateString()}`}
                                </div>
                                {(request.status === 'accepted' || request.status === 'approved' || request.status === 'ready' || request.status === 'collected' || request.status === 'cancelled' || request.status === 'declined' || request.status === 'rejected') && (
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
