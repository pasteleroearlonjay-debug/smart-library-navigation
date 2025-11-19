// Firebase Setup Script for Smart Library System
// Run this script to initialize your Firebase Firestore database

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, setDoc } = require('firebase/firestore');

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample books data
const books = [
  // Mathematics books
  { title: "Algebra Fundamentals", author: "John Smith", subject: "Mathematics", isbn: "978-0-123456-01-1", available: true, created_at: new Date() },
  { title: "Calculus Made Easy", author: "Mary Johnson", subject: "Mathematics", isbn: "978-0-123456-01-2", available: true, created_at: new Date() },
  { title: "Geometry Basics", author: "David Wilson", subject: "Mathematics", isbn: "978-0-123456-01-3", available: false, created_at: new Date() },
  
  // Science books
  { title: "Physics Principles", author: "Sarah Brown", subject: "Science", isbn: "978-0-123456-02-1", available: true, created_at: new Date() },
  { title: "Chemistry Basics", author: "Michael Davis", subject: "Science", isbn: "978-0-123456-02-2", available: true, created_at: new Date() },
  { title: "Biology Essentials", author: "Lisa Garcia", subject: "Science", isbn: "978-0-123456-02-3", available: true, created_at: new Date() },
  
  // Social Studies books
  { title: "World History", author: "Robert Martinez", subject: "Social Studies", isbn: "978-0-123456-03-1", available: true, created_at: new Date() },
  { title: "Philippine History", author: "Ana Rodriguez", subject: "Social Studies", isbn: "978-0-123456-03-2", available: true, created_at: new Date() },
  { title: "Geography Today", author: "Carlos Lopez", subject: "Social Studies", isbn: "978-0-123456-03-3", available: false, created_at: new Date() },
  
  // PEHM books
  { title: "Physical Education Guide", author: "Maria Santos", subject: "PEHM", isbn: "978-0-123456-04-1", available: true, created_at: new Date() },
  { title: "Health and Wellness", author: "Jose Cruz", subject: "PEHM", isbn: "978-0-123456-04-2", available: true, created_at: new Date() },
  { title: "Music Appreciation", author: "Carmen Reyes", subject: "PEHM", isbn: "978-0-123456-04-3", available: true, created_at: new Date() },
  
  // Values Education books
  { title: "Moral Values", author: "Pedro Torres", subject: "Values Education", isbn: "978-0-123456-05-1", available: true, created_at: new Date() },
  { title: "Character Building", author: "Rosa Mendoza", subject: "Values Education", isbn: "978-0-123456-05-2", available: true, created_at: new Date() },
  { title: "Ethics and Society", author: "Manuel Flores", subject: "Values Education", isbn: "978-0-123456-05-3", available: false, created_at: new Date() },
  
  // TLE books
  { title: "Computer Programming", author: "Luz Gonzales", subject: "TLE", isbn: "978-0-123456-06-1", available: true, created_at: new Date() },
  { title: "Cooking Basics", author: "Antonio Rivera", subject: "TLE", isbn: "978-0-123456-06-2", available: true, created_at: new Date() },
  { title: "Electrical Wiring", author: "Elena Morales", subject: "TLE", isbn: "978-0-123456-06-3", available: true, created_at: new Date() }
];

// LED states data
const ledStates = [
  { led_pin: 1, subject: "Mathematics", state: "off", last_updated: new Date() },
  { led_pin: 2, subject: "Science", state: "off", last_updated: new Date() },
  { led_pin: 3, subject: "Social Studies", state: "off", last_updated: new Date() },
  { led_pin: 4, subject: "PEHM", state: "off", last_updated: new Date() },
  { led_pin: 5, subject: "Values Education", state: "off", last_updated: new Date() },
  { led_pin: 6, subject: "TLE", state: "off", last_updated: new Date() }
];

// Sample users data
const users = [
  { username: "admin", email: "admin@library.com", password_hash: "$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", role: "admin", created_at: new Date() },
  { username: "librarian1", email: "librarian@library.com", password_hash: "$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", role: "librarian", created_at: new Date() },
  { username: "student1", email: "student@school.com", password_hash: "$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", role: "student", created_at: new Date() }
];

async function initializeFirebase() {
  try {
    console.log('Starting Firebase initialization...');
    
    // Add books
    console.log('Adding books...');
    for (const book of books) {
      await addDoc(collection(db, 'books'), book);
    }
    console.log('Books added successfully!');
    
    // Add LED states
    console.log('Adding LED states...');
    for (const ledState of ledStates) {
      await addDoc(collection(db, 'led_states'), ledState);
    }
    console.log('LED states added successfully!');
    
    // Add users
    console.log('Adding users...');
    for (const user of users) {
      await addDoc(collection(db, 'users'), user);
    }
    console.log('Users added successfully!');
    
    console.log('Firebase initialization completed successfully!');
    
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
}

// Run the initialization
initializeFirebase();
