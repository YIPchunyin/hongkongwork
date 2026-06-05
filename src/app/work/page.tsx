'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';

interface WorkItem {
  _id: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  location: string;
  duration: number;
  note: string;
}

interface Stats {
  todayHours: number;
  todayMinutes: number;
  todayRecords: number;
  totalLocations: number;
  locations: string[];
}

export default function WorkPage() {
  const { user, loading } = useAuth();

  const [records, setRecords] = useState<WorkItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [clocking, setClocking] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [fetching, setFetching] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isClockedIn, setIsClockedIn] = useState(false);

  const fetchRecords = useCallback(async () => {
    setFetching(true);
    try {
      const params = new URLSearchParams({ date: selectedDate, limit: '100' });
      const res = await fetch(`/api/work?${params}`);
      const json = await res.json();

      if (json.success) {
        setRecords(json.data.items);
        setStats(json.data.stats);
        // Check if currently clocked in (no clockOut for today)
        const today = new Date().toISOString().split('T')[0];
        if (selectedDate === today) {
          const openRecords = json.data.items.filter((r: WorkItem) => !r.clockOut);
          setIsClockedIn(openRecords.length > 0);
        }
      }
    } catch {
      // ignore
    } finally {
      setFetching(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (user) fetchRecords();
  }, [user, fetchRecords]);

  const handleClock = async (action: 'in' | 'out') => {
    setClocking(true);
    setMessage(null);

    // Try to get current location
    let currentLocation = location;
    if (!currentLocation && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        currentLocation = `${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(4)}`;
      } catch {
        // Location not available
      }
    }

    try {
      const res = await fetch('/api/work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          location: currentLocation || location || '未记录',
          note,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setMessage({ type: 'success', text: json.message });
        setNote('');
        fetchRecords();
        if (action === 'in') setIsClockedIn(true);
        else setIsClockedIn(false);
      } else {
        setMessage({ type: 'error', text: json.error || '操作失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' });
    } finally {
      setClocking(false);
    }
  };

  if (!loading && !user) {
    return <div className="text-center py-20 text-gray-500">请先登录</div>;
  }

  if (loading) {
    return <div className="text-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  }

  const today = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === today;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">上班统计</h1>
        <p className="text-gray-500 mt-1">记录上下班时间、工作地点和时长</p>
      </div>

      {/* Clock In/Out Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">
              {isToday ? '今日状态' : `查看 ${selectedDate} 记录`}
            </p>
            {stats && isToday && (
              <p className="text-2xl font-bold text-gray-800">
                {stats.todayHours > 0 ? `${stats.todayHours.toFixed(1)} 小时` : '未打卡'}
              </p>
            )}
          </div>

          {isToday && (
            <div className="flex gap-3">
              {!isClockedIn ? (
                <button
                  onClick={() => handleClock('in')}
                  disabled={clocking}
                  className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {clocking ? '处理中...' : '🔵 上班打卡'}
                </button>
              ) : (
                <button
                  onClick={() => handleClock('out')}
                  disabled={clocking}
                  className="px-6 py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {clocking ? '处理中...' : '🟠 下班打卡'}
                </button>
              )}
            </div>
          )}
        </div>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Optional location/note input */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="工作地点（如：中环写字楼、旺角商铺）"
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="备注"
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">今日工时</p>
            <p className="text-2xl font-bold text-gray-800">{stats.todayHours.toFixed(1)}h</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">今日打卡</p>
            <p className="text-2xl font-bold text-gray-800">{stats.todayRecords} 次</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">去过的地方</p>
            <p className="text-2xl font-bold text-purple-600">{stats.totalLocations}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">地点列表</p>
            <div className="text-xs text-gray-500 truncate" title={stats.locations.join(', ')}>
              {stats.locations.length > 0 ? stats.locations.join(', ') : '暂无'}
            </div>
          </div>
        </div>
      )}

      {/* Date Filter */}
      <div className="mb-4">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
        />
      </div>

      {/* Record List */}
      {fetching ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" /></div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-400">{isToday ? '今天还没有打卡记录，点击上方按钮开始' : '该日期没有记录'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {records.map((record) => {
              const clockInTime = new Date(record.clockIn).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
              const clockOutTime = record.clockOut
                ? new Date(record.clockOut).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
                : '进行中';
              const hours = Math.floor(record.duration / 60);
              const mins = record.duration % 60;

              return (
                <div key={record._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm ${
                        record.clockOut ? 'bg-green-500' : 'bg-blue-500 animate-pulse'
                      }`}>
                        {record.clockOut ? '✓' : '○'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {clockInTime} - {clockOutTime}
                        </p>
                        <p className="text-xs text-gray-400">
                          {record.location || '地点未记录'}
                          {record.note ? ` · ${record.note}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">
                        {record.duration > 0 ? `${hours}h ${mins}m` : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
