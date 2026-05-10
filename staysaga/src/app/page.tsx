import Navbar from '@/components/layout/Navbar'
import HeroSection from '@/components/home/HeroSection'
import FeaturedHomestays from '@/components/home/FeaturedHomestays'

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950">
      <Navbar />
      <HeroSection />
      <FeaturedHomestays />
      
      {/* Why Choose Us - Inline for brevity, but maintains premium feel */}
      <section className="py-24 bg-gray-50 dark:bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-16 text-gray-900 dark:text-white">
            Tại sao chọn StaySaga?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { title: 'Chất lượng hàng đầu', desc: 'Mọi chỗ ở đều được kiểm duyệt kỹ càng để đảm bảo tiêu chuẩn cao nhất.' },
              { title: 'Thanh toán an toàn', desc: 'Hệ thống thanh toán bảo mật đa lớp, hỗ trợ nhiều phương thức linh hoạt.' },
              { title: 'Hỗ trợ 24/7', desc: 'Đội ngũ chăm sóc khách hàng luôn sẵn sàng giải quyết mọi vấn đề của bạn.' }
            ].map((item, i) => (
              <div key={i} className="p-8 rounded-3xl bg-white dark:bg-zinc-900 shadow-sm border border-gray-100 dark:border-zinc-800 hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-black">{i + 1}</span>
                </div>
                <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 text-zinc-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <span className="text-2xl font-black text-white mb-6 block">StaySaga.</span>
            <p className="max-w-md">Nền tảng đặt phòng trực tuyến hàng đầu, mang đến những trải nghiệm lưu trú không thể quên cho mỗi chuyến đi của bạn.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Khám phá</h4>
            <ul className="space-y-4">
              <li><a href="#" className="hover:text-rose-500 transition-colors">Điểm đến nổi bật</a></li>
              <li><a href="#" className="hover:text-rose-500 transition-colors">Homestay cao cấp</a></li>
              <li><a href="#" className="hover:text-rose-500 transition-colors">Cẩm nang du lịch</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Hỗ trợ</h4>
            <ul className="space-y-4">
              <li><a href="#" className="hover:text-rose-500 transition-colors">Trung tâm trợ giúp</a></li>
              <li><a href="#" className="hover:text-rose-500 transition-colors">Chính sách bảo mật</a></li>
              <li><a href="#" className="hover:text-rose-500 transition-colors">Điều khoản dịch vụ</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-zinc-800 text-center text-sm">
          <p>© 2026 StaySaga. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
