"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Users, Plus, Mail, Calendar, BookOpen, AlertCircle, CheckCircle, Clock, RefreshCw, Trash2, X, AlertTriangle } from 'lucide-react'
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
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set())
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

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
        setSelectedUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(userId)
          return newSet
        })
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

  const handleToggleSelectUser = (userId: number) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedUsers.size === 0) {
      alert('Please select at least one user to delete')
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedUsers.size} user(s)?\n\nThis action cannot be undone and will permanently remove all selected users and their data.`
    )

    if (!confirmed) return

    setIsBulkDeleting(true)
    const adminToken = localStorage.getItem('adminToken')
    const adminUser = localStorage.getItem('adminUser')
    
    let successCount = 0
    let failCount = 0

    for (const userId of selectedUsers) {
      try {
        const response = await fetch(`/api/admin/users-simple/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'x-admin-user': adminUser || ''
          }
        })

        if (response.ok) {
          successCount++
        } else {
          failCount++
        }
      } catch (error) {
        console.error(`Error deleting user ${userId}:`, error)
        failCount++
      }
    }

    alert(`Deleted ${successCount} user(s) successfully${failCount > 0 ? `. ${failCount} failed.` : ''}`)
    setSelectedUsers(new Set())
    fetchUsers()
    setIsBulkDeleting(false)
  }

  const handleDeleteAll = async () => {
    const confirmed = window.confirm(
      `⚠️ WARNING: Are you absolutely sure you want to delete ALL ${users.length} users?\n\nThis action cannot be undone and will permanently remove:\n- All user accounts\n- All borrowing records\n- All notifications\n- All book requests\n\nType "DELETE ALL" to confirm.`
    )

    if (!confirmed) return

    const userInput = window.prompt('Type "DELETE ALL" to confirm deletion of all users:')
    if (userInput !== 'DELETE ALL') {
      alert('Deletion cancelled. You must type "DELETE ALL" exactly to confirm.')
      return
    }

    setIsBulkDeleting(true)
    const adminToken = localStorage.getItem('adminToken')
    const adminUser = localStorage.getItem('adminUser')
    
    let successCount = 0
    let failCount = 0

    for (const user of users) {
      try {
        const response = await fetch(`/api/admin/users-simple/${user.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'x-admin-user': adminUser || ''
          }
        })

        if (response.ok) {
          successCount++
        } else {
          failCount++
        }
      } catch (error) {
        console.error(`Error deleting user ${user.id}:`, error)
        failCount++
      }
    }

    alert(`Deleted ${successCount} user(s) successfully${failCount > 0 ? `. ${failCount} failed.` : ''}`)
    setSelectedUsers(new Set())
    fetchUsers()
    setIsBulkDeleting(false)
    setShowDeleteAllConfirm(false)
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
        <div className="flex-1 flex">
          <div className="container mx-auto px-4 py-8 flex-1">
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
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === users.length && users.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Membership ID</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Borrowed</TableHead>
                  <TableHead>Overdue</TableHead>
                  <TableHead>Requests</TableHead>
                  <TableHead>Notifications</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => handleToggleSelectUser(user.id)}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.membershipId || 'N/A'}</TableCell>
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
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        disabled={isDeleting === user.id || isBulkDeleting}
                      >
                        {isDeleting === user.id ? (
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3 mr-1" />
                        )}
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
          </div>

          {/* Delete Shortcuts Sidebar */}
          <div className="w-80 bg-white shadow-lg border-l border-gray-200 p-6">
            <div className="sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                Delete Shortcuts
              </h2>
              
              <div className="space-y-3">
                {/* Selected Users Info */}
                {selectedUsers.size > 0 && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-blue-900">
                        {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
                      </p>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-full mt-2"
                        onClick={handleDeleteSelected}
                        disabled={isBulkDeleting}
                      >
                        {isBulkDeleting ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete Selected ({selectedUsers.size})
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Delete All Users */}
                <Card className="border-red-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-red-900 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Dangerous Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setShowDeleteAllConfirm(true)}
                      disabled={isBulkDeleting || users.length === 0}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete All Users
                    </Button>
                    <p className="text-xs text-gray-500">
                      This will permanently delete all {users.length} users and their data. Cannot be undone.
                    </p>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Users:</span>
                      <span className="font-semibold">{users.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Selected:</span>
                      <span className="font-semibold">{selectedUsers.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active:</span>
                      <span className="font-semibold text-green-600">{stats.activeMembers}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete All Confirmation Dialog */}
      <Dialog open={showDeleteAllConfirm} onOpenChange={setShowDeleteAllConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete All Users
            </DialogTitle>
            <DialogDescription>
              This will permanently delete ALL {users.length} users and their data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              The following will be deleted:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mb-4">
              <li>All user accounts ({users.length} users)</li>
              <li>All borrowing records</li>
              <li>All notifications</li>
              <li>All book requests</li>
              <li>All email verifications</li>
            </ul>
            <p className="text-sm font-semibold text-red-600">
              ⚠️ This action is irreversible!
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteAllConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAll} disabled={isBulkDeleting}>
              {isBulkDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All Users
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
