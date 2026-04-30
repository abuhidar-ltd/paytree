"use client"

interface ProfileHeaderProps {
  name: string
  username: string
  bio?: string
  image?: string
  className?: string
  verified?: boolean
}

export function ProfileHeader({ 
  name, 
  username, 
  bio, 
  image, 
  className = "",
  verified = false 
}: ProfileHeaderProps) {
  return (
    <div className={`text-center space-y-4 animate-fade-in ${className}`}>
      {/* Profile Image with Ring */}
      <div className="relative inline-block group">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#00ff88] to-[rgba(0,255,136,0.4)] rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
        <div className="relative p-1 bg-white rounded-full">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-xl animate-scale-in"
            />
          ) : (
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 text-4xl font-bold border-4 border-white shadow-xl animate-scale-in">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        {/* Verified Badge */}
        {verified && (
          <div className="absolute bottom-2 right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg text-white" title="Verified Creator">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      
      {/* Name & Username */}
      <div className="space-y-1 animate-slide-up delay-100">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          {name}
        </h1>
        <p className="text-sm sm:text-base font-medium text-gray-500 bg-gray-50 inline-block px-3 py-1 rounded-full border border-gray-100">
          @{username}
        </p>
      </div>
      
      {/* Bio */}
      {bio && (
        <p className="text-base text-gray-600 max-w-md mx-auto leading-relaxed animate-slide-up delay-200 px-4">
          {bio}
        </p>
      )}
    </div>
  )
}
