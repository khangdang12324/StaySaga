import Navbar from '@/components/layout/Navbar'
import { HelpCircle, MessageCircle, Mail, BookOpen, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function HelpPage() {
  const faqs = [
    { q: 'Làm thế nào để đặt phòng?', a: 'Chọn chỗ ở yêu thích, chọn ngày nhận/trả phòng và số khách, sau đó nhấn "Đặt phòng ngay" và hoàn tất thanh toán.' },
    { q: 'Chính sách hủy phòng như thế nào?', a: 'Mỗi chỗ ở có chính sách hủy riêng. Bạn có thể xem chi tiết tại trang thông tin của chỗ ở trước khi đặt phòng.' },
    { q: 'Tôi có thể thay đổi ngày đặt phòng không?', a: 'Bạn có thể liên hệ chủ nhà hoặc bộ phận hỗ trợ để thay đổi ngày. Tùy thuộc vào tình trạng phòng trống.' },
    { q: 'Phương thức thanh toán nào được chấp nhận?', a: 'StaySaga hỗ trợ thanh toán qua Thẻ tín dụng/ghi nợ (Visa, Mastercard), VNPay, MoMo và chuyển khoản ngân hàng.' },
    { q: 'Làm sao để trở thành Host (Chủ nhà)?', a: 'Đăng nhập vào tài khoản, vào mục "Quản lý chỗ ở" trong menu và nhấn "Đăng chỗ ở mới".' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <Navbar />
      <div className="pt-28 pb-20 max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Trung tâm Trợ giúp</h1>
        <p className="text-gray-500 mb-8">Tìm câu trả lời cho các câu hỏi thường gặp hoặc liên hệ với chúng tôi.</p>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <MessageCircle className="w-8 h-8 text-rose-500 mb-3" />
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Chat trực tuyến</h3>
            <p className="text-sm text-gray-500">Trò chuyện với đội ngũ hỗ trợ 24/7</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <Mail className="w-8 h-8 text-rose-500 mb-3" />
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Gửi email</h3>
            <p className="text-sm text-gray-500">support@staysaga.com</p>
          </div>
        </div>

        {/* FAQ */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Câu hỏi thường gặp</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm group">
              <summary className="flex items-center justify-between px-6 py-4 cursor-pointer font-medium text-gray-900 dark:text-white list-none">
                {faq.q}
                <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform" />
              </summary>
              <p className="px-6 pb-4 text-gray-600 dark:text-gray-400 text-sm">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}
