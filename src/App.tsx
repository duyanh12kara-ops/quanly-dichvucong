
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

// --- FIREBASE SETUP ---
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- TYPES ---
export enum ServiceStatus {
  PENDING = 'Chờ xử lý',
  PROCESSING = 'Đang xử lý',
  COMPLETED = 'Đã hoàn thành',
  CANCELLED = 'Đã hủy'
}

export interface CustomerRecord {
  id: string;
  date: string;
  customerName: string;
  serviceType: string;
  documentsProvided: string;
  returnDate?: string;
  status: ServiceStatus;
  note?: string;
}

// --- AI SERVICES ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

const analyzeRecords = async (records: CustomerRecord[]) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Dựa trên danh sách hồ sơ dịch vụ công sau đây: ${JSON.stringify(records)}. Phân tích: 1. Hiệu suất, 2. Dịch vụ phổ biến, 3. Lời khuyên. Viết bằng tiếng Việt, súc tích.`,
    });
    return response.text;
  } catch (error) { return "Không thể phân tích dữ liệu lúc này."; }
};

const getDocumentSuggestions = async (serviceName: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Dịch vụ công: "${serviceName}". Liệt kê danh sách các giấy tờ cần cung cấp thông thường tại VN. Trả về JSON: {"documents": ["giấy 1", "giấy 2"]}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { documents: { type: Type.ARRAY, items: { type: Type.STRING } } },
          required: ["documents"]
        }
      }
    });
    return JSON.parse(response.text || "{\"documents\": []}").documents;
  } catch (error) { return []; }
};

// --- SUB-COMPONENTS ---

const RecordList: React.FC<{
  records: CustomerRecord[];
  serviceDocCatalog: Record<string, string[]>;
  onEdit: (record: CustomerRecord) => void;
  onDelete: (id: string) => void;
}> = ({ records, serviceDocCatalog, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filtered = records.filter(r => r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || r.serviceType.toLowerCase().includes(searchTerm.toLowerCase()));

  const getDocStatus = (record: CustomerRecord) => {
    const provided = record.documentsProvided ? record.documentsProvided.split(', ').length : 0;
    const total = (serviceDocCatalog[record.serviceType] || []).length;
    if (total === 0) return { label: 'Chưa mẫu', color: 'text-slate-400 bg-slate-50 border-slate-100', icon: '⚪' };
    const missing = total - provided;
    if (missing <= 0) return { label: 'ĐỦ HỒ SƠ', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: '✅' };
    return { label: `THIẾU ${missing}`, color: 'text-rose-600 bg-rose-50 border-rose-100', icon: '❌' };
  };

  const getBadge = (status: ServiceStatus) => {
    const base = "inline-flex items-center justify-center px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tight shadow-sm whitespace-nowrap min-w-[85px] border";
    if (status === ServiceStatus.COMPLETED) return <span className={`${base} bg-emerald-500 text-white border-emerald-600`}>Hoàn thành</span>;
    if (status === ServiceStatus.PROCESSING) return <span className={`${base} bg-blue-500 text-white border-blue-600`}>Đang xử lý</span>;
    return <span className={`${base} bg-slate-400 text-white border-slate-500`}>{status}</span>;
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-50 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/20">
        <input 
          type="text" placeholder="Tìm tên khách hoặc dịch vụ..."
          className="w-full md:w-80 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[12px] font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
        />
        <div className="text-[10px] text-slate-400 font-extrabold uppercase">Kết quả: {filtered.length}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead>
            <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
              <th className="px-5 py-4">Hồ sơ / Khách</th>
              <th className="px-5 py-4">Dịch vụ</th>
              <th className="px-5 py-4">Giấy tờ</th>
              <th className="px-5 py-4">Hẹn trả</th>
              <th className="px-5 py-4">Trạng thái</th>
              <th className="px-5 py-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(r => {
              const ds = getDocStatus(r);
              return (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-5 py-3.5">
                    <div className="font-extrabold text-slate-800 text-[11px] uppercase">{r.customerName}</div>
                    <div className="text-[8px] text-slate-400 font-bold">N: {r.date}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200/30 uppercase">{r.serviceType}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[8.5px] font-black ${ds.color}`}>
                      <span>{ds.icon}</span> <span>{ds.label}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-[10px] font-black text-slate-700 whitespace-nowrap">{r.returnDate || '⏳ Chờ đối tác'}</div>
                  </td>
                  <td className="px-5 py-3.5">{getBadge(r.status)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-center gap-1.5">
                      <button onClick={() => onEdit(r)} className="w-7 h-7 bg-white text-indigo-600 border rounded-lg hover:bg-indigo-600 hover:text-white transition-all">✏️</button>
                      <button onClick={() => onDelete(r.id)} className="w-7 h-7 bg-white text-rose-600 border rounded-lg hover:bg-rose-600 hover:text-white transition-all">🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const RecordForm: React.FC<{
  initialData?: CustomerRecord;
  availableServices: any[];
  serviceDocCatalog: Record<string, string[]>;
  onUpdateCatalog: (s: string, d: string[]) => void;
  onAddService: (n: string) => void;
  onSubmit: (r: any) => void;
  onCancel: () => void;
}> = ({ initialData, availableServices, serviceDocCatalog, onUpdateCatalog, onAddService, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Omit<CustomerRecord, 'id'>>({
    date: new Date().toISOString().split('T')[0], customerName: '', serviceType: '', documentsProvided: '', returnDate: '', status: ServiceStatus.PENDING, note: ''
  });
  const [availableDocs, setAvailableDocs] = useState<string[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [isAddingService, setIsAddingService] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
      const docs = initialData.documentsProvided.split(', ').filter(d => d);
      setSelectedDocs(docs);
      setAvailableDocs(Array.from(new Set([...(serviceDocCatalog[initialData.serviceType] || []), ...docs])));
    }
  }, [initialData]);

  const handleSelectService = (s: string) => {
    setFormData(prev => ({ ...prev, serviceType: s }));
    setAvailableDocs(serviceDocCatalog[s] || []);
    setSelectedDocs([]);
  };

  const handleAISuggest = async () => {
    if (!formData.serviceType) return alert("Chọn dịch vụ trước");
    setLoadingAI(true);
    const suggested = await getDocumentSuggestions(formData.serviceType);
    const updated = Array.from(new Set([...availableDocs, ...suggested]));
    setAvailableDocs(updated);
    onUpdateCatalog(formData.serviceType, updated);
    setLoadingAI(false);
  };

  const toggleDoc = (docName: string) => {
    setSelectedDocs(prev => prev.includes(docName) ? prev.filter(d => d !== docName) : [...prev, docName]);
  };

  return (
    <form className="p-10 space-y-8" onSubmit={(e) => { e.preventDefault(); onSubmit(initialData ? { ...formData, id: initialData.id, documentsProvided: selectedDocs.join(', ') } : { ...formData, documentsProvided: selectedDocs.join(', ') }); }}>
      <div className="flex justify-between items-center">
        <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">{initialData ? 'Sửa hồ sơ' : 'Tiếp nhận mới'}</h3>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-rose-500 font-bold">Đóng ✕</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <input type="text" placeholder="Họ tên khách hàng" required className="w-full px-5 py-3.5 bg-slate-50 rounded-xl font-bold border-none" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
          <div className="flex flex-wrap gap-2">
            {availableServices.map(s => (
              <button key={s.id} type="button" onClick={() => handleSelectService(s.name)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${formData.serviceType === s.name ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{s.icon} {s.name}</button>
            ))}
            <button type="button" onClick={() => setIsAddingService(!isAddingService)} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase border border-emerald-100">+ Thêm dịch vụ</button>
          </div>
          {isAddingService && (
            <div className="flex gap-2">
              <input type="text" placeholder="Tên dịch vụ mới..." className="flex-1 px-4 py-2 bg-white border rounded-xl text-xs font-bold" value={newServiceName} onChange={e => setNewServiceName(e.target.value)} />
              <button type="button" onClick={() => { onAddService(newServiceName); handleSelectService(newServiceName); setIsAddingService(false); }} className="px-4 bg-indigo-600 text-white rounded-xl text-[10px] font-bold">Lưu</button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <input type="date" className="px-4 py-3 bg-slate-50 rounded-xl text-xs font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            <input type="date" className="px-4 py-3 bg-amber-50 rounded-xl text-xs font-bold" value={formData.returnDate} onChange={e => setFormData({...formData, returnDate: e.target.value})} />
          </div>
        </div>
        <div className="bg-slate-900 rounded-[2rem] p-6 text-white flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Danh mục hồ sơ</span>
            <button type="button" onClick={handleAISuggest} disabled={loadingAI || !formData.serviceType} className="text-[9px] bg-white/10 px-3 py-1.5 rounded-full hover:bg-white/20 transition-all">{loadingAI ? 'AI Đang tải...' : '✨ AI Gợi ý'}</button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {availableDocs.map((doc, i) => (
              <div key={i} onClick={() => toggleDoc(doc)} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedDocs.includes(doc) ? 'bg-emerald-600/20 border-emerald-500/50' : 'bg-white/5 border-transparent hover:bg-white/10'}`}>
                <div className={`w-5 h-5 rounded flex items-center justify-center ${selectedDocs.includes(doc) ? 'bg-emerald-500' : 'bg-white/10'}`}>{selectedDocs.includes(doc) && '✓'}</div>
                <span className="text-[11px] font-bold">{doc}</span>
              </div>
            ))}
          </div>
          <button type="submit" className="mt-4 w-full py-4 bg-emerald-500 text-slate-900 rounded-xl font-black shadow-xl hover:bg-emerald-400">HOÀN TẤT LƯU TRỮ</button>
        </div>
      </div>
    </form>
  );
};

const Dashboard: React.FC<{ records: CustomerRecord[] }> = ({ records }) => {
  const stats = useMemo(() => ({
    total: records.length,
    done: records.filter(r => r.status === ServiceStatus.COMPLETED).length,
    proc: records.filter(r => r.status === ServiceStatus.PROCESSING).length,
  }), [records]);

  const pieData = [
    { name: 'Xong', value: stats.done, color: '#10b981' },
    { name: 'Xử lý', value: stats.proc, color: '#3b82f6' },
    { name: 'Chờ', value: stats.total - stats.done - stats.proc, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl">
          <div className="text-[10px] font-black uppercase opacity-60">Tổng số hồ sơ</div>
          <div className="text-4xl font-black mt-1">{stats.total}</div>
        </div>
        <div className="bg-emerald-500 p-8 rounded-[2rem] text-white shadow-xl">
          <div className="text-[10px] font-black uppercase opacity-60">Đã hoàn tất</div>
          <div className="text-4xl font-black mt-1">{stats.done}</div>
        </div>
        <div className="bg-blue-500 p-8 rounded-[2rem] text-white shadow-xl">
          <div className="text-[10px] font-black uppercase opacity-60">Đang thực hiện</div>
          <div className="text-4xl font-black mt-1">{stats.proc}</div>
        </div>
      </div>
      <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col md:flex-row gap-8 items-center">
        <div className="w-full md:w-1/2 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full md:w-1/2 space-y-4">
          <h4 className="text-xl font-black text-slate-800">Cơ cấu hồ sơ</h4>
          {pieData.map(d => (
            <div key={d.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{d.name}</span>
              <span className="text-lg font-black">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SafetyCenter: React.FC<{ records: CustomerRecord[] }> = ({ records }) => {
  const handleExportCSV = () => {
    const csv = ["Ngày nhận,Khách hàng,Dịch vụ,Giấy tờ,Hẹn trả,Trạng thái"].concat(records.map(r => `"${r.date}","${r.customerName}","${r.serviceType}","${r.documentsProvided}","${r.returnDate}","${r.status}"`)).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Export_Records_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
        <div className="text-4xl mb-4">📂</div>
        <h3 className="text-2xl font-black text-slate-800 mb-2">Sao lưu Excel</h3>
        <p className="text-slate-500 mb-6 text-sm font-medium">Xuất dữ liệu Firebase ra định dạng CSV để lưu trữ nội bộ hoặc báo cáo định kỳ.</p>
        <button onClick={handleExportCSV} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-200">Xuất file CSV ngay</button>
      </div>
      <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl text-white">
        <div className="text-4xl mb-4">🛡️</div>
        <h3 className="text-2xl font-black mb-2">An toàn Firebase</h3>
        <p className="text-slate-400 mb-6 text-sm">Dữ liệu được mã hóa và bảo mật trên hạ tầng Google Cloud, hỗ trợ đồng bộ thời gian thực.</p>
        <div className="bg-white/10 p-4 rounded-xl text-[10px] font-bold uppercase tracking-widest text-emerald-400 border border-emerald-500/20">Trạng thái: Đã kết nối đám mây</div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

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
  const [services, setServices] = useState<any[]>([]);
  const [serviceDocCatalog, setServiceDocCatalog] = useState<Record<string, string[]>>({});
  const [view, setView] = useState<'list' | 'dashboard' | 'safety'>('list');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CustomerRecord | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "records"), orderBy("date", "desc"));
    const unsubRecords = onSnapshot(q, snap => setRecords(snap.docs.map(doc => ({ ...doc.data(), id: doc.id }) as CustomerRecord)));
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

  const handleAdd = async (r: any) => { await addDoc(collection(db, "records"), r); setIsFormOpen(false); };
  const handleUpdate = async (r: any) => { const { id, ...data } = r; await updateDoc(doc(db, "records", id), data); setEditingRecord(null); setIsFormOpen(false); };
  const handleDelete = async (id: string) => { if (confirm('Xóa hồ sơ?')) await deleteDoc(doc(db, "records", id)); };
  const handleAddService = async (n: string) => {
    const id = Date.now().toString();
    await setDoc(doc(db, "services", id), { id, name: n, icon: '✨', color: 'bg-indigo-500' });
  };
  const handleUpdateCatalog = async (s: string, d: string[]) => { await setDoc(doc(db, "docCatalogs", s), { docs: d }); };

  const handleAIAnalyze = async () => {
    setLoadingAI(true);
    const res = await analyzeRecords(records);
    setAiAnalysis(res);
    setLoadingAI(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F4F7FE]">
      {/* SIDEBAR */}
      <nav className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col shadow-2xl z-30">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-400 rounded-xl flex items-center justify-center text-xl">🏛️</div>
            <h1 className="text-lg font-black tracking-tight">DVC MASTER</h1>
          </div>
        </div>
        <div className="flex-1 px-4 space-y-1">
          <button onClick={() => setView('list')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${view === 'list' ? 'bg-emerald-600' : 'text-slate-400 hover:bg-slate-800'}`}>📋 Hồ sơ</button>
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${view === 'dashboard' ? 'bg-blue-600' : 'text-slate-400 hover:bg-slate-800'}`}>📊 Thống kê</button>
          <button onClick={() => setView('safety')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${view === 'safety' ? 'bg-amber-600' : 'text-slate-400 hover:bg-slate-800'}`}>🛡️ Bảo mật</button>
        </div>
        <div className="p-6 mt-auto">
          <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-[9px] font-black uppercase text-emerald-400 text-center">Cloud Sync Active</div>
        </div>
      </nav>

      {/* MAIN */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">{view === 'list' ? 'Quản lý hồ sơ' : view === 'dashboard' ? 'Báo cáo hiệu suất' : 'Trung tâm an toàn'}</h2>
            <p className="text-slate-500 font-bold text-xs mt-1">Firebase Firestore & Gemini AI Integrated</p>
          </div>
          {view === 'list' && (
            <button onClick={() => { setEditingRecord(null); setIsFormOpen(true); }} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs hover:bg-emerald-600 shadow-xl transition-all">+ TIẾP NHẬN HỒ SƠ MỚI</button>
          )}
        </header>

        {view === 'list' && <RecordList records={records} serviceDocCatalog={serviceDocCatalog} onEdit={r => { setEditingRecord(r); setIsFormOpen(true); }} onDelete={handleDelete} />}
        {view === 'dashboard' && <Dashboard records={records} />}
        {view === 'safety' && <SafetyCenter records={records} />}

        {/* AI ASSISTANT CHAT BOT MINI */}
        <div className="fixed bottom-6 right-6 z-40">
          <div className={`mb-4 w-72 md:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 transform ${aiAnalysis ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
            <div className="bg-indigo-600 p-4 text-white font-black text-xs flex justify-between items-center"><span>🤖 TRỢ LÝ AI</span> <button onClick={() => setAiAnalysis(null)}>✕</button></div>
            <div className="p-5 max-h-64 overflow-y-auto text-xs font-bold text-slate-600 leading-relaxed italic">{aiAnalysis}</div>
          </div>
          <button onClick={handleAIAnalyze} disabled={loadingAI} className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center text-xl hover:scale-110 transition-all ring-4 ring-indigo-50 border-none">
            {loadingAI ? '⌛' : '🤖'}
          </button>
        </div>

        {/* MODAL FORM */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300">
              <RecordForm 
                initialData={editingRecord || undefined} availableServices={services} serviceDocCatalog={serviceDocCatalog}
                onUpdateCatalog={handleUpdateCatalog} onAddService={handleAddService}
                onSubmit={editingRecord ? handleUpdate : handleAdd} onCancel={() => { setIsFormOpen(false); setEditingRecord(null); }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;