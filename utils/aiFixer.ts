interface AIFixSuggestion {
  row: number;
  column: string;
  before: any;
  after: any;
  description: string;
  confidence: number;
  severity: 'error' | 'warning';
}

export async function fixDataWithAI(
  data: any[],
  headers: string[],
  validationResults: any
): Promise<AIFixSuggestion[]> {
  const suggestions: AIFixSuggestion[] = [];
  
  // Process errors first (higher priority)
  for (const error of validationResults.errors || []) {
    if (error.fixable && error.location) {
      const suggestion = await generateFixSuggestion(data, error, 'error');
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }
  }
  
  // Process warnings
  for (const warning of validationResults.warnings || []) {
    if (warning.fixable && warning.location) {
      const suggestion = await generateFixSuggestion(data, warning, 'warning');
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }
  }
  
  return suggestions;
}

async function generateFixSuggestion(
  data: any[],
  issue: any,
  severity: 'error' | 'warning'
): Promise<AIFixSuggestion | null> {
  const { row, column } = issue.location;
  const currentValue = data[row][column];
  
  let fixedValue: any = null;
  let description = '';
  let confidence = 0.8;
  
  switch (issue.type) {
    case 'missing_required':
      fixedValue = generateDefaultValue(column, data);
      description = `Fill missing ${column} with inferred default value`;
      confidence = 0.6;
      break;
      
    case 'invalid_email':
      fixedValue = fixEmailFormat(currentValue);
      description = `Fix email format`;
      confidence = 0.9;
      break;
      
    case 'malformed_json':
      fixedValue = fixJSONFormat(currentValue);
      description = `Fix malformed JSON`;
      confidence = 0.7;
      break;
      
    case 'invalid_array':
      fixedValue = fixArrayFormat(currentValue);
      description = `Convert to proper array format`;
      confidence = 0.8;
      break;
      
    case 'invalid_type':
      fixedValue = convertToCorrectType(currentValue, column, data);
      description = `Convert to correct data type`;
      confidence = 0.9;
      break;
      
    case 'out_of_range':
      fixedValue = clampToRange(currentValue, 1, 5);
      description = `Clamp value to valid range`;
      confidence = 0.8;
      break;
      
    case 'invalid_phone':
      fixedValue = fixPhoneFormat(currentValue);
      description = `Standardize phone number format`;
      confidence = 0.7;
      break;
      
    case 'invalid_url':
      fixedValue = fixURLFormat(currentValue);
      description = `Fix URL format`;
      confidence = 0.8;
      break;
      
    case 'inconsistent_format':
      fixedValue = standardizeFormat(currentValue, column, data);
      description = `Standardize format to match pattern`;
      confidence = 0.7;
      break;
      
    default:
      return null;
  }
  
  if (fixedValue !== null && fixedValue !== currentValue) {
    return {
      row,
      column,
      before: currentValue,
      after: fixedValue,
      description,
      confidence,
      severity
    };
  }
  
  return null;
}

function generateDefaultValue(column: string, data: any[]): any {
  const lowerColumn = column.toLowerCase();
  
  // Generate defaults based on column type
  if (lowerColumn.includes('email')) {
    return 'user@example.com';
  }
  
  if (lowerColumn.includes('name')) {
    return 'Unknown';
  }
  
  if (lowerColumn.includes('id')) {
    // Generate a unique ID
    const existingIds = data.map(row => row[column]).filter(val => val);
    const maxId = Math.max(...existingIds.map(id => parseInt(id) || 0));
    return String(maxId + 1);
  }
  
  if (lowerColumn.includes('date')) {
    return new Date().toISOString().split('T')[0];
  }
  
  if (lowerColumn.includes('phone')) {
    return '+1-555-0000';
  }
  
  // Analyze existing values to infer a good default
  const existingValues = data.map(row => row[column]).filter(val => val !== null && val !== '');
  if (existingValues.length > 0) {
    // Return the most common value
    const valueCounts = existingValues.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(valueCounts).reduce((a, b) => 
      valueCounts[a[0]] > valueCounts[b[0]] ? a : b
    )[0];
  }
  
  return 'N/A';
}

function fixEmailFormat(email: string): string {
  if (!email) return 'user@example.com';
  
  let fixed = String(email).toLowerCase().trim();
  
  // Add @ if missing
  if (!fixed.includes('@')) {
    fixed = fixed + '@example.com';
  }
  
  // Add domain if missing
  if (fixed.includes('@') && !fixed.includes('.')) {
    fixed = fixed + '.com';
  }
  
  // Remove extra spaces
  fixed = fixed.replace(/\s+/g, '');
  
  return fixed;
}

function fixJSONFormat(jsonString: string): string {
  if (!jsonString) return '{}';
  
  try {
    // Try to parse as-is first
    JSON.parse(jsonString);
    return jsonString;
  } catch {
    // Common fixes
    let fixed = String(jsonString);
    
    // Add quotes around keys
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    
    // Add quotes around string values
    fixed = fixed.replace(/:\s*([^",\[\]{}]+)(?=[,}])/g, ': "$1"');
    
    // Fix single quotes
    fixed = fixed.replace(/'/g, '"');
    
    // Ensure proper brackets
    if (!fixed.startsWith('{') && !fixed.startsWith('[')) {
      fixed = '{' + fixed + '}';
    }
    
    try {
      JSON.parse(fixed);
      return fixed;
    } catch {
      return '{}';
    }
  }
}

function fixArrayFormat(arrayString: string): string {
  if (!arrayString) return '[]';
  
  try {
    const parsed = JSON.parse(arrayString);
    if (Array.isArray(parsed)) return arrayString;
  } catch {
    // Try to convert comma-separated values
    const values = String(arrayString).split(',').map(v => v.trim());
    return JSON.stringify(values);
  }
  
  return '[]';
}

function convertToCorrectType(value: any, column: string, data: any[]): any {
  const lowerColumn = column.toLowerCase();
  
  if (lowerColumn.includes('number') || lowerColumn.includes('count') || lowerColumn.includes('amount')) {
    const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? 0 : num;
  }
  
  if (lowerColumn.includes('boolean') || lowerColumn.includes('active') || lowerColumn.includes('enabled')) {
    const str = String(value).toLowerCase();
    return ['true', '1', 'yes', 'y', 'on'].includes(str);
  }
  
  if (lowerColumn.includes('date')) {
    const date = new Date(value);
    return isNaN(date.getTime()) ? new Date().toISOString().split('T')[0] : date.toISOString().split('T')[0];
  }
  
  return String(value);
}

function clampToRange(value: any, min: number, max: number): number {
  const num = Number(value);
  if (isNaN(num)) return min;
  return Math.max(min, Math.min(max, num));
}

function fixPhoneFormat(phone: string): string {
  if (!phone) return '+1-555-0000';
  
  // Extract digits only
  const digits = String(phone).replace(/\D/g, '');
  
  if (digits.length === 10) {
    return `+1-${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits.slice(0, 1)}-${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  
  return phone; // Return original if can't fix
}

function fixURLFormat(url: string): string {
  if (!url) return 'https://example.com';
  
  let fixed = String(url).trim();
  
  // Add protocol if missing
  if (!fixed.startsWith('http://') && !fixed.startsWith('https://')) {
    fixed = 'https://' + fixed;
  }
  
  return fixed;
}

function standardizeFormat(value: string, column: string, data: any[]): string {
  // Find the most common format pattern
  const values = data.map(row => row[column]).filter(val => val);
  const patterns = values.map(val => 
    String(val).replace(/[a-zA-Z]/g, 'A').replace(/[0-9]/g, '9')
  );
  
  const patternCounts = patterns.reduce((acc, pattern) => {
    acc[pattern] = (acc[pattern] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mostCommonPattern = Object.entries(patternCounts).reduce((a, b) => 
    a[1] > b[1] ? a : b
  )[0];
  
  // Try to convert current value to match the pattern
  let fixed = String(value);
  
  // Simple pattern matching and conversion
  if (mostCommonPattern.includes('-')) {
    // Add dashes if missing
    const parts = fixed.replace(/[^a-zA-Z0-9]/g, '');
    if (mostCommonPattern === 'AAA-999') {
      fixed = parts.slice(0, 3) + '-' + parts.slice(3, 6);
    } else if (mostCommonPattern === '999-AAA') {
      fixed = parts.slice(0, 3) + '-' + parts.slice(3, 6);
    }
  }
  
  return fixed;
}

// Mock OpenAI integration for demonstration
export async function callOpenAIForFix(
  prompt: string,
  data: any
): Promise<string> {
  // This would be a real OpenAI API call in production
  // For now, return a mock response
  
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
  
  // Mock intelligent responses based on the prompt
  if (prompt.includes('email')) {
    return 'user@example.com';
  } else if (prompt.includes('JSON')) {
    return '{"key": "value"}';
  } else if (prompt.includes('phone')) {
    return '+1-555-0123';
  }
  
  return 'Fixed value';
}