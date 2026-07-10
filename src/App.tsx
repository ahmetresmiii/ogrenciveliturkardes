import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { 
  UserPlus, 
  FileText, 
  Calendar, 
  Clock, 
  Trash2, 
  ExternalLink, 
  GraduationCap, 
  Layers, 
  Video, 
  FileCheck, 
  ClipboardList, 
  TrendingUp, 
  LogOut, 
  Check, 
  ArrowRight,
  CalendarDays,
  FileSpreadsheet,
  Shield,
  Users,
  MonitorPlay,
  Heart,
  Lock,
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  FileUp,
  Award,
  Target,
  BookOpen,
  PenLine,
  Save,
  X,
  Database,
  Wifi
} from 'lucide-react';

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBqxSvtSrKLjb-0Yq91abjXhqPy8JIbSJs",
  authDomain: "veliogrenci-cce71.firebaseapp.com",
  projectId: "veliogrenci-cce71",
  storageBucket: "veliogrenci-cce71.firebasestorage.app",
  messagingSenderId: "1092640766125",
  appId: "1:1092640766125:web:c3b7c7dc99606515946e24",
  measurementId: "G-JQ5PGHB7K9"
};

// Initialize Firebase App & Firestore Database
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- DATA TYPE DEFINITIONS ---
interface Student {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  avatarSeed: string;
  createdAt: string;
  parentIds: string[];
  teacherNotes?: string;
}

interface Parent {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  linkedStudentIds: string[];
  createdAt: string;
}

interface DocumentItem {
  id: string;
  title: string;
  category: string;
  type: 'google-doc' | 'video' | 'link' | 'summary' | 'pdf';
  url: string;
  teacherNotes: string;
  createdAt: string;
  fileName?: string;
}

interface Assignment {
  id: string;
  studentId: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'Bekliyor' | 'Tamamlandı';
  studentNotes?: string;
  submissionUrl?: string;
  submittedAt?: string;
}

interface ExamItem {
  id: string;
  title: string;
  examUrl: string;
  description: string;
  category: string;
  createdAt: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  status: 'Planlandı' | 'Ders Yapıldı (Öğrenciden Düşüldü)';
  teacherSummary?: string;
  recordingUrl?: string;
  recordingTitle?: string;
}

const TEACHER_PASSWORD = 'Ahmos';

export default function App() {
  // --- STATE ---
  const [currentRole, setCurrentRole] = useState<'guest' | 'teacher' | 'student' | 'parent'>('guest');
  const [currentStudentUser, setCurrentStudentUser] = useState<Student | null>(null);
  const [currentParentUser, setCurrentParentUser] = useState<Parent | null>(null);

  // Connection alert feedback
  const [firebaseStatus, setFirebaseStatus] = useState<'Bağlanıyor' | 'Aktif (Canlı)' | 'Yerel Mod / Kurallar Bekleniyor'>('Bağlanıyor');

  // Core records
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Tab views
  const [teacherTab, setTeacherTab] = useState<'dashboard' | 'students' | 'parents' | 'documents' | 'assignments' | 'summaries' | 'calendar'>('dashboard');
  const [studentTab, setStudentTab] = useState<'dashboard' | 'documents' | 'assignments' | 'exams' | 'calendar'>('dashboard');
  const [parentTab, setParentTab] = useState<'dashboard' | 'student-status' | 'recordings' | 'calendar'>('dashboard');

  // Credentials
  const [teacherPass, setTeacherPass] = useState('');
  const [teacherError, setTeacherError] = useState('');

  // Form input states
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentUser, setNewStudentUser] = useState('');
  const [newStudentPass, setNewStudentPass] = useState('');
  const [newStudentNotes, setNewStudentNotes] = useState('');

  const [newParentName, setNewParentName] = useState('');
  const [newParentUser, setNewParentUser] = useState('');
  const [newParentPass, setNewParentPass] = useState('');
  const [newParentLinkedStudents, setNewParentLinkedStudents] = useState<string[]>([]);

  const [newCatName, setNewCatName] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('');
  const [docType, setDocType] = useState<'google-doc' | 'video' | 'link' | 'summary' | 'pdf'>('google-doc');
  const [docUrl, setDocUrl] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);

  const [assignStudentId, setAssignStudentId] = useState('all');
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');

  const [examTitle, setExamTitle] = useState('');
  const [examUrl, setExamUrl] = useState('');
  const [examDesc, setExamDesc] = useState('');
  const [examCat, setExamCat] = useState('Genel Deneme Sınavı');

  const [calTitle, setCalTitle] = useState('');
  const [calDate, setCalDate] = useState('');
  const [calTime, setCalTime] = useState('');
  const [calDesc, setCalDesc] = useState('');

  // Login forms
  const [studentLoginUser, setStudentLoginUser] = useState('');
  const [studentLoginPass, setStudentLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  const [parentLoginUser, setParentLoginUser] = useState('');
  const [parentLoginPass, setParentLoginPass] = useState('');
  const [parentLoginError, setParentLoginError] = useState('');

  // Modals / extra UI logic
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState<string | null>(null);
  const [studentSubmissionUrl, setStudentSubmissionUrl] = useState('');
  const [studentSubmissionNotes, setStudentSubmissionNotes] = useState('');

  const [expandedRecordingId, setExpandedRecordingId] = useState<string | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editNotesValue, setEditNotesValue] = useState('');

  // --- FIREBASE REALTIME LISTENERS & DUAL SYNC ---
  useEffect(() => {
    // Initial fallback load from LocalStorage to guarantee instant display
    const savedStudents = localStorage.getItem('derslink_students');
    const savedParents = localStorage.getItem('derslink_parents');
    const savedCategories = localStorage.getItem('derslink_categories');
    const savedDocs = localStorage.getItem('derslink_documents');
    const savedAssignments = localStorage.getItem('derslink_assignments');
    const savedExams = localStorage.getItem('derslink_exams');
    const savedEvents = localStorage.getItem('derslink_events');

    if (savedStudents) setStudents(JSON.parse(savedStudents));
    if (savedParents) setParents(JSON.parse(savedParents));
    
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    } else {
      const initialCats = ['Konu Özetleri', 'Konu Anlatılış Özetleri', 'Konu Anlatılış Videoları', 'Soru Çözüm Analizleri', 'PDF Dökümanlar'];
      setCategories(initialCats);
      localStorage.setItem('derslink_categories', JSON.stringify(initialCats));
    }

    if (savedDocs) setDocuments(JSON.parse(savedDocs));
    if (savedAssignments) setAssignments(JSON.parse(savedAssignments));
    if (savedExams) setExams(JSON.parse(savedExams));
    
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    } else {
      const initialEvents: CalendarEvent[] = [
        {
          id: 'evt-1',
          title: 'Matematik Fonksiyonlar Canlı Etüt',
          date: new Date().toISOString().split('T')[0],
          time: '16:30',
          description: 'Google Takvim entegrasyonu kapsamında tanımlanmış genel ders.',
          status: 'Planlandı'
        }
      ];
      setEvents(initialEvents);
      localStorage.setItem('derslink_events', JSON.stringify(initialEvents));
    }

    // --- SETUP REALTIME FIREBASE LISTENERS ---
    let unsubStudents: () => void = () => {};
    let unsubParents: () => void = () => {};
    let unsubCategories: () => void = () => {};
    let unsubDocs: () => void = () => {};
    let unsubAssignments: () => void = () => {};
    let unsubExams: () => void = () => {};
    let unsubEvents: () => void = () => {};

    try {
      unsubStudents = onSnapshot(collection(db, "students"), (snapshot) => {
        const items: Student[] = [];
        snapshot.forEach((docSnap) => items.push(docSnap.data() as Student));
        setStudents(items);
        localStorage.setItem('derslink_students', JSON.stringify(items));
        setFirebaseStatus('Aktif (Canlı)');
      }, (err) => {
        console.warn("Firebase okuma kuralları bekleniyor veya internet kısıtlı. Yerel veriler kullanılıyor.", err);
        setFirebaseStatus('Yerel Mod / Kurallar Bekleniyor');
      });

      unsubParents = onSnapshot(collection(db, "parents"), (snapshot) => {
        const items: Parent[] = [];
        snapshot.forEach((docSnap) => items.push(docSnap.data() as Parent));
        setParents(items);
        localStorage.setItem('derslink_parents', JSON.stringify(items));
      }, () => {});

      unsubCategories = onSnapshot(collection(db, "categories"), (snapshot) => {
        const items: string[] = [];
        snapshot.forEach((docSnap) => items.push(docSnap.data().name));
        if (items.length > 0) {
          setCategories(items);
          localStorage.setItem('derslink_categories', JSON.stringify(items));
        }
      }, () => {});

      unsubDocs = onSnapshot(collection(db, "documents"), (snapshot) => {
        const items: DocumentItem[] = [];
        snapshot.forEach((docSnap) => items.push(docSnap.data() as DocumentItem));
        setDocuments(items);
        localStorage.setItem('derslink_documents', JSON.stringify(items));
      }, () => {});

      unsubAssignments = onSnapshot(collection(db, "assignments"), (snapshot) => {
        const items: Assignment[] = [];
        snapshot.forEach((docSnap) => items.push(docSnap.data() as Assignment));
        setAssignments(items);
        localStorage.setItem('derslink_assignments', JSON.stringify(items));
      }, () => {});

      unsubExams = onSnapshot(collection(db, "exams"), (snapshot) => {
        const items: ExamItem[] = [];
        snapshot.forEach((docSnap) => items.push(docSnap.data() as ExamItem));
        setExams(items);
        localStorage.setItem('derslink_exams', JSON.stringify(items));
      }, () => {});

      unsubEvents = onSnapshot(collection(db, "events"), (snapshot) => {
        const items: CalendarEvent[] = [];
        snapshot.forEach((docSnap) => items.push(docSnap.data() as CalendarEvent));
        setEvents(items);
        localStorage.setItem('derslink_events', JSON.stringify(items));
      }, () => {});

    } catch (err) {
      console.warn("Firebase entegrasyonu başlatılırken uyarı oluştu, tam yedeklemeli çalışıyor.", err);
      setFirebaseStatus('Yerel Mod / Kurallar Bekleniyor');
    }

    return () => {
      unsubStudents();
      unsubParents();
      unsubCategories();
      unsubDocs();
      unsubAssignments();
      unsubExams();
      unsubEvents();
    };
  }, []);

  // --- WRITE WRAPPERS TO FIREBASE & LOCAL STORAGE (DUAL RESILIENCE) ---
  const saveDocToFirebase = async (collectionName: string, id: string, dataObj: any) => {
    try {
      await setDoc(doc(db, collectionName, id), dataObj);
    } catch (err) {
      console.warn(`Firebase yazma uyarısı (${collectionName}): veritabanı kuralları kilitli olabilir. Yerel senkronizasyon anında gerçekleştirildi.`);
    }
  };

  const deleteDocFromFirebase = async (collectionName: string, id: string) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (err) {
      console.warn(`Firebase silme uyarısı (${collectionName}). Yerel kopya temizlendi.`);
    }
  };

  // --- ACTIONS ---

  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherError('');
    if (teacherPass === TEACHER_PASSWORD) {
      setCurrentRole('teacher');
      setTeacherTab('dashboard');
      setTeacherPass('');
    } else {
      setTeacherError('Hatalı şifre! Lütfen doğru şifreyi girin.');
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !newStudentUser || !newStudentPass) {
      alert('Lütfen tüm öğrenci bilgilerini eksiksiz doldurun.');
      return;
    }
    if (students.some(s => s.username.toLowerCase() === newStudentUser.toLowerCase())) {
      alert('Bu kullanıcı adı zaten başka bir öğrenciye tanımlanmış.');
      return;
    }
    const newStudent: Student = {
      id: 'stud_' + Date.now(),
      name: newStudentName,
      username: newStudentUser.trim(),
      passwordHash: newStudentPass,
      avatarSeed: Math.floor(Math.random() * 100 + 1).toString(),
      createdAt: new Date().toLocaleDateString('tr-TR'),
      parentIds: [],
      teacherNotes: newStudentNotes || ''
    };

    // Optimistic dual update
    const updated = [...students, newStudent];
    setStudents(updated);
    localStorage.setItem('derslink_students', JSON.stringify(updated));
    await saveDocToFirebase("students", newStudent.id, newStudent);

    setNewStudentName('');
    setNewStudentUser('');
    setNewStudentPass('');
    setNewStudentNotes('');
    alert('Öğrenci başarıyla veritabanına kaydedildi!');
  };

  const handleDeleteStudent = async (id: string) => {
    if (window.confirm('Bu öğrenciyi ve kayıtları silmek istediğinize emin misiniz?')) {
      const updated = students.filter(s => s.id !== id);
      setStudents(updated);
      localStorage.setItem('derslink_students', JSON.stringify(updated));
      await deleteDocFromFirebase("students", id);

      // Clean assignments
      assignments.forEach(async (a) => {
        if (a.studentId === id) {
          await deleteDocFromFirebase("assignments", a.id);
        }
      });
      const updatedAssigns = assignments.filter(a => a.studentId !== id);
      setAssignments(updatedAssigns);
      localStorage.setItem('derslink_assignments', JSON.stringify(updatedAssigns));

      // Update linked parents
      parents.forEach(async (p) => {
        if (p.linkedStudentIds.includes(id)) {
          const updatedP = { ...p, linkedStudentIds: p.linkedStudentIds.filter(sid => sid !== id) };
          await saveDocToFirebase("parents", p.id, updatedP);
        }
      });
      const updatedParents = parents.map(p => ({
        ...p,
        linkedStudentIds: p.linkedStudentIds.filter(sid => sid !== id)
      }));
      setParents(updatedParents);
      localStorage.setItem('derslink_parents', JSON.stringify(updatedParents));
    }
  };

  const handleUpdateStudentNotes = async (studentId: string) => {
    const updated = students.map(s => {
      if (s.id === studentId) {
        return { ...s, teacherNotes: editNotesValue };
      }
      return s;
    });
    setStudents(updated);
    localStorage.setItem('derslink_students', JSON.stringify(updated));
    
    const target = updated.find(s => s.id === studentId);
    if (target) {
      await saveDocToFirebase("students", studentId, target);
    }

    setEditingStudentId(null);
    setEditNotesValue('');
    alert('Öğrenci notu güncellendi!');
  };

  const handleAddParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParentName || !newParentUser || !newParentPass) {
      alert('Lütfen tüm veli bilgilerini eksiksiz doldurun.');
      return;
    }
    if (parents.some(p => p.username.toLowerCase() === newParentUser.toLowerCase())) {
      alert('Bu kullanıcı adı zaten başka bir veliye tanımlanmış.');
      return;
    }
    const newParent: Parent = {
      id: 'parent_' + Date.now(),
      name: newParentName,
      username: newParentUser.trim(),
      passwordHash: newParentPass,
      linkedStudentIds: newParentLinkedStudents,
      createdAt: new Date().toLocaleDateString('tr-TR')
    };
    
    const updatedParents = [...parents, newParent];
    setParents(updatedParents);
    localStorage.setItem('derslink_parents', JSON.stringify(updatedParents));
    await saveDocToFirebase("parents", newParent.id, newParent);

    // Update students
    const updatedStudents = students.map(s => {
      if (newParentLinkedStudents.includes(s.id)) {
        return { ...s, parentIds: [...(s.parentIds || []), newParent.id] };
      }
      return s;
    });
    setStudents(updatedStudents);
    localStorage.setItem('derslink_students', JSON.stringify(updatedStudents));
    
    updatedStudents.forEach(async (s) => {
      if (newParentLinkedStudents.includes(s.id)) {
        await saveDocToFirebase("students", s.id, s);
      }
    });

    setNewParentName('');
    setNewParentUser('');
    setNewParentPass('');
    setNewParentLinkedStudents([]);
    alert('Veli başarıyla Firebase veritabanına kaydedildi!');
  };

  const handleDeleteParent = async (id: string) => {
    if (window.confirm('Bu veliyi silmek istediğinize emin misiniz?')) {
      const updatedParents = parents.filter(p => p.id !== id);
      setParents(updatedParents);
      localStorage.setItem('derslink_parents', JSON.stringify(updatedParents));
      await deleteDocFromFirebase("parents", id);

      const updatedStudents = students.map(s => ({
        ...s,
        parentIds: (s.parentIds || []).filter(pid => pid !== id)
      }));
      setStudents(updatedStudents);
      localStorage.setItem('derslink_students', JSON.stringify(updatedStudents));
      
      updatedStudents.forEach(async (s) => {
        await saveDocToFirebase("students", s.id, s);
      });
    }
  };

  const toggleParentStudentLink = (studentId: string) => {
    setNewParentLinkedStudents(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    if (categories.includes(newCatName.trim())) {
      alert('Bu kategori zaten mevcut.');
      return;
    }
    const updated = [...categories, newCatName.trim()];
    setCategories(updated);
    localStorage.setItem('derslink_categories', JSON.stringify(updated));
    await saveDocToFirebase("categories", newCatName.trim(), { name: newCatName.trim() });
    setNewCatName('');
  };

  const handleRemoveCategory = async (cat: string) => {
    if (window.confirm(`"${cat}" kategorisini silmek istiyor musunuz?`)) {
      const updated = categories.filter(c => c !== cat);
      setCategories(updated);
      localStorage.setItem('derslink_categories', JSON.stringify(updated));
      await deleteDocFromFirebase("categories", cat);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedPdfFile(e.target.files[0]);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeCategory = docCategory || categories[0] || 'Genel';
    if (!docTitle) {
      alert('Lütfen doküman başlığını girin.');
      return;
    }

    // Convert PDF to base64
    if (docType === 'pdf' && selectedPdfFile) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Url = event.target?.result as string;
        const newDoc: DocumentItem = {
          id: 'doc_' + Date.now(),
          title: docTitle,
          category: activeCategory,
          type: 'pdf',
          url: base64Url,
          teacherNotes: docNotes || 'PDF dokümanı',
          createdAt: new Date().toLocaleDateString('tr-TR'),
          fileName: selectedPdfFile?.name
        };
        const updated = [...documents, newDoc];
        setDocuments(updated);
        localStorage.setItem('derslink_documents', JSON.stringify(updated));
        await saveDocToFirebase("documents", newDoc.id, newDoc);

        setDocTitle('');
        setDocUrl('');
        setDocNotes('');
        setSelectedPdfFile(null);
        alert('PDF dosyası başarıyla Firebase veritabanına yüklendi!');
      };
      reader.readAsDataURL(selectedPdfFile);
      return;
    }

    if (!docUrl && docType !== 'pdf') {
      alert('Lütfen link adresini girin.');
      return;
    }

    const newDoc: DocumentItem = {
      id: 'doc_' + Date.now(),
      title: docTitle,
      category: activeCategory,
      type: docType,
      url: docUrl,
      teacherNotes: docNotes || 'Öğretmen not bırakmadı.',
      createdAt: new Date().toLocaleDateString('tr-TR')
    };
    const updated = [...documents, newDoc];
    setDocuments(updated);
    localStorage.setItem('derslink_documents', JSON.stringify(updated));
    await saveDocToFirebase("documents", newDoc.id, newDoc);

    setDocTitle('');
    setDocUrl('');
    setDocNotes('');
    setSelectedPdfFile(null);
    alert('Doküman başarıyla Firebase veritabanına eklendi!');
  };

  const handleDeleteDocument = async (id: string) => {
    if (window.confirm('Bu dokümanı silmek istediğinize emin misiniz?')) {
      const updated = documents.filter(d => d.id !== id);
      setDocuments(updated);
      localStorage.setItem('derslink_documents', JSON.stringify(updated));
      await deleteDocFromFirebase("documents", id);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTitle || !assignDueDate) {
      alert('Lütfen ödev başlığını ve son teslim tarihini belirleyin.');
      return;
    }
    const newAssign: Assignment = {
      id: 'assign_' + Date.now(),
      studentId: assignStudentId,
      title: assignTitle,
      description: assignDesc || 'Detaylı açıklama belirtilmedi.',
      dueDate: assignDueDate,
      status: 'Bekliyor'
    };
    const updated = [...assignments, newAssign];
    setAssignments(updated);
    localStorage.setItem('derslink_assignments', JSON.stringify(updated));
    await saveDocToFirebase("assignments", newAssign.id, newAssign);

    setAssignTitle('');
    setAssignDesc('');
    setAssignDueDate('');
    alert(assignStudentId === 'all' ? 'Ödev tüm öğrencilere iletildi!' : 'Ödev ilgili öğrenciye iletildi!');
  };

  const handleDeleteAssignment = async (id: string) => {
    if (window.confirm('Bu ödevi kaldırmak istiyor musunuz?')) {
      const updated = assignments.filter(a => a.id !== id);
      setAssignments(updated);
      localStorage.setItem('derslink_assignments', JSON.stringify(updated));
      await deleteDocFromFirebase("assignments", id);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle || !examUrl) {
      alert('Lütfen sınav adını ve linkini yazın.');
      return;
    }
    const newExam: ExamItem = {
      id: 'exam_' + Date.now(),
      title: examTitle,
      examUrl: examUrl,
      description: examDesc || 'Sınav süresi öğretmen tarafından yönetilir.',
      category: examCat,
      createdAt: new Date().toLocaleDateString('tr-TR')
    };
    const updated = [...exams, newExam];
    setExams(updated);
    localStorage.setItem('derslink_exams', JSON.stringify(updated));
    await saveDocToFirebase("exams", newExam.id, newExam);

    setExamTitle('');
    setExamUrl('');
    setExamDesc('');
    alert('Sınav bağlantısı oluşturuldu!');
  };

  const handleDeleteExam = async (id: string) => {
    if (window.confirm('Bu sınav linkini kaldırmak istiyor musunuz?')) {
      const updated = exams.filter(e => e.id !== id);
      setExams(updated);
      localStorage.setItem('derslink_exams', JSON.stringify(updated));
      await deleteDocFromFirebase("exams", id);
    }
  };

  const handleCreateCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calTitle || !calDate || !calTime) {
      alert('Lütfen ders adını, gününü ve saatini girin.');
      return;
    }
    const newEvt: CalendarEvent = {
      id: 'evt_' + Date.now(),
      title: calTitle,
      date: calDate,
      time: calTime,
      description: calDesc || 'Planlı Canlı Ders.',
      status: 'Planlandı'
    };
    const updated = [...events, newEvt];
    setEvents(updated);
    localStorage.setItem('derslink_events', JSON.stringify(updated));
    await saveDocToFirebase("events", newEvt.id, newEvt);

    setCalTitle('');
    setCalDate('');
    setCalTime('');
    setCalDesc('');
    alert('Ders takvime eklendi!');
  };

  const handleMarkLessonCompleted = async (id: string, notes: string, recordingUrl?: string) => {
    const updated = events.map(evt => {
      if (evt.id === id) {
        return {
          ...evt,
          status: 'Ders Yapıldı (Öğrenciden Düşüldü)' as const,
          teacherSummary: notes || 'Bu ders başarıyla tamamlandı.',
          recordingUrl: recordingUrl || undefined,
          recordingTitle: recordingUrl ? 'Canlı Ders Ekran Kaydı' : undefined
        };
      }
      return evt;
    });
    setEvents(updated);
    localStorage.setItem('derslink_events', JSON.stringify(updated));
    
    const changedEvt = updated.find(e => e.id === id);
    if (changedEvt) {
      await saveDocToFirebase("events", id, changedEvt);
    }
    alert('Ders yapıldı olarak tescillendi!');
  };

  const handleDeleteEvent = async (id: string) => {
    if (window.confirm('Bu takvim kaydını silmek istiyor musunuz?')) {
      const updated = events.filter(e => e.id !== id);
      setEvents(updated);
      localStorage.setItem('derslink_events', JSON.stringify(updated));
      await deleteDocFromFirebase("events", id);
    }
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!studentLoginUser || !studentLoginPass) {
      setLoginError('Kullanıcı adı ve şifre girin.');
      return;
    }
    const found = students.find(
      s => s.username.toLowerCase() === studentLoginUser.toLowerCase() && s.passwordHash === studentLoginPass
    );
    if (found) {
      setCurrentStudentUser(found);
      setCurrentRole('student');
      setStudentTab('dashboard');
    } else {
      setLoginError('Hatalı kullanıcı adı veya şifre!');
    }
  };

  const handleParentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setParentLoginError('');
    if (!parentLoginUser || !parentLoginPass) {
      setParentLoginError('Kullanıcı adı ve şifre girin.');
      return;
    }
    const found = parents.find(
      p => p.username.toLowerCase() === parentLoginUser.toLowerCase() && p.passwordHash === parentLoginPass
    );
    if (found) {
      setCurrentParentUser(found);
      setCurrentRole('parent');
      setParentTab('dashboard');
    } else {
      setParentLoginError('Hatalı kullanıcı adı veya şifre!');
    }
  };

  const handleStudentSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingAssignmentId) return;
    if (!studentSubmissionUrl) {
      alert('Google Doküman linkinizi girin.');
      return;
    }
    const updated = assignments.map(assign => {
      if (assign.id === submittingAssignmentId) {
        return {
          ...assign,
          status: 'Tamamlandı' as const,
          submissionUrl: studentSubmissionUrl,
          studentNotes: studentSubmissionNotes || 'Ödev tamamlandı.',
          submittedAt: new Date().toLocaleString('tr-TR')
        };
      }
      return assign;
    });
    setAssignments(updated);
    localStorage.setItem('derslink_assignments', JSON.stringify(updated));
    
const submittedObj = updated.find(a => a.id === submittingAssignmentId);
    if (submittedObj) {
      await saveDocToFirebase("assignments", submittedObj.id, submittedObj);
    setSubmittingAssignmentId(null);
    setStudentSubmissionUrl('');
    setStudentSubmissionNotes('');
    alert('Özetiniz başarıyla Firebase veritabanına ve öğretmeninize iletildi!');
  };

  const insertSampleGoogleDoc = (type: string) => {
    if (type === 'doc') {
      setDocUrl('https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUU96GPCE5AOPxXBXw7k/edit');
      if(!docTitle) setDocTitle('Matematik Konu Özeti');
    } else if (type === 'video') {
      setDocUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      if(!docTitle) setDocTitle('Fizik Anlatım Videosu');
    } else if (type === 'exam') {
      setExamUrl('https://docs.google.com/forms/d/e/1FAIpQLSfB_vEorI1L73A_DzkBvGQD_M2YV6m8A/viewform');
      if(!examTitle) setExamTitle('AYT Matematik Denemesi');
    }
  };

  const getLinkedStudents = (parent: Parent): Student[] => {
    return students.filter(s => parent.linkedStudentIds.includes(s.id));
  };

  const getStudentPerformance = (studentId: string) => {
    const studentAssignments = assignments.filter(a => a.studentId === studentId || a.studentId === 'all');
    const done = studentAssignments.filter(a => a.status === 'Tamamlandı').length;
    const pending = studentAssignments.filter(a => a.status === 'Bekliyor').length;
    const total = done + pending;
    const percentage = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, pending, total, percentage };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* HEADER WITH FIREBASE STATUS */}
      <header className="border-b border-slate-700/50 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setCurrentRole('guest'); setCurrentStudentUser(null); setCurrentParentUser(null); }}>
            <div className="bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-500 p-2.5 rounded-xl shadow-lg shadow-amber-500/20 text-white">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                DERSLİKE
              </span>
              <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">TÜRKÇE*Ahmet Şahin</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Realtime Firebase Badge indicator */}
            <div className={`hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${firebaseStatus === 'Aktif (Canlı)' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-300 border-amber-500/30'}`}>
              <Database className="h-3 w-3 animate-pulse" />
              <span>ÖĞRETMEN BAĞLANTI DURUMU: {firebaseStatus}</span>
            </div>

            {currentRole === 'teacher' && (
              <div className="flex items-center space-x-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 px-3 py-1.5 rounded-lg">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span className="text-xs font-semibold text-amber-300 flex items-center space-x-1">
                  <Shield className="h-3 w-3" />
                  <span>Öğretmen</span>
                </span>
                <button onClick={() => setCurrentRole('guest')} className="text-slate-400 hover:text-white transition-colors text-xs flex items-center space-x-1 pl-2 border-l border-slate-600">
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Çıkış</span>
                </button>
              </div>
            )}

            {currentRole === 'student' && currentStudentUser && (
              <div className="flex items-center space-x-3 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 text-white text-[10px] font-bold flex items-center justify-center">
                  {currentStudentUser.name.charAt(0)}
                </div>
                <span className="text-xs font-semibold text-emerald-300">{currentStudentUser.name}</span>
                <button onClick={() => { setCurrentRole('guest'); setCurrentStudentUser(null); }} className="text-slate-400 hover:text-white transition-colors text-xs flex items-center space-x-1 pl-2 border-l border-slate-600">
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Çıkış</span>
                </button>
              </div>
            )}

            {currentRole === 'parent' && currentParentUser && (
              <div className="flex items-center space-x-3 bg-gradient-to-r from-rose-500/20 to-pink-500/20 border border-rose-500/30 px-3 py-1.5 rounded-lg">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 text-white text-[10px] font-bold flex items-center justify-center">
                  <Heart className="h-3 w-3" />
                </div>
                <span className="text-xs font-semibold text-rose-300">{currentParentUser.name}</span>
                <button onClick={() => { setCurrentRole('guest'); setCurrentParentUser(null); }} className="text-slate-400 hover:text-white transition-colors text-xs flex items-center space-x-1 pl-2 border-l border-slate-600">
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Çıkış</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* GUEST / LOGIN SCREEN */}
        {currentRole === 'guest' && (
          <div className="max-w-5xl mx-auto space-y-12 py-6">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <div className="inline-flex bg-gradient-to-r from-emerald-500/20 via-pink-500/20 to-amber-500/20 text-emerald-300 text-xs px-4 py-1.5 rounded-full font-bold tracking-wide items-center space-x-2 border border-emerald-500/30">
                <Wifi className="h-3.5 w-3.5 animate-bounce" />
                <span>Firebase Bağlantı Modu: {firebaseStatus}</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                DİJİTAL EĞİTİM PLATFORMU <br/>
                <span className="bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">Sınıfım360</span>
              </h1>
              <p className="text-slate-400 text-base sm:text-lg">
                Gerçek zamanlı veritabanı senkronizasyonu, PDF yükleme, ekran kaydı ve ayrıcalıklı renkli portallar.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* TEACHER */}
              <div className="bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-amber-500/30 rounded-3xl p-6 relative overflow-hidden group hover:border-amber-500/60 transition-all flex flex-col justify-between shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                      <span>Öğretmen</span>
                      <span className="text-[10px] font-normal bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-bold">Şifreli</span>
                    </h2>
                    <p className="text-slate-400 text-xs mt-2">Öğrenci/veli kaydı, PDF yükleme, Firebase veri gönderimi.</p>
                  </div>
                  <form onSubmit={handleTeacherLogin} className="space-y-3 pt-2">
                    {teacherError && (
                      <div className="p-2 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg flex items-center space-x-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{teacherError}</span>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs text-slate-400 font-medium mb-1 flex items-center space-x-1">
                        <Lock className="h-3 w-3" />
                        <span>Şifre</span>
                      </label>
                      <input type="password" value={teacherPass} onChange={(e) => setTeacherPass(e.target.value)} placeholder="IŞIK SAÇAR" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2 cursor-pointer text-sm">
                      <span>Giriş Yap</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>

              {/* STUDENT */}
              <div className="bg-gradient-to-b from-slate-950 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Öğrenci</h2>
                    <p className="text-slate-400 text-xs mt-2">Eğitim süreçlerini tek bir merkezden yönetmek hiç bu kadar kolay olmamıştı. Öğretmenler,öğrenciler VE Veliler için özel olarak tasarlanan bu platform, Google ekosistemiyle tam uyumlu çalışarak kağıt karmaşasına son veriyor.</p>
                  </div>
                  <form onSubmit={handleStudentLogin} className="space-y-3 pt-2">
                    {loginError && (
                      <div className="p-2 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg">{loginError}</div>
                    )}
                    <div>
                      <label className="block text-xs text-slate-400 font-medium mb-1">Kullanıcı Adı</label>
                      <input type="text" value={studentLoginUser} onChange={(e) => setStudentLoginUser(e.target.value)} placeholder="Bilgi Arar" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-medium mb-1">Şifre</label>
                      <input type="password" value={studentLoginPass} onChange={(e) => setStudentLoginPass(e.target.value)} placeholder="••••" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
                    </div>
                    {students.length === 0 && (
                      <p className="text-[11px] text-amber-400/90 italic bg-slate-900 p-2 rounded-lg border border-slate-800">⚠️ Henüz öğrenci yok. Öğretmen eklemeli.</p>
                    )}
                    <button type="submit" disabled={students.length === 0} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center space-x-2 text-sm">
                      <span>Öğrenci Girişi</span>
                      <Check className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>

              {/* PARENT */}
              <div className="bg-gradient-to-b from-slate-950 to-slate-900 border border-rose-500/30 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-lg">
                    <Heart className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Veli</h2>
                    <p className="text-slate-400 text-xs mt-2">Canlı ders ekran kayıtları ve çocuk performansı.</p>
                  </div>
                  <form onSubmit={handleParentLogin} className="space-y-3 pt-2">
                    {parentLoginError && (
                      <div className="p-2 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg">{parentLoginError}</div>
                    )}
                    <div>
                      <label className="block text-xs text-slate-400 font-medium mb-1">Kullanıcı Adı</label>
                      <input type="text" value={parentLoginUser} onChange={(e) => setParentLoginUser(e.target.value)} placeholder="Kanat gerer." className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-medium mb-1">Şifre</label>
                      <input type="password" value={parentLoginPass} onChange={(e) => setParentLoginPass(e.target.value)} placeholder="••••" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500" />
                    </div>
                    {parents.length === 0 && (
                      <p className="text-[11px] text-amber-400/90 italic bg-slate-900 p-2 rounded-lg border border-slate-800">⚠️ Henüz veli yok. Öğretmen eklemeli.</p>
                    )}
                    <button type="submit" disabled={parents.length === 0} className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center space-x-2 text-sm">
                      <span>Veli Girişi</span>
                      <Check className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>

            </div>

            <div className="bg-slate-950/40 border border-slate-700/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center space-x-3 text-slate-400">
                <FileSpreadsheet className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <span><strong>Öğretmen Bağlısınız:</strong>   Ahmet ŞAHİN (<code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-200">veliogrenci-cce71</code>) ÖĞRETMENİM İYİ Kİ VAR..</span>
              </div>
              <div className="text-slate-500 font-mono text-[10px] whitespace-nowrap bg-slate-900 px-2 py-1 rounded">ÖZEL DERS</div>
            </div>
          </div>
        )}

        {/* TEACHER DASHBOARD */}
        {currentRole === 'teacher' && (
          <div className="space-y-8">
            <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-700/50 flex flex-wrap gap-1 backdrop-blur">
              <button onClick={() => setTeacherTab('dashboard')} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${teacherTab === 'dashboard' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <TrendingUp className="h-4 w-4" /><span>Genel Analiz</span>
              </button>
              <button onClick={() => setTeacherTab('students')} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${teacherTab === 'students' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <UserPlus className="h-4 w-4" /><span>Öğrenciler ({students.length})</span>
              </button>
              <button onClick={() => setTeacherTab('parents')} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${teacherTab === 'parents' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <Users className="h-4 w-4" /><span>Veliler ({parents.length})</span>
              </button>
              <button onClick={() => setTeacherTab('documents')} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${teacherTab === 'documents' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <FileText className="h-4 w-4" /><span>Dokümanlar ({documents.length})</span>
              </button>
              <button onClick={() => setTeacherTab('assignments')} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${teacherTab === 'assignments' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <ClipboardList className="h-4 w-4" /><span>Ödev & Sınav</span>
              </button>
              <button onClick={() => setTeacherTab('summaries')} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${teacherTab === 'summaries' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <FileCheck className="h-4 w-4" /><span>Özetler</span>
              </button>
              <button onClick={() => setTeacherTab('calendar')} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${teacherTab === 'calendar' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <CalendarDays className="h-4 w-4" /><span>Takvim</span>
              </button>
            </div>

            {teacherTab === 'dashboard' && (
              <div className="space-y-8 animate-fadeIn">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-5 rounded-2xl border border-amber-500/30 space-y-1">
                    <span className="text-slate-400 text-xs font-medium">Öğrenci</span>
                    <p className="text-3xl font-black text-amber-400">{students.length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 p-5 rounded-2xl border border-rose-500/30 space-y-1">
                    <span className="text-slate-400 text-xs font-medium">Veli</span>
                    <p className="text-3xl font-black text-rose-400">{parents.length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-5 rounded-2xl border border-blue-500/30 space-y-1">
                    <span className="text-slate-400 text-xs font-medium">Doküman</span>
                    <p className="text-3xl font-black text-blue-400">{documents.length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-5 rounded-2xl border border-emerald-500/30 space-y-1">
                    <span className="text-slate-400 text-xs font-medium">Teslim Edilen</span>
                    <p className="text-3xl font-black text-emerald-400">{assignments.filter(a => a.status === 'Tamamlandı').length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 p-5 rounded-2xl border border-purple-500/30 space-y-1">
                    <span className="text-slate-400 text-xs font-medium">Takvim Dersi</span>
                    <p className="text-3xl font-black text-purple-400">{events.length}</p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-700/50 space-y-4 backdrop-blur">
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-amber-400" />
                    <span>Öğrenci Performans Analizi</span>
                  </h3>
                  {students.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-slate-700 rounded-xl">
                      <UserPlus className="h-8 w-8 text-slate-600 mx-auto" />
                      <p className="text-sm text-slate-400 mt-2">Henüz öğrenci kaydedilmemiş.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {students.map(student => {
                        const perf = getStudentPerformance(student.id);
                        const linkedParent = parents.find(p => p.linkedStudentIds.includes(student.id));
                        return (
                          <div key={student.id} className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl border border-slate-700 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-400 to-orange-400 text-slate-950 font-bold flex items-center justify-center text-[10px]">
                                  {student.name.charAt(0)}
                                </div>
                                <span className="font-bold text-white">{student.name}</span>
                                <span className="text-[11px] text-slate-500">(@{student.username})</span>
                                {linkedParent && (
                                  <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/30 flex items-center space-x-1">
                                    <Heart className="h-2.5 w-2.5" />
                                    <span>{linkedParent.name}</span>
                                  </span>
                                )}
                              </div>
                              <div className="text-right space-x-2">
                                <span className="text-xs text-emerald-400 font-mono">{perf.done} Tamamlandı</span>
                                <span className="text-xs text-slate-400 font-mono">/ {perf.total}</span>
                              </div>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-700">
                              <div className="bg-gradient-to-r from-amber-500 via-pink-500 to-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(perf.percentage, 3)}%` }}></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span>Başarı Oranı: %{perf.percentage}</span>
                              <span>{perf.percentage === 100 ? '🔥 Eksiksiz' : perf.percentage > 50 ? '👍 İyi' : '⚠️ Takip'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {teacherTab === 'students' && (
              <div className="space-y-6 bg-slate-950/80 p-6 rounded-2xl border border-slate-700/50 backdrop-blur">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                    <UserPlus className="h-5 w-5 text-amber-400" />
                    <span>Öğrenci Kayıt ve Firebase Senkronizasyonu</span>
                  </h3>
                </div>
                <form onSubmit={handleAddStudent} className="p-4 bg-slate-900 rounded-xl border border-slate-700 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1.5">Ad Soyad</label>
                    <input type="text" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} placeholder="Ahmet Yılmaz" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1.5">Kullanıcı Adı</label>
                    <input type="text" value={newStudentUser} onChange={(e) => setNewStudentUser(e.target.value)} placeholder="ahmet123" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1.5">Şifre</label>
                    <input type="text" value={newStudentPass} onChange={(e) => setNewStudentPass(e.target.value)} placeholder="987654" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs cursor-pointer">Veritabanına Ekle</button>
                  </div>
                </form>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-300">Öğrenciler ({students.length})</h4>
                  {students.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 bg-slate-900/50 rounded-xl border border-dashed border-slate-700 text-xs">Henüz öğrenci yok.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300 bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
                        <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-700">
                          <tr>
                            <th className="p-3">Ad Soyad</th>
                            <th className="p-3">Kullanıcı Adı</th>
                            <th className="p-3">Şifre</th>
                            <th className="p-3">Bağlı Veli</th>
                            <th className="p-3">Öğrenci Hakkında Not</th>
                            <th className="p-3 text-right">Eylem</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                          {students.map(s => {
                            const linkedParent = parents.find(p => p.linkedStudentIds.includes(s.id));
                            return (
                              <tr key={s.id} className="hover:bg-slate-950/50 transition-colors">
                                <td className="p-3 font-bold text-white flex items-center space-x-2">
                                  <div className="w-5 h-5 rounded bg-gradient-to-br from-amber-400 to-orange-400 text-slate-950 font-bold flex items-center justify-center text-[9px]">{s.name.charAt(0)}</div>
                                  <span>{s.name}</span>
                                </td>
                                <td className="p-3 font-mono text-amber-300">{s.username}</td>
                                <td className="p-3 font-mono text-slate-300">{s.passwordHash}</td>
                                <td className="p-3">
                                  {linkedParent ? <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/30">{linkedParent.name}</span> : <span className="text-[10px] text-slate-500">-</span>}
                                </td>
                                <td className="p-3">
                                  {editingStudentId === s.id ? (
                                    <div className="flex items-center space-x-2">
                                      <input type="text" value={editNotesValue} onChange={(e) => setEditNotesValue(e.target.value)} className="bg-slate-950 text-xs text-white px-2 py-1 rounded border border-slate-600 w-48 focus:outline-none" />
                                      <button onClick={() => handleUpdateStudentNotes(s.id)} className="text-emerald-400 hover:text-emerald-300 font-bold"><Save className="h-4 w-4 inline" /></button>
                                      <button onClick={() => { setEditingStudentId(null); setEditNotesValue(''); }} className="text-slate-400 hover:text-white"><X className="h-4 w-4 inline" /></button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-slate-400 truncate max-w-xs">{s.teacherNotes || 'Not yazılmamış'}</span>
                                      <button onClick={() => { setEditingStudentId(s.id); setEditNotesValue(s.teacherNotes || ''); }} className="text-amber-400 hover:text-amber-300"><PenLine className="h-3.5 w-3.5" /></button>
                                    </div>
                                  )}
                                </td>
                                <td className="p-3 text-right">
                                  <button onClick={() => handleDeleteStudent(s.id)} className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-500/10 cursor-pointer"><Trash2 className="h-4 w-4 inline" /></button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {teacherTab === 'parents' && (
              <div className="space-y-6 bg-slate-950/80 p-6 rounded-2xl border border-slate-700/50 backdrop-blur">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                    <Users className="h-5 w-5 text-rose-400" />
                    <span>Veli Kayıt ve Öğrenci Eşleştirme</span>
                  </h3>
                </div>
                <form onSubmit={handleAddParent} className="p-4 bg-slate-900 rounded-xl border border-slate-700 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1.5">Ad Soyad</label>
                      <input type="text" value={newParentName} onChange={(e) => setNewParentName(e.target.value)} placeholder="Ayşe Yılmaz" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1.5">Kullanıcı Adı</label>
                      <input type="text" value={newParentUser} onChange={(e) => setNewParentUser(e.target.value)} placeholder="veli_ayse" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1.5">Şifre</label>
                      <input type="text" value={newParentPass} onChange={(e) => setNewParentPass(e.target.value)} placeholder="veli123" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">Eşleştirilecek Öğrenciler</label>
                    {students.length === 0 ? (
                      <p className="text-xs text-slate-500 bg-slate-950 p-3 rounded-lg border border-slate-700">Önce öğrenci kaydedin.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {students.map(s => (
                          <button key={s.id} type="button" onClick={() => toggleParentStudentLink(s.id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${newParentLinkedStudents.includes(s.id) ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-rose-500' : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-rose-500/50'}`}>
                            {newParentLinkedStudents.includes(s.id) && '✓ '}{s.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <button type="submit" className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold px-6 py-2 rounded-lg text-xs transition-colors cursor-pointer">Firebase'e Kaydet</button>
                  </div>
                </form>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-300">Veliler ({parents.length})</h4>
                  {parents.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 bg-slate-900/50 rounded-xl border border-dashed border-slate-700 text-xs">Henüz veli yok.</div>
                  ) : (
                    <div className="space-y-3">
                      {parents.map(p => {
                        const linkedStudents = getLinkedStudents(p);
                        return (
                          <div key={p.id} className="p-4 bg-slate-900 rounded-xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-rose-400 to-pink-400 text-white font-bold flex items-center justify-center text-[10px]"><Heart className="h-3 w-3" /></div>
                                <span className="font-bold text-white text-sm">{p.name}</span>
                                <span className="text-[11px] text-slate-500">(@{p.username})</span>
                              </div>
                              <div className="flex items-center space-x-2 text-xs text-slate-400">
                                <span>Şifre: <code className="text-rose-300">{p.passwordHash}</code></span>
                                <span>|</span>
                                <span>Kayıt: {p.createdAt}</span>
                              </div>
                              <div className="flex items-center space-x-1 flex-wrap gap-1 mt-1">
                                <span className="text-[10px] text-slate-400">Öğrenciler:</span>
                                {linkedStudents.length > 0 ? linkedStudents.map(s => (
                                  <span key={s.id} className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">{s.name}</span>
                                )) : <span className="text-[10px] text-slate-500">Yok</span>}
                              </div>
                            </div>
                            <button onClick={() => handleDeleteParent(p.id)} className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-500/10 cursor-pointer self-end"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {teacherTab === 'documents' && (
              <div className="space-y-6 bg-slate-950/80 p-6 rounded-2xl border border-slate-700/50 backdrop-blur">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-4 border-b border-slate-700">
                  <div className="lg:col-span-2 space-y-1">
                    <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-amber-400" />
                      <span>Doküman & PDF Direkt Firebase Yükleme</span>
                    </h3>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 space-y-2">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase">Yeni Kategori Ekle</label>
                    <form onSubmit={handleAddCategory} className="flex space-x-1">
                      <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Kategori" className="bg-slate-950 text-xs text-white px-2 py-1.5 rounded border border-slate-700 w-full focus:outline-none focus:border-amber-500" />
                      <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs px-2.5 rounded font-bold border border-amber-500/30 cursor-pointer">+</button>
                    </form>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {categories.map(c => (
                        <span key={c} className="text-[10px] bg-slate-950 text-slate-300 px-2 py-0.5 rounded flex items-center space-x-1 border border-slate-700">
                          <span>{c}</span>
                          <button type="button" onClick={() => handleRemoveCategory(c)} className="text-rose-400 font-bold hover:text-rose-300 pl-1">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleAddDocument} className="bg-slate-900 p-5 rounded-xl border border-slate-700 space-y-4">
                  <h4 className="text-sm font-bold text-amber-400">Doküman Detay Formu</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Başlık</label>
                      <input type="text" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="Doküman başlığı" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Kategori</label>
                      <select value={docCategory} onChange={(e) => setDocCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500">
                        <option value="">-- Seçiniz --</option>
                        {categories.map(c => (<option key={c} value={c}>{c}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Tip</label>
                      <select value={docType} onChange={(e) => setDocType(e.target.value as typeof docType)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500">
                        <option value="google-doc">📝 Google Doc</option>
                        <option value="video">🎥 Video</option>
                        <option value="pdf">📄 PDF Dosyası (Doğrudan Yükle)</option>
                        <option value="summary">📚 Özet</option>
                        <option value="link">🌐 Diğer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {docType === 'pdf' ? 'PDF Dosyası Seç' : 'URL / Link'}
                      </label>
                      {docType === 'pdf' ? (
                        <input type="file" accept=".pdf" onChange={handleFileChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500" />
                      ) : (
                        <input type="text" value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="https://..." className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 text-amber-300" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 bg-slate-950 p-2 rounded-lg text-xs">
                    <span className="text-slate-400 font-semibold">⚡ Hızlı Şablonlar:</span>
                    <button type="button" onClick={() => { setDocType('google-doc'); insertSampleGoogleDoc('doc'); }} className="bg-slate-800 hover:bg-slate-700 text-amber-400 px-2 py-1 rounded border border-slate-700">Google Doc Linki</button>
                    <button type="button" onClick={() => { setDocType('video'); insertSampleGoogleDoc('video'); }} className="bg-slate-800 hover:bg-slate-700 text-purple-400 px-2 py-1 rounded border border-slate-700">Video Linki</button>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Notlar</label>
                    <textarea value={docNotes} onChange={(e) => setDocNotes(e.target.value)} placeholder="Öğrenciye talimatlar..." rows={2} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500" />
                  </div>
                  <div className="text-right">
                    <button type="submit" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold px-6 py-2 rounded-lg text-xs transition-colors cursor-pointer">Firebase'e Yayınla</button>
                  </div>
                </form>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-300">Yüklenen Dokümanlar</h4>
                  {documents.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-dashed border-slate-700 text-xs">Henüz doküman yok.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {documents.map(doc => (
                        <div key={doc.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-3 flex flex-col justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 font-bold px-2 py-0.5 rounded border border-amber-500/30">{doc.category}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{doc.createdAt}</span>
                            </div>
                            <h5 className="text-sm font-bold text-white pt-1 flex items-center space-x-2">
                              {doc.type === 'pdf' && <FileUp className="h-4 w-4 text-red-400" />}
                              {doc.type === 'google-doc' && <FileText className="h-4 w-4 text-blue-400" />}
                              {doc.type === 'video' && <Video className="h-4 w-4 text-purple-400" />}
                              <span>{doc.title}</span>
                            </h5>
                            {doc.fileName && <p className="text-[10px] text-amber-300">📄 {doc.fileName}</p>}
                            <p className="text-xs text-slate-400 italic bg-slate-950/40 p-2 rounded border border-slate-700/60 mt-1 line-clamp-2">{doc.teacherNotes}</p>
                          </div>
                          <div className="pt-2 flex items-center justify-between border-t border-slate-700 text-xs">
                            <a href={doc.url} target={doc.type !== 'pdf' ? '_blank' : undefined} download={doc.type === 'pdf' ? doc.fileName || 'dokuman.pdf' : undefined} rel="noreferrer" className="text-amber-400 hover:underline flex items-center space-x-1 font-semibold">
                              <span>{doc.type === 'pdf' ? 'İndir / Aç' : 'Aç'}</span><ExternalLink className="h-3 w-3" />
                            </a>
                            <button onClick={() => handleDeleteDocument(doc.id)} className="text-rose-400 hover:text-rose-300 font-semibold flex items-center space-x-1">
                              <Trash2 className="h-3 w-3" /><span>Sil</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {teacherTab === 'assignments' && (
              <div className="space-y-8 animate-fadeIn">
                <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-700/50 space-y-4 backdrop-blur">
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <ClipboardList className="h-5 w-5 text-amber-400" />
                    <span>Ödev Dağıtımı</span>
                  </h3>
                  <form onSubmit={handleCreateAssignment} className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Öğrenci</label>
                        <select value={assignStudentId} onChange={(e) => setAssignStudentId(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500">
                          <option value="all">📢 TÜM ÖĞRENCİLER</option>
                          {students.map(s => (<option key={s.id} value={s.id}>👤 {s.name}</option>))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Başlık</label>
                        <input type="text" value={assignTitle} onChange={(e) => setAssignTitle(e.target.value)} placeholder="Ödev başlığı" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Son Tarih</label>
                        <input type="date" value={assignDueDate} onChange={(e) => setAssignDueDate(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 text-amber-400" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Talimatlar</label>
                      <textarea value={assignDesc} onChange={(e) => setAssignDesc(e.target.value)} placeholder="Detaylar..." rows={2} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500" />
                    </div>
                    <div className="text-right">
                      <button type="submit" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold px-5 py-2 rounded-lg text-xs cursor-pointer">Firebase'e Dağıt</button>
                    </div>
                  </form>
                </div>

                <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-700/50 space-y-4 backdrop-blur">
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <Layers className="h-5 w-5 text-blue-400" />
                    <span>Sınav Linkleri</span>
                  </h3>
                  <form onSubmit={handleCreateExam} className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Sınav Adı</label>
                        <input type="text" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} placeholder="Sınav başlığı" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Kategori</label>
                        <input type="text" value={examCat} onChange={(e) => setExamCat(e.target.value)} placeholder="Deneme" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Link</label>
                        <input type="text" value={examUrl} onChange={(e) => setExamUrl(e.target.value)} placeholder="https://..." className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 text-blue-400" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <button type="button" onClick={() => insertSampleGoogleDoc('exam')} className="text-xs text-blue-400 hover:underline">⚡ Örnek Forms</button>
                      <button type="submit" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold px-5 py-2 rounded-lg text-xs cursor-pointer">Yayına Al</button>
                    </div>
                  </form>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-700 space-y-3 backdrop-blur">
                    <h4 className="text-sm font-bold text-slate-200">Ödevler</h4>
                    {assignments.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">Ödev yok.</p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {assignments.map(a => {
                          const targetStudent = students.find(s => s.id === a.studentId);
                          return (
                            <div key={a.id} className="p-2.5 bg-slate-900 rounded-lg text-xs border border-slate-700 flex items-center justify-between">
                              <div>
                                <p className="font-bold text-white">{a.title}</p>
                                <p className="text-[10px] text-slate-400">Kime: {a.studentId === 'all' ? 'Tüm Sınıf' : targetStudent?.name}</p>
                                <p className="text-[10px] text-amber-400">Son: {a.dueDate}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-0.5 rounded text-[9px] ${a.status === 'Tamamlandı' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{a.status}</span>
                                <button onClick={() => handleDeleteAssignment(a.id)} className="text-rose-400 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-700 space-y-3 backdrop-blur">
                    <h4 className="text-sm font-bold text-slate-200">Sınavlar</h4>
                    {exams.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">Sınav yok.</p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {exams.map(e => (
                          <div key={e.id} className="p-2.5 bg-slate-900 rounded-lg text-xs border border-slate-700 flex items-center justify-between">
                            <div>
                              <p className="font-bold text-white">{e.title}</p>
                              <p className="text-[10px] text-slate-400">{e.category}</p>
                            </div>
                            <button onClick={() => handleDeleteExam(e.id)} className="text-rose-400 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {teacherTab === 'summaries' && (
              <div className="space-y-6 bg-slate-950/80 p-6 rounded-2xl border border-slate-700/50 backdrop-blur">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <FileCheck className="h-5 w-5 text-emerald-400" />
                  <span>Gelen Özetler</span>
                </h3>
                {assignments.filter(a => a.status === 'Tamamlandı').length === 0 ? (
                  <div className="p-12 text-center text-slate-500 bg-slate-900/50 rounded-xl border border-dashed border-slate-700">
                    <Clock className="h-8 w-8 text-slate-700 mx-auto" />
                    <p className="text-sm mt-2">Henüz özet yok.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignments.filter(a => a.status === 'Tamamlandı').map(item => {
                      const studentInfo = students.find(s => s.id === item.studentId);
                      return (
                        <div key={item.id} className="p-5 bg-slate-900 rounded-xl border border-slate-700 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-2">
                            <div>
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold uppercase mr-2">Teslim Edildi</span>
                              <strong className="text-xs text-white">{studentInfo?.name || 'Genel'}</strong>
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">{item.submittedAt}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white">{item.title}</h4>
                          <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded border border-slate-700">{item.studentNotes}</p>
                          <a href={item.submissionUrl} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline text-xs flex items-center space-x-1">
                            <span>{item.submissionUrl}</span><ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {teacherTab === 'calendar' && (
              <div className="space-y-6 bg-slate-950/80 p-6 rounded-2xl border border-slate-700/50 backdrop-blur">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-purple-400" />
                    <span>Takvim & Kayıtlar</span>
                  </h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-4">
                    <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Yeni Ders</h4>
                    <form onSubmit={handleCreateCalendarEvent} className="space-y-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Başlık</label>
                        <input type="text" value={calTitle} onChange={(e) => setCalTitle(e.target.value)} placeholder="Ders adı" className="w-full bg-slate-950 text-xs text-white p-2 rounded border border-slate-700 focus:border-purple-500 focus:outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Tarih</label>
                          <input type="date" value={calDate} onChange={(e) => setCalDate(e.target.value)} className="w-full bg-slate-950 text-xs text-amber-400 p-2 rounded border border-slate-700 focus:border-purple-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Saat</label>
                          <input type="time" value={calTime} onChange={(e) => setCalTime(e.target.value)} className="w-full bg-slate-950 text-xs text-white p-2 rounded border border-slate-700 focus:border-purple-500 focus:outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Detay</label>
                        <textarea value={calDesc} onChange={(e) => setCalDesc(e.target.value)} placeholder="Detaylar..." rows={2} className="w-full bg-slate-950 text-xs text-white p-2 rounded border border-slate-700 focus:border-purple-500 focus:outline-none" />
                      </div>
                      <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white text-xs font-bold py-2 rounded-lg cursor-pointer">Firebase Takvime Ekle</button>
                    </form>
                  </div>
                  <div className="lg:col-span-2 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Dersler</h4>
                    {events.length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center">Ders yok.</p>
                    ) : (
                      <div className="space-y-3">
                        {events.map(evt => (
                          <div key={evt.id} className={`p-4 rounded-xl border transition-all ${evt.status.includes('Ders Yapıldı') ? 'bg-slate-900/40 border-slate-700 opacity-70' : 'bg-slate-900 border-purple-500/30'}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <span className={`text-[9px] px-2 py-0.5 rounded font-bold mr-2 ${evt.status.includes('Ders Yapıldı') ? 'bg-slate-950 text-slate-400' : 'bg-purple-500/20 text-purple-300'}`}>{evt.status}</span>
                                <span className="text-xs font-mono text-slate-400">{evt.date} @ {evt.time}</span>
                              </div>
                              <button onClick={() => handleDeleteEvent(evt.id)} className="text-slate-500 hover:text-rose-400 text-xs">Sil</button>
                            </div>
                            <h5 className="text-sm font-bold text-white mt-1">{evt.title}</h5>
                            <p className="text-xs text-slate-400 mt-1">{evt.description}</p>
                            {evt.recordingUrl && (
                              <div className="mt-2 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-xs flex items-center space-x-2">
                                <MonitorPlay className="h-4 w-4 text-blue-400" />
                                <a href={evt.recordingUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center space-x-1">
                                  <span>Kayıt Linki</span><ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            )}
                            {evt.status === 'Planlandı' && (
                              <div className="mt-3 pt-3 border-t border-slate-700 bg-slate-950 p-2.5 rounded-lg space-y-2">
                                <p className="text-[11px] text-amber-400 font-semibold">⚡ Tamamla & İşle:</p>
                                <div className="space-y-2">
                                  <input type="text" id={`notes-${evt.id}`} placeholder="Öğretmen notu..." className="bg-slate-900 text-xs text-white p-1.5 rounded border border-slate-700 w-full focus:outline-none" />
                                  <div className="flex items-center space-x-2">
                                    <input type="text" id={`rec-${evt.id}`} placeholder="Kayıt linki (opsiyonel)..." className="bg-slate-900 text-xs text-blue-300 p-1.5 rounded border border-slate-700 w-full focus:outline-none" />
                                    <button onClick={() => { const n = document.getElementById(`notes-${evt.id}`) as HTMLInputElement; const r = document.getElementById(`rec-${evt.id}`) as HTMLInputElement; handleMarkLessonCompleted(evt.id, n?.value, r?.value || undefined); }} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-[11px] px-3 py-1.5 rounded-md whitespace-nowrap">✓ Yapıldı</button>
                                  </div>
                                </div>
                              </div>
                            )}
                            {evt.teacherSummary && (
                              <div className="mt-2 text-[11px] bg-slate-950 p-2 rounded text-emerald-300 border border-emerald-500/10">
                                <strong>Not:</strong> {evt.teacherSummary}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* STUDENT DASHBOARD - COLORFUL, NO RECORDINGS */}
        {currentRole === 'student' && currentStudentUser && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 rounded-3xl shadow-xl border border-emerald-400/30 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="space-y-2 relative z-10">
                <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur">Öğrenci Paneli</span>
                <h2 className="text-2xl sm:text-3xl font-black">Hoş Geldin, {currentStudentUser.name}! 🎉</h2>
                <p className="text-emerald-100 text-xs sm:text-sm max-w-2xl">Ödevlerin, PDF dokümanların ve sınavların seni bekliyor!</p>
              </div>
            </div>

            <div className="bg-slate-950/80 p-1.5 rounded-xl border border-slate-700/50 flex flex-wrap gap-1 backdrop-blur">
              <button onClick={() => setStudentTab('dashboard')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${studentTab === 'dashboard' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>🏠 Ana Sayfa</button>
              <button onClick={() => setStudentTab('documents')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${studentTab === 'documents' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>📚 Dokümanlar ({documents.length})</button>
              <button onClick={() => setStudentTab('assignments')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${studentTab === 'assignments' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>📝 Ödevlerim ({assignments.filter(a => (a.studentId === currentStudentUser.id || a.studentId === 'all') && a.status === 'Bekliyor').length})</button>
              <button onClick={() => setStudentTab('exams')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${studentTab === 'exams' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>🎯 Sınavlar ({exams.length})</button>
              <button onClick={() => setStudentTab('calendar')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${studentTab === 'calendar' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>📅 Takvim</button>
            </div>

            {studentTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="bg-slate-950/80 p-6 rounded-2xl border border-emerald-500/30 space-y-4 backdrop-blur">
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <Award className="h-5 w-5 text-amber-400" />
                    <span>📌 Son Derslerimiz & Öneriler</span>
                  </h3>
                  {events.filter(e => e.status.includes('Ders Yapıldı')).length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">Henüz tamamlanmış ders yok.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {events.filter(e => e.status.includes('Ders Yapıldı')).map(evt => (
                        <div key={evt.id} className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 rounded-xl border border-emerald-500/20 space-y-3">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/30">✓ İŞLENDİ</span>
                            <span className="text-slate-400 font-mono">{evt.date}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white">{evt.title}</h4>
                          {evt.teacherSummary && (
                            <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-xs">
                              <span className="font-bold text-emerald-300">💡 Öneri:</span>
                              <p className="text-slate-300 mt-1">{evt.teacherSummary}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4 rounded-xl border border-amber-500/30 space-y-3 backdrop-blur">
                    <h4 className="text-xs font-bold text-amber-300 uppercase flex items-center space-x-2"><Target className="h-4 w-4" /><span>Bekleyen Ödevler</span></h4>
                    {assignments.filter(a => (a.studentId === currentStudentUser.id || a.studentId === 'all') && a.status === 'Bekliyor').length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">Bekleyen ödev yok! 🎉</p>
                    ) : (
                      <div className="space-y-2">
                        {assignments.filter(a => (a.studentId === currentStudentUser.id || a.studentId === 'all') && a.status === 'Bekliyor').map(a => (
                          <div key={a.id} className="p-2 bg-slate-900 rounded border border-slate-700 text-xs">
                            <p className="font-bold text-white">{a.title}</p>
                            <p className="text-[10px] text-amber-400">Son: {a.dueDate}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-4 rounded-xl border border-blue-500/30 space-y-3 backdrop-blur">
                    <h4 className="text-xs font-bold text-blue-300 uppercase flex items-center space-x-2"><BookOpen className="h-4 w-4" /><span>Son Dokümanlar</span></h4>
                    {documents.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">Doküman yok.</p>
                    ) : (
                      <div className="space-y-2">
                        {documents.slice(-3).map(doc => (
                          <div key={doc.id} className="p-2 bg-slate-900 rounded border border-slate-700 text-xs flex items-center justify-between">
                            <p className="font-bold text-slate-200 truncate max-w-[120px]">{doc.title}</p>
                            <a href={doc.url} target={doc.type !== 'pdf' ? '_blank' : undefined} download={doc.type === 'pdf' ? doc.fileName || 'dokuman.pdf' : undefined} rel="noreferrer" className="text-xs text-blue-400 hover:underline">Aç ↗</a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 p-4 rounded-xl border border-purple-500/30 space-y-3 backdrop-blur">
                    <h4 className="text-xs font-bold text-purple-300 uppercase flex items-center space-x-2"><Calendar className="h-4 w-4" /><span>Gelecek Dersler</span></h4>
                    {events.filter(e => e.status === 'Planlandı').length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">Planlı ders yok.</p>
                    ) : (
                      <div className="space-y-2">
                        {events.filter(e => e.status === 'Planlandı').map(e => (
                          <div key={e.id} className="p-2 bg-slate-900 rounded border border-slate-700 text-xs">
                            <p className="font-bold text-purple-300">{e.title}</p>
                            <p className="text-[10px] text-slate-400">{e.date} - {e.time}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {studentTab === 'documents' && (
              <div className="space-y-6 bg-slate-950/80 p-6 rounded-2xl border border-slate-700/50 backdrop-blur">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-amber-400" />
                  <span>📚 Ders Kitaplığı</span>
                </h3>
                {documents.length === 0 ? (
                  <p className="text-xs text-slate-500 py-8 text-center">Doküman yok.</p>
                ) : (
                  <div className="space-y-8">
                    {categories.map(cat => {
                      const catDocs = documents.filter(d => d.category === cat);
                      if (catDocs.length === 0) return null;
                      return (
                        <div key={cat} className="space-y-3">
                          <h4 className="text-xs font-bold text-amber-400 bg-slate-900 px-3 py-1 rounded-md inline-block border border-amber-500/30">📁 {cat} ({catDocs.length})</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {catDocs.map(doc => (
                              <div key={doc.id} className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col justify-between space-y-3">
                                <div>
                                  <span className="text-[9px] font-bold text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-700">{doc.type === 'pdf' ? '📄 PDF' : doc.type === 'google-doc' ? '📝 Google Doc' : doc.type === 'video' ? '🎥 Video' : '📚 Not'}</span>
                                  <h5 className="text-sm font-bold text-white mt-1.5">{doc.title}</h5>
                                  {doc.fileName && <p className="text-[10px] text-amber-300">📄 {doc.fileName}</p>}
                                  <p className="text-xs text-slate-400 bg-slate-950 p-2 rounded border border-slate-700/60 mt-2 line-clamp-3">{doc.teacherNotes}</p>
                                </div>
                                <a href={doc.url} target={doc.type !== 'pdf' ? '_blank' : undefined} download={doc.type === 'pdf' ? doc.fileName || 'dokuman.pdf' : undefined} rel="noreferrer" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 text-xs px-3 py-1.5 rounded-lg font-bold inline-flex items-center space-x-1 border border-amber-500/30 self-end">
                                  <span>{doc.type === 'pdf' ? 'İndir' : 'Aç'}</span><ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {studentTab === 'assignments' && (
              <div className="space-y-6 bg-slate-950/80 p-6 rounded-2xl border border-slate-700/50 backdrop-blur">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <ClipboardList className="h-5 w-5 text-amber-400" />
                  <span>📝 Ödevlerim</span>
                </h3>
                {submittingAssignmentId && (
                  <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4 rounded-xl border-2 border-amber-500/40 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-amber-400">✍️ Ödev Teslim</h4>
                      <button onClick={() => setSubmittingAssignmentId(null)} className="text-slate-400 hover:text-white text-xs bg-slate-950 px-2 py-0.5 rounded">Vazgeç</button>
                    </div>
                    <form onSubmit={handleStudentSubmitHomework} className="space-y-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Google Doküman Linkiniz</label>
                        <input type="text" required value={studentSubmissionUrl} onChange={(e) => setStudentSubmissionUrl(e.target.value)} placeholder="https://docs.google.com/..." className="w-full bg-slate-950 text-xs text-white p-2 rounded border border-slate-700 focus:border-emerald-400 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Notunuz</label>
                        <textarea value={studentSubmissionNotes} onChange={(e) => setStudentSubmissionNotes(e.target.value)} placeholder="Notlar..." rows={2} className="w-full bg-slate-950 text-xs text-white p-2 rounded border border-slate-700 focus:border-emerald-400 focus:outline-none" />
                      </div>
                      <button type="submit" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold px-4 py-2 rounded text-xs cursor-pointer">Firebase'e Gönder</button>
                    </form>
                  </div>
                )}
                <div className="space-y-3">
                  {assignments.filter(a => a.studentId === currentStudentUser.id || a.studentId === 'all').length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">Ödev yok.</p>
                  ) : (
                    assignments.filter(a => a.studentId === currentStudentUser.id || a.studentId === 'all').map(assign => (
                      <div key={assign.id} className="p-4 bg-slate-900 rounded-xl border border-slate-700 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className={`px-2 py-0.5 rounded font-bold ${assign.status === 'Tamamlandı' ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30'}`}>{assign.status}</span>
                          <span className="text-slate-400 font-mono">Son: {assign.dueDate}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{assign.title}</h4>
                        <p className="text-xs text-slate-400 italic bg-slate-950/50 p-2 rounded border border-slate-700">{assign.description}</p>
                        {assign.status === 'Bekliyor' && (
                          <div className="pt-2 text-right">
                            <button onClick={() => { setSubmittingAssignmentId(assign.id); setStudentSubmissionUrl('https://docs.google.com/document/d/...'); }} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold px-3 py-1.5 rounded text-xs cursor-pointer">✍️ Teslim Et</button>
                          </div>
                        )}
                        {assign.status === 'Tamamlandı' && (
                          <div className="pt-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-2 rounded text-[11px] text-emerald-400 border border-emerald-500/20">✓ Tamamlandı - {assign.submittedAt}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {studentTab === 'exams' && (
              <div className="space-y-6 bg-slate-950/80 p-6 rounded-2xl border border-slate-700/50 backdrop-blur">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-400" />
                  <span>🎯 Sınav Merkezi</span>
                </h3>
                {exams.length === 0 ? (
                  <p className="text-xs text-slate-500 py-8 text-center">Aktif sınav yok.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {exams.map(ex => (
                      <div key={ex.id} className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 rounded-xl border border-slate-700 space-y-3">
                        <span className="text-[10px] bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded font-bold">{ex.category}</span>
                        <h4 className="text-sm font-bold text-white">{ex.title}</h4>
                        <p className="text-xs text-slate-400">{ex.description}</p>
                        <a href={ex.examUrl} target="_blank" rel="noreferrer" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors inline-flex items-center space-x-1">
                          <span>Sınava Gir</span><ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {studentTab === 'calendar' && (
              <div className="space-y-6 bg-slate-950/80 p-6 rounded-2xl border border-slate-700/50 backdrop-blur">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-purple-400" />
                  <span>📅 Ders Programı</span>
                </h3>
                {events.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">Takvim boş.</p>
                ) : (
                  <div className="space-y-3">
                    {events.map(e => (
                      <div key={e.id} className="p-3.5 bg-slate-900 rounded-xl border border-slate-700">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${e.status.includes('Ders Yapıldı') ? 'bg-slate-950 text-slate-400 border border-slate-700' : 'bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-300 border border-purple-500/30'}`}>{e.status}</span>
                          <span className="text-xs font-bold text-white">{e.date} - {e.time}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-200 mt-1">{e.title}</h4>
                        <p className="text-xs text-slate-400">{e.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PARENT DASHBOARD - COLORFUL WITH RECORDINGS */}
        {currentRole === 'parent' && currentParentUser && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 p-6 rounded-3xl shadow-xl border border-rose-400/30 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="space-y-2 relative z-10">
                <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur">Veli Paneli</span>
                <h2 className="text-2xl sm:text-3xl font-black">Hoş Geldiniz, {currentParentUser.name}! ❤️</h2>
                <p className="text-rose-100 text-xs sm:text-sm max-w-2xl">Çocuğunuzun akademik durumunu, ders kayıtlarını ve ekran kayıtlarını buradan takip edebilirsiniz.</p>
              </div>
            </div>

            <div className="bg-slate-950/80 p-1.5 rounded-xl border border-slate-700/50 flex flex-wrap gap-1 backdrop-blur">
              <button onClick={() => setParentTab('dashboard')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${parentTab === 'dashboard' ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>🏠 Genel Bakış</button>
              <button onClick={() => setParentTab('student-status')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${parentTab === 'student-status' ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>📊 Durum</button>
              <button onClick={() => setParentTab('recordings')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${parentTab === 'recordings' ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>🎥 Ders Kayıtları</button>
              <button onClick={() => setParentTab('calendar')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${parentTab === 'calendar' ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>📅 Takvim</button>
            </div>

            {parentTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {getLinkedStudents(currentParentUser).map(student => {
                    const perf = getStudentPerformance(student.id);
                    const recordings = events.filter(e => e.recordingUrl).length;
                    return (
                      <div key={student.id} className="bg-gradient-to-br from-slate-950 to-slate-900 p-6 rounded-2xl border border-rose-500/30 space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 text-slate-950 font-bold flex items-center justify-center text-lg">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">{student.name}</h3>
                            <p className="text-xs text-slate-400">@{student.username} • {student.createdAt}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-center">
                            <p className="text-2xl font-black text-amber-400">{perf.percentage}%</p>
                            <p className="text-[10px] text-slate-400">Başarı</p>
                          </div>
                          <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-center">
                            <p className="text-2xl font-black text-emerald-400">{perf.done}/{perf.total}</p>
                            <p className="text-[10px] text-slate-400">Ödev</p>
                          </div>
                          <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-center">
                            <p className="text-2xl font-black text-blue-400">{documents.length}</p>
                            <p className="text-[10px] text-slate-400">Doküman</p>
                          </div>
                          <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-center">
                            <p className="text-2xl font-black text-purple-400">{recordings}</p>
                            <p className="text-[10px] text-slate-400">Kayıt</p>
                          </div>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-4 overflow-hidden border border-slate-700">
                          <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 h-full rounded-full transition-all" style={{ width: `${Math.max(perf.percentage, 3)}%` }}></div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">{perf.percentage === 100 ? '🔥 Mükemmel!' : perf.percentage > 70 ? '👍 İyi' : perf.percentage > 40 ? '📈 Gelişim' : '⚠️ Destek'}</span>
                          <span className="text-slate-500">{recordings} kayıt</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {getLinkedStudents(currentParentUser).length === 0 && (
                  <div className="p-12 text-center text-slate-500 bg-slate-950 rounded-xl border border-dashed border-slate-700">
                    <Users className="h-8 w-8 text-slate-700 mx-auto" />
                    <p className="text-sm mt-2">Henüz öğrenciyle eşleştirilmemiş.</p>
                  </div>
                )}
              </div>
            )}

            {parentTab === 'student-status' && (
              <div className="space-y-6 bg-slate-950/80 p-6 rounded-2xl border border-slate-700/50 backdrop-blur">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-rose-400" />
                  <span>📊 Öğrenci Durumu</span>
                </h3>
                {getLinkedStudents(currentParentUser).map(student => {
                  const perf = getStudentPerformance(student.id);
                  const studentAssignments = assignments.filter(a => a.studentId === student.id || a.studentId === 'all');
                  return (
                    <div key={student.id} className="space-y-4">
                      <div className="flex items-center space-x-3 bg-slate-900 p-4 rounded-xl border border-slate-700">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 text-slate-950 font-bold flex items-center justify-center">{student.name.charAt(0)}</div>
                        <div>
                          <h4 className="text-base font-bold text-white">{student.name}</h4>
                          <p className="text-xs text-slate-400">@{student.username}</p>
                        </div>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-300 font-bold">Başarı</span>
                          <span className="text-amber-400 font-bold">%{perf.percentage}</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-5 overflow-hidden border border-slate-700">
                          <div className="bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-400 h-full rounded-full transition-all" style={{ width: `${Math.max(perf.percentage, 3)}%` }}></div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center text-xs">
                          <div className="bg-slate-950 p-2 rounded border border-slate-700">
                            <p className="text-emerald-400 font-bold">{studentAssignments.filter(a => a.status === 'Tamamlandı').length}</p>
                            <p className="text-slate-400">Tamamlandı</p>
                          </div>
                          <div className="bg-slate-950 p-2 rounded border border-slate-700">
                            <p className="text-amber-400 font-bold">{studentAssignments.filter(a => a.status === 'Bekliyor').length}</p>
                            <p className="text-slate-400">Bekliyor</p>
                          </div>
                          <div className="bg-slate-950 p-2 rounded border border-slate-700">
                            <p className="text-blue-400 font-bold">{documents.length}</p>
                            <p className="text-slate-400">Doküman</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-3">
                        <h5 className="text-xs font-bold text-slate-300 uppercase">Ödevler</h5>
                        {studentAssignments.length === 0 ? (
                          <p className="text-xs text-slate-500">Ödev yok.</p>
                        ) : (
                          <div className="space-y-2">
                            {studentAssignments.map(a => (
                              <div key={a.id} className="p-3 bg-slate-950 rounded-lg border border-slate-700 flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-bold text-white">{a.title}</p>
                                  <p className="text-[10px] text-slate-400">Son: {a.dueDate}</p>
                                  {a.submittedAt && <p className="text-[10px] text-emerald-400">Teslim: {a.submittedAt}</p>}
                                </div>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${a.status === 'Tamamlandı' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>{a.status}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {parentTab === 'recordings' && (
              <div className="space-y-6 bg-slate-950/80 p-6 rounded-2xl border border-slate-700/50 backdrop-blur">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <MonitorPlay className="h-5 w-5 text-blue-400" />
                    <span>🎥 Ders Ekran Kayıtları</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Öğretmen tarafından eklenen ders kayıtlarını buradan izleyebilirsiniz.</p>
                </div>
                {events.filter(e => e.recordingUrl).length === 0 ? (
                  <div className="p-12 text-center text-slate-500 bg-slate-900/50 rounded-xl border border-dashed border-slate-700">
                    <Video className="h-8 w-8 text-slate-700 mx-auto" />
                    <p className="text-sm mt-2">Henüz ders kaydı yok.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.filter(e => e.recordingUrl).map(evt => (
                      <div key={evt.id} className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-950/50 transition-colors" onClick={() => setExpandedRecordingId(expandedRecordingId === evt.id ? null : evt.id)}>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
                              <MonitorPlay className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white">{evt.title}</h4>
                              <p className="text-[10px] text-slate-400">{evt.date} • {evt.time}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-[10px] bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-500/30">KAYIT</span>
                            {expandedRecordingId === evt.id ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                          </div>
                        </div>
                        {expandedRecordingId === evt.id && (
                          <div className="px-4 pb-4 space-y-3 border-t border-slate-700 pt-3">
                            <p className="text-xs text-slate-300">{evt.description}</p>
                            {evt.teacherSummary && (
                              <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-xs">
                                <span className="font-bold text-emerald-300">💡 Not:</span>
                                <p className="text-slate-300 mt-1">{evt.teacherSummary}</p>
                              </div>
                            )}
                            <div className="flex items-center space-x-3">
                              <a href={evt.recordingUrl} target="_blank" rel="noreferrer" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors inline-flex items-center space-x-2">
                                <MonitorPlay className="h-4 w-4" />
                                <span>Kaydı İzle</span>
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {parentTab === 'calendar' && (
              <div className="space-y-6 bg-slate-950/80 p-6 rounded-2xl border border-slate-700/50 backdrop-blur">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-purple-400" />
                  <span>📅 Takvim</span>
                </h3>
                {events.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">Takvim boş.</p>
                ) : (
                  <div className="space-y-3">
                    {events.map(e => (
                      <div key={e.id} className="p-3.5 bg-slate-900 rounded-xl border border-slate-700">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${e.status.includes('Ders Yapıldı') ? 'bg-slate-950 text-slate-400 border border-slate-700' : 'bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-300 border border-purple-500/30'}`}>{e.status}</span>
                          <span className="text-xs font-bold text-white">{e.date} - {e.time}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-200 mt-1">{e.title}</h4>
                        <p className="text-xs text-slate-400">{e.description}</p>
                        {e.recordingUrl && (
                          <a href={e.recordingUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline mt-2 inline-flex items-center space-x-1">
                            <MonitorPlay className="h-3 w-3" /><span>Kaydı İzle</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </main>
  
      {/* FOOTER */}
      <footer className="mt-16 border-t border-slate-700/50 bg-slate-950/80 py-8 text-xs text-slate-500 text-center backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-bold text-slate-400">DersLink — Öğretmen, Öğrenci & Veli Platformu (Firebase Firestore Bağlantılı)</p>
          <p>Öğrenci için pratik, öğretmen için profesyonel. Eğitimde dijitalleşmenin en kısa yoluyla tanışın! <code className="text-amber-400">BAŞARILAR</code> • PDF & Ekran Kaydı • Çift Yönlü Cloud & Yerel Senkronizasyon © 2026</p>
          <div className="pt-2 flex justify-center space-x-4">
            <button onClick={() => setCurrentRole('guest')} className="text-amber-400 hover:underline font-bold">Giriş Ekranına Dön</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
