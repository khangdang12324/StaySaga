'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  User, MapPin, CalendarCheck, Heart, Star, Settings, Shield, Wallet, 
  Bell, Plane, Globe, Award, ChevronRight, Camera, Sparkles, 
  TrendingUp, Clock, Gift, MessageCircle, Zap, Crown
} from 'lucide-react'
import Link from 'next/link'

const LEVELS = [
  { name: 'Explorer', min: 0, color: 'from-gray-400 to-gray-600', icon: '🌱' },
  { name: 'Voyager', min: 3, color: 'from-blue-400 to-blue-600', icon: '🧭' },
  { name: 'Elite Traveler', min: 8, color: 'from-purple-400 to-purple-600', icon: '✈️' },
  { name: 'Nomad Prestige', min: 15, color: 'from-amber-400 to-amber-600', icon: '👑' },
  { name: 'Global Legend', min: 30, color: 'from-rose-400 to-rose-600', icon: '🌍' },
]

function getLevel(stays: number) {
  let current = LEVELS[0]
  let next = LEVELS[1]
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (stays >= LEVELS[i].min) { current = LEVELS[i]; next = LEVELS[i + 1] || LEVELS[i]; break }
  }
  return { current, next, staysToNext: Math.max(0, next.min - stays) }
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      setLoading(false)
    }
    init()
  }, [])

  if (loading || !user) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full" />
    </div>
  )

  const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]
  const avatar = user.user_metadata?.avatar_url
  const totalStays = 2
  const { current: level, next: nextLevel, staysToNext } = getLevel(totalStays)
  const progress = nextLevel.min > 0 ? Math.min(100, (totalStays / nextLevel.min) * 100) : 100

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: User },
    { id: 'trips', label: 'Chuyến đi', icon: Plane },
    { id: 'saved', label: 'Đã lưu', icon: Heart },
    { id: 'wallet', label: 'Ví', icon: Wallet },
    { id: 'security', label: 'Bảo mật', icon: Shield },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* Hero */}
      <div className="relative pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-600/20 via-purple-600/10 to-transparent" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />

        <div className="relative max-w-6xl mx-auto px-4 py-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row items-start gap-8">
            
            {/* Avatar */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 to-purple-500 rounded-full blur-sm opacity-60 group-hover:opacity-100 transition-opacity" />
              {avatar ? (
                <img src={avatar} alt={name} className="relative w-28 h-28 rounded-full object-cover border-4 border-zinc-950" />
              ) : (
                <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-4xl font-bold border-4 border-zinc-950">
                  {name?.[0]?.toUpperCase()}
                </div>
              )}
              <button className="absolute bottom-1 right-1 bg-zinc-800 p-2 rounded-full border border-zinc-700 opacity-0 group-hover:opacity-100 transition-all hover:bg-zinc-700">
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl md:text-4xl font-black">Xin chào, {name} {level.icon}</h1>
              </div>
              <p className="text-zinc-400 mb-4">{user.email}</p>

              {/* Level */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 max-w-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`bg-gradient-to-r ${level.color} bg-clip-text text-transparent font-extrabold text-lg`}>{level.name}</span>
                    <Crown className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-xs text-zinc-500">{totalStays} chuyến · Còn {staysToNext} để lên {nextLevel.name}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1.5, ease: 'easeOut' }} className={`h-full bg-gradient-to-r ${level.color} rounded-full`} />
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Chuyến đi', value: totalStays, icon: Plane },
                { label: 'Đã lưu', value: 5, icon: Heart },
                { label: 'Đánh giá', value: 1, icon: Star },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center hover:bg-white/10 transition-colors cursor-default">
                  <s.icon className="w-5 h-5 mx-auto mb-2 text-zinc-400" />
                  <p className="text-2xl font-black">{s.value}</p>
                  <p className="text-xs text-zinc-500">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[72px] z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'overview' && <OverviewTab name={name} level={level} />}
        {activeTab === 'trips' && <TripsTab />}
        {activeTab === 'saved' && <SavedTab />}
        {activeTab === 'wallet' && <WalletTab />}
        {activeTab === 'security' && <SecurityTab user={user} />}
        {activeTab === 'settings' && <SettingsTab user={user} name={name} />}
      </div>
    </div>
  )
}

/* ========== TAB: OVERVIEW ========== */
function OverviewTab({ name, level }: { name: string, level: any }) {
  const quickLinks = [
    { href: '/bookings', icon: CalendarCheck, label: 'Đặt phòng & Chuyến đi', desc: 'Xem lịch trình sắp tới', color: 'from-blue-500/20 to-blue-600/5' },
    { href: '/favorites', icon: Heart, label: 'Đã lưu', desc: 'Bộ sưu tập yêu thích', color: 'from-rose-500/20 to-rose-600/5' },
    { href: '/reviews', icon: Star, label: 'Đánh giá', desc: 'Reviews đã viết', color: 'from-amber-500/20 to-amber-600/5' },
    { href: '/host', icon: Globe, label: 'Host Dashboard', desc: 'Quản lý chỗ ở của bạn', color: 'from-emerald-500/20 to-emerald-600/5' },
  ]

  const achievements = [
    { icon: '🎯', title: 'Chuyến đi đầu tiên', done: true },
    { icon: '⭐', title: 'Đánh giá đầu tiên', done: true },
    { icon: '💎', title: '5 lượt đặt phòng', done: false },
    { icon: '🌍', title: '3 thành phố', done: false },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link href={link.href} className={`block bg-gradient-to-br ${link.color} border border-white/5 rounded-2xl p-6 hover:border-white/20 hover:scale-[1.02] transition-all group`}>
              <link.icon className="w-6 h-6 mb-3 text-zinc-300 group-hover:text-white transition-colors" />
              <h3 className="font-bold mb-1">{link.label}</h3>
              <p className="text-sm text-zinc-500">{link.desc}</p>
              <ChevronRight className="w-4 h-4 mt-3 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-1 transition-all" />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Achievements + Membership */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Membership Card */}
        <div className="lg:col-span-2">
          <div className={`relative overflow-hidden bg-gradient-to-br ${level.color} rounded-3xl p-8 h-full`}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative">
              <p className="text-white/60 text-sm font-medium mb-1">STAYSAGA MEMBERSHIP</p>
              <h3 className="text-2xl font-black mb-6">{level.name}</h3>
              <p className="text-white/80 text-sm mb-1">{name}</p>
              <p className="text-white/50 text-xs">Member since 2026</p>
              <div className="mt-6 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-white/80" />
                <span className="text-sm text-white/80">Ưu đãi giảm 10% cho chuyến tiếp theo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="lg:col-span-3 bg-white/5 border border-white/5 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-lg flex items-center gap-2"><Award className="w-5 h-5 text-amber-400" /> Thành tựu</h3>
            <span className="text-xs text-zinc-500">2/4 hoàn thành</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {achievements.map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.05 }} className={`text-center p-4 rounded-2xl border transition-all ${a.done ? 'bg-white/5 border-white/10' : 'bg-zinc-900/50 border-zinc-800/50 opacity-50'}`}>
                <span className="text-2xl block mb-2">{a.icon}</span>
                <p className="text-xs font-medium">{a.title}</p>
                {a.done && <p className="text-[10px] text-emerald-400 mt-1">✓ Đã đạt</p>}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Suggestion */}
      <div className="bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-rose-500/10 border border-white/5 rounded-3xl p-6 flex items-center gap-5">
        <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shrink-0">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold mb-1">Gợi ý từ AI ✨</h3>
          <p className="text-sm text-zinc-400">Dựa trên lịch sử tìm kiếm, bạn có thể thích <strong className="text-white">Cabin rừng thông Đà Lạt</strong> — giá từ 1.200.000đ/đêm.</p>
        </div>
        <Link href="/homestays?location=Đà+Lạt" className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors whitespace-nowrap">Xem ngay</Link>
      </div>
    </motion.div>
  )
}

/* ========== TAB: TRIPS ========== */
function TripsTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
      <Plane className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
      <h2 className="text-xl font-bold mb-2">Chưa có chuyến đi nào</h2>
      <p className="text-zinc-500 mb-6">Khám phá những homestay tuyệt vời và bắt đầu hành trình!</p>
      <Link href="/homestays" className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 py-3 rounded-xl transition-all">Khám phá ngay</Link>
    </motion.div>
  )
}

/* ========== TAB: SAVED ========== */
function SavedTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
      <Heart className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
      <h2 className="text-xl font-bold mb-2">Chưa lưu chỗ ở nào</h2>
      <p className="text-zinc-500 mb-6">Nhấn vào trái tim để lưu chỗ ở yêu thích.</p>
      <Link href="/homestays" className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 py-3 rounded-xl transition-all">Khám phá ngay</Link>
    </motion.div>
  )
}

/* ========== TAB: WALLET ========== */
function WalletTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Số dư ví', value: '0đ', icon: Wallet, color: 'from-emerald-500/20 to-emerald-600/5' },
          { label: 'Cashback', value: '0đ', icon: TrendingUp, color: 'from-blue-500/20 to-blue-600/5' },
          { label: 'Voucher', value: '1', icon: Gift, color: 'from-amber-500/20 to-amber-600/5' },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`bg-gradient-to-br ${item.color} border border-white/5 rounded-2xl p-6`}>
            <item.icon className="w-6 h-6 mb-3 text-zinc-400" />
            <p className="text-2xl font-black">{item.value}</p>
            <p className="text-sm text-zinc-500">{item.label}</p>
          </motion.div>
        ))}
      </div>
      <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
        <h3 className="font-bold mb-4">Lịch sử giao dịch</h3>
        <p className="text-zinc-500 text-sm text-center py-8">Chưa có giao dịch nào.</p>
      </div>
    </motion.div>
  )
}

/* ========== TAB: SECURITY ========== */
function SecurityTab({ user }: { user: any }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 max-w-2xl">
      <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Điểm bảo mật: Tốt</h3>
            <p className="text-sm text-zinc-500">Tài khoản của bạn được bảo vệ.</p>
          </div>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full w-[70%] bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
        </div>
      </div>
      {[
        { label: 'Email xác thực', value: user.email, done: true },
        { label: 'Xác thực 2 lớp (2FA)', value: 'Chưa bật', done: false },
        { label: 'Đăng nhập bằng Google', value: 'Đã liên kết', done: true },
      ].map((item, i) => (
        <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="font-medium">{item.label}</p>
            <p className="text-sm text-zinc-500">{item.value}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.done ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
            {item.done ? '✓ Đã bật' : 'Bật ngay'}
          </span>
        </div>
      ))}
    </motion.div>
  )
}

/* ========== TAB: SETTINGS ========== */
function SettingsTab({ user, name }: { user: any, name: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
      <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
        <h3 className="font-bold mb-5">Thông tin cá nhân</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-500 mb-1">Họ và tên</label>
            <input type="text" defaultValue={name} className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all text-white" />
          </div>
          <div>
            <label className="block text-sm text-zinc-500 mb-1">Email</label>
            <input type="email" defaultValue={user.email} disabled className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm text-zinc-500 mb-1">Số điện thoại</label>
            <input type="tel" placeholder="Chưa cập nhật" className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all text-white placeholder-zinc-600" />
          </div>
          <div>
            <label className="block text-sm text-zinc-500 mb-1">Ngôn ngữ</label>
            <select className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl outline-none text-white">
              <option>🇻🇳 Tiếng Việt</option>
              <option>🇺🇸 English</option>
            </select>
          </div>
        </div>
        <button className="mt-6 bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 py-3 rounded-xl transition-all">Lưu thay đổi</button>
      </div>
      <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6">
        <h3 className="font-bold text-red-400 mb-2">Vùng nguy hiểm</h3>
        <p className="text-sm text-zinc-500 mb-4">Xóa tài khoản vĩnh viễn. Hành động này không thể hoàn tác.</p>
        <button className="px-6 py-2.5 border border-red-500/30 text-red-400 font-medium rounded-xl hover:bg-red-500/10 transition-colors text-sm">Xóa tài khoản</button>
      </div>
    </motion.div>
  )
}
