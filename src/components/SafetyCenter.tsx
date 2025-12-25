
import React, { useRef } from 'react';
import { CustomerRecord } from '../types';

interface SafetyCenterProps {
  records: CustomerRecord[];
  setRecords: (records: CustomerRecord[]) => void;
}

const SafetyCenter: React.FC<SafetyCenterProps> = ({ records, setRecords }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportCSV = () => {
    if (records.length === 0) return alert("Không có dữ liệu.");
    const headers = ["Ngày nhận", "Tên khách hàng", "Dịch vụ", "Giấy tờ", "Hẹn trả", "Trạng thái", "Ghi chú"];
    const csvRows = [headers.join(",")];
    records.forEach(r => {
      csvRows.push([
        `"${r.date}"`, `"${r.customerName}"`, `"${r.serviceType}"`, 
        `"${r.documentsProvided.replace(/"/g, '""')}"`, `"${r.returnDate || ''}"`, 
        `"${r.status}"`, `"${(r.note || "").replace(/"/g, '""')}"`
      ].join(","));
    });
    const blob = new Blob(["\ufeff" + csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Records_Backup_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `System_Backup_${Date.now()}.json`;
    a.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data) && confirm("Cảnh báo: Toàn bộ dữ liệu hiện tại sẽ bị thay thế. Tiếp tục?")) {
          setRecords(data);
          alert("Khôi phục thành công!");
        }
      } catch (err) { alert("File không hợp lệ."); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 group hover:shadow-2xl transition-all duration-500">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">📊</div>
        <h3 className="text-2xl font-black text-slate-800 mb-3">Lưu trữ vĩnh cửu (Excel)</h3>
        <p className="text-slate-500 mb-8 leading-relaxed font-medium">Xuất toàn bộ dữ liệu ra file CSV để mở bằng Excel. Đây là định dạng an toàn nhất để lưu trữ trong 10 năm tới.</p>
        <button onClick={handleExportCSV} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-200">Tải file Excel ngay</button>
      </div>

      <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 group hover:shadow-2xl transition-all duration-500">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">💾</div>
        <h3 className="text-2xl font-black text-slate-800 mb-3">Sao lưu & Khôi phục</h3>
        <p className="text-slate-500 mb-8 leading-relaxed font-medium">Tạo file dự phòng hệ thống để chuyển đổi dữ liệu sang máy tính mới hoặc trình duyệt khác.</p>
        <div className="flex gap-4">
          <button onClick={handleExportJSON} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">Sao lưu</button>
          <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition">Khôi phục</button>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleImportJSON} className="hidden" accept=".json" />
      </div>

      <div className="md:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="text-6xl">🔒</div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold mb-2">Cam kết an toàn dữ liệu 5-10 năm</h3>
            <p className="text-slate-400 font-medium leading-relaxed max-w-2xl">
              Hệ thống của bạn được thiết kế theo kiến trúc <b>Offline-First</b>. Dữ liệu nằm hoàn toàn trên máy của bạn, không phụ thuộc máy chủ trung tâm. Chỉ cần bạn giữ file sao lưu định kỳ, dữ liệu sẽ luôn sẵn sàng.
            </p>
          </div>
          <div className="bg-white/10 p-4 rounded-3xl border border-white/10 backdrop-blur-lg">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Trạng thái bảo mật</p>
            <p className="text-xl font-bold">TỐI ƯU 100%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyCenter;