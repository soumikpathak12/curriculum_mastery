'use client'

import PaymentButton from './PaymentButton'

interface CourseEnrollButtonProps {
  courseId: string
  courseSlug: string
  courseTitle: string
  coursePrice: number // price in paise
}

export default function CourseEnrollButton({
  courseId,
  courseSlug,
  courseTitle,
  coursePrice,
}: CourseEnrollButtonProps) {
  // Convert price from paise to rupees
  const amountInRupees = coursePrice / 100

  return (
    <PaymentButton
      courseId={courseId}
      amount={amountInRupees}
      className="rounded-lg px-5 py-2.5 text-base font-medium text-white shadow-md hover:shadow-lg transition-all bg-brand-primary"
    >
      Enroll Now
    </PaymentButton>
  )
}

