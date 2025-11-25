import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// GET /api/settings - Get application settings (including logo)
export async function GET(request: NextRequest) {
  try {
    // Get all settings or a specific setting
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    let query = supabase.from('app_settings').select('*')
    
    if (key) {
      query = query.eq('setting_key', key)
    }

    const { data: settings, error } = await query

    if (error) {
      console.error('Error fetching settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      )
    }

    // If requesting a specific key, return just the value
    if (key && settings && settings.length > 0) {
      return NextResponse.json({
        success: true,
        key: settings[0].setting_key,
        value: settings[0].setting_value
      })
    }

    // Return all settings as key-value pairs
    const settingsMap: Record<string, string> = {}
    if (settings) {
      settings.forEach(setting => {
        settingsMap[setting.setting_key] = setting.setting_value
      })
    }

    return NextResponse.json({
      success: true,
      settings: settingsMap
    })

  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/settings - Create or update a setting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value } = body

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      )
    }

    // Use upsert to insert or update
    const { data, error } = await supabase
      .from('app_settings')
      .upsert({
        setting_key: key,
        setting_value: value,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'setting_key'
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving setting:', error)
      return NextResponse.json(
        { error: 'Failed to save setting: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      setting: data
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}




