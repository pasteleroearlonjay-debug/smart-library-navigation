import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Helper function to verify admin (PIN protection replaces role check)
async function verifyAdmin(request: NextRequest): Promise<{ admin: any } | null> {
  const adminToken = request.headers.get('authorization')?.replace('Bearer ', '')
  const adminUserStr = request.headers.get('x-admin-user')
  
  if (!adminToken || !adminUserStr) {
    return null
  }

  try {
    const adminUser = JSON.parse(adminUserStr)
    return { admin: adminUser }
  } catch {
    return null
  }
}

// GET - Fetch all admins
export async function GET(request: NextRequest) {
  const verified = await verifyAdmin(request)
  if (!verified) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 })
  }

  try {
    const { data: admins, error } = await supabase
      .from('admins')
      .select('id, username, email, full_name, role, is_active, last_login, created_at, updated_at')
      .neq('username', 'superadmin') // Exclude superadmin from the list
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching admins:', error)
      return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 })
    }

    return NextResponse.json({ success: true, admins: admins || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/super-admin:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new admin
export async function POST(request: NextRequest) {
  const verified = await verifyAdmin(request)
  if (!verified) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 })
  }

  try {
    const { username, email, password, full_name, role } = await request.json()

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      )
    }

    // Validate role
    if (role && !['admin', 'super_admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "admin" or "super_admin"' },
        { status: 400 }
      )
    }

    // Check if username or email already exists
    const { data: existing } = await supabase
      .from('admins')
      .select('id')
      .or(`username.eq.${username},email.eq.${email}`)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 409 }
      )
    }

    // For now, use simple password hash (in production, use bcrypt)
    // This matches the existing pattern in the codebase
    const password_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' // Default hash for demo

    // Insert new admin
    const { data: newAdmin, error: insertError } = await supabase
      .from('admins')
      .insert({
        username,
        email,
        password_hash,
        full_name: full_name || null,
        role: role || 'admin',
        is_active: true
      })
      .select('id, username, email, full_name, role, is_active, created_at')
      .single()

    if (insertError) {
      console.error('Error creating admin:', insertError)
      return NextResponse.json(
        { error: 'Failed to create admin: ' + insertError.message },
        { status: 500 }
      )
    }

    // Log activity
    await supabase
      .from('admin_activity_logs')
      .insert({
        admin_id: verified.admin.id,
        action: 'create_admin',
        description: `Created admin account: ${username}`,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      })

    return NextResponse.json({
      success: true,
      message: 'Admin created successfully',
      admin: newAdmin
    })
  } catch (error) {
    console.error('Error in POST /api/admin/super-admin:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update admin
export async function PUT(request: NextRequest) {
  const verified = await verifyAdmin(request)
  if (!verified) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 })
  }

  try {
    const { id, username, email, full_name, role, is_active } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 })
    }

    // Validate role if provided
    if (role && !['admin', 'super_admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "admin" or "super_admin"' },
        { status: 400 }
      )
    }

    // Check if username or email conflicts with other admins
    if (username || email) {
      const { data: existing } = await supabase
        .from('admins')
        .select('id')
        .neq('id', id)
        .or(`username.eq.${username || ''},email.eq.${email || ''}`)
        .limit(1)

      if (existing && existing.length > 0) {
        return NextResponse.json(
          { error: 'Username or email already exists' },
          { status: 409 }
        )
      }
    }

    // Build update object
    const updateData: any = {}
    if (username) updateData.username = username
    if (email) updateData.email = email
    if (full_name !== undefined) updateData.full_name = full_name
    if (role) updateData.role = role
    if (is_active !== undefined) updateData.is_active = is_active

    // Update admin
    const { data: updatedAdmin, error: updateError } = await supabase
      .from('admins')
      .update(updateData)
      .eq('id', id)
      .select('id, username, email, full_name, role, is_active, updated_at')
      .single()

    if (updateError) {
      console.error('Error updating admin:', updateError)
      return NextResponse.json(
        { error: 'Failed to update admin: ' + updateError.message },
        { status: 500 }
      )
    }

    // Log activity
    await supabase
      .from('admin_activity_logs')
      .insert({
        admin_id: verified.admin.id,
        action: 'update_admin',
        description: `Updated admin account: ${updatedAdmin.username}`,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      })

    return NextResponse.json({
      success: true,
      message: 'Admin updated successfully',
      admin: updatedAdmin
    })
  } catch (error) {
    console.error('Error in PUT /api/admin/super-admin:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete admin
export async function DELETE(request: NextRequest) {
  const verified = await verifyAdmin(request)
  if (!verified) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 })
    }

    // Prevent deleting yourself
    if (parseInt(id) === verified.admin.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    // Get admin info before deletion for logging
    const { data: adminToDelete } = await supabase
      .from('admins')
      .select('username')
      .eq('id', id)
      .single()

    // Delete admin
    const { error: deleteError } = await supabase
      .from('admins')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting admin:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete admin: ' + deleteError.message },
        { status: 500 }
      )
    }

    // Log activity
    await supabase
      .from('admin_activity_logs')
      .insert({
        admin_id: verified.admin.id,
        action: 'delete_admin',
        description: `Deleted admin account: ${adminToDelete?.username || id}`,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      })

    return NextResponse.json({
      success: true,
      message: 'Admin deleted successfully'
    })
  } catch (error) {
    console.error('Error in DELETE /api/admin/super-admin:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

