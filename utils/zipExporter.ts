import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { DataFile, DataRule, PriorityWeight } from '@/store/dataStore';

interface ExportOptions {
  includeCleanedData: boolean;
  includeOriginalData: boolean;
  includeRules: boolean;
  includePriorities: boolean;
  includeValidationReport: boolean;
  includeMetadata: boolean;
}

interface ExportPackage {
  files: DataFile[];
  rules: DataRule[];
  priorities: PriorityWeight[];
  options: ExportOptions;
}

export async function exportPackage({
  files,
  rules,
  priorities,
  options
}: ExportPackage): Promise<void> {
  const zip = new JSZip();

  // Create main folders
  const dataFolder = zip.folder('data');
  const configFolder = zip.folder('config');
  const reportsFolder = zip.folder('reports');

  // Add cleaned data files
  if (options.includeCleanedData && dataFolder) {
    files.forEach(file => {
      const csvContent = convertToCSV(file.data, file.headers);
      dataFolder.file(`cleaned_${file.name}`, csvContent);
    });
  }

  // Add original data files (if available)
  if (options.includeOriginalData && dataFolder) {
    files.forEach(file => {
      // For demo purposes, we'll just add a placeholder
      // In a real app, you'd store the original file content
      dataFolder.file(`original_${file.name}`, 'Original file content would be here');
    });
  }

  // Add business rules
  if (options.includeRules && rules.length > 0 && configFolder) {
    const rulesContent = JSON.stringify(rules, null, 2);
    configFolder.file('business_rules.json', rulesContent);
  }

  // Add priorities configuration
  if (options.includePriorities && priorities.length > 0 && configFolder) {
    const prioritiesContent = JSON.stringify(priorities, null, 2);
    configFolder.file('priorities.json', prioritiesContent);
  }

  // Add validation report
  if (options.includeValidationReport && reportsFolder) {
    const validationReport = generateValidationReport(files);
    reportsFolder.file('validation_report.json', JSON.stringify(validationReport, null, 2));
  }

  // Add metadata
  if (options.includeMetadata && configFolder) {
    const metadata = {
      exportedAt: new Date().toISOString(),
      filesCount: files.length,
      rulesCount: rules.length,
      prioritiesCount: priorities.length,
      totalRows: files.reduce((sum, file) => sum + file.data.length, 0),
      version: '1.0.0',
      exportOptions: options
    };
    configFolder.file('metadata.json', JSON.stringify(metadata, null, 2));
  }

  // Add README
  const readme = generateReadme(files, rules, priorities);
  zip.file('README.md', readme);

  // Generate and download zip
  const blob = await zip.generateAsync({ type: 'blob' });
  const timestamp = new Date().toISOString().slice(0, 10);
  saveAs(blob, `data-alchemist-export-${timestamp}.zip`);
}

function convertToCSV(data: any[], headers: string[]): string {
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
}

function generateValidationReport(files: DataFile[]) {
  return {
    summary: {
      totalFiles: files.length,
      totalRows: files.reduce((sum, file) => sum + file.data.length, 0),
      totalErrors: files.reduce((sum, file) => sum + file.errors.length, 0),
      processedFiles: files.filter(f => f.processed).length
    },
    fileDetails: files.map(file => ({
      name: file.name,
      rows: file.data.length,
      columns: file.headers.length,
      errors: file.errors.length,
      processed: file.processed,
      uploadedAt: file.uploadedAt
    }))
  };
}

function generateReadme(files: DataFile[], rules: DataRule[], priorities: PriorityWeight[]): string {
  return `# Data Alchemist Export Package

This package contains your processed data files, business rules, and configuration settings.

## Contents

### Data Files (${files.length})
${files.map(file => `- **${file.name}**: ${file.data.length} rows, ${file.headers.length} columns`).join('\n')}

### Business Rules (${rules.length})
${rules.length > 0 ? rules.map(rule => `- **${rule.name}**: ${rule.type} rule`).join('\n') : 'No rules defined'}

### Priority Configuration (${priorities.length})
${priorities.length > 0 ? priorities.map(p => `- **${p.field}**: ${p.weight}% weight (${p.type})`).join('\n') : 'No priorities set'}

## File Structure

\`\`\`
/
├── data/                 # Processed data files
├── config/              # Configuration files
│   ├── business_rules.json
│   ├── priorities.json
│   └── metadata.json
├── reports/             # Validation and quality reports
│   └── validation_report.json
└── README.md           # This file
\`\`\`

## Usage

1. **Data Files**: Import the cleaned CSV files into your analysis tools
2. **Business Rules**: Use the JSON rules for validation in other systems
3. **Priorities**: Apply the weight configuration for decision making
4. **Reports**: Review validation results and data quality metrics

Generated by Data Alchemist on ${new Date().toISOString()}
`;
}