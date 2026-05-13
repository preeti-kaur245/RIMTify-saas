'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PieChart, Calendar, Book, Bell, User, LogOut, 
  Download, FileText, Send, Clock, CheckCircle2, ChevronRight, Trophy, Landmark, Bookmark
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import ScreenLoader from '@/components/ScreenLoader'
import LoadingButton from '@/components/LoadingButton'

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [results, setResults] = useState<any[]>([])
  const [fees, setFees] = useState<any[]>([])
  const [loans, setLoans] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [absentToday, setAbsentToday] = useState(false)
  const [attendancePercentage, setAttendancePercentage] = useState(0)
  const [studentProfile, setStudentProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: user } = await supabase.auth.getUser()
    if (!user?.user) return

    // Fetch user profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.user.id).single()
    if (profile) setStudentProfile(profile)

    // Fetch Results
    const { data: res } = await supabase.from('grades').select('*, courses(name, code)').eq('student_id', user.user.id)
    if (res) setResults(res)

    // Fetch Fees
    const { data: f } = await supabase.from('fees').select('*').eq('student_id', user.user.id).order('due_date')
    if (f) setFees(f)

    // Fetch Library Loans
    const { data: l } = await supabase.from('book_loans').select('*, books(title, author)').eq('student_id', user.user.id)
    if (l) setLoans(l)

    // Fetch Materials
    const { data: m } = await supabase.from('materials').select('*').order('created_at', { ascending: false })
    if (m) setMaterials(m)

    // Fetch Announcements
    const { data: a } = await supabase.from('announcements').select('*').in('target_role', ['all', 'student']).order('created_at', { ascending: false })
    if (a) setAnnouncements(a)

    // Check attendance for today
    const today = new Date().toISOString().split('T')[0]
    const { data: att } = await supabase.from('attendance').select('*').eq('student_id', user.user.id)
    if (att) {
       const todayAbsent = att.filter(a => a.date === today && a.status === 'absent')
       if (todayAbsent.length > 0) setAbsentToday(true)
       
       if (att.length > 0) {
         const presentCount = att.filter(a => a.status === 'present').length
         setAttendancePercentage(Math.round((presentCount / att.length) * 100))
       } else {
         setAttendancePercentage(100) // Default if no records
       }
    }

    setLoading(false)
  }

  const handleLogout = async () => { 
    setIsActionLoading(true)
    await supabase.auth.signOut(); 
    router.push('/login'); 
    setIsActionLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: '100px' }}>
      <ScreenLoader isLoading={loading} message="Loading your dashboard..." />
      <ScreenLoader isLoading={isActionLoading} message="Signing out..." />
      <header style={{ padding: '32px 20px', textAlign: 'center', position: 'relative' }}>
        <button onClick={handleLogout} style={{ position: 'absolute', top: '32px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} disabled={isActionLoading}><LogOut size={20} /></button>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-magenta))', margin: '0 auto 16px', border: '4px solid var(--bg-surface)', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold' }}>
           {studentProfile?.name ? studentProfile.name.charAt(0).toUpperCase() : 'S'}
        </div>
        <h1 style={{ fontSize: '24px' }}>Welcome, {studentProfile?.name || 'Student'}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>RIMTIFY Student Portal</p>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="over" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {absentToday && (
                <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--error)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <Bell color="var(--error)" />
                  <div>
                    <h4 style={{ color: 'var(--error)', margin: 0, fontSize: '16px' }}>Absent Alert!</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>You have been marked absent for a lecture today. Please contact your faculty if this is a mistake.</p>
                  </div>
                </div>
              )}
              <div className="glass-card" style={{ padding: '32px', textAlign: 'center', marginBottom: '32px' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Attendance Status</p>
                <h2 className="neon-text" style={{ fontSize: '48px', fontWeight: '800' }}>{attendancePercentage}%</h2>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginTop: '16px', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${attendancePercentage}%` }} style={{ height: '100%', background: 'linear-gradient(to right, var(--accent-cyan), var(--accent-purple))' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="responsive-grid">
                <QuickStat label="Pending Fees" value={`$${fees.filter(f => f.status === 'pending').reduce((acc, f) => acc + f.amount, 0)}`} icon={<Landmark size={20} color="var(--error)" />} />
                <QuickStat label="Books Issued" value={loans.filter(l => l.status === 'issued').length} icon={<Bookmark size={20} color="var(--accent-cyan)" />} />
              </div>
            </motion.div>
          )}

          {activeTab === 'results' && (
            <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}><Trophy color="var(--accent-magenta)" /> Exam Results</h2>
              <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                    <tr><th style={{ padding: '16px 24px', textAlign: 'left' }}>Course</th><th style={{ padding: '16px 24px', textAlign: 'left' }}>Exam</th><th style={{ padding: '16px 24px', textAlign: 'left' }}>Score</th></tr>
                  </thead>
                  <tbody>
                    {results.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '16px 24px' }}><p style={{ fontWeight: '600' }}>{r.courses.name}</p></td>
                        <td style={{ padding: '16px 24px', textTransform: 'capitalize' }}>{r.exam_type}</td>
                        <td style={{ padding: '16px 24px' }}><span style={{ color: 'var(--accent-cyan)', fontWeight: '700' }}>{r.marks}</span> / 100</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'finance' && (
            <motion.div key="finance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 style={{ marginBottom: '24px' }}>Fees & Payments</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {fees.map(f => (
                  <div key={f.id} className="glass-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '18px' }}>{f.title}</h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Due: {new Date(f.due_date).toLocaleDateString()}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>${f.amount}</p>
                      <span style={{ 
                        padding: '4px 12px', borderRadius: '50px', fontSize: '11px', fontWeight: '700',
                        background: f.status === 'paid' ? 'var(--success)20' : 'var(--error)20',
                        color: f.status === 'paid' ? 'var(--success)' : 'var(--error)'
                      }}>
                        {f.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'library' && (
            <motion.div key="library" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 style={{ marginBottom: '24px' }}>My Library Books</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loans.map(l => (
                  <div key={l.id} className="glass-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '18px' }}>{l.books?.title}</h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Author: {l.books?.author}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Due: {new Date(l.due_date).toLocaleDateString()}</p>
                      <span style={{ color: 'var(--accent-cyan)', fontSize: '11px', fontWeight: '700' }}>ISSUED</span>
                    </div>
                  </div>
                ))}
                {loans.length === 0 && <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No books currently issued.</div>}
              </div>
            </motion.div>
          )}

          {activeTab === 'courses' && (
            <motion.div key="courses" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 style={{ marginBottom: '24px' }}>Course Materials</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                 {materials.map(m => (
                   <div key={m.id} className="glass-card" style={{ padding: '24px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                       <FileText size={24} color="var(--accent-purple)" />
                       <div>
                         <h4 style={{ fontSize: '16px' }}>{m.title}</h4>
                         <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.subject}</p>
                       </div>
                     </div>
                     <a href={m.file_url} target="_blank" rel="noreferrer" className="btn-secondary" style={{ width: '100%', textAlign: 'center', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}><Download size={14}/> Download Note</a>
                   </div>
                 ))}
                 {materials.length === 0 && <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1/-1' }}>No course materials available.</div>}
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '40px' }}>
                  {studentProfile?.name?.charAt(0)}
                </div>
                <h2>{studentProfile?.name}</h2>
                <p style={{ color: 'var(--accent-cyan)', fontWeight: '600', marginTop: '4px' }}>{studentProfile?.roll_no}</p>
                
                <div style={{ marginTop: '40px', display: 'grid', gap: '16px', textAlign: 'left' }}>
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>DEPARTMENT</p>
                    <p style={{ fontWeight: '600' }}>{studentProfile?.department || 'Not Assigned'}</p>
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ROLE</p>
                    <p style={{ fontWeight: '600' }}>{studentProfile?.role?.toUpperCase()}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="glass-card" style={{ position: 'fixed', bottom: '20px', left: '20px', right: '20px', height: '70px', borderRadius: '25px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0 20px', zIndex: 100 }}>
        <NavItem icon={<PieChart size={22} />} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
        <NavItem icon={<Book size={22} />} active={activeTab === 'courses'} onClick={() => setActiveTab('courses')} />
        <NavItem icon={<Trophy size={22} />} active={activeTab === 'results'} onClick={() => setActiveTab('results')} />
        <NavItem icon={<Landmark size={22} />} active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} />
        <NavItem icon={<Bookmark size={22} />} active={activeTab === 'library'} onClick={() => setActiveTab('library')} />
        <NavItem icon={<User size={22} />} active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
      </nav>
    </div>
  )
}

const NavItem = ({ icon, active, onClick }: any) => (
  <div onClick={onClick} style={{ color: active ? 'var(--accent-cyan)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
    {icon}
    {active && <motion.div layoutId="nav-dot" style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-cyan)' }} />}
  </div>
)

const QuickStat = ({ label, value, icon }: any) => (
  <div className="glass-card" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
    <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)' }}>{icon}</div>
    <div><p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{label}</p><p style={{ fontSize: '16px', fontWeight: '700' }}>{value}</p></div>
  </div>
)

export default StudentDashboard
