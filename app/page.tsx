'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import MainWorkspace from '@/components/layout/MainWorkspace';
import AiAssistant from '@/components/ai/AiAssistant';
import { useDataStore } from '@/store/dataStore';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

export default function Home() {
  const aiAssistantOpen = useDataStore((state) => state.aiAssistantOpen);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 bg-pattern-dots">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10"></div>
      <div className="relative z-10">
        <Navbar />
        
        <div className="flex relative">
          {/* Mobile Sidebar Overlay */}
          {isMobile && sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="fixed top-20 left-4 z-50 lg:hidden bg-white/90 backdrop-blur-sm shadow-lg"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          )}

          {/* Sidebar */}
          <div className={`
            ${isMobile 
              ? `fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 transform transition-transform duration-300 ${
                  sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`
              : 'relative'
            }
          `}>
            <Sidebar />
          </div>
          
          {/* Main Content */}
          <main className={`
            flex-1 transition-all duration-300
            ${isMobile ? 'w-full' : ''}
            ${aiAssistantOpen && !isMobile ? 'mr-80' : 'mr-0'}
            ${isMobile ? 'px-4' : ''}
          `}>
            <MainWorkspace />
          </main>
          
          {/* AI Assistant */}
          <div className={`
            ${isMobile && aiAssistantOpen 
              ? 'fixed inset-0 z-50 bg-white' 
              : ''
            }
          `}>
            <AiAssistant />
          </div>
        </div>
      </div>
    </div>
  );
}