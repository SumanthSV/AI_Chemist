'use client';

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDataStore } from '@/store/dataStore';
import { parseFile } from '@/utils/fileParser';
import { parseFileWithAI, suggestHeaderCorrections } from '@/utils/aiDataParser';
import { 
  Upload, 
  FileText, 
  Download,
  Sparkles,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Wand2,
  ArrowRight,
  Database,
  Users,
  Briefcase,
  Settings,
  TrendingUp,
  CloudUpload,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface AIParsingResult {
  fileId: string;
  entityType: string;
  confidence: number;
  mappedHeaders: { [key: string]: string };
  suggestions: string[];
  originalHeaders: string[];
  showAllMappings: boolean;
  showAllInsights: boolean;
}

export default function FileUploader() {
  const { addFile, files, setCurrentStep, removeFile } = useDataStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [aiResults, setAiResults] = useState<AIParsingResult[]>([]);
  const [showAIResults, setShowAIResults] = useState(false);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);
    
    if (uploadedFiles.length === 0) return;
    
    setIsProcessing(true);
    setProcessingProgress(0);
    setShowAIResults(true);
    
    const newAiResults: AIParsingResult[] = [];
    
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      
      try {
        // Update progress
        setProcessingProgress(((i + 0.5) / uploadedFiles.length) * 100);
        
        // Parse file normally first
        const parsedData = await parseFile(file);
        
        // Apply AI parsing
        const aiResult = await parseFileWithAI(file, parsedData.data, parsedData.headers);
        
        const dataFile = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          data: aiResult.data,
          headers: aiResult.headers,
          errors: [],
          processed: true,
          uploadedAt: new Date(),
          aiProcessed: true,
          entityType: aiResult.entityType,
          confidence: aiResult.confidence
        };
        
        addFile(dataFile);
        
        // Store AI results for display
        newAiResults.push({
          fileId: dataFile.id,
          entityType: aiResult.entityType,
          confidence: aiResult.confidence,
          mappedHeaders: aiResult.mappedHeaders,
          suggestions: aiResult.suggestions,
          originalHeaders: parsedData.headers,
          showAllMappings: false,
          showAllInsights: false
        });
        
        toast.success(`AI processed ${file.name} as ${aiResult.entityType.toUpperCase()} data (${Math.round(aiResult.confidence * 100)}% confidence)`);
      } catch (error) {
        toast.error(`Failed to process ${file.name}: ${error}`);
      }
      
      // Update progress
      setProcessingProgress(((i + 1) / uploadedFiles.length) * 100);
    }
    
    setAiResults(prev => [...prev, ...newAiResults]);
    setIsProcessing(false);
    
    // Reset file input
    event.target.value = '';
  }, [addFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    if (droppedFiles.length === 0) return;
    
    setIsProcessing(true);
    setProcessingProgress(0);
    setShowAIResults(true);
    
    const newAiResults: AIParsingResult[] = [];
    
    for (let i = 0; i < droppedFiles.length; i++) {
      const file = droppedFiles[i];
      
      try {
        setProcessingProgress(((i + 0.5) / droppedFiles.length) * 100);
        
        const parsedData = await parseFile(file);
        const aiResult = await parseFileWithAI(file, parsedData.data, parsedData.headers);
        
        const dataFile = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          data: aiResult.data,
          headers: aiResult.headers,
          errors: [],
          processed: true,
          uploadedAt: new Date(),
          aiProcessed: true,
          entityType: aiResult.entityType,
          confidence: aiResult.confidence
        };
        
        addFile(dataFile);
        
        newAiResults.push({
          fileId: dataFile.id,
          entityType: aiResult.entityType,
          confidence: aiResult.confidence,
          mappedHeaders: aiResult.mappedHeaders,
          suggestions: aiResult.suggestions,
          originalHeaders: parsedData.headers,
          showAllMappings: false,
          showAllInsights: false
        });
        
        toast.success(`AI processed ${file.name} as ${aiResult.entityType.toUpperCase()} data`);
      } catch (error) {
        toast.error(`Failed to process ${file.name}: ${error}`);
      }
      
      setProcessingProgress(((i + 1) / droppedFiles.length) * 100);
    }
    
    setAiResults(prev => [...prev, ...newAiResults]);
    setIsProcessing(false);
  }, [addFile]);

  const handleDeleteFile = useCallback((fileId: string, fileName: string) => {
    removeFile(fileId);
    setAiResults(prev => prev.filter(result => result.fileId !== fileId));
    toast.success(`Deleted ${fileName}`);
  }, [removeFile]);

  const toggleMappingsView = useCallback((fileId: string) => {
    setAiResults(prev => prev.map(result => 
      result.fileId === fileId 
        ? { ...result, showAllMappings: !result.showAllMappings }
        : result
    ));
  }, []);

  const toggleInsightsView = useCallback((fileId: string) => {
    setAiResults(prev => prev.map(result => 
      result.fileId === fileId 
        ? { ...result, showAllInsights: !result.showAllInsights }
        : result
    ));
  }, []);

  const downloadSampleFiles = () => {
    // Create sample CSV data for all three entities
    const samples = {
      'sample_clients.csv': [
        ['ClientID', 'ClientName', 'PriorityLevel', 'RequestedTaskIDs', 'GroupTag', 'AttributesJSON'],
        ['C1', 'Acme Corp', '3', 'T1,T2,T3', 'GroupA', '{"location":"New York","budget":100000}'],
        ['C2', 'Globex Inc', '1', 'T4,T5', 'GroupB', '{"location":"London","budget":75000}'],
        ['C3', 'Initech', '4', 'T6,T7,T8', 'GroupA', '{"location":"Tokyo","budget":120000}']
      ],
      'sample_workers.csv': [
        ['WorkerID', 'WorkerName', 'Skills', 'AvailableSlots', 'MaxLoadPerPhase', 'WorkerGroup', 'QualificationLevel'],
        ['W1', 'John Doe', 'coding,testing', '[1,2,3]', '2', 'GroupA', '4'],
        ['W2', 'Jane Smith', 'design,ui/ux', '[2,4,5]', '1', 'GroupB', '5'],
        ['W3', 'Bob Johnson', 'analysis,reporting', '[1,4]', '3', 'GroupC', '3']
      ],
      'sample_tasks.csv': [
        ['TaskID', 'TaskName', 'Category', 'Duration', 'RequiredSkills', 'PreferredPhases', 'MaxConcurrent'],
        ['T1', 'Data Analysis', 'Analytics', '2', 'analysis,coding', '1-2', '3'],
        ['T2', 'UI Design', 'Design', '1', 'design,ui/ux', '[2,3,4]', '2'],
        ['T3', 'Testing', 'QA', '3', 'testing,coding', '3-5', '1']
      ]
    };
    
    Object.entries(samples).forEach(([filename, data]) => {
      const csvContent = data.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    });
    
    toast.success('Sample files downloaded!');
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'client': return <Users className="h-4 w-4" />;
      case 'worker': return <Briefcase className="h-4 w-4" />;
      case 'task': return <Settings className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getEntityColor = (entityType: string) => {
    switch (entityType) {
      case 'client': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'worker': return 'bg-green-100 text-green-800 border-green-300';
      case 'task': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 bg-pattern-dots">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent mb-2">
              AI-Powered Data Ingestion
            </h1>
            <p className="text-gray-600 font-medium text-sm lg:text-base">
              Upload CSV or XLSX files for Clients, Workers, and Tasks. Our AI will automatically detect and map your data structure.
            </p>
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            <Badge variant="outline" className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200 text-xs shadow-sm">
              <Brain className="h-3 w-3 mr-1" />
              AI Enhanced
            </Badge>
            <Button onClick={downloadSampleFiles} variant="outline" size="sm" className="hover-lift">
              <Download className="h-4 w-4 mr-2" />
              Download Samples
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Area - Simplified and Clean */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="h-80 shadow-lg border-2 border-dashed border-gray-200 hover:border-blue-400 transition-all duration-300">
              <CardContent className="p-6 h-full">
                <div
                  className="h-full flex flex-col items-center justify-center text-center cursor-pointer group"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  {isProcessing ? (
                    <div className="space-y-4 w-full">
                      <div className="flex items-center justify-center">
                        <div className="relative">
                          <CloudUpload className="h-16 w-16 text-blue-500 animate-bounce" />
                          <div className="absolute inset-0 bg-blue-500 opacity-20 rounded-full animate-ping"></div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-blue-700 font-semibold text-lg">AI Processing Files...</p>
                        <Progress value={Math.max(0, Math.min(100, processingProgress || 0))} className="h-2" />
                        <p className="text-sm text-blue-600">{Math.round(processingProgress)}% complete</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-6 group-hover:scale-110 transition-transform duration-300">
                        <CloudUpload className="h-20 w-20 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2 group-hover:text-blue-600 transition-colors">
                        Upload Your Data Files
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Drag and drop files here or click to browse
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>Supports CSV and XLSX files</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Brain className="h-3 w-3" />
                          AI Detection
                        </span>
                      </div>
                    </>
                  )}
                  <input
                    id="file-input"
                    type="file"
                    multiple
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isProcessing}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Features - Clean and Informative */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-80 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-800 text-lg">
                  <Sparkles className="h-5 w-5" />
                  AI Data Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Database className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-800">Smart Entity Detection</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Automatically identifies if your file contains Client, Worker, or Task data
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-800">Intelligent Header Mapping</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Maps wrongly named or rearranged columns to the correct data structure
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-800">Data Format Validation</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Validates and suggests corrections for data formats and patterns
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-800">Cross-File Relationship Detection</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Identifies relationships and references between uploaded files
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* AI Processing Results with Expandable Content */}
        <AnimatePresence>
          {showAIResults && aiResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full"
            >
              <Card className="border-blue-200 bg-blue-50 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-blue-800 text-lg">
                    <Brain className="h-5 w-5" />
                    AI Processing Results
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      {aiResults.length} files processed
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="h-80 w-full">
                    <div className="space-y-4 pr-4">
                      {aiResults.map((result, index) => {
                        const file = files.find(f => f.id === result.fileId);
                        if (!file) return null;
                        
                        return (
                          <motion.div
                            key={result.fileId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-lg border border-blue-200 p-4 shadow-sm"
                          >
                            <div className="space-y-3">
                              {/* File Header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-5 w-5 text-blue-600" />
                                  <div>
                                    <h4 className="font-medium text-gray-900">{file.name}</h4>
                                    <p className="text-sm text-gray-600">{file.data.length} rows • {file.headers.length} columns</p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteFile(file.id, file.name)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              {/* AI Detection Results */}
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className={`${getEntityColor(result.entityType)} font-medium`}>
                                  {getEntityIcon(result.entityType)}
                                  <span className="ml-1">{result.entityType.toUpperCase()}</span>
                                </Badge>
                                <Badge variant="outline" className={`${getConfidenceColor(result.confidence)} border-current`}>
                                  {Math.round(result.confidence * 100)}% confidence
                                </Badge>
                                {result.confidence >= 0.8 && (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                )}
                                {result.confidence < 0.6 && (
                                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                )}
                              </div>
                              
                              {/* Header Mappings with Expand/Collapse */}
                              {Object.keys(result.mappedHeaders).length > 0 && (
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-sm font-medium text-gray-700">Header Mappings:</h5>
                                    {Object.keys(result.mappedHeaders).length > 3 && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => toggleMappingsView(result.fileId)}
                                        className="text-xs h-6 px-2"
                                      >
                                        {result.showAllMappings ? (
                                          <>
                                            <EyeOff className="h-3 w-3 mr-1" />
                                            Show Less
                                          </>
                                        ) : (
                                          <>
                                            <Eye className="h-3 w-3 mr-1" />
                                            +{Object.keys(result.mappedHeaders).length - 3} more mappings
                                          </>
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {Object.entries(result.mappedHeaders)
                                      .slice(0, result.showAllMappings ? undefined : 3)
                                      .map(([original, mapped]) => (
                                      <div key={original} className="flex items-center gap-2 text-xs">
                                        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-700 truncate max-w-[100px]" title={original}>
                                          {original}
                                        </span>
                                        <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                        <span className="font-mono bg-blue-100 px-2 py-1 rounded text-blue-800 truncate max-w-[100px]" title={mapped}>
                                          {mapped}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* AI Suggestions with Expand/Collapse */}
                              {result.suggestions.length > 0 && (
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-sm font-medium text-gray-700">AI Insights:</h5>
                                    {result.suggestions.length > 2 && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => toggleInsightsView(result.fileId)}
                                        className="text-xs h-6 px-2"
                                      >
                                        {result.showAllInsights ? (
                                          <>
                                            <ChevronUp className="h-3 w-3 mr-1" />
                                            Show Less
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown className="h-3 w-3 mr-1" />
                                            +{result.suggestions.length - 2} more insights
                                          </>
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                  <div className="space-y-1">
                                    {result.suggestions
                                      .slice(0, result.showAllInsights ? undefined : 2)
                                      .map((suggestion, idx) => (
                                      <div key={idx} className="flex items-start gap-2 text-sm">
                                        {suggestion.startsWith('✅') ? (
                                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                        ) : suggestion.includes('Missing') || suggestion.includes('invalid') ? (
                                          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                                        ) : (
                                          <Sparkles className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                        )}
                                        <span className={`${
                                          suggestion.startsWith('✅') ? 'text-green-700' :
                                          suggestion.includes('Missing') || suggestion.includes('invalid') ? 'text-red-700' :
                                          'text-blue-700'
                                        }`}>
                                          {suggestion.replace('✅ ', '')}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Uploaded Files */}
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-800 to-blue-600 text-white pb-3">
                <CardTitle className="text-lg">Processed Files ({files.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {files.map((file, index) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.1 }}
                      className="group relative flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200 hover:shadow-md transition-all hover-lift"
                    >
                      {getEntityIcon((file as any).entityType || 'unknown')}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-gray-500">
                            {file.data.length} rows • {file.headers.length} columns
                          </p>
                          {(file as any).aiProcessed && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                              <Brain className="h-2 w-2 mr-1" />
                              AI
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteFile(file.id, file.name)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 absolute top-2 right-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
                
                <div className="flex justify-end mt-6">
                  <Button 
                    onClick={() => setCurrentStep(1)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 text-lg shadow-lg hover:shadow-xl hover-lift"
                    disabled={files.length === 0}
                  >
                    Continue to Validation
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}