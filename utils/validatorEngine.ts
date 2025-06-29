export interface ValidationResult {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  info: ValidationIssue[];
  summary: {
    totalIssues: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
  };
}

export interface ValidationIssue {
  message: string;
  severity: 'error' | 'warning' | 'info';
  location?: {
    row: number;
    column: string;
  };
  value?: any;
}

export async function validateData(data: any[], headers: string[]): Promise<ValidationResult> {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const info: ValidationIssue[] = [];

  // Basic validations
  data.forEach((row, rowIndex) => {
    headers.forEach(header => {
      const value = row[header];
      
      // Check for missing values
      if (value === null || value === undefined || value === '') {
        warnings.push({
          message: `Missing value for ${header}`,
          severity: 'warning',
          location: { row: rowIndex, column: header },
          value
        });
      }
      
      // Email validation
      if (header.toLowerCase().includes('email') && value) {
        if (typeof value === 'string' && !isValidEmail(value)) {
          errors.push({
            message: `Invalid email format: ${value}`,
            severity: 'error',
            location: { row: rowIndex, column: header },
            value
          });
        }
      }
      
      // Number validation
      if (header.toLowerCase().includes('revenue') || header.toLowerCase().includes('amount') || header.toLowerCase().includes('price')) {
        if (value && isNaN(Number(value))) {
          errors.push({
            message: `Expected number but got: ${value}`,
            severity: 'error',
            location: { row: rowIndex, column: header },
            value
          });
        } else if (Number(value) < 0) {
          warnings.push({
            message: `Negative value found: ${value}`,
            severity: 'warning',
            location: { row: rowIndex, column: header },
            value
          });
        }
      }
      
      // Date validation
      if (header.toLowerCase().includes('date') && value) {
        if (isNaN(Date.parse(value))) {
          errors.push({
            message: `Invalid date format: ${value}`,
            severity: 'error',
            location: { row: rowIndex, column: header },
            value
          });
        }
      }
    });
  });

  // Duplicate detection
  const duplicateGroups = findDuplicates(data, headers);
  duplicateGroups.forEach(group => {
    if (group.indices.length > 1) {
      group.indices.forEach(index => {
        warnings.push({
          message: `Duplicate record detected (${group.indices.length} total)`,
          severity: 'warning',
          location: { row: index, column: headers[0] }
        });
      });
    }
  });

  // Outlier detection
  const outliers = detectOutliers(data, headers);
  outliers.forEach(outlier => {
    info.push({
      message: `Potential outlier detected: ${outlier.value}`,
      severity: 'info',
      location: { row: outlier.row, column: outlier.column },
      value: outlier.value
    });
  });

  return {
    errors,
    warnings,
    info,
    summary: {
      totalIssues: errors.length + warnings.length + info.length,
      errorCount: errors.length,
      warningCount: warnings.length,
      infoCount: info.length
    }
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function findDuplicates(data: any[], headers: string[]) {
  const groups: { key: string; indices: number[] }[] = [];
  const seen = new Map<string, number[]>();

  data.forEach((row, index) => {
    const key = headers.map(h => row[h]).join('|');
    if (seen.has(key)) {
      seen.get(key)!.push(index);
    } else {
      seen.set(key, [index]);
    }
  });

  seen.forEach((indices, key) => {
    groups.push({ key, indices });
  });

  return groups.filter(g => g.indices.length > 1);
}

function detectOutliers(data: any[], headers: string[]) {
  const outliers: { row: number; column: string; value: any }[] = [];
  
  headers.forEach(header => {
    const numericValues = data
      .map((row, index) => ({ value: Number(row[header]), index }))
      .filter(item => !isNaN(item.value));
    
    if (numericValues.length < 3) return;
    
    const values = numericValues.map(item => item.value);
    const q1 = quantile(values, 0.25);
    const q3 = quantile(values, 0.75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    numericValues.forEach(item => {
      if (item.value < lowerBound || item.value > upperBound) {
        outliers.push({
          row: item.index,
          column: header,
          value: item.value
        });
      }
    });
  });
  
  return outliers;
}

function quantile(arr: number[], q: number): number {
  const sorted = arr.slice().sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  } else {
    return sorted[base];
  }
}