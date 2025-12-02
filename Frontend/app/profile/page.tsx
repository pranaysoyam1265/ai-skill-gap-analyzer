"use client"
import { useState, useRef, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Mail, Phone, MapPin, Edit2, TrendingUp, Award, BookOpen, Zap } from "lucide-react"

import { ProfilePictureUpload } from "@/components/profile-picture-upload"
import { ProfessionalLinksEdit } from "@/components/professional-links-edit"
import { ProfessionalLinksDisplay } from "@/components/professional-links-display"
import { useUser } from "@/lib/contexts/user-context"

// API Base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

interface SavedAnalysis {
  id: string
  targetRole: string
  matchScore: number
  dateAnalyzed: string
  criticalGaps: number
  skillsToImprove: number
  matchingSkills: string[]
  gapsDetails: string[]
  recommendations: string[]
}

interface ActivityData {
  date: string
  skills: number
  analyses: number
  courses: number
  hours: number
}

// Define interface for professional links
interface ProfessionalLink {
  platform: string
  url: string
}

// Define interface for career goals
interface CareerGoals {
  id?: string
  current_job_title?: string
  company?: string
  target_job_title?: string
  desired_industry?: string
  target_companies?: string[]
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  timeline_months?: number
  preferred_work_modes?: string[]
  target_locations?: string[]
  skills_to_acquire?: string[]
  target_certifications?: string[]
  career_milestones?: Array<{ title: string; description: string; targetDate?: string }>
  additional_notes?: string
}

const INDUSTRIES = [
  "Technology & Software",
  "Financial Services & Banking",
  "Healthcare & Pharmaceuticals",
  "E-commerce & Retail",
  "Telecommunications",
  "Education & E-learning",
  "Media & Entertainment",
  "Manufacturing & Engineering",
  "Consulting Services",
  "Real Estate & Construction",
  "Transportation & Logistics",
  "Energy & Utilities",
  "Hospitality & Tourism",
  "Government & Public Sector",
  "Non-Profit & NGO",
  "Gaming & Esports",
  "Cybersecurity",
  "Fintech",
  "Healthtech",
  "Edtech",
  "Agritech",
  "Blockchain & Crypto",
  "Artificial Intelligence & ML",
  "Cloud Computing",
  "IoT & Embedded Systems",
  "Automotive & Mobility",
  "Aerospace & Defense",
  "Legal & Compliance",
  "Marketing & Advertising",
  "Human Resources & Recruiting",
  "Research & Development",
  "Other",
]

const TARGET_ROLES = {
  "Frontend Development": [
    "Frontend Developer",
    "React Developer",
    "Angular Developer",
    "Vue.js Developer",
    "UI Developer",
  ],
  "Backend Development": [
    "Backend Developer",
    "Node.js Developer",
    "Python Developer",
    "Java Developer",
    ".NET Developer",
    "Go Developer",
    "Rust Developer",
  ],
  "Full Stack & Mobile": [
    "Full Stack Developer",
    "Mobile Developer (iOS)",
    "Mobile Developer (Android)",
    "React Native Developer",
    "Flutter Developer",
  ],
  "Data & AI/ML": [
    "Data Scientist",
    "Data Engineer",
    "Data Analyst",
    "ML Engineer",
    "AI Engineer",
    "NLP Engineer",
    "Computer Vision Engineer",
  ],
  "DevOps & Cloud": [
    "DevOps Engineer",
    "Cloud Engineer (AWS)",
    "Cloud Engineer (Azure)",
    "Cloud Engineer (GCP)",
    "Site Reliability Engineer",
    "Platform Engineer",
  ],
  Security: ["Security Engineer", "Penetration Tester", "Security Architect", "Cybersecurity Analyst"],
  "QA & Testing": ["QA Engineer", "Automation Engineer", "Performance Engineer", "Test Architect"],
  Design: ["UI Designer", "UX Designer", "Product Designer", "UX Researcher"],
  "Product & Management": ["Product Manager", "Technical PM", "Scrum Master", "Engineering Manager", "Tech Lead"],
  "Database & Infrastructure": [
    "Database Administrator",
    "DBA (PostgreSQL/MySQL)",
    "DBA (MongoDB)",
    "System Administrator",
    "Network Engineer",
  ],
  "Blockchain & Emerging Tech": [
    "Blockchain Developer",
    "Smart Contract Developer",
    "Game Developer",
    "AR/VR Developer",
  ],
  Architecture: [
    "Solutions Architect",
    "Enterprise Architect",
    "Cloud Architect",
    "Principal Engineer",
    "Staff Engineer",
  ],
}

const CAREER_INTERESTS_TAGS = {
  "Technical Skills": [
    "Web Development",
    "Mobile Development",
    "Cloud Computing",
    "DevOps",
    "Machine Learning",
    "Artificial Intelligence",
    "Data Science",
    "Cybersecurity",
    "Blockchain",
    "IoT",
    "Embedded Systems",
    "Game Development",
    "AR/VR",
  ],
  Domains: [
    "Fintech",
    "Healthtech",
    "Edtech",
    "E-commerce",
    "SaaS",
    "Enterprise Software",
    "Open Source",
    "Startups",
    "Big Tech",
  ],
  Technologies: [
    "React",
    "Angular",
    "Vue",
    "Python",
    "Java",
    "JavaScript",
    "TypeScript",
    "Go",
    "Rust",
    "Kubernetes",
    "Docker",
    "AWS",
    "Azure",
    "GCP",
    "PostgreSQL",
    "MongoDB",
  ],
  "Soft Skills": [
    "Leadership",
    "Team Management",
    "Mentoring",
    "Public Speaking",
    "Technical Writing",
    "Problem Solving",
    "Innovation",
  ],
  "Work Style": ["Remote Work", "Hybrid", "Freelancing", "Consulting", "Entrepreneurship", "Research"],
}

export default function ProfilePage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { avatarUrl: userAvatarUrl, setAvatarUrl } = useUser()
  const [supabaseClient, setSupabaseClient] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [fullName, setFullName] = useState("Alex Johnson")
  const [email, setEmail] = useState("alex.johnson@example.com")
  const [phone, setPhone] = useState("+91 98765 43210")
  const [location, setLocation] = useState("Bangalore, India")
  const [linkedIn, setLinkedIn] = useState("linkedin.com/in/alexjohnson")
  const [github, setGithub] = useState("github.com/alexjohnson")
  const [portfolio, setPortfolio] = useState("alexjohnson.dev")
  const [bio, setBio] = useState(
    "Full-stack developer passionate about building scalable applications and learning new technologies.",
  )

  const [currentRole, setCurrentRole] = useState("Senior Full Stack Developer")
  const [company, setCompany] = useState("Tech Innovations Inc")
  const [yearsExperience, setYearsExperience] = useState("6")
  const [industry, setIndustry] = useState("Technology & Software")
  const [currentSalary, setCurrentSalary] = useState("18.5")

  const [targetRole, setTargetRole] = useState("Tech Lead")
  const [targetSalary, setTargetSalary] = useState("25")
  const [desiredLocation, setDesiredLocation] = useState("Bangalore / Remote")
  const [timeline, setTimeline] = useState("1 year")
  const [careerInterests, setCareerInterests] = useState(["System Design", "Cloud Architecture", "Team Leadership"])

  // Will be overridden by context, but kept for initial state consistency
  const [avatarUrl, setAvatarUrlLocal] = useState("https://api.dicebear.com/7.x/avataaars/svg?seed=Alex")
  const [showImagePreview, setShowImagePreview] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [professionalLinks, setProfessionalLinks] = useState<ProfessionalLink[]>([])
  const [isUploadingProfilePicture, setIsUploadingProfilePicture] = useState(false)

  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [selectedAnalysis, setSelectedAnalysis] = useState<SavedAnalysis | null>(null)

  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]) // Updated to be an empty array initially
  const [analysesLoading, setAnalysesLoading] = useState(true)
  const [analysesError, setAnalysesError] = useState("")

  const [activityData, setActivityData] = useState<ActivityData[]>([]) // Updated to be an empty array initially
  const [activityLoading, setActivityLoading] = useState(true)
  const [activityPeriod, setActivityPeriod] = useState(30) // Default to 30 days
  const [activityError, setActivityError] = useState("")

  const [statistics, setStatistics] = useState({
    skillsTracked: 0, // Default to 0
    gapAnalysesPerformed: 0, // Default to 0
    coursesEnrolled: 0, // Default to 0
    learningHoursLogged: 0, // Default to 0
  })
  const [statsLoading, setStatsLoading] = useState(true)

  const [totalSkillsTracked, setTotalSkillsTracked] = useState(0) // Default to 0
  const [gapAnalysesPerformed, setGapAnalysesPerformed] = useState(0) // Default to 0
  const [coursesEnrolled, setCoursesEnrolled] = useState(0) // Default to 0
  const [learningHoursLogged, setLearningHoursLogged] = useState(0) // Default to 0

  const [favoritedSkills, setFavoritedSkills] = useState<
    Array<{ name: string; category: string; proficiencyLevel: string; dateAdded: string }>
  >([])

  const [isEditMode, setIsEditMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    fullName: "",
    jobTitle: "",
    company: "",
    yearsExperience: "0",
    industry: "",
    bio: "",
    email: "",
    phone: "",
    location: "",
    currentSalary: "",
  })

  const [userState, setUserState] = useState<any>(null) // Declare userState variable

  const [careerGoals, setCareerGoals] = useState<CareerGoals | null>(null)
  const [careerGoalsLoading, setCareerGoalsLoading] = useState(true)
  const [careerGoalsModalOpen, setCareerGoalsModalOpen] = useState(false)
  const [careerGoalsFormData, setCareerGoalsFormData] = useState<CareerGoals>({})
  const [newMilestone, setNewMilestone] = useState({ title: "", description: "", targetDate: "" })
  const [careerGoalsSaving, setCareerGoalsSaving] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabaseClient = createClient()
        setSupabaseClient(supabaseClient)

        const {
          data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
          router.push("/auth")
          return
        }

        setUserState(user) // Use declared userState variable

        const { data: profile, error } = await supabaseClient
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle()

        console.log('[Profile Check] Fetch result:', { profileExists: !!profile, error })

        if (error) {
          console.error("[Profile] Error fetching profile:", error)
        }

        // If profile doesn't exist, create one
        if (!profile && !error) {
          console.log('[Profile] Creating new profile row for user:', user.id)
          try {
            const { error: insertError, data: newProfile } = await supabaseClient
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || '',
              })
              .select()

            if (insertError) {
              console.error('[Profile] Error creating profile:', insertError)
            } else {
              console.log('[Profile] Profile created successfully:', newProfile)
            }
          } catch (insertErr) {
            console.error('[Profile] Exception creating profile:', insertErr)
          }
        }

        if (profile) {
          setFullName(profile.full_name || "")
          setEmail(profile.email || "")
          setPhone(profile.phone || "")
          setLocation(profile.location || "")
          setBio(profile.bio || "")
          setCurrentRole(profile.current_role || "")
          setCompany(profile.company || "")
          setYearsExperience(String(profile.years_experience || "0"))
          setIndustry(profile.industry || "")
          setCurrentSalary(String(profile.current_salary || ""))
          if (profile.profile_image_url) {
            setAvatarUrl(profile.profile_image_url)
          } else {
            // Fallback to context's avatar URL if none in profile
            setAvatarUrl(userAvatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex")
          }
          // Initialize form data as well
          setFormData({
            fullName: profile.full_name || "",
            jobTitle: profile.current_role || currentRole,
            company: profile.company || company,
            yearsExperience: String(profile.years_experience || yearsExperience),
            industry: profile.industry || industry,
            bio: profile.bio || "",
            email: profile.email || "",
            phone: profile.phone || "",
            location: profile.location || "",
            currentSalary: String(profile.current_salary || currentSalary),
          })
        } else if (user.email) {
          setEmail(user.email)
          if (user.user_metadata?.full_name) {
            setFullName(user.user_metadata.full_name)
          }
          // Set default values if no profile data
          setFormData({
            fullName: user.user_metadata?.full_name || "",
            jobTitle: currentRole,
            company: company,
            yearsExperience: yearsExperience,
            industry: industry,
            bio: "",
            email: user.email,
            phone: "",
            location: "",
            currentSalary: "",
          })
        }

        const { data: links, error: linksError } = await supabaseClient
          .from("professional_links")
          .select("platform, url")
          .eq("user_id", user.id)

        if (linksError) {
          console.error("[Profile] Error fetching professional links:", linksError)
        } else if (links) {
          setProfessionalLinks(links)
        }

        try {
          const statsResponse = await fetch(`${API_URL}/api/user/statistics`)
          if (statsResponse.ok) {
            const statsData = await statsResponse.json()
            setStatistics(statsData)
            setTotalSkillsTracked(statsData.skillsTracked)
            setGapAnalysesPerformed(statsData.gapAnalysesPerformed)
            setCoursesEnrolled(statsData.coursesEnrolled)
            setLearningHoursLogged(statsData.learningHoursLogged)
          }
        } catch (statsError) {
          console.error("[v0] Error fetching statistics:", statsError)
          // Keep default values on error
        } finally {
          setStatsLoading(false)
        }

        try {
          const analysesResponse = await fetch(`${API_URL}/api/user/gap-analyses`)
          if (analysesResponse.ok) {
            const analysesData = await analysesResponse.json()
            setSavedAnalyses(analysesData.analyses || [])
          }
        } catch (err) {
          console.error("[v0] Error fetching gap analyses:", err)
          setAnalysesError("Failed to load gap analyses")
        } finally {
          setAnalysesLoading(false)
        }

        try {
          const activityResponse = await fetch(`${API_URL}/api/user/activity?period=${activityPeriod}`)
          if (activityResponse.ok) {
            const activityDataResponse = await activityResponse.json()
            setActivityData(activityDataResponse.activity || [])
          }
        } catch (err) {
          console.error("[v0] Error fetching activity:", err)
          setActivityError("Failed to load activity data")
        } finally {
          setActivityLoading(false)
        }

        const fetchCareerGoals = async () => {
          try {
            const response = await fetch("/api/user/career-goals")
            if (response.ok) {
              const data = await response.json()
              if (data.careerGoals) {
                setCareerGoals(data.careerGoals)
                setCareerGoalsFormData(data.careerGoals)
              }
            }
          } catch (error) {
            console.error("[v0] Error fetching career goals:", error)
          } finally {
            setCareerGoalsLoading(false)
          }
        }
        fetchCareerGoals()
      } catch (error) {
        console.error("[v0] Error in fetchUser:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [router, userAvatarUrl, setAvatarUrl]) // Depend on context avatar URL and setter

  useEffect(() => {
    const saved = localStorage.getItem("favoriteSkills")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setFavoritedSkills(parsed)
      } catch (error) {
        console.error("Failed to parse favorite skills", error)
      }
    }
  }, [])

  const handleActivityPeriodChange = async (period: number) => {
    setActivityPeriod(period)
    setActivityLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/user/activity?period=${period}`)
      if (response.ok) {
        const data = await response.json()
        setActivityData(data.activity || [])
      }
    } catch (err) {
      console.error("[v0] Error fetching activity:", err)
      setActivityError("Failed to load activity data")
    } finally {
      setActivityLoading(false)
    }
  }

  const validateForm = (data: typeof formData): Record<string, string> => {
    const errors: Record<string, string> = {}

    if (!data.fullName.trim() || data.fullName.trim().length < 2) {
      errors.fullName = "Full name must be at least 2 characters"
    }
    if (!data.jobTitle.trim()) {
      errors.jobTitle = "Job title is required"
    }
    if (!data.location.trim()) {
      errors.location = "Location is required"
    }
    if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = "Valid email is required"
    }
    // Improved phone validation to allow international numbers and common formats
    if (data.phone && !/^\+?[1-9]\d{1,14}$/.test(data.phone.replace(/[\s\-()]/g, ""))) {
      errors.phone = "Invalid phone format. Use +1234567890 or similar."
    }
    if (data.yearsExperience) {
      const years = Number.parseInt(data.yearsExperience)
      if (isNaN(years) || years < 0 || years > 50) {
        errors.yearsExperience = "Years must be between 0 and 50"
      }
    }
    if (data.bio && data.bio.length > 500) {
      errors.bio = "Bio must not exceed 500 characters"
    }
    if (data.currentSalary) {
      const salary = Number.parseFloat(data.currentSalary)
      if (isNaN(salary) || salary < 0) {
        errors.currentSalary = "Salary must be a positive number"
      }
    }

    return errors
  }

  const handleEditMode = () => {
    setFormData({
      fullName: fullName,
      jobTitle: currentRole,
      company: company,
      yearsExperience: yearsExperience,
      industry: industry,
      bio: bio,
      email: email,
      phone: phone,
      location: location,
      currentSalary: currentSalary,
    })
    setValidationErrors({})
    setIsEditMode(true)
  }

  const handleCancel = () => {
    setIsEditMode(false)
    setValidationErrors({})
    // Reset form data to empty or initial state if needed
    setFormData({
      fullName: "",
      jobTitle: "",
      company: "",
      yearsExperience: "0",
      industry: "",
      bio: "",
      email: "",
      phone: "",
      location: "",
      currentSalary: "",
    })
  }

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)

      console.log('[Profile] Starting save with data:', {
        fullName: formData.fullName,
        company: formData.company,
        currentRole: formData.jobTitle,
        userStateId: userState?.id,
      })

      // Validate form data
      const errors = validateForm(formData)
      if (Object.keys(errors).length > 0) {
        console.error('[Profile] Validation errors:', errors)
        setValidationErrors(errors)
        toast({
          title: "⚠️ Validation Error",
          description: "Please fix the errors before saving",
          variant: "destructive",
        })
        setIsSaving(false)
        return
      }

      if (!userState?.id) {
        console.error('[Profile] No user ID available')
        throw new Error('User not authenticated')
      }

      console.log('[Profile] User ID:', userState.id)

      // Prepare update data
      // NOTE: company, job_title, years_experience, industry, current_salary are temporarily commented out
      // due to PostgREST schema cache not refreshing after adding new columns to database.
      // These fields will work after Supabase project restart (Pause/Resume in Project Settings)
      const updateData = {
        full_name: formData.fullName?.trim() || null,
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        location: formData.location?.trim() || null,
        bio: formData.bio?.trim() || null,
        // Temporarily disabled - uncomment after PostgREST cache refresh:
        // company: formData.company?.trim() || null,
        // job_title: formData.jobTitle?.trim() || null,
        // years_experience: formData.yearsExperience ? parseInt(formData.yearsExperience, 10) : 0,
        // industry: formData.industry?.trim() || null,
        // current_salary: formData.currentSalary ? parseFloat(formData.currentSalary) : null,
      }

      console.log('[Profile] Update data:', updateData)

      // Update profile
      const { data, error } = await supabaseClient
        .from('profiles')
        .update(updateData)
        .eq('id', userState.id)
        .select()

      console.log('[Profile] Supabase response:', { data, error })

      if (error) {
        console.error('[Profile] Supabase error details:', {
          message: error.message,
          code: (error as any).code,
          details: (error as any).details,
          fullError: error,
        })
        throw new Error(`Database error: ${error.message || JSON.stringify(error)}`)
      }

      // Update local state
      setFullName(formData.fullName)
      setEmail(formData.email)
      setPhone(formData.phone)
      setLocation(formData.location)
      setBio(formData.bio)
      setCurrentRole(formData.jobTitle)
      setCompany(formData.company)
      setYearsExperience(formData.yearsExperience)
      setIndustry(formData.industry)
      setCurrentSalary(formData.currentSalary)

      setIsEditMode(false)
      setValidationErrors({})

      toast({
        title: "✅ Profile Updated",
        description: "Your profile has been saved successfully.",
      })

      console.log('[Profile] Save successful')
    } catch (error: any) {
      console.error('[Profile] Error saving profile:', error)

      toast({
        title: "❌ Save Failed",
        description: error?.message || "Failed to save profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleProfilePictureUpload = async (croppedImageDataUrl: string) => {
    if (!userState || !supabaseClient) return

    setIsUploadingProfilePicture(true)
    try {
      // Convert data URL to blob
      const response = await fetch(croppedImageDataUrl)
      const blob = await response.blob()

      // Generate unique filename
      const filename = `${userState.id}-${Date.now()}.jpg`
      const filepath = `${userState.id}/${filename}`

      let uploadError = null
      let publicUrl = null

      try {
        // Attempt to upload to Supabase Storage
        const { error: upError } = await supabaseClient.storage
          .from("profile-pictures")
          .upload(filepath, blob, { upsert: true })

        if (upError) {
          console.error("[v0] Storage upload error:", upError)
          uploadError = upError
        } else {
          // Get public URL
          const { data: publicUrlData } = supabaseClient.storage.from("profile-pictures").getPublicUrl(filepath)

          publicUrl = publicUrlData.publicUrl
          console.log("[v0] Profile picture uploaded successfully:", publicUrl)
        }
      } catch (storageError) {
        console.error("[v0] Storage bucket error - bucket may not exist:", storageError)
        uploadError = storageError
      }

      // If storage upload failed, use a data URL as fallback (will work in preview but won't persist)
      if (uploadError || !publicUrl) {
        console.warn("[v0] Storage upload failed, using data URL as temporary fallback")

        // Use the cropped image data URL directly as fallback
        publicUrl = croppedImageDataUrl

        // Show a warning to the user
        toast({
          title: "Upload stored locally",
          description: "Profile picture stored temporarily. Set up storage bucket for permanent storage.",
          variant: "default",
        })
      }

      // Update database with image URL (either storage URL or data URL)
      const { error: updateError } = await supabaseClient
        .from("profiles")
        .update({ profile_image_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", userState.id)

      if (updateError) {
        console.error("[v0] Error updating profile with image URL:", updateError)
        throw updateError
      }

      setAvatarUrl(publicUrl)
      setAvatarUrlLocal(publicUrl)

      if (!uploadError) {
        toast({
          title: "Success",
          description: "Profile picture updated successfully",
        })
      }
    } catch (error) {
      console.error("[v0] Error uploading profile picture:", error)
      toast({
        title: "Error",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingProfilePicture(false)
      setShowUploadDialog(false)
    }
  }

  const handleSaveProfessionalLinks = async (links: ProfessionalLink[]) => {
    if (!userState || !supabaseClient) return

    try {
      // First, delete existing links for this user to avoid duplicates and ensure atomicity
      const { error: deleteError } = await supabaseClient
        .from("professional_links")
        .delete()
        .eq("user_id", userState.id)
      if (deleteError) throw deleteError

      // Insert new links if any
      if (links.length > 0) {
        const formattedLinks = links.map((link) => ({
          user_id: userState.id,
          platform: link.platform,
          url: link.url,
        }))
        const { error: insertError } = await supabaseClient.from("professional_links").insert(formattedLinks)
        if (insertError) throw insertError
      }

      setProfessionalLinks(links) // Update local state
      toast({
        title: "Success",
        description: "Professional links saved successfully",
      })
    } catch (error) {
      console.error("[v0] Error saving professional links:", error)
      toast({
        title: "Error",
        description: "Failed to save professional links. Please try again.",
        variant: "destructive",
      })
      throw error // Re-throw to be caught by the caller if needed
    }
  }

  const getInitials = () => {
    if (fullName) {
      return fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return "U" // Default to 'U' if no name
  }

  // Determine the effective avatar URL, prioritizing the context's URL
  const effectiveAvatarUrl = userAvatarUrl || avatarUrl

  const handleSaveCareerGoals = async () => {
    setCareerGoalsSaving(true)
    try {
      const response = await fetch("/api/user/career-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(careerGoalsFormData),
      })

      if (response.ok) {
        const data = await response.json()
        setCareerGoals(data.careerGoals)
        setCareerGoalsModalOpen(false)
        toast({
          title: "Success",
          description: "Career goals saved successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to save career goals",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error saving career goals:", error)
      toast({
        title: "Error",
        description: "Failed to save career goals",
        variant: "destructive",
      })
    } finally {
      setCareerGoalsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8">
        {/* Header Section */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
            <div className="flex-shrink-0 relative">
              {effectiveAvatarUrl ? (
                <img
                  src={effectiveAvatarUrl || "/placeholder.svg"}
                  alt={fullName}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-primary object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setShowUploadDialog(true)}
                />
              ) : (
                <div
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-primary bg-primary/20 flex items-center justify-center cursor-pointer hover:bg-primary/30 transition-colors"
                  onClick={() => setShowUploadDialog(true)}
                >
                  <span className="text-xl md:text-2xl font-bold text-primary">{getInitials()}</span>
                </div>
              )}
              {/* Only show edit button if there's a URL or initials (meaning profile exists) */}
              {(effectiveAvatarUrl || fullName) && (
                <button
                  onClick={() => setShowUploadDialog(true)}
                  className="absolute bottom-0 right-0 p-2 bg-primary hover:bg-primary/90 rounded-full text-white transition-colors"
                  aria-label="Edit Profile Picture"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Profile Header Info */}
            <div className="flex-1 space-y-4">
              {isEditMode ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName" className="text-foreground/70">
                      Full Name *
                    </Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className={validationErrors.fullName ? "border-destructive" : ""}
                      placeholder="Enter your full name"
                    />
                    {validationErrors.fullName && (
                      <p className="text-xs text-destructive mt-1">{validationErrors.fullName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="jobTitle" className="text-foreground/70">
                      Job Title *
                    </Label>
                    <Input
                      id="jobTitle"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      className={validationErrors.jobTitle ? "border-destructive" : ""}
                      placeholder="e.g., Senior Full Stack Developer"
                    />
                    {validationErrors.jobTitle && (
                      <p className="text-xs text-destructive mt-1">{validationErrors.jobTitle}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="company" className="text-foreground/70">
                      Company
                    </Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Company name"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground">{fullName}</h1>
                    <p className="text-lg text-foreground/70">{currentRole}</p>
                    <p className="text-sm text-foreground/50">{company}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{yearsExperience} years experience</Badge>
                    <Badge variant="secondary">{industry}</Badge>
                  </div>
                  {!isEditMode && professionalLinks.length > 0 && (
                    <ProfessionalLinksDisplay links={professionalLinks} />
                  )}
                  <p className="text-foreground/80 max-w-2xl">{bio}</p>
                </>
              )}
            </div>

            {/* Edit Profile Button */}
            {!isEditMode ? (
              <Button
                onClick={handleEditMode}
                className="bg-primary hover:bg-primary/90 gap-2 px-6 py-2.5 h-auto whitespace-nowrap"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90 px-6 py-2.5 h-auto whitespace-nowrap"
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="px-6 py-2.5 h-auto whitespace-nowrap bg-transparent"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Edit mode - Bio and Experience */}
          {isEditMode && (
            <div className="space-y-4 bg-secondary/20 p-6 rounded-lg">
              <div>
                <Label htmlFor="bio" className="text-foreground/70">
                  Bio ({formData.bio.length}/500)
                </Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value.slice(0, 500) })}
                  className={validationErrors.bio ? "border-destructive" : ""}
                  placeholder="Tell us about yourself"
                  rows={4}
                />
                {validationErrors.bio && <p className="text-xs text-destructive mt-1">{validationErrors.bio}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="yearsExperience" className="text-foreground/70">
                    Years of Experience
                  </Label>
                  <Input
                    id="yearsExperience"
                    type="number"
                    min="0"
                    max="50"
                    value={formData.yearsExperience}
                    onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                    className={validationErrors.yearsExperience ? "border-destructive" : ""}
                  />
                  {validationErrors.yearsExperience && (
                    <p className="text-xs text-destructive mt-1">{validationErrors.yearsExperience}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="industry" className="text-foreground/70">
                    Industry
                  </Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => setFormData({ ...formData, industry: value })}
                  >
                    <SelectTrigger id="industry">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind} value={ind}>
                          {ind}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="currentSalary" className="text-foreground/70">
                    Current Salary (Lakhs)
                  </Label>
                  <Input
                    id="currentSalary"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.currentSalary}
                    onChange={(e) => setFormData({ ...formData, currentSalary: e.target.value })}
                    className={validationErrors.currentSalary ? "border-destructive" : ""}
                  />
                  {validationErrors.currentSalary && (
                    <p className="text-xs text-destructive mt-1">{validationErrors.currentSalary}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contact & Links - Display only when not in edit mode */}
        {!isEditMode ? (
          <div className="overflow-x-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-min">
              <Card className="glass p-4 shrink-0 min-w-[250px]">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-foreground/60">Email</p>
                    <p className="text-foreground">{email}</p>
                  </div>
                </div>
              </Card>
              <Card className="glass p-4 shrink-0 min-w-[250px]">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-foreground/60">Phone</p>
                    <p className="text-foreground">{phone}</p>
                  </div>
                </div>
              </Card>
              <Card className="glass p-4 shrink-0 min-w-[250px]">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-foreground/60">Location</p>
                    <p className="text-foreground">{location}</p>
                  </div>
                </div>
              </Card>
              <Card className="glass p-4 shrink-0 min-w-[250px]">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-foreground/60">Current Salary</p>
                    <p className="text-foreground">${currentSalary}L</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          // Edit mode Contact Information
          <div className="space-y-4 bg-secondary/20 p-6 rounded-lg">
            <h3 className="font-semibold text-foreground">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="text-foreground/70">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={validationErrors.email ? "border-destructive" : ""}
                  placeholder="your@email.com"
                />
                {validationErrors.email && <p className="text-xs text-destructive mt-1">{validationErrors.email}</p>}
              </div>

              <div>
                <Label htmlFor="phone" className="text-foreground/70">
                  Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={validationErrors.phone ? "border-destructive" : ""}
                  placeholder="+91 98765 43210"
                />
                {validationErrors.phone && <p className="text-xs text-destructive mt-1">{validationErrors.phone}</p>}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="location" className="text-foreground/70">
                  Location *
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className={validationErrors.location ? "border-destructive" : ""}
                  placeholder="City, Country"
                />
                {validationErrors.location && (
                  <p className="text-xs text-destructive mt-1">{validationErrors.location}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Professional Links Section - Display only when not in edit mode */}
        {!isEditMode && (
          <Card className="glass p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Professional Links</h2>
              <ProfessionalLinksEdit links={professionalLinks} onSave={handleSaveProfessionalLinks} />
            </div>
            {professionalLinks.length > 0 ? (
              <ProfessionalLinksDisplay links={professionalLinks} />
            ) : (
              <p className="text-sm text-foreground/60">No professional links added yet.</p>
            )}
          </Card>
        )}

        {/* Stats Cards */}
        <div className="overflow-x-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 min-w-min">
            <Card className="glass p-6 text-center shrink-0 min-w-[150px]">
              <div className="flex justify-center mb-2">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{totalSkillsTracked}</p>
              <p className="text-xs text-foreground/60">Skills Tracked</p>
            </Card>
            <Card className="glass p-6 text-center shrink-0 min-w-[150px]">
              <div className="flex justify-center mb-2">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{gapAnalysesPerformed}</p>
              <p className="text-xs text-foreground/60">Gap Analyses</p>
            </Card>
            <Card className="glass p-6 text-center shrink-0 min-w-[150px]">
              <div className="flex justify-center mb-2">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{coursesEnrolled}</p>
              <p className="text-xs text-foreground/60">Courses Enrolled</p>
            </Card>
            <Card className="glass p-6 text-center shrink-0 min-w-[150px]">
              <div className="flex justify-center mb-2">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{learningHoursLogged}</p>
              <p className="text-xs text-foreground/60">Learning Hours</p>
            </Card>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="career" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-secondary/30">
            <TabsTrigger value="career">Career Goals</TabsTrigger>
            <TabsTrigger value="analyses">Gap Analyses</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Career Goals Tab */}
          <TabsContent value="career" className="space-y-6 mt-6">
            <Card className="glass p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">Career Transition Plan</h2>

              {careerGoalsLoading ? (
                <p className="text-foreground/60">Loading career goals...</p>
              ) : !careerGoals ? (
                <div className="text-center space-y-4 py-8">
                  <p className="text-lg font-semibold text-foreground">No Career Goals Set</p>
                  <p className="text-foreground/60 max-w-md mx-auto">
                    Create a comprehensive career plan to guide your professional development
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Current Role */}
                    <div className="space-y-3 bg-secondary/10 p-4 rounded-lg">
                      <h3 className="font-semibold text-foreground">Current Role</h3>
                      <div>
                        <Label className="text-foreground/70 text-xs">Job Title</Label>
                        <p className="text-foreground font-medium">{careerGoals.current_job_title || "Not set"}</p>
                      </div>
                      <div>
                        <Label className="text-foreground/70 text-xs">Company</Label>
                        <p className="text-foreground font-medium">{careerGoals.company || "Not set"}</p>
                      </div>
                    </div>

                    {/* Target Role */}
                    <div className="space-y-3 bg-primary/10 p-4 rounded-lg">
                      <h3 className="font-semibold text-foreground">Target Role</h3>
                      <div>
                        <Label className="text-foreground/70 text-xs">Job Title</Label>
                        <p className="text-foreground font-medium">{careerGoals.target_job_title || "Not set"}</p>
                      </div>
                      <div>
                        <Label className="text-foreground/70 text-xs">Industry</Label>
                        <p className="text-foreground font-medium">{careerGoals.desired_industry || "Not set"}</p>
                      </div>
                    </div>

                    {/* Salary Info */}
                    <div className="space-y-3 bg-secondary/10 p-4 rounded-lg">
                      <h3 className="font-semibold text-foreground">Salary Range</h3>
                      <p className="text-foreground font-medium">
                        {careerGoals.salary_currency} {careerGoals.salary_min} - {careerGoals.salary_max}
                      </p>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-3 bg-primary/10 p-4 rounded-lg">
                      <h3 className="font-semibold text-foreground">Timeline</h3>
                      <p className="text-foreground font-medium">{careerGoals.timeline_months} months</p>
                    </div>
                  </div>

                  {/* Work Preferences */}
                  {careerGoals.preferred_work_modes && careerGoals.preferred_work_modes.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-foreground/70 font-semibold">Work Mode Preferences</Label>
                      <div className="flex flex-wrap gap-2">
                        {careerGoals.preferred_work_modes.map((mode) => (
                          <Badge key={mode} variant="secondary">
                            {mode}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Target Locations */}
                  {careerGoals.target_locations && careerGoals.target_locations.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-foreground/70 font-semibold">Target Locations</Label>
                      <div className="flex flex-wrap gap-2">
                        {careerGoals.target_locations.map((location) => (
                          <Badge key={location} variant="outline">
                            {location}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Target Companies */}
                  {careerGoals.target_companies && careerGoals.target_companies.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-foreground/70 font-semibold">Target Companies</Label>
                      <div className="flex flex-wrap gap-2">
                        {careerGoals.target_companies.map((company) => (
                          <Badge
                            key={company}
                            variant="secondary"
                            className="bg-amber-500/20 text-amber-300 border-amber-500/30"
                          >
                            {company}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills to Acquire */}
                  {careerGoals.skills_to_acquire && careerGoals.skills_to_acquire.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-foreground/70 font-semibold">Skills to Acquire</Label>
                      <div className="flex flex-wrap gap-2">
                        {careerGoals.skills_to_acquire.map((skill) => (
                          <Badge key={skill} variant="outline" className="border-cyan-500/30 text-cyan-300">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Career Milestones */}
                  {careerGoals.career_milestones && careerGoals.career_milestones.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-foreground/70 font-semibold">Career Milestones</Label>
                      <div className="space-y-2">
                        {careerGoals.career_milestones.map((milestone: any, idx: number) => (
                          <div key={idx} className="bg-secondary/10 p-3 rounded-lg border-l-2 border-primary">
                            <p className="font-medium text-foreground">{milestone.title}</p>
                            <p className="text-sm text-foreground/70">{milestone.description}</p>
                            {milestone.targetDate && (
                              <p className="text-xs text-foreground/50 mt-1">Target: {milestone.targetDate}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Notes */}
                  {careerGoals.additional_notes && (
                    <div className="space-y-2">
                      <Label className="text-foreground/70 font-semibold">Additional Notes</Label>
                      <p className="text-foreground/80 bg-secondary/10 p-3 rounded-lg">
                        {careerGoals.additional_notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <Dialog open={careerGoalsModalOpen} onOpenChange={setCareerGoalsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="mt-6 bg-primary hover:bg-primary/90 gap-2 px-6 py-2.5 h-auto whitespace-nowrap">
                    <Edit2 className="w-4 h-4" />
                    {careerGoals ? "Edit Career Goals" : "Create Career Goals"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{careerGoals ? "Edit" : "Create"} Your Career Goals</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-6 p-4">
                    {/* Current Role Section */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                          1
                        </span>
                        Current Role
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-foreground/70">Job Title</Label>
                          <Input
                            value={careerGoalsFormData.current_job_title || ""}
                            onChange={(e) =>
                              setCareerGoalsFormData({ ...careerGoalsFormData, current_job_title: e.target.value })
                            }
                            placeholder="e.g., Senior Developer"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-foreground/70">Company</Label>
                          <Input
                            value={careerGoalsFormData.company || ""}
                            onChange={(e) =>
                              setCareerGoalsFormData({ ...careerGoalsFormData, company: e.target.value })
                            }
                            placeholder="Company name"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Target Role Section */}
                    <div className="space-y-4 border-t border-border pt-4">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                          2
                        </span>
                        Target Role
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-foreground/70">Target Job Title *</Label>
                          <Input
                            value={careerGoalsFormData.target_job_title || ""}
                            onChange={(e) =>
                              setCareerGoalsFormData({ ...careerGoalsFormData, target_job_title: e.target.value })
                            }
                            placeholder="e.g., Tech Lead"
                            className="mt-1"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-foreground/70">Desired Industry</Label>
                          <Select
                            value={careerGoalsFormData.desired_industry || ""}
                            onValueChange={(value) =>
                              setCareerGoalsFormData({ ...careerGoalsFormData, desired_industry: value })
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                            <SelectContent>
                              {INDUSTRIES.map((ind) => (
                                <SelectItem key={ind} value={ind}>
                                  {ind}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-foreground/70">Target Companies (comma-separated)</Label>
                        <Input
                          value={(careerGoalsFormData.target_companies || []).join(", ")}
                          onChange={(e) =>
                            setCareerGoalsFormData({
                              ...careerGoalsFormData,
                              target_companies: e.target.value
                                .split(",")
                                .map((c) => c.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="e.g., Google, Microsoft, Amazon"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Salary Section */}
                    <div className="space-y-4 border-t border-border pt-4">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                          3
                        </span>
                        Salary Expectations
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-foreground/70">Min Salary</Label>
                          <Input
                            type="number"
                            value={careerGoalsFormData.salary_min || ""}
                            onChange={(e) =>
                              setCareerGoalsFormData({ ...careerGoalsFormData, salary_min: Number(e.target.value) })
                            }
                            placeholder="0"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-foreground/70">Max Salary</Label>
                          <Input
                            type="number"
                            value={careerGoalsFormData.salary_max || ""}
                            onChange={(e) =>
                              setCareerGoalsFormData({ ...careerGoalsFormData, salary_max: Number(e.target.value) })
                            }
                            placeholder="0"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-foreground/70">Currency</Label>
                          <Select
                            value={careerGoalsFormData.salary_currency || "USD"}
                            onValueChange={(value) =>
                              setCareerGoalsFormData({ ...careerGoalsFormData, salary_currency: value })
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                              <SelectItem value="INR">INR</SelectItem>
                              <SelectItem value="CAD">CAD</SelectItem>
                              <SelectItem value="AUD">AUD</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Timeline & Work Preferences */}
                    <div className="space-y-4 border-t border-border pt-4">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                          4
                        </span>
                        Timeline & Preferences
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-foreground/70">Timeline to Achieve Goal *</Label>
                          <Select
                            value={String(careerGoalsFormData.timeline_months || "")}
                            onValueChange={(value) =>
                              setCareerGoalsFormData({ ...careerGoalsFormData, timeline_months: Number(value) })
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select timeline" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3">3 Months</SelectItem>
                              <SelectItem value="6">6 Months</SelectItem>
                              <SelectItem value="12">1 Year</SelectItem>
                              <SelectItem value="24">2 Years</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-foreground/70">Preferred Work Mode(s) *</Label>
                          <div className="flex gap-3 mt-2">
                            {["Remote", "Hybrid", "On-site"].map((mode) => (
                              <label key={mode} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={(careerGoalsFormData.preferred_work_modes || []).includes(mode)}
                                  onChange={(e) => {
                                    const modes = careerGoalsFormData.preferred_work_modes || []
                                    if (e.target.checked) {
                                      setCareerGoalsFormData({
                                        ...careerGoalsFormData,
                                        preferred_work_modes: [...modes, mode],
                                      })
                                    } else {
                                      setCareerGoalsFormData({
                                        ...careerGoalsFormData,
                                        preferred_work_modes: modes.filter((m) => m !== mode),
                                      })
                                    }
                                  }}
                                  className="rounded"
                                />
                                <span className="text-sm text-foreground">{mode}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-foreground/70">Target Locations (comma-separated)</Label>
                        <Input
                          value={(careerGoalsFormData.target_locations || []).join(", ")}
                          onChange={(e) =>
                            setCareerGoalsFormData({
                              ...careerGoalsFormData,
                              target_locations: e.target.value
                                .split(",")
                                .map((l) => l.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="e.g., San Francisco, New York, Remote"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Skills Section */}
                    <div className="space-y-4 border-t border-border pt-4">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                          5
                        </span>
                        Skills & Certifications
                      </h3>
                      <div>
                        <Label className="text-foreground/70">Skills to Acquire (comma-separated)</Label>
                        <Input
                          value={(careerGoalsFormData.skills_to_acquire || []).join(", ")}
                          onChange={(e) =>
                            setCareerGoalsFormData({
                              ...careerGoalsFormData,
                              skills_to_acquire: e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="e.g., System Design, AWS, Kubernetes"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-foreground/70">Target Certifications</Label>
                        <Input
                          value={(careerGoalsFormData.target_certifications || []).join(", ")}
                          onChange={(e) =>
                            setCareerGoalsFormData({
                              ...careerGoalsFormData,
                              target_certifications: e.target.value
                                .split(",")
                                .map((c) => c.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="e.g., AWS Solutions Architect, Kubernetes CKA"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Milestones Section */}
                    <div className="space-y-4 border-t border-border pt-4">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                          6
                        </span>
                        Career Milestones
                      </h3>
                      {careerGoalsFormData.career_milestones?.map((milestone: any, idx: number) => (
                        <div key={idx} className="space-y-2 bg-secondary/10 p-3 rounded-lg">
                          <Input
                            value={milestone.title}
                            onChange={(e) => {
                              const updated = [...(careerGoalsFormData.career_milestones || [])]
                              updated[idx] = { ...milestone, title: e.target.value }
                              setCareerGoalsFormData({ ...careerGoalsFormData, career_milestones: updated })
                            }}
                            placeholder="Milestone title"
                          />
                          <Input
                            value={milestone.description}
                            onChange={(e) => {
                              const updated = [...(careerGoalsFormData.career_milestones || [])]
                              updated[idx] = { ...milestone, description: e.target.value }
                              setCareerGoalsFormData({ ...careerGoalsFormData, career_milestones: updated })
                            }}
                            placeholder="Description"
                          />
                          <Input
                            type="date"
                            value={milestone.targetDate || ""}
                            onChange={(e) => {
                              const updated = [...(careerGoalsFormData.career_milestones || [])]
                              updated[idx] = { ...milestone, targetDate: e.target.value }
                              setCareerGoalsFormData({ ...careerGoalsFormData, career_milestones: updated })
                            }}
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const updated = (careerGoalsFormData.career_milestones || []).filter((_, i) => i !== idx)
                              setCareerGoalsFormData({ ...careerGoalsFormData, career_milestones: updated })
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <div className="space-y-2">
                        <Input
                          value={newMilestone.title}
                          onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                          placeholder="New milestone title"
                        />
                        <Input
                          value={newMilestone.description}
                          onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                          placeholder="Description"
                        />
                        <Input
                          type="date"
                          value={newMilestone.targetDate}
                          onChange={(e) => setNewMilestone({ ...newMilestone, targetDate: e.target.value })}
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (newMilestone.title) {
                              setCareerGoalsFormData({
                                ...careerGoalsFormData,
                                career_milestones: [...(careerGoalsFormData.career_milestones || []), newMilestone],
                              })
                              setNewMilestone({ title: "", description: "", targetDate: "" })
                            }
                          }}
                          className="bg-primary hover:bg-primary/90"
                        >
                          Add Milestone
                        </Button>
                      </div>
                    </div>

                    {/* Additional Notes */}
                    <div className="space-y-4 border-t border-border pt-4">
                      <h3 className="font-semibold text-foreground">Additional Notes</h3>
                      <Textarea
                        value={careerGoalsFormData.additional_notes || ""}
                        onChange={(e) =>
                          setCareerGoalsFormData({ ...careerGoalsFormData, additional_notes: e.target.value })
                        }
                        placeholder="Any additional information about your career goals..."
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t border-border">
                    <Button variant="outline" onClick={() => setCareerGoalsModalOpen(false)} className="bg-transparent">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveCareerGoals}
                      disabled={careerGoalsSaving}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {careerGoalsSaving ? "Saving..." : "Save Career Goals"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </Card>
          </TabsContent>

          {/* Gap Analyses Tab - Show real data from API */}
          <TabsContent value="analyses" className="space-y-6 mt-6">
            {analysesLoading ? (
              <Card className="glass p-6 text-center">
                <p className="text-foreground/60">Loading gap analyses...</p>
              </Card>
            ) : analysesError ? (
              <Card className="glass p-6 text-center">
                <p className="text-destructive">{analysesError}</p>
              </Card>
            ) : savedAnalyses.length === 0 ? (
              <Card className="glass p-6 text-center space-y-4">
                <p className="text-lg font-semibold text-foreground">No Gap Analyses Yet</p>
                <p className="text-foreground/60">
                  Start by analyzing your resume to identify skill gaps for your target role
                </p>
                <Button className="bg-primary hover:bg-primary/90 gap-2 px-6 py-2.5 h-auto whitespace-nowrap">
                  Start Gap Analysis
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {savedAnalyses.map((analysis) => (
                  <Card key={analysis.id} className="glass p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{analysis.targetRole}</h3>
                        <p className="text-sm text-foreground/60">{analysis.dateAnalyzed}</p>
                      </div>
                      <Badge
                        className={`text-lg px-3 py-1 ${analysis.matchScore >= 75 ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"}`}
                      >
                        {analysis.matchScore}%
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-y border-border">
                      <div>
                        <p className="text-xs text-foreground/60">Critical Gaps</p>
                        <p className="text-xl font-bold text-foreground">{analysis.criticalGaps}</p>
                      </div>
                      <div>
                        <p className="text-xs text-foreground/60">Skills to Improve</p>
                        <p className="text-xl font-bold text-foreground">{analysis.skillsToImprove}</p>
                      </div>
                      <div>
                        <p className="text-xs text-foreground/60">Matching Skills</p>
                        <p className="text-xl font-bold text-foreground">{analysis.matchingSkills.length}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-sm font-semibold text-foreground">Matching Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.matchingSkills.slice(0, 5).map((skill) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                        {analysis.matchingSkills.length > 5 && (
                          <Badge variant="outline">+{analysis.matchingSkills.length - 5} more</Badge>
                        )}
                      </div>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full bg-transparent">
                          View Full Report
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{analysis.targetRole} - Gap Analysis Report</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 p-4">
                          <div>
                            <h4 className="font-semibold text-foreground mb-2">Gap Details</h4>
                            <ul className="space-y-1 text-sm text-foreground/70">
                              {analysis.gapsDetails.slice(0, 10).map((gap, idx) => (
                                <li key={idx}>• {gap}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground mb-2">Recommendations</h4>
                            <ul className="space-y-1 text-sm text-foreground/70">
                              {analysis.recommendations.slice(0, 10).map((rec, idx) => (
                                <li key={idx}>• {rec}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Activity Tab - Show real activity data with time period selector */}
          <TabsContent value="activity" className="space-y-6 mt-6">
            <Card className="glass p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <h2 className="text-xl font-semibold text-foreground">Learning Activity</h2>
                <div className="flex gap-2">
                  {[7, 30, 90, 180].map((period) => (
                    <Button
                      key={period}
                      variant={activityPeriod === period ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleActivityPeriodChange(period)}
                      className={activityPeriod === period ? "bg-primary hover:bg-primary/90" : "bg-transparent"}
                    >
                      {period === 7 ? "7D" : period === 30 ? "30D" : period === 90 ? "3M" : "6M"}
                    </Button>
                  ))}
                </div>
              </div>

              {activityLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-foreground/60">Loading activity data...</p>
                </div>
              ) : activityError ? (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-destructive">{activityError}</p>
                </div>
              ) : activityData.length === 0 ? (
                <div className="h-80 flex flex-col items-center justify-center gap-4">
                  <p className="text-lg font-semibold text-foreground">No Activity Yet</p>
                  <p className="text-foreground/60 text-center">
                    Start learning, take courses, or run gap analyses to see your activity
                  </p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={activityData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="date"
                        stroke="#999"
                        tick={(props: any) => {
                          const { x, y, payload } = props
                          const date = new Date(payload.value)
                          const formatted = `${date.getMonth() + 1}/${date.getDate()}`
                          return (
                            <text x={x} y={y} textAnchor="middle" fill="#999" fontSize={12}>
                              {formatted}
                            </text>
                          )
                        }}
                      />
                      <YAxis stroke="#999" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid #333" }}
                        labelFormatter={(label) => {
                          const date = new Date(label)
                          return `${date.toLocaleDateString()}`
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="hours" stroke="#22D3EE" strokeWidth={2} name="Learning Hours" />
                      <Line type="monotone" dataKey="analyses" stroke="#F59E0B" strokeWidth={2} name="Gap Analyses" />
                      <Line type="monotone" dataKey="courses" stroke="#10B981" strokeWidth={2} name="Courses" />
                    </LineChart>
                  </ResponsiveContainer>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
                    <div className="text-center">
                      <p className="text-xs text-foreground/60">Total Learning Hours</p>
                      <p className="text-2xl font-bold text-foreground">
                        {activityData.reduce((sum, day) => sum + day.hours, 0).toFixed(1)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-foreground/60">Gap Analyses</p>
                      <p className="text-2xl font-bold text-foreground">
                        {activityData.reduce((sum, day) => sum + day.analyses, 0)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-foreground/60">Courses Started</p>
                      <p className="text-2xl font-bold text-foreground">
                        {activityData.reduce((sum, day) => sum + day.courses, 0)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-foreground/60">Average Daily Hours</p>
                      <p className="text-2xl font-bold text-foreground">
                        {(activityData.reduce((sum, day) => sum + day.hours, 0) / activityData.length).toFixed(1)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        <ProfilePictureUpload
          isOpen={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          onUpload={handleProfilePictureUpload}
          fullName={fullName}
          isUploading={isUploadingProfilePicture}
        />
      </div>
    </div>
  )
}
