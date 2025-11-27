"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart3, RefreshCw, Download, Lock, AlertCircle, ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AdminSidebar } from "@/components/admin-sidebar"

interface BookDetail {
  id: number
  title: string
  author: string
  catalog_no: string | null
}

interface ReportData {
  categories: Record<string, { 
    total: number
    borrowed: number
    remaining: number
    books: BookDetail[]
  }>
  totals: { total: number; borrowed: number; remaining: number }
  generatedAt: string
}

export default function ReportsPage() {
  const router = useRouter()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPinDialog, setShowPinDialog] = useState(true)
  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState("")
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set())
  const [yearsExisted, setYearsExisted] = useState<string>("")
  const [publicationDateStart, setPublicationDateStart] = useState<string>("")
  const [publicationDateEnd, setPublicationDateEnd] = useState<string>("")
  const [showFilters, setShowFilters] = useState(false)

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
      fetchReport()
    }
  }, [router])

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPinError("")

    if (pin === "1234") {
      sessionStorage.setItem('superAdminPinVerified', 'true')
      setShowPinDialog(false)
      fetchReport()
    } else {
      setPinError("Invalid PIN. Please try again.")
      setPin("")
    }
  }

  const fetchReport = async () => {
    try {
      setIsLoading(true)
      const adminToken = localStorage.getItem('adminToken')
      const adminUser = localStorage.getItem('adminUser')

      // Build query parameters
      const params = new URLSearchParams()
      if (yearsExisted) params.append('yearsExisted', yearsExisted)
      if (publicationDateStart) params.append('publicationDateStart', publicationDateStart)
      if (publicationDateEnd) params.append('publicationDateEnd', publicationDateEnd)

      const url = `/api/admin/reports${params.toString() ? `?${params.toString()}` : ''}`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-user': adminUser || ''
        }
      })

      if (response.ok) {
        const data = await response.json()
        setReportData(data.report)
      } else if (response.status === 403) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSubject = (subject: string) => {
    setExpandedSubjects(prev => {
      const newSet = new Set(prev)
      if (newSet.has(subject)) {
        newSet.delete(subject)
      } else {
        newSet.add(subject)
      }
      return newSet
    })
  }

  const clearFilters = () => {
    setYearsExisted("")
    setPublicationDateStart("")
    setPublicationDateEnd("")
  }

  const handleExport = () => {
    if (!reportData) return

    // Create CSV content
    const categories = [
      'Thesis',
      'Fiction',
      'Medicine',
      'Agriculture',
      'Computer Studies',
      'Comics',
      'Mathematics',
      'Science',
      'Social Studies',
      'PEHM',
      'Values Education',
      'TLE'
    ]

    let csv = 'Category,Thesis,Fiction,Medicine,Agriculture,Computer Studies,Comics,Mathematics,Science,Social Studies,PEHM,Values Education,TLE,Total\n'
    
    // Total number of books row
    csv += 'Total number of books,'
    categories.forEach((cat) => {
      csv += `${reportData.categories[cat]?.total || 0},`
    })
    csv += `${reportData.totals.total}\n`

    // Books borrowed row
    csv += 'Books borrowed,'
    categories.forEach((cat) => {
      csv += `${reportData.categories[cat]?.borrowed || 0},`
    })
    csv += `${reportData.totals.borrowed}\n`

    // Total (remaining) row
    csv += 'Total,'
    categories.forEach((cat) => {
      csv += `${reportData.categories[cat]?.remaining || 0},`
    })
    csv += `${reportData.totals.remaining}\n`

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `library-report-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
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
                Reports access requires PIN verification
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
            <p className="text-gray-600">Generating report...</p>
          </div>
        )}
      </div>
    )
  }

  const categories = [
    'Thesis',
    'Fiction',
    'Medicine',
    'Agriculture',
    'Computer Studies',
    'Comics',
    'Mathematics',
    'Science',
    'Social Studies',
    'PEHM',
    'Values Education',
    'TLE'
  ]

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
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                    Library Reports
                  </h1>
                  <p className="text-gray-600">Summary of books by category</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                  <Button onClick={fetchReport} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </div>

            {/* Date Filters */}
            {showFilters && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Filter Options</CardTitle>
                  <CardDescription>Filter books by date criteria</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="years-existed">Years Existed (minimum)</Label>
                      <Input
                        id="years-existed"
                        type="number"
                        min="0"
                        value={yearsExisted}
                        onChange={(e) => setYearsExisted(e.target.value)}
                        placeholder="e.g., 5"
                      />
                      <p className="text-xs text-gray-500 mt-1">Show books that have existed for at least this many years</p>
                    </div>
                    <div>
                      <Label htmlFor="pub-date-start">Publication Date From</Label>
                      <Input
                        id="pub-date-start"
                        type="date"
                        value={publicationDateStart}
                        onChange={(e) => setPublicationDateStart(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pub-date-end">Publication Date To</Label>
                      <Input
                        id="pub-date-end"
                        type="date"
                        value={publicationDateEnd}
                        onChange={(e) => setPublicationDateEnd(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={fetchReport} className="bg-blue-600 hover:bg-blue-700">
                      Apply Filters
                    </Button>
                    <Button onClick={clearFilters} variant="outline">
                      Clear Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Report Table */}
            <Card>
              <CardHeader>
                <CardTitle>Book Statistics by Category</CardTitle>
                <CardDescription>
                  {reportData?.generatedAt
                    ? `Generated at: ${new Date(reportData.generatedAt).toLocaleString()}`
                    : 'Loading report data...'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportData ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-semibold">Category</TableHead>
                          {categories.map((cat) => (
                            <TableHead key={cat} className="text-center">
                              {cat}
                            </TableHead>
                          ))}
                          <TableHead className="text-center font-semibold">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Total number of books row */}
                        <TableRow>
                          <TableCell className="font-medium">Total number of books</TableCell>
                          {categories.map((cat) => (
                            <TableCell key={cat} className="text-center">
                              {reportData.categories[cat]?.total || 0}
                            </TableCell>
                          ))}
                          <TableCell className="text-center font-semibold">
                            {reportData.totals.total}
                          </TableCell>
                        </TableRow>

                        {/* Books borrowed row */}
                        <TableRow>
                          <TableCell className="font-medium">Books borrowed</TableCell>
                          {categories.map((cat) => (
                            <TableCell key={cat} className="text-center">
                              {reportData.categories[cat]?.borrowed || 0}
                            </TableCell>
                          ))}
                          <TableCell className="text-center font-semibold">
                            {reportData.totals.borrowed}
                          </TableCell>
                        </TableRow>

                        {/* Total (remaining) row */}
                        <TableRow className="bg-gray-50">
                          <TableCell className="font-medium">Total</TableCell>
                          {categories.map((cat) => (
                            <TableCell key={cat} className="text-center font-medium">
                              {reportData.categories[cat]?.remaining || 0}
                            </TableCell>
                          ))}
                          <TableCell className="text-center font-semibold">
                            {reportData.totals.remaining}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No report data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Books by Subject - Expandable Sections */}
            {reportData && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Books by Subject</CardTitle>
                  <CardDescription>Click on a subject to view all books in that category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categories.map((cat) => {
                      const categoryData = reportData.categories[cat]
                      const isExpanded = expandedSubjects.has(cat)
                      const books = categoryData?.books || []

                      return (
                        <div key={cat} className="border rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleSubject(cat)}
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-gray-500" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-gray-500" />
                              )}
                              <div className="text-left">
                                <h3 className="font-semibold text-lg">{cat}</h3>
                                <p className="text-sm text-gray-600">
                                  {categoryData?.total || 0} total books • {categoryData?.borrowed || 0} borrowed • {categoryData?.remaining || 0} available
                                </p>
                              </div>
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="p-4 border-t bg-gray-50">
                              {books.length > 0 ? (
                                <div className="space-y-2">
                                  <select
                                    className="w-full p-2 border rounded-md bg-white"
                                    size={Math.min(books.length, 10)}
                                    onChange={() => {}}
                                  >
                                    {books.map((book) => (
                                      <option key={book.id} value={book.id}>
                                        {book.title} by {book.author}
                                        {book.catalog_no && ` (Catalog: ${book.catalog_no})`}
                                      </option>
                                    ))}
                                  </select>
                                  <p className="text-xs text-gray-500 mt-2">
                                    Showing {books.length} book{books.length !== 1 ? 's' : ''} in {cat}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-gray-500 text-sm">No books found in this category.</p>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

