
import React, { useState } from 'react';
import { CustomerRecord } from '../types';
import { analyzeRecords } from '../services/geminiService';

interface AIAssistantProps {
  records: CustomerRecord[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ records }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (records.length === 0) {
      setAnalysis("Chưa có dữ liệu để phân tích.");
      return;
    }
    setLoading(true);
    const result = await analyzeRecords(records);
    setAnalysis(result || "Không thể phân tích.");
    setLoading(false);
  };

  return (
    <div className="fixed bottom-8 right-8 z-40">
      {isOpen ? (
        <div className="bg-white w-80 md:w-96 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col mb-4 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <span>🤖</span> Trợ lý AI Thông minh
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-indigo-200 hover:text-white">✕</button>
          </div>
          
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {analysis ? (
              <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap italic">
                {analysis}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <p>Tôi có thể giúp bạn phân tích xu hướng và hiệu suất của danh sách hồ sơ.</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50">
            <button 
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Đang phân tích...
                </>
              ) : (
                '🚀 Phân tích ngay'
              )}
            </button>
          </div>
        </div>
      ) : null}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center text-2xl hover:bg-indigo-700 hover:scale-110 transition-all duration-300 ring-4 ring-indigo-100"
      >
        {isOpen ? '✕' : '🤖'}
      </button>
    </div>
  );
};

export default AIAssistant;