import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { db } from './firebase'; // Az önce oluşturduğumuz dosyadan çekiyoruz
import { sendTelegramNotification } from './telegram';
import { 
  UserPlus, FileText, Calendar, Clock, Trash2, ExternalLink, GraduationCap, 
  Layers, Video, FileCheck, ClipboardList, TrendingUp, LogOut, Check, 
  ArrowRight, CalendarDays, FileSpreadsheet, Shield, Users, MonitorPlay, 
  Heart, Lock, AlertTriangle, BarChart3, ChevronDown, ChevronUp, FileUp, 
  Award, Target, BookOpen, PenLine, Save, X, Database, Wifi
} from 'lucide-react';

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
  const [firebaseStatus, setFirebaseStatus] = useState<'Bağlanıyor' | 'Aktif (Canlı)' | 'Yerel Mod / Kurallar Bekleniyor'>('Bağlanıyor');

  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const [teacherTab, setTeacherTab] = useState<'dashboard' | 'students' | 'parents' | 'documents' | 'assignments' | 'summaries' | 'calendar'>('dashboard');
  const [studentTab, setStudentTab] = useState<'dashboard' | 'documents' | 'assignments' | 'exams' | 'calendar'>('dashboard');
  const [parentTab, setParentTab] = useState<'dashboard' | 'student-status' | 'recordings' | 'calendar'>('dashboard');

  const [teacherPass, setTeacherPass] = useState('');
  const [teacherError, setTeacherError] = useState('');

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

  const [studentLoginUser, setStudentLoginUser] = useState('');
  const [studentLoginPass, setStudentLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  const [parentLoginUser, setParentLoginUser] = useState('');
  const [parentLoginPass, setParentLoginPass] = useState('');
  const [parentLoginError, setParentLoginError] = useState('');

  const [submittingAssignmentId, setSubmittingAssignmentId] = useState<string | null>(null);
  const [studentSubmissionUrl, setStudentSubmissionUrl] = useState('');
  const [studentSubmissionNotes, setStudentSubmissionNotes] = useState('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editNotesValue, setEditNotesValue] = useState('');

  useEffect(() => {
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
    if (savedEvents) setEvents(JSON.parse(savedEvents));

    let unsubStudents = onSnapshot(collection(db, "students"), (snapshot) => {
      const items: Student[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as Student));
      setStudents(items);
      localStorage.setItem('derslink_students', JSON.stringify(items));
      setFirebaseStatus('Aktif (Canlı)');
    }, () => setFirebaseStatus('Yerel Mod / Kurallar Bekleniyor'));

    let unsubParents = onSnapshot(collection(db, "parents"), (snapshot) => {
      const items: Parent[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as Parent));
      setParents(items);
      localStorage.setItem('derslink_parents', JSON.stringify(items));
    }, () => {});

    let unsubCategories = onSnapshot(collection(db, "categories"), (snapshot) => {
      const items: string[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data().name));
      if (items.length > 0) {
        setCategories(items);
        localStorage.setItem('derslink_categories', JSON.stringify(items));
      }
    }, () => {});

    let unsubDocs = onSnapshot(collection(db, "documents"), (snapshot) => {
      const items: DocumentItem[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as DocumentItem));
      setDocuments(items);
      localStorage.setItem('derslink_documents', JSON.stringify(items));
    }, () => {});

    let unsubAssignments = onSnapshot(collection(db, "assignments"), (snapshot) => {
      const items: Assignment[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as Assignment));
      setAssignments(items);
      localStorage.setItem('derslink_assignments', JSON.stringify(items));
    }, () => {});

    let unsubExams = onSnapshot(collection(db, "exams"), (snapshot) => {
      const items: ExamItem[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as ExamItem));
      setExams(items);
      localStorage.setItem('derslink_exams', JSON.stringify(items));
    }, () => {});

    let unsubEvents = onSnapshot(collection(db, "events"), (snapshot) => {
      const items: CalendarEvent[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as CalendarEvent));
      setEvents(items);
      localStorage.setItem('derslink_events', JSON.stringify(items));
    }, () => {});

    return () => {
      unsubStudents(); unsubParents(); unsubCategories(); unsubDocs();
      unsubAssignments(); unsubExams(); unsubEvents();
    };
  }, []);

  const saveDocToFirebase = async (collectionName: string, id: string, dataObj: any) => {
    try { await setDoc(doc(db, collectionName, id), dataObj); } catch (err) { console.warn(err); }
  };

  const deleteDocFromFirebase = async (collectionName: string, id: string) => {
    try { await deleteDoc(doc(db, collectionName, id)); } catch (err) { console.warn(err); }
  };

  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (teacherPass === TEACHER_PASSWORD) {
      setCurrentRole('teacher'); setTeacherTab('dashboard'); setTeacherPass('');
    } else { setTeacherError('Hatalı şifre!'); }
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = students.find(s => s.username.toLowerCase() === studentLoginUser.toLowerCase() && s.passwordHash === studentLoginPass);
    if (found) { setCurrentStudentUser(found); setCurrentRole('student'); setStudentTab('dashboard'); } else { setLoginError('Hatalı giriş!'); }
  };

  const handleParentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = parents.find(p => p.username.toLowerCase() === parentLoginUser.toLowerCase() && p.passwordHash === parentLoginPass);
    if (found) { setCurrentParentUser(found); setCurrentRole('parent'); setParentTab('dashboard'); } else { setParentLoginError('Hatalı giriş!'); }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6">
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-amber-400 flex items-center gap-2"><GraduationCap /> DersLink</h1>
        <span className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-400">Durum: {firebaseStatus}</span>
      </header>

      {currentRole === 'guest' && (
        <div className="max-w-md mx-auto bg-slate-800 p-6 rounded-lg border border-slate-700 space-y-6">
          <div>
            <h2 className="text-lg font-bold mb-3 text-amber-400">Öğretmen Girişi</h2>
            <form onSubmit={handleTeacherLogin} className="flex gap-2">
              <input type="password" value={teacherPass} onChange={e => setTeacherPass(e.target.value)} placeholder="Şifre" className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded flex-1 text-sm"/>
              <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-1.5 rounded text-sm">Giriş</button>
            </form>
            {teacherError && <p className="text-red-400 text-xs mt-1">{teacherError}</p>}
          </div>

          <div className="border-t border-slate-700 pt-4">
            <h2 className="text-lg font-bold mb-3 text-blue-400">Öğrenci Girişi</h2>
            <form onSubmit={handleStudentLogin} className="space-y-2">
              <input type="text" value={studentLoginUser} onChange={e => setStudentLoginUser(e.target.value)} placeholder="Kullanıcı Adı" className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded text-sm"/>
              <input type="password" value={studentLoginPass} onChange={e => setStudentLoginPass(e.target.value)} placeholder="Şifre" className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded text-sm"/>
              <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-1.5 rounded text-sm">Öğrenci Paneline Gir</button>
            </form>
            {loginError && <p className="text-red-400 text-xs mt-1">{loginError}</p>}
          </div>

          <div className="border-t border-slate-700 pt-4">
            <h2 className="text-lg font-bold mb-3 text-emerald-400">Veli Girişi</h2>
            <form onSubmit={handleParentLogin} className="space-y-2">
              <input type="text" value={parentLoginUser} onChange={e => setParentLoginUser(e.target.value)} placeholder="Veli Kullanıcı Adı" className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded text-sm"/>
              <input type="password" value={parentLoginPass} onChange={e => setParentLoginPass(e.target.value)} placeholder="Şifre" className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded text-sm"/>
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-1.5 rounded text-sm">Veli Paneline Gir</button>
            </form>
            {parentLoginError && <p className="text-red-400 text-xs mt-1">{parentLoginError}</p>}
          </div>
        </div>
      )}

      {currentRole !== 'guest' && (
        <div>
          <div className="flex justify-between items-center bg-slate-800 p-4 rounded mb-6 border border-slate-700">
            <p className="text-sm">Aktif Rol: <span className="font-bold text-amber-400 uppercase">{currentRole}</span></p>
            <button onClick={() => { setCurrentRole('guest'); setCurrentStudentUser(null); setCurrentParentUser(null); }} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"><LogOut size={14}/> Çıkış Yap</button>
          </div>
          <div className="p-8 text-center bg-slate-800/50 rounded-lg border border-slate-700/50">
             <p className="text-slate-400 text-sm">DersLink Sistemine başarıyla bağlanıldı. İstediğiniz modülleri yukarıdaki panellerden yönetebilirsiniz.</p>
          </div>
        </div>
      )}

      <footer className="mt-16 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
        <p>DersLink — Öğretmen, Öğrenci & Veli Platformu © 2026</p>
      </footer>
    </div>
  );
}
