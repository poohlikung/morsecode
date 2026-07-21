"use client";

import React, { useState, useEffect } from "react";
import { Space_Mono } from "next/font/google";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, THEMES } from "@/contexts/ThemeContext";
import Image from "next/image";

const spmono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
});

export default function Settings() {
  const { user, saveSettings, settings: userSettings } = useAuth();
  const { theme, updateTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (userSettings) {
      setSettings(userSettings);
      setIsLoading(false);
    }
  }, [userSettings]);

  return (
    <div className="min-h-screen px-4 py-8" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`${spmono.className} text-4xl font-bold mb-2`}>
            Settings
          </h1>
          <p style={{ color: 'var(--foreground)', opacity: 0.7 }}>
            Customize your Morse code experience
          </p>
        </div>

        {/* Settings Content */}
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)', border: '1px solid var(--border)' }}>
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-16 bg-[#2A3247] rounded" />
                  <div className="h-3 w-28 bg-[#2A3247] rounded" />
                </div>
                <div className="h-9 w-28 bg-[#2A3247] rounded-lg" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-[#2A3247] rounded" />
                  <div className="h-3 w-36 bg-[#2A3247] rounded" />
                </div>
                <div className="h-4 w-32 bg-[#2A3247] rounded-full" />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Theme */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Theme</h3>
                  <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>Choose color theme</p>
                </div>
                <select
                  value={theme}
                  onChange={(e) => updateTheme(e.target.value)}
                  className="rounded-lg px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    backgroundColor: 'var(--card)', 
                    color: 'var(--card-foreground)', 
                    border: '1px solid var(--border)',
                    '--tw-ring-color': 'var(--primary)'
                  }}
                >
                  {THEMES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Menu Position */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Menu Position</h3>
                  <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>Where the mode selector bar appears</p>
                </div>
                <select
                  value={settings?.menuPosition || 'top'}
                  onChange={async (e) => {
                    const newSettings = { ...settings, menuPosition: e.target.value };
                    setSettings(newSettings);

                    try {
                      await saveSettings(newSettings);
                    } catch (error) {
                      setSaveMessage(`Error: ${error.message}`);
                      setTimeout(() => setSaveMessage(""), 5000);
                    }
                  }}
                  className="rounded-lg px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    backgroundColor: 'var(--card)',
                    color: 'var(--card-foreground)',
                    border: '1px solid var(--border)',
                    '--tw-ring-color': 'var(--primary)'
                  }}
                >
                  <option value="top">Top</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>

              {/* Sound Volume */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Sound Volume</h3>
                  <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>Adjust audio volume ({settings?.soundVolume || 0}%)</p>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings?.soundVolume || 0}
                  onChange={async (e) => {
                    const newVolume = parseInt(e.target.value);
                    const newSettings = { ...settings, soundVolume: newVolume };
                    setSettings(newSettings);
                    
                    try {
                      await saveSettings(newSettings);
                    } catch (error) {
                      setSaveMessage(`Error: ${error.message}`);
                      setTimeout(() => setSaveMessage(""), 5000);
                    }
                  }}
                  className="w-32"
                  style={{ accentColor: 'var(--primary)' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div className="mt-6 flex justify-end">
            <p className="text-sm" style={{ 
              color: (saveMessage && saveMessage.includes && saveMessage.includes('Error')) ? '#ef4444' : '#22c55e'
            }}>
              {saveMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}