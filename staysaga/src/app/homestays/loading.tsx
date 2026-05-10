export default function HomestaysLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="pt-24 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="h-9 w-80 bg-gray-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
          <div className="h-10 w-40 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-full animate-pulse" />
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-sm">
              <div className="aspect-[4/3] bg-gray-200 dark:bg-zinc-800 animate-pulse" />
              <div className="p-6 space-y-3">
                <div className="flex justify-between">
                  <div className="h-5 w-2/3 bg-gray-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
                  <div className="h-5 w-12 bg-gray-100 dark:bg-zinc-800/70 rounded-md animate-pulse" />
                </div>
                <div className="h-4 w-1/3 bg-gray-100 dark:bg-zinc-800/60 rounded-lg animate-pulse" />
                <div className="h-6 w-1/2 bg-gray-200 dark:bg-zinc-800 rounded-lg animate-pulse mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
