"use client";

import React, { useState, useEffect } from 'react'
import { Space_Mono } from 'next/font/google'
import { useAuth } from '@/contexts/AuthContext'

const spmono = Space_Mono({
  subsets: ['latin'],
  weight: ["400", "700"],
})

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://morsecode-production-8a2d.up.railway.app/api";

function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorShake, setErrorShake] = useState(false);
  const { login } = useAuth();

  // Clear error when user starts typing again
  useEffect(() => {
    if (errorMessage) {
      setErrorMessage("");
    }
  }, [email, username, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(
        `${API_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, username, password }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setErrorShake(true);
        setTimeout(() => setErrorShake(false), 500);
        setErrorMessage(data.error || data.message || "การลงทะเบียนล้มเหลว กรุณาลองใหม่");
        return;
      }

      // Use login function from AuthContext
      login(data.token, data.user);
    } catch (err) {
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 500);
      setErrorMessage("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="w-full max-w-[705px] px-4 sm:px-0">
      <form onSubmit={handleSubmit}>
        <div
          className="
        max-w-[705px]
        min-h-[650px]
        rounded-xl
        flex
        flex-col
        items-center
        justify-center
        px-4 sm:px-0
        transition-colors duration-300"
          style={{ backgroundColor: 'var(--card)' }}
        >
          <p className={`${spmono.className} font-bold text-[32px] mt-10`} style={{ color: 'var(--card-foreground)' }}>
            register
          </p>

          {/* Inline error message */}
          {errorMessage && (
            <div
              className={`w-full sm:w-[540px] mt-4 px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-300 ${errorShake ? 'animate-shake' : ''}`}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <span className="text-lg shrink-0">⚠️</span>
              <p className={`${spmono.className} font-bold text-[13px] leading-snug`} style={{ color: '#f87171' }}>
                {errorMessage}
              </p>
            </div>
          )}

          <div className="flex flex-col w-full sm:w-auto">
            <label className={`${spmono.className} font-bold text-[16px] mt-7.5`} style={{ color: 'var(--card-foreground)', opacity: 0.6 }}>email</label>
            <input
              type="email"
              className={`w-full sm:w-[540px] h-20 rounded-2xl mt-2 ${spmono.className} font-bold text-[16px] pl-6 outline-none transition-all duration-300 focus:ring-2`}
              style={{
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)',
                border: errorMessage ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid transparent',
                '--tw-ring-color': 'var(--primary)',
              }}
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col w-full sm:w-auto">
            <label className={`${spmono.className} font-bold text-[16px] mt-5`} style={{ color: 'var(--card-foreground)', opacity: 0.6 }}>username</label>
            <input
              type="text"
              className={`w-full sm:w-[540px] h-20 rounded-2xl mt-2 ${spmono.className} font-bold text-[16px] pl-6 outline-none transition-all duration-300 focus:ring-2`}
              style={{
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)',
                border: errorMessage ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid transparent',
                '--tw-ring-color': 'var(--primary)',
              }}
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="flex flex-col w-full sm:w-auto">
            <label className={`${spmono.className} font-bold text-[16px] mt-5`} style={{ color: 'var(--card-foreground)', opacity: 0.6 }}>password</label>
            <input
              type="password"
              className={`w-full sm:w-[540px] h-20 rounded-2xl mt-2 ${spmono.className} font-bold text-[16px] pl-6 outline-none transition-all duration-300 focus:ring-2`}
              style={{
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)',
                border: errorMessage ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid transparent',
                '--tw-ring-color': 'var(--primary)',
              }}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`${spmono.className} font-bold text-[32px] w-full sm:w-[280px] h-20 rounded-xl mt-[50px] transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {loading ? 'registering...' : 'register'}
          </button>
          <p className={`${spmono.className} font-bold text-[14px] mt-12.5`} style={{ color: 'var(--card-foreground)' }}>Already have an account?</p>
          <a href="/login" className={`${spmono.className} font-bold text-[14px] underline mb-10 transition-opacity duration-300 hover:opacity-70`} style={{ color: 'var(--primary)' }}>Log in</a>
        </div>
      </form>
    </div>
  )
}

export default RegisterPage
