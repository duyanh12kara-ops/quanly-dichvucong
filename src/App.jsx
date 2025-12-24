
import React, { useState, useEffect } from 'react';
import { CustomerRecord, ServiceStatus } from './types';
import RecordForm from './components/RecordForm';
import RecordList from './components/RecordList';
import Dashboard from './components/Dashboard';
import AIAssistant from './components/AIAssistant';
import SafetyCenter from './components/SafetyCenter';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, onSnapshot, 
  addDoc, updateDoc, deleteDoc, doc, setDoc, query, orderBy 
} from 'firebase/firestore';

// Cấu hình Firebase - Vui lòng thay thế bằng thông tin từ Firebase Console của bạn
const firebaseConfig = {
  apiKey: "AIzaSyAarP0N706FOGieFSjzxYEW7uSFzWx32nQ",
  authDomain: "dichvucong-703f8.firebaseapp.com",
  projectId: "dichvucong-703f8",
  storageBucket: "dichvucong-703f8.firebasestorage.app",
  messagingSenderId: "488059993128",
  appId: "1:488059993128:web:8a7590b084b752deda891d",
  measurementId: "G-MHZWQWGYQZ"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DEFAULT_SERVICES = [
  { id: '1', name: 'Đăng ký Khai sinh', icon: '👶', color: 'bg-blue-500' },
  { id: '2', name: 'Cấp đổi Hộ chiếu', icon: '✈️', color: 'bg-indigo-500' },
  { id: '3', name: 'Đăng ký Kết hôn', icon: '💍', color: 'bg-pink-500' },
  { id: '4', name: 'Xác nhận Cư trú', icon: '🏠', color: 'bg-emerald-500' },
  { id: '5', name: 'Thừa kế - Di chúc', icon: '📜', color: 'bg-amber-500' },
  { id: '6', name: 'Lý lịch tư pháp', icon: '⚖️', color: 'bg-slate-600' }
];

const App: React.FC = () => {
  const [records, setRecords] = useState<CustomerRecord[]>([]);
  const [services, setServices] = useState<{id: string, name: string, icon: string, color: string}[]>([]);
  const [serviceDocCatalog, setServiceDocCatalog] = useState<Record<string, string[]>>({});
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CustomerRecord | null>(null);
  const [view, setView] = useState<'list' | 'dashboard' | 'safety'>('list');

  // 1. Lắng nghe hồ sơ (Records) - Realtime
  useEffect(() => {
    const q = query(collection(db, "records"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recordsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as CustomerRecord[];
      setRecords(recordsData);
    });
    return () => unsubscribe();
  }, []);

  // 2. Lắng nghe danh mục dịch vụ (Services) - Realtime
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "services"), (snapshot) => {
      if (snapshot.empty) {
        // Nếu DB trống, khởi tạo dữ liệu mẫu
        DEFAULT_SERVICES.forEach(async (s) => {
          await setDoc(doc(db, "services", s.id), s);
        });
      } else {
        const servicesData = snapshot.docs.map(doc => doc.data() as any);
        setServices(servicesData);
      }
    });
    return () => unsubscribe();
  }, []);

  // 3. Lắng nghe bộ nhớ giấy tờ (Doc Catalog) - Realtime
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "docCatalogs"), (snapshot) => {
      const catalogData: Record<string, string[]> = {};
      snapshot.docs.forEach(doc => {
        catalogData[doc.id] = doc.data().docs || [];
      });
      setServiceDocCatalog(catalogData);
    });
    return () => unsubscribe();
  }, []);

  const handleAddRecord = async (record: Omit<CustomerRecord, 'id'>) => {
    try {
      await addDoc(collection(db, "records"), record);
      setIsFormOpen(false);
    } catch (error) {
      console.error("Lỗi khi thêm hồ sơ:", error);
      alert("Không thể lưu vào Firebase. Kiểm tra cấu hình.");
    }
  };

  const handleUpdateRecord = async (updatedRecord: CustomerRecord) => {
    try {
      const recordRef = doc(db, "records", updatedRecord.id);
      const { id, ...data } = updatedRecord; // Loại bỏ ID khỏi body update
      await updateDoc(recordRef, data);
      setEditingRecord(null);
      setIsFormOpen(false);
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error);
    }
  };

  const handleAddNewService = async (name: string) => {
    const colors = ['bg-rose-500', 'bg-violet-500', 'bg-cyan-500', 'bg-orange-500', 'bg-lime-500'];
    const newServiceId = Date.now().toString();
    const newService = {
      id: newServiceId,
      name,
      icon: '✨',
      color: colors[Math.floor(Math.random() * colors.length)]
    };
    await setDoc(doc(db, "services", newServiceId), newService);
  };

  const handleUpdateDocCatalog = async (serviceName: string, docs: string[]) => {
    try {
      // Dùng serviceName làm ID cho collection docCatalogs
      await setDoc(doc(db, "docCatalogs", serviceName), { docs });
    } catch (error) {
      console.error("Lỗi cập nhật catalog:", error);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('Xác nhận xóa hồ sơ này khỏi hệ thống Firebase?')) {
      try {
        await deleteDoc(doc(db, "records", id));
      } catch (error) {
        console.error("Lỗi khi xóa:", error);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F4F7FE]">
      <nav className="w-full md:w-72 bg-slate-900 text-white flex-shrink-0 flex flex-col shadow-2xl z-30">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-tr from-emerald-400 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-2xl">🏛️</span>
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">DVC MASTER</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Firebase Cloud Sync</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setView('list')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${view === 'list' ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-xl shadow-emerald-900/20' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <span className="text-xl">📋</span>
            <span className="font-bold text-sm">Hồ sơ khách hàng</span>
          </button>
          
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${view === 'dashboard' ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-xl shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <span className="text-xl">📊</span>
            <span className="font-bold text-sm">Thống kê</span>
          </button>

          <button 
            onClick={() => setView('safety')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${view === 'safety' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xl shadow-orange-900/20' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <span className="text-xl">🛡️</span>
            <span className="font-bold text-sm">Bảo mật</span>
          </button>
        </div>

        <div className="p-8 mt-auto">
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-tighter">Cloud Storage Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <p className="text-[10px] text-slate-300 font-bold uppercase">Database Connected</p>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto relative pb-20">
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <div>
              <h2 className="text-4xl font-black text-slate-800 tracking-tight">
                {view === 'list' ? 'Hồ sơ khách hàng' : view === 'dashboard' ? 'Báo cáo thông minh' : 'Trung tâm an toàn'}
              </h2>
              <p className="text-slate-500 font-medium mt-1">Dữ liệu được bảo mật và đồng bộ thời gian thực qua Firebase.</p>
            </div>
            {view === 'list' && (
              <button 
                onClick={() => { setEditingRecord(null); setIsFormOpen(true); }}
                className="group bg-slate-900 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all duration-500 shadow-2xl hover:shadow-emerald-200 transform hover:-translate-y-1"
              >
                <span className="text-2xl group-hover:rotate-90 transition-transform duration-500">+</span> 
                Tiếp nhận hồ sơ mới
              </button>
            )}
          </header>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {view === 'list' && (
              <RecordList 
                records={records} 
                serviceDocCatalog={serviceDocCatalog}
                onEdit={(r) => { setEditingRecord(r); setIsFormOpen(true); }} 
                onDelete={handleDeleteRecord} 
              />
            )}
            {view === 'dashboard' && <Dashboard records={records} />}
            {view === 'safety' && <SafetyCenter records={records} setRecords={() => {}} />}
          </div>
        </div>

        <AIAssistant records={records} />

        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-lg z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-[3rem] w-full max-w-5xl my-auto shadow-[0_32px_128px_-12px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-500">
              <RecordForm 
                initialData={editingRecord || undefined} 
                availableServices={services}
                serviceDocCatalog={serviceDocCatalog}
                onUpdateCatalog={handleUpdateDocCatalog}
                onAddService={handleAddNewService}
                onSubmit={editingRecord ? handleUpdateRecord : handleAddRecord}
                onCancel={() => { setIsFormOpen(false); setEditingRecord(null); }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;