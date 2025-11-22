"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Plus, Edit, Trash2, UserCheck, UserX, RefreshCw, AlertCircle, Lock } from 'lucide-react'
import { AdminSidebar } from "@/components/admin-sidebar"

interface Admin {
  id: number
  username: string
  email: string
  full_name: string | null
  role: 'admin' | 'super_admin'
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
}

export default function SuperAdminPage() {
  const router = useRouter()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'admin' as 'admin' | 'super_admin',
    is_active: true
  })
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [showPinDialog, setShowPinDialog] = useState(true)
  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState("")

  useEffect(() => {
    // Check admin authentication
    const adminToken = localStorage.getItem('adminToken')
    const adminUserStr = localStorage.getItem('adminUser')

    if (!adminToken || !adminUserStr) {
      router.push('/login')
      return
    }

    // Check if PIN is already verified in this session
    const pinVerified = sessionStorage.getItem('superAdminPinVerified')
    if (pinVerified === 'true') {
      setShowPinDialog(false)
      fetchAdmins()
    }
  }, [router])

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPinError("")

    if (pin === "1234") {
      sessionStorage.setItem('superAdminPinVerified', 'true')
      setShowPinDialog(false)
      fetchAdmins()
    } else {
      setPinError("Invalid PIN. Please try again.")
      setPin("")
    }
  }

  const fetchAdmins = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const adminUser = localStorage.getItem('adminUser')

      const response = await fetch('/api/admin/super-admin', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-user': adminUser || ''
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Filter out superadmin as a safety measure
        const filteredAdmins = (data.admins || []).filter((admin: Admin) => admin.username !== 'superadmin')
        setAdmins(filteredAdmins)
      } else if (response.status === 403) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error fetching admins:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAdmin = () => {
    setEditingAdmin(null)
    setFormData({
      username: '',
      email: '',
      password: '',
      full_name: '',
      role: 'admin',
      is_active: true
    })
    setIsDialogOpen(true)
  }

  const handleEditAdmin = (admin: Admin) => {
    setEditingAdmin(admin)
    setFormData({
      username: admin.username,
      email: admin.email,
      password: '', // Don't pre-fill password
      full_name: admin.full_name || '',
      role: admin.role,
      is_active: admin.is_active
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.username || !formData.email) {
      alert('Username and email are required')
      return
    }

    if (!editingAdmin && !formData.password) {
      alert('Password is required for new admins')
      return
    }

    try {
      const adminToken = localStorage.getItem('adminToken')
      const adminUser = localStorage.getItem('adminUser')

      const url = '/api/admin/super-admin'
      const method = editingAdmin ? 'PUT' : 'POST'
      const body = editingAdmin
        ? { id: editingAdmin.id, ...formData, password: undefined } // Don't send password if editing
        : formData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-user': adminUser || ''
        },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message || 'Admin saved successfully')
        setIsDialogOpen(false)
        fetchAdmins()
      } else {
        alert(data.error || 'Failed to save admin')
      }
    } catch (error) {
      console.error('Error saving admin:', error)
      alert('Failed to save admin')
    }
  }

  const handleToggleActive = async (admin: Admin) => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const adminUser = localStorage.getItem('adminUser')

      const response = await fetch('/api/admin/super-admin', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-user': adminUser || ''
        },
        body: JSON.stringify({
          id: admin.id,
          is_active: !admin.is_active
        })
      })

      if (response.ok) {
        fetchAdmins()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update admin')
      }
    } catch (error) {
      console.error('Error toggling admin status:', error)
      alert('Failed to update admin')
    }
  }

  const handleDeleteAdmin = async (id: number) => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const adminUser = localStorage.getItem('adminUser')

      const response = await fetch(`/api/admin/super-admin?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-user': adminUser || ''
        }
      })

      if (response.ok) {
        alert('Admin deleted successfully')
        setDeleteConfirm(null)
        fetchAdmins()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete admin')
      }
    } catch (error) {
      console.error('Error deleting admin:', error)
      alert('Failed to delete admin')
    }
  }

  if (isLoading || showPinDialog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        {showPinDialog ? (
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-purple-600" />
                Enter PIN to Access
              </CardTitle>
              <CardDescription>
                Super Admin access requires PIN verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePinSubmit} className="space-y-4">
                {pinError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-600">{pinError}</p>
                  </div>
                )}
                <div>
                  <Label htmlFor="pin">PIN</Label>
                  <Input
                    id="pin"
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter 4-digit PIN"
                    maxLength={4}
                    className="text-center text-2xl tracking-widest font-mono"
                    autoFocus
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Verify PIN
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center">
            <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading admins...</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Shield className="h-8 w-8 text-blue-600" />
                    Super Admin Management
                  </h1>
                  <p className="text-gray-600">Manage admin accounts and their accessibility</p>
                </div>
                <Button onClick={handleCreateAdmin} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Admin
                </Button>
              </div>
            </div>

            {/* Admins Table */}
            <Card>
              <CardHeader>
                <CardTitle>Admin Accounts</CardTitle>
                <CardDescription>View and manage all admin accounts in the system</CardDescription>
              </CardHeader>
              <CardContent>
                {admins.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No admins found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admins.map((admin) => (
                        <TableRow key={admin.id}>
                          <TableCell className="font-medium">{admin.username}</TableCell>
                          <TableCell>{admin.email}</TableCell>
                          <TableCell>{admin.full_name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={admin.role === 'super_admin' ? 'default' : 'secondary'}>
                              {admin.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={admin.is_active ? 'default' : 'destructive'}>
                              {admin.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {admin.last_login
                              ? new Date(admin.last_login).toLocaleString()
                              : 'Never'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditAdmin(admin)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleActive(admin)}
                              >
                                {admin.is_active ? (
                                  <>
                                    <UserX className="h-3 w-3 mr-1" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-3 w-3 mr-1" />
                                    Activate
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeleteConfirm(admin.id)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAdmin ? 'Edit Admin' : 'Create New Admin'}</DialogTitle>
            <DialogDescription>
              {editingAdmin
                ? 'Update admin account details'
                : 'Create a new admin account for the library system'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              {!editingAdmin && (
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              )}
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="role">Role *</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'super_admin' })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Admin</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this admin account? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm !== null && handleDeleteAdmin(deleteConfirm)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

