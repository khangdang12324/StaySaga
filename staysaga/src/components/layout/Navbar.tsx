'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, User, Globe, LogOut, CalendarCheck, Heart, Star, Home, Settings, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { logout } from '@/core/auth/actions'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    
    // Check auth session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    }
    checkSession()

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    // Click outside to close dropdown
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('mousedown', handleClickOutside)
      authListener.subscription.unsubscribe()
    }
  }, [])

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  const userAvatar = user?.user_metadata?.avatar_url || null

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out',
          isScrolled 
            ? 'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-sm py-4' 
            : 'bg-transparent py-6'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className={cn(
                "text-2xl font-black tracking-tighter transition-colors",
                isScrolled ? "text-rose-600" : "text-white"
              )}>
                StaySaga<span className="text-rose-500">.</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/destinations" className={cn("font-medium transition-colors hover:text-rose-500", isScrolled ? "text-gray-700 dark:text-gray-200" : "text-white/90")}>Điểm đến</Link>
              <Link href="/homestays" className={cn("font-medium transition-colors hover:text-rose-500", isScrolled ? "text-gray-700 dark:text-gray-200" : "text-white/90")}>Homestays</Link>
              <Link href="/blog" className={cn("font-medium transition-colors hover:text-rose-500", isScrolled ? "text-gray-700 dark:text-gray-200" : "text-white/90")}>Trải nghiệm</Link>
            </div>

            {/* Actions */}
            <div className="hidden md:flex items-center gap-4">
              <button className={cn("p-2 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10", isScrolled ? "text-gray-700" : "text-white")}>
                <Globe className="w-5 h-5" />
              </button>
              
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={cn(
                      "flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full font-medium transition-all shadow-sm hover:shadow-md border",
                      isScrolled 
                        ? "bg-white border-gray-200 text-gray-700 hover:bg-gray-50" 
                        : "bg-white/10 text-white backdrop-blur-sm border-white/20 hover:bg-white/20"
                    )}
                  >
                    {userAvatar ? (
                      <img src={userAvatar} alt={userName} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-sm">
                        {userName[0].toUpperCase()}
                      </div>
                    )}
                    <Menu className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-3 w-72 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden"
                      >
                        {/* User Info Header */}
                        <div className="px-5 py-4 bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800">
                          <div className="flex items-center gap-3">
                            {userAvatar ? (
                              <img src={userAvatar} alt={userName} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold">
                                {userName[0].toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-white truncate">{userName}</p>
                              <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          <Link href="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>Tài khoản của tôi</span>
                          </Link>
                          <Link href="/bookings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                            <CalendarCheck className="w-4 h-4 text-gray-400" />
                            <span>Đặt phòng & Chuyến đi</span>
                          </Link>
                          <Link href="/favorites" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                            <Heart className="w-4 h-4 text-gray-400" />
                            <span>Đã lưu</span>
                          </Link>
                          <Link href="/reviews" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                            <Star className="w-4 h-4 text-gray-400" />
                            <span>Đánh giá của tôi</span>
                          </Link>
                        </div>

                        <hr className="border-gray-100 dark:border-zinc-800" />

                        <div className="py-2">
                          <Link href="/host" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                            <Home className="w-4 h-4 text-gray-400" />
                            <span>Quản lý chỗ ở (Host)</span>
                          </Link>
                          <Link href="/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                            <Settings className="w-4 h-4 text-gray-400" />
                            <span>Cài đặt</span>
                          </Link>
                          <Link href="/help" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                            <HelpCircle className="w-4 h-4 text-gray-400" />
                            <span>Trợ giúp</span>
                          </Link>
                        </div>

                        <hr className="border-gray-100 dark:border-zinc-800" />

                        <div className="py-2">
                          <form action={logout}>
                            <button 
                              type="submit" 
                              onClick={() => setDropdownOpen(false)}
                              className="w-full flex items-center gap-3 px-5 py-3 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors font-medium"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Đăng xuất</span>
                            </button>
                          </form>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link 
                  href="/login" 
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all shadow-sm hover:shadow-md",
                    isScrolled 
                      ? "bg-rose-600 text-white hover:bg-rose-700" 
                      : "bg-white/10 text-white backdrop-blur-sm border border-white/20 hover:bg-white/20"
                  )}
                >
                  <User className="w-4 h-4" />
                  <span>Đăng nhập</span>
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setMobileMenuOpen(true)}
                className={cn("p-2 rounded-full", isScrolled ? "text-gray-900" : "text-white")}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-white dark:bg-zinc-950 flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-800">
              <span className="text-2xl font-black text-rose-600">StaySaga.</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile User Info */}
            {user && (
              <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900">
                <div className="flex items-center gap-3">
                  {userAvatar ? (
                    <img src={userAvatar} alt={userName} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-lg">
                      {userName[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{userName}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto py-4 px-6 flex flex-col gap-1">
              <Link href="/destinations" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 text-lg font-medium">
                <Globe className="w-5 h-5 text-gray-400" /> Điểm đến
              </Link>
              <Link href="/homestays" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 text-lg font-medium">
                <Home className="w-5 h-5 text-gray-400" /> Homestays
              </Link>
              <Link href="/blog" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 text-lg font-medium">
                <Star className="w-5 h-5 text-gray-400" /> Trải nghiệm
              </Link>

              {user && (
                <>
                  <hr className="my-3 border-gray-100 dark:border-zinc-800" />
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 text-lg font-medium">
                    <User className="w-5 h-5 text-gray-400" /> Tài khoản
                  </Link>
                  <Link href="/bookings" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 text-lg font-medium">
                    <CalendarCheck className="w-5 h-5 text-gray-400" /> Đặt phòng & Chuyến đi
                  </Link>
                  <Link href="/favorites" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 text-lg font-medium">
                    <Heart className="w-5 h-5 text-gray-400" /> Đã lưu
                  </Link>
                  <Link href="/reviews" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 text-lg font-medium">
                    <Star className="w-5 h-5 text-gray-400" /> Đánh giá
                  </Link>
                  <Link href="/host" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 text-lg font-medium">
                    <Home className="w-5 h-5 text-gray-400" /> Quản lý chỗ ở
                  </Link>
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-zinc-800">
              {user ? (
                <form action={logout}>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex justify-center items-center gap-2 bg-gray-100 text-rose-600 dark:bg-zinc-800 py-4 rounded-xl font-medium"
                  >
                    <LogOut className="w-5 h-5" />
                    Đăng xuất
                  </button>
                </form>
              ) : (
                <Link 
                  href="/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex justify-center items-center gap-2 bg-rose-600 text-white py-4 rounded-xl font-medium shadow-md"
                >
                  <User className="w-5 h-5" />
                  Đăng nhập / Đăng ký
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
