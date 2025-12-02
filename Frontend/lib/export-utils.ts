export interface SkillData {
  skill: string
  level: number
  proficiency: string
  gap?: number
  [key: string]: any
}

export function exportToCSV(data: SkillData[], filename: string) {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          // Escape commas and quotes
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        })
        .join(","),
    ),
  ].join("\n")

  downloadFile(csvContent, filename, "text/csv")
}

export function exportToJSON(data: SkillData[], filename: string) {
  const jsonContent = JSON.stringify(data, null, 2)
  downloadFile(jsonContent, filename, "application/json")
}

export const downloadCSV = exportToCSV
export const downloadJSON = exportToJSON

export function downloadPDF(data: SkillData[], filename: string) {
  // Generate a simple PDF-like text format since we don't have a PDF library
  const textContent = [
    "SKILLS ANALYSIS REPORT",
    "=".repeat(50),
    new Date().toISOString(),
    "",
    ...data.map(
      (item) => `${item.skill}: ${item.level}/10 (${item.proficiency})${item.gap ? ` - Gap: ${item.gap}` : ""}`,
    ),
  ].join("\n")

  downloadFile(textContent, filename, "text/plain")
}

export function generateShareableLink(data: SkillData[]): string {
  // Create a base64 encoded link with the data
  const encoded = btoa(JSON.stringify(data))
  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  return `${baseUrl}/share?data=${encoded}`
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    return navigator.clipboard.writeText(text)
  } else {
    // Fallback for older browsers
    return new Promise((resolve) => {
      const textarea = document.createElement("textarea")
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      resolve()
    })
  }
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function getCurrentDateString(): string {
  const now = new Date()
  return now.toISOString().split("T")[0]
}
