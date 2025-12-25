
import React, { useState, useEffect } from 'react';
import { CustomerRecord, ServiceStatus } from '../types';
import { getDocumentSuggestions } from '../services/geminiService';

interface ServiceOption {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface RecordFormProps {
  initialData?: CustomerRecord;
  availableServices: ServiceOption[];
  serviceDocCatalog: Record<string, string[]>; 
  onUpdateCatalog: (serviceName: string, docs: string[]) => void;
  onAddService: (name: string) => void;
  onSubmit: (record: any) => Promise<void> | void;
  onCancel: () => void;
}

const RecordForm: React.FC<RecordFormProps> = ({ 
  initialData, 
  availableServices, 
  serviceDocCatalog,
  onUpdateCatalog,
  onAddService, 
  onSubmit, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<Omit<CustomerRecord, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    serviceType: '',
    documentsProvided: '',
    documentLink: '',
    returnDate: '',
    status: ServiceStatus.PENDING,
    note: ''
  });

  const [availableDocs, setAvailableDocs] = useState<string[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [customDoc, setCustomDoc] = useState('');
  const [isAddingService, setIsAddingService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date,
        customerName: initialData.customerName,
        serviceType: initialData.serviceType,
        documentsProvided: initialData.documentsProvided,
        documentLink: initialData.documentLink || '',
        returnDate: initialData.returnDate || '',
        status: initialData.status,
        note: initialData.note || ''
      });
      const recordDocs = initialData.documentsProvided.split(', ').filter(d => d !== '');
      setSelectedDocs(recordDocs);
      
      const catalogMemory = serviceDocCatalog[initialData.serviceType] || [];
      setAvailableDocs(Array.from(new Set([...catalogMemory, ...recordDocs])));
    }
  }, [initialData]);

  useEffect(() => {
    if (formData.serviceType) {
      const memory = serviceDocCatalog[formData.serviceType] || [];
      setAvailableDocs(prev => Array.from(new Set([...memory, ...selectedDocs])));
    }
  }, [formData.serviceType, serviceDocCatalog]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, documentsProvided: selectedDocs.join(', ') }));
  }, [selectedDocs]);

  const handleAISuggest = async () => {
    if (!formData.serviceType) return alert("Chọn dịch vụ trước.");
    setLoadingAI(true);
    const suggested = await getDocumentSuggestions(formData.serviceType);
    if (suggested && suggested.length > 0) {
      const updatedDocs = Array.from(new Set([...availableDocs, ...suggested]));
      setAvailableDocs(updatedDocs);
      onUpdateCatalog(formData.serviceType, updatedDocs);
    }
    setLoadingAI(false);
  };

  const toggleDocTick = (doc: string) => {
    setSelectedDocs(prev => prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc]);
  };

  const handleRemoveDocFromCatalog = (docToRemove: string) => {
    if (!confirm(`Xóa vĩnh viễn mẫu này?`)) return;
    const updatedDocs = availableDocs.filter(d => d !== docToRemove);
    setAvailableDocs(updatedDocs);
    setSelectedDocs(prev => prev.filter(d => d !== docToRemove));
    onUpdateCatalog(formData.serviceType, updatedDocs);
  };

  const handleAddCustomDoc = () => {
    if (customDoc.trim() && formData.serviceType) {
      const newDoc = customDoc.trim();
      const updatedDocs = Array.from(new Set([...availableDocs, newDoc]));
      setAvailableDocs(updatedDocs);
      if (!selectedDocs.includes(newDoc)) setSelectedDocs(prev => [...prev, newDoc]);
      onUpdateCatalog(formData.serviceType, updatedDocs);
      setCustomDoc('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.serviceType || !formData.customerName) return alert("Vui lòng điền đủ tên khách và dịch vụ.");
    
    setIsSubmitting(true);
    try {
      await onSubmit(initialData ? { ...formData, id: initialData.id } : formData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
      // Logic đóng modal nằm ở Component cha (App.tsx) thông qua state isFormOpen
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row h-full">
      {/* PHẦN BÊN TRÁI: DARK MODE - THÔNG TIN */}
      <div className="flex-1 p-8 lg:p-14 space-y-10 overflow-y-auto custom-scrollbar bg-slate-900">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2 block">DVC Master Engine</span>
            <h3 className="text-3xl font-black text-white tracking-tighter uppercase">Thông tin tiếp nhận</h3>
          </div>
          <button type="button" onClick={onCancel} className="w-10 h-10 flex lg:hidden items-center justify-center rounded-xl bg-slate-800 text-slate-400">✕</button>
        </div>

        <div className="space-y-10">
          <section className="space-y-4">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-[8px]">1</span>
              Hồ sơ khách hàng
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <input 
                  type="text" required placeholder="Họ tên khách hàng..."
                  className="w-full px-6 py-4 bg-slate-800 border-2 border-slate-700/50 focus:border-indigo-500 rounded-2xl outline-none font-bold text-white transition-all placeholder:text-slate-600"
                  value={formData.customerName}
                  onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                />
              </div>
              <input 
                type="date" required
                className="w-full px-6 py-4 bg-slate-800 border-2 border-slate-700/50 focus:border-indigo-500 rounded-2xl outline-none font-bold text-white"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-[8px]">2</span>
                Loại dịch vụ
              </h4>
              <button type="button" onClick={() => setIsAddingService(!isAddingService)} className="text-[9px] font-black text-indigo-400 hover:text-white uppercase">
                {isAddingService ? 'Đóng' : '+ Thêm mới'}
              </button>
            </div>

            {isAddingService && (
              <div className="flex gap-2 p-3 bg-slate-800 rounded-2xl border border-slate-700 animate-in slide-in-from-top-2">
                <input 
                  type="text" placeholder="Tên dịch vụ mới..."
                  className="flex-1 bg-transparent px-4 py-2 outline-none text-xs font-bold text-white"
                  value={newServiceName} onChange={e => setNewServiceName(e.target.value)}
                />
                <button type="button" onClick={() => { if(newServiceName) { onAddService(newServiceName); setFormData({...formData, serviceType: newServiceName}); setIsAddingService(false); setNewServiceName(''); } }} className="bg-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black text-white">THÊM</button>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {availableServices.map((service) => (
                <div 
                  key={service.id} onClick={() => setFormData({ ...formData, serviceType: service.name })}
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center group ${
                    formData.serviceType === service.name 
                    ? `bg-indigo-600 border-indigo-500 text-white shadow-xl` 
                    : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">{service.icon}</span>
                  <span className="text-[9px] font-black uppercase tracking-tight">{service.name}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-[8px]">3</span>
              Chi tiết xử lý
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-600 uppercase ml-1">Ngày hẹn trả</label>
                <input 
                  type="date"
                  className="w-full px-5 py-3.5 bg-slate-800 border-2 border-slate-700/50 focus:border-amber-500 rounded-xl font-bold text-amber-500 outline-none"
                  value={formData.returnDate}
                  onChange={e => setFormData({ ...formData, returnDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-600 uppercase ml-1">Trạng thái</label>
                <select 
                  className="w-full px-5 py-3.5 bg-slate-800 border-2 border-slate-700/50 focus:border-indigo-500 rounded-xl font-bold text-slate-300 outline-none appearance-none"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as ServiceStatus })}
                >
                  {Object.values(ServiceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-600 uppercase ml-1">Link tài liệu (Drive/Folder)</label>
              <input 
                type="url" placeholder="https://drive.google.com/..."
                className="w-full px-6 py-4 bg-indigo-900/20 border-2 border-indigo-900/30 focus:border-indigo-500 rounded-2xl outline-none font-bold text-indigo-400 placeholder:font-normal placeholder:text-slate-700"
                value={formData.documentLink}
                onChange={e => setFormData({ ...formData, documentLink: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-600 uppercase ml-1">Ghi chú quan trọng</label>
              <input 
                type="text" placeholder="Thêm mô tả hoặc lưu ý..."
                className="w-full px-6 py-4 bg-slate-800 border-2 border-slate-700/50 focus:border-indigo-500 rounded-2xl outline-none font-bold text-slate-300"
                value={formData.note}
                onChange={e => setFormData({ ...formData, note: e.target.value })}
              />
            </div>
          </section>
        </div>
      </div>

      {/* PHẦN BÊN PHẢI: LIGHT CONTRAST - KIỂM SOÁT GIẤY TỜ (SÁNG ĐỐI LẬP) */}
      <div className="w-full lg:w-[450px] bg-slate-50 p-8 lg:p-12 flex flex-col relative">
        <button type="button" onClick={onCancel} className="hidden lg:flex absolute top-8 right-8 w-10 h-10 items-center justify-center rounded-2xl bg-slate-200 text-slate-500 hover:bg-rose-500 hover:text-white transition-all">✕</button>
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Kiểm soát</h4>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Danh mục hồ sơ mẫu</span>
            </div>
            <button 
              type="button" onClick={handleAISuggest}
              disabled={loadingAI || !formData.serviceType}
              className="bg-indigo-100 hover:bg-indigo-600 text-indigo-600 hover:text-white px-5 py-2.5 rounded-full text-[10px] font-black transition-all shadow-sm flex items-center gap-2 disabled:opacity-30"
            >
              {loadingAI ? '⌛' : '✨ AI Mẫu'}
            </button>
          </div>

          {/* Danh mục giấy tờ - Sáng sủa, dễ đọc */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-8 pr-2 custom-scrollbar">
            {availableDocs.length > 0 ? (
              availableDocs.map((doc, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${
                    selectedDocs.includes(doc) 
                    ? 'bg-emerald-50 border-emerald-500 shadow-sm' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleDocTick(doc)}>
                    <div className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center transition-all ${
                      selectedDocs.includes(doc) ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-transparent border border-slate-200'
                    }`}>
                      <span className="text-[10px] font-black">✓</span>
                    </div>
                    <span className={`text-[13px] font-bold leading-tight ${selectedDocs.includes(doc) ? 'text-emerald-900' : 'text-slate-600'}`}>
                      {doc}
                    </span>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemoveDocFromCatalog(doc); }}
                    className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <span>🗑️</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-300 text-center py-10">
                <div className="text-6xl mb-4 grayscale opacity-20">📑</div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mẫu giấy tờ đang trống</p>
              </div>
            )}
          </div>

          {/* Thao tác lưu trữ */}
          <div className="space-y-4 pt-6 border-t border-slate-200">
            <div className="flex gap-2">
              <input 
                type="text" placeholder="Thêm mẫu giấy tờ..."
                className="flex-1 px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none text-[13px] font-bold text-slate-800 shadow-sm focus:border-indigo-500"
                value={customDoc}
                onChange={e => setCustomDoc(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCustomDoc())}
              />
              <button 
                type="button" onClick={handleAddCustomDoc}
                className="w-14 bg-slate-900 text-white rounded-2xl font-black text-2xl hover:bg-indigo-600 transition-all shadow-lg"
              >
                +
              </button>
            </div>
            <button 
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-5 rounded-[1.8rem] font-black text-[15px] uppercase tracking-widest shadow-xl transition-all transform active:scale-95 ${
                isSubmitting 
                ? 'bg-slate-400 text-slate-200 cursor-not-allowed' 
                : 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400 shadow-emerald-200'
              }`}
            >
              {isSubmitting ? 'ĐANG LƯU HỒ SƠ...' : 'HOÀN TẤT & LƯU HỒ SƠ'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default RecordForm;