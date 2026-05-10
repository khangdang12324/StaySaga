import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Star, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default async function ReviewsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, homestay:homestays(name, slug, city)')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  const hasReviews = reviews && reviews.length > 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="pt-28 pb-20 max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Đánh giá của tôi</h1>
        <p className="text-gray-500 mb-8">Xem lại những đánh giá bạn đã viết cho các chỗ ở.</p>

        {hasReviews ? (
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <div key={review.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <Link href={`/homestays/${review.homestay?.slug}`} className="font-bold text-gray-900 dark:text-white hover:text-rose-600 transition-colors">
                      {review.homestay?.name}
                    </Link>
                    <p className="text-sm text-gray-500">{review.homestay?.city}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300">{review.comment}</p>
                <p className="text-xs text-gray-400 mt-3">{new Date(review.created_at).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800">
            <MessageSquare className="w-16 h-16 text-gray-200 dark:text-zinc-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Chưa có đánh giá nào</h2>
            <p className="text-gray-500 mb-6">Sau khi hoàn thành chuyến đi, bạn có thể để lại đánh giá cho chỗ ở.</p>
            <Link href="/bookings" className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-md inline-block">
              Xem chuyến đi
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
