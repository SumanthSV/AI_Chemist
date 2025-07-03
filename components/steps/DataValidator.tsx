'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useDataStore } from '@/store/dataStore';
import DataGridWrapper from '@/components/data/DataGridWrapper';

import { 
  Sparkles,
  Database,
  FileText,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Search,
  MessageSquare,
  Filter,
  X,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

export default function DataValidator() {
  const { 
    files, 
    activeFileId, 
    setActiveFile, 
    setCurrentStep 
  } = useDataStore();

  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  const handleNaturalLanguageSearch = async () => {
    if (!naturalLanguageQuery.trim() || !activeFile) return;

    setIsSearching(true);
    
    try {
      // Add to search history
      if (!searchHistory.includes(naturalLanguageQuery)) {
        setSearchHistory(prev => [naturalLanguageQuery, ...prev.slice(0, 4)]);
      }

      const results = await processNaturalLanguageQuery(naturalLanguageQuery, activeFile);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const processNaturalLanguageQuery = async (query: string, file: any): Promise<any[]> => {
    const lowerQuery = query.toLowerCase();
    let filteredData = [...file.data];

    // Enhanced pattern matching for more complex queries
    
    // Duration-based queries
    if (lowerQuery.includes('duration')) {
      const durationMatch = lowerQuery.match(/duration\s*(more than|greater than|>|>=|less than|<|<=|equals?|=)\s*(\d+)/);
      if (durationMatch) {
        const operator = durationMatch[1];
        const threshold = parseInt(durationMatch[2]);
        
        filteredData = filteredData.filter(row => {
          const duration = parseInt(row.Duration || row.duration || '0');
          switch (operator) {
            case 'more than':
            case 'greater than':
            case '>':
              return duration > threshold;
            case '>=':
              return duration >= threshold;
            case 'less than':
            case '<':
              return duration < threshold;
            case '<=':
              return duration <= threshold;
            case 'equals':
            case 'equal':
            case '=':
              return duration === threshold;
            default:
              return duration > threshold;
          }
        });
      }
    }

    // Priority-based queries
    if (lowerQuery.includes('priority')) {
      const priorityMatch = lowerQuery.match(/priority\s*(level\s*)?(high|low|medium|\d+|more than \d+|less than \d+|equals? \d+)/);
      if (priorityMatch) {
        const priorityValue = priorityMatch[2];
        
        filteredData = filteredData.filter(row => {
          const priority = parseInt(row.Priority || row.PriorityLevel || row.priority || '0');
          
          if (priorityValue === 'high') return priority >= 4;
          if (priorityValue === 'medium') return priority === 3;
          if (priorityValue === 'low') return priority <= 2;
          
          const numMatch = priorityValue.match(/(\d+)/);
          if (numMatch) {
            const num = parseInt(numMatch[1]);
            if (priorityValue.includes('more than')) return priority > num;
            if (priorityValue.includes('less than')) return priority < num;
            if (priorityValue.includes('equals')) return priority === num;
            return priority === num;
          }
          
          return true;
        });
      }
    }

    // Phase-based queries
    if (lowerQuery.includes('phase')) {
      const phaseMatch = lowerQuery.match(/phase\s*(\d+|one|two|three|four|five)/);
      if (phaseMatch) {
        const phaseValue = phaseMatch[1];
        let phaseNumber = phaseValue;
        
        // Convert word to number
        const wordToNumber: Record<string, string> = {
          'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5'
        };
        if (wordToNumber[phaseValue]) {
          phaseNumber = wordToNumber[phaseValue];
        }
        
        filteredData = filteredData.filter(row => {
          const phases = row.PreferredPhases || row.phases || row.Phases || '';
          return String(phases).includes(phaseNumber);
        });
      }
    }

    // Status-based queries
    if (lowerQuery.includes('status') || lowerQuery.includes('completed') || lowerQuery.includes('pending')) {
      if (lowerQuery.includes('completed')) {
        filteredData = filteredData.filter(row => {
          const status = (row.Status || row.status || '').toLowerCase();
          return status.includes('complete') || status.includes('done') || status.includes('finished');
        });
      }
      if (lowerQuery.includes('pending')) {
        filteredData = filteredData.filter(row => {
          const status = (row.Status || row.status || '').toLowerCase();
          return status.includes('pending') || status.includes('waiting') || status.includes('todo');
        });
      }
    }

    // Skill-based queries
    if (lowerQuery.includes('skill')) {
      const skillMatch = lowerQuery.match(/skill[s]?\s*[:\-]?\s*([a-zA-Z\s,]+)/);
      if (skillMatch) {
        const skillQuery = skillMatch[1].trim();
        
        filteredData = filteredData.filter(row => {
          const skills = row.RequiredSkills || row.Skills || row.skills || '';
          return String(skills).toLowerCase().includes(skillQuery.toLowerCase());
        });
      }
    }

    // Worker/Client ID queries
    if (lowerQuery.includes('worker') || lowerQuery.includes('client')) {
      const idMatch = lowerQuery.match(/(worker|client)\s*id\s*[:\-]?\s*([a-zA-Z0-9]+)/);
      if (idMatch) {
        const type = idMatch[1];
        const id = idMatch[2];
        
        filteredData = filteredData.filter(row => {
          const fieldName = type === 'worker' ? 'WorkerID' : 'ClientID';
          const value = row[fieldName] || row[fieldName.toLowerCase()] || '';
          return String(value).toLowerCase().includes(id.toLowerCase());
        });
      }
    }

    // Email domain queries
    if (lowerQuery.includes('email') && lowerQuery.includes('domain')) {
      const domainMatch = lowerQuery.match(/domain\s*[:\-]?\s*([a-zA-Z0-9\.-]+)/);
      if (domainMatch) {
        const domain = domainMatch[1];
        
        filteredData = filteredData.filter(row => {
          const email = row.Email || row.email || '';
          return String(email).toLowerCase().includes(domain.toLowerCase());
        });
      }
    }

    // Revenue/Amount queries
    if (lowerQuery.includes('revenue') || lowerQuery.includes('amount') || lowerQuery.includes('salary')) {
      const amountMatch = lowerQuery.match(/(revenue|amount|salary)\s*(more than|greater than|>|less than|<|equals?)\s*(\d+)/);
      if (amountMatch) {
        const operator = amountMatch[2];
        const threshold = parseInt(amountMatch[3]);
        
        filteredData = filteredData.filter(row => {
          const amount = parseInt(row.Revenue || row.Amount || row.Salary || row.revenue || '0');
          switch (operator) {
            case 'more than':
            case 'greater than':
            case '>':
              return amount > threshold;
            case 'less than':
            case '<':
              return amount < threshold;
            case 'equals':
            case 'equal':
              return amount === threshold;
            default:
              return amount > threshold;
          }
        });
      }
    }

    // Region/Location queries
    if (lowerQuery.includes('region') || lowerQuery.includes('location')) {
      const locationMatch = lowerQuery.match(/(region|location)\s*[:\-]?\s*([a-zA-Z\s]+)/);
      if (locationMatch) {
        const location = locationMatch[2].trim();
        
        filteredData = filteredData.filter(row => {
          const region = row.Region || row.Location || row.region || row.location || '';
          return String(region).toLowerCase().includes(location.toLowerCase());
        });
      }
    }

    // Date range queries
    if (lowerQuery.includes('date') || lowerQuery.includes('after') || lowerQuery.includes('before')) {
      const dateMatch = lowerQuery.match(/(after|before|on)\s*(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/);
      if (dateMatch) {
        const operator = dateMatch[1];
        const dateStr = dateMatch[2];
        const targetDate = new Date(dateStr);
        
        filteredData = filteredData.filter(row => {
          const rowDate = new Date(row.Date || row.date || row.CreatedAt || '');
          if (isNaN(rowDate.getTime())) return false;
          
          switch (operator) {
            case 'after':
              return rowDate > targetDate;
            case 'before':
              return rowDate < targetDate;
            case 'on':
              return rowDate.toDateString() === targetDate.toDateString();
            default:
              return true;
          }
        });
      }
    }

    // Empty/null value queries
    if (lowerQuery.includes('empty') || lowerQuery.includes('null') || lowerQuery.includes('missing')) {
      const fieldMatch = lowerQuery.match(/empty|null|missing\s+([a-zA-Z]+)/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        const actualField = file.headers.find((h: string) => 
          h.toLowerCase().includes(fieldName.toLowerCase())
        );
        
        if (actualField) {
          filteredData = filteredData.filter(row => {
            const value = row[actualField];
            return value === null || value === undefined || value === '';
          });
        }
      }
    }

    // Complex AND/OR queries
    if (lowerQuery.includes(' and ') || lowerQuery.includes(' or ')) {
      // This would require more complex parsing for compound conditions
      // For now, we'll handle simple cases
    }

    return filteredData;
  };

  const clearSearch = () => {
    setSearchResults([]);
    setNaturalLanguageQuery('');
  };

  const useSearchHistory = (query: string) => {
    setNaturalLanguageQuery(query);
  };

  // Suggested queries based on file structure
  const getSuggestedQueries = () => {
    if (!activeFile) return [];
    
    const suggestions = [];
    const headers = activeFile.headers.map((h: string) => h.toLowerCase());
    
    if (headers.some(h => h.includes('duration'))) {
      suggestions.push('Tasks with duration more than 2');
    }
    if (headers.some(h => h.includes('priority'))) {
      suggestions.push('High priority tasks');
    }
    if (headers.some(h => h.includes('phase'))) {
      suggestions.push('Tasks in phase 2');
    }
    if (headers.some(h => h.includes('skill'))) {
      suggestions.push('Tasks requiring JavaScript skills');
    }
    if (headers.some(h => h.includes('revenue'))) {
      suggestions.push('Revenue more than 5000');
    }
    if (headers.some(h => h.includes('region'))) {
      suggestions.push('Tasks in North America region');
    }
    
    return suggestions;
  };

  if (!activeFile) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 bg-pattern-dots flex items-center justify-center p-4 sm:p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-glow-blue animate-pulse-slow">
            <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No Files Uploaded</h2>
          <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">Upload your data files to begin validation</p>
          <Button onClick={() => setCurrentStep(0)} className="btn-gradient">
            Upload Files
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="flex-1 max-w-[calc(90vw-16rem)] bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 bg-pattern-dots overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 bg-pattern-dots overflow-x-hidden">c0f8b1b475f0adec2ad136fdd4d8c1ccf959fd1d
      {/* Main Container with Mobile Optimization */}
      <div className="w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        
        {/* Header Section */}
        <div className="w-full">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent mb-2">
                Clean & Validate Data
              </h1>
              <p className="text-gray-600 font-medium text-sm sm:text-base">
                Advanced data validation with AI-powered capabilities
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Badge variant="outline" className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200 text-xs shadow-sm">
                <Database className="h-3 w-3 mr-1" />
                {files.length} file{files.length !== 1 ? 's' : ''}
              </Badge>
              <Badge variant="outline" className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200 text-xs shadow-sm">
                <TrendingUp className="h-3 w-3 mr-1" />
                Ready
              </Badge>
            </div>
          </div>
        </div>

        {/* Enhanced Natural Language Search - Desktop Only */}
        <div className="hidden lg:block">
          <Card className="shadow-xl border-2 border-blue-200">
            <CardHeader className="bg-gradient-to-r from-slate-800 to-blue-600 text-white pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5" />
                Advanced Natural Language Data Search
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 min-w-0">
                  <Input
                    placeholder="e.g., 'Show tasks with duration more than 2 and priority level 4 or higher in phase 2'"
                    value={naturalLanguageQuery}
                    onChange={(e) => setNaturalLanguageQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleNaturalLanguageSearch()}
                    className="text-sm w-full border-2 border-blue-200 focus:border-blue-500"
                  />
                </div>
                <Button 
                  onClick={handleNaturalLanguageSearch} 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex-shrink-0"
                  size="sm"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Search
                </Button>
                {searchResults.length > 0 && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={clearSearch}
                    className="flex-shrink-0 hover:bg-red-50 hover:text-red-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Search Suggestions */}
              <div className="space-y-3">
                {getSuggestedQueries().length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-gray-700">Suggested Queries:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getSuggestedQueries().map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => useSearchHistory(suggestion)}
                          className="text-xs h-7 px-2 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-purple-200 text-purple-700 hover-lift"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {searchHistory.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Search className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Recent Searches:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {searchHistory.map((query, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => useSearchHistory(query)}
                          className="text-xs h-7 px-2 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border-blue-200 text-blue-700 hover-lift"
                        >
                          {query.length > 30 ? `${query.substring(0, 30)}...` : query}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-blue-800 font-medium">
                      <Filter className="h-4 w-4 inline mr-1" />
                      Found {searchResults.length} matching records
                    </p>
                    <Badge variant="secondary" className="text-xs bg-gradient-to-r from-blue-100 to-purple-100">
                      {((searchResults.length / activeFile.data.length) * 100).toFixed(1)}% of total
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* File Selection Tabs - Mobile Optimized */}
        {files.length > 1 && (
          <Card className="shadow-xl border-2 border-blue-200">
            <CardHeader className="bg-gradient-to-r from-slate-800 to-blue-600 text-white pb-3">
              <CardTitle className="text-sm sm:text-lg">Select File to Validate</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="w-full overflow-x-auto">
                <Tabs value={activeFileId || ''} onValueChange={setActiveFile} className="w-full">
                  <TabsList className="grid w-full bg-gradient-to-r from-blue-50 to-cyan-50 border rounded-lg p-1" style={{ gridTemplateColumns: `repeat(${Math.min(files.length, 2)}, 1fr)` }}>
                    {files.map((file) => (
                      <TabsTrigger 
                        key={file.id} 
                        value={file.id}
                        className="font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white px-2 sm:px-3 py-2 text-center rounded-md transition-all min-w-0 hover-lift text-xs sm:text-sm"
                      >
                        <div className="flex flex-col items-center gap-1 min-w-0 w-full">
                          <div className="flex items-center gap-1 sm:gap-2 min-w-0 w-full justify-center">
                            <FileText className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span 
                              className="truncate font-medium max-w-[80px] sm:max-w-[120px]" 
                              title={file.name}
                            >
                              {file.name.length > 10 ? `${file.name.substring(0, 10)}...` : file.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 flex-wrap justify-center">
                            <Badge variant="outline" className="text-xs px-1 py-0 bg-white/20">
                              {file.data.length}
                            </Badge>
                            {file.aiFixesApplied && (
                              <Badge variant="secondary" className="text-xs px-1 py-0 bg-gradient-to-r from-purple-100 to-pink-100">
                                <Sparkles className="h-2 w-2 mr-1" />
                                {file.aiFixesApplied}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
              
              {/* Show additional files if more than 2 on mobile */}
              {files.length > 2 && (
                <div className="mt-3 text-xs sm:text-sm text-gray-600 text-center sm:hidden">
                  Scroll horizontally to see all {files.length} files
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Data Grid Wrapper - Mobile Optimized */}
        <div className="w-full">
          <DataGridWrapper 
            fileId={activeFile.id} 
            searchResults={searchResults.length > 0 ? searchResults : undefined}
          />
        </div>
      </div>
      
      {/* Continue Button - Fixed Position on Mobile */}
      <div className="fixed bottom-4 left-4 right-4 sm:relative sm:bottom-auto sm:left-auto sm:right-auto sm:flex sm:justify-end sm:mt-6 sm:px-6 z-10">
        <Button 
          onClick={() => setCurrentStep(2)}
          className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 sm:px-8 py-3 text-sm sm:text-lg shadow-xl hover:shadow-2xl hover-lift"
        >
          Continue to Rules
          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
        </Button>
<<<<<<< HEAD
      </div>
      </div>
=======
>>>>>>> c0f8b1b475f0adec2ad136fdd4d8c1ccf959fd1d
      </div>
    </div>
  );
}