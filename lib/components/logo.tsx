"use client";

import React from "react";

/**
 * Pulse-8 Logo Component
 * ECG waveform on a circular background with red, white, and dark gray sections
 */
export function Logo({ className }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        {/* Circle with three sections */}
        <defs>
          <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#1f2937" />
          </linearGradient>
        </defs>
        
        {/* Main circle with sections */}
        <circle cx="60" cy="60" r="50" fill="url(#circleGradient)" />
        
        {/* White section overlay (top-left) */}
        <path
          d="M 60 10 A 50 50 0 0 1 110 60 L 60 60 Z"
          fill="#ffffff"
        />
        
        {/* Red section overlay (top-right) */}
        <path
          d="M 110 60 A 50 50 0 0 1 60 110 L 60 60 Z"
          fill="#dc2626"
        />
        
        {/* Dark gray section overlay (bottom) */}
        <path
          d="M 60 110 A 50 50 0 0 1 10 60 L 60 60 Z"
          fill="#1f2937"
        />
        
        {/* ECG/Heartbeat waveform line */}
        <path
          d="M 20 60 L 30 50 L 35 60 L 40 45 L 45 60 L 50 55 L 55 60 L 60 50 L 65 60 L 70 55 L 75 60 L 80 50 L 85 60 L 90 55 L 95 60 L 100 60"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter="drop-shadow(0 2px 2px rgba(0,0,0,0.2))"
        />
        
        {/* Left red dot */}
        <circle cx="20" cy="60" r="4" fill="#dc2626" />
        
        {/* Right dark gray dot */}
        <circle cx="100" cy="60" r="4" fill="#1f2937" />
      </svg>
    </div>
  );
}

