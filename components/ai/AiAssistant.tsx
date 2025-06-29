'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useDataStore } from '@/store/dataStore';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles,
  Minimize2,
  Maximize2,
  Bot,
  User,
  Database,
  Settings,
  Target,
  FileText,
  Lightbulb,
  Search,
  Filter,
  Link,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Zap
} from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  actionType?: 'validation' | 'rule' | 'search' | 'relationship' | 'schema' | 'insights';
  insights?: {
    type: 'success' | 'warning' | 'info' | 'error';
    title: string;
    description: string;
    metrics?: Array<{ label: string; value: string | number; trend?: 'up' | 'down' | 'stable' }>;
  };
}

export default function AiAssistant() {
  const { aiAssistantOpen, toggleAiAssistant, files, currentStep } = useDataStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI Data Assistant. I can help you with advanced data validation, schema detection, relationship mapping, rule creation, and natural language queries. What would you like to explore?',
      timestamp: new Date(),
      suggestions: [
        'Detect schema patterns in my data',
        'Find relationships between files',
        'Create validation rules',
        'Search data with natural language',
        'Suggest data quality improvements'
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message: string = inputValue) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response with more sophisticated logic
    setTimeout(() => {
      const aiResponse = generateAdvancedAiResponse(message);
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1500);
  };

  const generateAdvancedAiResponse = (userMessage: string): ChatMessage => {
    const lowerMessage = userMessage.toLowerCase();
    
    let response = '';
    let suggestions: string[] = [];
    let actionType: ChatMessage['actionType'] = undefined;
    let insights: ChatMessage['insights'] = undefined;

    // Enhanced AI insights with visual components
    if (lowerMessage.includes('schema') || lowerMessage.includes('detect') || lowerMessage.includes('pattern')) {
      response = 'I\'ve analyzed your data schema! I found key columns, data types, and patterns. I can identify primary keys, foreign key relationships, and suggest normalization opportunities.';
      suggestions = ['Run full schema analysis', 'Detect key columns', 'Find data patterns', 'Suggest normalization'];
      actionType = 'schema';
      insights = {
        type: 'success',
        title: 'Schema Analysis Complete',
        description: 'Detected data structure and relationships',
        metrics: [
          { label: 'Tables Analyzed', value: files.length, trend: 'stable' },
          { label: 'Key Columns Found', value: Math.floor(Math.random() * 10) + 5, trend: 'up' },
          { label: 'Data Quality Score', value: '87%', trend: 'up' }
        ]
      };
    }
    // Relationship mapping with insights
    else if (lowerMessage.includes('relationship') || lowerMessage.includes('join') || lowerMessage.includes('connect') || lowerMessage.includes('link')) {
      response = 'I can map relationships between your files! I\'ll analyze column names, data patterns, and value overlaps to suggest potential joins. This helps create a unified data model from multiple sources.';
      suggestions = ['Find all relationships', 'Suggest join strategies', 'Map foreign keys', 'Create data model'];
      actionType = 'relationship';
      insights = {
        type: 'info',
        title: 'Relationship Mapping',
        description: 'Cross-file connections identified',
        metrics: [
          { label: 'Potential Joins', value: Math.floor(Math.random() * 8) + 3, trend: 'stable' },
          { label: 'Match Confidence', value: '92%', trend: 'up' },
          { label: 'Data Overlap', value: '76%', trend: 'stable' }
        ]
      };
    }
    // Validation and quality with detailed insights
    else if (lowerMessage.includes('validate') || lowerMessage.includes('validation') || lowerMessage.includes('quality') || lowerMessage.includes('clean')) {
      response = 'I\'ll run advanced validation checks including data type consistency, referential integrity, outlier detection, and business rule validation. I can also suggest automated fixes for common issues.';
      suggestions = ['Run comprehensive validation', 'Check referential integrity', 'Detect outliers', 'Suggest data fixes'];
      actionType = 'validation';
      insights = {
        type: 'warning',
        title: 'Data Quality Assessment',
        description: 'Issues found that need attention',
        metrics: [
          { label: 'Critical Errors', value: Math.floor(Math.random() * 5) + 1, trend: 'down' },
          { label: 'Warnings', value: Math.floor(Math.random() * 15) + 5, trend: 'stable' },
          { label: 'Clean Records', value: '78%', trend: 'up' }
        ]
      };
    }
    // Rule creation with insights
    else if (lowerMessage.includes('rule') || lowerMessage.includes('create') || lowerMessage.includes('constraint')) {
      response = 'I can help create sophisticated business rules! Describe your requirements in plain English and I\'ll convert them to structured validation rules, constraints, or transformations.';
      suggestions = ['Create validation rule', 'Add business constraint', 'Set up data transformation', 'Define quality checks'];
      actionType = 'rule';
      insights = {
        type: 'success',
        title: 'Rule Engine Ready',
        description: 'AI-powered rule generation available',
        metrics: [
          { label: 'Active Rules', value: Math.floor(Math.random() * 12) + 3, trend: 'up' },
          { label: 'Rule Coverage', value: '85%', trend: 'up' },
          { label: 'Automation Level', value: '92%', trend: 'stable' }
        ]
      };
    }
    // Natural language search with insights
    else if (lowerMessage.includes('find') || lowerMessage.includes('search') || lowerMessage.includes('where') || lowerMessage.includes('show')) {
      response = 'I can search your data using natural language! Just describe what you\'re looking for, like "customers with revenue over $10K in Europe" and I\'ll create the appropriate filters and show results.';
      suggestions = ['Search high-value records', 'Find incomplete data', 'Filter by conditions', 'Show data insights'];
      actionType = 'search';
      insights = {
        type: 'info',
        title: 'Smart Search Ready',
        description: 'Natural language queries enabled',
        metrics: [
          { label: 'Searchable Fields', value: files.reduce((acc, file) => acc + file.headers.length, 0), trend: 'stable' },
          { label: 'Query Accuracy', value: '94%', trend: 'up' },
          { label: 'Response Time', value: '0.3s', trend: 'down' }
        ]
      };
    }
    // Data insights and recommendations with comprehensive metrics
    else if (lowerMessage.includes('insight') || lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('improve')) {
      response = 'Based on your data analysis, I can provide insights on data quality, suggest improvements, recommend validation rules, and identify optimization opportunities. Let me analyze your current dataset.';
      suggestions = ['Analyze data quality', 'Suggest improvements', 'Recommend rules', 'Find optimization opportunities'];
      actionType = 'insights';
      insights = {
        type: 'success',
        title: 'Data Insights Generated',
        description: 'Comprehensive analysis complete',
        metrics: [
          { label: 'Data Quality Score', value: '87%', trend: 'up' },
          { label: 'Optimization Potential', value: '23%', trend: 'stable' },
          { label: 'Automation Opportunities', value: 8, trend: 'up' },
          { label: 'Cost Savings', value: '$2.4K', trend: 'up' }
        ]
      };
    }
    // Error explanation with detailed insights
    else if (lowerMessage.includes('error') || lowerMessage.includes('issue') || lowerMessage.includes('problem') || lowerMessage.includes('fix')) {
      response = 'I can explain data issues in detail and provide step-by-step solutions. I\'ll analyze error patterns, suggest root causes, and recommend both immediate fixes and preventive measures.';
      suggestions = ['Explain current errors', 'Suggest fixes', 'Prevent future issues', 'Analyze error patterns'];
      actionType = 'validation';
      insights = {
        type: 'error',
        title: 'Error Analysis',
        description: 'Issues identified with solutions',
        metrics: [
          { label: 'Critical Issues', value: 3, trend: 'down' },
          { label: 'Auto-fixable', value: '67%', trend: 'up' },
          { label: 'Resolution Time', value: '2.1h', trend: 'down' }
        ]
      };
    }
    // File-specific queries with file insights
    else if (files.length > 0 && (lowerMessage.includes('file') || lowerMessage.includes('data'))) {
      const fileNames = files.map(f => f.name).join(', ');
      response = `I can analyze your uploaded files: ${fileNames}. I can compare schemas, suggest merging strategies, detect relationships, and help with data integration tasks.`;
      suggestions = ['Compare file schemas', 'Suggest merge strategy', 'Find common columns', 'Analyze data overlap'];
      actionType = 'schema';
      insights = {
        type: 'info',
        title: 'File Analysis',
        description: 'Multi-file data structure analyzed',
        metrics: [
          { label: 'Files Processed', value: files.length, trend: 'stable' },
          { label: 'Total Records', value: files.reduce((acc, file) => acc + file.data.length, 0), trend: 'up' },
          { label: 'Schema Compatibility', value: '89%', trend: 'up' }
        ]
      };
    }
    // Default response with context awareness
    else {
      const contextHelp = getContextualHelp();
      response = `${contextHelp} I can help with advanced data analysis, schema detection, relationship mapping, and intelligent rule creation. What specific task would you like assistance with?`;
      suggestions = ['Detect data schema', 'Map relationships', 'Create smart rules', 'Search with AI', 'Analyze data quality'];
      insights = {
        type: 'info',
        title: 'AI Assistant Ready',
        description: 'Advanced data processing capabilities available',
        metrics: [
          { label: 'Processing Power', value: '100%', trend: 'stable' },
          { label: 'Accuracy Rate', value: '96%', trend: 'up' },
          { label: 'Features Available', value: 12, trend: 'stable' }
        ]
      };
    }

    return {
      id: Date.now().toString(),
      type: 'assistant',
      content: response,
      timestamp: new Date(),
      suggestions,
      actionType,
      insights
    };
  };

  const getContextualHelp = () => {
    const stepHelp = [
      'I can help you upload and analyze file structures, detect schemas automatically, and prepare your data for processing.',
      'I\'m analyzing your data for quality issues, detecting patterns, and can suggest validation rules based on what I find.',
      'Let\'s create intelligent business rules! I can convert your natural language requirements into structured validation logic.',
      'I can help optimize your priority settings based on data characteristics and business objectives.',
      'Ready to export! I can explain what\'s included and suggest additional metadata or documentation.'
    ];
    
    return stepHelp[currentStep] || 'I\'m here to help with advanced data analysis!';
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const getActionIcon = (actionType?: ChatMessage['actionType']) => {
    switch (actionType) {
      case 'schema': return Database;
      case 'relationship': return Link;
      case 'validation': return Settings;
      case 'rule': return Target;
      case 'search': return Search;
      case 'insights': return TrendingUp;
      default: return Lightbulb;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle2;
      case 'warning': return AlertTriangle;
      case 'error': return AlertTriangle;
      case 'info': return BarChart3;
      default: return TrendingUp;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '→';
      default: return '';
    }
  };

  if (!aiAssistantOpen) return null;

  return (
    <motion.div
      initial={{ x: 320 }}
      animate={{ x: 0 }}
      exit={{ x: 320 }}
      className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 bg-gradient-to-b from-white to-blue-50 border-l shadow-xl z-40"
    >
      <Card className="h-full rounded-none border-0 bg-transparent">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <Sparkles className="h-5 w-5" />
            AI Data Assistant
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-white/20"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAiAssistant}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-[calc(100%-4rem)]">
            {/* Context Help */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b">
              <div className="flex items-start gap-2">
                <Bot className="h-4 w-4 text-purple-600 mt-0.5" />
                <p className="text-sm text-purple-800 font-medium">{getContextualHelp()}</p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.type === 'assistant' && (
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-purple-200">
                        <Bot className="h-4 w-4 text-purple-600" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[85%] rounded-xl p-4 shadow-sm ${
                        message.type === 'user'
                          ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      {message.actionType && message.type === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2">
                          {(() => {
                            const IconComponent = getActionIcon(message.actionType);
                            return <IconComponent className="h-4 w-4" />;
                          })()}
                          <Badge variant="outline" className="text-xs">
                            {message.actionType}
                          </Badge>
                        </div>
                      )}
                      
                      <p className={`text-sm leading-relaxed ${
                        message.type === 'user' ? 'text-white' : 'text-gray-800'
                      }`}>
                        {message.content}
                      </p>

                      {/* AI Insights Panel */}
                      {message.insights && message.type === 'assistant' && (
                        <div className={`mt-4 p-3 rounded-lg border ${getInsightColor(message.insights.type)}`}>
                          <div className="flex items-center gap-2 mb-2">
                            {(() => {
                              const IconComponent = getInsightIcon(message.insights.type);
                              return <IconComponent className="h-4 w-4" />;
                            })()}
                            <span className="font-medium text-sm">{message.insights.title}</span>
                          </div>
                          <p className="text-xs mb-3">{message.insights.description}</p>
                          
                          {message.insights.metrics && (
                            <div className="grid grid-cols-2 gap-2">
                              {message.insights.metrics.map((metric, index) => (
                                <div key={index} className="bg-white/50 rounded p-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium">{metric.label}</span>
                                    <span className="text-xs">{getTrendIcon(metric.trend)}</span>
                                  </div>
                                  <div className="text-sm font-bold mt-1">{metric.value}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {message.suggestions && (
                        <div className="mt-3 space-y-2">
                          {message.suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="block w-full text-left text-xs bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-2 transition-colors border border-gray-200 hover:border-gray-300"
                            >
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const IconComponent = getActionIcon(message.actionType);
                                  return <IconComponent className="h-3 w-3" />;
                                })()}
                                <span>{suggestion}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {message.type === 'user' && (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-blue-200">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                  </motion.div>
                ))}
                
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center border-2 border-purple-200">
                      <Bot className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about schema, relationships, rules..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 border-gray-300 focus:border-purple-500"
                />
                <Button
                  size="sm"
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}