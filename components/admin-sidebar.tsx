"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Lightbulb, Users, Mail, BarChart3, Search, BookOpen, Shield } from 'lucide-react'
import { useEffect, useState } from "react"

const systemFeatures = [
  {
    name: "Smart Shelf Lighting Control",
    href: "/search",
    icon: Lightbulb,
    description: "Control LED lighting system"
  },
  {
    name: "User Management", 
    href: "/users",
    icon: Users,
    description: "Manage library members"
  },
  {
    name: "Email Notification System",
    href: "/notifications", 
    icon: Mail,
    description: "Send notifications and reminders"
  },
  {
    name: "Shelf Monitoring",
    href: "/shelf",
    icon: BarChart3,
    description: "Monitor shelf status and ESP32"
  },
  {
    name: "Book Requests",
    href: "/admin/book-requests",
    icon: BookOpen,
    description: "Manage book borrowing requests"
  }
]

const superAdminFeatures = [
  {
    name: "Super Admin",
    href: "/admin/super-admin",
    icon: Users,
    description: "Manage admin accounts"
  },
  {
    name: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
    description: "View library statistics"
  }
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    const adminUserStr = localStorage.getItem('adminUser')
    if (adminUserStr) {
      try {
        const adminUser = JSON.parse(adminUserStr)
        setIsSuperAdmin(adminUser.role === 'super_admin')
      } catch {
        setIsSuperAdmin(false)
      }
    }
  }, [])

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 h-full">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Features</h2>
        <p className="text-sm text-gray-600 mb-6">Access all library management tools</p>
        
        <nav className="space-y-2">
          {systemFeatures.map((feature) => {
            const Icon = feature.icon
            const isActive = pathname === feature.href
            
            return (
              <Link
                key={feature.name}
                href={feature.href}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg transition-colors group",
                  isActive
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-gray-50 border border-transparent"
                )}
              >
                <div className={cn(
                  "p-2 rounded-md transition-colors",
                  isActive
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium text-sm transition-colors",
                    isActive
                      ? "text-blue-900"
                      : "text-gray-900 group-hover:text-blue-900"
                  )}>
                    {feature.name}
                  </p>
                  <p className={cn(
                    "text-xs transition-colors",
                    isActive
                      ? "text-blue-700"
                      : "text-gray-500 group-hover:text-blue-700"
                  )}>
                    {feature.description}
                  </p>
                </div>
              </Link>
            )
          }          )}

          {/* Only show Super Admin section if user is super_admin */}
          {isSuperAdmin && (
            <div className="pt-4 mt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-gray-900">Super Admin</h3>
              </div>
              {superAdminFeatures.map((feature) => {
              const Icon = feature.icon
              const isActive = pathname === feature.href
              
              return (
                <Link
                  key={feature.name}
                  href={feature.href}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg transition-colors group",
                    isActive
                      ? "bg-purple-50 border border-purple-200"
                      : "hover:bg-gray-50 border border-transparent"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-md transition-colors",
                    isActive
                      ? "bg-purple-100 text-purple-600"
                      : "bg-gray-100 text-gray-600 group-hover:bg-purple-100 group-hover:text-purple-600"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-medium text-sm transition-colors",
                      isActive
                        ? "text-purple-900"
                        : "text-gray-900 group-hover:text-purple-900"
                    )}>
                      {feature.name}
                    </p>
                    <p className={cn(
                      "text-xs transition-colors",
                      isActive
                        ? "text-purple-700"
                        : "text-gray-500 group-hover:text-purple-700"
                    )}>
                      {feature.description}
                    </p>
                  </div>
                </Link>
              )
            })}
            </div>
          )}
        </nav>
      </div>
    </div>
  )
}
