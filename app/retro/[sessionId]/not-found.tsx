import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#ff6347] flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#2d1200] mb-2">Session not found</h1>
        <p className="text-[#2d1200]/65 mb-6">This session doesn't exist or has expired.</p>
        <Link
          href="/"
          className="px-6 py-3 bg-[#B83C28] hover:bg-[#9c2e1a] text-white font-semibold rounded-lg transition-colors"
        >
          Create a new session
        </Link>
      </div>
    </main>
  )
}
