'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDataStore } from '@/store/dataStore';
import { 
  Target, 
  ArrowUp, 
  ArrowDown, 
  BarChart3,
  RefreshCw,
  GripVertical,
  Scale,
  Zap,
  Users,
  CheckCircle2,
  TrendingUp,
  Award,
  Shuffle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface PriorityWeight {
  field: string;
  weight: number;
  type: 'maximize' | 'minimize';
  description?: string;
  category?: 'fulfillment' | 'fairness' | 'workload' | 'quality';
}

interface PresetProfile {
  id: string;
  name: string;
  description: string;
  icon: any;
  weights: Partial<Record<string, { weight: number; type: 'maximize' | 'minimize' }>>;
  color: string;
}

interface PairwiseComparison {
  criteria1: string;
  criteria2: string;
  preference: number; // 1-9 scale
}

export default function PriorityManager() {
  const { 
    files, 
    priorities, 
    setPriorities, 
    setCurrentStep 
  } = useDataStore();
  
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('sliders');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [rankedCriteria, setRankedCriteria] = useState<string[]>([]);
  const [pairwiseComparisons, setPairwiseComparisons] = useState<PairwiseComparison[]>([]);
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  // Get all available fields from uploaded files with categorization
  const availableFields = useMemo(() => {
    const allHeaders = Array.from(new Set(files.flatMap(file => file.headers)));
    return allHeaders.map(field => ({
      name: field,
      category: categorizeField(field),
      description: getFieldDescription(field)
    }));
  }, [files]);

  const presetProfiles: PresetProfile[] = useMemo(() => [
    {
      id: 'maximize_fulfillment',
      name: 'Maximize Fulfillment',
      description: 'Prioritize completing as many client requests as possible',
      icon: CheckCircle2,
      color: 'bg-green-100 text-green-800 border-green-300',
      weights: {
        'RequestedTaskIDs': { weight: 90, type: 'maximize' },
        'PriorityLevel': { weight: 80, type: 'maximize' },
        'Duration': { weight: 30, type: 'minimize' },
        'MaxConcurrent': { weight: 70, type: 'maximize' }
      }
    },
    {
      id: 'fair_distribution',
      name: 'Fair Distribution',
      description: 'Ensure equitable workload distribution across workers',
      icon: Scale,
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      weights: {
        'WorkerGroup': { weight: 85, type: 'maximize' },
        'MaxLoadPerPhase': { weight: 80, type: 'maximize' },
        'AvailableSlots': { weight: 75, type: 'maximize' },
        'PriorityLevel': { weight: 50, type: 'maximize' }
      }
    },
    {
      id: 'minimize_workload',
      name: 'Minimize Workload',
      description: 'Optimize for efficiency and reduced resource usage',
      icon: TrendingUp,
      color: 'bg-purple-100 text-purple-800 border-purple-300',
      weights: {
        'Duration': { weight: 90, type: 'minimize' },
        'MaxConcurrent': { weight: 40, type: 'minimize' },
        'RequiredSkills': { weight: 60, type: 'minimize' },
        'MaxLoadPerPhase': { weight: 70, type: 'minimize' }
      }
    },
    {
      id: 'quality_first',
      name: 'Quality First',
      description: 'Prioritize high-quality outcomes and skill matching',
      icon: Award,
      color: 'bg-orange-100 text-orange-800 border-orange-300',
      weights: {
        'RequiredSkills': { weight: 95, type: 'maximize' },
        'QualificationLevel': { weight: 90, type: 'maximize' },
        'PriorityLevel': { weight: 85, type: 'maximize' },
        'Duration': { weight: 40, type: 'minimize' }
      }
    }
  ], []);

  // Initialize selected fields from existing priorities
  useEffect(() => {
    if (priorities.length > 0 && selectedFields.length === 0) {
      setSelectedFields(priorities.map(p => p.field));
    }
  }, [priorities, selectedFields.length]);

  // Memoized function to prevent infinite loops
  const updatePrioritiesFromFields = useCallback((fields: string[]) => {
    if (fields.length > 0) {
      const newPriorities = fields.map(field => {
        const existingPriority = priorities.find(p => p.field === field);
        const fieldInfo = availableFields.find(f => f.name === field);
        
        return {
          field,
          weight: existingPriority?.weight || 50,
          type: existingPriority?.type || getDefaultType(field) as 'maximize' | 'minimize',
          description: fieldInfo?.description,
          category: fieldInfo?.category as 'fulfillment' | 'fairness' | 'workload' | 'quality' | undefined
        };
      });
      setPriorities(newPriorities);
    }
  }, [availableFields, priorities, setPriorities]);

  // Only update priorities when selectedFields changes and is different
  useEffect(() => {
    const currentFields = priorities.map(p => p.field).sort();
    const newFields = selectedFields.sort();
    
    if (JSON.stringify(currentFields) !== JSON.stringify(newFields)) {
      updatePrioritiesFromFields(selectedFields);
    }
  }, [selectedFields, updatePrioritiesFromFields, priorities]);

  const applyPreset = useCallback((presetId: string) => {
    const preset = presetProfiles.find(p => p.id === presetId);
    if (!preset || selectedFields.length === 0) return;

    const newPriorities = selectedFields.map(field => {
      const presetWeight = preset.weights[field];
      const fieldInfo = availableFields.find(f => f.name === field);
      
      return {
        field,
        weight: presetWeight?.weight || 50,
        type: presetWeight?.type || getDefaultType(field) as 'maximize' | 'minimize',
        description: fieldInfo?.description,
        category: fieldInfo?.category as 'fulfillment' | 'fairness' | 'workload' | 'quality' | undefined
      };
    });

    setPriorities(newPriorities);
    setSelectedPreset(presetId);
    toast.success(`Applied ${preset.name} preset`);
  }, [selectedFields, availableFields, setPriorities, presetProfiles]);

  const updatePriorityWeight = useCallback((field: string, weight: number) => {
  const newPriorities = priorities.map(p =>
    p.field === field ? { ...p, weight } : p
  );
  setPriorities(newPriorities);
}, [priorities, setPriorities]);

  const updatePriorityType = useCallback((field: string, type: 'maximize' | 'minimize') => {
  const newPriorities = priorities.map(p =>
    p.field === field ? { ...p, type } : p
  );
  setPriorities(newPriorities);
}, [priorities, setPriorities]);


  const addField = useCallback((field: string) => {
    if (!selectedFields.includes(field)) {
      setSelectedFields(prev => [...prev, field]);
    }
  }, [selectedFields]);

  const removeField = useCallback((field: string) => {
  setSelectedFields(prev => prev.filter(f => f !== field));
  const newPriorities = priorities.filter(p => p.field !== field);
  setPriorities(newPriorities);
}, [priorities, setPriorities]);


  // Drag and Drop for ranking
  const handleDragStart = (field: string) => {
    setDraggedItem(field);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetField: string) => {
    e.preventDefault();
    if (!draggedItem) return;

    const draggedIndex = rankedCriteria.indexOf(draggedItem);
    const targetIndex = rankedCriteria.indexOf(targetField);
    
    const newRanked = [...rankedCriteria];
    newRanked.splice(draggedIndex, 1);
    newRanked.splice(targetIndex, 0, draggedItem);
    
    setRankedCriteria(newRanked);
    
    // Update weights based on ranking
    const totalFields = newRanked.length;
    const newPriorities = newRanked.map((field, index) => {
      const weight = Math.round(((totalFields - index) / totalFields) * 100);
      const existing = priorities.find(p => p.field === field);
      return {
        ...existing,
        field,
        weight,
        type: existing?.type || getDefaultType(field) as 'maximize' | 'minimize'
      };
    });
    
    setPriorities(newPriorities);
    setDraggedItem(null);
  };

  // Pairwise comparison logic
  const initializePairwiseComparisons = () => {
    const comparisons: PairwiseComparison[] = [];
    for (let i = 0; i < selectedFields.length; i++) {
      for (let j = i + 1; j < selectedFields.length; j++) {
        comparisons.push({
          criteria1: selectedFields[i],
          criteria2: selectedFields[j],
          preference: 5 // neutral
        });
      }
    }
    setPairwiseComparisons(comparisons);
    setCurrentPairIndex(0);
  };

  const updatePairwiseComparison = (preference: number) => {
    const updatedComparisons = [...pairwiseComparisons];
    updatedComparisons[currentPairIndex].preference = preference;
    setPairwiseComparisons(updatedComparisons);
    
    if (currentPairIndex < pairwiseComparisons.length - 1) {
      setCurrentPairIndex(currentPairIndex + 1);
    } else {
      // Calculate weights using AHP
      calculateAHPWeights();
    }
  };

  const calculateAHPWeights = () => {
    // Simplified AHP calculation
    const fieldWeights: Record<string, number> = {};
    
    selectedFields.forEach(field => {
      let score = 0;
      pairwiseComparisons.forEach(comparison => {
        if (comparison.criteria1 === field) {
          score += comparison.preference;
        } else if (comparison.criteria2 === field) {
          score += (10 - comparison.preference);
        }
      });
      fieldWeights[field] = score;
    });
    
    // Normalize to 0-100 scale
    const maxScore = Math.max(...Object.values(fieldWeights));
    const newPriorities = selectedFields.map(field => {
      const existing = priorities.find(p => p.field === field);
      return {
        ...existing,
        field,
        weight: Math.round((fieldWeights[field] / maxScore) * 100),
        type: existing?.type || getDefaultType(field) as 'maximize' | 'minimize'
      };
    });
    
    setPriorities(newPriorities);
    toast.success('Weights calculated using Analytic Hierarchy Process');
  };

  const resetPairwiseComparisons = () => {
    setCurrentPairIndex(0);
    setPairwiseComparisons(pairwiseComparisons.map(comp => ({ ...comp, preference: 5 })));
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent mb-2">
              Advanced Prioritization & Weights
            </h1>
            <p className="text-gray-600 font-medium text-sm lg:text-base">
              Define relative importance of criteria for resource allocation optimization
            </p>
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
              <Target className="h-3 w-3 mr-1" />
              {availableFields.length} fields
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              4 methods
            </Badge>
          </div>
        </div>

        {/* Field Selection */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5" />
              Select Priority Criteria
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Available Fields</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableFields.map((fieldInfo) => (
                  <motion.div
                    key={fieldInfo.name}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedFields.includes(fieldInfo.name)
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    onClick={() => 
                      selectedFields.includes(fieldInfo.name) 
                        ? removeField(fieldInfo.name) 
                        : addField(fieldInfo.name)
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{fieldInfo.name}</div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">{fieldInfo.description}</div>
                      </div>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <Badge variant="outline" className="text-xs">
                          {fieldInfo.category}
                        </Badge>
                        {selectedFields.includes(fieldInfo.name) && (
                          <CheckCircle2 className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedFields.length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 pb-3">
                <TabsList className="grid w-full grid-cols-4 bg-white">
                  <TabsTrigger value="sliders" className="text-sm">Sliders & Inputs</TabsTrigger>
                  <TabsTrigger value="ranking" className="text-sm">Drag & Drop</TabsTrigger>
                  <TabsTrigger value="pairwise" className="text-sm">Pairwise (AHP)</TabsTrigger>
                  <TabsTrigger value="presets" className="text-sm">Preset Profiles</TabsTrigger>
                </TabsList>
              </CardHeader>

              {/* Sliders & Numeric Inputs */}
              <TabsContent value="sliders" className="space-y-6 p-6">
                <div className="space-y-6">
                  {priorities.map((priority, index) => (
                    <motion.div
                      key={priority.field}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="space-y-4 p-4 border rounded-lg bg-gradient-to-r from-gray-50 to-blue-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Label className="font-semibold text-lg">{priority.field}</Label>
                          <Badge variant="outline" className="text-xs">
                            {priority.category}
                          </Badge>
                          <Badge variant="outline">
                            {priority.type === 'maximize' ? (
                              <ArrowUp className="h-3 w-3 mr-1" />
                            ) : (
                              <ArrowDown className="h-3 w-3 mr-1" />
                            )}
                            {priority.type}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={priority.weight}
                            onChange={(e) => updatePriorityWeight(priority.field, parseInt(e.target.value) || 0)}
                            className="w-20 text-center"
                          />
                          <Select
                            value={priority.type}
                            onValueChange={(value) => 
                              updatePriorityType(priority.field, value as 'maximize' | 'minimize')
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="maximize">
                                <div className="flex items-center gap-2">
                                  <ArrowUp className="h-4 w-4" />
                                  Maximize
                                </div>
                              </SelectItem>
                              <SelectItem value="minimize">
                                <div className="flex items-center gap-2">
                                  <ArrowDown className="h-4 w-4" />
                                  Minimize
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Weight: {priority.weight}%</span>
                          <span className="text-gray-500">
                            {priority.weight < 30 ? 'Low Priority' : 
                             priority.weight < 70 ? 'Medium Priority' : 'High Priority'}
                          </span>
                        </div>
                        <Slider
                          value={[priority.weight]}
                          onValueChange={([value]) => updatePriorityWeight(priority.field, value)}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                      </div>

                      {priority.description && (
                        <p className="text-sm text-gray-600 italic">{priority.description}</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              {/* Drag & Drop Ranking */}
              <TabsContent value="ranking" className="space-y-6 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Drag & Drop Ranking</h3>
                    <p className="text-sm text-gray-600">
                      Drag criteria to reorder by importance. Top items get higher weights.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRankedCriteria([...selectedFields]);
                      toast.success('Ranking initialized');
                    }}
                  >
                    <Shuffle className="h-4 w-4 mr-2" />
                    Initialize
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {(rankedCriteria.length > 0 ? rankedCriteria : selectedFields).map((field, index) => {
                    const priority = priorities.find(p => p.field === field);
                    return (
                      <motion.div
                        key={field}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        draggable
                        onDragStart={() => handleDragStart(field)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, field)}
                        className="flex items-center gap-4 p-4 bg-white border rounded-lg cursor-move hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-5 w-5 text-gray-400" />
                          <Badge variant="outline" className="font-bold">
                            #{index + 1}
                          </Badge>
                        </div>
                        
                        <div className="flex-1">
                          <div className="font-medium">{field}</div>
                          <div className="text-sm text-gray-500">
                            Weight: {priority?.weight || Math.round(((selectedFields.length - index) / selectedFields.length) * 100)}%
                          </div>
                        </div>
                        
                        <Badge variant={priority?.type === 'maximize' ? 'default' : 'secondary'}>
                          {priority?.type === 'maximize' ? (
                            <ArrowUp className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowDown className="h-3 w-3 mr-1" />
                          )}
                          {priority?.type || 'maximize'}
                        </Badge>
                      </motion.div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Pairwise Comparison */}
              <TabsContent value="pairwise" className="space-y-6 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Pairwise Comparison Matrix (AHP)</h3>
                    <p className="text-sm text-gray-600">
                      Compare criteria two at a time to build scientifically accurate weights
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={initializePairwiseComparisons}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Start
                  </Button>
                </div>

                {pairwiseComparisons.length > 0 ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">
                        Comparison {currentPairIndex + 1} of {pairwiseComparisons.length}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${((currentPairIndex + 1) / pairwiseComparisons.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    {currentPairIndex < pairwiseComparisons.length && (
                      <div className="text-center space-y-6">
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">Which criterion is more important?</h3>
                          <div className="flex items-center justify-center gap-4">
                            <Badge variant="outline" className="text-lg p-3">
                              {pairwiseComparisons[currentPairIndex]?.criteria1}
                            </Badge>
                            <span className="text-gray-500">vs</span>
                            <Badge variant="outline" className="text-lg p-3">
                              {pairwiseComparisons[currentPairIndex]?.criteria2}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-9 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((value) => (
                              <Button
                                key={value}
                                variant={pairwiseComparisons[currentPairIndex]?.preference === value ? "default" : "outline"}
                                onClick={() => updatePairwiseComparison(value)}
                                className="h-12"
                              >
                                {value}
                              </Button>
                            ))}
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Much more important ←</span>
                            <span>Equal</span>
                            <span>→ Much more important</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={resetPairwiseComparisons}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset
                          </Button>
                        </div>
                      </div>
                    )}

                    {currentPairIndex >= pairwiseComparisons.length && (
                      <div className="text-center space-y-4">
                        <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
                        <h3 className="text-lg font-semibold text-green-800">
                          Pairwise Comparison Complete!
                        </h3>
                        <p className="text-gray-600">
                          Weights have been calculated using the Analytic Hierarchy Process
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Scale className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Click "Start" to begin pairwise comparisons</p>
                  </div>
                )}
              </TabsContent>

              {/* Preset Profiles */}
              <TabsContent value="presets" className="space-y-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {presetProfiles.map((preset) => {
                    const IconComponent = preset.icon;
                    return (
                      <motion.div
                        key={preset.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card 
                          className={`cursor-pointer transition-all ${
                            selectedPreset === preset.id 
                              ? 'ring-2 ring-blue-500 shadow-lg' 
                              : 'hover:shadow-md'
                          }`}
                          onClick={() => applyPreset(preset.id)}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${preset.color}`}>
                                  <IconComponent className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold">{preset.name}</h3>
                                  <p className="text-sm text-gray-600 mt-1">{preset.description}</p>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-gray-500">KEY WEIGHTS:</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  {Object.entries(preset.weights)
                                    .filter(([, config]) => config !== undefined)
                                    .slice(0, 4)
                                    .map(([field, config]) => (
                                      <div key={field} className="flex items-center justify-between text-xs">
                                        <span className="truncate">{field}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {config!.weight}%
                                        </Badge>
                                      </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </TabsContent>
            </Card>
          </Tabs>
        )}

        {/* Priority Summary */}
        {priorities.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" />
                Priority Summary & Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Weight Distribution</h4>
                  <div className="space-y-3">
                    {priorities.sort((a, b) => b.weight - a.weight).map((priority) => (
                      <div key={priority.field} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{priority.field}</span>
                            <Badge variant="outline" className="text-xs">
                              {priority.type === 'maximize' ? '↑' : '↓'}
                            </Badge>
                          </div>
                          <span className="text-sm font-bold">{priority.weight}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              priority.type === 'maximize' ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${priority.weight}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">JSON Configuration</h4>
                  <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto border max-h-80">
                    {JSON.stringify({
                      prioritization: {
                        method: activeTab,
                        criteria: priorities.map(p => ({
                          field: p.field,
                          weight: p.weight,
                          type: p.type,
                          category: p.category
                        })),
                        metadata: {
                          totalCriteria: priorities.length,
                          appliedPreset: selectedPreset || null,
                          createdAt: new Date().toISOString()
                        }
                      }
                    }, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button 
            onClick={() => setCurrentStep(4)}
            disabled={priorities.length === 0}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 text-lg shadow-lg hover:shadow-xl"
          >
            Continue to Export
            <Sparkles className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function categorizeField(field: string): string {
  const lower = field.toLowerCase();
  
  if (lower.includes('priority') || lower.includes('level')) return 'fulfillment';
  if (lower.includes('group') || lower.includes('worker') || lower.includes('load')) return 'fairness';
  if (lower.includes('duration') || lower.includes('concurrent') || lower.includes('max')) return 'workload';
  if (lower.includes('skill') || lower.includes('qualification')) return 'quality';
  
  return 'general';
}

function getFieldDescription(field: string): string {
  const descriptions: Record<string, string> = {
    'PriorityLevel': 'Client priority ranking (1-5)',
    'RequestedTaskIDs': 'Number of tasks requested by client',
    'Duration': 'Time required to complete task',
    'MaxConcurrent': 'Maximum parallel execution capacity',
    'RequiredSkills': 'Skills needed for task completion',
    'AvailableSlots': 'Worker availability across phases',
    'MaxLoadPerPhase': 'Maximum tasks per worker per phase',
    'WorkerGroup': 'Worker team or department assignment',
    'QualificationLevel': 'Worker skill/experience level',
    'GroupTag': 'Client categorization or segment'
  };
  
  return descriptions[field] || `Configuration parameter: ${field}`;
}

function getDefaultType(field: string): string {
  const lower = field.toLowerCase();
  
  // Fields that should typically be minimized
  if (lower.includes('duration') || lower.includes('load') || lower.includes('concurrent')) {
    return 'minimize';
  }
  
  // Most fields should be maximized by default
  return 'maximize';
}