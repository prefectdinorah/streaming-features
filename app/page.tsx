import { redirect } from 'next/navigation'

/**
 * Главная страница - редирект на Dashboard
 */
export default function Home() {
  redirect('/dashboard')
}
