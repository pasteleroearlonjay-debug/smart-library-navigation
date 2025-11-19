"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { BookOpen, Search, Users, Mail, BarChart3, Home, LogOut } from 'lucide-react'
import { Button } from "@/components/ui/button"

const adminNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Users", href: "/users", icon: Users },
]

const userNavigation = [
  { name: "Dashboard", href: "/user-dashboard", icon: Home },
  { name: "Search & Light", href: "/search", icon: Search },
  { name: "Notifications", href: "/user-notifications", icon: Mail },
]

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [adminUser, setAdminUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [userType, setUserType] = useState<'admin' | 'user' | null>(null)

  useEffect(() => {
    const admin = localStorage.getItem('adminUser')
    const user = localStorage.getItem('userData')
    
    if (admin) {
      setAdminUser(JSON.parse(admin))
      setUserType('admin')
    } else if (user) {
      setUserData(JSON.parse(user))
      setUserType('user')
    }
  }, [])

  const handleLogout = async () => {
    try {
      if (userType === 'admin') {
        const adminId = adminUser?.id
        
        // Call admin logout API
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ adminId }),
        })
        
        // Clear admin storage
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
      } else if (userType === 'user') {
        const userId = userData?.id
        
        // Call user logout API
        await fetch('/api/user/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        })
        
        // Clear user storage
        localStorage.removeItem('userToken')
        localStorage.removeItem('userData')
      }
      
      // Reset state
      setAdminUser(null)
      setUserData(null)
      setUserType(null)
      
      // Redirect to welcome page
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear storage and redirect even if API call fails
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminUser')
      localStorage.removeItem('userToken')
      localStorage.removeItem('userData')
      setAdminUser(null)
      setUserData(null)
      setUserType(null)
      router.push('/')
    }
  }

  // Don't show navigation on welcome page or admin login page
  if (pathname === '/login' || pathname === '/') {
    return null
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Smart Library</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            {(userType === 'admin' ? adminNavigation : userNavigation).map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
            {(adminUser || userData) && (
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
