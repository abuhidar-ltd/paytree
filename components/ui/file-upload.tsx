"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"

interface FileUploadProps {
  label: string
  accept?: string
  maxSize?: number
  onUpload: (file: File) => Promise<void>
  currentImage?: string
  type?: "profile" | "background"
  className?: string
}

export function FileUpload({ 
  label, 
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB default
  onUpload,
  currentImage,
  type = "profile",
  className = ""
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file")
      return
    }

    // Validate file size
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / 1024 / 1024
      toast.error(`File too large. Maximum size: ${maxSizeMB}MB`)
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    try {
      await onUpload(file)
      toast.success("Image uploaded successfully!")
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload image")
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const currentDisplayImage = preview || currentImage

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-300 mb-3">
        {label}
      </label>

      <div
        className={`relative rounded-2xl border-2 border-dashed transition-all ${
          dragActive 
            ? "border-blue-500 bg-blue-500/10" 
            : "border-white/20 hover:border-white/40"
        } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
          disabled={uploading}
        />

        {currentDisplayImage ? (
          <div className="relative group">
            <div className={`${
              type === "profile" 
                ? "w-32 h-32 rounded-full mx-auto my-4" 
                : "w-full h-48 rounded-xl"
            } overflow-hidden`}>
              <img 
                src={currentDisplayImage} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <div className="text-center text-white">
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="text-sm font-medium">Change Image</div>
              </div>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full p-8 text-center hover:bg-white/5 transition-colors"
          >
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div className="text-white font-medium mb-2">
              Click to upload or drag and drop
            </div>
            <div className="text-sm text-gray-400">
              PNG, JPG, WebP up to {maxSize / 1024 / 1024}MB
            </div>
          </button>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
              <div className="text-white font-medium">Uploading...</div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 text-xs text-gray-400">
        {type === "profile" ? "Recommended: Square image, at least 400x400px" : "Recommended: At least 1920x1080px for best quality"}
      </div>
    </div>
  )
}
