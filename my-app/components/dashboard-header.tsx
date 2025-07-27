"use client";

import { Video, LogOut } from "lucide-react";

export function DashboardHeader({ onLogout }: { onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-900/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white">TikTok Insights</h1>
            <p className="text-xs text-gray-400">Video Analytics Platform</p>
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="flex items-center text-gray-300 hover:text-white cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </button>
      </div>
    </header>
  );
}