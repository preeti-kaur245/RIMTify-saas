import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Calendar, Users, BookOpen, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'

const TeacherDashboard = () => {
  const [selectedClass, setSelectedClass] = useState('CS101')
  const [students, setStudents] = useState([
    { id: 1, name: 'Alice Thompson', rollNo: 'CS2024001', status: null },
    { id: 2, name: 'Bob Wilson', rollNo: 'CS2024002', status: null },
    { id: 3, name: 'Charlie Davis', rollNo: 'CS2024003', status: null },
    { id: 4, name: 'Diana Prince', rollNo: 'CS2024004', status: null },
    { id: 5, name: 'Ethan Hunt', rollNo: 'CS2024005', status: null },
  ])

  const toggleStatus = (id, status) => {
    setStudents(students.map(s => s.id === id ? { ...s, status } : s))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: '80px' }}>
      <nav style={{ padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)' }}>
        <h2 className="neon-text">Teacher Portal</h2>
        <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px 16px' }}><LogOut size={18} /></button>
      </nav>

      <main style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Mark Attendance</h1>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div className="glass-card" style={{ padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} color="var(--accent-purple)" />
              <span style={{ fontSize: '14px' }}>{new Date().toLocaleDateString()}</span>
            </div>
            <div className="glass-card" style={{ padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={16} color="var(--accent-cyan)" />
              <span style={{ fontSize: '14px' }}>Computer Science - Sec A</span>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px' }}>Student List ({students.length})</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>Mark All Present</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {students.map(student => (
              <motion.div 
                key={student.id}
                className="glass-card"
                style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}
              >
                <div>
                  <p style={{ fontWeight: '600' }}>{student.name}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Roll: {student.rollNo}</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => toggleStatus(student.id, 'present')}
                    style={{ 
                      background: student.status === 'present' ? 'var(--success)' : 'transparent',
                      border: `1px solid ${student.status === 'present' ? 'var(--success)' : 'var(--glass-border)'}`,
                      borderRadius: '12px',
                      padding: '8px 16px',
                      color: student.status === 'present' ? 'white' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: '0.2s'
                    }}
                  >
                    <CheckCircle size={16} /> Present
                  </button>
                  <button 
                    onClick={() => toggleStatus(student.id, 'absent')}
                    style={{ 
                      background: student.status === 'absent' ? 'var(--error)' : 'transparent',
                      border: `1px solid ${student.status === 'absent' ? 'var(--error)' : 'var(--glass-border)'}`,
                      borderRadius: '12px',
                      padding: '8px 16px',
                      color: student.status === 'absent' ? 'white' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: '0.2s'
                    }}
                  >
                    <XCircle size={16} /> Absent
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <button className="btn-primary" style={{ width: '100%', marginTop: '32px', padding: '16px' }}>
            Submit Attendance
          </button>
        </div>
      </main>
    </div>
  )
}

export default TeacherDashboard
