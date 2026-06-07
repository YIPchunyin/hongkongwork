'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if not logged in
  if (!loading && !user) {
    router.push('/login');
    return null;
  }

  if (loading || !user) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">账号设置</h1>

        {/* Profile Info */}
        <section className="apple-card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">个人信息</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md">
                {user.name?.charAt(0).toUpperCase() || user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">{user.name || user.username}</p>
                <p className="text-sm text-gray-500">@{user.username}</p>
                {user.email && (
                  <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Edit Profile */}
        <EditProfileSection />

        {/* Change Password */}
        <ChangePasswordForm />
      </div>
    </div>
  );
}

function EditProfileSection() {
  const { user, updateProfile } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [name, setName] = useState(user?.name || '');
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!username || !name) {
      setMessage({ type: 'error', text: '用户名和姓名不能为空' });
      return;
    }
    if (username.length < 2 || username.length > 20) {
      setMessage({ type: 'error', text: '用户名长度2-20个字符' });
      return;
    }

    setSubmitting(true);
    const result = await updateProfile(username, name);
    setSubmitting(false);

    if (result.success) {
      setMessage({ type: 'success', text: '个人信息更新成功！' });
      setEditing(false);
    } else {
      setMessage({ type: 'error', text: result.error || '更新失败' });
    }
  };

  const handleCancel = () => {
    setUsername(user?.username || '');
    setName(user?.name || '');
    setEditing(false);
    setMessage(null);
  };

  if (!editing) {
    return (
      <section className="apple-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">编辑资料</h2>
          <button onClick={() => setEditing(true)}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl transition-colors min-h-[44px]">
            编辑
          </button>
        </div>
        <div className="space-y-2">
          <div>
            <span className="text-sm text-gray-500">用户名</span>
            <p className="text-gray-900">{user?.username}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">姓名</span>
            <p className="text-gray-900">{user?.name || user?.username}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="apple-card p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">编辑资料</h2>

      {message && (
        <div className={'mb-4 p-3 rounded-xl text-sm ' + (message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600')}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF] outline-none transition-colors"
            required minLength={2} maxLength={20} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF] outline-none transition-colors"
            required maxLength={30} />
        </div>
        <div className="flex space-x-3">
          <button type="submit" disabled={submitting}
            className="px-6 py-2.5 bg-[#007AFF] text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {submitting ? '保存中...' : '保存'}
          </button>
          <button type="button" onClick={handleCancel}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors">
            取消
          </button>
        </div>
      </form>
    </section>
  );
}

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!currentPassword || !newPassword) {
      setMessage({ type: 'error', text: '请填写所有字段' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: '新密码至少6个字符' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: '两次新密码输入不一致' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();

      if (json.success) {
        setMessage({ type: 'success', text: '密码修改成功！' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: json.error || '修改失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="apple-card p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">修改密码</h2>

      {message && (
        <div
          className={`mb-4 p-3 rounded-xl text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
            当前密码
          </label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="输入当前密码"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF] outline-none transition-colors"
            required
          />
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
            新密码
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="至少6个字符"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF] outline-none transition-colors"
            required
            minLength={6}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            确认新密码
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="再次输入新密码"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF] outline-none transition-colors"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto px-6 py-2.5 bg-[#007AFF] text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? '修改中...' : '修改密码'}
        </button>
      </form>
    </section>
  );
}




