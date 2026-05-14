'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, UserPlus, LogOut, LayoutDashboard, Settings, Shield, 
  BookOpen, CreditCard, Search, Trash2, Edit3, Filter, 
  MoreVertical, Upload, FileText, Plus, X, Check, AlertTriangle, Book, Landmark, Bookmark, Bell, DollarSign, Megaphone, Loader2, TrendingUp, ArrowUpRight, Menu, Clock, Link as LinkIcon, AlertCircle
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import LoadingButton from '@/components/LoadingButton'
import ScreenLoader from '@/components/ScreenLoader'

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [users, setUsers] = useState<any[]>([])
  
  // Advanced Academic State
  const [departments, setDepartments] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [semesters, setSemesters] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [subjectAllocations, setSubjectAllocations] = useState<any[]>([])
  const [facultyAssignments, setFacultyAssignments] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  

  const [fees, setFees] = useState<any[]>([])
  const [books, setBooks] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [payrolls, setPayrolls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  const [showImportModal, setShowImportModal] = useState(false)
  const [showHierarchyModal, setShowHierarchyModal] = useState(false)
  const [showSubjectModal, setShowSubjectModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [showBookModal, setShowBookModal] = useState(false)
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [showAnnounceModal, setShowAnnounceModal] = useState(false)
  const [showPayrollModal, setShowPayrollModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])

  const [hierarchyForm, setHierarchyForm] = useState({ type: 'department', name: '', parent_id: '', code: '' })
  const [subForm, setSubForm] = useState({ name: '', code: '', type: 'theory', credits: 3, semester_id: '', is_elective: false })
  const [assignForm, setAssignForm] = useState({ teacher_id: '', subject_id: '', section_id: '' })
  
  const [importType, setImportType] = useState<'student' | 'teacher' | 'enrollment' | 'subject'>('student')
  const [csvData, setCsvData] = useState('')
  const [courseForm, setCourseForm] = useState({ name: '', code: '', department: 'Computer Science' })
  const [bookForm, setBookForm] = useState({ title: '', author: '', isbn: '', category: 'CS', total_copies: 1 })
  const [feeForm, setFeeForm] = useState({ student_id: '', title: '', amount: '', due_date: '' })
  const [announceForm, setAnnounceForm] = useState({ title: '', message: '', type: 'general', target_role: 'all' })
  const [payrollForm, setPayrollForm] = useState({ teacher_id: '', month: 'May', year: 2026, base_salary: '', bonus: '0', deductions: '0' })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: u } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    const { data: c } = await supabase.from('courses').select('*')
    
    try {
      const [{data: d}, {data: p}, {data: s}, {data: sec}, {data: sub}, {data: fa}, {data: alloc}] = await Promise.all([
        supabase.from('departments').select('*'),
        supabase.from('programs').select('*'),
        supabase.from('semesters').select('*'),
        supabase.from('sections').select('*'),
        supabase.from('subjects').select('*').order('order_sequence', { ascending: true }),
        supabase.from('faculty_assignments').select('*, profiles(name), subjects(name), sections(name)'),
        supabase.from('section_subject_allocations').select('*, subjects(*), sections(*)')
      ])
      if(d) setDepartments(d)
      if(p) setPrograms(p)
      if(s) setSemesters(s)
      if(sec) setSections(sec)
      if(sub) setSubjects(sub)
      if(fa) setFacultyAssignments(fa)
      if(alloc) setSubjectAllocations(alloc)
    } catch(e) { console.log('Hierarchy tables error:', e) }

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
        const { data: section } = await supabase.from('sections').select('id').eq('name', data.section_name).single()
        if (student && section) {
          await supabase.from('student_enrollments').upsert({ student_id: student.id, section_id: section.id })
        }
      } else if (importType === 'subject') {
        await supabase.from('subjects').upsert({
          name: data.name,
          code: data.code,
          credits: parseInt(data.credits) || 3,
          type: data.type || 'theory'
        }, { onConflict: 'code' })
      }
    }
    setProcessing(false); setShowImportModal(false); setShowPreview(false); setCsvData(''); fetchData();
  }

  const executePromotion = async (fromSem: string, toSem: string) => {
    setProcessing(true)
    // Fetch students in fromSem sections
    const { data: enrollments } = await supabase.from('student_enrollments')
      .select('*, sections!inner(semester_id)')
      .eq('sections.semester_id', fromSem)
    
    if (enrollments && enrollments.length > 0) {
      // Logic to find corresponding section in toSem (simplified)
      // In a real app, you'd map "Section A" of Sem 1 to "Section A" of Sem 2
      const { data: toSections } = await supabase.from('sections').select('*').eq('semester_id', toSem)
      
      for (const enr of enrollments) {
        const currentSec = sections.find(s => s.id === enr.section_id)
        const destinationSec = toSections?.find(s => s.name === currentSec?.name)
        if (destinationSec) {
          await supabase.from('student_enrollments').insert([{
            student_id: enr.student_id,
            section_id: destinationSec.id
          }])
        }
      }
      alert('Promotion executed successfully!')
    }
    setProcessing(false)
  }

  const handlePreviewCSV = () => {
    const lines = csvData.trim().split('\n')
    if (lines.length < 2) return
    const headers = lines[0].split(',').map(h => h.trim())
    const rows = lines.slice(1).slice(0, 10) // Only preview 10
    const preview = rows.map(row => {
      const values = row.split(',').map(v => v.trim())
      const obj: any = {}
      headers.forEach((h, i) => obj[h] = values[i])
      return obj
    })
    setPreviewData(preview)
    setShowPreview(true)
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
  const handleAddPayroll = async () => {
    setProcessing(true)
    const net = parseFloat(payrollForm.base_salary) + parseFloat(payrollForm.bonus) - parseFloat(payrollForm.deductions);
    await supabase.from('payroll').insert([{ ...payrollForm, net_salary: net, status: 'pending' }]);
    setShowPayrollModal(false); 
    await fetchData();
    setProcessing(false)
  }

  const handleAddSubject = async () => {
    setProcessing(true)
    await supabase.from('subjects').insert([subForm])
    setShowSubjectModal(false)
    await fetchData()
    setProcessing(false)
  }

  const handleAssignFaculty = async () => {
    setProcessing(true)
    // First, ensure subject-section allocation exists
    let allocationId = ''
    const { data: alloc } = await supabase.from('section_subject_allocations')
      .select('id')
      .eq('section_id', assignForm.section_id)
      .eq('subject_id', assignForm.subject_id)
      .single()
    
    if (alloc) {
      allocationId = alloc.id
    } else {
      const { data: newAlloc } = await supabase.from('section_subject_allocations')
        .insert([{ section_id: assignForm.section_id, subject_id: assignForm.subject_id }])
        .select()
        .single()
      if (newAlloc) allocationId = newAlloc.id
    }

    if (allocationId) {
      await supabase.from('faculty_assignments').insert([{
        teacher_id: assignForm.teacher_id,
        subject_id: assignForm.subject_id,
        section_id: assignForm.section_id,
        allocation_id: allocationId
      }])
    }
    
    setShowAssignModal(false)
    await fetchData()
    setProcessing(false)
  }

  const handleAddHierarchy = async () => {
    setProcessing(true)
    const { type, name, parent_id, code } = hierarchyForm
    
    try {
      if (type === 'department') {
        await supabase.from('departments').insert([{ name, code }])
      } else if (type === 'program') {
        await supabase.from('programs').insert([{ name, department_id: parent_id, duration_years: 4 }])
      } else if (type === 'semester') {
        await supabase.from('semesters').insert([{ term_number: parseInt(name), program_id: parent_id, academic_year: '2026-27' }])
      } else if (type === 'section') {
        await supabase.from('sections').insert([{ name, semester_id: parent_id }])
      }
      setShowHierarchyModal(false)
      await fetchData()
    } catch (e) {
      alert('Error adding hierarchy entity')
    }
    setProcessing(false)
  }

  const handleManualEnroll = async () => {
    setProcessing(true)
    const { student_id, section_id } = enrollForm
    if (student_id && section_id) {
      await supabase.from('student_enrollments').upsert({ student_id, section_id })
      setShowEnrollModal(false)
      await fetchData()
    }
    setProcessing(false)
  }

  const [enrollForm, setEnrollForm] = useState({ student_id: '', section_id: '' })

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
          <SidebarItem icon={<Users size={18} />} label="User Management" active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<BookOpen size={18} />} label="Academic Structure" active={activeTab === 'hierarchy'} onClick={() => { setActiveTab('hierarchy'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<Edit3 size={18} />} label="Subject Manager" active={activeTab === 'subjects'} onClick={() => { setActiveTab('subjects'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<Shield size={18} />} label="Faculty Assignment" active={activeTab === 'faculty'} onClick={() => { setActiveTab('faculty'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<ArrowUpRight size={18} />} label="Promotion Wizard" active={activeTab === 'promotion'} onClick={() => { setActiveTab('promotion'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<Landmark size={18} />} label="Finance" active={activeTab === 'finance'} onClick={() => { setActiveTab('finance'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<Upload size={18} />} label="Bulk Import Center" active={activeTab === 'import'} onClick={() => { setActiveTab('import'); setIsSidebarOpen(false); }} />
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
                <button onClick={() => { setEnrollForm({ student_id: '', section_id: '' }); setShowEnrollModal(true); }} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><LinkIcon size={18} /> Manual Enroll</button>
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

          {activeTab === 'subjects' && (
            <motion.div key="subjects" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2>Subject Management System</h2>
                <button onClick={() => { setSubForm({ name: '', code: '', type: 'theory', credits: 3, semester_id: '', is_elective: false }); setShowSubjectModal(true); }} className="btn-primary"><Plus size={18} /> New Subject</button>
              </div>
              <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                      <th style={{ padding: '16px 24px' }}>Code</th>
                      <th style={{ padding: '16px 24px' }}>Name</th>
                      <th style={{ padding: '16px 24px' }}>Type</th>
                      <th style={{ padding: '16px 24px' }}>Credits</th>
                      <th style={{ padding: '16px 24px' }}>Status</th>
                      <th style={{ padding: '16px 24px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '16px 24px', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>{s.code}</td>
                        <td style={{ padding: '16px 24px' }}>{s.name}</td>
                        <td style={{ padding: '16px 24px' }}><span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '10px', background: s.type === 'lab' ? 'rgba(217, 70, 239, 0.1)' : 'rgba(6, 182, 212, 0.1)', color: s.type === 'lab' ? 'var(--accent-magenta)' : 'var(--accent-cyan)', border: '1px solid currentColor' }}>{s.type.toUpperCase()}</span></td>
                        <td style={{ padding: '16px 24px' }}>{s.credits}</td>
                        <td style={{ padding: '16px 24px' }}><span style={{ color: 'var(--success)' }}>Active</span></td>
                        <td style={{ padding: '16px 24px' }}><button onClick={() => handleDelete('subjects', s.id)} style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'faculty' && (
            <motion.div key="faculty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2>Faculty Assignment Dashboard</h2>
                <button onClick={() => setShowAssignModal(true)} className="btn-primary"><Plus size={18} /> Assign Faculty</button>
              </div>
              <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {facultyAssignments.map(fa => (
                  <div key={fa.id} className="glass-card" style={{ padding: '24px', borderLeft: '4px solid var(--accent-purple)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={20} color="var(--accent-purple)" /></div>
                        <div><h3 style={{ fontSize: '16px' }}>{fa.profiles?.name}</h3><p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Faculty Member</p></div>
                      </div>
                      <button onClick={() => handleDelete('faculty_assignments', fa.id)} style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: 'var(--text-muted)' }}>Subject:</span><span>{fa.subjects?.name}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: 'var(--text-muted)' }}>Section:</span><span>{fa.sections?.name}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'hierarchy' && (
            <motion.div key="hierarchy" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                 <div>
                   <h2>Academic Structure Builder</h2>
                   <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Manage the university organizational hierarchy.</p>
                 </div>
                 <div style={{ display: 'flex', gap: '12px' }}>
                   <button className="btn-secondary" onClick={() => setShowHierarchyModal(true)}><Plus size={16} /> Add Dept/Program</button>
                   <button className="btn-primary" onClick={() => setShowHierarchyModal(true)}><Plus size={16} /> Build Structure</button>
                 </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                 {departments.map(dept => (
                   <div key={dept.id} className="glass-card" style={{ padding: '24px', borderTop: '4px solid var(--accent-cyan)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Landmark size={20} color="var(--accent-cyan)" /> {dept.name}</h3>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>{dept.code || 'DEPT'}</span>
                          <button onClick={() => handleDelete('departments', dept.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={14} /></button>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {programs.filter(p => p.department_id === dept.id).map(prog => (
                          <div key={prog.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <p style={{ fontWeight: '600', fontSize: '14px', color: 'var(--accent-purple)' }}>{prog.name}</p>
                              <button onClick={() => handleDelete('programs', prog.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0' }}><X size={12} /></button>
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{semesters.filter(s => s.program_id === prog.id).length} Semesters</span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sections.filter(sec => semesters.filter(s => s.program_id === prog.id).map(s => s.id).includes(sec.semester_id)).length} Sections</span>
                            </div>
                          </div>
                        ))}
                        {programs.filter(p => p.department_id === dept.id).length === 0 && <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No programs assigned</p>}
                      </div>
                   </div>
                 ))}
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
                       <select id="fromSem" className="input-field" style={{ width: '100%', background: 'rgba(255,255,255,0.05)' }}>
                          <option value="">Select current semester...</option>
                          {semesters.map(s => <option key={s.id} value={s.id} style={{ background: '#1a1a1a' }}>Semester {s.term_number} ({s.academic_year})</option>)}
                       </select>
                    </div>
                    <div>
                       <label style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>To Semester (Destination)</label>
                       <select id="toSem" className="input-field" style={{ width: '100%', background: 'rgba(255,255,255,0.05)' }}>
                          <option value="">Select next semester...</option>
                          {semesters.map(s => <option key={s.id} value={s.id} style={{ background: '#1a1a1a' }}>Semester {s.term_number} ({s.academic_year})</option>)}
                       </select>
                    </div>
                 </div>
                 
                 <button className="btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))' }} onClick={() => executePromotion((document.getElementById('fromSem') as HTMLSelectElement).value, (document.getElementById('toSem') as HTMLSelectElement).value)}>
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
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center', border: '2px dashed var(--glass-border)', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ padding: '40px' }}>
                  <Upload size={48} className="neon-glow-cyan" style={{ marginBottom: '24px', animation: 'pulse 2s infinite' }} />
                  <h2>Bulk Import Center</h2>
                  <p style={{ marginBottom: '32px', color: 'var(--text-muted)' }}>Upload CSV/Excel or paste data to perform mass updates.</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
                    <ImportCard label="Import Students" icon={<Users size={20} />} onClick={() => { setImportType('student'); setShowImportModal(true); }} />
                    <ImportCard label="Import Teachers" icon={<Shield size={20} />} onClick={() => { setImportType('teacher'); setShowImportModal(true); }} />
                    <ImportCard label="Import Subjects" icon={<Book size={20} />} onClick={() => { setImportType('subject'); setShowImportModal(true); }} />
                    <ImportCard label="Enrollment Map" icon={<LinkIcon size={20} />} onClick={() => { setImportType('enrollment'); setShowImportModal(true); }} />
                  </div>

                  <div className="glass-card" style={{ padding: '24px', background: 'rgba(0,0,0,0.2)', textAlign: 'left' }}>
                    <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16} color="var(--accent-cyan)" /> Import Instructions</h4>
                    <ul style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <li>• CSV header must match the field names (e.g., name, roll_no, email)</li>
                      <li>• Enrollment map requires student_roll and section_name</li>
                      <li>• Subject import requires name, code, credits, type</li>
                      <li>• Duplicate records will be updated automatically (Upsert)</li>
                    </ul>
                  </div>
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

      {/* Modals */}
      {showHierarchyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><h3>Build Academic Structure</h3><button onClick={() => setShowHierarchyModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button></div>
            
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Entity Type</label>
            <select className="input-field" style={{ width: '100%', marginBottom: '16px', background: 'rgba(255,255,255,0.05)' }} value={hierarchyForm.type} onChange={e => setHierarchyForm({...hierarchyForm, type: e.target.value})}>
              <option value="department" style={{background: '#1a1a1a'}}>Department</option>
              <option value="program" style={{background: '#1a1a1a'}}>Program/Degree</option>
              <option value="semester" style={{background: '#1a1a1a'}}>Semester</option>
              <option value="section" style={{background: '#1a1a1a'}}>Section</option>
            </select>

            {hierarchyForm.type !== 'department' && (
              <>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Parent Entity</label>
                <select className="input-field" style={{ width: '100%', marginBottom: '16px', background: 'rgba(255,255,255,0.05)' }} value={hierarchyForm.parent_id} onChange={e => setHierarchyForm({...hierarchyForm, parent_id: e.target.value})}>
                  <option value="" style={{background: '#1a1a1a'}}>Select Parent...</option>
                  {hierarchyForm.type === 'program' && departments.map(d => <option key={d.id} value={d.id} style={{background: '#1a1a1a'}}>{d.name}</option>)}
                  {hierarchyForm.type === 'semester' && programs.map(p => <option key={p.id} value={p.id} style={{background: '#1a1a1a'}}>{p.name}</option>)}
                  {hierarchyForm.type === 'section' && semesters.map(s => <option key={s.id} value={s.id} style={{background: '#1a1a1a'}}>Sem {s.term_number} ({programs.find(p => p.id === s.program_id)?.name})</option>)}
                </select>
              </>
            )}

            <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>
              {hierarchyForm.type === 'semester' ? 'Semester Number (e.g. 1)' : 'Name / Title'}
            </label>
            <input className="input-field" placeholder={hierarchyForm.type === 'semester' ? '1' : 'e.g. Computer Science'} value={hierarchyForm.name} onChange={e => setHierarchyForm({...hierarchyForm, name: e.target.value})} style={{ marginBottom: '16px' }} />
            
            {hierarchyForm.type === 'department' && (
              <input className="input-field" placeholder="Dept Code (e.g. CS)" value={hierarchyForm.code} onChange={e => setHierarchyForm({...hierarchyForm, code: e.target.value})} style={{ marginBottom: '24px' }} />
            )}

            <LoadingButton onClick={handleAddHierarchy} loading={processing} style={{ width: '100%' }}>Create Entity</LoadingButton>
          </motion.div>
        </div>
      )}

      {showSubjectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><h3>New Subject</h3><button onClick={() => setShowSubjectModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button></div>
            <input className="input-field" placeholder="Subject Name" value={subForm.name} onChange={e => setSubForm({...subForm, name: e.target.value})} style={{ marginBottom: '16px' }} />
            <input className="input-field" placeholder="Subject Code" value={subForm.code} onChange={e => setSubForm({...subForm, code: e.target.value})} style={{ marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <select className="input-field" style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }} value={subForm.type} onChange={e => setSubForm({...subForm, type: e.target.value})}>
                <option value="theory" style={{background: '#1a1a1a'}}>Theory</option>
                <option value="lab" style={{background: '#1a1a1a'}}>Lab/Practical</option>
              </select>
              <input type="number" className="input-field" style={{ width: '80px' }} placeholder="Credits" value={subForm.credits} onChange={e => setSubForm({...subForm, credits: parseInt(e.target.value)})} />
            </div>
            <select className="input-field" style={{ width: '100%', marginBottom: '16px', background: 'rgba(255,255,255,0.05)' }} value={subForm.semester_id} onChange={e => setSubForm({...subForm, semester_id: e.target.value})}>
              <option value="" style={{background: '#1a1a1a'}}>Select Default Semester</option>
              {semesters.map(s => <option key={s.id} value={s.id} style={{background: '#1a1a1a'}}>Sem {s.term_number} ({s.academic_year})</option>)}
            </select>
            <LoadingButton onClick={handleAddSubject} loading={processing} style={{ width: '100%' }}>Create Subject</LoadingButton>
          </motion.div>
        </div>
      )}

      {showAssignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><h3>Faculty Assignment</h3><button onClick={() => setShowAssignModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button></div>
            
            <select className="input-field" style={{ width: '100%', marginBottom: '16px', background: 'rgba(255,255,255,0.05)' }} value={assignForm.teacher_id} onChange={e => setAssignForm({...assignForm, teacher_id: e.target.value})}>
              <option value="" style={{background: '#1a1a1a'}}>Select Faculty</option>
              {users.filter(u => u.role === 'teacher').map(u => <option key={u.id} value={u.id} style={{background: '#1a1a1a'}}>{u.name}</option>)}
            </select>

            <select className="input-field" style={{ width: '100%', marginBottom: '16px', background: 'rgba(255,255,255,0.05)' }} value={assignForm.subject_id} onChange={e => setAssignForm({...assignForm, subject_id: e.target.value})}>
              <option value="" style={{background: '#1a1a1a'}}>Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id} style={{background: '#1a1a1a'}}>{s.name} ({s.code})</option>)}
            </select>

            <select className="input-field" style={{ width: '100%', marginBottom: '24px', background: 'rgba(255,255,255,0.05)' }} value={assignForm.section_id} onChange={e => setAssignForm({...assignForm, section_id: e.target.value})}>
              <option value="" style={{background: '#1a1a1a'}}>Select Section</option>
              {sections.map(s => <option key={s.id} value={s.id} style={{background: '#1a1a1a'}}>{s.name} (Sem {semesters.find(sem => sem.id === s.semester_id)?.term_number})</option>)}
            </select>

            <LoadingButton onClick={handleAssignFaculty} loading={processing} style={{ width: '100%' }}>Finalize Assignment</LoadingButton>
          </motion.div>
        </div>
      )}

      {showEnrollModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><h3>Manual Student Enrollment</h3><button onClick={() => setShowEnrollModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button></div>
            
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Select Student</label>
            <select className="input-field" style={{ width: '100%', marginBottom: '16px', background: 'rgba(255,255,255,0.05)' }} value={enrollForm.student_id} onChange={e => setEnrollForm({...enrollForm, student_id: e.target.value})}>
              <option value="" style={{background: '#1a1a1a'}}>Select Student...</option>
              {users.filter(u => u.role === 'student').map(u => <option key={u.id} value={u.id} style={{background: '#1a1a1a'}}>{u.name} ({u.roll_no})</option>)}
            </select>

            <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Assign to Section</label>
            <select className="input-field" style={{ width: '100%', marginBottom: '24px', background: 'rgba(255,255,255,0.05)' }} value={enrollForm.section_id} onChange={e => setEnrollForm({...enrollForm, section_id: e.target.value})}>
              <option value="" style={{background: '#1a1a1a'}}>Select Section...</option>
              {sections.map(s => <option key={s.id} value={s.id} style={{background: '#1a1a1a'}}>{s.name} (Sem {semesters.find(sem => sem.id === s.semester_id)?.term_number})</option>)}
            </select>

            <LoadingButton onClick={handleManualEnroll} loading={processing} style={{ width: '100%' }}>Enroll Student</LoadingButton>
          </motion.div>
        </div>
      )}

      {showCourseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><h3>Add Course</h3><button onClick={() => setShowCourseModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button></div>
            <input className="input-field" placeholder="Course Name" value={courseForm.name} onChange={e => setCourseForm({...courseForm, name: e.target.value})} style={{ marginBottom: '16px' }} />
            <input className="input-field" placeholder="Course Code" value={courseForm.code} onChange={e => setCourseForm({...courseForm, code: e.target.value})} style={{ marginBottom: '16px' }} />
            <LoadingButton onClick={handleAddCourse} loading={processing} style={{ width: '100%' }}>Save Course</LoadingButton>
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
            <input className="input-field" placeholder="Fee Title (e.g. Tuition)" value={feeForm.title} onChange={e => setFeeForm({...feeForm, title: e.target.value})} style={{ marginBottom: '16px' }} />
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

      {showPayrollModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><h3>Add Payroll</h3><button onClick={() => setShowPayrollModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button></div>
            <select className="input-field" value={payrollForm.teacher_id} onChange={e => setPayrollForm({...payrollForm, teacher_id: e.target.value})} style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.05)' }}>
              <option value="" disabled style={{background: '#1a1a1a'}}>Select Teacher</option>
              {users.filter(u => u.role === 'teacher').map(u => <option key={u.id} value={u.id} style={{background: '#1a1a1a'}}>{u.name}</option>)}
            </select>
            <input type="number" className="input-field" placeholder="Base Salary" value={payrollForm.base_salary} onChange={e => setPayrollForm({...payrollForm, base_salary: e.target.value})} style={{ marginBottom: '16px' }} />
            <input type="number" className="input-field" placeholder="Bonus" value={payrollForm.bonus} onChange={e => setPayrollForm({...payrollForm, bonus: e.target.value})} style={{ marginBottom: '16px' }} />
            <LoadingButton onClick={handleAddPayroll} loading={processing} style={{ width: '100%' }}>Save Record</LoadingButton>
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
            <textarea className="input-field" rows={8} style={{ marginBottom: '24px', fontFamily: 'monospace', fontSize: '12px' }} value={csvData} onChange={e => setCsvData(e.target.value)} placeholder="Header1, Header2, ...&#10;Value1, Value2, ..." />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowImportModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handlePreviewCSV} className="btn-primary" style={{ flex: 1, background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))' }}>Preview Data</button>
            </div>
          </motion.div>
        </div>
      )}

      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card" style={{ width: '100%', maxWidth: '800px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '20px' }}>Import Preview</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Review the first 10 rows before committing to database.</p>
              </div>
              <button onClick={() => setShowPreview(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '24px', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                    {previewData.length > 0 && Object.keys(previewData[0]).map(k => <th key={k} style={{ padding: '12px' }}>{k.toUpperCase()}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      {Object.values(row).map((v: any, j) => <td key={j} style={{ padding: '12px' }}>{v}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowPreview(false)} className="btn-secondary" style={{ flex: 1 }}>Back to Edit</button>
              <LoadingButton onClick={handleBulkImport} loading={processing} style={{ flex: 1, background: 'var(--success)' }}>Confirm & Import All</LoadingButton>
            </div>
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
const ImportCard = ({ label, onClick, icon }: any) => (
  <div onClick={onClick} className="glass-card" style={{ padding: '24px', cursor: 'pointer', textAlign: 'center', border: '1px solid var(--glass-border)', transition: '0.2s', background: 'rgba(255,255,255,0.02)' }}>
    <div style={{ marginBottom: '12px', color: 'var(--accent-cyan)' }}>{icon || <Plus size={24} />}</div>
    <p style={{ fontWeight: '600', fontSize: '14px' }}>{label}</p>
  </div>
)

export default AdminDashboard
