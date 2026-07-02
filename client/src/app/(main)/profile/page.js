"use client";

import React, { useState, useEffect } from "react";
import { Space_Mono } from "next/font/google";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const spmono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
});

function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const { theme } = useTheme();
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [bestScores, setBestScores] = useState([]);
  const [loadingBestScores, setLoadingBestScores] = useState(true);
  const [globalWeaknesses, setGlobalWeaknesses] = useState([]);
  const [loadingGlobalWeaknesses, setLoadingGlobalWeaknesses] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Auto-refresh user data when entering profile page
  useEffect(() => {
    if (user) {
      refreshUser();
    }
  }, []); // Only run once when profile page loads

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          setLoadingHistory(false);
          return;
        }

        const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://morsecode-production-8a2d.up.railway.app/api";
        const res = await fetch(`${API_URL}/play-sessions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    const fetchBestScores = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return;

        const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://morsecode-production-8a2d.up.railway.app/api";
        const res = await fetch(`${API_URL}/user-mode-status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setBestScores(data);
        }
      } catch (err) {
        console.error("Failed to fetch best scores:", err);
      } finally {
        setLoadingBestScores(false);
      }
    };

    const fetchGlobalWeaknesses = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return;

        const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://morsecode-production-8a2d.up.railway.app/api";
        const res = await fetch(`${API_URL}/play-sessions/weakness/global`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setGlobalWeaknesses(data);
        }
      } catch (err) {
        console.error("Failed to fetch global weaknesses:", err);
      } finally {
        setLoadingGlobalWeaknesses(false);
      }
    };

    fetchHistory();
    fetchBestScores();
    fetchGlobalWeaknesses();
  }, [user]);

  const ALL_MODE_COMBOS = [
    { mode: 'encode', symbol: 'a-z', amtWord: 10 },
    { mode: 'encode', symbol: 'a-z', amtWord: 15 },
    { mode: 'encode', symbol: 'a-z', amtWord: 50 },
    { mode: 'encode', symbol: 'a-z', amtWord: 100 },
    { mode: 'encode', symbol: 'word', amtWord: 10 },
    { mode: 'encode', symbol: 'word', amtWord: 15 },
    { mode: 'encode', symbol: 'word', amtWord: 50 },
    { mode: 'encode', symbol: 'word', amtWord: 100 },
    { mode: 'decode', symbol: 'a-z', amtWord: 10 },
    { mode: 'decode', symbol: 'a-z', amtWord: 15 },
    { mode: 'decode', symbol: 'a-z', amtWord: 50 },
    { mode: 'decode', symbol: 'a-z', amtWord: 100 },
    { mode: 'decode', symbol: 'word', amtWord: 10 },
    { mode: 'decode', symbol: 'word', amtWord: 15 },
    { mode: 'decode', symbol: 'word', amtWord: 50 },
    { mode: 'decode', symbol: 'word', amtWord: 100 },
  ];

  const findBestScore = (mode, symbol, amtWord) => {
    return bestScores.find(
      (s) => s.mode?.name === mode && s.symbol?.name === symbol && s.difficulty?.amtWord === amtWord
    );
  };

  const handleLogout = () => {
    logout();
  };

  const handleRowClick = async (sessionId) => {
    setLoadingDetails(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://morsecode-production-8a2d.up.railway.app/api";
      const res = await fetch(`${API_URL}/play-sessions/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const sessionData = await res.json();
        setSelectedSession(sessionData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getWeakness = (details) => {
    if (!details || details.length === 0) return "No data";
    const errors = details.filter(d => !d.isCorrect);
    if (errors.length === 0) return "No mistakes! Perfect score! 🎉";

    const charCount = {};
    errors.forEach(e => {
      const char = e.correctAnswer || e.question;
      charCount[char] = (charCount[char] || 0) + 1;
    });

    const worstChar = Object.keys(charCount).reduce((a, b) => charCount[a] > charCount[b] ? a : b);
    return `ตาวิเศษเห็นนะว่ารอบนี้คุณพิมพ์ตัว "${worstChar}" ผิดบ่อยสุด! (${charCount[worstChar]} ครั้ง) 😅`;
  }
  
  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden px-4 box-border">
      <div className="w-full max-w-[975px] mx-auto min-w-0">
        <div
          className={`flex flex-col sm:flex-row w-full max-w-full rounded-lg mt-6 sm:mt-10 mb-6 sm:mb-10 p-4 sm:p-6 ${spmono.className} font-bold transition-colors duration-300`}
          style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)', border: '1px solid var(--border)' }}
        >
          <div
            className={`${spmono.className} w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-full flex items-center justify-center font-bold text-[22px] sm:text-[28px] outline transition-colors duration-300`}
            style={{ 
              backgroundColor: 'var(--background)', 
              color: 'var(--foreground)',
              outlineColor: 'var(--primary)'
            }}
          >
            <p className="mb-1">
              {user?.username ? user.username.slice(0, 2).toUpperCase() : '?'}
            </p>
          </div>
          <div className="text-base sm:text-[20px] mt-4 sm:mt-0 sm:ml-10 min-w-0 w-full">
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-2 gap-2 sm:hidden md:hidden">
                <div style={{ color: 'var(--foreground)', fontWeight: '600' }}>Username</div>
                <div style={{ color: 'var(--foreground)', opacity: 0.7 }} className="truncate" title={user?.username || 'N/A'}>{user?.username || 'N/A'}</div>
                <div style={{ color: 'var(--foreground)', fontWeight: '600' }}>UID</div>
                <div style={{ color: 'var(--foreground)', opacity: 0.7 }} className="truncate" title={user?.id || 'N/A'}>{user?.id || 'N/A'}</div>
                <div style={{ color: 'var(--foreground)', fontWeight: '600' }}>Rank</div>
                <div style={{ color: 'var(--foreground)', opacity: 0.7 }}>{user?.rank || '0'}</div>
              </div>
              <div className="hidden sm:grid md:hidden grid-cols-2 gap-3">
                <div style={{ color: 'var(--foreground)', fontWeight: '600' }}>Username</div>
                <div style={{ color: 'var(--foreground)', opacity: 0.7 }} className="truncate" title={user?.username || 'N/A'}>{user?.username || 'N/A'}</div>
                <div style={{ color: 'var(--foreground)', fontWeight: '600' }}>UID</div>
                <div style={{ color: 'var(--foreground)', opacity: 0.7 }} className="truncate" title={user?.id || 'N/A'}>{user?.id || 'N/A'}</div>
                <div style={{ color: 'var(--foreground)', fontWeight: '600' }}>Rank</div>
                <div style={{ color: 'var(--foreground)', opacity: 0.7 }}>{user?.rank || '0'}</div>
              </div>
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 gap-x-4 md:gap-x-20 lg:gap-x-40">
                <div style={{ color: 'var(--foreground)', fontWeight: '600' }}>Username</div>
                <div style={{ color: 'var(--foreground)', fontWeight: '600' }}>UID</div>
                <div style={{ color: 'var(--foreground)', fontWeight: '600' }}>Rank</div>
                <div style={{ color: 'var(--foreground)', opacity: 0.7 }} className="truncate" title={user?.username || 'N/A'}>{user?.username || 'N/A'}</div>
                <div style={{ color: 'var(--foreground)', opacity: 0.7 }} className="truncate" title={user?.id || 'N/A'}>{user?.id || 'N/A'}</div>
                <div style={{ color: 'var(--foreground)', opacity: 0.7 }}>{user?.rank || '0'}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:hidden md:hidden">
                <div style={{ color: 'var(--foreground)', fontWeight: '600' }}>Acc Created</div>
                <div style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                  {user?.createdAt 
                    ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: '2-digit', 
                        day: '2-digit' 
                      })
                    : new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: '2-digit', 
                        day: '2-digit' 
                      })
                  }
                </div>
                <div style={{ color: 'var(--foreground)', fontWeight: '600' }}>E-mail</div>
                <div style={{ color: 'var(--foreground)', opacity: 0.7 }} className="truncate" title={user?.email || 'N/A'}>{user?.email || 'N/A'}</div>
                <div style={{ color: 'var(--foreground)', fontWeight: '600' }}>Password</div>
                <div style={{ color: 'var(--foreground)', opacity: 0.7 }}>••••••••</div>
                <div style={{ color: 'var(--foreground)', fontWeight: '600' }}>Avg WPM</div>
                <div style={{ color: 'var(--foreground)', opacity: 0.7 }}>{user?.avgWpm?.toFixed(1) || '0.0'}</div>
                <div style={{ color: 'var(--foreground)', fontWeight: '600' }}>Avg ACC</div>
                <div style={{ color: 'var(--foreground)', opacity: 0.7 }}>{user?.avgAccuracy?.toFixed(1) || '0.0'}%</div>
                <div style={{ color: 'var(--foreground)', fontWeight: '600' }}>Total Play</div>
                <div style={{ color: 'var(--foreground)', opacity: 0.7 }}>{user?.totalPlay || '0'}</div>
              </div>
              <div className="hidden sm:grid md:hidden grid-cols-2 gap-3">
                <div style={{ color: 'var(--foreground)', fontWeight: '600' }}>Acc Created</div>
                <div style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                  {user?.createdAt 
                    ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: '2-digit', 
                        day: '2-digit' 
                      })
                    : new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: '2-digit', 
                        day: '2-digit' 
                      })
                  }
                </div>
                <div style={{ color: 'var(--foreground)', fontWeight: '600' }}>E-mail</div>
                <div style={{ color: 'var(--foreground)', opacity: 0.7 }} className="truncate" title={user?.email || 'N/A'}>{user?.email || 'N/A'}</div>
                <div style={{ color: 'var(--foreground)', fontWeight: '600' }}>Password</div>
                <div style={{ color: 'var(--foreground)', opacity: 0.7 }}>••••••••</div>
                <div style={{ color: 'var(--foreground)', fontWeight: '600' }}>Avg WPM</div>
                <div style={{ color: 'var(--foreground)', opacity: 0.7 }}>{user?.avgWpm?.toFixed(1) || '0.0'}</div>
                <div style={{ color: 'var(--foreground)', fontWeight: '600' }}>Avg ACC</div>
                <div style={{ color: 'var(--foreground)', opacity: 0.7 }}>{user?.avgAccuracy?.toFixed(1) || '0.0'}%</div>
                <div style={{ color: 'var(--foreground)', fontWeight: '600' }}>Total Play</div>
                <div style={{ color: 'var(--foreground)', opacity: 0.7 }}>{user?.totalPlay || '0'}</div>
              </div>
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 gap-x-4 md:gap-x-20 lg:gap-x-40 mt-6 sm:mt-10">
                <div style={{ color: 'var(--foreground)', fontWeight: '600' }}>Acc Created</div>
                <div style={{ color: 'var(--foreground)', fontWeight: '600' }}>E-mail</div>
                <div style={{ color: 'var(--foreground)', fontWeight: '600' }}>Password</div>
                <div style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                  {user?.createdAt 
                    ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: '2-digit', 
                        day: '2-digit' 
                      })
                    : new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: '2-digit', 
                        day: '2-digit' 
                      })
                  }
                </div>
                <div style={{ color: 'var(--foreground)', opacity: 0.7 }} className="truncate" title={user?.email || 'N/A'}>{user?.email || 'N/A'}</div>
                <div style={{ color: 'var(--foreground)', opacity: 0.7 }}>••••••••</div>
              </div>
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 gap-x-4 md:gap-x-20 lg:gap-x-40 mt-6">
                <div style={{ color: 'var(--foreground)', fontWeight: '600' }}>Avg WPM</div>
                <div style={{ color: 'var(--foreground)', fontWeight: '600' }}>Avg ACC</div>
                <div style={{ color: 'var(--foreground)', fontWeight: '600' }}>Total Play</div>
                <div style={{ color: 'var(--foreground)', opacity: 0.7 }}>{user?.avgWpm?.toFixed(1) || '0.0'}</div>
                <div style={{ color: 'var(--foreground)', opacity: 0.7 }}>{user?.avgAccuracy?.toFixed(1) || '0.0'}%</div>
                <div style={{ color: 'var(--foreground)', opacity: 0.7 }}>{user?.totalPlay || '0'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Weaknesses Section */}
        <h1 className={`${spmono.className} text-xl sm:text-2xl md:text-[32px] space-mono font-bold mt-6 sm:mt-8`} style={{ color: 'var(--foreground)' }}>
          ตาวิเศษ (Global Weakness)
        </h1>
        <p className="mb-4" style={{ color: 'var(--foreground)', opacity: 0.7 }}>The characters you have missed the most across all your play sessions.</p>

        <div className="flex flex-wrap gap-4 mb-10">
          {loadingGlobalWeaknesses ? (
            <div className="w-full p-6 rounded-lg text-center transition-colors duration-300" style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)' }}>Loading weakness analysis...</div>
          ) : globalWeaknesses.length === 0 ? (
            <div className="w-full p-6 rounded-lg text-center flex flex-col items-center transition-colors duration-300" style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)' }}>
              <span className="text-3xl mb-2">🎉</span>
              <p>You have no recorded mistakes! Perfect accuracy!</p>
            </div>
          ) : (
            globalWeaknesses.map((weakness, index) => (
              <div key={weakness.character} className={`flex flex-col items-center justify-center p-4 rounded-xl shadow-lg border-b-4 flex-1 min-w-[120px] transition-colors duration-300`} style={{
                  backgroundColor: index === 0 ? 'var(--primary)' : 'var(--card)',
                  borderColor: index === 0 ? 'var(--primary)' : 'var(--border)'
                }}>
                <div className="text-4xl font-bold mb-2" style={{ color: index === 0 ? 'var(--primary-foreground)' : 'var(--card-foreground)' }}>
                  {weakness.character.toUpperCase()}
                </div>
                <div className="text-sm capitalize px-3 py-1 rounded-full transition-colors duration-300" style={{ 
                  backgroundColor: 'var(--background)', 
                  color: 'var(--foreground)', 
                  opacity: 0.8
                }}>
                  {weakness.errorCount} mistakes
                </div>
                {index === 0 && (
                  <div className="mt-2 text-xs font-bold tracking-wider uppercase" style={{ color: 'var(--primary)' }}>
                    Highest Error Rate
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        </div>
        <div className="w-full max-w-4xl mx-auto">
          <h1 className={`${spmono.className} text-xl sm:text-2xl md:text-[32px] space-mono font-bold mt-6 sm:mt-8`} style={{ color: 'var(--foreground)' }}>
            Play History
          </h1>
          <p className="mb-4" style={{ color: 'var(--foreground)', opacity: 0.7 }}>Click on any session to view detailed analysis and your weak points.</p>
          <div className="w-full min-w-0 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div
            className={`grid grid-cols-[minmax(80px,1fr)_60px_60px_80px] sm:grid-cols-[minmax(120px,1fr)_80px_80px_100px] md:grid-cols-[minmax(150px,1fr)_100px_100px_120px] lg:grid-cols-[300px_180px_180px_180px] px-4 mb-2 min-w-[300px] sm:min-w-[400px] md:min-w-[500px] lg:min-w-[600px] ${spmono.className} font-bold text-xs sm:text-sm md:text-base transition-colors duration-300`}
            style={{ color: 'var(--foreground)', opacity: 0.7 }}
          >
            <div className="ml-0 sm:ml-5 md:ml-10">Mode</div>
            <div>WPM</div>
            <div>ACC</div>
            <div className="hidden sm:block">Date</div>
            <div className="sm:hidden">D</div>
          </div>
          <div
            className={`flex flex-col min-w-[300px] sm:min-w-[400px] md:min-w-[500px] lg:min-w-[600px] ${spmono.className} font-bold text-xs sm:text-sm md:text-base max-h-[400px] overflow-y-auto rounded-lg transition-colors duration-300`}
            style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)', border: '1px solid var(--border)' }}
          >
            {loadingHistory ? (
              <div className="py-8 text-center rounded-lg transition-colors duration-300" style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)' }}>Loading history...</div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center rounded-lg transition-colors duration-300" style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)' }}>No play sessions found. Go play some games!</div>
            ) : (
              <div className="space-y-0">
                {history.map((session, index) => (
                <div
                  key={session.id}
                  onClick={() => handleRowClick(session.id)}
                  className={`grid grid-cols-[minmax(80px,1fr)_60px_60px_80px] sm:grid-cols-[minmax(120px,1fr)_80px_80px_100px] md:grid-cols-[minmax(150px,1fr)_100px_100px_120px] lg:grid-cols-[300px_180px_180px_180px]
                        px-4
                        h-10 sm:h-12 md:h-14 lg:h-16
                       items-center cursor-pointer transition-colors
                       ${index === 0 ? 'rounded-t-lg' : ''}
                       ${index === history.length - 1 ? 'rounded-b-lg' : ''}
                       border-b`}
                       style={{ 
                         backgroundColor: 'var(--card)', 
                         color: 'var(--card-foreground)',
                         borderBottom: '1px solid var(--border)'
                       }}
                >
                  <div className="pl-0 sm:pl-5 md:pl-10 truncate capitalize text-xs sm:text-sm md:text-base">
                    <span className="sm:hidden">{session.mode?.name?.slice(0,3)} {session.symbol?.name?.slice(0,3)} {session.difficulty?.amtWord}</span>
                    <span className="hidden sm:block md:hidden">{session.mode?.name?.slice(0,6)} {session.symbol?.name?.slice(0,6)} {session.difficulty?.amtWord}</span>
                    <span className="hidden md:inline">{session.mode?.name} {session.symbol?.name} {session.difficulty?.amtWord}</span>
                  </div>
                  <div className="text-xs sm:text-sm md:text-base">{session.wpm}</div>
                  <div className="text-xs sm:text-sm md:text-base">{session.accuracy}%</div>
                  <div className="text-xs sm:text-sm md:text-base">{new Date(session.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
              </div>
            )}
          </div>
        </div>

        {/* Session Details Modal */}
        {selectedSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
            <div className="rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col my-auto shadow-2xl relative transition-colors duration-300" style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)', border: '1px solid var(--border)' }}>
              <div className="p-6" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className={`${spmono.className} text-2xl font-bold capitalize`} style={{ color: 'var(--card-foreground)' }}>
                      {selectedSession.mode?.name} {selectedSession.symbol?.name} {selectedSession.difficulty?.amtWord}
                    </h2>
                    <p className="mt-1" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                      {new Date(selectedSession.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSession(null)}
                    className="transition-colors duration-300"
                    style={{ color: 'var(--foreground)', opacity: 0.7 }}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
                <div className="flex gap-6 mt-4">
                  <div className="px-4 py-2 rounded-lg transition-colors duration-300" style={{ backgroundColor: 'var(--background)', color: 'var(--card-foreground)' }}>
                    <div className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>WPM</div>
                    <div className="text-xl font-bold">{selectedSession.wpm}</div>
                  </div>
                  <div className="px-4 py-2 rounded-lg transition-colors duration-300" style={{ backgroundColor: 'var(--background)', color: 'var(--card-foreground)' }}>
                    <div className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>Accuracy</div>
                    <div className="text-xl font-bold">{selectedSession.accuracy}%</div>
                  </div>
                  <div className="px-2 sm:px-4 py-2 rounded-lg transition-colors duration-300" style={{ backgroundColor: 'var(--background)', color: 'var(--card-foreground)' }}>
                    <div className="text-xs sm:text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>Time</div>
                    <div className="text-lg sm:text-xl font-bold">{selectedSession.timeTaken}s</div>
                  </div>
                </div>
              </div>

              <div className="p-6 transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--card-foreground)' }}>
                  🔍 Weakness Analysis
                </h3>
                <p className="text-lg p-4 rounded-lg transition-colors duration-300" style={{ 
                  backgroundColor: 'var(--primary)', 
                  color: 'var(--primary-foreground)',
                  opacity: 0.2,
                  border: '1px solid var(--primary)',
                  borderOpacity: 0.4
                }}>
                  {getWeakness(selectedSession.details)}
                </p>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--card-foreground)' }}>Input Timeline</h3>
                {selectedSession.details && selectedSession.details.length > 0 ? (
                  <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-2 sm:gap-4 p-2 sm:p-4 rounded-xl items-center text-xs sm:text-sm w-full min-w-[400px] sm:min-w-[500px] transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
                    <div className="font-bold" style={{ color: 'var(--foreground)', opacity: 0.7 }}>#</div>
                    <div className="font-bold" style={{ color: 'var(--foreground)', opacity: 0.7 }}>Question</div>
                    <div className="font-bold" style={{ color: 'var(--foreground)', opacity: 0.7 }}>Answer</div>
                    <div className="font-bold hidden sm:block" style={{ color: 'var(--foreground)', opacity: 0.7 }}>Correct</div>
                    <div className="font-bold sm:hidden" style={{ color: 'var(--foreground)', opacity: 0.7 }}>✓</div>
                    <div className="font-bold hidden sm:block" style={{ color: 'var(--foreground)', opacity: 0.7 }}>Time</div>
                    <div className="font-bold sm:hidden" style={{ color: 'var(--foreground)', opacity: 0.7 }}>T</div>

                    {selectedSession.details.map((detail, idx) => (
                      <React.Fragment key={idx}>
                        <div style={{ color: 'var(--foreground)', opacity: 0.6 }}>{detail.orderIndex}</div>
                        <div className="px-1 sm:px-2 py-1 rounded inline-block w-fit text-xs sm:text-sm transition-colors duration-300" style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)' }}>{detail.question}</div>
                        <div className={`font-bold text-xs sm:text-sm`} style={{ color: detail.isCorrect ? '#22c55e' : '#ef4444' }}>{detail.userAnswer || '-'}</div>
                        <div className="hidden sm:block text-xs sm:text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>{detail.correctAnswer}</div>
                        <div className="sm:hidden text-xs" style={{ color: 'var(--foreground)', opacity: 0.7 }}>{detail.isCorrect ? '✓' : '✗'}</div>
                        <div className="text-right text-xs sm:text-sm" style={{ color: 'var(--foreground)', opacity: 0.6 }}>{detail.responseTime}ms</div>
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--foreground)', opacity: 0.7 }}>No detailed timeline available for this session.</p>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="w-full max-w-4xl mx-auto">
          <h1 className={`${spmono.className} text-xl sm:text-2xl md:text-[32px] space-mono font-bold mt-6 sm:mt-8`} style={{ color: 'var(--foreground)' }}>
            Best Scores by Mode
          </h1>
          <div className="w-full min-w-0 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div
            className={`grid grid-cols-[minmax(100px,1fr)_60px_60px_80px] sm:grid-cols-[minmax(150px,1fr)_80px_80px_100px] md:grid-cols-[minmax(200px,1fr)_100px_100px_120px] lg:grid-cols-[400px_180px_180px_180px] px-4 mb-2 min-w-[300px] sm:min-w-[400px] md:min-w-[500px] lg:min-w-[600px] ${spmono.className} font-bold text-xs sm:text-sm md:text-base transition-colors duration-300`}
            style={{ color: 'var(--foreground)', opacity: 0.7 }}
          >
            <div className="ml-0 sm:ml-5 md:ml-10">Mode</div>
            <div>WPS</div>
            <div>ACC</div>
            <div className="hidden sm:block">Date</div>
            <div className="sm:hidden">D</div>
          </div>
          <div
            className={`flex flex-col ${spmono.className} font-bold text-xs sm:text-sm md:text-base rounded-lg transition-colors duration-300`}
            style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)', border: '1px solid var(--border)' }}
          >
            {loadingBestScores ? (
              <div className="py-8 text-center rounded-lg transition-colors duration-300" style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)' }}>Loading best scores...</div>
            ) : (
              ALL_MODE_COMBOS.map((combo, index) => {
                const score = findBestScore(combo.mode, combo.symbol, combo.amtWord);
                const label = `${combo.mode} ${combo.symbol} ${combo.amtWord}`;
                return (
                  <div
                    key={label}
                    className={`grid grid-cols-[minmax(100px,1fr)_60px_60px_80px] sm:grid-cols-[minmax(150px,1fr)_80px_80px_100px] md:grid-cols-[minmax(200px,1fr)_100px_100px_120px] lg:grid-cols-[400px_180px_180px_180px]
                        px-4
                        h-10 sm:h-12 md:h-14 lg:h-16
                       items-center transition-colors
                       ${index === 0 ? 'rounded-t-lg' : ''}
                       ${index === ALL_MODE_COMBOS.length - 1 ? 'rounded-b-lg' : ''}`}
                       style={{ 
                         backgroundColor: 'var(--card)', 
                         color: 'var(--card-foreground)',
                         borderBottom: '1px solid var(--border)'
                       }}
                  >
                    <div className="pl-0 sm:pl-5 md:pl-10 truncate capitalize text-xs sm:text-sm md:text-base">
                      <span className="sm:hidden">{combo.mode.slice(0,3)} {combo.symbol.slice(0,3)} {combo.amtWord}</span>
                      <span className="hidden sm:block md:hidden">{combo.mode} {combo.symbol} {combo.amtWord}</span>
                      <span className="hidden md:inline">{label}</span>
                    </div>
                    <div className="text-xs sm:text-sm md:text-base">{score ? score.highWpm : 'N/A'}</div>
                    <div className="text-xs sm:text-sm md:text-base">{score ? `${score.highAccuracy}%` : 'N/A'}</div>
                    <div className="text-xs sm:text-sm md:text-base">{score ? new Date(score.updatedAt).toLocaleDateString() : 'N/A'}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        </div>
        <div className="flex justify-center">
          <button
            onClick={handleLogout}
            className={`${spmono.className} font-bold text-[32px] w-full sm:w-[280px] h-20 rounded-xl mt-[50px] transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed max-w-[280px] sm:max-w-none`}
            style={{ 
              backgroundColor: 'var(--primary)', 
              color: 'var(--primary-foreground)'
            }}
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProtectedProfile() {
  return (
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  );
}