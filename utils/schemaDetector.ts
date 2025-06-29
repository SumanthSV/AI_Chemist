export interface SchemaInfo {
  keyColumns: string[];
  dataTypes: Record<string, string>;
  patterns: string[];
  constraints: string[];
  relationships: Array<{
    column: string;
    relatedTable: string;
    relatedColumn: string;
    confidence: number;
  }>;
}

export async function detectSchema(data: any[], headers: string[]): Promise<SchemaInfo> {
  const keyColumns = detectKeyColumns(data, headers);
  const dataTypes = inferDataTypes(data, headers);
  const patterns = detectPatterns(data, headers);
  const constraints = detectConstraints(data, headers);

  return {
    keyColumns,
    dataTypes,
    patterns,
    constraints,
    relationships: []
  };
}

export async function suggestRelationships(files: any[], currentFile: any): Promise<Array<{
  sourceColumn: string;
  targetFile: string;
  targetColumn: string;
  confidence: number;
}>> {
  const relationships = [];
  
  for (const file of files) {
    if (file.id === currentFile.id) continue;
    
    // Compare column names and data patterns
    for (const sourceCol of currentFile.headers) {
      for (const targetCol of file.headers) {
        const confidence = calculateColumnSimilarity(
          sourceCol,
          targetCol,
          currentFile.data.map((row: any) => row[sourceCol]),
          file.data.map((row: any) => row[targetCol])
        );
        
        if (confidence > 0.7) {
          relationships.push({
            sourceColumn: sourceCol,
            targetFile: file.name,
            targetColumn: targetCol,
            confidence
          });
        }
      }
    }
  }
  
  return relationships.sort((a, b) => b.confidence - a.confidence);
}

function detectKeyColumns(data: any[], headers: string[]): string[] {
  const keyColumns = [];
  
  for (const header of headers) {
    const values = data.map(row => row[header]).filter(val => val !== null && val !== '');
    const uniqueValues = new Set(values);
    
    // Check if column has unique values (potential primary key)
    if (uniqueValues.size === values.length && values.length > 0) {
      keyColumns.push(header);
    }
    
    // Check for common key column names
    const lowerHeader = header.toLowerCase();
    if (lowerHeader.includes('id') || lowerHeader.includes('key') || lowerHeader === 'email') {
      if (!keyColumns.includes(header)) {
        keyColumns.push(header);
      }
    }
  }
  
  return keyColumns;
}

function inferDataTypes(data: any[], headers: string[]): Record<string, string> {
  const types: Record<string, string> = {};
  
  headers.forEach(header => {
    const values = data.map(row => row[header]).filter(val => val !== null && val !== '');
    
    if (values.length === 0) {
      types[header] = 'unknown';
      return;
    }
    
    const sample = values.slice(0, Math.min(100, values.length));
    
    // Check for numbers
    if (sample.every(val => !isNaN(Number(val)) && val !== '')) {
      types[header] = sample.some(val => String(val).includes('.')) ? 'decimal' : 'integer';
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
      ['true', 'false', '1', '0', 'yes', 'no', 'y', 'n'].includes(String(val).toLowerCase())
    )) {
      types[header] = 'boolean';
      return;
    }
    
    // Check for emails
    if (sample.some(val => String(val).includes('@') && String(val).includes('.'))) {
      types[header] = 'email';
      return;
    }
    
    // Check for URLs
    if (sample.some(val => String(val).startsWith('http'))) {
      types[header] = 'url';
      return;
    }
    
    // Default to string
    types[header] = 'text';
  });
  
  return types;
}

function detectPatterns(data: any[], headers: string[]): string[] {
  const patterns = [];
  
  // Check for common patterns
  headers.forEach(header => {
    const values = data.map(row => row[header]).filter(val => val !== null && val !== '');
    
    if (values.length === 0) return;
    
    // Phone number pattern
    if (values.some(val => /^\+?[\d\s\-\(\)]+$/.test(String(val)))) {
      patterns.push(`${header}: Phone number format detected`);
    }
    
    // Currency pattern
    if (values.some(val => /^\$?[\d,]+\.?\d*$/.test(String(val)))) {
      patterns.push(`${header}: Currency format detected`);
    }
    
    // Percentage pattern
    if (values.some(val => String(val).includes('%'))) {
      patterns.push(`${header}: Percentage format detected`);
    }
    
    // Code pattern (alphanumeric with specific length)
    const lengths = values.map(val => String(val).length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    if (avgLength > 5 && avgLength < 20 && values.every(val => /^[A-Z0-9\-_]+$/i.test(String(val)))) {
      patterns.push(`${header}: Code/ID pattern detected`);
    }
  });
  
  return patterns;
}

function detectConstraints(data: any[], headers: string[]): string[] {
  const constraints = [];
  
  headers.forEach(header => {
    const values = data.map(row => row[header]).filter(val => val !== null && val !== '');
    
    // Check for required fields (low null percentage)
    const nullCount = data.length - values.length;
    const nullPercentage = (nullCount / data.length) * 100;
    
    if (nullPercentage < 5) {
      constraints.push(`${header}: Required field (${nullPercentage.toFixed(1)}% null)`);
    }
    
    // Check for enumerated values
    const uniqueValues = new Set(values);
    if (uniqueValues.size <= 10 && values.length > 10) {
      constraints.push(`${header}: Enumerated values (${uniqueValues.size} distinct)`);
    }
    
    // Check for numeric ranges
    if (values.every(val => !isNaN(Number(val)))) {
      const numbers = values.map(val => Number(val));
      const min = Math.min(...numbers);
      const max = Math.max(...numbers);
      constraints.push(`${header}: Numeric range ${min} to ${max}`);
    }
  });
  
  return constraints;
}

function calculateColumnSimilarity(
  col1Name: string,
  col2Name: string,
  col1Data: any[],
  col2Data: any[]
): number {
  let similarity = 0;
  
  // Name similarity
  const nameSimilarity = calculateStringSimilarity(col1Name.toLowerCase(), col2Name.toLowerCase());
  similarity += nameSimilarity * 0.4;
  
  // Data type similarity
  const type1 = inferColumnType(col1Data);
  const type2 = inferColumnType(col2Data);
  if (type1 === type2) {
    similarity += 0.3;
  }
  
  // Value overlap similarity
  const set1 = new Set(col1Data.slice(0, 100));
  const set2 = new Set(col2Data.slice(0, 100));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  const overlapSimilarity = intersection.size / union.size;
  similarity += overlapSimilarity * 0.3;
  
  return Math.min(similarity, 1);
}

function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

function inferColumnType(data: any[]): string {
  const sample = data.filter(val => val !== null && val !== '').slice(0, 50);
  
  if (sample.length === 0) return 'unknown';
  
  if (sample.every(val => !isNaN(Number(val)))) return 'number';
  if (sample.every(val => !isNaN(Date.parse(val)))) return 'date';
  if (sample.some(val => String(val).includes('@'))) return 'email';
  
  return 'text';
}