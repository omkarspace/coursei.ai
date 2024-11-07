"use client";
import Link from "next/link";
import { useState } from "react";

const Navbar = () => {
  const [openNavbar, setOpenNavbar] = useState(false);
  const toggleNavbar = () => {
    setOpenNavbar((openNavbar) => !openNavbar);
  };
  return (
    <header className="absolute left-0 top-0 w-full flex items-center h-24 z-40">
      <nav className="relative mx-auto lg:max-w-7xl w-full px-5 sm:px-10 md:px-12 lg:px-5 flex gap-x-5 justify-between items-center">
        <div className="flex items-center min-w-max">
          <Link href="#" className="font-semibold flex items-center gap-x-2">
            <div className="flex items-center -space-x-3">
              <span className="h-6 aspect-square bg-purple-600 dark:bg-purple-500 rounded-full flex" />
              <span className="h-6 aspect-square bg-violet-600 dark:bg-violet-400 blur rounded-full flex" />
            </div>
            <span className="text-lg text-gray-700 dark:text-gray-300">
              Agency
            </span>
          </Link>
        </div>
        <div
          className={`
                absolute top-full  left-0 bg-white dark:bg-gray-950 lg:!bg-transparent border-b border-gray-200 dark:border-gray-800 py-8 lg:py-0 px-5 sm:px-10 md:px-12 lg:px-0 lg:border-none lg:w-max lg:space-x-16 lg:top-0 lg:relative  lg:flex duration-300 lg:transition-none ease-linear
                ${
                  openNavbar
                    ? "translate-y-0 opacity-0 visible"
                    : "translate-y-10 opacity-0 invisible lg:visible  lg:translate-y-0 lg:opacity-100"
                }
            `}
        >
          <ul className="flex flex-col lg:flex-row gap-6 lg:items-center text-gray-700 dark:text-gray-300 lg:w-full lg:justify-center">
            <li>
              <Link
                href="#"
                className="px-2 transition-colors  py-2.5 hover:text-purple-600 "
              >
                Portfolio
              </Link>
            </li>
            <li>
              <Link
                href="#"
                className="px-2 transition-colors  py-2.5 hover:text-purple-600 "
              >
                Company
              </Link>
            </li>
            <li>
              <Link
                href="#"
                className="px-2 transition-colors  py-2.5 hover:text-purple-600 "
              >
                Products
              </Link>
            </li>
            <li>
              <Link
                href="#"
                className="px-2 transition-colors  py-2.5 hover:text-purple-600 "
              >
                Resources
              </Link>
            </li>
          </ul>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4  lg:min-w-max mt-10 lg:mt-0">
            <Link
              href="/dashboard"
              className="flex items-center justify-center w-full sm:w-auto h-12 px-6 rounded-full bg-gray-100 dark:bg-gray-900 text-purple-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800"
            >
              Sign Up
            </Link>
          </div>
        </div>
        <div className="flex items-center lg:hidden">
          <button
            onClick={() => {
              toggleNavbar();
            }}
            aria-label="Toggle navbar"
            className="outline-none border-l border-l-gray-100 dark:border-l-gray-800 pl-3 relative py-3 children:flex"
          >
            <span
              aria-hidden="true"
              className={`
                                    h-0.5 w-6 rounded bg-gray-800 dark:bg-gray-300 transition duration-300
                                    ${
                                      openNavbar
                                        ? "rotate-45 translate-y-[0.33rem]"
                                        : ""
                                    }
                                `}
            />
            <span
              aria-hidden="true"
              className={`
                                    mt-2 h-0.5 w-6 rounded bg-gray-800 dark:bg-gray-300 transition duration-300
                                    ${
                                      openNavbar
                                        ? "-rotate-45 -translate-y-[0.33rem]"
                                        : ""
                                    }
                                `}
            />
          </button>
        </div>
      </nav>
    </header>
  );
};

export default function HeroSection() {
  return (
    <>
      <Navbar />
      <section className="min-h-max bg-white dark:bg-gray-950">
        <div className="absolute top-0 inset-x-0 h-64 flex items-start">
          <div className="h-24 w-2/3 bg-gradient-to-br from-purple-500 opacity-20 blur-2xl dark:from-purple-700 dark:invisible dark:opacity-40"></div>
          <div className="h-20 w-3/5 bg-gradient-to-r from-blue-600 opacity-40 blur-2xl dark:from-purple-700 dark:opacity-40"></div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-2/5 aspect-[2/0.5] bg-gradient-to-br from-purple-600 to-violet-400 rounded-full opacity-50 blur-2xl"></div>
        <div className="relative mx-auto pt-32 pb-24 lg:max-w-7xl w-full px-5 sm:px-10 md:px-12 lg:px-5 text-center space-y-10">
          <h1 className="text-gray-900 dark:text-white mx-auto max-w-5xl font-bold text-4xl/tight sm:text-5xl/tight lg:text-6xl/tight xl:text-7xl/tight">
          Imagine, Create, Teach – Custom Courses Made Just for You.
          </h1>
          <p className="text-gray-700 dark:text-gray-300 mx-auto max-w-2xl">
          Effortlessly generate personalized courses tailored to your vision. Turn your expertise into engaging, high-quality lessons with just a few clicks.
          </p>
          <div className="flex justify-center items-center flex-wrap mx-auto gap-4">
            <Link
              href="/dashboard"
              className="flex items-center h-12 px-6 rounded-full bg-purple-600 text-white border border-purple-600"
            >
              Get Started
            </Link>
            <Link
              href="#"
              className="flex items-center h-12 px-6 rounded-full bg-gray-100 dark:bg-gray-900 text-purple-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800"
            >
              Learn more
            </Link>
          </div>
          <div className="text-left grid lg:grid-cols-3 p-6 rounded-2xl bg-gradient-to-tr from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 border border-gray-100 dark:border-gray-800 max-w-2xl lg:max-w-5xl mx-auto lg:divide-x divide-y lg:divide-y-0 divide-gray-300 dark:divide-gray-800">
            <div className="flex items-start gap-6 lg:pr-6 pb-6 lg:pb-0">
              <div className="w-10">
                <span className="p-3 rounded-xl bg-gray-200 dark:bg-gray-800 flex w-max text-gray-800 dark:text-gray-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 10.5h.375c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H21M4.5 10.5H18V15H4.5v-4.5zM3.75 18h15A2.25 2.25 0 0021 15.75v-6a2.25 2.25 0 00-2.25-2.25h-15A2.25 2.25 0 001.5 9.75v6A2.25 2.25 0 003.75 18z"
                    />
                  </svg>
                </span>
              </div>
              <div className="flex-1 space-y-1">
                <h2 className="text-gray-900 dark:text-white font-semibold text-lg">
                  High Quality
                </h2>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                Deliver expertly crafted content for a top-notch learning experience.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-6 lg:px-6 py-6 lg:py-0">
              <div className="w-10">
                <span className="p-3 rounded-xl bg-gray-200 dark:bg-gray-800 flex w-max text-gray-800 dark:text-gray-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                    />
                  </svg>
                </span>
              </div>
              <div className="flex-1 space-y-1">
                <h2 className="text-gray-900 dark:text-white font-semibold text-lg">
                Ease of Use
                </h2>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                Simple and intuitive design – create courses in minutes.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-6 pt-6 lg:pt-0 lg:pl-6">
              <div className="w-10">
                <span className="p-3 rounded-xl bg-gray-200 dark:bg-gray-800 flex w-max text-gray-800 dark:text-gray-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 10.5h.375c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H21M4.5 10.5H18V15H4.5v-4.5zM3.75 18h15A2.25 2.25 0 0021 15.75v-6a2.25 2.25 0 00-2.25-2.25h-15A2.25 2.25 0 001.5 9.75v6A2.25 2.25 0 003.75 18z"
                    />
                  </svg>
                </span>
              </div>
              <div className="flex-1 space-y-1">
                <h2 className="text-gray-900 dark:text-white font-semibold text-lg">
                Customizable Content
                </h2>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                Tailor each lesson to fit your unique teaching style and audience needs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
