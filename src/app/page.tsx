"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Header from "@/components/Header";
import ContactUs from "@/components/ContactUs";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import StickyEnrollBanner from "@/components/StickyEnrollBanner";
import { useSession } from "next-auth/react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const { status } = useSession();

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Refs for course sections
  const courseRefs = [
    useRef<HTMLElement>(null),
    useRef<HTMLElement>(null),
    useRef<HTMLElement>(null),
    useRef<HTMLElement>(null)
  ];
  
  // Refs for course headers (the h2 titles)
  const headerRefs = [
    useRef<HTMLHeadingElement>(null),
    useRef<HTMLHeadingElement>(null),
    useRef<HTMLHeadingElement>(null),
    useRef<HTMLHeadingElement>(null)
  ];

  // Course data
  const courses = [
    {
      id: 'igcse-basic',
      title: 'IGCSE Music Basic',
      price: '₹15,400/-',
      duration: '4 Hours',
      dates: '1st Nov onwards',
      description: 'This course introduces aspiring teachers to the fundamentals of the IGCSE Music curriculum, covering key concepts in music theory, listening, and performance. It covers the basic topics of what goes into teaching IGCSE music as a subject.',
      whatYouLearn: [
        'IGCSE Cambridge syllabus essentials',
        'Command terms and rubrics',
        'Creating student-focused learning materials',
        'Balancing performance, theory, and academics',
        'Unit design and goal-based planning'
      ],
      modules: [
        { number: '01', title: 'Core Curriculum: Areas of Study', description: 'Foundation principles and teaching methodologies for IGCSE Music' },
        { number: '02', title: 'Curriculum Pedagogy', description: 'An approach to Unit Planning and Links with IGCSE assessments' },
        { number: '03', title: 'Unit Planning', description: 'A Study of World and Modern Genres in IGCSE Music' },
        { number: '04', title: 'Making your own resources', description: 'How to approach performance and composition within the curriculum' },
        { number: '05', title: 'Understanding exams and assessments', description: 'Core concepts and teaching strategies for IB Diploma Programme Music' },
        { number: '06', title: 'Filling the Gaps: An Overview of Programs Across All School Years', description: 'Strategies and Concepts in IBDP Music' }
      ],
      requirements: [
        'Existing Musicians & Teachers only: You should be proficient at one instrument minimum (voice is considered an instrument as well). Having some experience teaching music, whether as a hobby or at a school level, is preferred but not essential.',
        'Commitment to Attendance: Attend the live sessions to ensure the best learning experience.',
        'Revision & Course Work: You are expected to take notes, review the provided resources, and complete the coursework on time to gain the maximum benefit from this course.',
        'Study Time: Approximately 1 to 2 hours of daily study during the course days is recommended.'
      ],
      resources: [
        'Live Sessions: 4 hours across 2 days (11:00 am - 1:00 pm & 4:00 - 6:00 pm)',
        'Resources, examples, samples to help you through the course as well as your teaching journey tailored to Indian students and school expectations.',
        'Guidance throughout first year via email or mutually agreed time for video meeting',
        'Q&A Sessions: Dedicated time after each class to address doubts.'
      ]
    },
    {
      id: 'igcse-advanced',
      title: 'IGCSE Music Advanced',
      price: '₹15,400/-',
      duration: '4 Hours',
      dates: '1st Nov onwards',
      description: 'This advanced course is designed for teachers aiming to deepen their expertise in the IGCSE Music curriculum, exploring all the areas of study in-depth with pedagogical strategies and assessment methods. Upon completion of this course, you will be fully equipped with the knowledge and confidence required to teach IGCSE Music as an academic subject and prepare your students for board exams.',
      whatYouLearn: [
        'Adapting global curricula for Indian classrooms',
        'Lesson structure and pacing strategies',
        'Creating assessments',
        'Teaching with Logic Pro, MuseScore, Soundtrap',
        'Building confidence in evaluation and feedback'
      ],
      modules: [
        { number: '01', title: 'Music Without Borders', description: 'A Study of World and Modern Genres in IGCSE Music' },
        { number: '02', title: 'Modern Genres', description: 'Contemporary music styles and their application in curriculum' },
        { number: '03', title: 'Western Art Music: All Eras', description: 'Comprehensive coverage of classical music periods' },
        { number: '04', title: 'Performance & Composition Assessments', description: 'Assessment strategies for practical components' }
      ],
      requirements: [
        'IGCSE Music Basic Course should have been successfully completed.',
        'Commitment to Attendance: Attend the live sessions to ensure the best learning experience.',
        'Revision & Course Work: You are expected to take notes, review the provided resources, and complete the coursework on time to gain the maximum benefit from this course.',
        'Study Time: Approximately 1 to 2 hours of daily study during the course days is recommended.'
      ],
      resources: [
        'Live Sessions: 4 hours across 2 days (11:00 am - 1:00 pm or 4:00 - 6:00 pm)',
        'Resources, examples, samples to help you through the course as well as your teaching journey tailored to Indian students and school expectations.',
        'Guidance throughout first year via email or mutually agreed time for video meeting',
        'Q&A Sessions: Dedicated time after each class to address doubts.'
      ]
    },
    {
      id: 'ib-comprehensive',
      title: 'IB Music Comprehensive',
      price: '₹25,000/-',
      duration: '6 Hours',
      dates: '1st Nov onwards',
      description: 'This comprehensive course is designed for aspiring IB Music teachers seeking to develop a deep understanding of the curriculum and its pedagogical framework. It provides in-depth exploration of all course components, including musical analysis, performance, and inquiry-based learning, equipping educators with the expertise and confidence to effectively guide students toward success in the IB Music program.',
      whatYouLearn: [
        'IBDP Music: Framework and Pedagogy',
        'Adapting global curricula for Indian classrooms',
        'Balancing performance, theory, and academics',
        'Unit design and goal-based planning',
        'Lesson structure and pacing strategies',
        'Command terms, rubrics, and assessments',
        'Creating student-focused learning materials',
        'Teaching with Logic Pro, MuseScore, Soundtrap',
        'Building confidence in evaluation and feedback'
      ],
      modules: [
        { number: '01', title: 'Concepts in IBDP Music', description: 'Core concepts and teaching strategies for IB Diploma Programme Music' },
        { number: '02', title: 'Teaching Strategies', description: 'Strategies and Concepts in IBDP Music' },
        { number: '03', title: 'Unit Planning', description: 'Unit planning and understanding assessment procedures in IBDP Music' },
        { number: '04', title: 'Understanding Assessment Procedures', description: 'Assessment strategies for IB Music components' },
        { number: '05', title: 'Filling the Gaps: An Overview of Programs Across All School Years', description: 'An overview of IB and IGCSE programs across all school years' }
      ],
      requirements: [
        'Existing Musicians & Teachers only: You should be proficient at one instrument minimum (voice is considered an instrument as well). Having some experience teaching music, whether as a hobby or at a school level, is preferred but not essential.',
        'Commitment to Attendance: Attend the live sessions to ensure the best learning experience.',
        'Revision & Course Work: You are expected to take notes, review the provided resources, and complete the coursework on time to gain the maximum benefit from this course.',
        'Study Time: Approximately 1 to 2 hours of daily study during the course days is recommended.'
      ],
      resources: [
        'Live Sessions: 6 hours across 3 days (11:00 am - 1:00 pm or 4:00 - 6:00 pm)',
        'Resources, examples, samples to help you through the course as well as your teaching journey tailored to Indian students and school expectations.',
        'Guidance throughout first year via email or mutually agreed time for video meeting',
        'Q&A Sessions: Dedicated time after each class to address doubts.'
      ]
    },
    {
      id: 'ib-igcse-educators',
      title: 'IB & IGCSE Music Educators Course',
      price: '₹49,900/-',
      duration: '12 Hours',
      dates: '1st Nov - 19th Nov',
      description: 'This integrated course combines the IGCSE and IB Music teacher training programs, offering a complete pathway for aspiring academic music educators. It equips teachers with the skills, knowledge, and pedagogical strategies needed to effectively teach and prepare students across both international curricula.',
      whatYouLearn: [
        'IGCSE Cambridge syllabus essentials',
        'IBDP Music frameworks',
        'Adapting global curricula for Indian classrooms',
        'Balancing performance, theory, and academics',
        'Unit design and goal-based planning',
        'Lesson structure and pacing strategies',
        'Command terms, rubrics, and assessments',
        'Creating student-focused learning materials',
        'Teaching with Logic Pro, MuseScore, Soundtrap',
        'Building confidence in evaluation and feedback'
      ],
      modules: [
        { number: '01', title: 'IGCSE Music: Core Curriculum and Pedagogy', description: 'Foundation principles and teaching methodologies for IGCSE Music' },
        { number: '02', title: 'Planning & Making your Own Resources', description: 'An approach to Unit Planning and Links with IGCSE assessments' },
        { number: '03', title: 'Music Without Borders', description: 'A Study of World and Modern Genres in IGCSE Music' },
        { number: '04', title: 'Understanding Western Art Music in IGCSE', description: 'How to approach performance and composition within the curriculum' },
        { number: '05', title: 'IBDP Music: Framework and Pedagogy', description: 'Core concepts and teaching strategies for IB Diploma Programme Music' },
        { number: '06', title: 'Teaching with IB Lens', description: 'Strategies and Concepts in IBDP Music' },
        { number: '07', title: 'IB Assessment & Planning', description: 'Unit planning and understanding assessment procedures in IBDP Music' },
        { number: '08', title: 'Filling the Gaps', description: 'An overview of IB and IGCSE programs across all school years' }
      ],
      requirements: [
        'Existing Musicians & Teachers only: You should be proficient at one instrument minimum (voice is considered an instrument as well). Having some experience teaching music, whether as a hobby or at a school level, is preferred but not essential.',
        'Commitment to Attendance: Attend the live sessions to ensure the best learning experience.',
        'Revision & Course Work: You are expected to take notes, review the provided resources, and complete the weekly coursework on time to gain the maximum benefit from this course. Approximately 4 to 5 hours of study per week are recommended.'
      ],
      resources: [
        'Live Sessions: 12-14 hours across 5-7 days (11:00 am - 1:00 pm & 4:00 - 6:00 pm)',
        'Resources, examples, samples to help you through the course as well as your teaching journey tailored to Indian students and school expectations.',
        'Guidance throughout first year via email or mutually agreed time for video meeting',
        'Q&A Sessions: Dedicated time after each class to address doubts.'
      ]
    }
  ];
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        alert("Successfully subscribed to newsletter!");
        setEmail("");
      } else {
        alert("Failed to subscribe. Please try again.");
      }
    } catch (error) {
      console.error("Newsletter error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-trigger payment if redirected after sign up
  useEffect(() => {
    if (
      isMounted &&
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("paynow") === "1" &&
      status === "authenticated"
    ) {
      // Payment button click handler removed (Cashfree integration removed)
    }
  }, [status, isMounted]);

  // Scroll detection for course sections
  useEffect(() => {
    if (!isMounted) return;
    
    const handleScroll = () => {
      // The trigger point is just below the navbar (approximately 220-240px from top)
      const navbarHeight = 220;
      const triggerPoint = window.scrollY + navbarHeight;
      
      let activeIndex = 0;
      
      // Go through each course HEADER (not section) and find which one has reached the top
      for (let i = headerRefs.length - 1; i >= 0; i--) {
        const header = headerRefs[i].current;
        if (header) {
          // Get the actual position of the h2 header element
          const headerTop = header.getBoundingClientRect().top + window.scrollY;
          
          // Only switch to this course if its H2 HEADER has reached/passed the trigger point
          if (headerTop <= triggerPoint) {
            activeIndex = i;
            break;
          }
        }
      }
      
      // Only update if the course has actually changed
      setCurrentCourse(prev => {
        if (prev !== activeIndex) {
          return activeIndex;
        }
        return prev;
      });
    };

    // Debounce scroll handler to avoid too many updates
    let scrollTimeout: NodeJS.Timeout;
    const debouncedScroll = () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      scrollTimeout = setTimeout(handleScroll, 50);
    };

    // Handle scroll events with debouncing
    window.addEventListener('scroll', debouncedScroll, { passive: true });
    
    // Handle hash changes (when clicking "Learn More" links)
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const courseIndex = courses.findIndex(course => course.id === hash);
        if (courseIndex !== -1) {
          // Wait for scroll animation to complete before updating
          setTimeout(() => {
            setCurrentCourse(courseIndex);
          }, 600);
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    
    // Initial check (with delay to ensure sections are rendered)
    const initialTimeout = setTimeout(handleScroll, 300);
    
    return () => {
      window.removeEventListener('scroll', debouncedScroll);
      window.removeEventListener('hashchange', handleHashChange);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      clearTimeout(initialTimeout);
    };
  }, [courses, isMounted]);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#ffffff", scrollPaddingTop: "160px" }}
    >
      <Header />

      {/* Hero Section - Full Width */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative mt-4 rounded-2xl p-6 sm:p-8 lg:p-4 bg-white/80 backdrop-blur-sm ring-1 ring-gray-100 overflow-hidden max-w-7xl mx-auto">
          <div className="relative flex flex-col lg:flex-row lg:justify-between gap-8 lg:gap-12 z-10">
            <div className="flex-1 lg:mt-16 text-center lg:text-right">
              <span className="inline-block rounded-full px-3 py-1 text-xs font-medium bg-brand-neutral-light text-brand-primary">
                Music Teacher Training Courses
              </span>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl md:text-4xl lg:text-5xl">
                Master the Skills to Teach <br/>
                <span className="text-brand-primary"> IB & IGCSE Music </span>
                with Confidence
              </h1>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg lg:text-xl leading-relaxed text-gray-700">
                <strong>Clarity. Purpose. Confidence.</strong>
              </p>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg lg:text-xl leading-relaxed text-gray-700">
                Choose from 4 specialized courses designed for<br/> aspiring and experienced music educators.
              </p>

              <div className="mt-5 sm:mt-6">
                <Link
                  href="#igcse-basic"
                  className="inline-block rounded-lg px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 text-center bg-brand-primary"
                >
                  Explore Courses
                </Link>
              </div>
            </div>

            {/* Centered Video for YouTube Shorts */}
            <div className="flex justify-center lg:justify-end w-full lg:w-auto">
              <div
                className="relative rounded-2xl overflow-hidden bg-gray-100 shadow-2xl"
                style={{ width: "310px", height: "560px" }}
              >
                <iframe
                  src="https://www.youtube.com/embed/m4kdTUWkblA?modestbranding=1&rel=0&showinfo=0&controls=1&disablekb=1&fs=0&iv_load_policy=3&cc_load_policy=0&playsinline=1"
                  title="Course Introduction Video"
                  className="absolute inset-0 w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto mt-12 px-4 sm:px-6">
        {/* Exclusive Features */}
        <section className="mt-2 sm:mt-3">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Exclusive Features
            </h2>
            <p className="mt-4 text-base sm:text-lg text-gray-600 px-4">
              Real-world training designed specifically for IB & IGCSE music
              educators
            </p>
          </div>
          <div className="mt-8 sm:mt-12 grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div
              className="rounded-2xl border-2 border-brand-neutral-light p-6 transition-all hover:shadow-lg"
              style={{ backgroundColor: "#f7f6f7" }}
            >
              <div className="rounded-full p-3 w-fit bg-brand-primary">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-bold text-gray-900">
                Live Weekend Sessions
              </h3>
              <p className="mt-2 text-gray-700">
                Interactive live classes held over weekends, offering real-time
                engagement and Q&A sessions.
              </p>
            </div>

            <div
              className="rounded-2xl border-2 border-brand-neutral-light p-6 transition-all hover:shadow-lg"
              style={{ backgroundColor: "#f7f6f7" }}
            >
              <div className="rounded-full p-3 w-fit bg-brand-secondary">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-bold text-gray-900">
                Deep Dive
              </h3>
              <p className="mt-2 text-gray-700">
                A comprehensive coverage of IGCSE and IB curriculums to shorten
                your learning curve.
              </p>
            </div>

            <div
              className="rounded-2xl border-2 border-brand-neutral-light p-6 transition-all hover:shadow-lg"
              style={{ backgroundColor: "#f7f6f7" }}
            >
              <div className="rounded-full p-3 w-fit bg-brand-primary">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-bold text-gray-900">
                Real-World Strategies
              </h3>
              <p className="mt-2 text-gray-700">
                Learn practical strategies for handling various scenarios across
                international school setups, examinations, submissions and
                performances.
              </p>
            </div>

            <div
              className="rounded-2xl border-2 border-brand-neutral-light p-6 transition-all hover:shadow-lg"
              style={{ backgroundColor: "#f7f6f7" }}
            >
              <div className="rounded-full p-3 w-fit bg-brand-secondary">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-bold text-gray-900">
                Certificate of Completion
              </h3>
              <p className="mt-2 text-gray-700">
                Receive a certificate of completion to support your professional
                advancement.
              </p>
            </div>
          </div>
        </section>

       
      </div>

      {/* Two Column Layout - Starts Here */}
      <div className="flex max-w-7xl mx-auto mt-12 px-4 sm:px-6">
        {/* Main Content Column */}
        <main className="flex-1 relative z-10">
          {/* Course Sections */}
          {courses.map((course, courseIndex) => (
            <section 
              key={course.id}
              ref={courseRefs[courseIndex]}
              id={course.id} 
              className="mt-16 first:mt-0"
              style={{ scrollMarginTop: "200px" }}
            >
              {/* Course Header */}
              <div className="text-center mb-12">
                <h2 
                  ref={headerRefs[courseIndex]}
                  className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
                >
                  {course.title}
                </h2>
                <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
                  {course.description}
                </p>
              </div>

              {/* What You'll Learn */}
              <div className="mb-16">
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8">
                  What You&apos;ll Learn
                </h3>
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {course.whatYouLearn.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-lg border border-brand-neutral-light p-4 transition-all hover:shadow-md hover:border-brand-primary"
                    >
                      <div
                        className="rounded-full p-1 mt-1"
                        style={{ backgroundColor: "rgba(3, 14, 80, 0.1)" }}
                      >
                        <svg
                          className="h-4 w-4 text-brand-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <span className="text-gray-700 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Course Modules */}
              <div className="mb-16">
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8">
                  Course Modules
                </h3>
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                  {course.modules.map((module, index) => (
                    <div
                      key={index}
                      className="rounded-2xl bg-white p-6 shadow-sm transition-all hover:shadow-lg"
                    >
                      <div className="flex items-start gap-4">
                        <div className="rounded-full px-3 py-1 text-sm font-bold text-white bg-brand-primary">
                          {module.number}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900">
                            {module.title}
                          </h4>
                          <p className="mt-2 text-gray-600">{module.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requirements & Resources */}
              <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 mb-16">
                {/* Requirements */}
                <div
                  className="rounded-2xl border-2 p-8"
                  style={{ backgroundColor: "#f7f6f7", borderColor: "#d7d4d4" }}
                >
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Requirements
                  </h3>
                  <div className="space-y-4">
                    {course.requirements.map((requirement, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div
                          className="rounded-full p-1 mt-1"
                          style={{ backgroundColor: "#8b8c9b" }}
                        >
                          <svg
                            className="h-4 w-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-700">{requirement}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resources */}
                <div
                  className="rounded-2xl border-2 p-8"
                  style={{ backgroundColor: "#f7f6f7", borderColor: "#d7d4d4" }}
                >
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Resources Provided
                  </h3>
                  <div className="space-y-4">
                    {course.resources.map((resource, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div
                          className="rounded-full p-1 mt-1"
                          style={{ backgroundColor: "#8b8c9b" }}
                        >
                          <svg
                            className="h-4 w-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-700">{resource}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Limited Seats & Non-Refundable Fee */}
              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full p-1" style={{ backgroundColor: "#8b8c9b" }}>
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-700">
                    <strong>Limited Seats:</strong> Please enroll on a first-come, first-served basis.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full p-1" style={{ backgroundColor: "#8b8c9b" }}>
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-700">
                    <strong>Non-Refundable Fee:</strong> The course fee of {course.price} is non-refundable because the course is knowledge-based.
                  </p>
                </div>
              </div>

              {/* Mobile Pricing Section - Same as Desktop Sticky Banner */}
              <div className="md:hidden mt-8">
                <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-6">
                  <div className="space-y-4 mb-6">
                    {/* Price */}
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#0a2b56'}}>
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <span className="font-semibold text-lg text-gray-900">{course.price}</span>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#0a2b56'}}>
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Duration:</span>
                        <span className="text-gray-700 ml-1">{course.duration}</span>
                      </div>
                    </div>

                    {/* Certificate */}
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#0a2b56'}}>
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-gray-700">Completion Certificate</span>
                      </div>
                    </div>

                    {/* Live Online */}
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#0a2b56'}}>
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L3 7.723V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.734.99A.996.996 0 0118 6v2a1 1 0 11-2 0v-.277l-1.254.145a1 1 0 11-.992-1.736L14.984 6l-.23-.132a1 1 0 01-.372-1.364zm-7 4a1 1 0 011.364-.372L10 8.848l1.254-.716a1 1 0 11.992 1.736L11 10.723V11a1 1 0 11-2 0v-.277l-1.246-.855a1 1 0 01-.372-1.364zM3 11a1 1 0 011 1v1.723l1.254.145a1 1 0 01-.992 1.736L4.016 15l.23.132a1 1 0 11-.992 1.736l-1.75-1A1 1 0 011 15v-3a1 1 0 011-1zm14 0a1 1 0 011 1v3a1 1 0 01-.504.868l-1.75 1a1 1 0 11-.992-1.736L15.984 15l-.23-.132a1 1 0 11.992-1.736L17 12.723V12a1 1 0 011-1zm-9.618 5.504a1 1 0 011.364-.372L10 16.848l1.254-.716a1 1 0 11.992 1.736l-1.75 1a1 1 0 01-.992 0l-1.75-1a1 1 0 01-.372-1.364z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-gray-700">Live Online | English</span>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#0a2b56'}}>
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Dates:</span>
                        <span className="text-gray-700 ml-1">{course.dates}</span>
                      </div>
                    </div>
                  </div>

                  {/* Enroll Button */}
                  <Link 
                    href="/pricing"
                    className="block w-full text-center rounded-lg px-6 py-3 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 bg-brand-primary"
                  >
                    Enroll Now
                  </Link>
                </div>
              </div>
            </section>
          ))}



          {/* Testimonials */}
          <Testimonials />

          {/* FAQ */}
          <FAQ />

          {/* About Pratik */}
          <section className="mt-12 sm:mt-16">
            <div
              className="rounded-2xl p-6 sm:p-8 lg:p-12"
              style={{ backgroundColor: "#f7f6f7" }}
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
                About Pratik Kulgod
              </h2>

              <div className="flex flex-col lg:flex-row gap-8 lg:items-stretch">
                {/* Left Column - Fixed width with equal height container */}
                <div className="lg:w-80 flex flex-col h-auto lg:h-[690px] mt-[5px]">
                  {/* Image - Takes up more space */}
                  <div className="rounded-2xl overflow-hidden flex-grow lg:flex-grow-[3]">
                    <Image
                      src="/assets/pratik.jpg"
                      alt="Pratik Kulgod - Head of Music at Singapore International School"
                      width={320}
                      height={500}
                      className="w-full h-full min-h-[400px] lg:min-h-[480px] object-cover"
                      priority
                    />
                  </div>

                  {/* Credentials - Takes up less space */}
                  <div className="rounded-2xl bg-white p-4 lg:p-5 shadow-lg mt-6 lg:flex-grow-[1]">
                    <h3 className="text-lg lg:text-xl font-bold text-gray-900">
                      Credentials
                    </h3>
                    <div className="mt-3 space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="rounded-full p-2"
                          style={{ backgroundColor: "#8b8c9b" }}
                        >
                          <svg
                            className="h-4 w-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 14l9-5-9-5-9 5 9 5z"
                            />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-700">
                          PGCE, University of Warwick
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="rounded-full p-2"
                          style={{ backgroundColor: "#8b8c9b" }}
                        >
                          <svg
                            className="h-4 w-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-700">
                          Grade 8 Distinction, Trinity College
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="rounded-full p-2"
                          style={{ backgroundColor: "#8b8c9b" }}
                        >
                          <svg
                            className="h-4 w-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"
                            />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-700">
                          Head of Music, Singapore International School
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="rounded-full p-2"
                          style={{ backgroundColor: "#8b8c9b" }}
                        >
                          <svg
                            className="h-4 w-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-700">
                          Academic Consultant, Trinity College London
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Text Content with equal height */}
                <div className="flex-1">
                  <div className="h-auto lg:h-[700px] flex flex-col justify-between space-y-6 lg:space-y-8 text-gray-700 overflow-hidden">
                    <p className="text-base leading-relaxed text-justify">
                      With over <strong>14 years of experience</strong> in music
                      education and performance, Pratik Kubaseod brings passion
                      and expertise to the field of music. He currently serves
                      as{" "}
                      <strong>
                        Head of Music at Singapore International School
                      </strong>
                      . A strong advocate for using music that students enjoy to
                      teach concepts, he also championed the revival of a fun
                      interschool music competition called Conzert, hosted by
                      his school.
                    </p>
                    <p className="text-base leading-relaxed text-justify">
                      A dedicated drummer and educator, he holds a{" "}
                      <strong>PGCE from the University of Warwick</strong> and
                      earned a{" "}
                      <strong>
                        Distinction in Grade 8 Rock & Pop Drums from Trinity
                        College London
                      </strong>
                      . His musical journey began under the guidance of the
                      renowned drummer Gino Banks, and he continues to expand
                      his rhythmic vocabulary through konnakol training with
                      percussion maestro Viveick Rajagopalan.
                    </p>
                    <p className="text-base leading-relaxed text-justify">
                      Beyond the classroom, Pratik has actively supported music
                      teachers for the past six years - both independently and
                      as an{" "}
                      <strong>
                        academic consultant with Trinity College London
                      </strong>
                      . His dedication to nurturing musical talent extends to
                      the stage, where he has performed across India with bands
                      such as Dindun, Daira, Rejected Cartoons, Vajra, and
                      Vizia, as well as in numerous collaborative drumming
                      sessions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Us */}
          <ContactUs />

          {/* Newsletter Section */}
          <section className="mt-16">
            <div
              className="rounded-2xl p-6 sm:p-8 lg:p-12 text-white relative overflow-hidden"
              style={{ backgroundColor: "#0a2b56" }}
            >
              {/* Background Music Notes */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 left-4 text-4xl animate-pulse">
                  ♪
                </div>
                <div className="absolute top-8 right-8 text-3xl animate-bounce">
                  ♫
                </div>
                <div className="absolute bottom-4 left-8 text-2xl animate-pulse">
                  ♬
                </div>
                <div className="absolute bottom-8 right-4 text-3xl animate-bounce">
                  ♩
                </div>
              </div>

              <div className="relative z-10 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                  Stay Updated with Music Education Insights
                </h2>
                <p className="text-base sm:text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
                  Get the latest tips, course announcements, and exclusive
                  content delivered to your inbox.
                </p>

                <form
                  onSubmit={handleNewsletterSubmit}
                  className="max-w-md mx-auto"
                >
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="flex-1 px-4 py-3 rounded-lg text-white placeholder-white bg-white/10 border border-white/20 focus:ring-0 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all"
                      placeholder="Enter your email address"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-white rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                      style={{ color: "#030E50" }}
                    >
                      {isSubmitting ? "Subscribing..." : "Subscribe"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>

          {/* Disclaimer */}
          <section className="mt-12 sm:mt-16 rounded-2xl bg-gray-100 p-6 sm:p-8">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Important Disclaimer
              </h2>
              <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4 text-sm text-gray-700">
                <p>
                  This course is independently developed to support music
                  educators and is not affiliated with, endorsed by, or
                  officially connected to Cambridge Assessment International
                  Education or the International Baccalaureate Organization. All
                  references to IB and IGCSE curricula are for educational and
                  training purposes only.
                </p>
                <p>
                  All content on this website, including text, materials, and
                  media, is the intellectual property of Pratik Kulgod and may
                  not be reproduced or distributed without permission.
                </p>
              </div>
            </div>
          </section>
        </main>

        {/* Right Column for Banner */}
        <aside className="hidden xl:block w-92 flex-shrink-0">
          <div className="sticky top-42 p-4 ml-8">
            <StickyEnrollBanner course={courses[currentCourse]} />
          </div>
        </aside>
      </div>

      <footer className="mt-16 border-t bg-gray-50">
        <div className="mx-auto max-w-6xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <span>
              © {new Date().getFullYear()} Pratik Kulgod, Bhairavi Music. All rights reserved.
            </span>
            <div className="flex items-center gap-4">
              <Link
                href="/privacy"
                className="hover:text-blue-600 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="hover:text-blue-600 transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

