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
  type: string;
  fixable: boolean;
}

export async function validateData(data: any[], headers: string[], allFiles?: any[]): Promise<ValidationResult> {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const info: ValidationIssue[] = [];

  // Core Validation Rules Implementation
  
  // 1. Missing required columns
  const requiredColumns = detectRequiredColumns(data, headers);
  const missingColumns = requiredColumns.filter(col => !headers.includes(col));
  missingColumns.forEach(col => {
    errors.push({
      message: `Missing required column: ${col}`,
      severity: 'error',
      type: 'missing_required_column',
      fixable: false
    });
  });

  // 2. Duplicate IDs validation
  const idColumns = headers.filter(h => 
    h.toLowerCase().includes('id') && 
    (h.toLowerCase().includes('client') || h.toLowerCase().includes('worker') || h.toLowerCase().includes('task'))
  );
  
  idColumns.forEach(idColumn => {
    const duplicates = findDuplicates(data, idColumn);
    duplicates.forEach(duplicate => {
      duplicate.indices.forEach(index => {
        errors.push({
          message: `Duplicate ${idColumn}: ${duplicate.value} (found ${duplicate.indices.length} times)`,
          severity: 'error',
          location: { row: index, column: idColumn },
          value: duplicate.value,
          type: 'duplicate_id',
          fixable: false
        });
      });
    });
  });

  // Row-level validations
  data.forEach((row, rowIndex) => {
    headers.forEach(header => {
      const value = row[header];
      const lowerHeader = header.toLowerCase();
      
      // 3. Missing required fields
      if (isRequiredField(header, data) && (value === null || value === undefined || value === '')) {
        errors.push({
          message: `Missing required value for ${header}`,
          severity: 'error',
          location: { row: rowIndex, column: header },
          value,
          type: 'missing_required',
          fixable: true
        });
        return;
      }
      
      // Skip validation for empty values (already handled above)
      if (!value || value === '') return;
      
      // 4. Enhanced data type validation for specific columns
      if (lowerHeader.includes('prioritylevel') || lowerHeader.includes('priority')) {
        const priority = Number(value);
        if (isNaN(priority)) {
          errors.push({
            message: `${header} must be a number, got: ${value}`,
            severity: 'error',
            location: { row: rowIndex, column: header },
            value,
            type: 'invalid_data_type',
            fixable: true
          });
        } else {
          const priorityRange = detectPriorityRange(data, header);
          if (!isInRange(priority, priorityRange.min, priorityRange.max)) {
            errors.push({
              message: `${header} ${value} out of detected range (${priorityRange.min}-${priorityRange.max})`,
              severity: 'error',
              location: { row: rowIndex, column: header },
              value,
              type: 'out_of_range',
              fixable: true
            });
          }
        }
      }
      
      // 5. Enhanced validation for AvailableSlots and PreferredPhases
      if (lowerHeader.includes('availableslots') || lowerHeader.includes('preferredphases') || lowerHeader.includes('phases')) {
        const validationResult = validatePhaseColumn(value, header);
        if (!validationResult.isValid) {
          errors.push({
            message: `Invalid format in ${header}: ${validationResult.error}. Expected: JSON array [1,2,3], range 1-3, or comma-separated 1,2,3`,
            severity: 'error',
            location: { row: rowIndex, column: header },
            value,
            type: 'invalid_phase_format',
            fixable: true
          });
        }
        
        // Check for data type consistency within the column
        const columnValues = data.map(r => r[header]).filter(v => v);
        const formats = columnValues.map(v => detectPhaseFormat(String(v)));
        const uniqueFormats = [...new Set(formats)];
        
        if (uniqueFormats.length > 1 && !uniqueFormats.includes('invalid')) {
          warnings.push({
            message: `Inconsistent formats in ${header}: found ${uniqueFormats.join(', ')} formats. Consider standardizing to one format.`,
            severity: 'warning',
            location: { row: rowIndex, column: header },
            value,
            type: 'format_inconsistency',
            fixable: true
          });
        }
      }
      
      // 6. Skills validation with data type consistency
      if (lowerHeader.includes('skills') || lowerHeader.includes('requiredskills')) {
        const validationResult = validateSkillsColumn(value, header);
        if (!validationResult.isValid) {
          errors.push({
            message: `Invalid skills format in ${header}: ${validationResult.error}`,
            severity: 'error',
            location: { row: rowIndex, column: header },
            value,
            type: 'invalid_skills_format',
            fixable: true
          });
        }
      }
      
      // 7. Duration validation
      if (lowerHeader.includes('duration')) {
        const duration = Number(value);
        if (isNaN(duration)) {
          errors.push({
            message: `Duration must be a number, got: ${value}`,
            severity: 'error',
            location: { row: rowIndex, column: header },
            value,
            type: 'invalid_data_type',
            fixable: true
          });
        } else {
          const minDuration = detectMinimumDuration(data, header);
          if (duration < minDuration) {
            errors.push({
              message: `Duration ${value} must be >= ${minDuration} (based on data analysis)`,
              severity: 'error',
              location: { row: rowIndex, column: header },
              value,
              type: 'out_of_range',
              fixable: true
            });
          }
        }
      }
      
      // 8. MaxConcurrent validation
      if (lowerHeader.includes('maxconcurrent')) {
        const maxConcurrent = Number(value);
        if (isNaN(maxConcurrent)) {
          errors.push({
            message: `MaxConcurrent must be a number, got: ${value}`,
            severity: 'error',
            location: { row: rowIndex, column: header },
            value,
            type: 'invalid_data_type',
            fixable: true
          });
        } else if (maxConcurrent < 1) {
          errors.push({
            message: `MaxConcurrent must be >= 1, got: ${value}`,
            severity: 'error',
            location: { row: rowIndex, column: header },
            value,
            type: 'out_of_range',
            fixable: true
          });
        }
      }
      
      // 9. Broken JSON in AttributesJSON
      if (lowerHeader.includes('json') || lowerHeader.includes('attributes')) {
        if (!isValidJSON(value)) {
          errors.push({
            message: `Malformed JSON in ${header}: ${value}`,
            severity: 'error',
            location: { row: rowIndex, column: header },
            value,
            type: 'malformed_json',
            fixable: true
          });
        }
      }
      
      // 10. RequestedTaskIDs validation (if we have task data)
      if (lowerHeader.includes('requestedtaskids') && allFiles) {
        const taskFile = allFiles.find(f => 
          f.headers.some((h: string) => h.toLowerCase().includes('taskid'))
        );
        
        if (taskFile) {
          const availableTaskIds = taskFile.data.map((r: any) => r.TaskID).filter((id: any) => id);
          const requestedIds = parseTaskList(value);
          const invalidIds = requestedIds.filter(id => !availableTaskIds.includes(id));
          
          if (invalidIds.length > 0) {
            errors.push({
              message: `Unknown task references: ${invalidIds.join(', ')}`,
              severity: 'error',
              location: { row: rowIndex, column: header },
              value,
              type: 'unknown_reference',
              fixable: false
            });
          }
        }
      }
      
      // Additional validations...
      
      // Email validation
      if (lowerHeader.includes('email')) {
        if (!isValidEmail(value)) {
          errors.push({
            message: `Invalid email format: ${value}`,
            severity: 'error',
            location: { row: rowIndex, column: header },
            value,
            type: 'invalid_email',
            fixable: true
          });
        }
      }
      
      // Phone number validation
      if (lowerHeader.includes('phone')) {
        if (!isValidPhoneNumber(value)) {
          warnings.push({
            message: `Invalid phone number format: ${value}`,
            severity: 'warning',
            location: { row: rowIndex, column: header },
            value,
            type: 'invalid_phone',
            fixable: true
          });
        }
      }
      
      // URL validation
      if (lowerHeader.includes('url') || lowerHeader.includes('website')) {
        if (!isValidURL(value)) {
          warnings.push({
            message: `Invalid URL format: ${value}`,
            severity: 'warning',
            location: { row: rowIndex, column: header },
            value,
            type: 'invalid_url',
            fixable: true
          });
        }
      }
    });
  });

  // Dynamic outlier detection (no hardcoded values)
  const outliers = detectDynamicOutliers(data, headers);
  info.push(...outliers);

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

// Helper functions

function validatePhaseColumn(value: string, columnName: string): { isValid: boolean; error?: string } {
  if (!value) return { isValid: false, error: 'Empty value' };
  
  const strValue = String(value).trim();
  
  // Try JSON array format: [1,2,3]
  if (strValue.startsWith('[') && strValue.endsWith(']')) {
    try {
      const parsed = JSON.parse(strValue);
      if (Array.isArray(parsed) && parsed.every(item => !isNaN(Number(item)))) {
        return { isValid: true };
      }
      return { isValid: false, error: 'JSON array must contain only numbers' };
    } catch {
      return { isValid: false, error: 'Invalid JSON array format' };
    }
  }
  
  // Try range format: 1-3, 1 - 3
  if (/^\d+\s*-\s*\d+$/.test(strValue)) {
    const parts = strValue.split('-').map(s => parseInt(s.trim()));
    if (parts.length === 2 && parts[0] <= parts[1]) {
      return { isValid: true };
    }
    return { isValid: false, error: 'Invalid range format (start must be <= end)' };
  }
  
  // Try comma-separated: 1,2,3
  if (/^\d+(\s*,\s*\d+)*$/.test(strValue)) {
    return { isValid: true };
  }
  
  // Try single value: 1, [2]
  if (/^\[?\d+\]?$/.test(strValue)) {
    return { isValid: true };
  }
  
  return { isValid: false, error: 'Must be JSON array [1,2,3], range 1-3, or comma-separated 1,2,3' };
}

function validateSkillsColumn(value: string, columnName: string): { isValid: boolean; error?: string } {
  if (!value) return { isValid: false, error: 'Empty value' };
  
  const strValue = String(value).trim();
  
  // Try JSON array format
  if (strValue.startsWith('[') && strValue.endsWith(']')) {
    try {
      const parsed = JSON.parse(strValue);
      if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
        return { isValid: true };
      }
      return { isValid: false, error: 'JSON array must contain only strings' };
    } catch {
      return { isValid: false, error: 'Invalid JSON array format' };
    }
  }
  
  // Try comma-separated format
  if (strValue.includes(',')) {
    const skills = strValue.split(',').map(s => s.trim());
    if (skills.every(skill => skill.length > 0)) {
      return { isValid: true };
    }
    return { isValid: false, error: 'Comma-separated skills cannot be empty' };
  }
  
  // Single skill
  if (strValue.length > 0) {
    return { isValid: true };
  }
  
  return { isValid: false, error: 'Must be JSON array ["skill1","skill2"] or comma-separated skill1,skill2' };
}

function detectPhaseFormat(value: string): string {
  const strValue = String(value).trim();
  
  if (strValue.startsWith('[') && strValue.endsWith(']')) {
    try {
      const parsed = JSON.parse(strValue);
      if (Array.isArray(parsed)) return 'json_array';
    } catch {}
    return 'invalid';
  }
  
  if (/^\d+\s*-\s*\d+$/.test(strValue)) {
    return 'range';
  }
  
  if (/^\d+(\s*,\s*\d+)*$/.test(strValue)) {
    return 'comma_separated';
  }
  
  if (/^\[?\d+\]?$/.test(strValue)) {
    return 'single_value';
  }
  
  return 'invalid';
}

function parseTaskList(taskString: string): string[] {
  if (!taskString) return [];
  
  try {
    const parsed = JSON.parse(taskString);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    return taskString.split(',').map(s => s.trim()).filter(s => s);
  }
  
  return [];
}

function detectRequiredColumns(data: any[], headers: string[]): string[] {
  const requiredColumns = [];
  
  for (const header of headers) {
    const values = data.map(row => row[header]);
    const nullCount = values.filter(val => val === null || val === undefined || val === '').length;
    const nullPercentage = (nullCount / values.length) * 100;
    
    if (nullPercentage < 5) {
      requiredColumns.push(header);
    }
  }
  
  return requiredColumns;
}

function detectPriorityRange(data: any[], header: string): { min: number; max: number } {
  const values = data.map(row => Number(row[header])).filter(val => !isNaN(val));
  
  if (values.length === 0) return { min: 1, max: 5 };
  
  return {
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

function detectMinimumDuration(data: any[], header: string): number {
  const values = data.map(row => Number(row[header])).filter(val => !isNaN(val) && val > 0);
  
  if (values.length === 0) return 1;
  
  return Math.min(...values);
}

function isRequiredField(header: string, data: any[]): boolean {
  const values = data.map(row => row[header]);
  const nullCount = values.filter(val => val === null || val === undefined || val === '').length;
  const nullPercentage = (nullCount / values.length) * 100;
  
  return nullPercentage < 10;
}

function isInRange(value: any, min: number, max: number): boolean {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
}

function isValidJSON(jsonString: string): boolean {
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function findDuplicates(data: any[], column: string) {
  const valueMap = new Map<any, number[]>();
  
  data.forEach((row, index) => {
    const value = row[column];
    if (value !== null && value !== undefined && value !== '') {
      if (valueMap.has(value)) {
        valueMap.get(value)!.push(index);
      } else {
        valueMap.set(value, [index]);
      }
    }
  });
  
  return Array.from(valueMap.entries())
    .filter(([_, indices]) => indices.length > 1)
    .map(([value, indices]) => ({ value, indices }));
}

function detectDynamicOutliers(data: any[], headers: string[]): ValidationIssue[] {
  const outliers: ValidationIssue[] = [];
  
  const numericHeaders = headers.filter(header => {
    const values = data.map(row => row[header])
      .filter(val => val !== null && val !== '' && !isNaN(Number(val)));
    return values.length > data.length * 0.5;
  });
  
  numericHeaders.forEach(header => {
    const values = data.map(row => row[header])
      .filter(val => val !== null && val !== '' && !isNaN(Number(val)))
      .map(val => Number(val));
    
    if (values.length < 5) return;
    
    const q1 = quantile(values, 0.25);
    const q3 = quantile(values, 0.75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    data.forEach((row, index) => {
      const value = Number(row[header]);
      if (!isNaN(value) && (value < lowerBound || value > upperBound)) {
        outliers.push({
          message: `Potential outlier in ${header}: ${value} (typical range: ${lowerBound.toFixed(2)} - ${upperBound.toFixed(2)})`,
          severity: 'info',
          location: { row: index, column: header },
          value,
          type: 'outlier',
          fixable: false
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