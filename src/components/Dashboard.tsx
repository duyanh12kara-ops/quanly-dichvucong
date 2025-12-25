
import React, { useMemo } from 'react';
import { CustomerRecord, ServiceStatus } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

interface DashboardProps {
  records: CustomerRecord[];
}

const Dashboard: React.FC<DashboardProps> = ({ records }) => {
  const stats = useMemo(() => ({
    total: records.length,
    completed: records.filter(r => r.status === ServiceStatus.COMPLETED).length,
    processing: records.filter(r => r.status === ServiceStatus.PROCESSING).length,
    pending: records.filter(r => r.status === ServiceStatus.PENDING).length,
  }), [records]);

  const pieData = [
    { name: 'Hoàn thành', value: stats.completed, color: '#10b981' },
    { name: 'Xử lý', value: stats.processing, color: '#6366f1' },
    { name: 'Đang chờ', value: stats.pending, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Tổng số hồ sơ', val: stats.total, color: 'bg-indigo-600', icon: '📁' },
          { label: 'Đã hoàn thành', val: stats.completed, color: 'bg-emerald-600', icon: '✅' },
          { label: 'Đang thực hiện', val: stats.processing, color: 'bg-blue-600', icon: '⚡' },
          { label: 'Chờ xử lý', val: stats.pending, color: 'bg-amber-600', icon: '⏳' },
        ].map((item, i) => (
          <div key={i} className={`${item.color} p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden transform hover:-translate-y-2 transition-all duration-300 border border-white/10`}>
            <div className="relative z-10">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">{item.label}</div>
              <div className="text-5xl font-black tracking-tighter">{item.val}</div>
            </div>
            <div className="absolute -right-4 -bottom-4 text-8xl opacity-10 rotate-12">{item.icon}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900/50 p-10 rounded-[3rem] shadow-xl border border-slate-800">
          <h3 className="text-xl font-black text-white mb-10 flex items-center gap-4">
            <span className="w-1.5 h-8 bg-indigo-500 rounded-full"></span> Lưu lượng hồ sơ gần đây
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={records.slice(0, 8).reverse().map(r => ({ name: r.customerName.split(' ').pop(), val: 1 }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: '#1e293b'}} 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '15px', border: '1px solid #334155', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }} 
                  itemStyle={{color: '#fff', fontSize: '10px', fontWeight: 'bold'}}
                />
                <Bar dataKey="val" fill="#6366f1" radius={[8, 8, 8, 8]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/50 p-10 rounded-[3rem] shadow-xl border border-slate-800 flex flex-col items-center">
          <h3 className="text-xl font-black text-white mb-10 w-full">Cơ cấu trạng thái</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={75} outerRadius={95} paddingAngle={8} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={index} fill={entry.color} stroke="none" />)}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', borderRadius: '15px', border: '1px solid #334155' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 gap-3 w-full mt-10">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.name}</span>
                </div>
                <span className="text-sm font-black text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;