'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useDataStore } from '@/store/dataStore';
import FileUploader from '@/components/steps/FileUploader';
import DataValidator from '@/components/steps/DataValidator';
import RuleBuilder from '@/components/steps/RuleBuilder';
import PriorityManager from '@/components/steps/PriorityManager';
import ExportManager from '@/components/steps/ExportManager';

const stepComponents = [
  FileUploader,
  DataValidator,
  RuleBuilder,
  PriorityManager,
  ExportManager
];

export default function MainWorkspace() {
  const currentStep = useDataStore((state) => state.currentStep);
  
  const CurrentStepComponent = stepComponents[currentStep];

  return (
    <div className="p-6 min-h-[calc(100vh-4rem)]">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          <CurrentStepComponent />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}