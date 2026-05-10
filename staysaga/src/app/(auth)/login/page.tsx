'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Github, Loader2 } from 'lucide-react'
import { login, signInWithGithub } from '@/actions/auth.actions'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(async (prevState: any, formData: FormData) => {
    return await login(formData)
  }, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Chào mừng trở lại StaySaga
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Hoặc{' '}
            <Link href="/register" className="font-medium text-rose-600 hover:text-rose-500 transition-colors">
              đăng ký tài khoản mới
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
                autoComplete="current-password"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-rose-500 focus:border-rose-500 focus:z-10 sm:text-sm transition-all"
                placeholder="Mật khẩu"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 cursor-pointer">
                Ghi nhớ đăng nhập
              </label>
            </div>

            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-rose-600 hover:text-rose-500">
                Quên mật khẩu?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={pending}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {pending ? <Loader2 className="animate-spin w-5 h-5" /> : 'Đăng nhập'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Hoặc tiếp tục với</span>
            </div>
          </div>

          <div className="mt-6">
            <form action={signInWithGithub}>
              <button
                type="submit"
                className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-all"
              >
                <Github className="w-5 h-5 mr-2" />
                Đăng nhập bằng GitHub
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
