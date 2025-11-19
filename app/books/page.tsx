"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { BookOpen, Search, Plus, Calendar, User, Filter } from 'lucide-react'

export default function BooksPage() {
  const router = useRouter()
  const [books, setBooks] = useState<any[]>([])
  const [filteredBooks, setFilteredBooks] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [selectedBook, setSelectedBook] = useState<any>(null)
  const [borrowingDays, setBorrowingDays] = useState(7)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('userToken')
    const user = localStorage.getItem('userData')

    if (!token || !user) {
      router.push('/')
      return
    }

    loadBooks()
  }, [router])

  useEffect(() => {
    // Filter books based on search and subject
    let filtered = books

    if (searchQuery) {
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.subject.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedSubject !== "all") {
      filtered = filtered.filter(book => book.subject === selectedSubject)
    }

    setFilteredBooks(filtered)
  }, [books, searchQuery, selectedSubject])

  const loadBooks = async () => {
    try {
      const response = await fetch('/api/books')
      const data = await response.json()
      
      if (response.ok) {
        setBooks(data.books || [])
      }
    } catch (error) {
      console.error('Failed to load books:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestBook = (book: any) => {
    setSelectedBook(book)
    setShowRequestDialog(true)
  }

  const submitBookRequest = async () => {
    if (!selectedBook) return

    try {
      const token = localStorage.getItem('userToken')
      const userData = JSON.parse(localStorage.getItem('userData') || '{}')
      
      // Use a fallback user ID if not available
      const userId = userData.id || userData.user_id || 1
      
      console.log('Submitting book request:', {
        bookId: selectedBook.id,
        borrowingDays: borrowingDays,
        userId: userId,
        userData: userData
      })
      
      const response = await fetch('/api/user/request-book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookId: selectedBook.id,
          borrowingDays: borrowingDays,
          userId: userId,
          email: userData.email,
          name: userData.name || userData.full_name
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Book request submitted successfully! Admin will review your request.')
        setShowRequestDialog(false)
        setSelectedBook(null)
        setBorrowingDays(7)
        loadBooks() // Refresh book availability
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error submitting book request:', error)
      alert('Failed to submit book request. Please try again.')
    }
  }

  const subjects = ["all", "Mathematics", "Science", "Social Studies", "PEHM", "Values Education", "TLE"]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading books...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Library Books</h1>
          <p className="text-lg text-gray-600">Browse and request books to borrow</p>
        </div>

        {/* Search and Filter */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search books by title, author, or subject..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="md:w-48">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>
                      {subject === "all" ? "All Subjects" : subject}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredBooks.length} of {books.length} books
          </p>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredBooks.map((book) => (
            <Card key={book.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{book.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mb-1">
                      <User className="h-3 w-3" />
                      by {book.author}
                    </CardDescription>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{book.subject}</Badge>
                      {book.isbn && (
                        <Badge variant="secondary" className="text-xs">
                          ISBN: {book.isbn}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <Badge 
                      className={book.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                    >
                      {book.available ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Quantity:</span>
                    <span className="font-medium">{book.quantity || 0}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    {book.available ? (
                      <Button 
                        onClick={() => handleRequestBook(book)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Request Book
                      </Button>
                    ) : (
                      <Button disabled variant="outline" className="flex-1">
                        Not Available
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredBooks.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
              <p className="text-gray-600">
                {searchQuery || selectedSubject !== "all" 
                  ? "Try adjusting your search or filter criteria."
                  : "No books are currently available in the library."
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Back to Dashboard */}
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => router.push('/user-dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Book Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Book</DialogTitle>
            <DialogDescription>
              Submit a request to borrow "{selectedBook?.title}"
            </DialogDescription>
          </DialogHeader>
          {selectedBook && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold">{selectedBook.title}</h4>
                <p className="text-sm text-gray-600">by {selectedBook.author}</p>
                <p className="text-sm text-gray-500">Subject: {selectedBook.subject}</p>
              </div>
              
              <div>
                <Label htmlFor="borrowing-days">Borrowing Period (Days)</Label>
                <Input
                  id="borrowing-days"
                  type="number"
                  min="1"
                  max="30"
                  value={borrowingDays}
                  onChange={(e) => setBorrowingDays(parseInt(e.target.value) || 7)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Choose how many days you want to borrow this book (1-30 days)
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowRequestDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={submitBookRequest}>
                  Submit Request
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
