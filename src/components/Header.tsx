"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session, status } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCoursesSubmenuOpen, setIsCoursesSubmenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show loading state during hydration or when session is loading
  const isLoading = !isMounted || status === "loading";

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if clicking on courses button or its children
      if (!target.closest('.dropdown-container') && 
          !target.closest('[data-courses-button]') &&
          !target.closest('[data-courses-submenu]')) {
        setIsCoursesSubmenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/95 backdrop-blur-sm shadow-md" : "bg-transparent"
      }`}
    >
      <div className="flex w-full items-center justify-between pl-4 pr-2 py-1 sm:pl-6 sm:pr-3 sm:py-1.5">
        <Link
          href="/"
          className="flex items-center gap-1 hover:opacity-90 transition-opacity"
        >
          <Image
            src="/assets/logo_with_name.png"
            alt="Curriculum Mastery Logo"
            width={288}
            height={288}
            className="h-[120px] w-auto sm:h-[160px] md:h-[170px] -my-4 sm:-my-6 md:-my-7"
            priority
          />
    
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-gray-700 hover:text-brand-primary transition-colors font-medium"
          >
            Home
          </Link>
          <div className="relative group">
            <button className="text-gray-700 hover:text-brand-primary transition-colors font-medium flex items-center gap-1">
              Courses
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="py-2">
                <Link
                  href="/#igcse-basic"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-primary transition-colors"
                >
                  IGCSE Music Basic
                </Link>
                <Link
                  href="/#igcse-advanced"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-primary transition-colors"
                >
                  IGCSE Music Advanced
                </Link>
                <Link
                  href="/#ib-comprehensive"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-primary transition-colors"
                >
                  IB Music Comprehensive
                </Link>
                <Link
                  href="/#ib-igcse-educators"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-primary transition-colors"
                >
                  IB & IGCSE Music Educators Course
                </Link>
              </div>
            </div>
          </div>
          <Link
            href="/#contact"
            className="text-gray-700 hover:text-brand-primary transition-colors font-medium"
          >
            Contact
          </Link>

          {isLoading ? (
            // Show loading state during hydration or session loading
            <div className="flex items-center gap-3">
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : session ? (
            <>
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-brand-primary transition-colors font-medium"
              >
                Dashboard
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  Welcome, {session.user?.name || session.user?.email}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  style={{ cursor: "pointer" }}
                  className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:border-brand-primary hover:text-brand-primary transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:border-brand-primary hover:text-brand-primary transition-colors"
              >
                Login
              </Link>
              <Link
                href="/pricing"
                className="rounded-lg px-5 py-2.5 text-base font-medium text-white shadow-md hover:shadow-lg transition-all bg-brand-primary mr-[50px]"
              >
                Enroll Now
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden rounded-lg p-2 text-gray-700 hover:bg-gray-100"
          onClick={() => {
            setIsMobileMenuOpen(!isMobileMenuOpen);
            if (!isMobileMenuOpen) {
              setIsCoursesSubmenuOpen(false);
            }
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-6 h-6"
          >
            {isMobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="flex flex-col p-4 space-y-3">
            <Link
              href="/"
              className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsCoursesSubmenuOpen(false);
              }}
            >
              Home
            </Link>
            <div className="px-4 py-2">
              <button
                data-courses-button
                className="flex items-center justify-between w-full text-gray-700 font-medium mb-2 hover:text-brand-primary transition-colors"
                onClick={() => {
                  setIsCoursesSubmenuOpen(!isCoursesSubmenuOpen);
                }}
              >
                Courses
                <svg
                  className={`w-4 h-4 transition-transform ${isCoursesSubmenuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isCoursesSubmenuOpen && (
                <div data-courses-submenu className="ml-4 space-y-1">
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand-primary rounded-lg"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsCoursesSubmenuOpen(false);
                      setTimeout(() => {
                        const element = document.getElementById('igcse-basic');
                        if (element) {
                          const rect = element.getBoundingClientRect();
                          const scrollTop = window.scrollY + rect.top - 200; // Account for header
                          window.scrollTo({ top: scrollTop, behavior: 'smooth' });
                        }
                      }, 100);
                    }}
                  >
                    IGCSE Music Basic
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand-primary rounded-lg"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsCoursesSubmenuOpen(false);
                      setTimeout(() => {
                        const element = document.getElementById('igcse-advanced');
                        if (element) {
                          const rect = element.getBoundingClientRect();
                          const scrollTop = window.scrollY + rect.top - 200;
                          window.scrollTo({ top: scrollTop, behavior: 'smooth' });
                        }
                      }, 100);
                    }}
                  >
                    IGCSE Music Advanced
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand-primary rounded-lg"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsCoursesSubmenuOpen(false);
                      setTimeout(() => {
                        const element = document.getElementById('ib-comprehensive');
                        if (element) {
                          const rect = element.getBoundingClientRect();
                          const scrollTop = window.scrollY + rect.top - 200;
                          window.scrollTo({ top: scrollTop, behavior: 'smooth' });
                        }
                      }, 100);
                    }}
                  >
                    IB Music Comprehensive
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand-primary rounded-lg"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsCoursesSubmenuOpen(false);
                      setTimeout(() => {
                        const element = document.getElementById('ib-igcse-educators');
                        if (element) {
                          const rect = element.getBoundingClientRect();
                          const scrollTop = window.scrollY + rect.top - 200;
                          window.scrollTo({ top: scrollTop, behavior: 'smooth' });
                        }
                      }, 100);
                    }}
                  >
                    IB & IGCSE Music Educators Course
                  </button>
                </div>
              )}
            </div>
            <Link
              href="/#contact"
              className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsCoursesSubmenuOpen(false);
              }}
            >
              Contact
            </Link>

            {isLoading ? (
              // Show loading state during hydration or session loading
              <div className="px-4 py-2 space-y-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : session ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsCoursesSubmenuOpen(false);
                  }}
                >
                  Dashboard
                </Link>
                <div className="px-4 py-2 text-sm text-gray-600 border-t border-gray-100">
                  Welcome, {session.user?.name || session.user?.email}
                </div>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsCoursesSubmenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  style={{ cursor: "pointer" }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 text-left"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsCoursesSubmenuOpen(false);
                  }}
                >
                  Login
                </Link>
                <Link
                  href="/pricing"
                  className="w-full text-center rounded-lg px-4 py-2.5 text-white font-medium bg-brand-primary mr-[75px]"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsCoursesSubmenuOpen(false);
                  }}
                >
                  Enroll Now
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
