// Frontend/lib/services/resume-storage.ts
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export interface ResumeRecord {
  id: string
  user_id: string
  filename: string
  file_size: number
  file_type: string
  storage_path: string
  candidate_id?: number
  status: 'pending' | 'processing' | 'analyzed' | 'failed'
  extracted_skills?: any
  metadata?: any
  is_active: boolean
  uploaded_at: string
  analyzed_at?: string | null
}

/**
 * Upload resume file to Supabase Storage
 */
export async function uploadResumeToStorage(
  file: File,
  user: User
): Promise<{ storagePath: string; publicUrl: string }> {
  const supabase = createClient()

  // Create unique file path: userId/timestamp_filename
  const timestamp = Date.now()
  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const storagePath = `${user.id}/${timestamp}_${sanitizedFilename}`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('resumes')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Supabase upload error:', error)
    throw new Error(`Failed to upload resume: ${error.message}`)
  }

  // Get public URL (with authentication required)
  const { data: urlData } = supabase.storage
    .from('resumes')
    .getPublicUrl(storagePath)

  return {
    storagePath: data.path,
    publicUrl: urlData.publicUrl
  }
}

/**
 * Save resume metadata to Supabase database
 */
export async function saveResumeRecord(
  resume: Omit<ResumeRecord, 'id' | 'user_id' | 'uploaded_at'>
): Promise<ResumeRecord> {
  const supabase = createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('resumes')
    .insert([{
      ...resume,
      user_id: user.id
    }])
    .select()
    .single()

  if (error) {
    console.error('Database insert error:', error)
    throw new Error(`Failed to save resume record: ${error.message}`)
  }

  return data
}

/**
 * Update resume with FastAPI analysis results
 */
export async function updateResumeWithAnalysis(
  resumeId: string,
  candidateId: number,
  extractedSkills: any
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('resumes')
    .update({
      candidate_id: candidateId,
      status: 'analyzed',
      extracted_skills: extractedSkills,
      analyzed_at: new Date().toISOString()
    })
    .eq('id', resumeId)

  if (error) {
    console.error('Update error:', error)
    throw new Error(`Failed to update resume: ${error.message}`)
  }
}

/**
 * Get all resumes for current user
 */
export async function getUserResumes(): Promise<ResumeRecord[]> {
  const supabase = createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return []
  }

  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', user.id)
    .order('uploaded_at', { ascending: false })

  if (error) {
    console.error('Fetch resumes error:', error)
    throw new Error(`Failed to fetch resumes: ${error.message}`)
  }

  return data || []
}

/**
 * Delete resume from storage and database
 * Gracefully handles network errors - will still remove from local state even if Supabase fails
 */
export async function deleteResume(
  resumeId: string,
  storagePath: string
): Promise<void> {
  const supabase = createClient()

  let storageError: any = null
  let dbError: any = null

  // Try to delete from storage (non-blocking)
  try {
    const { error } = await supabase.storage
      .from('resumes')
      .remove([storagePath])
    
    if (error) {
      storageError = error
      console.warn('Storage delete error (non-critical):', error.message)
    }
  } catch (error: any) {
    storageError = error
    console.warn('Storage delete failed (network error - non-critical):', error.message)
  }

  // Try to delete from database (non-blocking)
  try {
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', resumeId)
    
    if (error) {
      dbError = error
      console.warn('Database delete error (non-critical):', error.message)
    }
  } catch (error: any) {
    dbError = error
    console.warn('Database delete failed (network error - non-critical):', error.message)
  }

  // Only throw if both operations failed AND it's not a network error
  // Network errors are acceptable - we'll clean up locally anyway
  if (storageError && dbError) {
    const isNetworkError = 
      storageError.message?.includes('Failed to fetch') ||
      storageError.message?.includes('NetworkError') ||
      dbError.message?.includes('Failed to fetch') ||
      dbError.message?.includes('NetworkError')
    
    if (!isNetworkError) {
      throw new Error(`Failed to delete: ${storageError.message || dbError.message}`)
    } else {
      // Network error - allow deletion to proceed (local cleanup will happen)
      console.warn('Supabase unavailable - proceeding with local deletion only')
    }
  }
}

/**
 * Set resume as active (only one can be active)
 */
export async function setActiveResume(resumeId: string): Promise<void> {
  const supabase = createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  // First, deactivate all resumes for this user
  await supabase
    .from('resumes')
    .update({ is_active: false })
    .eq('user_id', user.id)
    .neq('id', resumeId)

  // Then activate the selected one
  const { error } = await supabase
    .from('resumes')
    .update({ is_active: true })
    .eq('id', resumeId)

  if (error) {
    throw new Error(`Failed to set active resume: ${error.message}`)
  }
}

/**
 * Download resume file
 */
export async function downloadResume(storagePath: string): Promise<Blob> {
  const supabase = createClient()

  const { data, error } = await supabase.storage
    .from('resumes')
    .download(storagePath)

  if (error) {
    throw new Error(`Failed to download resume: ${error.message}`)
  }

  return data
}

