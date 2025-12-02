// This fix suppresses "ResizeObserver loop completed with undelivered notifications" errors
// that occur when using Select, Slider, and Chart components from shadcn/ui

if (typeof window !== "undefined") {
  const OriginalResizeObserver = window.ResizeObserver

  const debounce = <T extends (...args: any[]) => any>(func: T, wait: number): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | null = null
    return function executedFunction(...args: Parameters<T>) {
      const later = () => {
        timeout = null
        func(...args)
      }
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  window.ResizeObserver = class ResizeObserver extends OriginalResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      super(debounce(callback, 20))
    }
  }

  const errorHandler = (event: ErrorEvent) => {
    const isResizeObserverError =
      event.message === "ResizeObserver loop completed with undelivered notifications." ||
      event.message === "ResizeObserver loop limit exceeded" ||
      event.message?.includes("ResizeObserver")

    if (isResizeObserverError) {
      event.stopImmediatePropagation()
      event.preventDefault()
      return false
    }
  }

  window.addEventListener("error", errorHandler)

  window.addEventListener("unhandledrejection", (event) => {
    if (event.reason?.message?.includes("ResizeObserver")) {
      event.preventDefault()
    }
  })
}
