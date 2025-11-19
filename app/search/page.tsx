"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Lightbulb, MapPin, BookOpen, Calculator, Atom, Globe, Heart, Shield, Wrench } from "lucide-react"
// Removed admin sidebar for user-facing Search & Light page

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<any[]>([])

  // Subject mapping with icons only (hide LED pin/power/online details)
  const subjects = {
    "Mathematics": { icon: Calculator, color: "bg-blue-500", books: 3 },
    "Science": { icon: Atom, color: "bg-green-500", books: 3 },
    "Social Studies": { icon: Globe, color: "bg-yellow-500", books: 3 },
    "PEHM": { icon: Heart, color: "bg-red-500", books: 3 },
    "Values Education": { icon: Shield, color: "bg-purple-500", books: 3 },
    "TLE": { icon: Wrench, color: "bg-orange-500", books: 3 },
  }

  // Sample books database with subject mapping
  const books = [
    // Mathematics books
    { id: 1, title: "Algebra Fundamentals", author: "John Smith", subject: "Mathematics", available: true },
    { id: 2, title: "Calculus Made Easy", author: "Mary Johnson", subject: "Mathematics", available: true },
    { id: 3, title: "Geometry Basics", author: "David Wilson", subject: "Mathematics", available: false },
    
    // Science books
    { id: 4, title: "Physics Principles", author: "Sarah Brown", subject: "Science", available: true },
    { id: 5, title: "Chemistry Basics", author: "Michael Davis", subject: "Science", available: true },
    { id: 6, title: "Biology Essentials", author: "Lisa Garcia", subject: "Science", available: true },
    
    // Social Studies books
    { id: 7, title: "World History", author: "Robert Martinez", subject: "Social Studies", available: true },
    { id: 8, title: "Philippine History", author: "Ana Rodriguez", subject: "Social Studies", available: true },
    { id: 9, title: "Geography Today", author: "Carlos Lopez", subject: "Social Studies", available: false },
    
    // PEHM books
    { id: 10, title: "Physical Education Guide", author: "Maria Santos", subject: "PEHM", available: true },
    { id: 11, title: "Health and Wellness", author: "Jose Cruz", subject: "PEHM", available: true },
    { id: 12, title: "Music Appreciation", author: "Carmen Reyes", subject: "PEHM", available: true },
    
    // Values Education books
    { id: 13, title: "Moral Values", author: "Pedro Torres", subject: "Values Education", available: true },
    { id: 14, title: "Character Building", author: "Rosa Mendoza", subject: "Values Education", available: true },
    { id: 15, title: "Ethics and Society", author: "Manuel Flores", subject: "Values Education", available: false },
    
    // TLE books
    { id: 16, title: "Computer Programming", author: "Luz Gonzales", subject: "TLE", available: true },
    { id: 17, title: "Cooking Basics", author: "Antonio Rivera", subject: "TLE", available: true },
    { id: 18, title: "Electrical Wiring", author: "Elena Morales", subject: "TLE", available: true },
  ]

  const handleSearch = () => {
    if (!searchQuery.trim()) return

    const results = books.filter(
      (book) =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.subject.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    setSearchResults(results)
  }

  const lightUpSubject = async (subject: string) => {
    setSelectedSubject(subject)

    try {
      // Send command to turn the LED ON for the subject
      await fetch("/api/led/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          subject: subject, 
          state: "on" 
        }),
      })

      // Simulate the light staying on for 5 seconds, then turn it off
      setTimeout(async () => {
        await fetch("/api/led/control", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            subject: subject, 
            state: "off" 
          }),
        })
        setSelectedSubject(null)
      }, 5000)
    } catch (error) {
      console.error("Failed to control LED:", error)
      setSelectedSubject(null) // Reset UI on error
    }
  }

  const renderSubjectGrid = () => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(subjects).map(([subjectName, subjectInfo]) => {
          const Icon = subjectInfo.icon
          const isLit = selectedSubject === subjectName
          return (
            <div
              key={subjectName}
              className={`aspect-square border-2 rounded-lg flex flex-col items-center justify-center p-4 transition-all duration-300 ${
                isLit ? "bg-yellow-100 border-yellow-400 shadow-lg shadow-yellow-300" : "bg-gray-50 border-gray-200"
              }`}
            >
              <Icon className={`h-8 w-8 mb-2 ${isLit ? "text-yellow-600" : "text-gray-400"}`} />
              <div className="text-sm font-bold mb-1 text-center">{subjectName}</div>
              <div className={`w-4 h-4 rounded-full ${isLit ? "bg-yellow-500" : subjectInfo.color}`} />
              {isLit && <Lightbulb className="h-4 w-4 text-yellow-600 mt-1" />}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Search & LED Lighting</h1>
          <p className="text-lg text-gray-600">Find books and illuminate their subject area with ESP32 LEDs</p>
        </div>

        {/* Search Interface */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Book Search
            </CardTitle>
            <CardDescription>Search by title, author, or subject to activate subject area LED</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Enter book title, author, or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Search Results */}
          <Card>
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>
                {searchResults.length > 0
                  ? `Found ${searchResults.length} book(s)`
                  : "Enter a search term to find books"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {searchResults.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.map((book) => (
                    <div key={book.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{book.title}</h3>
                          <p className="text-gray-600">by {book.author}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium">Subject: {book.subject}</span>
                            <Badge variant={book.available ? "default" : "destructive"}>
                              {book.available ? "Available" : "Borrowed"}
                            </Badge>
                          </div>
                        </div>
                        <Button 
                          onClick={() => lightUpSubject(book.subject)} 
                          disabled={!book.available} 
                          className="ml-4"
                        >
                          <Lightbulb className="h-4 w-4 mr-2" />
                          Light Up
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No search results yet. Try searching for a book!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subject LED Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Shelf 1</CardTitle>
              <CardDescription>
                {selectedSubject
                  ? `${selectedSubject} LED is currently lit up`
                  : "LED lights will illuminate when you search for a book"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderSubjectGrid()}
              <div className="mt-6 text-center">
                <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    <span>LED Off</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                    <span>LED On</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>ESP32 LED System Components</CardTitle>
            <CardDescription>Hardware components for the smart library lighting system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-500 rounded mx-auto mb-2"></div>
                <h4 className="font-medium">ESP32</h4>
                <p className="text-sm text-gray-600">Wi-Fi microcontroller</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="w-8 h-8 bg-green-500 rounded mx-auto mb-2"></div>
                <h4 className="font-medium">6 LEDs</h4>
                <p className="text-sm text-gray-600">Subject area indicators</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="w-8 h-8 bg-orange-500 rounded mx-auto mb-2"></div>
                <h4 className="font-medium">Breadboard</h4>
                <p className="text-sm text-gray-600">Circuit connections</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="w-8 h-8 bg-red-500 rounded mx-auto mb-2"></div>
                <h4 className="font-medium">Power Supply</h4>
                <p className="text-sm text-gray-600">5V DC power source</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
