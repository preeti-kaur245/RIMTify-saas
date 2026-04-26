import React from 'react'
import { motion } from 'framer-motion'
import { PieChart, Calendar, Book, Bell, User, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'

const StudentDashboard = () => {
  const attendanceData = [
    { subject: 'Computer Science', percentage: 85, color: 'var(--accent-purple)' },
    { subject: 'Mathematics', percentage: 72, color: 'var(--accent-cyan)' },
    { subject: 'Physics', percentage: 90, color: 'var(--accent-magenta)' },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: '100px' }}>
      <header style={{ padding: '32px 20px', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-magenta))', margin: '0 auto 16px', border: '4px solid var(--bg-surface)', padding: '4px' }}>
           <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="profile" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
        </div>
        <h1 style={{ fontSize: '24px' }}>Welcome, Alex</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Roll: CS2024001 • 4th Semester</p>
      </header>

      <main style={{ maxWidth: '500px', margin: '0 auto', padding: '0 20px' }}>
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Overall Attendance</p>
          <h2 className="neon-text" style={{ fontSize: '48px', fontWeight: '800' }}>82%</h2>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginTop: '16px', overflow: 'hidden' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '82%' }}
              style={{ height: '100%', background: 'linear-gradient(to right, var(--accent-cyan), var(--accent-purple))', borderRadius: '10px' }}
            />
          </div>
        </div>

        <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Subject-wise Attendance</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {attendanceData.map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card"
              style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${item.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Book size={20} color={item.color} />
                </div>
                <span style={{ fontWeight: '500' }}>{item.subject}</span>
              </div>
              <span style={{ fontWeight: '700', color: item.percentage < 75 ? 'var(--error)' : 'var(--success)' }}>{item.percentage}%</span>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Bottom Navigation for Mobile Feel */}
      <nav className="glass-card" style={{ 
        position: 'fixed', 
        bottom: '20px', 
        left: '20px', 
        right: '20px', 
        height: '70px', 
        borderRadius: '25px', 
        display: 'flex', 
        justifyContent: 'space-around', 
        alignItems: 'center',
        padding: '0 20px',
        zIndex: 100
      }}>
        <NavItem icon={<PieChart size={24} />} active />
        <NavItem icon={<Calendar size={24} />} />
        <NavItem icon={<Bell size={24} />} />
        <NavItem icon={<User size={24} />} />
        <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><LogOut size={24} /></button>
      </nav>
    </div>
  )
}

const NavItem = ({ icon, active }) => (
  <div style={{ 
    color: active ? 'var(--accent-cyan)' : 'var(--text-muted)', 
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px'
  }}>
    {icon}
    {active && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-cyan)' }} />}
  </div>
)

export default StudentDashboard
