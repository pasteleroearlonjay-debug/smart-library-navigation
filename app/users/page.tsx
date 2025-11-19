"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Users, Plus, Mail, Calendar, BookOpen, AlertCircle, CheckCircle, Clock, RefreshCw, Trash2 } from 'lucide-react'
import { AdminSidebar } from "@/components/admin-sidebar"

interface User {
  id: number
  name: string
  email: string
  membershipId: string
  joinDate: string
  borrowedBooks: number
  overdueBooks: number
  activeRequests: number
  readyRequests: number
  unreadNotifications: number
  status: string
  emailVerified: boolean
  lastLogin: string
  profilePicture?: string
}

interface Stats {
  totalUsers: number
  activeMembers: number
  totalBorrowed: number
  totalOverdue: number
  totalRequests: number
  emailVerified: number
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeMembers: 0,
    totalBorrowed: 0,
    totalOverdue: 0,
    totalRequests: 0,
    emailVerified: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    membershipId: ""
  })

  useEffect(() => {
    // Check admin authentication
    const adminToken = localStorage.getItem('adminToken')
    const adminUser = localStorage.getItem('adminUser')

    if (!adminToken || !adminUser) {
      router.push('/login')
      return
    }

    fetchUsers()
  }, [router])

  const fetchUsers = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const adminUser = localStorage.getItem('adminUser')
      
      const response = await fetch('/api/admin/users-simple', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-user': adminUser || ''
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setStats(data.stats)
      } else {
        console.error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.membershipId) {
      alert('Please fill in all fields')
      return
    }

    setIsCreating(true)
    try {
      const adminToken = localStorage.getItem('adminToken')
      const adminUser = localStorage.getItem('adminUser')
      
      const response = await fetch('/api/admin/users-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-user': adminUser || ''
        },
        body: JSON.stringify(newUser)
      })

      if (response.ok) {
        const data = await response.json()
        alert(`User created successfully! Temporary password: ${data.tempPassword}`)
        setNewUser({ name: "", email: "", membershipId: "" })
        fetchUsers() // Refresh the list
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Failed to create user')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteUser = async (userId: number, userName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete user "${userName}"?\n\nThis action cannot be undone and will permanently remove:\n- User account\n- All borrowing records\n- All notifications\n- All book requests`
    )

    if (!confirmed) return

    setIsDeleting(userId)
    try {
      const adminToken = localStorage.getItem('adminToken')
      const adminUser = localStorage.getItem('adminUser')
      
      const response = await fetch(`/api/admin/users-simple/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-user': adminUser || ''
        }
      })

      if (response.ok) {
        alert('User deleted successfully!')
        fetchUsers() // Refresh the list
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    } finally {
      setIsDeleting(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "suspended":
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getEmailVerifiedBadge = (verified: boolean) => {
    return verified ? 
      <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge> :
      <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading users...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-lg text-gray-600">Manage library members and their borrowing activities</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Members</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeMembers}</p>
                </div>
                <BookOpen className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Books Borrowed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBorrowed}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue Items</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOverdue}</p>
                </div>
                <Mail className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Email Verified</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.emailVerified}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Library Members</CardTitle>
                <CardDescription>Manage user accounts and track borrowing activity</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={fetchUsers} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Membership ID</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Borrowed</TableHead>
                  <TableHead>Overdue</TableHead>
                  <TableHead>Requests</TableHead>
                  <TableHead>Notifications</TableHead>
                  <TableHead>Email Status</TableHead>
                  <TableHead>Account Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.membershipId}</TableCell>
                    <TableCell>{new Date(user.joinDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.borrowedBooks}</Badge>
                    </TableCell>
                    <TableCell>
                      {user.overdueBooks > 0 ? (
                        <Badge variant="destructive">{user.overdueBooks}</Badge>
                      ) : (
                        <Badge variant="outline">0</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {user.activeRequests > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {user.activeRequests} pending
                          </Badge>
                        )}
                        {user.readyRequests > 0 && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            {user.readyRequests} ready
                          </Badge>
                        )}
                        {user.activeRequests === 0 && user.readyRequests === 0 && (
                          <Badge variant="outline" className="text-xs">None</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.unreadNotifications > 0 ? (
                        <Badge variant="destructive">{user.unreadNotifications} unread</Badge>
                      ) : (
                        <Badge variant="outline">All read</Badge>
                      )}
                    </TableCell>
                    <TableCell>{getEmailVerifiedBadge(user.emailVerified)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      {/* Actions hidden per request */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
