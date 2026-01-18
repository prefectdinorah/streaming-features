export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Публичные маршруты без аутентификации */}
      {children}
    </>
  )
}
