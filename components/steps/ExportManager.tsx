'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useDataStore } from '@/store/dataStore';
import { exportPackage } from '@/utils/zipExporter';
import { 
  Package, 
  Download, 
  FileText, 
  Settings, 
  Target,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Database
} from 'lucide-react';
import { toast } from 'sonner';

export default function ExportManager() {
  const { files, rules, priorities } = useDataStore();
  const [exportOptions, setExportOptions] = useState({
    includeCleanedData: true,
    includeOriginalData: false,
    includeRules: true,
    includePriorities: true,
    includeValidationReport: true,
    includeMetadata: true
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportPackage({
        files,
        rules,
        priorities,
        options: exportOptions
      });
      
      setExportComplete(true);
      toast.success('Data package exported successfully!');
    } catch (error) {
      toast.error('Export failed: ' + error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportItems = [
    {
      id: 'includeCleanedData',
      label: 'Cleaned Data Files',
      description: 'Processed and validated data files',
      icon: FileText,
      required: true
    },
    {
      id: 'includeOriginalData',
      label: 'Original Data Files',
      description: 'Unmodified source files for reference',
      icon: FileText,
      required: false
    },
    {
      id: 'includeRules',
      label: 'Business Rules',
      description: 'JSON file with all defined rules',
      icon: Settings,
      required: false
    },
    {
      id: 'includePriorities',
      label: 'Priority Configuration',
      description: 'Weight settings and preferences',
      icon: Target,
      required: false
    },
    {
      id: 'includeValidationReport',
      label: 'Validation Report',
      description: 'Summary of data quality issues',
      icon: CheckCircle2,
      required: false
    },
    {
      id: 'includeMetadata',
      label: 'Processing Metadata',
      description: 'Timestamps and processing details',
      icon: Package,
      required: false
    }
  ];

  const updateExportOption = (optionId: string, value: boolean) => {
    setExportOptions(prev => ({
      ...prev,
      [optionId]: value
    }));
  };

  if (exportComplete) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="text-center"
            >
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Export Complete!
              </h1>
              <p className="text-gray-600 mb-6">
                Your data package has been successfully created and downloaded
              </p>
              
              <div className="flex gap-4 justify-center">
                <Button onClick={() => setExportComplete(false)}>
                  Export Another Package
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Start New Project
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent mb-2">
              Export Data Package
            </h1>
            <p className="text-gray-600 font-medium text-sm lg:text-base">
              Bundle your processed data, rules, and configurations for download
            </p>
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
              <Package className="h-3 w-3 mr-1" />
              Ready to Export
            </Badge>
          </div>
        </div>

        {/* Package Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{files.length}</p>
                    <p className="text-sm text-gray-600">Data Files</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Settings className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{rules.length}</p>
                    <p className="text-sm text-gray-600">Business Rules</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{priorities.length}</p>
                    <p className="text-sm text-gray-600">Priority Fields</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Export Options */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 pb-3">
            <CardTitle className="text-lg">Export Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {exportItems.map((item, index) => {
              const IconComponent = item.icon;
              const isChecked = exportOptions[item.id as keyof typeof exportOptions];
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:shadow-sm transition-all"
                >
                  <Checkbox
                    id={item.id}
                    checked={isChecked}
                    onCheckedChange={(checked) => 
                      updateExportOption(item.id, checked as boolean)
                    }
                    disabled={item.required}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <IconComponent className="h-4 w-4 text-gray-500" />
                      <label 
                        htmlFor={item.id}
                        className="font-medium cursor-pointer"
                      >
                        {item.label}
                      </label>
                      {item.required && (
                        <Badge variant="secondary" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>

        {/* File Preview */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 pb-3">
            <CardTitle className="text-lg">Package Contents Preview</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {files.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">{file.name}</span>
                  <Badge variant="outline">{file.data.length} rows</Badge>
                </div>
              ))}
              
              {exportOptions.includeRules && rules.length > 0 && (
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <Settings className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">business_rules.json</span>
                  <Badge variant="outline">{rules.length} rules</Badge>
                </div>
              )}
              
              {exportOptions.includePriorities && priorities.length > 0 && (
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <Target className="h-4 w-4 text-green-500" />
                  <span className="font-medium">priorities.json</span>
                  <Badge variant="outline">{priorities.length} fields</Badge>
                </div>
              )}
              
              {exportOptions.includeValidationReport && (
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <CheckCircle2 className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">validation_report.json</span>
                  <Badge variant="outline">Quality Report</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Export Button */}
        <div className="flex justify-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              onClick={handleExport}
              disabled={isExporting}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-6 text-lg text-white font-semibold shadow-lg hover:shadow-xl"
            >
              {isExporting ? (
                <>
                  <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                  Creating Package...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Download Complete Package
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}