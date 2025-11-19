"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, BookOpen, Users, Lightbulb, Mail, BarChart3 } from 'lucide-react'
import Link from "next/link"
import { AdminSidebar } from "@/components/admin-sidebar"

export default function DashboardPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [adminUser, setAdminUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Dashboard stats (must be declared before any early returns to keep hook order stable)
  const [stats, setStats] = useState([
    { title: "Total Books", value: "-", icon: BookOpen, color: "text-blue-600" },
    { title: "Active Users", value: "-", icon: Users, color: "text-green-600" },
    { title: "Books Borrowed", value: "-", icon: BarChart3, color: "text-orange-600" },
    { title: "Overdue Items", value: "-", icon: Mail, color: "text-red-600" },
  ])

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('adminToken')
    const user = localStorage.getItem('adminUser')

    if (!token || !user) {
      router.push('/login')
      return
    }

    setAdminUser(JSON.parse(user))
    setIsLoading(false)
  }, [router])

  // Load stats once (still before any early returns)
  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch('/api/admin/stats', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setStats([
            { title: 'Total Books', value: String(data.books), icon: BookOpen, color: 'text-blue-600' },
            { title: 'Active Users', value: String(data.activeUsers), icon: Users, color: 'text-green-600' },
            { title: 'Books Borrowed', value: String(data.borrowed), icon: BarChart3, color: 'text-orange-600' },
            { title: 'Overdue Items', value: String(data.overdue), icon: Mail, color: 'text-red-600' },
          ])
        }
      } catch (e) {
        console.error('Failed to load stats', e)
      }
    }
    loadStats()
  }, [])

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

  const recentActivity = [
    { action: "Book borrowed", book: "Algebra Fundamentals", user: "John Doe", time: "2 minutes ago" },
    { action: "Book returned", book: "Physics Principles", user: "Jane Smith", time: "15 minutes ago" },
    { action: "Shelf light activated", shelf: "Mathematics", book: "Calculus", time: "1 hour ago" },
    { action: "Email reminder sent", user: "Mike Johnson", book: "Chemistry Basics", time: "2 hours ago" },
  ]

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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Smart Library System</h1>
          <p className="text-lg text-gray-600">ESP32-Enabled LED Lighting for 6 Subject Areas</p>
          {adminUser && (
            <div className="mt-2">
              <Badge className="bg-blue-600">
                Welcome, {adminUser.fullName || adminUser.username}
              </Badge>
            </div>
          )}
        </div>

        {/* Quick Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Quick Book Search
            </CardTitle>
            <CardDescription>Search for books and activate subject area lighting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Enter book title, author, or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Link href="/search">
                <Button>
                  <Search className="h-4 w-4 mr-2" />
                  Search & Light Up
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events and user actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{activity.action}</p>
                    <p className="text-sm text-gray-600">
                      {activity.book && `"${activity.book}"`}
                      {activity.user && ` - ${activity.user}`}
                      {activity.shelf && ` Subject: ${activity.shelf}`}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {activity.time}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Real-time monitoring of library components</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium">ESP32 LED System</p>
                  <p className="text-sm text-gray-600">All 6 subject LEDs operational</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Online</Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div>
                  <p className="font-medium">Email Service</p>
                  <p className="text-sm text-gray-600">23 pending notifications</p>
                </div>
                <Badge className="bg-orange-100 text-orange-800">Processing</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
          </div>
        </div>
      </div>
    </div>
  )
}


