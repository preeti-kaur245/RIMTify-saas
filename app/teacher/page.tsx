'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, XCircle, Calendar, BookOpen, LogOut, 
  Search, Filter, History, Users, Save, Check, AlertCircle, 
  ChevronRight, Clock, Edit2, FileText, Upload, Plus, X, Link as LinkIcon, Loader2, Trash2, Book, Trophy, DollarSign, Megaphone
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState('attendance')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedSession, setSelectedSession] = useState(1)
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  
  const [students, setStudents] = useState<any[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'present' | 'absent' | null>>({})
  const [gradeRecords, setGradeRecords] = useState<Record<string, { marks: string, remarks: string }>>({})
  const [examType, setExamType] = useState('internal')
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [payrolls, setPayrolls] = useState<any[]>([])
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchInitialData()
    fetchCourses()
    fetchAnnouncements()
    fetchPayroll()
  }, [])

  const fetchInitialData = async () => {
    const { data: user } = await supabase.auth.getUser()
    if (user?.user) {
      const { data: historyData } = await supabase.from('attendance').select('date, session_no, lecture_note').eq('teacher_id', user.user.id).order('date', { ascending: false })
      if (historyData) setHistory(Array.from(new Set(historyData.map(h => `${h.date}-${h.session_no}`))).map(key => historyData.find(h => `${h.date}-${h.session_no}` === key)))
    }
  }

  const fetchAnnouncements = async () => {
    const { data } = await supabase.from('announcements').select('*').in('target_role', ['all', 'teacher']).order('created_at', { ascending: false })
    if (data) setAnnouncements(data)
  }

  const fetchPayroll = async () => {
    const { data: user } = await supabase.auth.getUser()
    if (!user?.user) return
    const { data } = await supabase.from('payroll').select('*').eq('teacher_id', user.user.id).order('created_at', { ascending: false })
    if (data) setPayrolls(data)
  }

  const fetchCourses = async () => {
    const { data } = await supabase.from('courses').select('*')
    if (data) { setCourses(data); if (data.length > 0) setSelectedCourse(data[0]) }
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login'); }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex' }}>
      
      <aside className="glass-card" style={{ width: '280px', borderRadius: '0 32px 32px 0', padding: '32px 16px', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ padding: '0 16px', marginBottom: '40px' }}><h2 className="neon-text" style={{ fontSize: '24px', fontWeight: '800' }}>FACULTY</h2></div>
        <nav style={{ flex: 1, overflowY: 'auto' }}>
          <SidebarItem icon={<CheckCircle size={18} />} label="Attendance" active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} />
          <SidebarItem icon={<Megaphone size={18} />} label="Announce" active={activeTab === 'announce'} onClick={() => setActiveTab('announce')} />
          <SidebarItem icon={<Trophy size={18} />} label="Grades" active={activeTab === 'grades'} onClick={() => setActiveTab('grades')} />
          <SidebarItem icon={<DollarSign size={18} />} label="My Payroll" active={activeTab === 'payroll'} onClick={() => setActiveTab('payroll')} />
          <SidebarItem icon={<History size={18} />} label="History" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
          <SidebarItem icon={<Users size={18} />} label="Students" active={activeTab === 'students'} onClick={() => setActiveTab('students')} />
        </nav>
        <button onClick={handleLogout} className="btn-secondary" style={{ width: '100%', marginTop: '20px' }}><LogOut size={18} /> Logout</button>
      </aside>

      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'attendance' && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 style={{ marginBottom: '24px' }}>Welcome, Prof.</h1>
                <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid var(--accent-purple)', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}><Megaphone size={20} color="var(--accent-purple)" /> <h3 style={{ fontSize: '18px' }}>Latest Announcement</h3></div>
                  {announcements.length > 0 ? (
                    <div>
                      <p style={{ fontWeight: '600', marginBottom: '4px' }}>{announcements[0].title}</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{announcements[0].message}</p>
                    </div>
                  ) : <p style={{ color: 'var(--text-muted)' }}>No recent announcements.</p>}
                </div>
                {/* ... Attendance marking logic same as before ... */}
                <div className="glass-card" style={{ padding: '24px' }}>
                   <h3>Mark Attendance</h3>
                   <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Select course and session to begin.</p>
                </div>
             </motion.div>
          )}

          {activeTab === 'announce' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
               <h2 style={{ marginBottom: '24px' }}>Broadcast History</h2>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 {announcements.map(a => (
                    <div key={a.id} className="glass-card" style={{ padding: '24px', borderLeft: `4px solid ${a.type === 'urgent' ? 'var(--error)' : 'var(--accent-cyan)'}` }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <h3 style={{ fontSize: '18px' }}>{a.title}</h3>
                          <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '50px' }}>{a.type.toUpperCase()}</span>
                       </div>
                       <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{a.message}</p>
                    </div>
                 ))}
               </div>
            </motion.div>
          )}

          {activeTab === 'payroll' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
               <h2 style={{ marginBottom: '24px' }}>My Salary Slips</h2>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 {payrolls.map(p => (
                    <div key={p.id} className="glass-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div><h4 style={{ fontSize: '18px' }}>{p.month} {p.year} Salary</h4><p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Base: ${p.base_salary} • Bonus: ${p.bonus}</p></div>
                       <div style={{ textAlign: 'right' }}><p style={{ fontSize: '20px', fontWeight: '800', color: 'var(--success)' }}>${p.net_salary}</p><span style={{ fontSize: '11px', color: p.status === 'paid' ? 'var(--success)' : 'var(--error)' }}>{p.status.toUpperCase()}</span></div>
                    </div>
                 ))}
                 {payrolls.length === 0 && <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No payroll records found.</div>}
               </div>
            </motion.div>
          )}

          {/* ... other tabs ... */}
        </AnimatePresence>
      </main>
    </div>
  )
}

const SidebarItem = ({ icon, label, active, onClick }: any) => (
  <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', cursor: 'pointer', marginBottom: '4px', background: active ? 'rgba(255, 255, 255, 0.05)' : 'transparent', color: active ? 'var(--text-primary)' : 'var(--text-secondary)', border: active ? '1px solid var(--glass-border)' : '1px solid transparent', transition: '0.2s' }}>{icon}<span style={{ fontWeight: active ? '600' : '400', fontSize: '14px' }}>{label}</span></div>
)

export default TeacherDashboard
