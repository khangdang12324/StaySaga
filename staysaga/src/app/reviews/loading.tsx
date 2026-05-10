export default function ReviewsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="pt-28 pb-20 max-w-3xl mx-auto px-4">
        <div className="h-9 w-56 bg-gray-200 dark:bg-zinc-800 rounded-xl animate-pulse mb-2" />
        <div className="h-5 w-80 bg-gray-100 dark:bg-zinc-800/60 rounded-lg animate-pulse mb-8" />

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 shadow-sm space-y-3">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-48 bg-gray-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
                  <div className="h-4 w-24 bg-gray-100 dark:bg-zinc-800/60 rounded-lg animate-pulse" />
                </div>
                <div className="h-6 w-24 bg-amber-50 dark:bg-amber-900/20 rounded-full animate-pulse" />
              </div>
              <div className="h-4 w-full bg-gray-100 dark:bg-zinc-800/50 rounded-lg animate-pulse" />
              <div className="h-4 w-2/3 bg-gray-100 dark:bg-zinc-800/50 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
