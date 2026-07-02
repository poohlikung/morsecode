"use client";

import React, { useState } from 'react'
import { usePathname } from 'next/navigation';
import { Space_Mono } from 'next/font/google';
import { useTheme } from '@/contexts/ThemeContext';

const spmono = Space_Mono({
  subsets: ['latin'],
  weight: ["400", "700"],
})

import Navbar from '@/components/Navbar';

function Mainlayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col items-center px-4" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      <Navbar />
      <div className="pt-[100px] md:pt-[140px] w-full">
        {children}
      </div>
    </div>
  )
}

export default Mainlayout