import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface DataFile {
  id: string;
  name: string;
  data: any[];
  headers: string[];
  errors: ValidationError[];
  processed: boolean;
  uploadedAt: Date;
  validationResults?: any;
  aiFixesApplied?: number;
  aiProcessed?: boolean;
  entityType?: 'client' | 'worker' | 'task' | 'unknown';
  confidence?: number;
}

export interface ValidationError {
  row: number;
  column: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  type: string;
  fixable: boolean;
}

export interface DataRule {
  id: string;
  name: string;
  type: 'coRun' | 'phaseWindow' | 'loadLimit' | 'slotRestriction' | 'patternMatch' | 'precedence' | 'aiGenerated' | 'validation' | 'transformation' | 'constraint';
  description?: string;
  condition: string;
  action: string;
  enabled: boolean;
  priority?: number;
  sourceFiles?: string[];
  targetColumns?: string[];
  parameters?: Record<string, any>;
  createdAt?: Date;
  lastModified?: Date;
}

export interface PriorityWeight {
  field: string;
  weight: number;
  type: 'maximize' | 'minimize';
  description?: string;
  category?: 'fulfillment' | 'fairness' | 'workload' | 'quality';
}

interface DataState {
  // Files
  files: DataFile[];
  activeFileId: string | null;
  
  // Workflow
  currentStep: number;
  steps: string[];
  
  // Validation
  validationEnabled: boolean;
  globalErrors: ValidationError[];
  
  // Rules
  rules: DataRule[];
  
  // Priorities
  priorities: PriorityWeight[];
  
  // AI
  aiAssistantOpen: boolean;
  aiSuggestions: string[];
  
  // Search
  searchQuery: string;
  searchResults: any[];
  
  // Actions
  addFile: (file: DataFile) => void;
  removeFile: (id: string) => void;
  setActiveFile: (id: string) => void;
  updateFileData: (id: string, data: any[]) => void;
  updateFileValidation: (id: string, results: any) => void;
  setCurrentStep: (step: number) => void;
  toggleValidation: () => void;
  addRule: (rule: DataRule) => void;
  updateRule: (id: string, updates: Partial<DataRule>) => void;
  removeRule: (id: string) => void;
  setPriorities: (priorities: PriorityWeight[]) => void;
  toggleAiAssistant: () => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: any[]) => void;
  incrementAiFixes: (fileId: string) => void;
}

export const useDataStore = create<DataState>()(
  devtools(
    (set, get) => ({
      // Initial state
      files: [],
      activeFileId: null,
      currentStep: 0,
      steps: ['Upload Files', 'Clean & Validate', 'Define Rules', 'Set Priorities', 'Export Package'],
      validationEnabled: true,
      globalErrors: [],
      rules: [],
      priorities: [],
      aiAssistantOpen: false,
      aiSuggestions: [],
      searchQuery: '',
      searchResults: [],
      
      // Actions
      addFile: (file) => set((state) => ({
        files: [...state.files, file],
        activeFileId: file.id
      })),
      
      removeFile: (id) => set((state) => {
        const newFiles = state.files.filter(f => f.id !== id);
        const newActiveFileId = state.activeFileId === id 
          ? (newFiles.length > 0 ? newFiles[0].id : null)
          : state.activeFileId;
        
        return {
          files: newFiles,
          activeFileId: newActiveFileId
        };
      }),
      
      setActiveFile: (id) => set({ activeFileId: id }),
      
      updateFileData: (id, data) => set((state) => ({
        files: state.files.map(f => 
          f.id === id ? { ...f, data, processed: true } : f
        )
      })),
      
      updateFileValidation: (id, results) => set((state) => ({
        files: state.files.map(f => 
          f.id === id ? { ...f, validationResults: results } : f
        )
      })),
      
      setCurrentStep: (step) => set({ currentStep: step }),
      
      toggleValidation: () => set((state) => ({ 
        validationEnabled: !state.validationEnabled 
      })),
      
      addRule: (rule) => set((state) => ({
        rules: [...state.rules, rule]
      })),
      
      updateRule: (id, updates) => set((state) => ({
        rules: state.rules.map(r => 
          r.id === id ? { ...r, ...updates, lastModified: new Date() } : r
        )
      })),
      
      removeRule: (id) => set((state) => ({
        rules: state.rules.filter(r => r.id !== id)
      })),
      
      setPriorities: (priorities) => set({ priorities }),
      
      toggleAiAssistant: () => set((state) => ({ 
        aiAssistantOpen: !state.aiAssistantOpen 
      })),
      
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      setSearchResults: (results) => set({ searchResults: results }),
      
      incrementAiFixes: (fileId) => set((state) => ({
        files: state.files.map(f => 
          f.id === fileId ? { ...f, aiFixesApplied: (f.aiFixesApplied || 0) + 1 } : f
        )
      }))
    }),
    {
      name: 'data-alchemist-store'
    }
  )
);