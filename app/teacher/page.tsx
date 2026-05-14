'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, XCircle, Calendar, BookOpen, LogOut, 
  Search, Filter, History, Users, Save, Check, AlertCircle, 
  ChevronRight, Clock, Edit2, FileText, Upload, Plus, X, Link as LinkIcon, Loader2, Trash2, Book, Trophy, DollarSign, Megaphone, Menu, Activity, UserCheck, UserX, BarChart, ChevronDown, Sparkles, LayoutDashboard, ArrowUpRight, Shield
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import ScreenLoader from '@/components/ScreenLoader'
import LoadingButton from '@/components/LoadingButton'

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedSession, setSelectedSession] = useState(1)
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  
  // New University Hierarchy State
  const [semesters, setSemesters] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])
  const [attendanceMethod, setAttendanceMethod] = useState<'manual' | 'smart'>('manual')
  const [activeSession, setActiveSession] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [showQR, setShowQR] = useState(false)
  const [liveStudents, setLiveStudents] = useState<any[]>([])
  const [showImportModal, setShowImportModal] = useState(false)
  const [importPreview, setImportPreview] = useState<any[]>([])
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [importStats, setImportStats] = useState({ total: 0, valid: 0, duplicates: 0 })
  const [subjects, setSubjects] = useState<any[]>([])
  const [selectedSemester, setSelectedSemester] = useState<any>(null)
  const [selectedSection, setSelectedSection] = useState<any>(null)
  const [selectedSubject, setSelectedSubject] = useState<any>(null)
  const [teacherClasses, setTeacherClasses] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState<any>(null)
  
  const [students, setStudents] = useState<any[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'present' | 'absent' | null>>({})
  const [courseStats, setCourseStats] = useState<{highest: any[], lowest: any[], all: any[]}>({highest: [], lowest: [], all: []})
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [studentStats, setStudentStats] = useState<any>({ attendance: [], grades: [] })
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'present', 'absent', 'late'
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        await Promise.all([
          fetchInitialData(),
          fetchCourses(),
          fetchHierarchy(),
          fetchAnnouncements(),
          fetchPayroll(),
          fetchMaterials()
        ])
        await fetchStudents() // Needs to happen after hierarchy if possible
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (selectedCourse || selectedSubject) {
      if (students.length > 0) {
        fetchCourseStats(selectedSubject?.name || selectedCourse?.name)
      }
    }
  }, [selectedCourse, selectedSubject, students])

  useEffect(() => {
    if (!loading) fetchStudents()
  }, [selectedSection])

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

  const fetchHierarchy = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user?.user) return
      
      const { data: assignments, error } = await supabase.from('faculty_assignments')
        .select(`
          id, 
          subjects (id, name, code, semester_id),
          sections (id, name, semester_id, semesters (id, term_number, academic_year, programs (id, name)))
        `)
        .eq('teacher_id', user.user.id)
        
      if (!error && assignments && assignments.length > 0) {
        const classes = assignments.map((a: any) => ({
          id: a.id,
          subject: a.subjects,
          section: a.sections,
          semester: a.sections.semesters,
          program: a.sections.semesters.programs,
          label: `${a.sections.semesters.programs.name} • Sem ${a.sections.semesters.term_number} • Sec ${a.sections.name} • ${a.subjects.name}`
        }))
        
        setTeacherClasses(classes)
        if (classes.length > 0) {
          setSelectedClass(classes[0])
          setSelectedSubject(classes[0].subject)
          setSelectedSection(classes[0].section)
          setSelectedSemester(classes[0].semester)
        }
      }
    } catch (e) {
      console.log('Hierarchy not available yet, falling back.')
    }
  }

  useEffect(() => {
    if (selectedClass) {
      fetchStudents()
      if (selectedSubject) fetchCourseStats(selectedSubject.name)
    }
  }, [selectedClass, selectedSubject])

  const fetchStudents = async () => {
    // If we have a selected section, fetch from student_enrollments. Otherwise fallback to old profiles fetch.
    if (selectedSection) {
       const { data, error } = await supabase.from('student_enrollments')
         .select('profiles(*)')
         .eq('section_id', selectedSection.id)
         
       if (!error && data) {
         const enrolledStudents = data.map((d: any) => d.profiles)
         setStudents(enrolledStudents)
         const initialAttendance: Record<string, any> = {}
         enrolledStudents.forEach(s => initialAttendance[s.id] = 'present')
         setAttendanceRecords(initialAttendance)
         return
       }
    }

    // Fallback
    const { data } = await supabase.from('profiles').select('*').eq('role', 'student').order('roll_no', { ascending: true })
    if (data) {
      setStudents(data)
      const initialAttendance: Record<string, any> = {}
      data.forEach(s => initialAttendance[s.id] = 'present')
      setAttendanceRecords(initialAttendance)
    }
  }

  const filteredStudents = useMemo(() => {
    let result = students.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.roll_no.toLowerCase().includes(searchTerm.toLowerCase())
    )
    if (filterStatus !== 'all') {
      result = result.filter(s => attendanceRecords[s.id] === filterStatus)
    }
    return result
  }, [students, searchTerm, filterStatus, attendanceRecords])

  const markAllPresent = () => {
    const newRecords = { ...attendanceRecords }
    filteredStudents.forEach(s => {
      newRecords[s.id] = 'present'
    })
    setAttendanceRecords(newRecords)
  }

  const fetchMaterials = async () => {
    const { data: user } = await supabase.auth.getUser()
    if (!user?.user) return
    const { data } = await supabase.from('materials').select('*').eq('teacher_id', user.user.id).order('created_at', { ascending: false })
    if (data) setMaterials(data)
  }

  const fetchCourseStats = async (subjectName: string) => {
    const { data } = await supabase.from('attendance').select('student_id, status').eq('subject', subjectName)
    if (data && students.length > 0) {
      const counts: Record<string, {present: number, total: number}> = {}
      students.forEach(s => counts[s.id] = { present: 0, total: 0 })
      
      data.forEach(r => {
        if (counts[r.student_id]) {
          counts[r.student_id].total++
          if (r.status === 'present') counts[r.student_id].present++
        }
      })
      
      const statsArray = students.map(s => {
        const c = counts[s.id] || { present: 0, total: 0 }
        const percentage = c.total === 0 ? 0 : Math.round((c.present / c.total) * 100)
        return { ...s, percentage, total: c.total }
      })
      
      statsArray.sort((a, b) => b.percentage - a.percentage)
      
      setCourseStats({
        all: statsArray,
        highest: statsArray.slice(0, 3),
        lowest: [...statsArray].reverse().slice(0, 3)
      })
    } else {
      setCourseStats({highest: [], lowest: [], all: []})
    }
  }

  const loadHistorySession = async (h: any) => {
    setLoading(true)
    setSelectedDate(h.date)
    setSelectedSession(h.session_no)
    setActiveTab('attendance')
    
    const { data: user } = await supabase.auth.getUser()
    if (user?.user) {
       const { data: records } = await supabase.from('attendance')
          .select('*')
          .eq('teacher_id', user.user.id)
          .eq('date', h.date)
          .eq('session_no', h.session_no)
          
       if (records && records.length > 0) {
          const courseName = records[0].subject
          const matchedCourse = courses.find(c => c.name === courseName)
          if (matchedCourse) setSelectedCourse(matchedCourse)
          
          const mappedAttendance: Record<string, 'present' | 'absent'> = {}
          records.forEach(r => {
             mappedAttendance[r.student_id] = r.status
          })
          setAttendanceRecords(mappedAttendance)
       }
    }
    setLoading(false)
  }

  const openStudentProfile = async (student: any) => {
    setSelectedStudent(student)
    const { data: attendance } = await supabase.from('attendance').select('*').eq('student_id', student.id)
    const { data: grades } = await supabase.from('grades').select('*, courses(name)').eq('student_id', student.id)
    setStudentStats({ attendance: attendance || [], grades: grades || [] })
  }

  const handleSaveAttendance = async () => {
    setSaving(true)
    const { data: user } = await supabase.auth.getUser()
    if (!user?.user) return
    if (!selectedCourse && !selectedSubject) return
    
    const subjectName = selectedSubject?.name || selectedCourse?.name
    
    const records = students.map(s => ({
      student_id: s.id,
      teacher_id: user.user.id,
      subject: subjectName,
      subject_id: selectedSubject?.id || null,
      section_id: selectedSection?.id || null,
      date: selectedDate,
      session_no: selectedSession,
      status: attendanceRecords[s.id] || 'present'
    }))
    
    // Delete existing records to allow seamless updates/editing
    await supabase.from('attendance')
      .delete()
      .match({ teacher_id: user.user.id, subject: subjectName, date: selectedDate, session_no: selectedSession })
      
    await supabase.from('attendance').insert(records)
    setMessage({ text: 'Attendance saved successfully', type: 'success' })
    fetchInitialData()
    fetchCourseStats(subjectName)
    setSaving(false)
    setTimeout(() => setMessage({ text: '', type: '' }), 3000)
  }

  const handleUploadMaterial = async () => {
    if (!materialForm.title || !materialForm.file_url || !selectedCourse) return
    setSaving(true)
    const { data: user } = await supabase.auth.getUser()
    if (!user?.user) { setSaving(false); return; }

    await supabase.from('materials').insert([{
      teacher_id: user.user.id,
      subject: selectedCourse.name,
      title: materialForm.title,
      file_url: materialForm.file_url,
      file_type: materialForm.file_type
    }])
    setMaterialForm({ title: '', file_url: '', file_type: 'pdf' })
    await fetchMaterials()
    setSaving(false)
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

  const handleGenerateSession = async (duration: number) => {
    if (!selectedClass || !selectedSubject || !teacherProfile) {
      setMessage({ text: 'Please select a class and subject first.', type: 'error' })
      return
    }
    
    setSaving(true)
    try {
      // Get Teacher GPS
      let lat = null, lng = null
      try {
        const pos: any = await new Promise((res, rej) => 
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000, enableHighAccuracy: true })
        )
        lat = pos.coords.latitude
        lng = pos.coords.longitude
      } catch (e) { 
        console.log('Location access denied or timeout') 
      }

      const subCode = (selectedSubject.code || 'SUBJ').slice(0, 4).toUpperCase()
      const randNum = Math.floor(10000 + Math.random() * 90000)
      const code = `${subCode}${randNum}`
      const expires = new Date(Date.now() + duration * 1000)
      
      const { data, error } = await supabase.from('attendance_sessions').insert([{
        allocation_id: selectedClass.id,
        teacher_id: teacherProfile.id,
        code,
        expires_at: expires.toISOString(),
        latitude: lat,
        longitude: lng,
        is_active: true
      }]).select().single()

      if (error) throw error

      if (data) {
        setActiveSession(data)
        setTimeLeft(duration)
        setShowQR(true)
        setMessage({ text: 'Attendance code generated successfully!', type: 'success' })
      }
    } catch (err: any) {
      console.error('Session generation error:', err)
      setMessage({ text: `Failed to generate code: ${err.message || 'Unknown error'}`, type: 'error' })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage({ text: '', type: '' }), 3000)
    }
  }

  // Real-time listener for Smart Attendance
  useEffect(() => {
    if (!activeSession) {
      setLiveStudents([])
      return
    }

    const channel = supabase
      .channel('live-attendance')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'attendance', 
        filter: `session_id=eq.${activeSession.id}` 
      }, async (payload) => {
        // Fetch student name for the live view
        const { data: profile } = await supabase.from('profiles').select('name, roll_no').eq('id', payload.new.student_id).single()
        if (profile) {
          setLiveStudents(prev => [{ ...payload.new, profiles: profile }, ...prev])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeSession])

  const handleFinalizeSession = async () => {
    if (!activeSession) return
    setSaving(true)
    await supabase.from('attendance_sessions').update({ is_active: false }).eq('id', activeSession.id)
    setActiveSession(null)
    setTimeLeft(0)
    fetchStudents() // Refresh the main roster view
    setMessage({ text: 'Attendance session finalized!', type: 'success' })
    setSaving(false)
  }

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
      return () => clearInterval(timer)
    } else if (activeSession) {
      setActiveSession(null)
    }
  }, [timeLeft])

  const handleFileSelect = (e: any) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event: any) => {
      const text = event.target.result
      const rows = text.split('\n').filter((r: any) => r.trim())
      const headers = rows[0].toLowerCase().split(',').map((h: any) => h.trim())
      
      const dataRows = rows.slice(1).map((row: any) => {
        const values = row.split(',').map((v: any) => v.trim())
        const obj: any = {}
        headers.forEach((h: any, i: any) => obj[h] = values[i])
        return obj
      })

      // Validation
      const errors: string[] = []
      let valid = 0, duplicates = 0
      const processed = dataRows.map((r: any, idx: number) => {
        const hasName = !!(r.name || r['student name'])
        const hasRoll = !!(r.roll_no || r['roll number'])
        if (!hasName || !hasRoll) {
           errors.push(`Row ${idx + 2}: Missing Name or Roll Number`)
           return { ...r, status: 'error' }
        }
        valid++
        return { ...r, status: 'valid' }
      })

      setImportPreview(processed)
      setImportErrors(errors)
      setImportStats({ total: processed.length, valid, duplicates: 0 })
    }
    reader.readAsText(file)
  }

  const handleConfirmImport = async () => {
    if (!selectedSection) return
    setSaving(true)
    try {
      for (const row of importPreview.filter(r => r.status === 'valid')) {
        const name = row.name || row['student name']
        const roll = row.roll_no || row['roll number']
        
        // 1. Upsert Profile
        const { data: profile } = await supabase.from('profiles').upsert({
          name, roll_no: roll, role: 'student'
        }, { onConflict: 'roll_no' }).select().single()

        if (profile) {
          // 2. Enroll in current section
          await supabase.from('student_enrollments').upsert({
            student_id: profile.id,
            section_id: selectedSection.id
          })
        }
      }
      setShowImportModal(false)
      fetchStudents()
      setMessage({ text: 'Roster imported successfully', type: 'success' })
    } catch (e) {
      setMessage({ text: 'Import failed', type: 'error' })
    }
    setSaving(false)
  }

  const handleLogout = async () => { 
    setSaving(true)
    await supabase.auth.signOut(); 
    router.push('/login'); 
    setSaving(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex' }}>
      <ScreenLoader isLoading={loading} message="Fetching latest data..." />
      <ScreenLoader isLoading={saving} message="Saving changes..." />
      
      {/* Mobile Header */}
      <header className="mobile-only glass-card" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
        <h2 className="neon-text" style={{ fontSize: '20px', fontWeight: '800' }}>FACULTY</h2>
        <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
          <Menu size={24} />
        </button>
      </header>

      {/* Sidebar Overlay */}
      {isSidebarOpen && <div className="sidebar-overlay mobile-only" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`glass-card sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ padding: '0 16px' }}><h2 className="neon-text" style={{ fontSize: '24px', fontWeight: '800' }}>FACULTY</h2></div>
          <button className="mobile-only" onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
        </div>
        <nav style={{ flex: 1, overflowY: 'auto' }}>
          <SidebarItem icon={<LayoutDashboard size={18} />} label="My Classes" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<CheckCircle size={18} />} label="Attendance" active={activeTab === 'attendance'} onClick={() => { setActiveTab('attendance'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<Book size={18} />} label="Materials" active={activeTab === 'materials'} onClick={() => { setActiveTab('materials'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<Megaphone size={18} />} label="Announce" active={activeTab === 'announce'} onClick={() => { setActiveTab('announce'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<Trophy size={18} />} label="Grades" active={activeTab === 'grades'} onClick={() => { setActiveTab('grades'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<DollarSign size={18} />} label="My Payroll" active={activeTab === 'payroll'} onClick={() => { setActiveTab('payroll'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<History size={18} />} label="History" active={activeTab === 'history'} onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<Users size={18} />} label="Students" active={activeTab === 'students'} onClick={() => { setActiveTab('students'); setIsSidebarOpen(false); }} />
        </nav>
        <button onClick={handleLogout} className="btn-secondary" style={{ width: '100%', marginTop: '20px' }}><LogOut size={18} /> Logout</button>
      </aside>

      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }} className="main-content">
        <AnimatePresence mode="wait">
          {!loading && (
            <div key="content">
          {activeTab === 'dashboard' && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ marginBottom: '40px' }}>
                  <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Welcome, {teacherProfile?.name || 'Professor'}</h1>
                  <p style={{ color: 'var(--text-muted)' }}>Here are your assigned classes for the current academic session.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                  {teacherClasses.map((cls) => (
                    <motion.div 
                      key={cls.id} 
                      whileHover={{ scale: 1.02, translateY: -5 }}
                      onClick={() => {
                        setSelectedClass(cls)
                        setSelectedSubject(cls.subject)
                        setSelectedSection(cls.section)
                        setSelectedSemester(cls.semester)
                        setActiveTab('attendance')
                      }}
                      className="glass-card" 
                      style={{ padding: '32px', cursor: 'pointer', borderLeft: '6px solid var(--accent-cyan)', position: 'relative', overflow: 'hidden' }}
                    >
                      <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'var(--accent-cyan)', opacity: 0.05, borderRadius: '50%' }} />
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                        <div>
                          <p style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>{cls.subject.code}</p>
                          <h3 style={{ fontSize: '20px', marginTop: '4px' }}>{cls.subject.name}</h3>
                        </div>
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                          <Users size={20} color="var(--accent-cyan)" />
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Program:</span>
                          <span style={{ fontWeight: '600' }}>{cls.program.name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Semester:</span>
                          <span style={{ fontWeight: '600' }}>Semester {cls.semester.term_number}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Section:</span>
                          <span style={{ fontWeight: '600', padding: '2px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>Section {cls.section.name}</span>
                        </div>
                      </div>

                      <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontSize: '13px', fontWeight: '600' }}>
                        Mark Attendance <ArrowUpRight size={16} />
                      </div>
                    </motion.div>
                  ))}
                  
                  {teacherClasses.length === 0 && (
                    <div className="glass-card" style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1' }}>
                      <AlertCircle size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
                      <p style={{ color: 'var(--text-muted)' }}>You have not been assigned to any classes yet. Please contact Admin.</p>
                    </div>
                  )}
                </div>
             </motion.div>
          )}

          {activeTab === 'attendance' && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {/* Premium Sticky Top Header (Desktop & Mobile combined feel) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h1 style={{ fontSize: '28px', background: 'linear-gradient(to right, #FFFFFF, #A0A0A0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Welcome, {teacherProfile?.name || 'Prof.'}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                      <div className="status-dot-active" />
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Class Active • {selectedDate} (Session {selectedSession})</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                     <div className="segmented-control" style={{ marginRight: '12px' }}>
                        <button onClick={() => setAttendanceMethod('manual')} style={{ padding: '6px 16px', borderRadius: '100px', border: 'none', background: attendanceMethod === 'manual' ? 'var(--accent-cyan)' : 'transparent', color: 'white', fontSize: '12px', cursor: 'pointer', transition: '0.3s' }}>Manual</button>
                        <button onClick={() => setAttendanceMethod('smart')} style={{ padding: '6px 16px', borderRadius: '100px', border: 'none', background: attendanceMethod === 'smart' ? 'var(--accent-purple)' : 'transparent', color: 'white', fontSize: '12px', cursor: 'pointer', transition: '0.3s' }}>Smart</button>
                     </div>
                     <button onClick={() => setShowImportModal(true)} className="btn-secondary" style={{ padding: '6px 16px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}><Upload size={14} /> Import Roster</button>
                     {/* Smart Class Switcher for Faculty */}
                     {teacherClasses.length > 0 ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>MY CLASSES:</span>
                          <select 
                            className="input-field" 
                            value={selectedClass?.id || ''} 
                            onChange={(e) => {
                              const cls = teacherClasses.find(c => c.id === e.target.value)
                              if (cls) {
                                setSelectedClass(cls)
                                setSelectedSubject(cls.subject)
                                setSelectedSection(cls.section)
                                setSelectedSemester(cls.semester)
                              }
                            }} 
                            style={{ background: 'rgba(255,255,255,0.05)', color: 'white', width: 'auto', padding: '8px 16px', borderRadius: '100px', fontSize: '13px', border: '1px solid var(--accent-cyan)' }}
                          >
                            {teacherClasses.map(c => <option key={c.id} value={c.id} style={{background: '#1a1a1a'}}>{c.label}</option>)}
                          </select>
                        </div>
                     ) : (
                       <select className="input-field" value={selectedCourse?.id} onChange={(e) => setSelectedCourse(courses.find(c => c.id === e.target.value))} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', width: 'auto', padding: '8px 16px', borderRadius: '100px', fontSize: '13px' }}>
                          {courses.map(c => <option key={c.id} value={c.id} style={{background: '#1a1a1a'}}>{c.name}</option>)}
                       </select>
                     )}
                     <input type="date" className="input-field desktop-only" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ width: 'auto', padding: '8px 16px', borderRadius: '100px', fontSize: '13px' }} />
                     <select className="input-field desktop-only" value={selectedSession} onChange={(e) => setSelectedSession(Number(e.target.value))} style={{ width: 'auto', padding: '8px 16px', borderRadius: '100px', fontSize: '13px' }}>
                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s} style={{background: '#1a1a1a'}}>Session {s}</option>)}
                     </select>
                  </div>
                </div>

                {message.text && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '12px 16px', background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', borderLeft: `4px solid ${message.type === 'error' ? 'var(--error)' : 'var(--success)'}`, marginBottom: '24px', borderRadius: '8px', color: message.type === 'error' ? 'var(--error)' : 'var(--success)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Sparkles size={18} /> {message.text}
                  </motion.div>
                )}
                
                {attendanceMethod === 'smart' ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ padding: '40px', textAlign: 'center', marginBottom: '40px', border: '2px dashed var(--glass-border)' }}>
                    {!activeSession ? (
                      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                        <Activity size={48} color="var(--accent-purple)" style={{ marginBottom: '24px' }} />
                        <h2>Smart Classroom Session</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Generate a temporary code for students to mark their attendance via GPS & unique session ID.</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
                           <button onClick={() => handleGenerateSession(30)} className="btn-secondary" style={{ padding: '12px' }}>30 Sec</button>
                           <button onClick={() => handleGenerateSession(60)} className="btn-secondary" style={{ padding: '12px' }}>60 Sec</button>
                           <button onClick={() => handleGenerateSession(90)} className="btn-secondary" style={{ padding: '12px' }}>90 Sec</button>
                        </div>
                        <LoadingButton onClick={() => handleGenerateSession(120)} loading={saving} style={{ width: '100%' }}>Generate Active Session</LoadingButton>
                      </div>
                    ) : (
                      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
                          <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                            <svg style={{ transform: 'rotate(-90deg)', width: '150px', height: '150px' }}>
                              <circle cx="75" cy="75" r="70" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                              <circle cx="75" cy="75" r="70" stroke="var(--accent-purple)" strokeWidth="8" fill="none" strokeDasharray="440" strokeDashoffset={440 - (timeLeft / 120) * 440} style={{ transition: 'stroke-dashoffset 1s linear' }} />
                            </svg>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                              <span style={{ fontSize: '32px', fontWeight: '800' }}>{timeLeft}</span>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SECONDS</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', justifyContent: 'center', flexWrap: 'wrap' }}>
                           <div className="glass-card" style={{ padding: '24px 40px', background: 'rgba(0,0,0,0.3)', border: '2px solid var(--accent-purple)', textAlign: 'center' }}>
                              <p style={{ fontSize: '12px', color: 'var(--accent-purple)', fontWeight: '800', letterSpacing: '2px', marginBottom: '8px' }}>ATTENDANCE CODE</p>
                              <h1 style={{ fontSize: '48px', letterSpacing: '8px', color: 'white' }} onPaste={(e) => e.preventDefault()}>{activeSession.code}</h1>
                           </div>
                           
                           {showQR && (
                             <div className="glass-card" style={{ padding: '16px', background: 'white', borderRadius: '16px' }}>
                               <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${activeSession.code}`} alt="QR Code" style={{ width: '150px', height: '150px' }} />
                             </div>
                           )}
                        </div>

                        {/* Live Student List */}
                        <div style={{ marginTop: '40px', textAlign: 'left' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                               <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}><Users size={18} color="var(--success)" /> Live Classroom Feed</h4>
                               <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Students marking attendance in real-time</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                               <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--success)' }}>{liveStudents.length}</span>
                               <div className="status-dot-active" />
                            </div>
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', maxHeight: '250px', overflowY: 'auto', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                             <AnimatePresence>
                               {liveStudents.map((s, i) => (
                                 <motion.div 
                                   initial={{ opacity: 0, scale: 0.8, y: 10 }} 
                                   animate={{ opacity: 1, scale: 1, y: 0 }} 
                                   exit={{ opacity: 0, scale: 0.8 }}
                                   key={s.id} 
                                   className="glass-card" 
                                   style={{ padding: '12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)', position: 'relative', overflow: 'hidden' }}
                                 >
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--success), #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>{s.profiles?.name?.charAt(0)}</div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                       <div style={{ fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.profiles?.name}</div>
                                       <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{s.profiles?.roll_no}</div>
                                    </div>
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, height: '2px', background: 'var(--success)', width: '100%' }} />
                                 </motion.div>
                               ))}
                             </AnimatePresence>
                             {liveStudents.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '40px' }}><Loader2 className="spin" style={{ marginBottom: '12px' }} /> Waiting for students to enter the code...</div>}
                          </div>
                        </div>

                        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                          <LoadingButton onClick={handleFinalizeSession} loading={saving} style={{ background: 'var(--success)', color: 'white', border: 'none' }}>Finalize & Save Attendance</LoadingButton>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '100px', fontSize: '12px' }}>
                             GPS ACTIVE
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }} className="responsive-grid">
                    <StatCard label="Total Enrolled" value={students.length} icon={<Users color="var(--accent-cyan)" />} color="var(--accent-cyan)" />
                    <StatCard label="Present Today" value={Object.values(attendanceRecords).filter(v => v === 'present').length} icon={<UserCheck color="var(--success)" />} color="var(--success)" />
                    <StatCard label="Absent Today" value={Object.values(attendanceRecords).filter(v => v === 'absent').length} icon={<UserX color="var(--error)" />} color="var(--error)" />
                    <StatCard label="Attendance %" value={`${students.length ? Math.round((Object.values(attendanceRecords).filter(v => v === 'present').length / students.length) * 100) : 0}%`} icon={<BarChart color="var(--accent-purple)" />} color="var(--accent-purple)" />
                  </div>
                )}

                {/* Advanced Analytics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                  <motion.div whileHover={{ scale: 1.02 }} className="glass-card" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.1 }}><Users size={80} color="var(--accent-cyan)" /></div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px', fontWeight: '600' }}>TOTAL STUDENTS</p>
                    <h2 style={{ fontSize: '32px', color: 'white' }}>{students.length}</h2>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.02 }} className="glass-card neon-glow-green" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.1 }}><UserCheck size={80} color="var(--success)" /></div>
                    <p style={{ color: 'var(--success)', fontSize: '13px', marginBottom: '8px', fontWeight: '600' }}>PRESENT TODAY</p>
                    <h2 style={{ fontSize: '32px', color: 'white' }}>{Object.values(attendanceRecords).filter(v => v === 'present').length}</h2>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} className="glass-card neon-glow-red" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.1 }}><UserX size={80} color="var(--error)" /></div>
                    <p style={{ color: 'var(--error)', fontSize: '13px', marginBottom: '8px', fontWeight: '600' }}>ABSENT TODAY</p>
                    <h2 style={{ fontSize: '32px', color: 'white' }}>{Object.values(attendanceRecords).filter(v => v === 'absent').length}</h2>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} className="glass-card" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.1 }}><Activity size={80} color="var(--accent-purple)" /></div>
                    <p style={{ color: 'var(--accent-purple)', fontSize: '13px', marginBottom: '8px', fontWeight: '600' }}>TODAY'S RATE</p>
                    <h2 style={{ fontSize: '32px', color: 'white' }}>{students.length > 0 ? Math.round((Object.values(attendanceRecords).filter(v => v === 'present').length / students.length) * 100) : 0}%</h2>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.02 }} className="glass-card" style={{ padding: '20px' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}><Trophy size={14} color="var(--accent-cyan)" /> HIGHEST OVERALL</p>
                    {courseStats.highest.length > 0 ? (
                      <div>
                        <h3 style={{ fontSize: '18px' }}>{courseStats.highest[0].name}</h3>
                        <p style={{ color: 'var(--accent-cyan)', fontWeight: '700' }}>{courseStats.highest[0].percentage}%</p>
                      </div>
                    ) : <p style={{ color: 'var(--text-muted)' }}>No data</p>}
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} className="glass-card" style={{ padding: '20px' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertCircle size={14} color="var(--error)" /> LOWEST OVERALL</p>
                    {courseStats.lowest.length > 0 ? (
                      <div>
                        <h3 style={{ fontSize: '18px' }}>{courseStats.lowest[0].name}</h3>
                        <p style={{ color: 'var(--error)', fontWeight: '700' }}>{courseStats.lowest[0].percentage}%</p>
                      </div>
                    ) : <p style={{ color: 'var(--text-muted)' }}>No data</p>}
                  </motion.div>
                </div>

                {courseStats.all.length > 0 && (
                  <div className="glass-card" style={{ padding: '24px', marginBottom: '32px' }}>
                    <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <BarChart size={20} color="var(--accent-purple)" /> Class Distribution Overview
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', maxHeight: '300px', overflowY: 'auto' }} className="scroll-hide">
                      {courseStats.all.map((s, i) => (
                         <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                               <span style={{ fontSize: '14px', fontWeight: '600', cursor: 'pointer' }} onClick={() => openStudentProfile(s)}>{s.name}</span>
                               <span style={{ fontSize: '14px', fontWeight: '800', color: s.percentage >= 75 ? 'var(--success)' : s.percentage >= 50 ? 'var(--accent-cyan)' : 'var(--error)' }}>{s.percentage}%</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                               <motion.div 
                                 initial={{ width: 0 }} 
                                 animate={{ width: `${s.percentage}%` }} 
                                 transition={{ duration: 1.5, delay: i * 0.05, ease: "easeOut" }}
                                 style={{ 
                                   height: '100%', 
                                   background: s.percentage >= 75 ? 'linear-gradient(90deg, #10B981, #34D399)' : s.percentage >= 50 ? 'linear-gradient(90deg, #06B6D4, #22D3EE)' : 'linear-gradient(90deg, #EF4444, #F87171)', 
                                   borderRadius: '10px',
                                   boxShadow: `0 0 10px ${s.percentage >= 75 ? '#10B981' : s.percentage >= 50 ? '#06B6D4' : '#EF4444'}`
                                 }}
                               />
                            </div>
                         </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                   <div style={{ position: 'relative', flex: 1, minWidth: '300px', maxWidth: '500px' }}>
                      <div className={`glass-search-bar ${isSearchFocused ? 'focused' : ''}`} style={{ display: 'flex', alignItems: 'center', padding: '0 20px', height: '54px' }}>
                         <Search size={20} color={isSearchFocused ? 'var(--accent-cyan)' : 'var(--text-muted)'} style={{ transition: 'color 0.3s' }} />
                         <input 
                            placeholder="Search students by name or roll..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            style={{ flex: 1, height: '100%', paddingLeft: '12px', fontSize: '15px' }}
                         />
                      </div>
                   </div>
                   
                   <div style={{ display: 'flex', gap: '12px', overflowX: 'auto' }} className="scroll-hide">
                      {['all', 'present', 'absent', 'late'].map(f => (
                         <button 
                            key={f}
                            onClick={() => setFilterStatus(f)}
                            style={{
                               padding: '10px 20px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontWeight: '600', fontSize: '13px', textTransform: 'capitalize', transition: 'all 0.3s ease',
                               background: filterStatus === f ? 'rgba(255,255,255,0.1)' : 'transparent',
                               color: filterStatus === f ? 'white' : 'var(--text-secondary)'
                            }}
                         >
                            {f}
                         </button>
                      ))}
                   </div>

                   <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={markAllPresent} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '54px', borderColor: 'var(--success)', color: 'var(--success)' }}>
                         <CheckCircle size={18} /> Mark All Present
                      </button>
                      <LoadingButton onClick={handleSaveAttendance} loading={saving} style={{ height: '54px', background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))', boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)' }} className="animated-gradient-btn">
                         <Save size={18} /> Save Attendance
                      </LoadingButton>
                   </div>
                </div>

                {/* Premium Student Roster Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                  <AnimatePresence>
                    {filteredStudents.map((s, i) => {
                       const overallPct = courseStats.all.find(stat => stat.id === s.id)?.percentage || 0
                       return (
                         <motion.div 
                           key={s.id} 
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, scale: 0.95 }}
                           transition={{ delay: i * 0.03 }}
                           whileHover={{ scale: 1.02, y: -4 }}
                           className={`glass-card ${attendanceRecords[s.id] === 'absent' ? 'neon-glow-red' : ''}`} 
                           style={{ padding: '24px', position: 'relative', overflow: 'hidden', background: attendanceRecords[s.id] === 'absent' ? 'rgba(239, 68, 68, 0.03)' : 'var(--bg-surface)' }}
                         >
                           {attendanceRecords[s.id] === 'present' && <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--success)', boxShadow: '0 0 10px var(--success)' }} />}
                           
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                 <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                                    {s.name[0]}
                                 </div>
                                 <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{s.name}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                       <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.roll_no}</span>
                                       <span style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', color: 'var(--text-secondary)' }}>{selectedCourse?.name || 'Subject'}</span>
                                    </div>
                                 </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                 <p style={{ fontSize: '18px', fontWeight: '800', color: overallPct >= 75 ? 'var(--success)' : overallPct >= 50 ? 'var(--accent-cyan)' : 'var(--error)' }}>{overallPct}%</p>
                                 <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>OVERALL</p>
                              </div>
                           </div>

                           <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <AttendanceToggle 
                                status={attendanceRecords[s.id]} 
                                onToggle={(val) => setAttendanceRecords({...attendanceRecords, [s.id]: val})} 
                              />
                           </div>
                         </motion.div>
                       )
                    })}
                  </AnimatePresence>
                </div>
                {filteredStudents.length === 0 && (
                   <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
                      <Search size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                      <h3 style={{ color: 'var(--text-secondary)' }}>No students found</h3>
                      <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search or filters.</p>
                   </div>
                )}
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
                   <LoadingButton onClick={handleUploadMaterial} loading={saving}><Upload size={18} /> Upload</LoadingButton>
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
                    <div key={i} className="glass-card" style={{ padding: '24px', transition: '0.3s', cursor: 'pointer' }} onClick={() => loadHistorySession(h)}>
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
                               <td style={{ padding: '16px 24px', textAlign: 'right' }}><button className="btn-secondary" onClick={() => openStudentProfile(s)} style={{ padding: '6px 12px', fontSize: '12px' }}>Profile</button></td>
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
                                             <LoadingButton onClick={handleSaveGrades} loading={saving}>
                         <Save size={18} /> Save All
                       </LoadingButton>

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

      {/* Student Profile Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card" style={{ width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                 <div>
                    <h2 style={{ fontSize: '24px' }}>{selectedStudent.name}</h2>
                    <p style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>{selectedStudent.roll_no}</p>
                 </div>
                 <button onClick={() => setSelectedStudent(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', alignSelf: 'flex-start' }}><X size={24} /></button>
              </div>

              <div style={{ marginBottom: '32px' }}>
                 <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={18} color="var(--accent-purple)" /> Attendance Performance</h3>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {studentStats.attendance.length > 0 ? (
                       Object.entries(studentStats.attendance.reduce((acc: any, curr: any) => {
                          if (!acc[curr.subject]) acc[curr.subject] = { present: 0, total: 0 }
                          acc[curr.subject].total++
                          if (curr.status === 'present') acc[curr.subject].present++
                          return acc
                       }, {})).map(([subject, stats]: any, i) => {
                          const pct = Math.round((stats.present / stats.total) * 100)
                          return (
                             <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                                   <span style={{ fontWeight: '600' }}>{subject}</span>
                                   <span>{stats.present} / {stats.total} Sessions ({pct}%)</span>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                   <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} style={{ height: '100%', background: pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--accent-cyan)' : 'var(--error)' }} />
                                </div>
                             </div>
                          )
                       })
                    ) : <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No attendance records found.</p>}
                 </div>
              </div>

              <div>
                 <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Trophy size={18} color="var(--accent-magenta)" /> Recent Grades</h3>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {studentStats.grades.length > 0 ? studentStats.grades.map((g: any, i: number) => (
                       <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
                          <div>
                             <p style={{ fontWeight: '600', fontSize: '14px' }}>{g.courses?.name || 'Unknown Course'}</p>
                             <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{g.exam_type.toUpperCase()}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                             <p style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-cyan)' }}>{g.marks}</p>
                          </div>
                       </div>
                    )) : <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No grades recorded yet.</p>}
                 </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showImportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card" style={{ width: '100%', maxWidth: '600px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3>Import Student Roster</h3>
              <button onClick={() => setShowImportModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            {!importPreview.length ? (
              <div style={{ border: '2px dashed var(--glass-border)', padding: '40px', textAlign: 'center', borderRadius: '16px' }}>
                <Upload size={40} color="var(--accent-purple)" style={{ marginBottom: '16px' }} />
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Select a CSV file containing Name and Roll Number columns.</p>
                <input type="file" accept=".csv" onChange={handleFileSelect} style={{ display: 'none' }} id="csv-upload" />
                <label htmlFor="csv-upload" className="btn-primary" style={{ cursor: 'pointer' }}>Choose File</label>
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                   <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'center' }}>
                     <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>TOTAL ROWS</p>
                     <p style={{ fontSize: '18px', fontWeight: '800' }}>{importStats.total}</p>
                   </div>
                   <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', textAlign: 'center' }}>
                     <p style={{ fontSize: '10px', color: 'var(--success)' }}>VALID</p>
                     <p style={{ fontSize: '18px', fontWeight: '800', color: 'var(--success)' }}>{importStats.valid}</p>
                   </div>
                   <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', textAlign: 'center' }}>
                     <p style={{ fontSize: '10px', color: 'var(--error)' }}>ERRORS</p>
                     <p style={{ fontSize: '18px', fontWeight: '800', color: 'var(--error)' }}>{importErrors.length}</p>
                   </div>
                </div>

                {importErrors.length > 0 && (
                  <div style={{ marginBottom: '24px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', maxHeight: '100px', overflowY: 'auto' }}>
                    {importErrors.map((err, i) => <p key={i} style={{ fontSize: '12px', color: 'var(--error)', marginBottom: '4px' }}>• {err}</p>)}
                  </div>
                )}

                <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '24px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                   <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                     <thead style={{ background: 'rgba(255,255,255,0.05)', position: 'sticky', top: 0 }}>
                       <tr>
                         <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px' }}>Name</th>
                         <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px' }}>Roll No</th>
                         <th style={{ padding: '10px', textAlign: 'center', fontSize: '12px' }}>Status</th>
                       </tr>
                     </thead>
                     <tbody>
                        {importPreview.map((row, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                            <td style={{ padding: '10px', fontSize: '12px' }}>{row.name || row['student name']}</td>
                            <td style={{ padding: '10px', fontSize: '12px' }}>{row.roll_no || row['roll number']}</td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                              {row.status === 'valid' ? <Check size={14} color="var(--success)" /> : <X size={14} color="var(--error)" />}
                            </td>
                          </tr>
                        ))}
                     </tbody>
                   </table>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setImportPreview([])} className="btn-secondary" style={{ flex: 1 }}>Reset</button>
                  <LoadingButton onClick={handleConfirmImport} loading={saving} style={{ flex: 2 }}>Confirm & Import {importStats.valid} Students</LoadingButton>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}

const AttendanceToggle = ({ status, onToggle }: { status: 'present' | 'absent' | null, onToggle: (val: 'present' | 'absent') => void }) => {
  return (
    <div className="segmented-control" style={{ width: '160px', height: '36px' }}>
      <div 
        style={{ 
          position: 'absolute', 
          top: '4px', 
          bottom: '4px', 
          width: 'calc(50% - 4px)', 
          left: status === 'present' ? '4px' : status === 'absent' ? 'calc(50%)' : '4px',
          background: status === 'present' ? 'var(--success)' : status === 'absent' ? 'var(--error)' : 'transparent',
          borderRadius: '100px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: status === 'present' ? '0 0 15px rgba(16, 185, 129, 0.4)' : status === 'absent' ? '0 0 15px rgba(239, 68, 68, 0.4)' : 'none',
          zIndex: 1
        }} 
      />
      <button
        onClick={() => onToggle('present')}
        style={{
          flex: 1, border: 'none', background: 'transparent', color: status === 'present' ? 'white' : 'var(--text-muted)',
          fontSize: '11px', fontWeight: '700', zIndex: 2, cursor: 'pointer', outline: 'none', transition: 'color 0.3s ease'
        }}
      >
        PRESENT
      </button>
      <button
        onClick={() => onToggle('absent')}
        style={{
          flex: 1, border: 'none', background: 'transparent', color: status === 'absent' ? 'white' : 'var(--text-muted)',
          fontSize: '11px', fontWeight: '700', zIndex: 2, cursor: 'pointer', outline: 'none', transition: 'color 0.3s ease'
        }}
      >
        ABSENT
      </button>
    </div>
  )
}

const StatCard = ({ label, value, icon, color }: any) => (
  <motion.div whileHover={{ y: -5 }} className="glass-card" style={{ padding: '24px', borderLeft: `4px solid ${color}` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px' }}>{label.toUpperCase()}</p>
        <h3 style={{ fontSize: '28px', fontWeight: '800' }}>{value}</h3>
      </div>
      <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>{icon}</div>
    </div>
  </motion.div>
)

const SidebarItem = ({ icon, label, active, onClick }: any) => (
  <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', cursor: 'pointer', marginBottom: '4px', background: active ? 'rgba(255, 255, 255, 0.05)' : 'transparent', color: active ? 'var(--text-primary)' : 'var(--text-secondary)', border: active ? '1px solid var(--glass-border)' : '1px solid transparent', transition: '0.2s' }}>{icon}<span style={{ fontWeight: active ? '600' : '400', fontSize: '14px' }}>{label}</span></div>
)

export default TeacherDashboard
