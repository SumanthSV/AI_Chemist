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
  ArrowRight
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
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-slate-600 to-blue-600 rounded-lg shadow-sm">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
              Data Alchemist
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={showRoadmap} onOpenChange={setShowRoadmap}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-gray-100 transition-all duration-200">
                <HelpCircle className="h-4 w-4 mr-2" />
                How It Works
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] p-0">
              <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-slate-800 to-blue-600 text-white">
                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                  <Sparkles className="h-6 w-6" />
                  Data Alchemist - Complete Feature Roadmap
                </DialogTitle>
                <p className="text-blue-100 mt-2">
                  Transform your raw data into valuable insights with AI-powered processing
                </p>
              </DialogHeader>
              
              <ScrollArea className="h-[60vh] p-6">
                <div className="space-y-8">
                  {roadmapFeatures.map((category, categoryIndex) => {
                    const CategoryIcon = category.icon;
                    return (
                      <div key={category.category} className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`p-3 rounded-lg bg-gradient-to-r ${category.color} shadow-lg`}>
                            <CategoryIcon className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{category.category}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {category.features.length} features
                              </Badge>
                              {categoryIndex <= currentStep && (
                                <Badge className="text-xs bg-green-100 text-green-800">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Available
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-4 pl-4 border-l-2 border-gray-200">
                          {category.features.map((feature, featureIndex) => {
                            const FeatureIcon = feature.icon;
                            return (
                              <div 
                                key={feature.name}
                                className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                  <FeatureIcon className="h-4 w-4 text-gray-600" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 text-sm">{feature.name}</h4>
                                  <p className="text-xs text-gray-600 mt-1">{feature.description}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Why Choose Data Alchemist?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">95%</div>
                      <div className="text-sm text-gray-600">Data Quality Improvement</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">80%</div>
                      <div className="text-sm text-gray-600">Time Savings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">100%</div>
                      <div className="text-sm text-gray-600">AI-Powered</div>
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
            className="hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 relative"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            AI Chat
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            disabled={currentStep < 4}
            className="hover:bg-green-50 hover:text-green-700 transition-all duration-200 disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
    </nav>
  );
}