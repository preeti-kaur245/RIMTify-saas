'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, UserPlus, LogOut, LayoutDashboard, Settings, Shield, 
  BookOpen, CreditCard, Search, Trash2, Edit3, Filter, 
  MoreVertical, Upload, FileText, Plus, X, Check, AlertTriangle, Book, Landmark, Bookmark, Bell, DollarSign, Megaphone, Loader2, TrendingUp, ArrowUpRight, Menu, Clock, Grid, List, ClipboardList, GraduationCap, Settings2, Laptop, Monitor, Layout, PlusSquare, UserCheck, UserX, CalendarDays, History
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import LoadingButton from '@/components/LoadingButton'
import ScreenLoader from '@/components/ScreenLoader'

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [users, setUsers] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  
  // University Hierarchy States
  const [departments, setDepartments] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [semesters, setSemesters] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [facultyAssignments, setFacultyAssignments] = useState<any[]>([])

  const [fees, setFees] = useState<any[]>([])
  const [books, setBooks] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [payrolls, setPayrolls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  const [showImportModal, setShowImportModal] = useState(false)
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [showBookModal, setShowBookModal] = useState(false)
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [showAnnounceModal, setShowAnnounceModal] = useState(false)
  const [showPayrollModal, setShowPayrollModal] = useState(false)

  const [importType, setImportType] = useState<'student' | 'teacher' | 'enrollment'>('student')
  const [csvData, setCsvData] = useState('')
  const [courseForm, setCourseForm] = useState({ name: '', code: '', department: 'Computer Applications' })
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', semester_id: '', type: 'core', credits: 1, is_practical: false, is_elective: false })
  const [assignmentForm, setAssignmentForm] = useState({ teacher_id: '', subject_id: '', section_id: '', type: 'primary' })
  const [enrollmentForm, setEnrollmentForm] = useState({ student_id: '', section_id: '', semester_id: '' })
  const [bookForm, setBookForm] = useState({ title: '', author: '', isbn: '', category: 'CS', total_copies: 1 })
  const [feeForm, setFeeForm] = useState({ student_id: '', title: '', amount: '', due_date: '' })
  const [announceForm, setAnnounceForm] = useState({ title: '', message: '', type: 'general', target_role: 'all' })
  const [payrollForm, setPayrollForm] = useState({ teacher_id: '', month: 'May', year: 2026, base_salary: '', bonus: '0', deductions: '0' })

  // Selection states for filtering hierarchy
  const [selDept, setSelDept] = useState('')
  const [selProg, setSelProg] = useState('')
  const [selSem, setSelSem] = useState('')
  const [selSec, setSelSec] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: u } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    const { data: c } = await supabase.from('courses').select('*')
    
    // Fetch hierarchy tables (with error fallback in case migration not applied yet)
    try {
      const [{data: d}, {data: p}, {data: s}, {data: sec}, {data: sub}, {data: fa}] = await Promise.all([
        supabase.from('departments').select('*'),
        supabase.from('programs').select('*'),
        supabase.from('semesters').select('*'),
        supabase.from('sections').select('*'),
        supabase.from('subjects').select('*'),
        supabase.from('faculty_assignments').select('*, profiles(name), subjects(name), sections(name)')
      ])
      if(d) setDepartments(d)
      if(p) setPrograms(p)
      if(s) setSemesters(s)
      if(sec) setSections(sec)
      if(sub) setSubjects(sub)
      if(fa) setFacultyAssignments(fa)
    } catch(e) { console.log('Hierarchy tables not yet available') }

    const { data: f } = await supabase.from('fees').select('*, profiles(name, roll_no)')
    const { data: b } = await supabase.from('books').select('*')
    const { data: a } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    const { data: pr } = await supabase.from('payroll').select('*, profiles(name)')
    
    if (u) setUsers(u)
    if (c) setCourses(c)
    if (f) setFees(f)
    if (b) setBooks(b)
    if (a) setAnnouncements(a)
    if (pr) setPayrolls(pr)
    setLoading(false)
  }

  // Statistics Calculation
  const stats = useMemo(() => {
    const students = users.filter(u => u.role === 'student').length
    const teachers = users.filter(u => u.role === 'teacher').length
    const pendingFeesAmount = fees.filter(f => f.status === 'pending').reduce((acc, f) => acc + parseFloat(f.amount), 0)
    const totalCourses = courses.length
    const activeAnnounce = announcements.length
    const libraryInventory = books.reduce((acc, b) => acc + b.total_copies, 0)
    
    return { students, teachers, pendingFeesAmount, totalCourses, activeAnnounce, libraryInventory }
  }, [users, fees, courses, announcements, books])

  const handleBulkImport = async () => {
    setProcessing(true)
    const lines = csvData.trim().split('\n')
    if (lines.length < 2) return
    const headers = lines[0].split(',').map(h => h.trim())
    const rows = lines.slice(1)

    for (const row of rows) {
      const values = row.split(',').map(v => v.trim())
      const data: any = {}
      headers.forEach((h, i) => data[h] = values[i])

      if (importType === 'student' || importType === 'teacher') {
        await supabase.from('profiles').upsert({
          name: data.name,
          roll_no: data.roll_no,
          department: data.department,
          role: importType
        }, { onConflict: 'roll_no' })
      } else if (importType === 'enrollment') {
        const { data: student } = await supabase.from('profiles').select('id').eq('roll_no', data.roll_no).single()
        const { data: course } = await supabase.from('courses').select('id').eq('code', data.course_code).single()
        if (student && course) {
          await supabase.from('enrollments').upsert({ student_id: student.id, course_id: course.id })
        }
      }
    }
    setProcessing(false); setShowImportModal(false); setCsvData(''); fetchData();
  }

  const handleAddCourse = async () => {
    setProcessing(true)
    await supabase.from('courses').insert([courseForm]);
    setShowCourseModal(false); 
    await fetchData();
    setProcessing(false)
  }
  const handleAddFee = async () => {
    setProcessing(true)
    await supabase.from('fees').insert([{ ...feeForm, status: 'pending' }]);
    setShowFeeModal(false); 
    await fetchData();
    setProcessing(false)
  }
  const handleAddBook = async () => {
    setProcessing(true)
    await supabase.from('books').insert([bookForm]);
    setShowBookModal(false); 
    await fetchData();
    setProcessing(false)
  }
  const handleAddAnnounce = async () => {
    setProcessing(true)
    await supabase.from('announcements').insert([announceForm]);
    setShowAnnounceModal(false); 
    await fetchData();
    setProcessing(false)
  }
  const handleAddSubject = async () => {
    setProcessing(true)
    await supabase.from('subjects').insert([subjectForm]);
    setShowCourseModal(false); 
    await fetchData();
    setProcessing(false)
  }
  const handleAddAssignment = async () => {
    setProcessing(true)
    await supabase.from('faculty_assignments').insert([assignmentForm]);
    setShowPayrollModal(false); 
    await fetchData();
    setProcessing(false)
  }
  const handleAddEnrollment = async () => {
    setProcessing(true)
    await supabase.from('student_enrollments').insert([enrollmentForm]);
    setShowCourseModal(false); 
    await fetchData();
    setProcessing(false)
  }
  const handleAddPayroll = async () => {
    setProcessing(true)
    const net = parseFloat(payrollForm.base_salary) + parseFloat(payrollForm.bonus) - parseFloat(payrollForm.deductions);
    await supabase.from('payroll').insert([{ ...payrollForm, net_salary: net, status: 'pending' }]);
    setShowPayrollModal(false); 
    await fetchData();
    setProcessing(false)
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login'); }
  const handleMarkFeePaid = async (id: any) => { 
    setProcessing(true)
    await supabase.from('fees').update({ status: 'paid', payment_date: new Date().toISOString() }).eq('id', id); 
    await fetchData(); 
    setProcessing(false)
  }
  const handleDelete = async (table: string, id: any) => { 
    if(confirm('Delete record?')) { 
      setProcessing(true)
      await supabase.from(table).delete().eq('id', id); 
      await fetchData(); 
      setProcessing(false)
    } 
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex' }}>
      <ScreenLoader isLoading={processing} />
      
      {/* Mobile Header */}
      <header className="mobile-only glass-card" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
        <h2 className="neon-text" style={{ fontSize: '20px', fontWeight: '800' }}>RIMTIFY</h2>
        <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
          <Menu size={24} />
        </button>
      </header>

      {/* Sidebar Overlay */}
      {isSidebarOpen && <div className="sidebar-overlay mobile-only" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`glass-card sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ padding: '0 16px' }}>
            <h2 className="neon-text" style={{ fontSize: '24px', fontWeight: '800' }}>RIMTIFY</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>ADMIN CONSOLE</p>
          </div>
          <button className="mobile-only" onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
        </div>
        <nav style={{ flex: 1, overflowY: 'auto' }}>
          <SidebarItem icon={<LayoutDashboard size={18} />} label="Overview" active={activeTab === 'overview'} onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<Users size={18} />} label="User Manager" active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<Grid size={18} />} label="Academic Structure" active={activeTab === 'hierarchy'} onClick={() => { setActiveTab('hierarchy'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<List size={18} />} label="Subject Manager" active={activeTab === 'subjects'} onClick={() => { setActiveTab('subjects'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<ClipboardList size={18} />} label="Faculty Assignment" active={activeTab === 'assignments'} onClick={() => { setActiveTab('assignments'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<GraduationCap size={18} />} label="Student Enrollment" active={activeTab === 'enrollment'} onClick={() => { setActiveTab('enrollment'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<ArrowUpRight size={18} />} label="Promotion Wizard" active={activeTab === 'promotion'} onClick={() => { setActiveTab('promotion'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<Landmark size={18} />} label="Finance" active={activeTab === 'finance'} onClick={() => { setActiveTab('finance'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<DollarSign size={18} />} label="Payroll" active={activeTab === 'payroll'} onClick={() => { setActiveTab('payroll'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<Bookmark size={18} />} label="Library" active={activeTab === 'library'} onClick={() => { setActiveTab('library'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<Megaphone size={18} />} label="Announce" active={activeTab === 'announce'} onClick={() => { setActiveTab('announce'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<Upload size={18} />} label="Import Center" active={activeTab === 'import'} onClick={() => { setActiveTab('import'); setIsSidebarOpen(false); }} />
        </nav>
        <button onClick={handleLogout} className="btn-secondary" style={{ width: '100%', marginTop: '20px' }}><LogOut size={18} /> Logout</button>
      </aside>

      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }} className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }} className="desktop-only">
          <div><h1 style={{ fontSize: '32px' }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1><p style={{ color: 'var(--text-muted)' }}>University Command Center</p></div>
          <div className="glass-card" style={{ padding: '12px 24px' }}>{loading ? <Loader2 className="animate-spin" /> : <Shield size={20} color="var(--accent-cyan)" />}</div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }} className="responsive-grid">
                  <StatCard label="Total Students" value={stats.students} icon={<Users color="var(--accent-purple)" />} color="var(--accent-purple)" />
                  <StatCard label="Active Teachers" value={stats.teachers} icon={<Shield color="var(--accent-cyan)" />} color="var(--accent-cyan)" />
                  <StatCard label="Pending Revenue" value={`$${stats.pendingFeesAmount}`} icon={<Landmark color="var(--error)" />} color="var(--error)" />
                  <StatCard label="Total Courses" value={stats.totalCourses} icon={<Book color="var(--accent-magenta)" />} color="var(--accent-magenta)" />
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }} className="responsive-grid">
                  <div className="glass-card" style={{ padding: '32px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3>Recent Admissions</h3>
                        <button onClick={() => setActiveTab('users')} className="neon-text" style={{ fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>View All <ArrowUpRight size={14} /></button>
                     </div>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {users.slice(0, 5).map(u => (
                          <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                               <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '1px solid var(--glass-border)' }}>{u.name[0]}</div>
                               <div><p style={{ fontWeight: '600' }}>{u.name}</p><p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.role.toUpperCase()} • {u.roll_no || 'N/A'}</p></div>
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</span>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                     <div className="glass-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), transparent)', borderLeft: '4px solid var(--accent-cyan)' }}>
                        <Bookmark size={32} color="var(--accent-cyan)" style={{ marginBottom: '16px' }} />
                        <h3>Library Catalog</h3>
                        <p style={{ fontSize: '28px', fontWeight: '800', marginTop: '8px' }}>{stats.libraryInventory}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total books registered</p>
                     </div>
                     <div className="glass-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.1), transparent)', borderLeft: '4px solid var(--accent-magenta)' }}>
                        <Megaphone size={32} color="var(--accent-magenta)" style={{ marginBottom: '16px' }} />
                        <h3>Broadcasting</h3>
                        <p style={{ fontSize: '28px', fontWeight: '800', marginTop: '8px' }}>{stats.activeAnnounce}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Live announcements</p>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ position: 'relative', flex: 1 }}><Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} /><input className="input-field" style={{ paddingLeft: '48px' }} placeholder="Search users..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
                <button onClick={() => { setImportType('student'); setShowImportModal(true); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Upload size={18} /> Bulk Students</button>
              </div>
              <div className="glass-card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}><th style={{ padding: '16px 24px' }}>Name</th><th style={{ padding: '16px 24px' }}>Role</th><th style={{ padding: '16px 24px' }}>Roll No</th><th style={{ padding: '16px 24px' }}>Actions</th></tr></thead>
                  <tbody>
                    {users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '16px 24px' }}>{u.name}</td>
                        <td style={{ padding: '16px 24px' }}>{u.role}</td>
                        <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>{u.roll_no}</td>
                        <td style={{ padding: '16px 24px' }}><button onClick={() => handleDelete('profiles', u.id)} style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'hierarchy' && (
            <motion.div key="hierarchy" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                 <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Academic Structure Builder</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Define your university's core hierarchy from Departments to Sections.</p>
                 </div>
                 <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => alert('New Department')}><Plus size={18} /> New Dept</button>
                    <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => alert('New Program')}><Plus size={18} /> New Program</button>
                 </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }} className="responsive-grid">
                 <div className="glass-card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Landmark size={18} color="var(--accent-cyan)" /> Departments</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       {departments.map(d => (
                          <div key={d.id} 
                               onClick={() => setSelDept(d.id)}
                               style={{ padding: '12px 16px', borderRadius: '12px', background: selDept === d.id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', border: '1px solid', borderColor: selDept === d.id ? 'var(--accent-cyan)' : 'transparent', transition: '0.2s' }}>
                             {d.name}
                          </div>
                       ))}
                    </div>
                 </div>
                 
                 <div className="glass-card" style={{ padding: '24px' }}>
                    {!selDept ? (
                       <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Select a department to view programs</div>
                    ) : (
                       <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                             <h3 style={{ fontSize: '18px' }}>Programs in {departments.find(d => d.id === selDept)?.name}</h3>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                             {programs.filter(p => p.department_id === selDept).map(p => (
                                <div key={p.id} className="glass-card" style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', position: 'relative' }}>
                                   <div style={{ position: 'absolute', top: '12px', right: '12px' }}><ArrowUpRight size={14} color="var(--text-muted)" /></div>
                                   <h4 style={{ fontWeight: '700', marginBottom: '4px' }}>{p.name}</h4>
                                   <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.duration_years} Years Duration</p>
                                   <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                                      <button style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'white' }}>View Semesters</button>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>
                    )}
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'subjects' && (
            <motion.div key="subjects" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                 <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Subject Management Panel</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Configure curriculum subjects, credits, and evaluation types.</p>
                 </div>
                 <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowCourseModal(true)}><Plus size={18} /> New Subject</button>
              </div>
              
              <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                 <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                       <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                          <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)' }}>SUBJECT NAME</th>
                          <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)' }}>CODE</th>
                          <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)' }}>TYPE</th>
                          <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)' }}>CREDITS</th>
                          <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)' }}>SEMESTER</th>
                          <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>ACTIONS</th>
                       </tr>
                    </thead>
                    <tbody>
                       {subjects.map(s => (
                          <tr key={s.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="hover-row">
                             <td style={{ padding: '16px 24px' }}>
                                <div style={{ fontWeight: '600' }}>{s.name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sequence: {s.sequence_order || 0}</div>
                             </td>
                             <td style={{ padding: '16px 24px' }}><code style={{ color: 'var(--accent-cyan)' }}>{s.code}</code></td>
                             <td style={{ padding: '16px 24px' }}>
                                <span style={{ padding: '4px 8px', borderRadius: '100px', fontSize: '10px', background: s.type === 'lab' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: s.type === 'lab' ? 'var(--error)' : 'var(--success)', textTransform: 'uppercase', fontWeight: '700' }}>{s.type}</span>
                             </td>
                             <td style={{ padding: '16px 24px', fontWeight: '700' }}>{s.credits || 1.0}</td>
                             <td style={{ padding: '16px 24px', fontSize: '13px' }}>Sem {semesters.find(sem => sem.id === s.semester_id)?.term_number || 'N/A'}</td>
                             <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                   <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Edit3 size={16} /></button>
                                   <button style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }} onClick={() => handleDelete('subjects', s.id)}><Trash2 size={16} /></button>
                                </div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'assignments' && (
            <motion.div key="assignments" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                 <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Faculty Assignment Dashboard</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Map teachers to subjects and specific class sections.</p>
                 </div>
                 <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowPayrollModal(true)}><Plus size={18} /> New Assignment</button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                 {facultyAssignments.map(a => (
                    <div key={a.id} className="glass-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                       <div style={{ position: 'absolute', top: 0, right: 0, padding: '8px 12px', background: 'rgba(255,255,255,0.05)', fontSize: '10px', fontWeight: '700', borderRadius: '0 0 0 12px', color: 'var(--accent-purple)' }}>{a.assignment_type?.toUpperCase() || 'PRIMARY'}</div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '18px' }}>
                             {a.profiles?.name?.[0]}
                          </div>
                          <div>
                             <h4 style={{ fontWeight: '700' }}>{a.profiles?.name}</h4>
                             <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Faculty Member</p>
                          </div>
                       </div>
                       
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                             <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Subject</span>
                             <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-cyan)' }}>{a.subjects?.name}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                             <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Section</span>
                             <span style={{ fontSize: '12px', fontWeight: '700' }}>Sec {a.sections?.name}</span>
                          </div>
                       </div>
                       
                       <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                          <button style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleDelete('faculty_assignments', a.id)}><Trash2 size={14} /> Remove</button>
                       </div>
                    </div>
                 ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'enrollment' && (
            <motion.div key="enrollment" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                 <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Student Enrollment Manager</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Handle student registrations and section allocations.</p>
                 </div>
                 <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => { setImportType('enrollment'); setShowImportModal(true); }}><Upload size={18} /> Bulk Enrollment</button>
                    <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowCourseModal(true)}><Plus size={18} /> Enroll Student</button>
                 </div>
              </div>
              
              <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                 <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', gap: '16px' }}>
                    <div style={{ position: 'relative', flex: 1 }}><Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} /><input className="input-field" placeholder="Filter by name or roll number..." style={{ paddingLeft: '40px', height: '40px' }} /></div>
                    <select className="input-field" style={{ width: '200px', height: '40px' }}><option>All Sections</option></select>
                 </div>
                 <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                       <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                          <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)' }}>STUDENT</th>
                          <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)' }}>ROLL NO</th>
                          <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)' }}>SECTION</th>
                          <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)' }}>SEMESTER</th>
                          <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>STATUS</th>
                       </tr>
                    </thead>
                    <tbody>
                       {/* This would be a joined list of student_enrollments */}
                       {users.filter(u => u.role === 'student').map(s => (
                          <tr key={s.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="hover-row">
                             <td style={{ padding: '16px 24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                   <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>{s.name[0]}</div>
                                   <div style={{ fontWeight: '600' }}>{s.name}</div>
                                </div>
                             </td>
                             <td style={{ padding: '16px 24px' }}><code style={{ color: 'var(--text-muted)' }}>{s.roll_no}</code></td>
                             <td style={{ padding: '16px 24px' }}>Section A</td>
                             <td style={{ padding: '16px 24px' }}>Sem 1</td>
                             <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                <span style={{ padding: '4px 8px', borderRadius: '100px', fontSize: '10px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', fontWeight: '700' }}>ACTIVE</span>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'promotion' && (
            <motion.div key="promotion" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ marginBottom: '32px' }}>
                 <h2>Semester Promotion Wizard</h2>
                 <p style={{ color: 'var(--text-muted)' }}>Easily migrate students from one semester to the next, archiving old records automatically.</p>
              </div>
              <div className="glass-card" style={{ padding: '32px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                 <TrendingUp size={48} color="var(--accent-cyan)" style={{ margin: '0 auto 24px' }} />
                 <h3 style={{ marginBottom: '24px' }}>Batch Promotion</h3>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left', marginBottom: '32px' }}>
                    <div>
                       <label style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>From Semester</label>
                       <select className="input-field" style={{ width: '100%', background: 'rgba(255,255,255,0.05)' }}>
                          <option value="">Select current semester...</option>
                          {semesters.map(s => <option key={s.id} value={s.id} style={{ background: '#1a1a1a' }}>Semester {s.term_number} ({s.academic_year})</option>)}
                       </select>
                    </div>
                    <div>
                       <label style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>To Semester (Destination)</label>
                       <select className="input-field" style={{ width: '100%', background: 'rgba(255,255,255,0.05)' }}>
                          <option value="">Select next semester...</option>
                          {semesters.map(s => <option key={s.id} value={s.id} style={{ background: '#1a1a1a' }}>Semester {s.term_number} ({s.academic_year})</option>)}
                       </select>
                    </div>
                 </div>
                 
                 <button className="btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))' }} onClick={() => alert('Promotion logic requires backend trigger. This UI is ready!')}>
                    <ArrowUpRight size={18} style={{ marginRight: '8px' }} /> Execute Promotion
                 </button>
                 <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px' }}><AlertTriangle size={12} color="var(--error)" style={{ display: 'inline', marginRight: '4px' }} /> Warning: This will finalize current semester grades and attendance.</p>
              </div>
            </motion.div>
          )}

          {activeTab === 'courses' && (
            <motion.div key="courses" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <button onClick={() => { setCourseForm({ name: '', code: '', department: 'CS' }); setShowCourseModal(true); }} className="btn-primary"><Plus size={18} /> Add Course</button>
                <button onClick={() => { setImportType('enrollment'); setShowImportModal(true); }} className="btn-secondary"><Upload size={18} /> Bulk Enroll</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {courses.map(c => (
                  <div key={c.id} className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><h3>{c.name}</h3><button onClick={() => handleDelete('courses', c.id)}><Trash2 size={16} color="var(--error)" /></button></div>
                    <p style={{ color: 'var(--accent-cyan)', fontWeight: '700' }}>{c.code}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'finance' && (
            <motion.div key="finance" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <button onClick={() => setShowFeeModal(true)} className="btn-primary" style={{ marginBottom: '24px' }}><Plus size={18} /> Assign Fee</button>
              <div className="glass-card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}><th style={{ padding: '16px 24px' }}>Student</th><th style={{ padding: '16px 24px' }}>Amount</th><th style={{ padding: '16px 24px' }}>Status</th><th style={{ padding: '16px 24px' }}>Actions</th></tr></thead>
                  <tbody>
                    {fees.map(f => (
                      <tr key={f.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '16px 24px' }}>{f.profiles?.name}</td>
                        <td style={{ padding: '16px 24px' }}>${f.amount}</td>
                        <td style={{ padding: '16px 24px' }}><span style={{ color: f.status === 'paid' ? 'var(--success)' : 'var(--error)' }}>{f.status.toUpperCase()}</span></td>
                        <td style={{ padding: '16px 24px' }}>
                          {f.status === 'pending' && (
                            <LoadingButton 
                              onClick={() => handleMarkFeePaid(f.id)} 
                              variant="secondary"
                              style={{ padding: '4px 12px', fontSize: '12px' }}
                            >
                              Mark Paid
                            </LoadingButton>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'import' && (
            <motion.div key="import" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                <FileText size={48} color="var(--accent-purple)" style={{ marginBottom: '24px' }} />
                <h2>Bulk Operations</h2>
                <p style={{ marginBottom: '32px', color: 'var(--text-muted)' }}>Paste your CSV data below to perform bulk actions.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <ImportCard label="Import Students" onClick={() => { setImportType('student'); setShowImportModal(true); }} />
                  <ImportCard label="Import Teachers" onClick={() => { setImportType('teacher'); setShowImportModal(true); }} />
                  <ImportCard label="Enroll in Courses" onClick={() => { setImportType('enrollment'); setShowImportModal(true); }} />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'library' && (
            <motion.div key="library" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <button onClick={() => { setBookForm({ title: '', author: '', isbn: '', category: 'CS', total_copies: 1 }); setShowBookModal(true); }} className="btn-primary" style={{ marginBottom: '24px' }}><Plus size={18} /> Add Book</button>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {books.map(b => (
                  <div key={b.id} className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><h3>{b.title}</h3><button onClick={() => handleDelete('books', b.id)}><Trash2 size={16} color="var(--error)" /></button></div>
                    <p style={{ color: 'var(--text-muted)' }}>{b.author}</p>
                    <p style={{ color: 'var(--accent-cyan)', fontWeight: '700', marginTop: '8px' }}>{b.total_copies} copies</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'announce' && (
            <motion.div key="announce" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <button onClick={() => { setAnnounceForm({ title: '', message: '', type: 'general', target_role: 'all' }); setShowAnnounceModal(true); }} className="btn-primary" style={{ marginBottom: '24px' }}><Plus size={18} /> New Announcement</button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {announcements.map(a => (
                  <div key={a.id} className="glass-card" style={{ padding: '24px', borderLeft: `4px solid ${a.type === 'urgent' ? 'var(--error)' : 'var(--accent-cyan)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <h3>{a.title}</h3>
                      <button onClick={() => handleDelete('announcements', a.id)}><Trash2 size={16} color="var(--error)" /></button>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>{a.message}</p>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px', display: 'block' }}>Target: {a.target_role.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'payroll' && (
            <motion.div key="payroll" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <button onClick={() => { setPayrollForm({ teacher_id: '', month: 'May', year: 2026, base_salary: '', bonus: '0', deductions: '0' }); setShowPayrollModal(true); }} className="btn-primary" style={{ marginBottom: '24px' }}><Plus size={18} /> Add Payroll Record</button>
              <div className="glass-card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}><th style={{ padding: '16px 24px' }}>Teacher</th><th style={{ padding: '16px 24px' }}>Month/Year</th><th style={{ padding: '16px 24px' }}>Net Salary</th><th style={{ padding: '16px 24px' }}>Status</th></tr></thead>
                  <tbody>
                    {payrolls.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '16px 24px' }}>{p.profiles?.name}</td>
                        <td style={{ padding: '16px 24px' }}>{p.month} {p.year}</td>
                        <td style={{ padding: '16px 24px' }}>${p.net_salary}</td>
                        <td style={{ padding: '16px 24px' }}><span style={{ color: p.status === 'paid' ? 'var(--success)' : 'var(--error)' }}>{p.status.toUpperCase()}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {showCourseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card" style={{ width: '100%', maxWidth: '450px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{activeTab === 'subjects' ? 'Configure Subject' : activeTab === 'enrollment' ? 'Register Student' : 'Add Course'}</h3>
              <button onClick={() => setShowCourseModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            {activeTab === 'subjects' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 <div><label style={{fontSize:'12px', color:'var(--text-muted)'}}>Name</label><input className="input-field" placeholder="e.g. Artificial Intelligence" value={subjectForm.name} onChange={e => setSubjectForm({...subjectForm, name: e.target.value})} /></div>
                 <div><label style={{fontSize:'12px', color:'var(--text-muted)'}}>Code</label><input className="input-field" placeholder="e.g. AI-201" value={subjectForm.code} onChange={e => setSubjectForm({...subjectForm, code: e.target.value})} /></div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                       <label style={{fontSize:'12px', color:'var(--text-muted)'}}>Type</label>
                       <select className="input-field" value={subjectForm.type} onChange={e => setSubjectForm({...subjectForm, type: e.target.value})} style={{background:'rgba(255,255,255,0.05)'}}>
                          <option value="core" style={{background:'#1a1a1a'}}>Core Theory</option>
                          <option value="lab" style={{background:'#1a1a1a'}}>Practical/Lab</option>
                          <option value="elective" style={{background:'#1a1a1a'}}>Elective</option>
                       </select>
                    </div>
                    <div>
                       <label style={{fontSize:'12px', color:'var(--text-muted)'}}>Credits</label>
                       <input type="number" className="input-field" value={subjectForm.credits} onChange={e => setSubjectForm({...subjectForm, credits: parseFloat(e.target.value)})} />
                    </div>
                 </div>
                 <select className="input-field" value={subjectForm.semester_id} onChange={e => setSubjectForm({...subjectForm, semester_id: e.target.value})} style={{background:'rgba(255,255,255,0.05)'}}>
                    <option value="">Select Target Semester</option>
                    {semesters.map(s => <option key={s.id} value={s.id} style={{background:'#1a1a1a'}}>Sem {s.term_number} ({s.academic_year})</option>)}
                 </select>
                 <LoadingButton onClick={handleAddSubject} loading={processing} style={{ width: '100%', marginTop: '8px' }}>Save Subject</LoadingButton>
              </div>
            ) : activeTab === 'enrollment' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 <select className="input-field" value={enrollmentForm.student_id} onChange={e => setEnrollmentForm({...enrollmentForm, student_id: e.target.value})} style={{background:'rgba(255,255,255,0.05)'}}>
                    <option value="">Select Student</option>
                    {users.filter(u => u.role === 'student').map(s => <option key={s.id} value={s.id} style={{background:'#1a1a1a'}}>{s.name} ({s.roll_no})</option>)}
                 </select>
                 <select className="input-field" value={enrollmentForm.section_id} onChange={e => setEnrollmentForm({...enrollmentForm, section_id: e.target.value})} style={{background:'rgba(255,255,255,0.05)'}}>
                    <option value="">Select Section</option>
                    {sections.map(sec => <option key={sec.id} value={sec.id} style={{background:'#1a1a1a'}}>{sec.name} (Sem {semesters.find(s => s.id === sec.semester_id)?.term_number})</option>)}
                 </select>
                 <LoadingButton onClick={handleAddEnrollment} loading={processing} style={{ width: '100%', marginTop: '8px' }}>Enroll Student</LoadingButton>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 <input className="input-field" placeholder="Course Name" value={courseForm.name} onChange={e => setCourseForm({...courseForm, name: e.target.value})} />
                 <input className="input-field" placeholder="Course Code" value={courseForm.code} onChange={e => setCourseForm({...courseForm, code: e.target.value})} />
                 <LoadingButton onClick={handleAddCourse} loading={processing} style={{ width: '100%', marginTop: '8px' }}>Add Course</LoadingButton>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {showPayrollModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card" style={{ width: '100%', maxWidth: '450px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{activeTab === 'assignments' ? 'Assign Faculty' : 'New Payroll Record'}</h3>
              <button onClick={() => setShowPayrollModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            {activeTab === 'assignments' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 <select className="input-field" value={assignmentForm.teacher_id} onChange={e => setAssignmentForm({...assignmentForm, teacher_id: e.target.value})} style={{background:'rgba(255,255,255,0.05)'}}>
                    <option value="">Select Teacher</option>
                    {users.filter(u => u.role === 'teacher').map(t => <option key={t.id} value={t.id} style={{background:'#1a1a1a'}}>{t.name}</option>)}
                 </select>
                 <select className="input-field" value={assignmentForm.subject_id} onChange={e => setAssignmentForm({...assignmentForm, subject_id: e.target.value})} style={{background:'rgba(255,255,255,0.05)'}}>
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id} style={{background:'#1a1a1a'}}>{s.name} ({s.code})</option>)}
                 </select>
                 <select className="input-field" value={assignmentForm.section_id} onChange={e => setAssignmentForm({...assignmentForm, section_id: e.target.value})} style={{background:'rgba(255,255,255,0.05)'}}>
                    <option value="">Select Section</option>
                    {sections.map(sec => <option key={sec.id} value={sec.id} style={{background:'#1a1a1a'}}>Sec {sec.name}</option>)}
                 </select>
                 <select className="input-field" value={assignmentForm.type} onChange={e => setAssignmentForm({...assignmentForm, type: e.target.value})} style={{background:'rgba(255,255,255,0.05)'}}>
                    <option value="primary">Primary Teacher</option>
                    <option value="co-faculty">Co-Faculty</option>
                    <option value="substitute">Substitute</option>
                    <option value="lab">Lab Faculty</option>
                 </select>
                 <LoadingButton onClick={handleAddAssignment} loading={processing} style={{ width: '100%', marginTop: '8px' }}>Assign Faculty</LoadingButton>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 <select className="input-field" value={payrollForm.teacher_id} onChange={e => setPayrollForm({...payrollForm, teacher_id: e.target.value})} style={{background:'rgba(255,255,255,0.05)'}}>
                    <option value="">Select Teacher</option>
                    {users.filter(u => u.role === 'teacher').map(t => <option key={t.id} value={t.id} style={{background:'#1a1a1a'}}>{t.name}</option>)}
                 </select>
                 <input type="number" className="input-field" placeholder="Base Salary" value={payrollForm.base_salary} onChange={e => setPayrollForm({...payrollForm, base_salary: e.target.value})} />
                 <input type="number" className="input-field" placeholder="Bonus" value={payrollForm.bonus} onChange={e => setPayrollForm({...payrollForm, bonus: e.target.value})} />
                 <LoadingButton onClick={handleAddPayroll} loading={processing} style={{ width: '100%', marginTop: '8px' }}>Save Record</LoadingButton>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {showFeeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><h3>Assign Fee</h3><button onClick={() => setShowFeeModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button></div>
            <select className="input-field" value={feeForm.student_id} onChange={e => setFeeForm({...feeForm, student_id: e.target.value})} style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.05)' }}>
              <option value="" disabled style={{background: '#1a1a1a'}}>Select Student</option>
              {users.filter(u => u.role === 'student').map(u => <option key={u.id} value={u.id} style={{background: '#1a1a1a'}}>{u.name}</option>)}
            </select>
            <input className="input-field" placeholder="Fee Title" value={feeForm.title} onChange={e => setFeeForm({...feeForm, title: e.target.value})} style={{ marginBottom: '16px' }} />
            <input type="number" className="input-field" placeholder="Amount" value={feeForm.amount} onChange={e => setFeeForm({...feeForm, amount: e.target.value})} style={{ marginBottom: '16px' }} />
            <input type="date" className="input-field" value={feeForm.due_date} onChange={e => setFeeForm({...feeForm, due_date: e.target.value})} style={{ marginBottom: '16px' }} />
            <LoadingButton onClick={handleAddFee} loading={processing} style={{ width: '100%' }}>Assign Fee</LoadingButton>
          </motion.div>
        </div>
      )}

      {showBookModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><h3>Add Book</h3><button onClick={() => setShowBookModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button></div>
            <input className="input-field" placeholder="Book Title" value={bookForm.title} onChange={e => setBookForm({...bookForm, title: e.target.value})} style={{ marginBottom: '16px' }} />
            <input className="input-field" placeholder="Author" value={bookForm.author} onChange={e => setBookForm({...bookForm, author: e.target.value})} style={{ marginBottom: '16px' }} />
            <input type="number" className="input-field" placeholder="Total Copies" value={bookForm.total_copies} onChange={e => setBookForm({...bookForm, total_copies: parseInt(e.target.value)})} style={{ marginBottom: '16px' }} />
            <LoadingButton onClick={handleAddBook} loading={processing} style={{ width: '100%' }}>Save Book</LoadingButton>
          </motion.div>
        </div>
      )}

      {showAnnounceModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><h3>New Announcement</h3><button onClick={() => setShowAnnounceModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button></div>
            <input className="input-field" placeholder="Title" value={announceForm.title} onChange={e => setAnnounceForm({...announceForm, title: e.target.value})} style={{ marginBottom: '16px' }} />
            <textarea className="input-field" placeholder="Message" value={announceForm.message} onChange={e => setAnnounceForm({...announceForm, message: e.target.value})} style={{ marginBottom: '16px', minHeight: '80px' }} />
            <select className="input-field" value={announceForm.type} onChange={e => setAnnounceForm({...announceForm, type: e.target.value})} style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.05)' }}>
              <option value="general" style={{background: '#1a1a1a'}}>General</option>
              <option value="urgent" style={{background: '#1a1a1a'}}>Urgent</option>
              <option value="event" style={{background: '#1a1a1a'}}>Event</option>
            </select>
            <select className="input-field" value={announceForm.target_role} onChange={e => setAnnounceForm({...announceForm, target_role: e.target.value})} style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.05)' }}>
              <option value="all" style={{background: '#1a1a1a'}}>All Users</option>
              <option value="student" style={{background: '#1a1a1a'}}>Students Only</option>
              <option value="teacher" style={{background: '#1a1a1a'}}>Teachers Only</option>
            </select>
            <LoadingButton onClick={handleAddAnnounce} loading={processing} style={{ width: '100%' }}>Broadcast</LoadingButton>
          </motion.div>
        </div>
      )}

      {showImportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card" style={{ width: '100%', maxWidth: '600px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>{importType === 'enrollment' ? 'Bulk Course Enrollment' : `Bulk Import ${importType}s`}</h3>
              <button onClick={() => setShowImportModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <textarea className="input-field" rows={8} style={{ marginBottom: '24px', fontFamily: 'monospace' }} value={csvData} onChange={e => setCsvData(e.target.value)} placeholder="name, roll_no, department" />
            <LoadingButton onClick={handleBulkImport} loading={processing} style={{ width: '100%' }}>Execute Bulk Action</LoadingButton>
          </motion.div>
        </div>
      )}
    </div>
  )
}

const SidebarItem = ({ icon, label, active, onClick }: any) => (
  <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', cursor: 'pointer', marginBottom: '4px', background: active ? 'rgba(255, 255, 255, 0.05)' : 'transparent', color: active ? 'var(--text-primary)' : 'var(--text-secondary)', border: active ? '1px solid var(--glass-border)' : '1px solid transparent', transition: '0.2s' }}>{icon}<span style={{ fontWeight: active ? '600' : '400', fontSize: '14px' }}>{label}</span></div>
)
const StatCard = ({ label, value, icon, color }: any) => (
  <div className="glass-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: color }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div><p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800' }}>{label.toUpperCase()}</p><h2 style={{ fontSize: '32px', marginTop: '8px' }}>{value}</h2></div>
      <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)' }}>{icon}</div>
    </div>
  </div>
)
const ImportCard = ({ label, onClick }: any) => (
  <div onClick={onClick} className="glass-card" style={{ padding: '24px', cursor: 'pointer', textAlign: 'center', border: '1px solid var(--glass-border)', transition: '0.2s' }}><Plus size={24} style={{ marginBottom: '12px', color: 'var(--accent-cyan)' }} /><p style={{ fontWeight: '600', fontSize: '14px' }}>{label}</p></div>
)

export default AdminDashboard
