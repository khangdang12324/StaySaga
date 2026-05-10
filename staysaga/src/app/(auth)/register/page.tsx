'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Github, Loader2 } from 'lucide-react'
import { signup, signInWithGithub } from '@/actions/auth.actions'

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(async (prevState: any, formData: FormData) => {
    return await signup(formData)
  }, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Tạo tài khoản StaySaga
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Đã có tài khoản?{' '}
            <Link href="/login" className="font-medium text-rose-600 hover:text-rose-500 transition-colors">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" action={formAction}>
          {state?.error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm text-center">
              {state.error}
            </div>
          )}
          <div className="rounded-md space-y-4 shadow-sm">
            <div>
              <label htmlFor="fullName" className="sr-only">Họ và tên</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-rose-500 focus:border-rose-500 focus:z-10 sm:text-sm transition-all"
                placeholder="Họ và tên"
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">Email</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-rose-500 focus:border-rose-500 focus:z-10 sm:text-sm transition-all"
                placeholder="Địa chỉ Email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Mật khẩu</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-rose-500 focus:border-rose-500 focus:z-10 sm:text-sm transition-all"
                placeholder="Mật khẩu"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={pending}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {pending ? <Loader2 className="animate-spin w-5 h-5" /> : 'Đăng ký'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Hoặc đăng ký bằng</span>
            </div>
          </div>

          <div className="mt-6">
            <form action={signInWithGithub}>
              <button
                type="submit"
                className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-all"
              >
                <Github className="w-5 h-5 mr-2" />
                GitHub
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
