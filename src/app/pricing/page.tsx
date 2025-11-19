"use client";

import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import PaymentButton from "@/components/PaymentButton";

export default function PricingPage() {
  const courses = [
    {
      id: 'igcse-basic',
      title: 'IGCSE Music Basic',
      price: '₹15,400',
      duration: '4 Hours',
      dates: '1st Nov onwards',
      description: 'This course introduces aspiring teachers to the fundamentals of the IGCSE Music curriculum, covering key concepts in music theory, listening, and performance.',
    },
    {
      id: 'igcse-advanced',
      title: 'IGCSE Music Advanced',
      price: '₹15,400',
      duration: '4 Hours',
      dates: '1st Nov onwards',
      description: 'This advanced course is designed for teachers aiming to deepen their expertise in the IGCSE Music curriculum.',
    },
    {
      id: 'ib-comprehensive',
      title: 'IB Music Comprehensive',
      price: '₹25,000',
      duration: '6 Hours',
      dates: '1st Nov onwards',
      description: 'This comprehensive course is designed for aspiring IB Music teachers seeking to develop a deep understanding of the curriculum.',
    },
    {
      id: 'ib-igcse-educators',
      title: 'IB & IGCSE Music Educators Course',
      price: '₹49,900',
      duration: '12 Hours',
      dates: '1st Nov - 19th Nov',
      description: 'This integrated course combines the IGCSE and IB Music teacher training programs.',
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Choose Your Learning Path
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Four specialized courses designed to meet different learning needs and experience levels in music education.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {courses.map((course, index) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              {/* Course Header */}
              <div className="p-6 border-b border-gray-100 flex-grow">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {course.description}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-bold text-brand-primary">
                      {course.price}
                    </span>
                    <p className="text-sm text-gray-600">
                      {course.duration} • {course.dates}
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA Button - Always at bottom */}
              <div className="p-6 mt-auto">
                <PaymentButton
                  courseId={course.id}
                  amount={parseInt(course.price.replace(/[₹,]/g, '').replace(/\s+/g, '').trim())}
                  className="cursor-pointer w-full bg-brand-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-brand-secondary transition-colors"
                >
                  Enroll Now
                </PaymentButton>
              </div>
            </div>
          ))}
        </div>

   
      </div>
    </div>
  );
}
