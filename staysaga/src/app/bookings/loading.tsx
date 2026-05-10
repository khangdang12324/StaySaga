export default function BookingsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="pt-28 pb-20 max-w-4xl mx-auto px-4">
        <div className="h-9 w-64 bg-gray-200 dark:bg-zinc-800 rounded-xl animate-pulse mb-2" />
        <div className="h-5 w-96 bg-gray-100 dark:bg-zinc-800/60 rounded-lg animate-pulse mb-8" />
        
        {/* Tabs skeleton */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-zinc-800 pb-px">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-24 bg-gray-100 dark:bg-zinc-800/60 rounded-lg animate-pulse" />
          ))}
        </div>

        {/* Cards skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden shadow-sm">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-48 h-32 bg-gray-200 dark:bg-zinc-800 animate-pulse" />
                <div className="flex-1 p-5 space-y-3">
                  <div className="h-5 w-2/3 bg-gray-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
                  <div className="h-4 w-1/3 bg-gray-100 dark:bg-zinc-800/60 rounded-lg animate-pulse" />
                  <div className="h-4 w-1/2 bg-gray-100 dark:bg-zinc-800/60 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
