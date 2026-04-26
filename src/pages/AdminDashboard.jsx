import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, UserPlus, LogOut, LayoutDashboard, Settings } from 'lucide-react'
import { supabase } from '../lib/supabase'

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({ teachers: 0, students: 0, classes: 0 })

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside className="glass-card" style={{ 
        width: '280px', 
        borderRadius: '0 32px 32px 0', 
        borderLeft: 'none',
        padding: '32px 16px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10
      }}>
        <div style={{ padding: '0 16px', marginBottom: '40px' }}>
          <h2 className="neon-text" style={{ fontSize: '24px', fontWeight: '800' }}>RIMTIFY</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>ADMIN CONSOLE</p>
        </div>

        <nav style={{ flex: 1 }}>
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
          />
          <SidebarItem 
            icon={<Users size={20} />} 
            label="User Management" 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
          />
          <SidebarItem 
            icon={<Settings size={20} />} 
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>

        <button 
          onClick={handleLogout}
          className="btn-secondary" 
          style={{ width: '100%', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Welcome, Admin</h1>
            <p style={{ color: 'var(--text-secondary)' }}>System overview and control panel</p>
          </div>
          <div className="glass-card" style={{ padding: '12px 24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} color="white" />
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '600' }}>Admin User</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Super Admin</p>
            </div>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          <StatCard label="Total Teachers" value="24" icon={<Users color="var(--accent-purple)" />} gradient="linear-gradient(135deg, rgba(139, 92, 246, 0.1), transparent)" />
          <StatCard label="Total Students" value="1,240" icon={<Users color="var(--accent-cyan)" />} gradient="linear-gradient(135deg, rgba(6, 182, 212, 0.1), transparent)" />
          <StatCard label="Active Classes" value="48" icon={<LayoutDashboard color="var(--accent-magenta)" />} gradient="linear-gradient(135deg, rgba(217, 70, 239, 0.1), transparent)" />
        </div>

        <section className="glass-card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px' }}>Recent Activity</h3>
            <button className="btn-primary" style={{ padding: '8px 20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={16} /> Add New User
            </button>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Name</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Role</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Department</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <TableRow name="Dr. Sarah Johnson" role="Teacher" dept="Computer Science" status="Active" color="var(--success)" />
              <TableRow name="Alex Rivera" role="Student" dept="Engineering" status="Active" color="var(--success)" />
              <TableRow name="Michael Chen" role="Teacher" dept="Mathematics" status="Inactive" color="var(--error)" />
            </tbody>
          </table>
        </section>
      </main>
    </div>
  )
}

const SidebarItem = ({ icon, label, active, onClick }) => (
  <div 
    onClick={onClick}
    style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px', 
      padding: '12px 16px', 
      borderRadius: '12px',
      cursor: 'pointer',
      marginBottom: '8px',
      transition: 'all 0.2s ease',
      background: active ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
      border: active ? '1px solid var(--glass-border)' : '1px solid transparent'
    }}
  >
    {icon}
    <span style={{ fontWeight: active ? '600' : '400' }}>{label}</span>
  </div>
)

const StatCard = ({ label, value, icon, gradient }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="glass-card" 
    style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: gradient, zIndex: 0 }} />
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500' }}>{label}</p>
        <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)' }}>{icon}</div>
      </div>
      <h2 style={{ fontSize: '32px' }}>{value}</h2>
    </div>
  </motion.div>
)

const TableRow = ({ name, role, dept, status, color }) => (
  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
    <td style={{ padding: '16px', fontWeight: '500' }}>{name}</td>
    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{role}</td>
    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{dept}</td>
    <td style={{ padding: '16px' }}>
      <span style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '6px', 
        padding: '4px 12px', 
        borderRadius: '50px', 
        fontSize: '12px', 
        background: `${color}20`, 
        color: color,
        fontWeight: '600'
      }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
        {status}
      </span>
    </td>
  </tr>
)

export default AdminDashboard
