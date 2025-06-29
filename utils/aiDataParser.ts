export interface DataEntity {
  type: 'client' | 'worker' | 'task';
  requiredFields: string[];
  optionalFields: string[];
  patterns: {
    [key: string]: RegExp[];
  };
}

export interface ParsedFileResult {
  entityType: 'client' | 'worker' | 'task' | 'unknown';
  confidence: number;
  mappedHeaders: { [originalHeader: string]: string };
  suggestions: string[];
  data: any[];
  headers: string[];
  originalHeaders: string[];
}

// Define the expected data entities with more flexible patterns
const DATA_ENTITIES: DataEntity[] = [
  {
    type: 'client',
    requiredFields: ['ClientID', 'ClientName', 'PriorityLevel', 'RequestedTaskIDs', 'GroupTag'],
    optionalFields: ['AttributesJSON', 'Email', 'Phone', 'Region', 'Budget'],
    patterns: {
      ClientID: [/client.*id/i, /id.*client/i, /^id$/i, /customer.*id/i, /c_id/i, /cid/i],
      ClientName: [/client.*name/i, /name.*client/i, /customer.*name/i, /company/i, /organization/i, /client/i, /name/i],
      PriorityLevel: [/priority/i, /level/i, /importance/i, /urgency/i, /rank/i, /grade/i],
      RequestedTaskIDs: [/task.*id/i, /requested.*task/i, /task.*list/i, /tasks/i, /task_ids/i, /taskids/i],
      GroupTag: [/group/i, /tag/i, /category/i, /type/i, /segment/i, /team/i],
      AttributesJSON: [/attributes/i, /json/i, /metadata/i, /properties/i, /details/i, /info/i]
    }
  },
  {
    type: 'worker',
    requiredFields: ['WorkerID', 'WorkerName', 'Skills', 'AvailableSlots', 'MaxLoadPerPhase', 'WorkerGroup'],
    optionalFields: ['QualificationLevel', 'Email', 'Phone', 'Department', 'Location'],
    patterns: {
      WorkerID: [/worker.*id/i, /employee.*id/i, /staff.*id/i, /^id$/i, /w_id/i, /wid/i],
      WorkerName: [/worker.*name/i, /employee.*name/i, /staff.*name/i, /name/i, /worker/i],
      Skills: [/skill/i, /competenc/i, /abilit/i, /expertise/i, /qualification/i, /talent/i],
      AvailableSlots: [/available.*slot/i, /slot/i, /schedule/i, /availability/i, /time/i, /phases/i],
      MaxLoadPerPhase: [/max.*load/i, /capacity/i, /workload/i, /limit/i, /max.*phase/i],
      WorkerGroup: [/group/i, /team/i, /department/i, /division/i, /unit/i, /worker.*group/i],
      QualificationLevel: [/qualification/i, /level/i, /grade/i, /rank/i, /rating/i, /experience/i]
    }
  },
  {
    type: 'task',
    requiredFields: ['TaskID', 'TaskName', 'Category', 'Duration', 'RequiredSkills', 'PreferredPhases'],
    optionalFields: ['MaxConcurrent', 'Priority', 'Description', 'Deadline', 'Status'],
    patterns: {
      TaskID: [/task.*id/i, /job.*id/i, /^id$/i, /ticket.*id/i, /t_id/i, /tid/i],
      TaskName: [/task.*name/i, /job.*name/i, /title/i, /name/i, /description/i, /task/i],
      Category: [/category/i, /type/i, /kind/i, /classification/i, /genre/i, /class/i],
      Duration: [/duration/i, /time/i, /hours/i, /days/i, /length/i, /period/i, /estimate/i],
      RequiredSkills: [/required.*skill/i, /skill/i, /competenc/i, /requirement/i, /needed.*skill/i],
      PreferredPhases: [/phase/i, /stage/i, /step/i, /period/i, /timeline/i, /preferred.*phase/i],
      MaxConcurrent: [/max.*concurrent/i, /concurrent/i, /parallel/i, /simultaneous/i, /max.*parallel/i]
    }
  }
];

export async function parseFileWithAI(file: File, rawData: any[], rawHeaders: string[]): Promise<ParsedFileResult> {
  console.log('🤖 AI Parser: Starting analysis of', file.name);
  console.log('📊 Original headers:', rawHeaders);
  
  // Step 1: Detect entity type
  const entityDetection = detectEntityType(rawHeaders, rawData);
  console.log('🎯 Detected entity type:', entityDetection.entityType, 'with confidence:', entityDetection.confidence);
  
  // Step 2: Map headers using AI-like pattern matching
  const headerMapping = mapHeadersIntelligently(rawHeaders, entityDetection.entityType);
  console.log('🔄 Header mapping:', headerMapping);
  
  // Step 3: Validate and suggest improvements
  const validation = validateMappedData(rawData, headerMapping, entityDetection.entityType);
  
  // Step 4: Transform data according to mapping
  const transformedData = transformDataWithMapping(rawData, rawHeaders, headerMapping);
  
  return {
    entityType: entityDetection.entityType,
    confidence: entityDetection.confidence,
    mappedHeaders: headerMapping,
    suggestions: validation.suggestions,
    data: transformedData.data,
    headers: transformedData.headers,
    originalHeaders: rawHeaders
  };
}

function detectEntityType(headers: string[], data: any[]): { entityType: 'client' | 'worker' | 'task' | 'unknown'; confidence: number } {
  const scores = DATA_ENTITIES.map(entity => {
    let score = 0;
    let totalFields = entity.requiredFields.length + entity.optionalFields.length;
    
    // Check header matches with more flexible scoring
    headers.forEach(header => {
      const normalizedHeader = header.toLowerCase().trim().replace(/[^a-z]/g, '');
      
      [...entity.requiredFields, ...entity.optionalFields].forEach(field => {
        const patterns = entity.patterns[field] || [];
        const fieldMatch = patterns.some(pattern => pattern.test(header));
        
        if (fieldMatch) {
          score += entity.requiredFields.includes(field) ? 3 : 1.5;
        }
        
        // Exact match bonus
        if (normalizedHeader === field.toLowerCase().replace(/[^a-z]/g, '')) {
          score += 5;
        }
        
        // Partial match with higher threshold
        const fieldNormalized = field.toLowerCase().replace(/[^a-z]/g, '');
        if (normalizedHeader.includes(fieldNormalized) || fieldNormalized.includes(normalizedHeader)) {
          if (normalizedHeader.length > 2 && fieldNormalized.length > 2) {
            score += 1;
          }
        }
        
        // Similarity scoring
        const similarity = calculateSimilarity(normalizedHeader, fieldNormalized);
        if (similarity > 0.7) {
          score += similarity * 2;
        }
      });
    });
    
    // Enhanced data pattern analysis
    if (data.length > 0) {
      const sampleRows = data.slice(0, Math.min(5, data.length));
      
      sampleRows.forEach(row => {
        const values = Object.values(row);
        
        // Client-specific patterns
        if (entity.type === 'client') {
          // Look for task ID patterns in any field
          if (values.some(val => String(val).match(/T\d+/g))) {
            score += 3;
          }
          // Look for group patterns
          if (values.some(val => String(val).toLowerCase().includes('group'))) {
            score += 2;
          }
          // Look for priority numbers
          if (values.some(val => !isNaN(Number(val)) && Number(val) >= 1 && Number(val) <= 5)) {
            score += 1;
          }
        }
        
        // Worker-specific patterns
        if (entity.type === 'worker') {
          // Look for worker ID patterns
          if (values.some(val => String(val).match(/W\d+/g))) {
            score += 3;
          }
          // Look for skill lists
          if (values.some(val => String(val).includes(',') || String(val).includes('['))) {
            score += 2;
          }
          // Look for phase arrays
          if (values.some(val => String(val).includes('[') && String(val).includes(']'))) {
            score += 2;
          }
        }
        
        // Task-specific patterns
        if (entity.type === 'task') {
          // Look for task ID patterns
          if (values.some(val => String(val).match(/T\d+/g))) {
            score += 3;
          }
          // Look for duration numbers
          if (values.some(val => !isNaN(Number(val)) && Number(val) > 0 && Number(val) < 100)) {
            score += 1;
          }
          // Look for phase ranges
          if (values.some(val => String(val).match(/\d+\s*-\s*\d+/))) {
            score += 2;
          }
        }
      });
    }
    
    return {
      entity: entity.type,
      score: score / Math.max(totalFields, 1),
      rawScore: score
    };
  });
  
  const bestMatch = scores.reduce((best, current) => 
    current.score > best.score ? current : best
  );
  
  const confidence = Math.min(bestMatch.score / 3, 1.0); // Normalize confidence
  
  console.log('📊 Entity scores:', scores);
  console.log('🏆 Best match:', bestMatch, 'confidence:', confidence);
  
  return {
    entityType: confidence > 0.4 ? bestMatch.entity : 'unknown',
    confidence
  };
}

function mapHeadersIntelligently(rawHeaders: string[], entityType: 'client' | 'worker' | 'task' | 'unknown'): { [originalHeader: string]: string } {
  const mapping: { [originalHeader: string]: string } = {};
  
  if (entityType === 'unknown') {
    // Return identity mapping for unknown types
    rawHeaders.forEach(header => {
      mapping[header] = header;
    });
    return mapping;
  }
  
  const entity = DATA_ENTITIES.find(e => e.type === entityType);
  if (!entity) return mapping;
  
  const allFields = [...entity.requiredFields, ...entity.optionalFields];
  const usedFields = new Set<string>();
  
  // Create scoring matrix for all combinations
  const scoringMatrix: Array<{
    originalHeader: string;
    targetField: string;
    score: number;
  }> = [];
  
  rawHeaders.forEach(rawHeader => {
    allFields.forEach(field => {
      if (usedFields.has(field)) return;
      
      const score = calculateHeaderFieldScore(rawHeader, field, entity);
      scoringMatrix.push({
        originalHeader: rawHeader,
        targetField: field,
        score
      });
    });
  });
  
  // Sort by score and assign best matches
  scoringMatrix.sort((a, b) => b.score - a.score);
  
  const assignedHeaders = new Set<string>();
  
  scoringMatrix.forEach(({ originalHeader, targetField, score }) => {
    if (assignedHeaders.has(originalHeader) || usedFields.has(targetField)) {
      return;
    }
    
    // Only assign if score is above threshold
    if (score > 1.0) {
      mapping[originalHeader] = targetField;
      usedFields.add(targetField);
      assignedHeaders.add(originalHeader);
      console.log(`✅ Mapped "${originalHeader}" → "${targetField}" (score: ${score.toFixed(2)})`);
    }
  });
  
  // Map remaining headers to themselves
  rawHeaders.forEach(rawHeader => {
    if (!assignedHeaders.has(rawHeader)) {
      mapping[rawHeader] = rawHeader;
      console.log(`🔄 Kept original "${rawHeader}"`);
    }
  });
  
  return mapping;
}

function calculateHeaderFieldScore(rawHeader: string, field: string, entity: DataEntity): number {
  const normalizedRaw = rawHeader.toLowerCase().trim().replace(/[^a-z]/g, '');
  const normalizedField = field.toLowerCase().replace(/[^a-z]/g, '');
  
  let score = 0;
  
  // Exact match (highest priority)
  if (normalizedRaw === normalizedField) {
    score += 10;
  }
  
  // Pattern matching
  const patterns = entity.patterns[field] || [];
  patterns.forEach(pattern => {
    if (pattern.test(rawHeader)) {
      score += 5;
    }
  });
  
  // Substring matching
  if (normalizedRaw.includes(normalizedField)) {
    score += 3;
  }
  if (normalizedField.includes(normalizedRaw) && normalizedRaw.length > 2) {
    score += 2;
  }
  
  // Fuzzy matching (Levenshtein-based similarity)
  const similarity = calculateSimilarity(normalizedRaw, normalizedField);
  score += similarity * 4;
  
  // Keyword matching
  const keywords = field.toLowerCase().split(/(?=[A-Z])/);
  keywords.forEach(keyword => {
    if (keyword.length > 2 && normalizedRaw.includes(keyword.toLowerCase())) {
      score += 1;
    }
  });
  
  return score;
}

function validateMappedData(data: any[], headerMapping: { [key: string]: string }, entityType: 'client' | 'worker' | 'task' | 'unknown'): { suggestions: string[] } {
  const suggestions: string[] = [];
  
  if (entityType === 'unknown') {
    suggestions.push('⚠️ Could not determine file type. Please verify this is a Client, Worker, or Task file.');
    return { suggestions };
  }
  
  const entity = DATA_ENTITIES.find(e => e.type === entityType);
  if (!entity) return { suggestions };
  
  const mappedFields = new Set(Object.values(headerMapping));
  
  // Check for missing required fields
  const missingRequired = entity.requiredFields.filter(field => !mappedFields.has(field));
  if (missingRequired.length > 0) {
    suggestions.push(`❌ Missing required fields: ${missingRequired.join(', ')}`);
  } else {
    suggestions.push(`✅ All required fields found for ${entityType.toUpperCase()} data`);
  }
  
  // Check data quality
  if (data.length > 0) {
    const sampleSize = Math.min(5, data.length);
    const sample = data.slice(0, sampleSize);
    
    // Validate ID patterns
    const idField = entity.requiredFields.find(f => f.includes('ID'));
    if (idField && mappedFields.has(idField)) {
      const originalIdHeader = Object.keys(headerMapping).find(k => headerMapping[k] === idField);
      if (originalIdHeader) {
        const idValues = sample.map(row => row[originalIdHeader]).filter(val => val);
        const expectedPattern = getExpectedIdPattern(entityType);
        
        const validIds = idValues.filter(id => expectedPattern.test(String(id)));
        if (validIds.length > 0) {
          suggestions.push(`✅ Found ${validIds.length} valid ${idField} values`);
        }
        
        const invalidIds = idValues.filter(id => !expectedPattern.test(String(id)));
        if (invalidIds.length > 0) {
          suggestions.push(`⚠️ Some ${idField} values don't match expected pattern: ${invalidIds.slice(0, 3).join(', ')}`);
        }
      }
    }
    
    // Validate data formats
    Object.entries(headerMapping).forEach(([originalHeader, mappedField]) => {
      const values = sample.map(row => row[originalHeader]).filter(val => val);
      
      if (mappedField.includes('Slots') || mappedField.includes('Phases')) {
        const validFormats = values.filter(val => isValidPhaseFormat(String(val)));
        if (validFormats.length > 0) {
          suggestions.push(`✅ ${mappedField} format validation passed`);
        } else if (values.length > 0) {
          suggestions.push(`⚠️ ${mappedField} format needs attention. Expected: [1,2,3], 1-3, or 1,2,3`);
        }
      }
      
      if (mappedField.includes('Skills')) {
        const validSkills = values.filter(val => isValidSkillsFormat(String(val)));
        if (validSkills.length > 0) {
          suggestions.push(`✅ ${mappedField} format validation passed`);
        } else if (values.length > 0) {
          suggestions.push(`⚠️ ${mappedField} should be comma-separated or JSON array`);
        }
      }
      
      if (mappedField.includes('JSON')) {
        const validJson = values.filter(val => isValidJsonOrText(String(val)));
        if (validJson.length === values.length) {
          suggestions.push(`✅ ${mappedField} format validation passed`);
        } else {
          suggestions.push(`⚠️ Some ${mappedField} entries have invalid format`);
        }
      }
    });
  }
  
  // Add mapping summary
  const mappingCount = Object.keys(headerMapping).length;
  const standardFieldCount = Object.values(headerMapping).filter(field => 
    entity.requiredFields.includes(field) || entity.optionalFields.includes(field)
  ).length;
  
  suggestions.push(`📊 Mapped ${mappingCount} columns, ${standardFieldCount} to standard fields`);
  
  return { suggestions };
}

function transformDataWithMapping(rawData: any[], rawHeaders: string[], headerMapping: { [key: string]: string }): { data: any[]; headers: string[] } {
  const newHeaders = Object.values(headerMapping);
  const uniqueHeaders = Array.from(new Set(newHeaders));
  
  const transformedData = rawData.map(row => {
    const newRow: any = {};
    
    Object.entries(headerMapping).forEach(([originalHeader, mappedHeader]) => {
      newRow[mappedHeader] = row[originalHeader];
    });
    
    return newRow;
  });
  
  return {
    data: transformedData,
    headers: uniqueHeaders
  };
}

// Helper functions
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
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

function getExpectedIdPattern(entityType: string): RegExp {
  switch (entityType) {
    case 'client':
      return /^C\d+$/i;
    case 'worker':
      return /^W\d+$/i;
    case 'task':
      return /^T\d+$/i;
    default:
      return /^[A-Z]\d+$/i;
  }
}

function isValidPhaseFormat(value: string): boolean {
  if (!value) return false;
  
  const str = value.trim();
  
  // JSON array: [1,2,3]
  if (str.startsWith('[') && str.endsWith(']')) {
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) && parsed.every(item => !isNaN(Number(item)));
    } catch {
      return false;
    }
  }
  
  // Range: 1-3, 1 - 3
  if (/^\d+\s*-\s*\d+$/.test(str)) {
    return true;
  }
  
  // Comma-separated: 1,2,3
  if (/^\d+(\s*,\s*\d+)*$/.test(str)) {
    return true;
  }
  
  // Single value: 1, [2]
  if (/^\[?\d+\]?$/.test(str)) {
    return true;
  }
  
  return false;
}

function isValidSkillsFormat(value: string): boolean {
  if (!value) return false;
  
  const str = value.trim();
  
  // JSON array
  if (str.startsWith('[') && str.endsWith(']')) {
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) && parsed.every(item => typeof item === 'string');
    } catch {
      return false;
    }
  }
  
  // Comma-separated
  if (str.includes(',')) {
    const skills = str.split(',').map(s => s.trim());
    return skills.every(skill => skill.length > 0);
  }
  
  // Single skill
  return str.length > 0;
}

function isValidJsonOrText(value: string): boolean {
  if (!value) return true;
  
  const str = value.trim();
  
  // If it starts with { or [, it should be valid JSON
  if (str.startsWith('{') || str.startsWith('[')) {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }
  
  // Otherwise, any text is valid
  return true;
}

// Export utility function for header suggestions
export function suggestHeaderCorrections(headers: string[]): { [originalHeader: string]: string[] } {
  const suggestions: { [originalHeader: string]: string[] } = {};
  
  headers.forEach(header => {
    const headerSuggestions: string[] = [];
    const normalizedHeader = header.toLowerCase().trim();
    
    // Check against all known patterns
    DATA_ENTITIES.forEach(entity => {
      Object.entries(entity.patterns).forEach(([field, patterns]) => {
        patterns.forEach(pattern => {
          if (pattern.test(normalizedHeader) && !headerSuggestions.includes(field)) {
            headerSuggestions.push(field);
          }
        });
        
        // Similarity check
        const similarity = calculateSimilarity(normalizedHeader, field.toLowerCase());
        if (similarity > 0.6 && !headerSuggestions.includes(field)) {
          headerSuggestions.push(field);
        }
      });
    });
    
    if (headerSuggestions.length > 0) {
      suggestions[header] = headerSuggestions.slice(0, 3); // Top 3 suggestions
    }
  });
  
  return suggestions;
}