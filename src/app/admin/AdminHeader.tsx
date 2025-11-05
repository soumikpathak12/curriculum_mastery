"use client"

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'

export default function AdminHeader() {
  const { data } = useSession()
  const role = data?.user?.role || 'STUDENT'

  return (
    <div className="flex items-center justify-between border-b bg-white/70 p-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="font-semibold">Admin</Link>
        <nav className="flex items-center gap-3 text-sm text-gray-600">
          <Link href="/admin/course" className="hover:underline">Course</Link>
          <Link href="/admin/assignments" className="hover:underline">Assignments</Link>
          <Link href="/admin/payments" className="hover:underline">Payments</Link>
          <Link href="/admin/mailers" className="hover:underline">Send Mailers</Link>
        </nav>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="rounded border px-2 py-1">Role: {role}</span>
        <button onClick={() => signOut()} className="rounded bg-black px-3 py-1.5 text-white">Sign out</button>
      </div>
    </div>
  )
}
