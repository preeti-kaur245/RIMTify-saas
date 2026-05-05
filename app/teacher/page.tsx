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
  const [history, setHistory] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [materialForm, setMaterialForm] = useState({ title: '', file_url: '', file_type: 'pdf' })
  const [teacherProfile, setTeacherProfile] = useState<any>(null)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        await Promise.all([
          fetchInitialData(),
          fetchCourses(),
          fetchAnnouncements(),
          fetchPayroll(),
          fetchStudents(),
          fetchMaterials()
        ])
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const fetchInitialData = async () => {
    const { data: user } = await supabase.auth.getUser()
    if (user?.user) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.user.id).single()
      if (profile) setTeacherProfile(profile)

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

  const fetchStudents = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'student').order('roll_no', { ascending: true })
    if (data) {
      setStudents(data)
      const initialAttendance: Record<string, any> = {}
      data.forEach(s => initialAttendance[s.id] = 'present')
      setAttendanceRecords(initialAttendance)
    }
  }

  const fetchMaterials = async () => {
    const { data: user } = await supabase.auth.getUser()
    if (!user?.user) return
    const { data } = await supabase.from('materials').select('*').eq('teacher_id', user.user.id).order('created_at', { ascending: false })
    if (data) setMaterials(data)
  }

  const handleSaveAttendance = async () => {
    setSaving(true)
    const { data: user } = await supabase.auth.getUser()
    if (!user?.user || !selectedCourse) return
    
    const records = students.map(s => ({
      student_id: s.id,
      teacher_id: user.user.id,
      subject: selectedCourse.name,
      date: selectedDate,
      session_no: selectedSession,
      status: attendanceRecords[s.id] || 'present'
    }))
    
    await supabase.from('attendance').insert(records)
    setMessage({ text: 'Attendance saved successfully', type: 'success' })
    fetchInitialData()
    setSaving(false)
    setTimeout(() => setMessage({ text: '', type: '' }), 3000)
  }

  const handleUploadMaterial = async () => {
    if (!materialForm.title || !materialForm.file_url || !selectedCourse) return
    const { data: user } = await supabase.auth.getUser()
    if (!user?.user) return

    await supabase.from('materials').insert([{
      teacher_id: user.user.id,
      subject: selectedCourse.name,
      title: materialForm.title,
      file_url: materialForm.file_url,
      file_type: materialForm.file_type
    }])
    setMaterialForm({ title: '', file_url: '', file_type: 'pdf' })
    fetchMaterials()
  }

  const handleSaveGrades = async () => {
    setSaving(true)
    const { data: user } = await supabase.auth.getUser()
    if (!user?.user || !selectedCourse) return

    const records = Object.entries(gradeRecords).map(([studentId, data]) => ({
      student_id: studentId,
      course_id: selectedCourse.id,
      teacher_id: user.user.id,
      exam_type: examType,
      marks: parseFloat(data.marks),
      remarks: data.remarks
    }))

    if (records.length === 0) {
      setSaving(false)
      return
    }

    const { error } = await supabase.from('grades').upsert(records, { 
      onConflict: 'student_id,course_id,exam_type' 
    })

    if (error) {
      setMessage({ text: 'Error saving grades: ' + error.message, type: 'error' })
    } else {
      setMessage({ text: 'Grades saved successfully!', type: 'success' })
    }
    setSaving(false)
    setTimeout(() => setMessage({ text: '', type: '' }), 3000)
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login'); }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex' }}>
      
      <aside className="glass-card" style={{ width: '280px', borderRadius: '0 32px 32px 0', padding: '32px 16px', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ padding: '0 16px', marginBottom: '40px' }}><h2 className="neon-text" style={{ fontSize: '24px', fontWeight: '800' }}>FACULTY</h2></div>
        <nav style={{ flex: 1, overflowY: 'auto' }}>
          <SidebarItem icon={<CheckCircle size={18} />} label="Attendance" active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} />
          <SidebarItem icon={<Book size={18} />} label="Materials" active={activeTab === 'materials'} onClick={() => setActiveTab('materials')} />
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
          {loading ? (
             <motion.div 
               key="loader"
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}
             >
                <div style={{ position: 'relative' }}>
                   <div className="animate-spin" style={{ width: '60px', height: '60px', border: '4px solid rgba(139, 92, 246, 0.1)', borderTop: '4px solid var(--accent-purple)', borderRadius: '50%' }}></div>
                   <div className="animate-spin" style={{ position: 'absolute', top: '10px', left: '10px', width: '40px', height: '40px', border: '4px solid rgba(6, 182, 212, 0.1)', borderTop: '4px solid var(--accent-cyan)', borderRadius: '50%', animationDirection: 'reverse' }}></div>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', letterSpacing: '2px' }}>LOADING DATA</p>
             </motion.div>
          ) : (
            <div key="content">
          {activeTab === 'attendance' && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 style={{ marginBottom: '24px' }}>Welcome, {teacherProfile?.name || 'Prof.'}</h1>
                <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid var(--accent-purple)', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}><Megaphone size={20} color="var(--accent-purple)" /> <h3 style={{ fontSize: '18px' }}>Latest Announcement</h3></div>
                  {announcements.length > 0 ? (
                    <div>
                      <p style={{ fontWeight: '600', marginBottom: '4px' }}>{announcements[0].title}</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{announcements[0].message}</p>
                    </div>
                  ) : <p style={{ color: 'var(--text-muted)' }}>No recent announcements.</p>}
                </div>
                {message.text && (
                  <div style={{ padding: '12px 16px', background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', borderLeft: `4px solid ${message.type === 'error' ? 'var(--error)' : 'var(--success)'}`, marginBottom: '24px', borderRadius: '4px', color: message.type === 'error' ? 'var(--error)' : 'var(--success)' }}>
                    {message.text}
                  </div>
                )}
                <div className="glass-card" style={{ padding: '24px', marginBottom: '32px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    <div>
                      <label style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Select Course</label>
                      <select 
                        className="input-field" 
                        value={selectedCourse?.id} 
                        onChange={(e) => setSelectedCourse(courses.find(c => c.id === e.target.value))}
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
                      >
                        {courses.map(c => <option key={c.id} value={c.id} style={{background: '#1a1a1a'}}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Date</label>
                      <input type="date" className="input-field" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Session</label>
                      <select className="input-field" value={selectedSession} onChange={(e) => setSelectedSession(Number(e.target.value))}>
                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s} style={{background: '#1a1a1a'}}>Session {s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '32px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                     <h3>Student Roster ({students.length})</h3>
                     <button className="btn-primary" onClick={handleSaveAttendance} disabled={saving}>{saving ? 'Saving...' : 'Save Attendance'}</button>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                     <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <tr>
                           <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--text-muted)', fontSize: '12px' }}>STUDENT NAME</th>
                           <th style={{ textAlign: 'center', padding: '16px 24px', color: 'var(--text-muted)', fontSize: '12px' }}>STATUS</th>
                        </tr>
                     </thead>
                     <tbody>
                        {students.map(s => (
                           <tr key={s.id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                              <td style={{ padding: '16px 24px' }}><p style={{ fontWeight: '600' }}>{s.name}</p><p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.roll_no}</p></td>
                              <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                 <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', borderRadius: '50px', padding: '4px' }}>
                                    <button onClick={() => setAttendanceRecords({...attendanceRecords, [s.id]: 'present'})} style={{ padding: '6px 16px', borderRadius: '50px', border: 'none', background: attendanceRecords[s.id] === 'present' ? 'var(--success)' : 'transparent', color: attendanceRecords[s.id] === 'present' ? 'white' : 'var(--text-muted)', cursor: 'pointer', transition: '0.2s', fontSize: '12px', fontWeight: '600' }}>PRESENT</button>
                                    <button onClick={() => setAttendanceRecords({...attendanceRecords, [s.id]: 'absent'})} style={{ padding: '6px 16px', borderRadius: '50px', border: 'none', background: attendanceRecords[s.id] === 'absent' ? 'var(--error)' : 'transparent', color: attendanceRecords[s.id] === 'absent' ? 'white' : 'var(--text-muted)', cursor: 'pointer', transition: '0.2s', fontSize: '12px', fontWeight: '600' }}>ABSENT</button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
                </div>
             </motion.div>
          )}

          {activeTab === 'materials' && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
               <h2 style={{ marginBottom: '24px' }}>Course Materials & Notes</h2>
               <div className="glass-card" style={{ padding: '24px', marginBottom: '32px' }}>
                 <h3>Upload New Material</h3>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
                   <select className="input-field" value={selectedCourse?.id} onChange={(e) => setSelectedCourse(courses.find(c => c.id === e.target.value))} style={{ background: 'rgba(255,255,255,0.05)' }}>
                     {courses.map(c => <option key={c.id} value={c.id} style={{background: '#1a1a1a'}}>{c.name}</option>)}
                   </select>
                   <input className="input-field" placeholder="Title (e.g. Chapter 1 Notes)" value={materialForm.title} onChange={e => setMaterialForm({...materialForm, title: e.target.value})} />
                   <input className="input-field" placeholder="File URL or Link" value={materialForm.file_url} onChange={e => setMaterialForm({...materialForm, file_url: e.target.value})} />
                   <select className="input-field" value={materialForm.file_type} onChange={(e) => setMaterialForm({...materialForm, file_type: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)' }}>
                     <option value="pdf" style={{background: '#1a1a1a'}}>PDF Document</option>
                     <option value="note" style={{background: '#1a1a1a'}}>Text Note</option>
                     <option value="link" style={{background: '#1a1a1a'}}>External Link</option>
                   </select>
                   <button className="btn-primary" onClick={handleUploadMaterial}><Upload size={18} /> Upload</button>
                 </div>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                 {materials.map(m => (
                   <div key={m.id} className="glass-card" style={{ padding: '24px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                       <FileText size={24} color="var(--accent-cyan)" />
                       <div>
                         <h4 style={{ fontSize: '16px' }}>{m.title}</h4>
                         <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.subject}</p>
                       </div>
                     </div>
                     <a href={m.file_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-purple)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}><LinkIcon size={14}/> View Resource</a>
                   </div>
                 ))}
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

          {activeTab === 'history' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                  <h2 style={{ fontSize: '28px' }}>Session History</h2>
                  <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                     {history.length} Total Sessions
                  </div>
               </div>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                 {history.map((h, i) => (
                    <div key={i} className="glass-card" style={{ padding: '24px', transition: '0.3s', cursor: 'pointer' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                          <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             <Calendar size={22} color="var(--accent-cyan)" />
                          </div>
                          <div>
                             <p style={{ fontWeight: '700', fontSize: '18px' }}>{h.date}</p>
                             <p style={{ fontSize: '13px', color: 'var(--accent-purple)', fontWeight: '600' }}>Session #{h.session_no}</p>
                          </div>
                       </div>
                       <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                             <FileText size={12} /> LECTURE NOTE
                          </p>
                          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                             {h.lecture_note || 'No notes provided for this session.'}
                          </p>
                       </div>
                    </div>
                 ))}
                 {history.length === 0 && (
                    <div className="glass-card" style={{ padding: '60px', textAlign: 'center', gridColumn: '1/-1' }}>
                       <History size={48} color="var(--text-muted)" style={{ marginBottom: '16px', opacity: 0.3 }} />
                       <p style={{ color: 'var(--text-muted)' }}>You haven't recorded any attendance yet.</p>
                    </div>
                 )}
               </div>
            </motion.div>
          )}

          {activeTab === 'students' && (
             <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                <h2 style={{ marginBottom: '24px' }}>Student Directory</h2>
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                   <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                         <tr>
                            <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>STUDENT NAME</th>
                            <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>ROLL NUMBER</th>
                            <th style={{ textAlign: 'right', padding: '16px 24px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>ACTIONS</th>
                         </tr>
                      </thead>
                      <tbody>
                         {students.length > 0 ? students.map(s => (
                            <tr key={s.id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                               <td style={{ padding: '16px 24px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ width: '32px', height: '32px', background: 'var(--accent-purple)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>{s.name?.charAt(0)}</div> {s.name}</div></td>
                               <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{s.roll_no}</td>
                               <td style={{ padding: '16px 24px', textAlign: 'right' }}><button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>Profile</button></td>
                            </tr>
                         )) : (
                            <tr><td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No students found in the database.</td></tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </motion.div>
          )}

          {activeTab === 'grades' && (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                   <h2 style={{ fontSize: '28px' }}>Grade Management</h2>
                   <div style={{ display: 'flex', gap: '12px' }}>
                      <select className="input-field" style={{ width: '150px' }} value={examType} onChange={(e) => setExamType(e.target.value)}>
                         <option value="internal">Internal</option>
                         <option value="midterm">Midterm</option>
                         <option value="final">Final Exam</option>
                      </select>
                      <button className="btn-primary" onClick={handleSaveGrades} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Save All</button>
                   </div>
                </div>
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                   <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                         <tr>
                            <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--text-muted)', fontSize: '12px' }}>STUDENT</th>
                            <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--text-muted)', fontSize: '12px' }}>MARKS (100)</th>
                            <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--text-muted)', fontSize: '12px' }}>REMARKS</th>
                         </tr>
                      </thead>
                      <tbody>
                         {students.map(s => (
                            <tr key={s.id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                               <td style={{ padding: '16px 24px' }}>
                                  <p style={{ fontWeight: '600' }}>{s.name}</p>
                                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.roll_no}</p>
                               </td>
                               <td style={{ padding: '16px 24px' }}>
                                  <input 
                                    type="number" 
                                    className="input-field" 
                                    style={{ width: '80px', padding: '8px' }} 
                                    placeholder="--" 
                                    value={gradeRecords[s.id]?.marks || ''}
                                    onChange={(e) => setGradeRecords({...gradeRecords, [s.id]: { ...gradeRecords[s.id], marks: e.target.value }})}
                                  />
                               </td>
                               <td style={{ padding: '16px 24px' }}>
                                  <input 
                                    type="text" 
                                    className="input-field" 
                                    style={{ padding: '8px' }} 
                                    placeholder="Performance feedback..." 
                                    value={gradeRecords[s.id]?.remarks || ''}
                                    onChange={(e) => setGradeRecords({...gradeRecords, [s.id]: { ...gradeRecords[s.id], remarks: e.target.value }})}
                                  />
                               </td>
                            </tr>
                         ))}
                         {students.length === 0 && <tr><td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Load students to manage grades.</td></tr>}
                      </tbody>
                   </table>
                </div>
             </motion.div>
          )}
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

const SidebarItem = ({ icon, label, active, onClick }: any) => (
  <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', cursor: 'pointer', marginBottom: '4px', background: active ? 'rgba(255, 255, 255, 0.05)' : 'transparent', color: active ? 'var(--text-primary)' : 'var(--text-secondary)', border: active ? '1px solid var(--glass-border)' : '1px solid transparent', transition: '0.2s' }}>{icon}<span style={{ fontWeight: active ? '600' : '400', fontSize: '14px' }}>{label}</span></div>
)

export default TeacherDashboard
