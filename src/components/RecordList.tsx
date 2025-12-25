
import React, { useState, useEffect } from 'react';
import { CustomerRecord, ServiceStatus } from '../types';

interface RecordListProps {
  records: CustomerRecord[];
  serviceDocCatalog: Record<string, string[]>;
  onEdit: (record: CustomerRecord) => void;
  onDelete: (id: string) => void;
}

const CountdownTimer: React.FC<{ targetDate: string }> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);

  useEffect(() => {
    if (!targetDate) return;

    const timer = setInterval(() => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft(null);
        clearInterval(timer);
      } else {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!targetDate) return null;
  if (!timeLeft) return <div className="text-[10px] font-black text-rose-500 animate-pulse uppercase tracking-widest mt-2 bg-rose-500/10 py-1.5 px-3 rounded-xl border border-rose-500/20 inline-block">🚩 ĐÃ QUÁ HẠN XỬ LÝ</div>;

  const { d, h, m, s } = timeLeft;
  
  let colorClass = "text-emerald-400 border-emerald-500/20 bg-emerald-500/5"; 
  if (d === 0 && h < 24) colorClass = "text-rose-500 border-rose-500/20 bg-rose-500/5"; 
  else if (d < 3) colorClass = "text-amber-500 border-amber-500/20 bg-amber-500/5";

  return (
    <div className={`mt-3 p-3 rounded-2xl border flex flex-col gap-1.5 shadow-sm ${colorClass}`}>
      <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">⏳ THỜI GIAN CÒN LẠI</div>
      <div className="flex items-center gap-2 font-black text-[16px] tracking-tight">
        {d > 0 && (
          <div className="flex items-baseline gap-0.5"><span className="text-xl">{d}</span><span className="text-[10px] opacity-60 mr-1.5">N</span></div>
        )}
        <div className="flex items-baseline gap-0.5"><span className="text-xl">{h.toString().padStart(2, '0')}</span><span className="text-[10px] opacity-60">G</span></div>
        <span className="opacity-30 mx-0.5">:</span>
        <div className="flex items-baseline gap-0.5"><span className="text-xl">{m.toString().padStart(2, '0')}</span><span className="text-[10px] opacity-60">P</span></div>
        <span className="opacity-30 mx-0.5">:</span>
        <div className="flex items-baseline gap-0.5"><span className="text-xl">{s.toString().padStart(2, '0')}</span><span className="text-[10px] opacity-60">S</span></div>
      </div>
    </div>
  );
};

const RecordList: React.FC<RecordListProps> = ({ records, serviceDocCatalog, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Lọc theo tìm kiếm
  const baseFiltered = records.filter(r => 
    r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 2. Sắp xếp: Hồ sơ 'Đã hủy' luôn nằm dưới cùng
  const sortedRecords = [...baseFiltered].sort((a, b) => {
    // Nếu a đã hủy và b chưa hủy -> a xuống dưới (1)
    if (a.status === ServiceStatus.CANCELLED && b.status !== ServiceStatus.CANCELLED) return 1;
    // Nếu a chưa hủy và b đã hủy -> a lên trên (-1)
    if (a.status !== ServiceStatus.CANCELLED && b.status === ServiceStatus.CANCELLED) return -1;
    
    // Nếu cùng trạng thái, sắp xếp theo ngày nhận (mới nhất lên đầu)
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const getDocumentStatus = (record: CustomerRecord) => {
    const providedCount = record.documentsProvided ? record.documentsProvided.split(', ').filter(d => d).length : 0;
    const catalogDocs = serviceDocCatalog[record.serviceType] || [];
    const totalRequired = catalogDocs.length;

    if (totalRequired === 0) return { label: 'CHƯA MẪU', color: 'text-slate-500 border-slate-800 bg-slate-800/20', icon: '⚪' };
    const missingCount = totalRequired - providedCount;

    if (missingCount <= 0) return { label: 'ĐỦ HỒ SƠ', color: 'text-emerald-400 border-emerald-900/50 bg-emerald-900/10', icon: '✅' };
    if (missingCount <= 2) return { label: `THIẾU ${missingCount}`, color: 'text-amber-400 border-amber-900/50 bg-amber-900/10', icon: '⚠️' };
    return { label: 'THIẾU NHIỀU', color: 'text-rose-400 border-rose-900/50 bg-rose-900/10', icon: '❌' };
  };

  const getStatusBadge = (status: ServiceStatus) => {
    const baseClass = "inline-flex items-center justify-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest min-w-[125px] border shadow-sm whitespace-nowrap";
    switch(status) {
      case ServiceStatus.COMPLETED: return <span className={`${baseClass} bg-emerald-600/20 text-emerald-400 border-emerald-500/20`}>Đã hoàn thành</span>;
      case ServiceStatus.PROCESSING: return <span className={`${baseClass} bg-indigo-600/20 text-indigo-400 border-indigo-500/20`}>Đang xử lý</span>;
      case ServiceStatus.CANCELLED: return <span className={`${baseClass} bg-rose-600/20 text-rose-400 border-rose-500/20`}>Đã hủy</span>;
      default: return <span className={`${baseClass} bg-slate-800 text-slate-500 border-slate-700`}>Chờ xử lý</span>;
    }
  };

  return (
    <div className="bg-slate-900/50 rounded-[2.5rem] border border-slate-800 overflow-hidden backdrop-blur-md shadow-2xl">
      <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="relative w-full md:w-96">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl opacity-30">🔍</span>
          <input 
            type="text" placeholder="Tìm theo tên khách hoặc dịch vụ..."
            className="w-full pl-14 pr-6 py-3.5 bg-slate-900 border border-slate-800 rounded-2xl focus:border-indigo-500 outline-none text-[13px] font-bold text-slate-200"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="px-5 py-2.5 bg-slate-800/50 rounded-xl text-[11px] text-slate-400 font-black uppercase tracking-widest border border-slate-700/50 whitespace-nowrap">
          TỔNG CỘNG: <span className="text-white ml-2 text-sm">{sortedRecords.length}</span>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1300px]">
          <thead>
            <tr className="bg-slate-950/50 text-slate-500 border-b border-slate-800">
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">Hồ sơ / Khách hàng</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] w-[220px] whitespace-nowrap">Dịch vụ</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">Kiểm soát giấy tờ</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">Kho tài liệu</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">Trạng thái & Hẹn trả</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-center whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {sortedRecords.map((record) => {
              const docStatus = getDocumentStatus(record);
              const isCancelled = record.status === ServiceStatus.CANCELLED;

              return (
                <tr key={record.id} className={`transition-all duration-300 group ${isCancelled ? 'opacity-50 grayscale hover:grayscale-0 hover:opacity-100' : 'hover:bg-slate-800/30'}`}>
                  <td className="px-8 py-6">
                    <div className="font-black text-white text-[16px] group-hover:text-indigo-400 transition-colors uppercase tracking-tight whitespace-nowrap">{record.customerName}</div>
                    <div className="text-[10px] text-slate-500 font-bold mt-1.5 uppercase tracking-widest whitespace-nowrap bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-700/50 flex items-center gap-2 w-fit">
                      <span>📅 NHẬN:</span> <span className="text-slate-300 font-black">{record.date}</span>
                    </div>
                  </td>
                  
                  <td className="px-8 py-6">
                    <div className="inline-block max-w-full">
                      <span className="text-[11px] font-black text-indigo-400 bg-indigo-950/40 px-3 py-2 rounded-xl border border-indigo-500/20 uppercase tracking-tight whitespace-nowrap block">
                        {record.serviceType}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-8 py-6">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black ${docStatus.color} shadow-sm whitespace-nowrap`}>
                      <span className="text-lg">{docStatus.icon}</span>
                      <span className="tracking-widest uppercase">{docStatus.label}</span>
                    </div>
                  </td>

                  <td className="px-8 py-6">
                    <button 
                      onClick={() => record.documentLink && window.open(record.documentLink, '_blank')}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all whitespace-nowrap ${
                        record.documentLink 
                        ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400 hover:bg-indigo-600 hover:text-white' 
                        : 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <span className="text-xl">🔗</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">Mở Drive</span>
                    </button>
                  </td>
                  
                  <td className="px-8 py-6 min-w-[300px]">
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-4 flex-wrap lg:flex-nowrap">
                        {getStatusBadge(record.status)}
                        <div className="flex flex-col bg-slate-950 border border-slate-700 px-4 py-1.5 rounded-2xl shadow-inner min-w-[130px]">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">NGÀY HẸN TRẢ:</span>
                          <span className="text-[16px] font-black text-white tracking-tight whitespace-nowrap">
                            {record.returnDate || '---'}
                          </span>
                        </div>
                      </div>
                      {!isCancelled && record.status !== ServiceStatus.COMPLETED && record.returnDate && (
                        <CountdownTimer targetDate={record.returnDate} />
                      )}
                      {isCancelled && (
                        <div className="mt-3 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[9px] font-black text-rose-500 uppercase tracking-widest">
                          Hồ sơ này đã hủy xử lý
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-8 py-6">
                    <div className="flex justify-center gap-4">
                      <button onClick={() => onEdit(record)} title="Sửa" className="w-11 h-11 flex items-center justify-center bg-slate-800 text-indigo-400 border border-slate-700 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all transform active:scale-90 shadow-lg">✏️</button>
                      <button onClick={() => onDelete(record.id)} title="Xóa" className="w-11 h-11 flex items-center justify-center bg-slate-800 text-rose-500 border border-slate-700 rounded-2xl hover:bg-rose-600 hover:text-white transition-all transform active:scale-90 shadow-lg">🗑️</button>
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

export default RecordList;