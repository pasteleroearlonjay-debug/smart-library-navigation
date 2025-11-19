import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find the member ID by email
    const { data: member, error } = await supabase
      .from('library_members')
      .select('id')
      .eq('email', email)
      .single()

    if (error || !member) {
      // Not found → attempt to create, accommodating schema differences
      const safeName = (name && String(name).trim().length > 0) ? name : (email?.split('@')[0] || 'New Member')
      const joinDate = new Date().toISOString().split('T')[0]

      // Try with password_hash (for schemas that require it)
      const placeholderHash = '$2y$10$abcdefghijklmnopqrstuv0123456789abcdefghijklmnopqrstuv12'
      let createdId: number | null = null

      try {
        const { data: createdWithHash } = await supabase
          .from('library_members')
          .insert({
            name: safeName,
            email,
            password_hash: placeholderHash,
            join_date: joinDate,
            borrowed_count: 0,
            overdue_count: 0,
            status: 'Active'
          })
          .select('id')
          .single()
        createdId = createdWithHash?.id ?? null
      } catch (e) {
        // Retry without password_hash if column does not exist
        const { data: createdNoHash } = await supabase
          .from('library_members')
          .insert({
            name: safeName,
            email,
            join_date: joinDate,
            borrowed_count: 0,
            overdue_count: 0,
            status: 'Active'
          })
          .select('id')
          .single()
        createdId = createdNoHash?.id ?? null
      }

      if (!createdId) {
        return NextResponse.json({
          success: false,
          memberId: null,
          message: 'Failed to create library member'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        memberId: createdId,
        message: 'Member created'
      })
    }

    return NextResponse.json({
      success: true,
      memberId: member.id,
      message: 'Member ID found'
    })

  } catch (error) {
    console.error('Get member ID API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

