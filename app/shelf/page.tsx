"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent, DragOverEvent } from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Lightbulb, Zap, Wifi, AlertTriangle, CheckCircle, Activity, Calculator, Atom, Globe, Heart, Shield, Wrench, Plus, X, Edit, Trash2, BookPlus, Search, GripVertical } from 'lucide-react'
import { AdminSidebar } from "@/components/admin-sidebar"
import { SUBJECTS } from "@/lib/subjects"
import { useRouter } from "next/navigation"

// Sortable Book Item Component
function SortableBookItem({ 
  book, 
  bookData, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete, 
  isLoading 
}: { 
  book: { id: string, title: string, author: string, subject: string, catalog_no?: string },
  bookData?: any,
  isSelected: boolean,
  onSelect: () => void,
  onEdit: () => void,
  onDelete: () => void,
  isLoading: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: book.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      <Checkbox
        checked={isSelected}
        onCheckedChange={onSelect}
      />
      <div className="flex items-center gap-3 flex-1">
        <div className="w-12 h-16 bg-gray-200 rounded border flex items-center justify-center">
          <BookPlus className="h-6 w-6 text-gray-400" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">{book.title}</p>
          <p className="text-xs text-gray-600">by {book.author} • {book.subject}</p>
          {book.catalog_no && (
            <p className="text-xs text-gray-500">Catalog No: {book.catalog_no}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Edit className="h-3 w-3 mr-1" /> Edit
        </Button>
        <Button size="sm" variant="destructive" onClick={onDelete} disabled={isLoading}>
          <Trash2 className="h-3 w-3 mr-1" /> Delete
        </Button>
      </div>
    </div>
  )
}

export default function ShelfPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [books, setBooks] = useState<any[]>([])
  const isSubmittingRef = useRef(false) // Use ref to prevent double submissions
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
    { id: 1, name: "Shelf 1", books: [] },
    { id: 2, name: "Shelf 2", books: [] },
    { id: 3, name: "Shelf 3", books: [] },
    { id: 4, name: "Shelf 4", books: [] }
  ])
  const [selectedShelfId, setSelectedShelfId] = useState<number>(1)
  const [availableBooksShelfFilter, setAvailableBooksShelfFilter] = useState<string>("all")
  
  // Search and multi-select state
  const [searchQuery, setSearchQuery] = useState("")
  const [shelfSearchQuery, setShelfSearchQuery] = useState("")
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dragOverShelf, setDragOverShelf] = useState<number | null>(null)
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Book entry/edit state
  const [currentBookTitle, setCurrentBookTitle] = useState("")
  const [currentBookAuthor, setCurrentBookAuthor] = useState("")
  const [currentBookSubject, setCurrentBookSubject] = useState("")
  const [currentBookCatalogNo, setCurrentBookCatalogNo] = useState("")
  const [currentBookQuantity, setCurrentBookQuantity] = useState("1")
  const [currentBookShelf, setCurrentBookShelf] = useState("Shelf 1")
  const [editingBookId, setEditingBookId] = useState<string | null>(null)
  const [currentBookCover, setCurrentBookCover] = useState<File | null>(null)
  const [currentBookCoverPreview, setCurrentBookCoverPreview] = useState<string | null>(null)
  const [currentBookCoverUrl, setCurrentBookCoverUrl] = useState<string | null>(null)
  const [isUploadingCover, setIsUploadingCover] = useState(false)

  // Fetch books and shelves from database on mount
  useEffect(() => {
    fetchBooks()
    fetchShelves()
  }, [])

  const fetchShelves = async () => {
    try {
      const response = await fetch('/api/shelves')
      const data = await response.json()
      
      if (response.ok && data.shelves) {
        // Update shelves list with dynamic shelves from API
        const shelfArray = data.shelves.map((shelf: any, index: number) => ({
          id: shelf.id || index + 1,
          name: shelf.name,
          books: []
        }))
        
        setShelves(shelfArray)
        
        // Update current shelf selection if needed
        if (shelfArray.length > 0 && !shelfArray.find((s: any) => s.id === selectedShelfId)) {
          setSelectedShelfId(shelfArray[0].id)
          setCurrentBookShelf(shelfArray[0].name)
        }
      }
    } catch (error) {
      console.error('Failed to fetch shelves:', error)
    }
  }

  const fetchBooks = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/books')
      const data = await response.json()
      
      if (response.ok) {
        setBooks(data.books || [])
        // Update shelves with books from database
        const booksByShelf = (data.books || []).map((book: any) => ({
          id: book.id.toString(),
          title: book.title,
          author: book.author,
          subject: book.subject,
          catalog_no: book.catalog_no,
          quantity: book.quantity || 1,
          shelf: book.shelf || "Shelf 1"
        }))
        
        // Organize books by shelf using current shelves state
        setShelves(prevShelves => {
          return prevShelves.map(shelf => {
            const shelfBooks = booksByShelf.filter((b: any) => (b.shelf || "Shelf 1") === shelf.name)
            return {
              ...shelf,
              books: shelfBooks
            }
          })
        })
      }
    } catch (error) {
      console.error('Failed to fetch books:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Available books catalog (sample data - can be replaced with database books)
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

  const uploadCoverPhoto = async (file: File, bookId?: number): Promise<string | null> => {
    try {
      setIsUploadingCover(true)
      const adminToken = localStorage.getItem('adminToken')
      const adminUser = localStorage.getItem('adminUser')

      const formData = new FormData()
      formData.append('file', file)
      if (bookId) {
        formData.append('bookId', bookId.toString())
      }

      const response = await fetch('/api/books/upload-cover', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-user': adminUser || ''
        },
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        return data.url
      } else {
        console.error('Upload error:', data.error)
        alert(`Failed to upload cover photo: ${data.error}`)
        return null
      }
    } catch (error) {
      console.error('Error uploading cover:', error)
      alert('Failed to upload cover photo. Please try again.')
      return null
    } finally {
      setIsUploadingCover(false)
    }
  }

  const handleCoverPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Only JPG, PNG, WebP, and GIF images are allowed.')
        return
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit.')
        return
      }

      setCurrentBookCover(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setCurrentBookCoverPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const addBookToShelf = async () => {
    if (!currentBookTitle.trim() || !currentBookAuthor.trim() || !currentBookSubject.trim()) return
    
    // Prevent double-submission using ref (more reliable than state)
    if (isSubmittingRef.current || isLoading) {
      console.warn('Book addition already in progress, ignoring duplicate call')
      return
    }

    try {
      isSubmittingRef.current = true
      setIsLoading(true)
      const adminToken = localStorage.getItem('adminToken')
      const adminUser = localStorage.getItem('adminUser')

      // Upload cover photo if provided
      let coverPhotoUrl = currentBookCoverUrl
      if (currentBookCover && !coverPhotoUrl) {
        const uploadedUrl = await uploadCoverPhoto(currentBookCover)
        if (uploadedUrl) {
          coverPhotoUrl = uploadedUrl
          setCurrentBookCoverUrl(uploadedUrl)
        }
      }

      // Create book in database
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-user': adminUser || ''
        },
        body: JSON.stringify({
          title: currentBookTitle.trim(),
          author: currentBookAuthor.trim(),
          subject: currentBookSubject.trim(),
          catalog_no: currentBookCatalogNo.trim() || null,
          cover_photo_url: coverPhotoUrl || null,
          quantity: parseInt(currentBookQuantity) || 1,
          shelf: currentBookShelf || "Shelf 1"
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Show warning if quantity column doesn't exist
        if (data.warning) {
          alert(`Warning: ${data.warning}`)
        }
        // Refresh books list
        await fetchBooks()
        // Reset form
        setCurrentBookTitle("")
        setCurrentBookAuthor("")
        setCurrentBookSubject("")
        setCurrentBookCatalogNo("")
        setCurrentBookQuantity("1")
        setCurrentBookShelf("Shelf 1")
        setCurrentBookCover(null)
        setCurrentBookCoverPreview(null)
        setCurrentBookCoverUrl(null)
      } else {
        // Handle duplicate error specifically
        if (response.status === 409) {
          alert(`This book already exists: ${data.error}\n\nIf you want to add another copy, please increase the quantity instead.`)
        } else {
          alert(`Error: ${data.error}`)
        }
      }
    } catch (error) {
      console.error('Error adding book:', error)
      alert('Failed to add book. Please try again.')
    } finally {
      setIsLoading(false)
      isSubmittingRef.current = false
    }
  }

  const addExistingBookToShelf = (book: { id: string, title: string, author: string, subject: string }) => {
    // This function adds an existing book from the catalog to the shelf
    // For now, we'll just add it to local state (shelf assignment)
    // In a full implementation, you might want to track shelf assignments in the database
    const toAdd = { ...book, id: `book-${Date.now()}` }
    setShelves(prev => prev.map(s => s.id === selectedShelfId ? { ...s, books: [...s.books, toAdd] } : s))
  }

  const removeBookFromShelf = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      return
    }

    try {
      setIsLoading(true)
      const adminToken = localStorage.getItem('adminToken')
      const adminUser = localStorage.getItem('adminUser')

      // Find the book to get its database ID
      const book = books.find(b => b.id.toString() === bookId || b.id === parseInt(bookId))
      if (!book) {
        // If not found in database, just remove from local state
        setShelves(prev => prev.map(s => s.id === selectedShelfId ? { ...s, books: s.books.filter(b => b.id !== bookId) } : s))
        setIsLoading(false)
        return
      }

      const response = await fetch(`/api/books?id=${book.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-user': adminUser || ''
        }
      })

      const data = await response.json()

      if (response.ok) {
        // Refresh books list
        await fetchBooks()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error deleting book:', error)
      alert('Failed to delete book. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const startEditBook = (bookId: string, title: string, author: string, subject: string, catalogNo?: string, coverPhotoUrl?: string, quantity?: number, shelf?: string) => {
    setEditingBookId(bookId)
    setCurrentBookTitle(title)
    setCurrentBookAuthor(author)
    setCurrentBookSubject(subject)
    setCurrentBookCatalogNo(catalogNo || "")
    setCurrentBookQuantity(quantity?.toString() || "1")
    setCurrentBookShelf(shelf || "Shelf 1")
    setCurrentBookCoverUrl(coverPhotoUrl || null)
    setCurrentBookCover(null)
    setCurrentBookCoverPreview(coverPhotoUrl || null)
  }

  const saveEditBook = async () => {
    if (!editingBookId) return

    try {
      setIsLoading(true)
      const adminToken = localStorage.getItem('adminToken')
      const adminUser = localStorage.getItem('adminUser')

      // Find the book to get its database ID
      const book = books.find(b => b.id.toString() === editingBookId || b.id === parseInt(editingBookId))
      if (!book) {
        alert('Book not found')
        setIsLoading(false)
        return
      }

      // Upload cover photo if a new one was selected
      let coverPhotoUrl = currentBookCoverUrl
      if (currentBookCover) {
        const uploadedUrl = await uploadCoverPhoto(currentBookCover, book.id)
        if (uploadedUrl) {
          coverPhotoUrl = uploadedUrl
          setCurrentBookCoverUrl(uploadedUrl)
        }
      }

      // Update book in database
      const response = await fetch('/api/books', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-user': adminUser || ''
        },
        body: JSON.stringify({
          id: book.id,
          title: currentBookTitle.trim(),
          author: currentBookAuthor.trim(),
          subject: currentBookSubject.trim(),
          catalog_no: currentBookCatalogNo.trim() || null,
          cover_photo_url: coverPhotoUrl || null,
          quantity: parseInt(currentBookQuantity) || 1,
          shelf: currentBookShelf || "Shelf 1"
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Show warning if quantity column doesn't exist
        if (data.warning) {
          alert(`Warning: ${data.warning}`)
        }
        // Refresh books list
        await fetchBooks()
        // Reset form
        setEditingBookId(null)
        setCurrentBookTitle("")
        setCurrentBookAuthor("")
        setCurrentBookSubject("")
        setCurrentBookCatalogNo("")
        setCurrentBookQuantity("1")
        setCurrentBookShelf("Shelf 1")
        setCurrentBookCover(null)
        setCurrentBookCoverPreview(null)
        setCurrentBookCoverUrl(null)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error updating book:', error)
      alert('Failed to update book. Please try again.')
    } finally {
      setIsLoading(false)
    }
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

  // Search filter function
  const filterBooksBySearch = (bookList: Array<{id: string, title: string, author: string, subject: string, shelf?: string, catalog_no?: string}>) => {
    if (!searchQuery.trim()) return bookList
    const query = searchQuery.toLowerCase().trim()
    return bookList.filter(book => 
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.subject.toLowerCase().includes(query) ||
      (book.catalog_no && book.catalog_no.toLowerCase().includes(query))
    )
  }

  // Toggle book selection
  const toggleBookSelection = (bookId: string) => {
    setSelectedBooks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(bookId)) {
        newSet.delete(bookId)
      } else {
        newSet.add(bookId)
      }
      return newSet
    })
  }

  // Select all/none
  const toggleSelectAll = (bookIds: string[]) => {
    if (selectedBooks.size === bookIds.length) {
      setSelectedBooks(new Set())
    } else {
      setSelectedBooks(new Set(bookIds))
    }
  }

  // Batch delete
  const batchDeleteBooks = async () => {
    if (selectedBooks.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedBooks.size} book(s)? This action cannot be undone.`)) {
      return
    }

    try {
      setIsLoading(true)
      const adminToken = localStorage.getItem('adminToken')
      const adminUser = localStorage.getItem('adminUser')

      const deletePromises = Array.from(selectedBooks).map(async (bookId) => {
        const book = books.find(b => b.id.toString() === bookId || b.id === parseInt(bookId))
        if (book) {
          const response = await fetch(`/api/books?id=${book.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'x-admin-user': adminUser || ''
            }
          })
          return response.ok
        }
        return false
      })

      await Promise.all(deletePromises)
      setSelectedBooks(new Set())
      await fetchBooks()
    } catch (error) {
      console.error('Error deleting books:', error)
      alert('Failed to delete books. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Batch move to shelf
  const batchMoveToShelf = async (targetShelfName: string) => {
    if (selectedBooks.size === 0) return

    try {
      setIsLoading(true)
      const adminToken = localStorage.getItem('adminToken')
      const adminUser = localStorage.getItem('adminUser')

      const updatePromises = Array.from(selectedBooks).map(async (bookId) => {
        const book = books.find(b => b.id.toString() === bookId || b.id === parseInt(bookId))
        if (book) {
          const response = await fetch('/api/books', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${adminToken}`,
              'x-admin-user': adminUser || ''
            },
            body: JSON.stringify({
              id: book.id,
              title: book.title,
              author: book.author,
              subject: book.subject,
              catalog_no: book.catalog_no || null,
              cover_photo_url: book.cover_photo_url || null,
              quantity: book.quantity || 1,
              shelf: targetShelfName
            })
          })
          return response.ok
        }
        return false
      })

      await Promise.all(updatePromises)
      setSelectedBooks(new Set())
      await fetchBooks()
    } catch (error) {
      console.error('Error moving books:', error)
      alert('Failed to move books. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setDragOverShelf(null)

    if (!over) return

    const bookId = active.id as string
    const targetShelfId = over.id as number

    // Find the book
    const book = books.find(b => b.id.toString() === bookId || b.id === parseInt(bookId))
    if (!book) return

    // Find target shelf
    const targetShelf = shelves.find(s => s.id === targetShelfId)
    if (!targetShelf) return

    // Don't update if already on that shelf
    if (book.shelf === targetShelf.name) return

    try {
      setIsLoading(true)
      const adminToken = localStorage.getItem('adminToken')
      const adminUser = localStorage.getItem('adminUser')

      const response = await fetch('/api/books', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-user': adminUser || ''
        },
        body: JSON.stringify({
          id: book.id,
          title: book.title,
          author: book.author,
          subject: book.subject,
          catalog_no: book.catalog_no || null,
          cover_photo_url: book.cover_photo_url || null,
          quantity: book.quantity || 1,
          shelf: targetShelf.name
        })
      })

      if (response.ok) {
        await fetchBooks()
      }
    } catch (error) {
      console.error('Error moving book:', error)
      alert('Failed to move book. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    if (over && typeof over.id === 'number') {
      setDragOverShelf(over.id)
    }
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
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Available Books</h4>
                          <select
                            value={availableBooksShelfFilter}
                            onChange={(e) => setAvailableBooksShelfFilter(e.target.value)}
                            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="all">All Shelves</option>
                            {shelves.map(s => (
                              <option key={s.id} value={s.name}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                        {/* Search Bar */}
                        <div className="mb-3">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search by title, author, subject, or catalog number..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-8"
                            />
                          </div>
                        </div>
                        {/* Batch Actions Toolbar */}
                        {selectedBooks.size > 0 && (
                          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-900">
                              {selectedBooks.size} book(s) selected
                            </span>
                            <div className="flex gap-2">
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    batchMoveToShelf(e.target.value)
                                    e.target.value = ""
                                  }
                                }}
                                className="text-xs px-2 py-1 border rounded"
                                defaultValue=""
                              >
                                <option value="">Move to shelf...</option>
                                {shelves.map(s => (
                                  <option key={s.id} value={s.name}>{s.name}</option>
                                ))}
                              </select>
                              <Button size="sm" variant="destructive" onClick={batchDeleteBooks}>
                                <Trash2 className="h-3 w-3 mr-1" /> Delete
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setSelectedBooks(new Set())}>
                                Clear
                              </Button>
                            </div>
                          </div>
                        )}
                        <div className="space-y-2 max-h-72 overflow-auto">
                          {(() => {
                            // Filter books based on selected shelf
                            let filteredBooks: Array<{id: string, title: string, author: string, subject: string, shelf?: string, catalog_no?: string}> = []
                            
                            if (availableBooksShelfFilter === "all") {
                              // Show all books from database
                              filteredBooks = books.map((book: any) => ({
                                id: book.id.toString(),
                                title: book.title,
                                author: book.author,
                                subject: book.subject,
                                shelf: book.shelf || "Shelf 1",
                                catalog_no: book.catalog_no
                              }))
                            } else {
                              // Filter from database books by shelf
                              filteredBooks = books
                                .filter((book: any) => (book.shelf || "Shelf 1") === availableBooksShelfFilter)
                                .map((book: any) => ({
                                  id: book.id.toString(),
                                  title: book.title,
                                  author: book.author,
                                  subject: book.subject,
                                  shelf: book.shelf || "Shelf 1",
                                  catalog_no: book.catalog_no
                                }))
                            }
                            
                            // Apply search filter
                            filteredBooks = filterBooksBySearch(filteredBooks)
                            
                            if (filteredBooks.length === 0) {
                              return (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                  No books found {searchQuery ? `matching "${searchQuery}"` : `in ${availableBooksShelfFilter === "all" ? "any shelf" : availableBooksShelfFilter}`}
                                </div>
                              )
                            }
                            
                            return (
                              <>
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                                  <Checkbox
                                    checked={selectedBooks.size === filteredBooks.length && filteredBooks.length > 0}
                                    onCheckedChange={() => toggleSelectAll(filteredBooks.map(b => b.id))}
                                  />
                                  <span className="text-xs text-gray-600">Select all</span>
                                </div>
                                {filteredBooks.map(b => {
                                  const book = books.find((bk: any) => bk.id.toString() === b.id)
                                  return (
                                    <div key={b.id} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
                                      <Checkbox
                                        checked={selectedBooks.has(b.id)}
                                        onCheckedChange={() => toggleBookSelection(b.id)}
                                      />
                                      <div className="flex-1">
                                        <p className="font-medium text-sm">{b.title}</p>
                                        <p className="text-xs text-gray-600">by {b.author} • {b.subject}</p>
                                        {b.shelf && (
                                          <p className="text-xs text-gray-500">Shelf: {b.shelf}</p>
                                        )}
                                        {b.catalog_no && (
                                          <p className="text-xs text-gray-500">Catalog: {b.catalog_no}</p>
                                        )}
                                      </div>
                                      <div className="flex gap-1">
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => {
                                            if (book) {
                                              startEditBook(
                                                b.id,
                                                book.title,
                                                book.author,
                                                book.subject,
                                                book.catalog_no,
                                                book.cover_photo_url,
                                                book.quantity,
                                                book.shelf
                                              )
                                            }
                                          }}
                                        >
                                          <Edit className="h-3 w-3 mr-1" /> Edit
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="destructive"
                                          onClick={() => removeBookFromShelf(b.id)}
                                          disabled={isLoading}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  )
                                })}
                              </>
                            )
                          })()}
                        </div>
                      </div>
                      {/* Shelf Books CRUD */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Books in {shelves.find(s => s.id === selectedShelfId)?.name}</h4>
                        </div>
                        {/* Search Bar for Shelf Books */}
                        <div className="mb-3">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search books in this shelf..."
                              value={shelfSearchQuery}
                              onChange={(e) => setShelfSearchQuery(e.target.value)}
                              className="pl-8"
                            />
                          </div>
                        </div>
                        {/* Batch Actions Toolbar for Shelf Books */}
                        {selectedBooks.size > 0 && (
                          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-900">
                              {selectedBooks.size} book(s) selected
                            </span>
                            <div className="flex gap-2">
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    batchMoveToShelf(e.target.value)
                                    e.target.value = ""
                                  }
                                }}
                                className="text-xs px-2 py-1 border rounded"
                                defaultValue=""
                              >
                                <option value="">Move to shelf...</option>
                                {shelves.map(s => (
                                  <option key={s.id} value={s.name}>{s.name}</option>
                                ))}
                              </select>
                              <Button size="sm" variant="destructive" onClick={batchDeleteBooks}>
                                <Trash2 className="h-3 w-3 mr-1" /> Delete
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setSelectedBooks(new Set())}>
                                Clear
                              </Button>
                            </div>
                          </div>
                        )}
                        <div className="space-y-3">
                          {/* Entry / Edit Form */}
                          <div className="grid grid-cols-2 gap-3">
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
                              <select
                                id="book-subject"
                                value={currentBookSubject}
                                onChange={(e) => setCurrentBookSubject(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                              >
                                <option value="">Select subject</option>
                                {SUBJECTS.map((subject) => (
                                  <option key={subject} value={subject}>
                                    {subject}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="book-catalog-no">Catalog No.</Label>
                              <Input id="book-catalog-no" value={currentBookCatalogNo} onChange={(e) => setCurrentBookCatalogNo(e.target.value)} placeholder="Enter catalog number" />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="book-quantity">Quantity</Label>
                              <Input 
                                id="book-quantity" 
                                type="number" 
                                min="1" 
                                value={currentBookQuantity} 
                                onChange={(e) => setCurrentBookQuantity(e.target.value)} 
                                placeholder="1" 
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="book-shelf">Shelf</Label>
                              <select
                                id="book-shelf"
                                value={currentBookShelf}
                                onChange={(e) => setCurrentBookShelf(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                              >
                                {shelves.map((shelf) => (
                                  <option key={shelf.id} value={shelf.name}>
                                    {shelf.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2 col-span-2">
                            {editingBookId ? (
                              <>
                                <Button onClick={saveEditBook} disabled={isLoading}>Save</Button>
                                <Button variant="outline" onClick={() => { 
                                  setEditingBookId(null)
                                  setCurrentBookTitle("")
                                  setCurrentBookAuthor("")
                                  setCurrentBookSubject("")
                                  setCurrentBookCatalogNo("")
                                  setCurrentBookQuantity("1")
                                }}>Cancel</Button>
                              </>
                            ) : (
                              <Button 
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  addBookToShelf()
                                }} 
                                disabled={!currentBookTitle || !currentBookAuthor || !currentBookSubject || isLoading || isSubmittingRef.current}
                              >
                                {isLoading ? 'Adding...' : 'Add Book'}
                              </Button>
                            )}
                          </div>

                          {/* Existing Books List with Drag and Drop */}
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onDragOver={handleDragOver}
                          >
                            <div className="space-y-2 max-h-64 overflow-auto">
                              {(() => {
                                const shelfBooks = shelves.find(s => s.id === selectedShelfId)?.books || []
                                const searchFilter = (bookList: Array<{id: string, title: string, author: string, subject: string, catalog_no?: string}>) => {
                                  if (!shelfSearchQuery.trim()) return bookList
                                  const query = shelfSearchQuery.toLowerCase().trim()
                                  return bookList.filter(book => 
                                    book.title.toLowerCase().includes(query) ||
                                    book.author.toLowerCase().includes(query) ||
                                    book.subject.toLowerCase().includes(query) ||
                                    (book.catalog_no && book.catalog_no.toLowerCase().includes(query))
                                  )
                                }
                                const filteredShelfBooks = searchFilter(shelfBooks.map(b => ({
                                  id: b.id,
                                  title: b.title,
                                  author: b.author,
                                  subject: b.subject,
                                  catalog_no: (b as any).catalog_no
                                })))
                                
                                if (filteredShelfBooks.length === 0) {
                                  return (
                                    <div className="text-center py-8 text-gray-500 text-sm">
                                      No books found {shelfSearchQuery ? `matching "${shelfSearchQuery}"` : "in this shelf"}
                                    </div>
                                  )
                                }
                                
                                return (
                                  <>
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                                      <Checkbox
                                        checked={selectedBooks.size === filteredShelfBooks.length && filteredShelfBooks.length > 0}
                                        onCheckedChange={() => toggleSelectAll(filteredShelfBooks.map(b => b.id))}
                                      />
                                      <span className="text-xs text-gray-600">Select all</span>
                                    </div>
                                    <SortableContext items={filteredShelfBooks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                                      {filteredShelfBooks.map(b => {
                                        const book = books.find((bk: any) => bk.id.toString() === b.id)
                                        return (
                                          <SortableBookItem
                                            key={b.id}
                                            book={b}
                                            bookData={book}
                                            isSelected={selectedBooks.has(b.id)}
                                            onSelect={() => toggleBookSelection(b.id)}
                                            onEdit={() => {
                                              if (book) {
                                                startEditBook(
                                                  b.id,
                                                  book.title,
                                                  book.author,
                                                  book.subject,
                                                  book.catalog_no,
                                                  book.cover_photo_url,
                                                  book.quantity,
                                                  book.shelf
                                                )
                                              }
                                            }}
                                            onDelete={() => removeBookFromShelf(b.id)}
                                            isLoading={isLoading}
                                          />
                                        )
                                      })}
                                    </SortableContext>
                                  </>
                                )
                              })()}
                            </div>
                            <DragOverlay>
                              {activeId ? (
                                <div className="p-2 border rounded bg-white shadow-lg opacity-90">
                                  <p className="font-medium text-sm">
                                    {books.find((b: any) => b.id.toString() === activeId)?.title || "Book"}
                                  </p>
                                </div>
                              ) : null}
                            </DragOverlay>
                          </DndContext>
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
