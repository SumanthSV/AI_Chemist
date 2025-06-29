'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  TrendingUp,
  Database
} from 'lucide-react';

interface ValidationSummaryProps {
  results: {
    errors: any[];
    warnings: any[];
    info: any[];
    summary: {
      totalIssues: number;
      errorCount: number;
      warningCount: number;
      infoCount: number;
    };
  };
  totalRows: number;
  fileName: string;
}

export default function ValidationSummary({ results, totalRows, fileName }: ValidationSummaryProps) {
  const { summary } = results;
  const cleanRows = totalRows - summary.totalIssues;
  const qualityScore = totalRows > 0 ? Math.round((cleanRows / totalRows) * 100) : 100;

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityBadge = (score: number) => {
    if (score >= 90) return { variant: 'default' as const, label: 'Excellent' };
    if (score >= 70) return { variant: 'secondary' as const, label: 'Good' };
    return { variant: 'destructive' as const, label: 'Needs Work' };
  };

  const qualityBadge = getQualityBadge(qualityScore);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Data Quality Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-200 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className={`text-2xl font-bold ${getQualityColor(qualityScore)}`}>
                  {qualityScore}%
                </p>
                <p className="text-sm text-blue-600 font-medium">Quality Score</p>
                <Badge variant={qualityBadge.variant} className="mt-1 text-xs">
                  {qualityBadge.label}
                </Badge>
              </div>
            </div>
            <Progress value={qualityScore} className="mt-3 h-2" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Critical Errors */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-700">
                  {summary.errorCount}
                </p>
                <p className="text-sm text-red-600 font-medium">Critical Errors</p>
                {summary.errorCount > 0 && (
                  <Badge variant="destructive" className="mt-1 text-xs">
                    Must Fix
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Warnings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-700">
                  {summary.warningCount}
                </p>
                <p className="text-sm text-yellow-600 font-medium">Warnings</p>
                {summary.warningCount > 0 && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    Review
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Info Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-200 rounded-lg">
                <Info className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">
                  {summary.infoCount}
                </p>
                <p className="text-sm text-blue-600 font-medium">Info Items</p>
                {summary.infoCount > 0 && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    Optional
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Clean Rows */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-200 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">
                  {cleanRows}
                </p>
                <p className="text-sm text-green-600 font-medium">Clean Rows</p>
                <p className="text-xs text-green-500 mt-1">
                  of {totalRows} total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}