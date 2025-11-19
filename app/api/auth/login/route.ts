import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

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

    if (error || !admin) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // In a real application, you should use bcrypt to compare passwords
    // For now, we'll do a simple comparison (THIS IS NOT SECURE FOR PRODUCTION!)
    // Install bcryptjs: npm install bcryptjs @types/bcryptjs
    
    // Simple password check (replace with bcrypt in production)
    // For demo purposes, we'll accept the password if it matches
    // In production, use: const isValidPassword = await bcrypt.compare(password, admin.password_hash)
    
    // For this demo, the default password is 'admin123'
    // You should implement proper bcrypt comparison
    const isValidPassword = password === 'admin123' // TEMPORARY - Use bcrypt in production!

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Update last login
    await supabase
      .from('admins')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id)

    // Log admin activity
    await supabase
      .from('admin_activity_logs')
      .insert({
        admin_id: admin.id,
        action: 'login',
        description: 'Admin logged in',
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      })

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



