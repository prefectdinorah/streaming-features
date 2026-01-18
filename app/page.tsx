export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          YouTube Player for Twitch
        </h1>
        <p className="text-gray-400 mb-8">
          MVP в разработке
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <p>Browser Source: /player</p>
          <p>API: /api/queue/add</p>
        </div>
      </div>
    </div>
  )
}
