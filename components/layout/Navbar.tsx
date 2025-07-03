'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useDataStore } from '@/store/dataStore';
import { 
  Upload, 
  MessageSquare, 
  Download, 
  HelpCircle,
  Sparkles,
  CheckCircle2,
  Settings,
  Target,
  Package,
  Brain,
  Database,
  Wand2,
  TrendingUp,
  BarChart3,
  FileText,
  Users,
  Briefcase,
  Link,
  Search,
  Filter,
  Zap,
  Shield,
  ArrowRight,
  Monitor
} from 'lucide-react';

export default function Navbar() {
  const { toggleAiAssistant, currentStep } = useDataStore();
  const [showRoadmap, setShowRoadmap] = useState(false);

  const roadmapFeatures = [
    {
      category: "File Upload & Processing",
      icon: Upload,
      color: "from-blue-500 to-cyan-500",
      features: [
        { name: "AI-Powered File Detection", description: "Automatically identifies Client, Worker, and Task files", icon: Brain },
        { name: "Smart Header Mapping", description: "Maps incorrect column names to standard format", icon: ArrowRight },
        { name: "Multi-Format Support", description: "CSV, XLSX, and XLS file processing", icon: FileText },
        { name: "Data Type Inference", description: "Automatically detects data types and patterns", icon: Database }
      ]
    },
    {
      category: "Data Validation & Cleaning",
      icon: CheckCircle2,
      color: "from-green-500 to-emerald-500",
      features: [
        { name: "Advanced Validation Engine", description: "Comprehensive data quality checks", icon: Shield },
        { name: "Cross-File Validation", description: "Validates relationships between files", icon: Link },
        { name: "AI Auto-Fix", description: "Intelligent suggestions for data corrections", icon: Wand2 },
        { name: "Natural Language Search", description: "Query data using plain English", icon: Search },
        { name: "Real-time Validation", description: "Instant feedback on data changes", icon: Zap }
      ]
    },
    {
      category: "Business Rules Engine",
      icon: Settings,
      color: "from-purple-500 to-indigo-500",
      features: [
        { name: "Natural Language Rules", description: "Create rules using plain English", icon: MessageSquare },
        { name: "Rule Templates", description: "Pre-built rule types for common scenarios", icon: FileText },
        { name: "AI Rule Generation", description: "Automatically suggest business rules", icon: Brain },
        { name: "Rule Testing", description: "Test rules against your data", icon: CheckCircle2 },
        { name: "Cross-File Rules", description: "Rules that span multiple data files", icon: Link }
      ]
    },
    {
      category: "Priority Management",
      icon: Target,
      color: "from-orange-500 to-red-500",
      features: [
        { name: "Multiple Priority Methods", description: "Sliders, drag-drop, pairwise comparison", icon: BarChart3 },
        { name: "AHP Integration", description: "Analytic Hierarchy Process for scientific weighting", icon: TrendingUp },
        { name: "Preset Profiles", description: "Pre-configured priority templates", icon: Settings },
        { name: "Dynamic Field Detection", description: "Adapts to your uploaded data structure", icon: Database }
      ]
    },
    {
      category: "Export & Integration",
      icon: Package,
      color: "from-pink-500 to-rose-500",
      features: [
        { name: "Complete Data Package", description: "Cleaned data, rules, and configurations", icon: Package },
        { name: "Multiple Export Formats", description: "CSV, JSON, and documentation", icon: FileText },
        { name: "Validation Reports", description: "Comprehensive data quality reports", icon: BarChart3 },
        { name: "Metadata Inclusion", description: "Processing history and timestamps", icon: Database }
      ]
    },
    {
      category: "AI Assistant",
      icon: Brain,
      color: "from-purple-500 to-pink-500",
      features: [
        { name: "Contextual Help", description: "Step-by-step guidance for each workflow stage", icon: HelpCircle },
        { name: "Data Insights", description: "AI-powered analysis and recommendations", icon: TrendingUp },
        { name: "Smart Suggestions", description: "Proactive suggestions for improvements", icon: Sparkles },
        { name: "Natural Language Interface", description: "Chat with your data using plain English", icon: MessageSquare },
        { name: "Visual Analytics", description: "Interactive charts and metrics", icon: BarChart3 }
      ]
    }
  ];

  return (
    <nav className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
      <div className="flex h-12 sm:h-16 items-center justify-between px-2 sm:px-4 lg:px-6">
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 min-w-0">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="p-1 sm:p-1.5 lg:p-2 bg-gradient-to-br from-slate-600 to-blue-600 rounded-md sm:rounded-lg shadow-sm">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-white" />
            </div>
            <h1 className="text-sm sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent truncate">
              <span className="hidden sm:inline">Data Alchemist</span>
              <span className="sm:hidden">DA</span>
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Dialog open={showRoadmap} onOpenChange={setShowRoadmap}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-gray-100 transition-all duration-200 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
                <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">How It Works</span>
                <span className="sm:hidden">Help</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] p-0 mx-2 sm:mx-4">
              <DialogHeader className="p-3 sm:p-4 lg:p-6 pb-3 sm:pb-4 bg-gradient-to-r from-slate-800 to-blue-600 text-white">
                <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold flex items-center gap-2 sm:gap-3">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 flex-shrink-0" />
                  <span className="hidden sm:inline">Data Alchemist - Complete Feature Roadmap</span>
                  <span className="sm:hidden">Feature Roadmap</span>
                </DialogTitle>
                <p className="text-blue-100 mt-2 text-xs sm:text-sm lg:text-base">
                  Transform your raw data into valuable insights with AI-powered processing
                </p>
              </DialogHeader>
              
              <ScrollArea className="h-[60vh] p-3 sm:p-4 lg:p-6">
                <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                  {roadmapFeatures.map((category, categoryIndex) => {
                    const CategoryIcon = category.icon;
                    return (
                      <div key={category.category} className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                          <div className={`p-1.5 sm:p-2 lg:p-3 rounded-lg bg-gradient-to-r ${category.color} shadow-lg flex-shrink-0`}>
                            <CategoryIcon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-white" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900 truncate">{category.category}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {category.features.length} features
                              </Badge>
                              {categoryIndex <= currentStep && (
                                <Badge className="text-xs bg-green-100 text-green-800">
                                  <CheckCircle2 className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                                  Available
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 ml-2 sm:ml-4 pl-2 sm:pl-4 border-l-2 border-gray-200">
                          {category.features.map((feature, featureIndex) => {
                            const FeatureIcon = feature.icon;
                            return (
                              <div 
                                key={feature.name}
                                className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 lg:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <div className="p-1 sm:p-1.5 lg:p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                                  <FeatureIcon className="h-2 w-2 sm:h-3 sm:w-3 lg:h-4 lg:w-4 text-gray-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{feature.name}</h4>
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{feature.description}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4 sm:mt-6 lg:mt-8 p-3 sm:p-4 lg:p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-blue-600 flex-shrink-0" />
                    Why Choose Data Alchemist?
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="text-center">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">95%</div>
                      <div className="text-xs sm:text-sm text-gray-600">Data Quality Improvement</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">80%</div>
                      <div className="text-xs sm:text-sm text-gray-600">Time Savings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">100%</div>
                      <div className="text-xs sm:text-sm text-gray-600">AI-Powered</div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={toggleAiAssistant}
            className="hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 relative text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 hidden sm:flex"
          >
            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="hidden lg:inline">AI Chat</span>
            <span className="lg:hidden">AI</span>
            <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            disabled={currentStep < 4}
            className="hover:bg-green-50 hover:text-green-700 transition-all duration-200 disabled:opacity-50 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="hidden lg:inline">Export</span>
            <span className="lg:hidden">Export</span>
          </Button>
        </div>
      </div>
      
      {/* Mobile Notice */}
      <div className="sm:hidden bg-amber-50 border-t border-amber-200 px-3 py-2">
        <div className="flex items-center gap-2 text-amber-800">
          <Monitor className="h-4 w-4 flex-shrink-0" />
          <p className="text-xs">For full features, use desktop mode</p>
        </div>
      </div>
    </nav>
  );
}