'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDataStore } from '@/store/dataStore';
import { 
  Plus, 
  Settings, 
  Trash2, 
  TestTube,
  MessageSquare,
  Code2,
  Wand2,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Download,
  Upload,
  Lightbulb,
  Link,
  Clock,
  Shield,
  Target,
  Search,
  Sparkles,
  FileText,
  Users,
  Briefcase,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface BusinessRule {
  id: string;
  name: string;
  type: 'coRun' | 'phaseWindow' | 'loadLimit' | 'slotRestriction' | 'patternMatch' | 'precedence' | 'aiGenerated';
  description: string;
  condition: string;
  action: string;
  enabled: boolean;
  priority: number;
  sourceFiles: string[];
  targetColumns: string[];
  parameters: Record<string, any>;
  createdAt: Date;
  lastModified: Date;
}

const RULE_TYPES = [
  {
    type: 'coRun',
    label: 'Co-Run Tasks',
    icon: Link,
    description: 'Tasks that should always run together',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    examples: ['T1 and T2 must run together', 'Group tasks by client priority']
  },
  {
    type: 'phaseWindow',
    label: 'Phase Window',
    icon: Clock,
    description: 'Limit which phases a task is allowed to run in',
    color: 'bg-green-100 text-green-800 border-green-300',
    examples: ['Task T5 can only run in phases 1-3', 'High priority tasks in early phases']
  },
  {
    type: 'loadLimit',
    label: 'Load Limit',
    icon: Shield,
    description: 'Restrict how many tasks a worker/group can do per phase',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    examples: ['Max 2 tasks per worker per phase', 'GroupA workers limited to 3 tasks']
  },
  {
    type: 'slotRestriction',
    label: 'Slot Restriction',
    icon: Target,
    description: 'Ensure clients or workers have overlapping phase slots',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    examples: ['Client and worker must share available phases', 'Overlap requirement for collaboration']
  },
  {
    type: 'patternMatch',
    label: 'Pattern Match',
    icon: Search,
    description: 'Define rules based on regex matches',
    color: 'bg-pink-100 text-pink-800 border-pink-300',
    examples: ['Tasks containing "QA" need testing skills', 'Priority clients get premium workers']
  },
  {
    type: 'precedence',
    label: 'Precedence Rule',
    icon: Target,
    description: 'Specify task or client execution priority',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    examples: ['High priority clients first', 'Dependencies must complete before dependents']
  },
  {
    type: 'aiGenerated',
    label: 'AI Generated',
    icon: Sparkles,
    description: 'Rules created from natural language input',
    color: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-300',
    examples: ['Natural language to structured rules', 'AI-suggested optimizations']
  }
];

export default function RuleBuilder() {
  const { rules, addRule, updateRule, removeRule, setCurrentStep, files } = useDataStore();
  const [activeTab, setActiveTab] = useState('builder');
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [selectedRuleType, setSelectedRuleType] = useState<string>('');
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [isProcessingNL, setIsProcessingNL] = useState(false);
  const [newRule, setNewRule] = useState<Partial<BusinessRule>>({
    name: '',
    description: '',
    condition: '',
    action: '',
    type: 'coRun',
    enabled: true,
    priority: 1,
    sourceFiles: [],
    targetColumns: [],
    parameters: {}
  });
  const [testResults, setTestResults] = useState<any>(null);
  const [aiSuggestions, setAiSuggestions] = useState<BusinessRule[]>([]);

  // Get available fields dynamically from uploaded files
  const availableFields = useMemo(() => {
    return Array.from(new Set(files.flatMap(file => file.headers)));
  }, [files]);

  // Get available values for specific fields
  const getFieldValues = useMemo(() => {
    return (fieldName: string) => {
      const values = new Set<string>();
      files.forEach(file => {
        if (file.headers.includes(fieldName)) {
          file.data.forEach(row => {
            const value = row[fieldName];
            if (value && value !== '') {
              values.add(String(value));
            }
          });
        }
      });
      return Array.from(values).slice(0, 10); // Limit to 10 examples
    };
  }, [files]);

  const handleAddRule = () => {
    if (!newRule.name || !newRule.condition || !newRule.action) {
      toast.error('Please fill in all required fields');
      return;
    }

    const rule: BusinessRule = {
      id: Math.random().toString(36).substr(2, 9),
      name: newRule.name!,
      type: newRule.type as any,
      description: newRule.description || '',
      condition: newRule.condition!,
      action: newRule.action!,
      enabled: newRule.enabled ?? true,
      priority: newRule.priority ?? 1,
      sourceFiles: newRule.sourceFiles || [],
      targetColumns: newRule.targetColumns || [],
      parameters: newRule.parameters || {},
      createdAt: new Date(),
      lastModified: new Date()
    };

    addRule(rule);
    setNewRule({
      name: '',
      description: '',
      condition: '',
      action: '',
      type: 'coRun',
      enabled: true,
      priority: 1,
      sourceFiles: [],
      targetColumns: [],
      parameters: {}
    });
    setShowRuleForm(false);
    toast.success('Rule added successfully');
  };

  const handleNaturalLanguageConversion = async () => {
    if (!naturalLanguageInput.trim()) {
      toast.error('Please enter a rule description');
      return;
    }

    setIsProcessingNL(true);
    
    try {
      // Simulate AI processing with more sophisticated rule generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const aiRule = await convertNaturalLanguageToRule(naturalLanguageInput, files, availableFields);
      
      setNewRule(aiRule);
      setNaturalLanguageInput('');
      setSelectedRuleType(aiRule.type || 'aiGenerated');
      setShowRuleForm(true);
      
      toast.success('Rule generated from natural language');
    } catch (error) {
      toast.error('Failed to process natural language input');
    } finally {
      setIsProcessingNL(false);
    }
  };

  const generateAISuggestions = async () => {
    if (files.length === 0) {
      toast.error('Upload files first to get AI suggestions');
      return;
    }

    try {
      const suggestions = await analyzeDataAndSuggestRules(files, availableFields);
      setAiSuggestions(suggestions);
      toast.success(`Generated ${suggestions.length} AI rule suggestions`);
    } catch (error) {
      toast.error('Failed to generate AI suggestions');
    }
  };

  const testRule = async (rule: BusinessRule) => {
    try {
      const results = await testRuleAgainstData(rule, files);
      setTestResults({ ruleId: rule.id, ...results });
      toast.success(`Rule test completed - ${results.matchCount} matches found`);
    } catch (error) {
      toast.error('Rule test failed');
    }
  };

  const exportRules = () => {
    const rulesJson = {
      rules: rules.map(rule => ({
        type: rule.type,
        name: rule.name,
        description: rule.description,
        condition: rule.condition,
        action: rule.action,
        enabled: rule.enabled,
        priority: rule.priority,
        parameters: rule.parameters,
        sourceFiles: rule.sourceFiles,
        targetColumns: rule.targetColumns
      })),
      metadata: {
        exportedAt: new Date().toISOString(),
        totalRules: rules.length,
        enabledRules: rules.filter(r => r.enabled).length,
        version: '1.0.0'
      }
    };

    const blob = new Blob([JSON.stringify(rulesJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-rules-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Rules exported successfully');
  };

  const getRuleTypeInfo = (type: string) => {
    return RULE_TYPES.find(rt => rt.type === type) || RULE_TYPES[0];
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.toLowerCase().includes('client')) return Users;
    if (fileName.toLowerCase().includes('worker')) return Briefcase;
    if (fileName.toLowerCase().includes('task')) return Settings;
    return FileText;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent mb-2">
              Advanced Business Rules Engine
            </h1>
            <p className="text-gray-600 font-medium text-sm lg:text-base">
              Create sophisticated validation, transformation, and constraint rules with AI assistance
            </p>
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
              <Settings className="h-3 w-3 mr-1" />
              {rules.length} rules
            </Badge>
            <Button onClick={generateAISuggestions} variant="outline" size="sm">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Suggestions
            </Button>
            <Button onClick={exportRules} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Rules
            </Button>
            <Button onClick={() => setShowRuleForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 pb-3">
              <TabsList className="grid w-full grid-cols-4 bg-white">
                <TabsTrigger value="builder">Rule Builder</TabsTrigger>
                <TabsTrigger value="natural">Natural Language</TabsTrigger>
                <TabsTrigger value="active">Active Rules ({rules.length})</TabsTrigger>
                <TabsTrigger value="preview">JSON Preview</TabsTrigger>
              </TabsList>
            </CardHeader>

            {/* Rule Builder Tab */}
            <TabsContent value="builder" className="space-y-6 p-6">
              {/* Rule Type Selection */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 pb-3">
                  <CardTitle className="text-lg">Select Rule Type</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {RULE_TYPES.map((ruleType) => {
                      const IconComponent = ruleType.icon;
                      return (
                        <motion.div
                          key={ruleType.type}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card 
                            className={`cursor-pointer transition-all ${
                              selectedRuleType === ruleType.type 
                                ? 'ring-2 ring-blue-500 shadow-lg' 
                                : 'hover:shadow-md'
                            }`}
                            onClick={() => {
                              setSelectedRuleType(ruleType.type);
                              setNewRule({ ...newRule, type: ruleType.type as any });
                              setShowRuleForm(true);
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${ruleType.color}`}>
                                  <IconComponent className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-sm">{ruleType.label}</h3>
                                  <p className="text-xs text-gray-600 mt-1">{ruleType.description}</p>
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-500 font-medium">Examples:</p>
                                    <ul className="text-xs text-gray-500 mt-1 space-y-1">
                                      {ruleType.examples.slice(0, 2).map((example, idx) => (
                                        <li key={idx}>• {example}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Rule Form */}
              <AnimatePresence>
                {showRuleForm && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card>
                      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          {selectedRuleType && (
                            <>
                              {(() => {
                                const IconComponent = getRuleTypeInfo(selectedRuleType).icon;
                                return <IconComponent className="h-5 w-5" />;
                              })()}
                              Create {getRuleTypeInfo(selectedRuleType).label} Rule
                            </>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="rule-name">Rule Name *</Label>
                            <Input
                              id="rule-name"
                              placeholder="e.g., High Priority Co-Run Tasks"
                              value={newRule.name || ''}
                              onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="rule-priority">Priority Level</Label>
                            <Select 
                              value={String(newRule.priority || 1)} 
                              onValueChange={(value) => setNewRule({ ...newRule, priority: parseInt(value) })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 - Highest</SelectItem>
                                <SelectItem value="2">2 - High</SelectItem>
                                <SelectItem value="3">3 - Medium</SelectItem>
                                <SelectItem value="4">4 - Low</SelectItem>
                                <SelectItem value="5">5 - Lowest</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="rule-description">Description</Label>
                          <Textarea
                            id="rule-description"
                            placeholder="Describe what this rule does and when it should be applied..."
                            value={newRule.description || ''}
                            onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                            className="min-h-[80px]"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="rule-condition">Condition Logic *</Label>
                            <Textarea
                              id="rule-condition"
                              placeholder={`e.g., ${availableFields.includes('PriorityLevel') ? 'PriorityLevel >= 4' : 'field >= value'} && ${availableFields.includes('Category') ? 'Category === "critical"' : 'field === "value"'}`}
                              value={newRule.condition || ''}
                              onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
                              className="font-mono text-sm min-h-[100px]"
                            />
                            {availableFields.length > 0 && (
                              <div className="text-xs text-gray-500">
                                Available fields: {availableFields.slice(0, 5).join(', ')}
                                {availableFields.length > 5 && '...'}
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="rule-action">Action *</Label>
                            <Textarea
                              id="rule-action"
                              placeholder="e.g., group_tasks_together, assign_to_phase_1, require_skill_overlap"
                              value={newRule.action || ''}
                              onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
                              className="min-h-[100px]"
                            />
                          </div>
                        </div>

                        {/* Source Files Selection */}
                        <div className="space-y-2">
                          <Label>Source Files</Label>
                          <div className="flex flex-wrap gap-2">
                            {files.map((file) => {
                              const IconComponent = getFileIcon(file.name);
                              return (
                                <Badge
                                  key={file.id}
                                  variant={newRule.sourceFiles?.includes(file.name) ? "default" : "outline"}
                                  className="cursor-pointer"
                                  onClick={() => {
                                    const currentFiles = newRule.sourceFiles || [];
                                    const updatedFiles = currentFiles.includes(file.name)
                                      ? currentFiles.filter(f => f !== file.name)
                                      : [...currentFiles, file.name];
                                    setNewRule({ ...newRule, sourceFiles: updatedFiles });
                                  }}
                                >
                                  <IconComponent className="h-3 w-3 mr-1" />
                                  <span>{file.name}</span>
                                  {newRule.sourceFiles?.includes(file.name) && ' ✓'}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="rule-enabled"
                              checked={newRule.enabled ?? true}
                              onCheckedChange={(enabled) => setNewRule({ ...newRule, enabled })}
                            />
                            <Label htmlFor="rule-enabled">Enable Rule</Label>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t">
                          <Button onClick={handleAddRule} className="flex-1">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Rule
                          </Button>
                          <Button variant="outline" onClick={() => setShowRuleForm(false)}>
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            {/* Natural Language Tab */}
            <TabsContent value="natural" className="space-y-6 p-6">
              <Card>
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                    Natural Language Rule Builder
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-2">
                    <Label>Describe your rule in plain English</Label>
                    <Textarea
                      placeholder={`e.g., 'Tasks ${availableFields.includes('TaskID') ? 'T1 and T2' : 'with high priority'} must always run together in the same phase' or 'No more than 2 high priority tasks per worker per phase' or 'Workers in ${availableFields.includes('WorkerGroup') ? 'GroupA' : 'specific groups'} should only handle tasks requiring ${availableFields.includes('RequiredSkills') ? 'JavaScript skills' : 'specific skills'}'`}
                      value={naturalLanguageInput}
                      onChange={(e) => setNaturalLanguageInput(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Example Queries:</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        `Tasks ${availableFields.includes('TaskID') ? 'T3 and T5' : 'with similar priority'} must run in the same phase`,
                        'No more than 2 tasks for any worker per phase',
                        `Workers in ${availableFields.includes('WorkerGroup') ? 'GroupB' : 'specific groups'} should only do tasks with skill "ml"`,
                        `High priority ${availableFields.includes('ClientID') ? 'clients' : 'items'} get assigned first`,
                        `Tasks requiring ${availableFields.includes('RequiredSkills') ? '"testing" skills' : 'specific skills'} need phase overlap`,
                        'Maximum 3 concurrent tasks for any single worker'
                      ].map((example, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => setNaturalLanguageInput(example)}
                          className="text-left h-auto p-3 text-xs"
                        >
                          <Lightbulb className="h-3 w-3 mr-2 flex-shrink-0" />
                          <span>{example}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={handleNaturalLanguageConversion}
                    disabled={isProcessingNL || !naturalLanguageInput.trim()}
                    className="w-full"
                  >
                    {isProcessingNL ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                        Processing with AI...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Convert to Structured Rule
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* AI Suggestions */}
              {aiSuggestions.length > 0 && (
                <Card>
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      AI Rule Suggestions
                      <Badge variant="outline">{aiSuggestions.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ScrollArea className="h-80">
                      <div className="space-y-3">
                        {aiSuggestions.map((suggestion, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 border rounded-lg bg-purple-50 border-purple-200"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-purple-800">{suggestion.name}</h4>
                                <p className="text-sm text-purple-600 mt-1">{suggestion.description}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {getRuleTypeInfo(suggestion.type).label}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    Priority {suggestion.priority}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setNewRule(suggestion);
                                  setSelectedRuleType(suggestion.type);
                                  setShowRuleForm(true);
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Use
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Active Rules Tab */}
            <TabsContent value="active" className="space-y-6 p-6">
              <Card>
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 pb-3">
                  <CardTitle className="text-lg">Active Business Rules ({rules.filter(r => r.enabled).length}/{rules.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {rules.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Settings className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium mb-2">No Rules Defined</h3>
                      <p className="text-sm mb-4">Create your first business rule to get started</p>
                      <Button onClick={() => setActiveTab('builder')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Rule
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {rules.map((rule, index) => {
                        const ruleTypeInfo = getRuleTypeInfo(rule.type);
                        const IconComponent = ruleTypeInfo.icon;
                        
                        return (
                          <motion.div
                            key={rule.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`border rounded-lg p-4 ${rule.enabled ? 'bg-white' : 'bg-gray-50 opacity-75'}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <IconComponent className="h-5 w-5 text-gray-600" />
                                  <h3 className="font-semibold text-lg">{rule.name}</h3>
                                  <Badge variant="outline" className={ruleTypeInfo.color}>
                                    {ruleTypeInfo.label}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    Priority {rule.priority}
                                  </Badge>
                                  <Switch
                                    checked={rule.enabled}
                                    onCheckedChange={(enabled) => updateRule(rule.id, { enabled })}
                                  />
                                </div>
                                
                                {rule.description && (
                                  <p className="text-gray-600 mb-3">{rule.description}</p>
                                )}
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                  <div>
                                    <Label className="text-xs text-gray-500 font-medium">CONDITION</Label>
                                    <pre className="text-sm bg-gray-50 p-3 rounded font-mono overflow-x-auto border mt-1">
                                      {rule.condition}
                                    </pre>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-gray-500 font-medium">ACTION</Label>
                                    <div className="text-sm bg-gray-50 p-3 rounded border mt-1">
                                      {rule.action}
                                    </div>
                                  </div>
                                </div>
                                
                                {rule.sourceFiles && rule.sourceFiles.length > 0 && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <Label className="text-xs text-gray-500 font-medium">SOURCE FILES:</Label>
                                    <div className="flex gap-1">
                                      {rule.sourceFiles.map((fileName, idx) => {
                                        const IconComponent = getFileIcon(fileName);
                                        return (
                                          <Badge key={idx} variant="outline" className="text-xs">
                                            <IconComponent className="h-3 w-3 mr-1" />
                                            <span>{fileName}</span>
                                          </Badge>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                
                                <div className="text-xs text-gray-500">
                                  Created: {rule.createdAt.toLocaleDateString()} • 
                                  Modified: {rule.lastModified.toLocaleDateString()}
                                </div>
                              </div>
                              
                              <div className="flex gap-2 ml-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => testRule(rule)}
                                  title="Test Rule"
                                >
                                  <TestTube className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    navigator.clipboard.writeText(JSON.stringify(rule, null, 2));
                                    toast.success('Rule copied to clipboard');
                                  }}
                                  title="Copy Rule"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeRule(rule.id)}
                                  title="Delete Rule"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Test Results */}
                            {testResults && testResults.ruleId === rule.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <TestTube className="h-4 w-4 text-blue-600" />
                                  <span className="font-medium text-blue-800">Test Results</span>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="text-blue-600 font-medium">Matches:</span>
                                    <span className="ml-2">{testResults.matchCount}</span>
                                  </div>
                                  <div>
                                    <span className="text-blue-600 font-medium">Affected Rows:</span>
                                    <span className="ml-2">{testResults.affectedRows}</span>
                                  </div>
                                  <div>
                                    <span className="text-blue-600 font-medium">Status:</span>
                                    <Badge variant={testResults.status === 'passed' ? 'default' : 'destructive'} className="ml-2 text-xs">
                                      {testResults.status}
                                    </Badge>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* JSON Preview Tab */}
            <TabsContent value="preview" className="space-y-6 p-6">
              <Card>
                <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Code2 className="h-5 w-5" />
                    Rules JSON Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        {rules.length} rules • {rules.filter(r => r.enabled).length} enabled
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const json = JSON.stringify({ rules }, null, 2);
                            navigator.clipboard.writeText(json);
                            toast.success('JSON copied to clipboard');
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy JSON
                        </Button>
                        <Button size="sm" onClick={exportRules}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                    
                    <ScrollArea className="h-96 w-full">
                      <pre className="text-sm bg-gray-50 p-4 rounded-lg overflow-x-auto border">
                        {JSON.stringify({
                          rules: rules.map(rule => ({
                            type: rule.type,
                            name: rule.name,
                            description: rule.description,
                            condition: rule.condition,
                            action: rule.action,
                            enabled: rule.enabled,
                            priority: rule.priority,
                            parameters: rule.parameters,
                            sourceFiles: rule.sourceFiles,
                            targetColumns: rule.targetColumns
                          })),
                          metadata: {
                            totalRules: rules.length,
                            enabledRules: rules.filter(r => r.enabled).length,
                            createdAt: new Date().toISOString(),
                            version: '1.0.0'
                          }
                        }, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Card>
        </Tabs>

        <div className="flex justify-end">
          <Button 
            onClick={() => setCurrentStep(3)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 text-lg shadow-lg hover:shadow-xl"
          >
            Continue to Priorities
            <Sparkles className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Helper functions for AI processing
async function convertNaturalLanguageToRule(input: string, files: any[], availableFields: string[]): Promise<Partial<BusinessRule>> {
  const lowerInput = input.toLowerCase();
  
  // Analyze the input to determine rule type and parameters
  let ruleType: BusinessRule['type'] = 'aiGenerated';
  let condition = '';
  let action = '';
  let name = '';
  let description = input;
  
  // Co-run detection
  if (lowerInput.includes('together') || lowerInput.includes('same phase') || lowerInput.includes('co-run')) {
    ruleType = 'coRun';
    name = 'Co-run Tasks Rule';
    
    // Extract task IDs
    const taskMatches = input.match(/T\d+/gi);
    if (taskMatches && taskMatches.length >= 2) {
      condition = `task.id IN [${taskMatches.map(t => `"${t}"`).join(', ')}]`;
      action = `group_tasks_together([${taskMatches.map(t => `"${t}"`).join(', ')}])`;
    } else {
      // Use available fields
      const taskField = availableFields.find(f => f.toLowerCase().includes('task'));
      condition = taskField ? `${taskField} IN [task1, task2]` : 'task.id IN [task1, task2]';
      action = 'group_tasks_together([task1, task2])';
    }
  }
  
  // Load limit detection
  else if (lowerInput.includes('no more than') || lowerInput.includes('maximum') || lowerInput.includes('limit')) {
    ruleType = 'loadLimit';
    name = 'Load Limit Rule';
    
    const numberMatch = input.match(/(\d+)/);
    const number = numberMatch ? numberMatch[1] : '2';
    
    if (lowerInput.includes('worker')) {
      const workerField = availableFields.find(f => f.toLowerCase().includes('worker')) || 'worker';
      condition = `${workerField}.tasksPerPhase <= ${number}`;
      action = `limit_worker_load(${number})`;
    }
  }
  
  // Phase window detection
  else if (lowerInput.includes('phase') && (lowerInput.includes('only') || lowerInput.includes('must'))) {
    ruleType = 'phaseWindow';
    name = 'Phase Window Rule';
    
    const phaseMatch = input.match(/phase[s]?\s*(\d+(?:\s*-\s*\d+)?)/i);
    if (phaseMatch) {
      const phaseField = availableFields.find(f => f.toLowerCase().includes('phase')) || 'preferredPhases';
      condition = `${phaseField} INTERSECTS [${phaseMatch[1]}]`;
      action = `restrict_to_phases([${phaseMatch[1]}])`;
    }
  }
  
  // Skill-based detection
  else if (lowerInput.includes('skill')) {
    ruleType = 'slotRestriction';
    name = 'Skill-based Rule';
    
    const skillMatch = input.match(/"([^"]+)"/);
    const skill = skillMatch ? skillMatch[1] : 'required_skill';
    
    const skillField = availableFields.find(f => f.toLowerCase().includes('skill')) || 'requiredSkills';
    condition = `${skillField} CONTAINS "${skill}"`;
    action = `ensure_skill_availability("${skill}")`;
  }
  
  // Priority detection
  else if (lowerInput.includes('priority') || lowerInput.includes('first')) {
    ruleType = 'precedence';
    name = 'Priority Rule';
    
    if (lowerInput.includes('high priority')) {
      const priorityField = availableFields.find(f => f.toLowerCase().includes('priority')) || 'priorityLevel';
      condition = `${priorityField} >= 4`;
      action = 'assign_high_priority()';
    }
  }
  
  return {
    name,
    type: ruleType,
    description,
    condition,
    action,
    enabled: true,
    priority: 1,
    sourceFiles: files.map(f => f.name),
    targetColumns: [],
    parameters: {}
  };
}

async function analyzeDataAndSuggestRules(files: any[], availableFields: string[]): Promise<BusinessRule[]> {
  const suggestions: BusinessRule[] = [];
  
  // Analyze data patterns and suggest rules
  files.forEach(file => {
    // Suggest co-run rules based on data patterns
    if (file.name.toLowerCase().includes('client')) {
      const priorityField = availableFields.find(f => f.toLowerCase().includes('priority')) || 'PriorityLevel';
      suggestions.push({
        id: 'suggestion-1',
        name: 'High Priority Client First',
        type: 'precedence',
        description: 'Ensure high priority clients are processed first',
        condition: `${priorityField} >= 4`,
        action: 'assign_high_priority_queue()',
        enabled: true,
        priority: 1,
        sourceFiles: [file.name],
        targetColumns: [priorityField],
        parameters: { threshold: 4 },
        createdAt: new Date(),
        lastModified: new Date()
      });
    }
    
    if (file.name.toLowerCase().includes('worker')) {
      const loadField = availableFields.find(f => f.toLowerCase().includes('load')) || 'MaxLoadPerPhase';
      suggestions.push({
        id: 'suggestion-2',
        name: 'Worker Load Balancing',
        type: 'loadLimit',
        description: 'Prevent worker overload by limiting tasks per phase',
        condition: `${loadField} <= 3`,
        action: 'limit_worker_tasks(3)',
        enabled: true,
        priority: 2,
        sourceFiles: [file.name],
        targetColumns: [loadField],
        parameters: { maxTasks: 3 },
        createdAt: new Date(),
        lastModified: new Date()
      });
    }
    
    if (file.name.toLowerCase().includes('task')) {
      const skillField = availableFields.find(f => f.toLowerCase().includes('skill')) || 'RequiredSkills';
      suggestions.push({
        id: 'suggestion-3',
        name: 'Skill Coverage Validation',
        type: 'slotRestriction',
        description: 'Ensure required skills are available before task assignment',
        condition: `${skillField} SUBSET_OF available_worker_skills`,
        action: 'validate_skill_coverage()',
        enabled: true,
        priority: 1,
        sourceFiles: [file.name],
        targetColumns: [skillField],
        parameters: {},
        createdAt: new Date(),
        lastModified: new Date()
      });
    }
  });
  
  return suggestions;
}

async function testRuleAgainstData(rule: BusinessRule, files: any[]): Promise<any> {
  // Mock rule testing - in a real implementation, this would execute the rule logic
  const matchCount = Math.floor(Math.random() * 20) + 1;
  const affectedRows = Math.floor(Math.random() * 50) + matchCount;
  
  return {
    matchCount,
    affectedRows,
    status: matchCount > 0 ? 'passed' : 'no_matches',
    executionTime: Math.random() * 100 + 50,
    details: `Rule "${rule.name}" matched ${matchCount} records`
  };
}