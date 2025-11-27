import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase not configured. Please check environment variables.')
      return NextResponse.json(
        { error: 'Server configuration error. Please contact administrator.' },
        { status: 500 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json(
        { error: 'Invalid request format. Expected JSON.' },
        { status: 400 }
      )
    }

    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Query admin from database
    const { data: admin, error } = await supabase
      .from('admins')
      .select('id, username, email, full_name, role, is_active, password_hash')
      .eq('username', username)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Database error:', error)
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Admin table not found. Please run database setup script.' },
          { status: 500 }
        )
      }
      // For other errors, return generic message for security
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    if (!admin) {
      console.warn(`Login attempt with non-existent username: ${username}`)
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Compare password using bcrypt
    const bcrypt = require('bcryptjs')
    
    // Handle both $2y$ (PHP) and $2a$/$2b$ (Node.js) bcrypt formats
    let isValidPassword = false
    try {
      // Try direct comparison first
      isValidPassword = await bcrypt.compare(password, admin.password_hash)
      
      // If that fails and hash starts with $2y$, try converting to $2a$ format
      if (!isValidPassword && admin.password_hash.startsWith('$2y$')) {
        const convertedHash = admin.password_hash.replace('$2y$', '$2a$')
        isValidPassword = await bcrypt.compare(password, convertedHash)
      }
    } catch (bcryptError) {
      console.error('Bcrypt comparison error:', bcryptError)
      return NextResponse.json(
        { error: 'Password verification failed' },
        { status: 500 }
      )
    }

    if (!isValidPassword) {
      console.warn(`Invalid password attempt for username: ${username}`)
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Update last login (don't fail if this errors)
    try {
      await supabase
        .from('admins')
        .update({ last_login: new Date().toISOString() })
        .eq('id', admin.id)
    } catch (updateError) {
      console.warn('Failed to update last_login:', updateError)
      // Continue anyway
    }

    // Log admin activity (don't fail if this errors)
    try {
      await supabase
        .from('admin_activity_logs')
        .insert({
          admin_id: admin.id,
          action: 'login',
          description: 'Admin logged in',
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        })
    } catch (logError) {
      console.warn('Failed to log admin activity:', logError)
      // Continue anyway
    }

    // Create session token (in production, use JWT)
    const token = Buffer.from(`${admin.id}:${Date.now()}`).toString('base64')

    // Return success response
    return NextResponse.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        fullName: admin.full_name,
        role: admin.role
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}



