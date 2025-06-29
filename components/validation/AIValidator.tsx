'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { fixDataWithAI } from '@/utils/aiFixer';
import { 
  Sparkles, 
  Wand2, 
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface AIValidatorProps {
  fileData: any[];
  headers: string[];
  validationResults: any;
  onSuggestionsReceived: (suggestions: any[]) => void;
}

export default function AIValidator({ 
  fileData, 
  headers, 
  validationResults, 
  onSuggestionsReceived 
}: AIValidatorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastFixResults, setLastFixResults] = useState<any>(null);

  const handleAIFix = async () => {
    if (!validationResults.errors?.length && !validationResults.warnings?.length) {
      toast.info('No issues found to fix');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const suggestions = await fixDataWithAI(
        fileData,
        headers,
        validationResults
      );

      clearInterval(progressInterval);
      setProgress(100);

      setLastFixResults({
        totalSuggestions: suggestions.length,
        criticalFixes: suggestions.filter(s => s.severity === 'error').length,
        warningFixes: suggestions.filter(s => s.severity === 'warning').length,
        timestamp: new Date()
      });

      onSuggestionsReceived(suggestions);
      toast.success(`AI generated ${suggestions.length} fix suggestions`);
    } catch (error) {
      toast.error('AI fix failed: ' + error);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const hasIssues = validationResults.errors?.length > 0 || validationResults.warnings?.length > 0;

  return (
    <div className="space-y-4">
      <Button
        onClick={handleAIFix}
        disabled={isProcessing || !hasIssues}
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Wand2 className="h-4 w-4 mr-2" />
        )}
        {isProcessing ? 'AI Processing...' : 'AI Auto-Fix'}
      </Button>

      {isProcessing && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
              <span className="font-medium text-purple-800">
                AI is analyzing your data...
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-purple-600 mt-2">
              {progress < 30 ? 'Analyzing data patterns...' :
               progress < 60 ? 'Generating fix suggestions...' :
               progress < 90 ? 'Validating solutions...' :
               'Finalizing recommendations...'}
            </p>
          </CardContent>
        </Card>
      )}

      {lastFixResults && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-800 text-lg">
              <CheckCircle2 className="h-5 w-5" />
              AI Fix Results
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-700">
                  {lastFixResults.totalSuggestions}
                </p>
                <p className="text-sm text-green-600">Total Fixes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {lastFixResults.criticalFixes}
                </p>
                <p className="text-sm text-red-500">Critical</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {lastFixResults.warningFixes}
                </p>
                <p className="text-sm text-yellow-500">Warnings</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-xs text-green-600">
                Generated at {lastFixResults.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}