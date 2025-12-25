
import React, { useState, useEffect } from 'react';
import { CustomerRecord, ServiceStatus } from './types';
import RecordForm from './components/RecordForm';
import RecordList from './components/RecordList';
import Dashboard from './components/Dashboard';
import AIAssistant from './components/AIAssistant';
import SafetyCenter from './components/SafetyCenter';

// --- FIREBASE SETUP ---
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, onSnapshot, 
  addDoc, updateDoc, deleteDoc, doc, setDoc, query, orderBy 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAarP0N706FOGieFSjzxYEW7uSFzWx32nQ",
  authDomain: "dichvucong-703f8.firebaseapp.com",
  projectId: "dichvucong-703f8",
  storageBucket: "dichvucong-703f8.firebasestorage.app",
  messagingSenderId: "488059993128",
  appId: "1:488059993128:web:8a7590b084b752deda891d",
  measurementId: "G-MHZWQWGYQZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DEFAULT_SERVICES = [
  { id: '1', name: 'Đăng ký Khai sinh', icon: '👶', color: 'bg-blue-600' },
  { id: '2', name: 'Cấp đổi Hộ chiếu', icon: '✈️', color: 'bg-indigo-600' },
  { id: '3', name: 'Đăng ký Kết hôn', icon: '💍', color: 'bg-pink-600' },
  { id: '4', name: 'Xác nhận Cư trú', icon: '🏠', color: 'bg-emerald-600' },
  { id: '5', name: 'Thừa kế - Di chúc', icon: '📜', color: 'bg-amber-600' },
  { id: '6', name: 'Lý lịch tư pháp', icon: '⚖️', color: 'bg-slate-600' }
];

const App: React.FC = () => {
  const [records, setRecords] = useState<CustomerRecord[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [serviceDocCatalog, setServiceDocCatalog] = useState<Record<string, string[]>>({});
  const [view, setView] = useState<'list' | 'dashboard' | 'safety'>('list');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CustomerRecord | null>(null);
  const [loading, setLoading] = useState(true); // Thêm dòng này vào dưới dòng 45
  useEffect(() => {
    const q = query(collection(db, "records"), orderBy("date", "desc"));
    const unsubRecords = onSnapshot(q, snap => {
      const fetchedRecords = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }) as CustomerRecord);
      setRecords(fetchedRecords);
      setRecords(fetchedRecords);
setLoading(false); // <--- THÊM DÒNG NÀY VÀO ĐÂY
    });
    
    const unsubServices = onSnapshot(collection(db, "services"), snap => {
      if (snap.empty) DEFAULT_SERVICES.forEach(async s => await setDoc(doc(db, "services", s.id), s));
      else setServices(snap.docs.map(d => d.data()));
    });
    
    const unsubCatalog = onSnapshot(collection(db, "docCatalogs"), snap => {
      const cat: Record<string, string[]> = {};
      snap.docs.forEach(d => cat[d.id] = d.data().docs || []);
      setServiceDocCatalog(cat);
    });
    
    return () => { unsubRecords(); unsubServices(); unsubCatalog(); };
  }, []);

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingRecord) {
        const { id, ...updateData } = data;
        await updateDoc(doc(db, "records", id), updateData);
      } else {
        await addDoc(collection(db, "records"), data);
      }
    } catch (error) {
      console.error("Lỗi khi lưu dữ liệu:", error);
    } finally {
      setIsFormOpen(false);
      setEditingRecord(null);
    }
  };

  const handleUpdateCatalog = async (s: string, d: string[]) => {
    await setDoc(doc(db, "docCatalogs", s), { docs: d });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('XÁC NHẬN XÓA HỒ SƠ NÀY KHỎI HỆ THỐNG?')) {
      // Xóa tạm thời khỏi UI để tạo cảm giác nhạy (Optimistic Delete)
      const originalRecords = [...records];
      setRecords(records.filter(r => r.id !== id));
      
      try {
        await deleteDoc(doc(db, "records", id));
      } catch (error) {
        console.error("Lỗi khi xóa hồ sơ:", error);
        alert("Không thể xóa dữ liệu trên Server. Đã khôi phục hiển thị.");
        setRecords(originalRecords); // Khôi phục nếu lỗi thực sự xảy ra
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col overflow-hidden">
      {/* TOP NAVIGATION BAR */}
      <nav className="w-full bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 py-4 relative z-40 shadow-xl shadow-black/20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-indigo-900/20">🏛️</div>
            <div className="min-w-0">
              <h1 className="text-lg font-black tracking-tighter leading-none text-white uppercase">DVC MASTER</h1>
              <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5 block">QUẢN TRỊ VIÊN</span>
            </div>
          </div>
          
          <div className="h-8 w-[1px] bg-slate-800 mx-2 hidden md:block"></div>
          
          <div className="flex items-center gap-1">
            <button onClick={() => setView('list')} className={`px-4 py-2.5 rounded-xl font-black text-[10px] transition-all uppercase tracking-wider flex items-center gap-2 ${view === 'list' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'}`}>
              <span>📋</span> Danh sách
            </button>
            <button onClick={() => setView('dashboard')} className={`px-4 py-2.5 rounded-xl font-black text-[10px] transition-all uppercase tracking-wider flex items-center gap-2 ${view === 'dashboard' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'}`}>
              <span>📊</span> Báo cáo
            </button>
            <button onClick={() => setView('safety')} className={`px-4 py-2.5 rounded-xl font-black text-[10px] transition-all uppercase tracking-wider flex items-center gap-2 ${view === 'safety' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'}`}>
              <span>🛡️</span> Bảo mật
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="hidden lg:flex items-center gap-2 text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/5 px-3 py-2 rounded-lg border border-emerald-500/10">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
             Cloud Sync Active
           </div>
        </div>
      </nav>

      <main className="flex-1 min-w-0 p-4 md:p-8 lg:p-12 overflow-y-auto relative z-30 custom-scrollbar">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tighter leading-tight uppercase">
              {view === 'list' ? 'Hồ sơ khách hàng' : view === 'dashboard' ? 'Báo cáo thống kê' : 'An toàn dữ liệu'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-6 h-[2px] bg-indigo-500 rounded-full"></span> 
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest opacity-80">Hệ thống Master 2025</p>
            </div>
          </div>
          {view === 'list' && (
            <button onClick={() => { setEditingRecord(null); setIsFormOpen(true); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-950/50 transform hover:-translate-y-1 active:scale-95 flex items-center gap-2">
              <span className="text-lg">+</span> TIẾP NHẬN HỒ SƠ
            </button>
          )}
        </header>

        {view === 'list' && (
          <RecordList 
            records={records} 
            serviceDocCatalog={serviceDocCatalog} 
            onEdit={(r: any) => { setEditingRecord(r); setIsFormOpen(true); }} 
            onDelete={handleDelete} 
          />
        )}
        {view === 'dashboard' && <Dashboard records={records} />}
        {view === 'safety' && <SafetyCenter records={records} setRecords={setRecords} />}
        
        <AIAssistant records={records} />
      </main>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl z-[999] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-[3rem] w-full max-w-6xl max-h-[92vh] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-slate-800 animate-in zoom-in-95 duration-300 relative">
            <RecordForm 
              initialData={editingRecord || undefined} 
              availableServices={services} 
              serviceDocCatalog={serviceDocCatalog}
              onUpdateCatalog={handleUpdateCatalog}
              onAddService={async (n: any) => {
                const id = Date.now().toString();
                await setDoc(doc(db, "services", id), { id, name: n, icon: '✨', color: 'bg-indigo-500' });
              }}
              onSubmit={handleFormSubmit}
              onCancel={() => { setIsFormOpen(false); setEditingRecord(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;