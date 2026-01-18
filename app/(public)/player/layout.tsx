export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Минимальный layout для player - только контент */}
      {children}
    </>
  )
}
