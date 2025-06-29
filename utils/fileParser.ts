import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ParsedData {
  data: any[];
  headers: string[];
}

export async function parseFile(file: File): Promise<ParsedData> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'csv':
      return parseCsv(file);
    case 'xlsx':
    case 'xls':
      return parseExcel(file);
    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
}

function parseCsv(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => {
        // Clean and normalize headers
        return header.trim().replace(/[^\w\s]/g, '').replace(/\s+/g, '');
      },
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }
        
        const headers = results.meta.fields || [];
        const data = results.data;
        
        // Filter out completely empty rows
        const cleanData = data.filter((row: any) => {
          return Object.values(row).some(value => 
            value !== null && value !== undefined && String(value).trim() !== ''
          );
        });
        
        resolve({ data: cleanData, headers });
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

async function parseExcel(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const fileData = e.target?.result;
        const workbook = XLSX.read(fileData, { type: 'binary' });
        
        // Get the first worksheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '', // Default value for empty cells
          blankrows: false // Skip blank rows
        });
        
        if (jsonData.length === 0) {
          reject(new Error('Empty spreadsheet'));
          return;
        }
        
        // Extract and clean headers
        const rawHeaders = jsonData[0] as string[];
        const headers = rawHeaders.map(header => 
          String(header).trim().replace(/[^\w\s]/g, '').replace(/\s+/g, '')
        );
        
        // Convert data rows to objects
        const data = jsonData.slice(1)
          .filter((row: any) => {
            // Filter out completely empty rows
            return Array.isArray(row) && row.some(cell => 
              cell !== null && cell !== undefined && String(cell).trim() !== ''
            );
          })
          .map((row: any[]) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });
        
        resolve({ data, headers });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsBinaryString(file);
  });
}

export function normalizeHeaders(headers: string[]): string[] {
  return headers.map(header => {
    return header
      .trim()
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase();
  });
}

export function inferDataTypes(data: any[]): Record<string, string> {
  if (data.length === 0) return {};
  
  const types: Record<string, string> = {};
  const headers = Object.keys(data[0]);
  
  headers.forEach(header => {
    const values = data.map(row => row[header]).filter(val => val !== null && val !== '');
    
    if (values.length === 0) {
      types[header] = 'string';
      return;
    }
    
    const sample = values.slice(0, Math.min(100, values.length));
    
    // Check for numbers
    if (sample.every(val => !isNaN(Number(val)))) {
      types[header] = 'number';
      return;
    }
    
    // Check for dates
    if (sample.every(val => !isNaN(Date.parse(val)))) {
      types[header] = 'date';
      return;
    }
    
    // Check for booleans
    if (sample.every(val => 
      typeof val === 'boolean' || 
      ['true', 'false', '1', '0', 'yes', 'no'].includes(String(val).toLowerCase())
    )) {
      types[header] = 'boolean';
      return;
    }
    
    // Default to string
    types[header] = 'string';
  });
  
  return types;
}

// Enhanced validation for specific data patterns
export function validateDataStructure(data: any[], headers: string[]): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  if (data.length === 0) {
    issues.push('No data rows found');
    return { isValid: false, issues, suggestions };
  }
  
  // Check for common data quality issues
  headers.forEach(header => {
    const values = data.map(row => row[header]);
    const nonEmptyValues = values.filter(val => val !== null && val !== undefined && val !== '');
    
    // Check for high null percentage
    const nullPercentage = ((values.length - nonEmptyValues.length) / values.length) * 100;
    if (nullPercentage > 50) {
      issues.push(`Column '${header}' has ${nullPercentage.toFixed(1)}% missing values`);
    }
    
    // Check for data type consistency
    if (nonEmptyValues.length > 1) {
      const types = new Set(nonEmptyValues.map(val => typeof val));
      if (types.size > 1) {
        suggestions.push(`Column '${header}' has mixed data types`);
      }
    }
  });
  
  // Check for duplicate rows
  const uniqueRows = new Set(data.map(row => JSON.stringify(row)));
  if (uniqueRows.size < data.length) {
    const duplicateCount = data.length - uniqueRows.size;
    issues.push(`Found ${duplicateCount} duplicate rows`);
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  };
}