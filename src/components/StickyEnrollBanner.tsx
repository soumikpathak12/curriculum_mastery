'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import PaymentButton from '@/components/PaymentButton'

interface Course {
  id?: string;
  title: string;
  price: string;
  duration: string;
  dates: string;
}

interface StickyEnrollBannerProps {
  course?: Course;
}

export default function StickyEnrollBanner({ course }: StickyEnrollBannerProps) {
  const { data: session, status } = useSession()
  const [isMounted, setIsMounted] = useState(false)
  
  // Default course data (fallback to IB & IGCSE Music Educators Course)
  const defaultCourse = {
    id: 'ib-igcse-educators',
    title: 'IB & IGCSE Music Educators Course',
    price: '₹49,900/-',
    duration: '12 Hours',
    dates: '1st Nov - 19th Nov'
  };
  
  const currentCourse = course || defaultCourse;

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Extract numeric amount from price string (e.g., "₹15,400/-" -> "15400")
  const getAmount = (price: string): string => {
    return price.replace(/[₹,/-]/g, '').replace(/\s+/g, '').trim()
  }
  
  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-6">

        {/* Course Details */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#0a2b56'}}>
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <span className="font-semibold text-lg text-gray-900">{currentCourse.price}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#0a2b56'}}>
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <span className="font-medium text-gray-900">Duration:</span>
              <span className="text-gray-700 ml-1">{currentCourse.duration}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#0a2b56'}}>
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-gray-700">Completion Certificate</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#0a2b56'}}>
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L3 7.723V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.734.99A.996.996 0 0118 6v2a1 1 0 11-2 0v-.277l-1.254.145a1 1 0 11-.992-1.736L14.984 6l-.23-.132a1 1 0 01-.372-1.364zm-7 4a1 1 0 011.364-.372L10 8.848l1.254-.716a1 1 0 11.992 1.736L11 10.723V11a1 1 0 11-2 0v-.277l-1.246-.855a1 1 0 01-.372-1.364zM3 11a1 1 0 011 1v1.723l1.254.145a1 1 0 01-.992 1.736L4.016 15l.23.132a1 1 0 11-.992 1.736l-1.75-1A1 1 0 011 15v-3a1 1 0 011-1zm14 0a1 1 0 011 1v3a1 1 0 01-.504.868l-1.75 1a1 1 0 11-.992-1.736L15.984 15l-.23-.132a1 1 0 11.992-1.736L17 12.723V12a1 1 0 011-1zm-9.618 5.504a1 1 0 011.364-.372L10 16.848l1.254-.716a1 1 0 11.992 1.736l-1.75 1a1 1 0 01-.992 0l-1.75-1a1 1 0 01-.372-1.364z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-gray-700">Live Online | English</span>
          </div>

           <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#0a2b56'}}>
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <span className="font-medium text-gray-900">Dates:</span>
              <span className="text-gray-700 ml-1">{currentCourse.dates}</span>
            </div>
          </div> 
        </div>

        {/* Enroll Button */}
        {status === 'loading' || !isMounted ? (
          <div className="block w-full text-center rounded-lg px-6 py-3 text-lg font-semibold text-white shadow-lg bg-brand-primary animate-pulse">
            Loading...
          </div>
        ) : session ? (
          <Link 
            href="/dashboard"
            className="block w-full text-center rounded-lg px-6 py-3 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 bg-brand-primary"
          >
            Go to Dashboard
          </Link>
        ) : (
          <PaymentButton
            courseId={currentCourse.id || 'ib-igcse-educators'}
            amount={parseInt(getAmount(currentCourse.price))}
            className="block w-full text-center rounded-lg px-6 py-3 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 bg-brand-primary cursor-pointer"
          >
            Enroll Now
          </PaymentButton>
        )}

        {/* Additional Info */}
        <p className="text-xs text-gray-500 text-center mt-3">
          Limited seats available on first-come, first-serve basis
        </p>
      </div>
    </div>
  )
}
