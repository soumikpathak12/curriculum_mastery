'use client'

export default function ScrollToTopButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      onClick={handleClick}
      className={className}
    >
      {children}
    </button>
  )
}

