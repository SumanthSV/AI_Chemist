'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDataStore } from '@/store/dataStore';
import DataGrid from '@/components/data/DataGrid';
import ValidationSummary from '@/components/validation/ValidationSummary';
import AIValidator from '@/components/validation/AIValidator';
import { validateData } from '@/utils/validators';
import { validateCrossFileReferences } from '@/utils/crossFileValidator';
import { 
  Sparkles,
  RefreshCw,
  Filter,
  Upload,
  AlertTriangle,
  X,
  Check,
  Zap,
  ChevronDown,
  ChevronUp,
  Link,
  Database,
  FileText,
  Lightbulb,
  Search,
  Brain,
  TrendingUp,
  BarChart3,
  Target,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface DataGridWrapperProps {
  fileId: string;
  searchResults?: any[];
}

export default function DataGridWrapper({ fileId, searchResults }: DataGridWrapperProps) {
  const { 
    files, 
    updateFileData, 
    validationEnabled,
    toggleValidation 
  } = useDataStore();
  
  const [validationResults, setValidationResults] = useState<any>({});
  const [crossFileResults, setCrossFileResults] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [aiFixSuggestions, setAiFixSuggestions] = useState<any[]>([]);
  const [autoValidateOnEdit, setAutoValidateOnEdit] = useState(true);
  const [showAISuggestions, setShowAISuggestions] = useState(true);
  const [showCrossFileValidation, setShowCrossFileValidation] = useState(true);
  const [aiInsights, setAiInsights] = useState<any>(null);

  const file = files.find(f => f.id === fileId);
  
  if (!file) return null;

  const runValidation = useCallback(async () => {
    setIsValidating(true);
    try {
      // Run single-file validation
      const results = await validateData(file.data, file.headers, files);
      setValidationResults({
        ...validationResults,
        [fileId]: results
      });
      
      // Run cross-file validation if we have multiple files
      if (files.length > 1) {
        const crossResults = await validateCrossFileReferences(files);
        setCrossFileResults(crossResults);
      }

      // Generate AI insights
      const insights = generateAIInsights(results, file);
      setAiInsights(insights);
      
      const totalIssues = results.summary.totalIssues + (crossFileResults?.summary.totalIssues || 0);
      toast.success(`Validation complete: ${totalIssues} total issues found`);
    } catch (error) {
      toast.error('Validation failed: ' + error);
    } finally {
      setIsValidating(false);
    }
  }, [file, fileId, validationResults, files, crossFileResults]);

  const generateAIInsights = (results: any, file: any) => {
    const insights: {
    dataQuality: number;
    recommendations: {
      type: string;
      title: string;
      description: string;
      action: string;
    }[];
    patterns: {
      type: string;
      title: string;
      count: number;
      impact: string;
    }[];
    optimizations: {
      type: string;
      title: string;
      description: string;
    }[];
  } = {
    dataQuality: Math.round(((file.data.length - results.summary.totalIssues) / file.data.length) * 100),
    recommendations: [],
    patterns: [],
    optimizations: []
  };

    // Generate recommendations based on validation results
    if (results.summary.errorCount > 0) {
      insights.recommendations.push({
        type: 'error',
        title: 'Critical Data Issues',
        description: `Found ${results.summary.errorCount} critical errors that need immediate attention`,
        action: 'Run AI Auto-Fix to resolve common issues automatically'
      });
    }

    if (results.summary.warningCount > 5) {
      insights.recommendations.push({
        type: 'warning',
        title: 'Data Quality Improvements',
        description: `${results.summary.warningCount} warnings detected that could affect data reliability`,
        action: 'Review and standardize data formats'
      });
    }

    // Detect patterns
    const duplicateCount = results.errors.filter((e: any) => e.type === 'duplicate_id').length;
    if (duplicateCount > 0) {
      insights.patterns.push({
        type: 'duplicate',
        title: 'Duplicate Records Detected',
        count: duplicateCount,
        impact: 'May cause processing conflicts'
      });
    }

    // Suggest optimizations
    if (insights.dataQuality > 90) {
      insights.optimizations.push({
        type: 'excellent',
        title: 'Excellent Data Quality',
        description: 'Your data is ready for advanced processing and analysis'
      });
    } else if (insights.dataQuality > 70) {
      insights.optimizations.push({
        type: 'good',
        title: 'Good Data Quality',
        description: 'Minor improvements could enhance processing efficiency'
      });
    } else {
      insights.optimizations.push({
        type: 'needs_work',
        title: 'Data Quality Needs Attention',
        description: 'Significant improvements recommended before processing'
      });
    }

    return insights;
  };

  // Auto-validate on file upload
  useEffect(() => {
    if (validationEnabled && file.data.length > 0) {
      runValidation();
    }
  }, [file.id, validationEnabled]);

  const handleDataUpdate = useCallback((rowIndex: number, columnId: string, value: any) => {
    const updatedData = [...file.data];
    updatedData[rowIndex] = { ...updatedData[rowIndex], [columnId]: value };
    updateFileData(fileId, updatedData);
    
    // Real-time validation on edit
    if (autoValidateOnEdit && validationEnabled) {
      setTimeout(runValidation, 300);
    }
  }, [file.data, fileId, updateFileData, autoValidateOnEdit, validationEnabled, runValidation]);

  const handleAddRow = useCallback(() => {
    const newRow = file.headers.reduce((acc, header) => {
      acc[header] = '';
      return acc;
    }, {} as any);
    
    const updatedData = [...file.data, newRow];
    updateFileData(fileId, updatedData);
    toast.success('New row added');
  }, [file.headers, file.data, fileId, updateFileData]);

  const handleDeleteRow = useCallback((rowIndex: number) => {
    const updatedData = file.data.filter((_, index) => index !== rowIndex);
    updateFileData(fileId, updatedData);
    toast.success('Row deleted');
    
    // Re-validate after deletion
    if (validationEnabled) {
      setTimeout(runValidation, 300);
    }
  }, [file.data, fileId, updateFileData, validationEnabled, runValidation]);

  const handleApplySuggestion = useCallback((suggestion: any) => {
    handleDataUpdate(suggestion.row, suggestion.column, suggestion.after);
    setAiFixSuggestions(prev => prev.filter(s => s !== suggestion));
    toast.success('AI suggestion applied');
  }, [handleDataUpdate]);

  const handleDismissSuggestion = useCallback((suggestion: any) => {
    setAiFixSuggestions(prev => prev.filter(s => s !== suggestion));
  }, []);

  const handleApplyAllSuggestions = useCallback(() => {
    aiFixSuggestions.forEach(suggestion => {
      handleDataUpdate(suggestion.row, suggestion.column, suggestion.after);
    });
    setAiFixSuggestions([]);
    toast.success(`Applied ${aiFixSuggestions.length} AI suggestions`);
  }, [aiFixSuggestions, handleDataUpdate]);

  const currentResults = validationResults[fileId] || {
    errors: [],
    warnings: [],
    info: [],
    summary: { totalIssues: 0, errorCount: 0, warningCount: 0, infoCount: 0 }
  };

  // Use search results if provided, otherwise use filtered data
  const dataToDisplay = searchResults || file.data;
  const filteredData = showErrorsOnly 
    ? dataToDisplay.filter((_, index) => 
        currentResults.errors.some((error: any) => error.location?.row === index) ||
        currentResults.warnings.some((warning: any) => warning.location?.row === index)
      )
    : dataToDisplay;

  return (
    <div className="w-full space-y-6">
      {/* Enhanced Controls Header with AI Insights */}
      <Card className="shadow-lg border-2 border-blue-200">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Auto-validate</span>
                <Switch 
                  checked={validationEnabled} 
                  onCheckedChange={toggleValidation}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Real-time</span>
                <Switch 
                  checked={autoValidateOnEdit} 
                  onCheckedChange={setAutoValidateOnEdit}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Errors only</span>
                <Switch 
                  checked={showErrorsOnly} 
                  onCheckedChange={setShowErrorsOnly}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={runValidation}
                disabled={isValidating}
                variant="outline"
                size="sm"
                className="hover-lift"
              >
                {isValidating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Re-run
              </Button>

              <Button
                onClick={handleAddRow}
                variant="outline"
                size="sm"
                className="hover-lift"
              >
                <Upload className="h-4 w-4 mr-2" />
                Add Row
              </Button>

              <AIValidator 
                fileData={file.data}
                headers={file.headers}
                validationResults={currentResults}
                onSuggestionsReceived={setAiFixSuggestions}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights Panel */}
      {aiInsights && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-800 text-lg">
              <Brain className="h-5 w-5" />
              AI Data Insights
              <Badge variant="outline" className="bg-purple-100 text-purple-800">
                Quality: {aiInsights.dataQuality}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Recommendations */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-purple-800 flex items-center gap-1">
                  <Lightbulb className="h-4 w-4" />
                  Recommendations
                </h4>
                {aiInsights.recommendations.map((rec: any, index: number) => (
                  <div key={index} className="p-2 bg-white rounded border border-purple-200">
                    <div className="flex items-center gap-2 mb-1">
                      {rec.type === 'error' && <AlertTriangle className="h-3 w-3 text-red-500" />}
                      {rec.type === 'warning' && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
                      <span className="text-xs font-medium">{rec.title}</span>
                    </div>
                    <p className="text-xs text-gray-600">{rec.description}</p>
                    <p className="text-xs text-blue-600 mt-1">{rec.action}</p>
                  </div>
                ))}
              </div>

              {/* Patterns */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-purple-800 flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  Patterns
                </h4>
                {aiInsights.patterns.map((pattern: any, index: number) => (
                  <div key={index} className="p-2 bg-white rounded border border-purple-200">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-3 w-3 text-blue-500" />
                      <span className="text-xs font-medium">{pattern.title}</span>
                    </div>
                    <p className="text-xs text-gray-600">Count: {pattern.count}</p>
                    <p className="text-xs text-orange-600">{pattern.impact}</p>
                  </div>
                ))}
              </div>

              {/* Optimizations */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-purple-800 flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  Optimizations
                </h4>
                {aiInsights.optimizations.map((opt: any, index: number) => (
                  <div key={index} className="p-2 bg-white rounded border border-purple-200">
                    <div className="flex items-center gap-2 mb-1">
                      {opt.type === 'excellent' && <Check className="h-3 w-3 text-green-500" />}
                      {opt.type === 'good' && <TrendingUp className="h-3 w-3 text-blue-500" />}
                      {opt.type === 'needs_work' && <Settings className="h-3 w-3 text-orange-500" />}
                      <span className="text-xs font-medium">{opt.title}</span>
                    </div>
                    <p className="text-xs text-gray-600">{opt.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cross-File Validation Results - Scrollable Container */}
      {crossFileResults && files.length > 1 && (
        <Card className="border-blue-200 bg-blue-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-blue-800 text-lg">
                <Link className="h-5 w-5" />
                Cross-File Validation Results
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  {crossFileResults.summary.totalIssues} issues
                </Badge>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCrossFileValidation(!showCrossFileValidation)}
                className="text-blue-700 hover:text-blue-800"
              >
                {showCrossFileValidation ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          
          {showCrossFileValidation && (
            <CardContent className="pt-0">
              {/* Scrollable container with fixed height */}
              <div className="border border-blue-200 rounded-lg bg-white">
                <ScrollArea className="h-80 w-full">
                  <div className="p-4 space-y-3">
                    {/* Cross-file errors */}
                    {crossFileResults.errors.map((error: any, index: number) => (
                      <motion.div
                        key={`error-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-3 bg-red-50 border border-red-200 rounded-lg shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-1 bg-red-100 rounded-full flex-shrink-0">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="destructive" className="text-xs px-2 py-0">
                                ERROR
                              </Badge>
                              <Badge variant="outline" className="text-xs px-2 py-0 bg-red-100 text-red-700 border-red-300">
                                {error.type}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-red-800 mb-2">{error.message}</p>
                            {error.location && (
                              <div className="flex items-center gap-2 text-xs text-red-600 mb-2">
                                <FileText className="h-3 w-3" />
                                <span className="font-medium">{error.location.fileName}</span>
                                <span>•</span>
                                <span>Row {error.location.row + 1}</span>
                                <span>•</span>
                                <span className="font-mono bg-red-100 px-1 rounded">{error.location.column}</span>
                              </div>
                            )}
                            {error.relatedFiles && (
                              <div className="flex items-center gap-2 mt-2">
                                <Database className="h-3 w-3 text-red-600 flex-shrink-0" />
                                <span className="text-xs text-red-600">
                                  Related files: 
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {error.relatedFiles.map((fileName: string, idx: number) => (
                                    <Badge key={idx} variant="outline" className="text-xs px-1 py-0 bg-red-100 text-red-700 border-red-300">
                                      {fileName}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {error.value && (
                              <div className="mt-2 p-2 bg-red-100 rounded text-xs font-mono text-red-800 break-all">
                                Value: {String(error.value)}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* Cross-file warnings */}
                    {crossFileResults.warnings.map((warning: any, index: number) => (
                      <motion.div
                        key={`warning-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (crossFileResults.errors.length + index) * 0.05 }}
                        className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-1 bg-yellow-100 rounded-full flex-shrink-0">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-xs px-2 py-0 bg-yellow-200 text-yellow-800">
                                WARNING
                              </Badge>
                              <Badge variant="outline" className="text-xs px-2 py-0 bg-yellow-100 text-yellow-700 border-yellow-300">
                                {warning.type}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-yellow-800 mb-2">{warning.message}</p>
                            {warning.location && (
                              <div className="flex items-center gap-2 text-xs text-yellow-600 mb-2">
                                <FileText className="h-3 w-3" />
                                <span className="font-medium">{warning.location.fileName}</span>
                                <span>•</span>
                                <span>Row {warning.location.row + 1}</span>
                                <span>•</span>
                                <span className="font-mono bg-yellow-100 px-1 rounded">{warning.location.column}</span>
                              </div>
                            )}
                            {warning.relatedFiles && (
                              <div className="flex items-center gap-2 mt-2">
                                <Database className="h-3 w-3 text-yellow-600 flex-shrink-0" />
                                <span className="text-xs text-yellow-600">
                                  Related files: 
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {warning.relatedFiles.map((fileName: string, idx: number) => (
                                    <Badge key={idx} variant="outline" className="text-xs px-1 py-0 bg-yellow-100 text-yellow-700 border-yellow-300">
                                      {fileName}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {warning.value && (
                              <div className="mt-2 p-2 bg-yellow-100 rounded text-xs font-mono text-yellow-800 break-all">
                                Value: {String(warning.value)}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* Cross-file info items */}
                    {crossFileResults.info.map((info: any, index: number) => (
                      <motion.div
                        key={`info-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (crossFileResults.errors.length + crossFileResults.warnings.length + index) * 0.05 }}
                        className="p-3 bg-blue-50 border border-blue-200 rounded-lg shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-1 bg-blue-100 rounded-full flex-shrink-0">
                            <AlertTriangle className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs px-2 py-0 bg-blue-100 text-blue-700 border-blue-300">
                                INFO
                              </Badge>
                              <Badge variant="outline" className="text-xs px-2 py-0 bg-blue-100 text-blue-700 border-blue-300">
                                {info.type}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-blue-800 mb-2">{info.message}</p>
                            {info.location && (
                              <div className="flex items-center gap-2 text-xs text-blue-600 mb-2">
                                <FileText className="h-3 w-3" />
                                <span className="font-medium">{info.location.fileName}</span>
                                <span>•</span>
                                <span>Row {info.location.row + 1}</span>
                                <span>•</span>
                                <span className="font-mono bg-blue-100 px-1 rounded">{info.location.column}</span>
                              </div>
                            )}
                            {info.relatedFiles && (
                              <div className="flex items-center gap-2 mt-2">
                                <Database className="h-3 w-3 text-blue-600 flex-shrink-0" />
                                <span className="text-xs text-blue-600">
                                  Related files: 
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {info.relatedFiles.map((fileName: string, idx: number) => (
                                    <Badge key={idx} variant="outline" className="text-xs px-1 py-0 bg-blue-100 text-blue-700 border-blue-300">
                                      {fileName}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* Empty state */}
                    {crossFileResults.errors.length === 0 && crossFileResults.warnings.length === 0 && crossFileResults.info.length === 0 && (
                      <div className="text-center py-8 text-blue-600">
                        <Check className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                        <p className="font-medium">No cross-file validation issues found!</p>
                        <p className="text-sm text-blue-500 mt-1">All file references and relationships are valid.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
              
              {/* Summary footer */}
              <div className="mt-3 p-3 bg-blue-100 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-800 font-medium">
                    Cross-file validation summary:
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-red-700">
                      {crossFileResults.summary.errorCount} errors
                    </span>
                    <span className="text-yellow-700">
                      {crossFileResults.summary.warningCount} warnings
                    </span>
                    <span className="text-blue-700">
                      {crossFileResults.summary.infoCount} info
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Validation Summary */}
      <ValidationSummary 
        results={currentResults}
        totalRows={file.data.length}
        fileName={file.name}
      />

      {/* AI Suggestions Panel - Fixed Width and Scrolling */}
      <AnimatePresence>
        {aiFixSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full"
          >
            <Card className="border-orange-200 bg-orange-50 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="flex items-center gap-2 text-orange-800 text-lg">
                      <Sparkles className="h-5 w-5" />
                      AI Fix Suggestions
                      <Badge variant="outline" className="bg-orange-100 text-orange-800">
                        {aiFixSuggestions.length}
                      </Badge>
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAISuggestions(!showAISuggestions)}
                      className="text-orange-700 hover:text-orange-800"
                    >
                      {showAISuggestions ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    onClick={handleApplyAllSuggestions}
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Apply All
                  </Button>
                </div>
              </CardHeader>
              
              {showAISuggestions && (
                <CardContent className="pt-0">
                  <div className="w-full border border-orange-200 rounded-lg bg-white">
                    <ScrollArea className="h-80 w-full">
                      <div className="space-y-3 p-4">
                        {aiFixSuggestions.map((suggestion, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-gray-50 rounded-lg border border-gray-200 p-4 shadow-sm"
                          >
                            <div className="space-y-3">
                              <div>
                                <p className="font-medium text-gray-800 text-sm">
                                  {suggestion.description}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  Row {suggestion.row + 1}, Column {suggestion.column}
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(suggestion.confidence * 100)}% confidence
                                  </Badge>
                                  <Badge variant={suggestion.severity === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                                    {suggestion.severity}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <span className="text-xs text-gray-500 font-medium">Before:</span>
                                  <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs font-mono break-all max-h-16 overflow-y-auto">
                                    {String(suggestion.before) || '<empty>'}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500 font-medium">After:</span>
                                  <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-xs font-mono break-all max-h-16 overflow-y-auto">
                                    {String(suggestion.after)}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex gap-2 pt-2 border-t border-gray-200">
                                <Button
                                  size="sm"
                                  onClick={() => handleApplySuggestion(suggestion)}
                                  className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Apply
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDismissSuggestion(suggestion)}
                                  className="h-8 text-xs"
                                >
                                  <X className="h-3 w-3" />
                                  Dismiss
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data Grid - Constrained Width */}
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 min-w-0">
              <span className="truncate text-lg" title={file.name}>
                {file.name}
              </span>
              <Badge variant="outline" className="flex-shrink-0">
                {filteredData.length} rows
              </Badge>
              {currentResults.summary.totalIssues > 0 && (
                <Badge variant="destructive" className="flex-shrink-0">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {currentResults.summary.totalIssues} issues
                </Badge>
              )}
              {searchResults && (
                <Badge variant="secondary" className="flex-shrink-0">
                  <Filter className="h-3 w-3 mr-1" />
                  Search Results
                </Badge>
              )}
            </CardTitle>
            
            {showErrorsOnly && (
              <Badge variant="secondary" className="flex-shrink-0">
                <Filter className="h-3 w-3 mr-1" />
                Errors only
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full">
            <DataGrid 
              data={filteredData}
              headers={file.headers}
              validationResults={currentResults}
              onDataUpdate={handleDataUpdate}
              onDeleteRow={handleDeleteRow}
              showRowNumbers={true}
              enableInlineEdit={true}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}