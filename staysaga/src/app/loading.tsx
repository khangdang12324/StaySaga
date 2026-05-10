export default function Loading() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Hero skeleton */}
      <div className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-800 animate-pulse" />
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 flex flex-col items-center text-center gap-6">
          <div className="h-16 w-3/4 bg-white/20 dark:bg-zinc-700/50 rounded-2xl animate-pulse" />
          <div className="h-8 w-1/2 bg-white/15 dark:bg-zinc-700/40 rounded-xl animate-pulse" />
          <div className="h-16 w-full max-w-2xl bg-white/10 dark:bg-zinc-700/30 rounded-full animate-pulse mt-4" />
        </div>
      </div>

      {/* Featured section skeleton */}
      <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-10 w-64 bg-gray-200 dark:bg-zinc-800 rounded-xl animate-pulse mb-12" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-4">
              <div className="aspect-[4/3] bg-gray-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
              <div className="h-5 w-3/4 bg-gray-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
              <div className="h-4 w-1/2 bg-gray-100 dark:bg-zinc-800/70 rounded-lg animate-pulse" />
              <div className="h-5 w-1/3 bg-gray-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
