'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useDataStore } from '@/store/dataStore';
import { 
  Upload, 
  CheckCircle2, 
  Settings, 
  Target, 
  Package,
  ChevronRight
} from 'lucide-react';

const stepIcons = [
  Upload,
  CheckCircle2,
  Settings,
  Target,
  Package
];

const stepColors = [
  'from-blue-500 to-cyan-500',
  'from-green-500 to-emerald-500',
  'from-purple-500 to-indigo-500',
  'from-orange-500 to-red-500',
  'from-pink-500 to-rose-500'
];

export default function Sidebar() {
  const { currentStep, steps, setCurrentStep, files } = useDataStore();
  
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="w-72 bg-white/90 backdrop-blur-sm border-r h-[calc(100vh-4rem)] sticky top-16 p-6 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-50/50 to-blue-50/50"></div>
      <div className="relative space-y-6">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Workflow Progress
          </h2>
          <div className="relative">
            <Progress value={progress} className="h-3 bg-gray-200" />
            <div 
              className="absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 shadow-glow-purple"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>
        
        <div className="space-y-2">
          {steps.map((step, index) => {
            const Icon = stepIcons[index];
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const isAccessible = index <= currentStep || (index === 1 && files.length > 0);
            const colorClass = stepColors[index];
            
            return (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={`w-full justify-start gap-3 h-12 transition-all duration-200 ${
                    isActive 
                      ? `bg-gradient-to-r ${colorClass} text-white shadow-lg hover:shadow-xl` 
                      : isCompleted 
                        ? 'text-green-600 hover:text-green-700 hover:bg-green-50' 
                        : 'hover:bg-gray-50'
                  } ${!isAccessible ? 'opacity-50 cursor-not-allowed' : 'hover-lift'}`}
                  onClick={() => isAccessible && setCurrentStep(index)}
                  disabled={!isAccessible}
                >
                  <div className={`p-1 rounded-lg ${
                    isActive 
                      ? 'bg-white/20' 
                      : isCompleted 
                        ? 'bg-green-100' 
                        : 'bg-gray-100'
                  }`}>
                    <Icon className={`h-4 w-4 ${
                      isCompleted ? 'text-green-600' : 
                      isActive ? 'text-white' : 'text-gray-500'
                    }`} />
                  </div>
                  <span className="flex-1 text-left font-medium">{step}</span>
                  {isCompleted && (
                    <div className="p-1 bg-green-100 rounded-full">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                  )}
                  {isActive && (
                    <ChevronRight className="h-4 w-4 text-white" />
                  )}
                </Button>
                
                {/* Progress indicator */}
                {isActive && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"
                  />
                )}
              </motion.div>
            );
          })}
        </div>
        
        {files.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
              Uploaded Files
            </h3>
            <div className="space-y-2">
              {files.map((file, index) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="p-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded">
                    <Upload className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm text-gray-700 truncate flex-1">
                    {file.name}
                  </span>
                  {file.processed && (
                    <div className="p-1 bg-green-100 rounded-full">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}