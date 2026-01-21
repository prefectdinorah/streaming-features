import { Sidebar } from '@/components/layout/Sidebar'

/**
 * Layout для админ-панели с боковым меню
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 ml-64">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
