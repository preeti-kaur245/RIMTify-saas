import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface ScreenLoaderProps {
  isLoading: boolean
  message?: string
}

const ScreenLoader: React.FC<ScreenLoaderProps> = ({ isLoading, message = 'Processing...' }) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            gap: '20px'
          }}
        >
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              rotate: { duration: 1, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              border: '3px solid transparent',
              borderTopColor: 'var(--accent-cyan)',
              borderBottomColor: 'var(--accent-magenta)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
             <Loader2 size={32} color="white" />
          </motion.div>
          
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ textAlign: 'center' }}
          >
            <h3 className="neon-text" style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
              {message}
            </h3>
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-cyan)' }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ScreenLoader
