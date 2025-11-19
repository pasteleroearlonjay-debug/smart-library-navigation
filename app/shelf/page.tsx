"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lightbulb, Zap, Wifi, AlertTriangle, CheckCircle, Activity, Calculator, Atom, Globe, Heart, Shield, Wrench, Plus, X, Edit, Trash2, BookPlus } from 'lucide-react'
import { AdminSidebar } from "@/components/admin-sidebar"

export default function ShelfPage() {
  const [subjectData, setSubjectData] = useState([
    {
      id: "Mathematics",
      icon: Calculator,
      ledStatus: "off",
      esp32Status: "online",
      powerLevel: 95,
      lastUpdate: "2024-01-16 16:45:00",
      temperature: 24.5,
      books: 3,
      color: "bg-blue-500"
    },
    {
      id: "Science",
      ledPin: 2,
      icon: Atom,
      ledStatus: "off",
      esp32Status: "online",
      powerLevel: 88,
      lastUpdate: "2024-01-16 16:44:30",
      temperature: 23.8,
      books: 3,
      color: "bg-green-500"
    },
    {
      id: "Social Studies",
      ledPin: 3,
      icon: Globe,
      ledStatus: "off",
      esp32Status: "online",
      powerLevel: 92,
      lastUpdate: "2024-01-16 16:45:15",
      temperature: 24.1,
      books: 3,
      color: "bg-yellow-500"
    },
    {
      id: "PEHM",
      ledPin: 4,
      icon: Heart,
      ledStatus: "off",
      esp32Status: "online",
      powerLevel: 76,
      lastUpdate: "2024-01-16 16:43:45",
      temperature: 25.2,
      books: 3,
      color: "bg-red-500"
    },
    {
      id: "Values Education",
      ledPin: 5,
      icon: Shield,
      ledStatus: "off",
      esp32Status: "online",
      powerLevel: 91,
      lastUpdate: "2024-01-16 16:45:30",
      temperature: 24.7,
      books: 3,
      color: "bg-purple-500"
    },
    {
      id: "TLE",
      ledPin: 6,
      icon: Wrench,
      ledStatus: "off",
      esp32Status: "online",
      powerLevel: 84,
      lastUpdate: "2024-01-16 16:44:00",
      temperature: 23.5,
      books: 3,
      color: "bg-orange-500"
    }
  ])

  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [isAddBooksOpen, setIsAddBooksOpen] = useState(false)
  const [isEditShelfOpen, setIsEditShelfOpen] = useState(false)
  const [shelves, setShelves] = useState<Array<{ id: number, name: string, books: Array<{id: string, title: string, author: string, subject: string}> }>>([
    { id: 1, name: "Shelf 1", books: [] }
  ])
  const [selectedShelfId, setSelectedShelfId] = useState<number>(1)

  // Book entry/edit state
  const [currentBookTitle, setCurrentBookTitle] = useState("")
  const [currentBookAuthor, setCurrentBookAuthor] = useState("")
  const [currentBookSubject, setCurrentBookSubject] = useState("")
  const [editingBookId, setEditingBookId] = useState<string | null>(null)

  // Available books catalog (sample data)
  const availableBooks = [
    { id: "b1", title: "Algebra Fundamentals", author: "John Smith", subject: "Mathematics" },
    { id: "b2", title: "Calculus Made Easy", author: "Mary Johnson", subject: "Mathematics" },
    { id: "b3", title: "Geometry Basics", author: "David Wilson", subject: "Mathematics" },
    { id: "b4", title: "Physics Principles", author: "Sarah Brown", subject: "Science" },
    { id: "b5", title: "Chemistry Basics", author: "Michael Davis", subject: "Science" },
    { id: "b6", title: "Biology Essentials", author: "Lisa Garcia", subject: "Science" },
    { id: "b7", title: "World History", author: "Robert Martinez", subject: "Social Studies" },
    { id: "b8", title: "Philippine History", author: "Ana Rodriguez", subject: "Social Studies" },
    { id: "b9", title: "Geography Today", author: "Carlos Lopez", subject: "Social Studies" },
    { id: "b10", title: "Physical Education Guide", author: "Maria Santos", subject: "PEHM" },
    { id: "b11", title: "Health and Wellness", author: "Jose Cruz", subject: "PEHM" },
    { id: "b12", title: "Music Appreciation", author: "Carmen Reyes", subject: "PEHM" },
    { id: "b13", title: "Moral Values", author: "Pedro Torres", subject: "Values Education" },
    { id: "b14", title: "Character Building", author: "Rosa Mendoza", subject: "Values Education" },
    { id: "b15", title: "Ethics and Society", author: "Manuel Flores", subject: "Values Education" },
    { id: "b16", title: "Computer Programming", author: "Luz Gonzales", subject: "TLE" },
    { id: "b17", title: "Cooking Basics", author: "Antonio Rivera", subject: "TLE" },
    { id: "b18", title: "Electrical Wiring", author: "Elena Morales", subject: "TLE" }
  ]

  const getLEDStatusColor = (status: string, defaultColor: string) => {
    switch (status) {
      case "on":
        return "bg-yellow-400 shadow-lg shadow-yellow-300"
      case "blinking":
        return "bg-orange-400 animate-pulse"
      case "off":
        return defaultColor
      default:
        return defaultColor
    }
  }

  const getESP32StatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-100 text-green-800"><Wifi className="h-3 w-3 mr-1" />Online</Badge>
      case "offline":
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Offline</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPowerLevelColor = (level: number) => {
    if (level > 80) return "text-green-600"
    if (level > 50) return "text-yellow-600"
    return "text-red-600"
  }

  const testSubjectLED = async (subjectId: string) => {
    setSubjectData(prev => prev.map(subject => 
      subject.id === subjectId 
        ? { ...subject, ledStatus: "blinking" }
        : subject
    ))
    
    try {
      // Send command to turn the LED ON
      await fetch("/api/led/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          subject: subjectId, 
          ledPin: subjectData.find(s => s.id === subjectId)?.ledPin, 
          state: "on" 
        }),
      })

      // Turn off after 3 seconds
      setTimeout(async () => {
        await fetch("/api/led/control", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            subject: subjectId, 
            ledPin: subjectData.find(s => s.id === subjectId)?.ledPin, 
            state: "off" 
          }),
        })
        
        setSubjectData(prev => prev.map(subject => 
          subject.id === subjectId 
            ? { ...subject, ledStatus: "off" }
            : subject
        ))
      }, 3000)
    } catch (error) {
      console.error("Failed to test LED:", error)
      setSubjectData(prev => prev.map(subject => 
        subject.id === subjectId 
          ? { ...subject, ledStatus: "off" }
          : subject
      ))
    }
  }

  const addBookToShelf = () => {
    if (!currentBookTitle.trim() || !currentBookAuthor.trim() || !currentBookSubject.trim()) return
    const newBook = {
      id: `book-${Date.now()}`,
      title: currentBookTitle.trim(),
      author: currentBookAuthor.trim(),
      subject: currentBookSubject.trim()
    }
    setShelves(prev => prev.map(s => s.id === selectedShelfId ? { ...s, books: [...s.books, newBook] } : s))
    setCurrentBookTitle("")
    setCurrentBookAuthor("")
    setCurrentBookSubject("")
  }

  const addExistingBookToShelf = (book: { id: string, title: string, author: string, subject: string }) => {
    const toAdd = { ...book, id: `book-${Date.now()}` }
    setShelves(prev => prev.map(s => s.id === selectedShelfId ? { ...s, books: [...s.books, toAdd] } : s))
  }

  const removeBookFromShelf = (bookId: string) => {
    setShelves(prev => prev.map(s => s.id === selectedShelfId ? { ...s, books: s.books.filter(b => b.id !== bookId) } : s))
  }

  const startEditBook = (bookId: string, title: string, author: string, subject: string) => {
    setEditingBookId(bookId)
    setCurrentBookTitle(title)
    setCurrentBookAuthor(author)
    setCurrentBookSubject(subject)
  }

  const saveEditBook = () => {
    if (!editingBookId) return
    setShelves(prev => prev.map(s => s.id === selectedShelfId ? {
      ...s,
      books: s.books.map(b => b.id === editingBookId ? { ...b, title: currentBookTitle.trim(), author: currentBookAuthor.trim(), subject: currentBookSubject.trim() } : b)
    } : s))
    setEditingBookId(null)
    setCurrentBookTitle("")
    setCurrentBookAuthor("")
    setCurrentBookSubject("")
  }

  const createNewShelf = () => {
    const newShelfNumber = shelves.length + 1
    const newShelf = { id: newShelfNumber, name: `Shelf ${newShelfNumber}`, books: [] as Array<{id: string, title: string, author: string, subject: string}> }
    setShelves(prev => [...prev, newShelf])
    setSelectedShelfId(newShelf.id)
  }

  const deleteCurrentShelf = () => {
    if (shelves.length <= 1) return
    const filtered = shelves.filter(s => s.id !== selectedShelfId)
    // Re-index names to keep Shelf 1..N
    const reindexed = filtered.map((s, idx) => ({ ...s, id: idx + 1, name: `Shelf ${idx + 1}` }))
    setShelves(reindexed)
    setSelectedShelfId(1)
    setIsEditShelfOpen(false)
  }

  const renderSubjectGrid = () => {
    // For Shelf 1, show the original static subjects with their default book counts
    if (selectedShelfId === 1) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {subjectData.map((subject) => {
            const Icon = subject.icon
            return (
              <Card 
                key={subject.id}
                className={`cursor-pointer transition-all duration-300 ${
                  selectedSubject === subject.id ? 'ring-2 ring-blue-500' : ''
                } ${subject.esp32Status === 'offline' ? 'opacity-60' : ''}`}
                onClick={() => setSelectedSubject(subject.id)}
              >
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-4">
                    <Icon className="h-8 w-8 mr-2 text-gray-600" />
                    <div className="text-lg font-bold">{subject.id}</div>
                  </div>
                  
                  {/* LED Indicator */}
                  <div className={`w-12 h-12 rounded-full mx-auto mb-4 ${getLEDStatusColor(subject.ledStatus, subject.color)}`}>
                    {subject.ledStatus === 'on' && <Lightbulb className="h-6 w-6 text-yellow-800 mx-auto mt-3" />}
                  </div>
                  
                  {/* Status Badges */}
                  <div className="space-y-2 mb-4">
                    <div className="text-sm text-gray-600">
                      {subject.books} books
                    </div>
                  </div>
                  
                  {/* Test Button */}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={(e) => {
                      e.stopPropagation()
                      testSubjectLED(subject.id)
                    }}
                    disabled={subject.esp32Status === 'offline'}
                    className="w-full"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Test LED
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )
    }

    // For other shelves (Shelf 2+), show dynamic subjects based on books
    const currentShelf = shelves.find(s => s.id === selectedShelfId)
    if (!currentShelf) return null

    // Group books by subject for display
    const booksBySubject = currentShelf.books.reduce((acc, book) => {
      if (!acc[book.subject]) acc[book.subject] = []
      acc[book.subject].push(book)
      return acc
    }, {} as Record<string, Array<{id: string, title: string, author: string, subject: string}>>)

    // Map subjects to their display info
    const subjectDisplayMap: Record<string, { icon: any, color: string, ledPin?: number }> = {
      'Mathematics': { icon: Calculator, color: 'bg-blue-500', ledPin: 1 },
      'Science': { icon: Atom, color: 'bg-green-500', ledPin: 2 },
      'Social Studies': { icon: Globe, color: 'bg-yellow-500', ledPin: 3 },
      'PEHM': { icon: Heart, color: 'bg-red-500', ledPin: 4 },
      'Values Education': { icon: Shield, color: 'bg-purple-500', ledPin: 5 },
      'TLE': { icon: Wrench, color: 'bg-orange-500', ledPin: 6 }
    }

    // Only show subjects that have books
    const allSubjects = ['Mathematics', 'Science', 'Social Studies', 'PEHM', 'Values Education', 'TLE']
    const subjectsWithBooks = allSubjects.filter(subjectName => {
      const booksInSubject = booksBySubject[subjectName] || []
      return booksInSubject.length > 0
    })

    // If no subjects have books, show empty message
    if (subjectsWithBooks.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">No books in this shelf yet</div>
          <div className="text-gray-400 text-sm">Add books to see subjects and LED controls</div>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {subjectsWithBooks.map((subjectName) => {
          const subjectInfo = subjectDisplayMap[subjectName]
          const Icon = subjectInfo.icon
          const booksInSubject = booksBySubject[subjectName] || []
          const hasBooks = booksInSubject.length > 0
          const isLit = selectedSubject === subjectName

          return (
            <Card 
              key={subjectName}
              className={`cursor-pointer transition-all duration-300 ${
                isLit ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => hasBooks ? setSelectedSubject(subjectName) : null}
            >
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <Icon className="h-8 w-8 mr-2 text-gray-600" />
                  <div className="text-lg font-bold">{subjectName}</div>
                </div>
                
                {/* LED Indicator */}
                <div className={`w-12 h-12 rounded-full mx-auto mb-4 ${getLEDStatusColor(isLit ? 'on' : 'off', subjectInfo.color)}`}>
                  {isLit && <Lightbulb className="h-6 w-6 text-yellow-800 mx-auto mt-3" />}
                </div>
                
                {/* Status Badges */}
                <div className="space-y-2 mb-4">
                  <div className="text-sm text-gray-600">
                    {booksInSubject.length} book{booksInSubject.length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                {/* Test Button */}
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={(e) => {
                    e.stopPropagation()
                    if (hasBooks) testSubjectLED(subjectName)
                  }}
                  disabled={!hasBooks}
                  className="w-full"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Test LED
                </Button>
              </CardContent>
            </Card>
          )
        })}
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ESP32 LED Monitoring System</h1>
          <p className="text-lg text-gray-600">Real-time monitoring of 6 subject area LEDs and ESP32 controllers</p>
        </div>


        {/* Subject Grid */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <CardTitle>{shelves.find(s => s.id === selectedShelfId)?.name || "Shelf 1"}</CardTitle>
                  <select
                    value={selectedShelfId}
                    onChange={(e) => setSelectedShelfId(parseInt(e.target.value))}
                    className="border rounded px-2 py-1 text-sm bg-white"
                  >
                    {shelves.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <CardDescription>
                  Click on any subject to view detailed information. Each subject has its own LED controlled by the ESP32.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={createNewShelf}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Shelf
                </Button>
                <Dialog open={isAddBooksOpen} onOpenChange={setIsAddBooksOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <BookPlus className="h-4 w-4 mr-2" />
                      Add Books
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[900px]">
                    <DialogHeader>
                      <DialogTitle>Add Books to {shelves.find(s => s.id === selectedShelfId)?.name}</DialogTitle>
                      <DialogDescription>
                        Pick from available books or add a custom one. You can also edit or delete books already in this shelf.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Available Books */}
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">Available Books</h4>
                        <div className="space-y-2 max-h-72 overflow-auto">
                          {availableBooks.map(b => (
                            <div key={b.id} className="flex items-center justify-between p-2 border rounded">
                              <div>
                                <p className="font-medium text-sm">{b.title}</p>
                                <p className="text-xs text-gray-600">by {b.author} • {b.subject}</p>
                              </div>
                              <Button size="sm" onClick={() => addExistingBookToShelf(b)}>Add</Button>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Shelf Books CRUD */}
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">Books in {shelves.find(s => s.id === selectedShelfId)?.name}</h4>
                        <div className="space-y-3">
                          {/* Entry / Edit Form */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor="book-title">Title</Label>
                              <Input id="book-title" value={currentBookTitle} onChange={(e) => setCurrentBookTitle(e.target.value)} placeholder="Enter book title" />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="book-author">Author</Label>
                              <Input id="book-author" value={currentBookAuthor} onChange={(e) => setCurrentBookAuthor(e.target.value)} placeholder="Enter author" />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="book-subject">Subject</Label>
                              <Input id="book-subject" value={currentBookSubject} onChange={(e) => setCurrentBookSubject(e.target.value)} placeholder="Enter subject" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {editingBookId ? (
                              <>
                                <Button onClick={saveEditBook}>Save</Button>
                                <Button variant="outline" onClick={() => { setEditingBookId(null); setCurrentBookTitle(""); setCurrentBookAuthor(""); setCurrentBookSubject("") }}>Cancel</Button>
                              </>
                            ) : (
                              <Button onClick={addBookToShelf} disabled={!currentBookTitle || !currentBookAuthor || !currentBookSubject}>Add Book</Button>
                            )}
                          </div>

                          {/* Existing Books List */}
                          <div className="space-y-2 max-h-64 overflow-auto">
                            {shelves.find(s => s.id === selectedShelfId)?.books.map(b => (
                              <div key={b.id} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <p className="font-medium text-sm">{b.title}</p>
                                  <p className="text-xs text-gray-600">by {b.author} • {b.subject}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="outline" onClick={() => startEditBook(b.id, b.title, b.author, b.subject)}>
                                    <Edit className="h-3 w-3 mr-1" /> Edit
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => removeBookFromShelf(b.id)}>
                                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddBooksOpen(false)}>Close</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog open={isEditShelfOpen} onOpenChange={setIsEditShelfOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Shelf
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit {shelves.find(s => s.id === selectedShelfId)?.name}</DialogTitle>
                      <DialogDescription>Delete the shelf or switch using the dropdown above.</DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">Danger Zone</p>
                        <p className="text-sm text-gray-600">Deleting a shelf removes all of its book assignments.</p>
                      </div>
                      <Button variant="destructive" onClick={deleteCurrentShelf} disabled={shelves.length <= 1}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete Shelf
                      </Button>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEditShelfOpen(false)}>Close</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {renderSubjectGrid()}
          </CardContent>
        </Card>

        {/* All Shelves Display */}
        {shelves.length > 1 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>All Shelves</CardTitle>
              <CardDescription>
                Manage and view all library shelves
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {shelves.map((shelf) => (
                  <div key={shelf.id} className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">{shelf.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {shelf.books.length} book(s)
                    </p>
                    {shelf.books.length > 0 && (
                      <div className="space-y-2">
                        {shelf.books.slice(0, 3).map((book) => (
                          <div key={book.id} className="text-sm">
                            <p className="font-medium">{book.title}</p>
                            <p className="text-gray-600">by {book.author}</p>
                          </div>
                        ))}
                        {shelf.books.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{shelf.books.length - 3} more books
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Information */}
        {selectedSubject && (
          <Card>
            <CardHeader>
              <CardTitle>{selectedSubject} - Detailed Information</CardTitle>
              <CardDescription>Real-time monitoring data and component status</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  {(() => {
                    const subject = subjectData.find(s => s.id === selectedSubject)
                    if (!subject) return null
                    
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium mb-2">System Status</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>ESP32 Controller:</span>
                                {getESP32StatusBadge(subject.esp32Status)}
                              </div>
                              <div className="flex justify-between">
                                <span>LED Status:</span>
                                <Badge variant={subject.ledStatus === 'on' ? 'default' : 'outline'}>
                                  {subject.ledStatus}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span>LED Pin:</span>
                                <span className="text-sm text-gray-600">GPIO {subject.ledPin}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Last Update:</span>
                                <span className="text-sm text-gray-600">{subject.lastUpdate}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium mb-2">Subject Information</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Books Available:</span>
                                <span>{subject.books}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Temperature:</span>
                                <span>{subject.temperature}°C</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium mb-2">Power Management</h4>
                            <div className="space-y-3">
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Battery Level</span>
                                  <span className={getPowerLevelColor(subject.powerLevel)}>
                                    {subject.powerLevel}%
                                  </span>
                                </div>
                                <Progress value={subject.powerLevel} className="h-3" />
                              </div>
                              <div className="text-sm text-gray-600">
                                Estimated runtime: {Math.round(subject.powerLevel / 10)} hours
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium mb-2">Quick Actions</h4>
                            <div className="space-y-2">
                              <Button 
                                onClick={() => testSubjectLED(subject.id)}
                                disabled={subject.esp32Status === 'offline'}
                                className="w-full"
                              >
                                <Lightbulb className="h-4 w-4 mr-2" />
                                Test LED Light
                              </Button>
                              <Button variant="outline" className="w-full">
                                <Activity className="h-4 w-4 mr-2" />
                                Run Diagnostics
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </TabsContent>
                
                
                <TabsContent value="diagnostics" className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium mb-2">System Health Check</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>ESP32 Communication</span>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          OK
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>LED Functionality</span>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          OK
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Power Supply</span>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          OK
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Network Connectivity</span>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          OK
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Performance Metrics</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Response Time</span>
                        <div className="text-lg font-semibold">45ms</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Uptime</span>
                        <div className="text-lg font-semibold">99.8%</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Signal Strength</span>
                        <div className="text-lg font-semibold">-42 dBm</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Memory Usage</span>
                        <div className="text-lg font-semibold">68%</div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
          </div>
        </div>
      </div>
    </div>
  )
}
