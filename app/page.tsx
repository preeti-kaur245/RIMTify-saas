'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Shield, Users, BookOpen, ChevronRight, GraduationCap } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav style={{ 
        padding: '24px 40px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid var(--glass-border)',
        backdropFilter: 'blur(10px)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-magenta))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={20} color="white" />
          </div>
          <h2 className="neon-text" style={{ fontSize: '24px', fontWeight: '800' }}>RIMTIFY</h2>
        </div>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <Link href="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: '500' }}>Features</Link>
          <Link href="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: '500' }}>About</Link>
          <Link href="/login" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 24px' }}>Login</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ flex: 1, paddingTop: '120px', paddingBottom: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', maxWidth: '800px', padding: '0 20px' }}
        >
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '8px 16px', 
            borderRadius: '50px', 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid var(--glass-border)',
            marginBottom: '32px',
            fontSize: '14px',
            color: 'var(--accent-cyan)'
          }}>
            <GraduationCap size={16} />
            Next-Gen University Management
          </div>
          
          <h1 style={{ fontSize: '64px', fontWeight: '800', lineHeight: '1.1', marginBottom: '24px' }}>
            Elevate Your Campus <br />
            <span className="neon-text">Experience</span>
          </h1>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '20px', marginBottom: '40px', lineHeight: '1.6' }}>
            A comprehensive, role-based platform designed for modern universities. 
            Empower administrators, inspire teachers, and engage students with Rimtify.
          </p>

          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <Link href="/login" className="btn-primary" style={{ textDecoration: 'none', padding: '16px 32px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Get Started <ChevronRight size={20} />
            </Link>
            <Link href="/login" className="btn-secondary" style={{ textDecoration: 'none', padding: '16px 32px', fontSize: '18px' }}>
              Watch Demo
            </Link>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '32px', 
          width: '100%', 
          maxWidth: '1100px', 
          marginTop: '100px',
          padding: '0 40px'
        }}>
          <FeatureCard 
            icon={<Shield color="var(--accent-purple)" />} 
            title="Admin Control" 
            desc="Manage departments, faculty, and student records with robust security and oversight."
          />
          <FeatureCard 
            icon={<BookOpen color="var(--accent-cyan)" />} 
            title="Faculty Tools" 
            desc="Effortless attendance tracking, material sharing, and performance reporting."
          />
          <FeatureCard 
            icon={<Users color="var(--accent-magenta)" />} 
            title="Student Portal" 
            desc="Real-time attendance views, assignment submissions, and instant notifications."
          />
        </div>
      </main>

      {/* Footer */}
      <footer style={{ 
        padding: '60px 40px', 
        borderTop: '1px solid var(--glass-border)', 
        marginTop: 'auto',
        textAlign: 'center'
      }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          © 2026 Rimtify University Management System. All rights reserved.
        </p>
      </footer>
    </div>
  )
}

const FeatureCard = ({ icon, title, desc }: any) => (
  <motion.div 
    whileHover={{ y: -10 }}
    className="glass-card" 
    style={{ padding: '40px', textAlign: 'left' }}
  >
    <div style={{ 
      width: '56px', 
      height: '56px', 
      borderRadius: '16px', 
      background: 'rgba(255,255,255,0.03)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      marginBottom: '24px',
      border: '1px solid var(--glass-border)'
    }}>
      {icon}
    </div>
    <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>{title}</h3>
    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{desc}</p>
  </motion.div>
)
