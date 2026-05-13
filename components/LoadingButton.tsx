import React from 'react'
import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  variant?: 'primary' | 'secondary'
}

const LoadingButton: React.FC<LoadingButtonProps> = ({ 
  children, 
  loading, 
  loadingText, 
  variant = 'primary', 
  disabled, 
  className = '', 
  style,
  ...props 
}) => {
  const baseClass = variant === 'primary' ? 'btn-primary' : 'btn-secondary'
  
  return (
    <button
      className={`${baseClass} ${className} ${loading ? 'opacity-80 cursor-not-allowed' : ''}`}
      disabled={loading || disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        position: 'relative',
        ...style
      }}
      {...props}
    >
      {loading && (
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <Loader2 size={18} className="animate-spin" />
        </motion.span>
      )}
      <span>{loading ? (loadingText || children) : children}</span>
    </button>
  )
}

export default LoadingButton
