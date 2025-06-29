'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import MainWorkspace from '@/components/layout/MainWorkspace';
import AiAssistant from '@/components/ai/AiAssistant';
import { useDataStore } from '@/store/dataStore';

export default function Home() {
  const aiAssistantOpen = useDataStore((state) => state.aiAssistantOpen);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 bg-pattern-dots">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10"></div>
      <div className="relative z-10">
        <Navbar />
        
        <div className="flex">
          <Sidebar />
          
          <main className={`flex-1 transition-all duration-300 ${
            aiAssistantOpen ? 'mr-80' : 'mr-0'
          }`}>
            <MainWorkspace />
          </main>
          
          <AiAssistant />
        </div>
      </div>
    </div>
  );
}