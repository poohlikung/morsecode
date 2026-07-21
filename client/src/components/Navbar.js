"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Space_Mono } from 'next/font/google';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const spmono = Space_Mono({
    subsets: ['latin'],
    weight: ["400", "700"],
});

const SettingsIcon = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ verticalAlign: 'middle', display: 'inline-block' }}
        aria-hidden
    >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

export default function Navbar() {
    const pathname = usePathname();
    const { user } = useAuth();
    const { theme } = useTheme();
    const [menuOpen, setMenuOpen] = useState(false);
    const [hoveredLink, setHoveredLink] = useState(null);

    const navLinks = [
        { href: '/', label: 'home' },
        { href: '/practice', label: 'practice' },
        { href: '/leaderboard', label: 'leaderboard' },
        { href: '/about', label: 'about' },
        { href: '/setting', label: <SettingsIcon /> },
    ];

    if (user && user.role === 'ADMIN') {
        navLinks.push({ href: '/admin/dashboard', label: 'admin' });
    }

    const getLinkStyle = (href) => {
        const isActive = pathname === href;
        const isHovered = hoveredLink === href;
        return {
            color: isActive ? 'var(--primary)' : isHovered ? 'var(--primary)' : 'var(--foreground)',
            opacity: isActive ? 1 : isHovered ? 0.9 : 0.7,
            transform: isHovered && !isActive ? 'translateY(-2px)' : 'translateY(0)',
        };
    };

    const getMobileLinkStyle = (href) => {
        const isActive = pathname === href;
        const isHovered = hoveredLink === href;
        return {
            color: isActive || isHovered ? 'var(--primary)' : 'var(--foreground)',
            opacity: isActive || isHovered ? 1 : 0.7,
            backgroundColor: isActive ? 'rgba(239, 68, 68, 0.08)' : isHovered ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
        };
    };

    return (
        <>
            <nav className='w-full flex justify-between items-center px-4 sm:px-6 md:px-10 lg:px-20 xl:px-40 py-4 md:py-6 lg:py-10 absolute top-0 left-0 z-50 backdrop-blur-sm shadow-xl transition-colors duration-300' style={{ backgroundColor: 'var(--background)', opacity: 0.8 }}>
                <a
                    href='/'
                    className={`${spmono.className} font-bold text-base md:text-[20px] shrink-0 transition-all duration-300 hover:scale-105`}
                    style={{ color: 'var(--foreground)' }}
                >
                    morse<span style={{ color: 'var(--primary)' }}>code</span>
                </a>

                {/* Desktop: horizontal links + profile */}
                <div className='hidden md:flex max-w-[520px] flex-1 justify-between items-center gap-2 mx-6'>
                    {navLinks.filter(l => l.href !== '/').map(({ href, label }) => (
                        <a
                            key={href}
                            href={href}
                            className={`${spmono.className} font-bold text-base md:text-[20px] transition-all duration-300 cursor-pointer`}
                            style={getLinkStyle(href)}
                            onMouseEnter={() => setHoveredLink(href)}
                            onMouseLeave={() => setHoveredLink(null)}
                        >
                            {label}
                        </a>
                    ))}
                    {user ? (
                        <a
                            href='/profile'
                            className={`${spmono.className} w-12 h-12 rounded-full flex items-center justify-center font-bold text-[14px] outline shrink-0 transition-all duration-300 hover:scale-110 hover:shadow-lg cursor-pointer`}
                            style={{
                                backgroundColor: hoveredLink === '/profile' ? 'var(--primary)' : 'var(--card)',
                                color: hoveredLink === '/profile' ? 'var(--primary-foreground)' : 'var(--card-foreground)',
                                outlineColor: 'var(--primary)',
                            }}
                            onMouseEnter={() => setHoveredLink('/profile')}
                            onMouseLeave={() => setHoveredLink(null)}
                        >
                            <p className='mb-1'>{user.username.slice(0, 2).toUpperCase()}</p>
                        </a>
                    ) : (
                        <a
                            href='/login'
                            className={`${spmono.className} font-bold px-4 py-2 rounded-lg border transition-all duration-300 hover:scale-105 cursor-pointer`}
                            style={{
                                borderColor: 'var(--primary)',
                                color: hoveredLink === '/login-btn' ? 'var(--primary-foreground)' : 'var(--primary)',
                                backgroundColor: hoveredLink === '/login-btn' ? 'var(--primary)' : 'transparent',
                            }}
                            onMouseEnter={() => setHoveredLink('/login-btn')}
                            onMouseLeave={() => setHoveredLink(null)}
                        >
                            login
                        </a>
                    )}
                </div>

                {/* Mobile: hamburger button */}
                <button
                    type="button"
                    aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={menuOpen}
                    className='md:hidden w-12 h-12 flex flex-col justify-center items-center gap-1.5 focus:outline-none focus:ring-2 rounded transition-all duration-300 hover:scale-110 cursor-pointer'
                    style={{ color: 'var(--foreground)', '--tw-ring-color': 'var(--primary)' }}
                    onClick={() => setMenuOpen((o) => !o)}
                >
                    {menuOpen ? (
                        <span className='text-2xl leading-none' aria-hidden>×</span>
                    ) : (
                        <>
                            <span className='w-6 h-0.5 rounded transition-all duration-300' style={{ backgroundColor: 'var(--foreground)' }} />
                            <span className='w-6 h-0.5 rounded transition-all duration-300' style={{ backgroundColor: 'var(--foreground)' }} />
                            <span className='w-6 h-0.5 rounded transition-all duration-300' style={{ backgroundColor: 'var(--foreground)' }} />
                        </>
                    )}
                </button>
            </nav>

            {/* Mobile dropdown menu */}
            {menuOpen && (
                <div className='md:hidden fixed top-[80px] left-0 w-full px-4 pb-4 z-40 shadow-2xl transition-colors duration-300' style={{ backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                    <div className={`flex flex-col gap-1 ${spmono.className}`}>
                        {navLinks.map(({ href, label }) => (
                            <a
                                key={href}
                                href={href}
                                className={`block py-3 px-2 font-bold text-[18px] transition-all duration-300 rounded-lg hover:pl-4`}
                                style={getMobileLinkStyle(href)}
                                onMouseEnter={() => setHoveredLink(href)}
                                onMouseLeave={() => setHoveredLink(null)}
                                onClick={() => setMenuOpen(false)}
                            >
                                {label}
                            </a>
                        ))}
                        {user ? (
                            <a
                                href='/profile'
                                className={`flex items-center gap-3 py-3 px-2 font-bold text-[18px] transition-all duration-300 mt-2 pt-4 rounded-lg hover:pl-4`}
                                style={{
                                    color: hoveredLink === '/profile-mobile' ? 'var(--primary)' : 'var(--foreground)',
                                    opacity: hoveredLink === '/profile-mobile' ? 1 : 0.7,
                                    borderTop: '1px solid var(--border)',
                                }}
                                onMouseEnter={() => setHoveredLink('/profile-mobile')}
                                onMouseLeave={() => setHoveredLink(null)}
                                onClick={() => setMenuOpen(false)}
                            >
                                <span className='w-12 h-12 rounded-full flex items-center justify-center text-[14px] outline shrink-0 transition-colors duration-300' style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)', outlineColor: 'var(--primary)' }}>
                                    <span className='mb-1'>{user.username.slice(0, 2).toUpperCase()}</span>
                                </span>
                                profile
                            </a>
                        ) : (
                            <a
                                href='/login'
                                className={`block py-3 px-2 font-bold text-[18px] transition-all duration-300 mt-2 pt-4 rounded-lg hover:pl-4`}
                                style={{
                                    color: 'var(--primary)',
                                    opacity: hoveredLink === '/login-mobile' ? 1 : 0.85,
                                    borderTop: '1px solid var(--border)',
                                }}
                                onMouseEnter={() => setHoveredLink('/login-mobile')}
                                onMouseLeave={() => setHoveredLink(null)}
                                onClick={() => setMenuOpen(false)}
                            >
                                login
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* Decorative separator */}
            <div className='w-full px-4 sm:px-7 absolute top-[90px] md:top-[120px] left-0'>
                <div className='w-full h-px transition-colors duration-300' style={{ backgroundColor: 'var(--border)', opacity: 0.3 }}></div>
            </div>
        </>
    );
}