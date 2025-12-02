/**
 * Enhanced Course Generator for Learning Path
 * Converts gap analysis skills into structured learning courses with detailed paths
 */

import { getCoursesBySkill, type BackendCourse } from "@/lib/api/fastapi-client"

export interface Course {
  id: string
  title: string
  platform: string
  url: string
  rating: number
  level: string
  matchedSkill: string
}

export interface GeneratedCourse {
  title: string
  platform: string
  totalHours: number
  estimatedWeeks: number
  description: string
  skillName: string
  curriculum?: string[]
  difficulty?: "Beginner" | "Intermediate" | "Advanced"
  prerequisites?: string[]
}

const skillToCourseMap: Record<string, GeneratedCourse[]> = {
  Kubernetes: [
    {
      title: "Kubernetes Mastery: Complete Course",
      platform: "Udemy/Linux Academy",
      totalHours: 48,
      estimatedWeeks: 6,
      description: "Master container orchestration and Kubernetes cluster management from basics to advanced",
      skillName: "Kubernetes",
      difficulty: "Intermediate",
      prerequisites: ["Docker", "Linux"],
      curriculum: [
        "Kubernetes Architecture & Components",
        "Pods, Services & Networking",
        "Deployments & StatefulSets",
        "ConfigMaps & Secrets",
        "Storage & Volumes",
        "Helm & Package Management",
        "Monitoring & Logging",
        "Security & RBAC",
      ],
    },
  ],
  Terraform: [
    {
      title: "Terraform Complete Guide",
      platform: "Udemy/HashiCorp Learn",
      totalHours: 40,
      estimatedWeeks: 5,
      description: "Learn Infrastructure as Code (IaC) with Terraform for cloud provisioning",
      skillName: "Terraform",
      difficulty: "Intermediate",
      prerequisites: ["AWS/Cloud basics"],
      curriculum: [
        "Terraform Fundamentals",
        "HCL Syntax & Resources",
        "State Management",
        "Modules & Reusability",
        "Variable & Outputs",
        "AWS/GCP/Azure Integration",
        "Terraform Cloud & Workspaces",
        "Testing & Best Practices",
      ],
    },
  ],
  GraphQL: [
    {
      title: "GraphQL Complete Course",
      platform: "Udemy/Frontend Masters",
      totalHours: 32,
      estimatedWeeks: 4,
      description: "Build efficient APIs with GraphQL and master query language fundamentals",
      skillName: "GraphQL",
      difficulty: "Intermediate",
      prerequisites: ["JavaScript/Node.js", "REST API basics"],
      curriculum: [
        "GraphQL Basics & Schema",
        "Queries & Mutations",
        "Resolvers & Subscriptions",
        "Apollo Server & Client",
        "Authentication & Authorization",
        "Performance Optimization",
        "Real-world Projects",
        "Advanced Patterns",
      ],
    },
  ],
  React: [
    {
      title: "React Complete Guide",
      platform: "Udemy/React Docs",
      totalHours: 48,
      estimatedWeeks: 6,
      description: "Master modern React development patterns and hooks",
      skillName: "React",
      difficulty: "Intermediate",
      prerequisites: ["JavaScript", "HTML/CSS"],
      curriculum: [
        "React Fundamentals & JSX",
        "Components & Props",
        "State & Lifecycle",
        "Hooks Deep Dive",
        "Context API",
        "Performance Optimization",
        "Testing React Apps",
        "Advanced Patterns & Architecture",
      ],
    },
  ],
  "Node.js": [
    {
      title: "Node.js Complete Guide",
      platform: "Udemy/Egghead",
      totalHours: 40,
      estimatedWeeks: 5,
      description: "Build scalable backend applications and APIs with Node.js",
      skillName: "Node.js",
      difficulty: "Intermediate",
      prerequisites: ["JavaScript", "REST concepts"],
      curriculum: [
        "Node.js Runtime & Core Modules",
        "Express Framework",
        "Routing & Middleware",
        "Database Integration",
        "Authentication & Security",
        "Async Patterns",
        "Testing & Debugging",
        "Deployment & Performance",
      ],
    },
  ],
  TypeScript: [
    {
      title: "TypeScript Complete Course",
      platform: "Udemy/Frontend Masters",
      totalHours: 32,
      estimatedWeeks: 4,
      description: "Master type-safe JavaScript development with TypeScript",
      skillName: "TypeScript",
      difficulty: "Intermediate",
      prerequisites: ["JavaScript ES6+"],
      curriculum: [
        "TypeScript Basics & Types",
        "Interfaces & Types",
        "Generics & Advanced Types",
        "Decorators & Metadata",
        "Modules & Namespaces",
        "TypeScript with React",
        "TypeScript with Node.js",
        "Project Setup & Best Practices",
      ],
    },
  ],
  Docker: [
    {
      title: "Docker & Containerization",
      platform: "Linux Academy/Pluralsight",
      totalHours: 36,
      estimatedWeeks: 5,
      description: "Containerize applications and master Docker for development and production",
      skillName: "Docker",
      difficulty: "Intermediate",
      prerequisites: ["Linux basics"],
      curriculum: [
        "Docker Fundamentals",
        "Images & Containers",
        "Docker Compose",
        "Networking & Volumes",
        "Security Best Practices",
        "Multi-stage Builds",
        "Docker Registry",
        "Production Deployment",
      ],
    },
  ],
  "Machine Learning": [
    {
      title: "Machine Learning Specialization",
      platform: "Coursera/Andrew Ng",
      totalHours: 60,
      estimatedWeeks: 8,
      description: "Comprehensive machine learning fundamentals and practical techniques",
      skillName: "Machine Learning",
      difficulty: "Advanced",
      prerequisites: ["Python", "Statistics/Math"],
      curriculum: [
        "ML Fundamentals & Workflow",
        "Supervised Learning",
        "Unsupervised Learning",
        "Neural Networks & Deep Learning",
        "Model Evaluation & Validation",
        "Feature Engineering",
        "Real-world ML Projects",
        "Ethics & Responsible AI",
      ],
    },
  ],
  "Database Design": [
    {
      title: "Database Design & Optimization",
      platform: "Udemy/Pluralsight",
      totalHours: 44,
      estimatedWeeks: 6,
      description: "Master database modeling, optimization, and architecture patterns",
      skillName: "Database Design",
      difficulty: "Intermediate",
      prerequisites: ["SQL basics", "Relational concepts"],
      curriculum: [
        "Relational Database Fundamentals",
        "ER Modeling & Normalization",
        "Query Optimization",
        "Indexing Strategies",
        "Transaction Management",
        "Scaling & Replication",
        "NoSQL Databases",
        "Real-world Case Studies",
      ],
    },
  ],
  "System Design": [
    {
      title: "System Design Interview Course",
      platform: "Udemy/ByteByteGo",
      totalHours: 52,
      estimatedWeeks: 7,
      description: "Design scalable, reliable systems with architectural patterns",
      skillName: "System Design",
      difficulty: "Advanced",
      prerequisites: ["Backend basics", "Database knowledge"],
      curriculum: [
        "Scalability Fundamentals",
        "Load Balancing & Caching",
        "Database Sharding & Replication",
        "Message Queues & Event Streaming",
        "Microservices Architecture",
        "Consistency Models",
        "Monitoring & Logging",
        "Real Systems Case Studies",
      ],
    },
  ],
  Python: [
    {
      title: "Python Complete Programming Guide",
      platform: "Udemy/Real Python",
      totalHours: 40,
      estimatedWeeks: 5,
      description: "Advanced Python programming from intermediate to expert level",
      skillName: "Python",
      difficulty: "Intermediate",
      prerequisites: ["Programming basics"],
      curriculum: [
        "Advanced Python Syntax",
        "OOP & Design Patterns",
        "Functional Programming",
        "Async & Concurrency",
        "Testing & Debugging",
        "Package Development",
        "Performance Optimization",
        "Real-world Applications",
      ],
    },
  ],
  AWS: [
    {
      title: "AWS Certified Solutions Architect",
      platform: "Linux Academy/A Cloud Guru",
      totalHours: 45,
      estimatedWeeks: 6,
      description: "Master AWS architecture and prepare for Solutions Architect certification",
      skillName: "AWS",
      difficulty: "Intermediate",
      prerequisites: ["Cloud computing basics"],
      curriculum: [
        "AWS Core Services",
        "Compute (EC2, Lambda, ECS)",
        "Storage (S3, EBS, EFS)",
        "Databases (RDS, DynamoDB)",
        "Networking & VPC",
        "Security & Identity",
        "Monitoring & Scaling",
        "Cost Optimization",
      ],
    },
  ],
  "REST APIs": [
    {
      title: "RESTful API Design & Development",
      platform: "Pluralsight/Egghead",
      totalHours: 28,
      estimatedWeeks: 4,
      description: "Design and build production-ready REST APIs with best practices",
      skillName: "REST APIs",
      difficulty: "Intermediate",
      prerequisites: ["Backend language knowledge"],
      curriculum: [
        "REST Principles & Constraints",
        "HTTP Methods & Status Codes",
        "Request/Response Design",
        "Versioning & Deprecation",
        "Authentication & Authorization",
        "Rate Limiting & Pagination",
        "Error Handling",
        "Documentation & Testing",
      ],
    },
  ],
  "CI/CD Pipelines": [
    {
      title: "CI/CD & DevOps Fundamentals",
      platform: "Linux Academy/Udemy",
      totalHours: 36,
      estimatedWeeks: 5,
      description: "Master continuous integration and deployment practices",
      skillName: "CI/CD Pipelines",
      difficulty: "Intermediate",
      prerequisites: ["Git", "Bash scripting"],
      curriculum: [
        "CI/CD Concepts",
        "Jenkins Setup & Configuration",
        "GitHub Actions & GitLab CI",
        "Build Automation",
        "Testing Automation",
        "Deployment Strategies",
        "Monitoring & Rollback",
        "Infrastructure as Code",
      ],
    },
  ],
}

/**
 * Generate a comprehensive course structure from a skill name
 */
export function generateCourseFromSkill(skillName: string): GeneratedCourse {
  const mapped = skillToCourseMap[skillName]

  if (mapped && mapped.length > 0) {
    return mapped[0]
  }

  return {
    title: `Mastering ${skillName}`,
    platform: "Multiple Platforms",
    totalHours: 40,
    estimatedWeeks: 5,
    description: `Comprehensive learning path to master ${skillName} with hands-on projects and real-world applications`,
    skillName,
    difficulty: "Intermediate",
    prerequisites: [],
    curriculum: [
      `${skillName} Fundamentals`,
      "Core Concepts & Theory",
      "Practical Implementation",
      "Advanced Techniques",
      "Best Practices & Patterns",
      "Real-world Projects",
      "Performance Optimization",
      "Interview Preparation",
    ],
  }
}

/**
 * Generate multiple course recommendations for a skill
 */
export function generateCourseRecommendations(skillName: string): GeneratedCourse[] {
  const mapped = skillToCourseMap[skillName]

  if (mapped && mapped.length > 0) {
    return mapped
  }

  // Return default course wrapped in array
  return [generateCourseFromSkill(skillName)]
}

/**
 * Generate course recommendations from backend API
 * Fetches real courses from the database for given skills
 */
export async function generateCourseRecommendationsFromBackend(
  skills: string[]
): Promise<Course[]> {
  const USE_BACKEND = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'true'
  
  if (!USE_BACKEND) {
    // Return empty array if using mock data (fallback to existing functions)
    return []
  }
  
  const allCourses: Course[] = []
  
  // Get courses for top 5 skills
  for (const skillName of skills.slice(0, 5)) {
    try {
      const result = await getCoursesBySkill(skillName, 10)
      
      result.courses.forEach(course => {
        allCourses.push({
          id: course.id.toString(),
          title: course.title,
          platform: course.platform,
          url: course.url,
          rating: course.rating || 0,
          level: course.level || "All Levels",
          matchedSkill: skillName,
        })
      })
    } catch (error) {
      console.error(`Failed to fetch courses for ${skillName}:`, error)
    }
  }
  
  // Remove duplicates based on course ID
  const uniqueCourses = Array.from(
    new Map(allCourses.map(c => [c.id, c])).values()
  )
  
  return uniqueCourses
}
