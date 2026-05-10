export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="pt-24 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-8 w-32 bg-gray-200 dark:bg-zinc-800 rounded-full animate-pulse mb-8" />
        <div className="h-10 w-80 bg-gray-200 dark:bg-zinc-800 rounded-xl animate-pulse mb-12" />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-6 w-48 bg-gray-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
                <div className="h-16 w-full bg-gray-100 dark:bg-zinc-800/60 rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 h-96 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
