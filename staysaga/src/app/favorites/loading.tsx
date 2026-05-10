export default function FavoritesLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="pt-28 pb-20 max-w-5xl mx-auto px-4">
        <div className="h-9 w-32 bg-gray-200 dark:bg-zinc-800 rounded-xl animate-pulse mb-2" />
        <div className="h-5 w-72 bg-gray-100 dark:bg-zinc-800/60 rounded-lg animate-pulse mb-8" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-sm">
              <div className="aspect-[4/3] bg-gray-200 dark:bg-zinc-800 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-2/3 bg-gray-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
                <div className="h-4 w-1/3 bg-gray-100 dark:bg-zinc-800/60 rounded-lg animate-pulse" />
                <div className="h-6 w-1/2 bg-gray-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
