// Shared subject list for the Smart Library System
// Includes all subject categories used in the system

export const SUBJECTS = [
  'Mathematics',
  'Science',
  'Social Studies',
  'PEHM',
  'Values Education',
  'TLE',
  'Thesis',
  'Fiction',
  'Medicine',
  'Agriculture',
  'Computer Studies',
  'Comics'
] as const

export type Subject = typeof SUBJECTS[number]

