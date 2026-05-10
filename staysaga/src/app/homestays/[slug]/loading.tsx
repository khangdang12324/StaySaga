export default function HomestayDetailLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <main className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title skeleton */}
        <div className="mb-8 space-y-4">
          <div className="h-10 w-2/3 bg-gray-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="h-5 w-24 bg-gray-100 dark:bg-zinc-800/70 rounded-lg animate-pulse" />
            <div className="h-5 w-32 bg-gray-100 dark:bg-zinc-800/70 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Image gallery skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[50vh] min-h-[400px] mb-12 rounded-3xl overflow-hidden">
          <div className="bg-gray-200 dark:bg-zinc-800 animate-pulse rounded-xl" />
          <div className="grid grid-cols-2 grid-rows-2 gap-4 hidden md:grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 dark:bg-zinc-800 animate-pulse rounded-xl" />
            ))}
          </div>
        </div>

        {/* Content + booking skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-8 w-3/4 bg-gray-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
            <div className="h-5 w-1/2 bg-gray-100 dark:bg-zinc-800/60 rounded-lg animate-pulse" />
            <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-zinc-800">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-zinc-800 rounded-lg animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-1/3 bg-gray-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
                    <div className="h-4 w-2/3 bg-gray-100 dark:bg-zinc-800/60 rounded-lg animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 h-80 animate-pulse" />
        </div>
      </main>
    </div>
  )
}
