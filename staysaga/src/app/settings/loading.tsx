export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="pt-28 pb-20 max-w-3xl mx-auto px-4">
        <div className="h-9 w-32 bg-gray-200 dark:bg-zinc-800 rounded-xl animate-pulse mb-8" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
                <div className="h-5 w-32 bg-gray-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
              </div>
              <div className="h-12 w-full bg-gray-100 dark:bg-zinc-800/60 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
