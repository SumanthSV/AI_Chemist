export interface CrossFileValidationResult {
  errors: CrossFileValidationIssue[];
  warnings: CrossFileValidationIssue[];
  info: CrossFileValidationIssue[];
  summary: {
    totalIssues: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
  };
}

export interface CrossFileValidationIssue {
  message: string;
  severity: 'error' | 'warning' | 'info';
  location?: {
    fileId: string;
    fileName: string;
    row: number;
    column: string;
  };
  value?: any;
  type: string;
  fixable: boolean;
  relatedFiles?: string[];
}

export interface FileReference {
  id: string;
  name: string;
  data: any[];
  headers: string[];
}

export async function validateCrossFileReferences(files: FileReference[]): Promise<CrossFileValidationResult> {
  const errors: CrossFileValidationIssue[] = [];
  const warnings: CrossFileValidationIssue[] = [];
  const info: CrossFileValidationIssue[] = [];

  console.log('🔍 Starting cross-file validation with', files.length, 'files');

  // Identify file types based on headers and content with more flexible detection
  const clientsFile = findFileByType(files, 'client');
  const workersFile = findFileByType(files, 'worker');
  const tasksFile = findFileByType(files, 'task');

  console.log('📁 File identification:');
  console.log('  Clients file:', clientsFile?.name || 'Not found');
  console.log('  Workers file:', workersFile?.name || 'Not found');
  console.log('  Tasks file:', tasksFile?.name || 'Not found');

  if (!clientsFile || !workersFile || !tasksFile) {
    errors.push({
      message: 'Missing required files: Expected Clients, Workers, and Tasks files',
      severity: 'error',
      type: 'missing_required_files',
      fixable: false
    });
    return { errors, warnings, info, summary: { totalIssues: 1, errorCount: 1, warningCount: 0, infoCount: 0 } };
  }

  // Extract TaskIDs with improved detection and normalization
  const taskIds = extractTaskIds(tasksFile);
  console.log('🎯 Available TaskIDs:', Array.from(taskIds).sort());
  console.log('📊 Total TaskIDs found:', taskIds.size);

  // Extract other reference data
  const clientIds = extractIds(clientsFile, ['ClientID', 'ID', 'Client_ID', 'CID']);
  const workerIds = extractIds(workersFile, ['WorkerID', 'ID', 'Worker_ID', 'WID']);

  // 1. Validate RequestedTaskIDs in Clients file with individual task mapping
  await validateTaskReferencesIndividually(clientsFile, taskIds, errors);

  // 2. Validate AttributesJSON format (flexible JSON or text)
  await validateAttributesJSON(clientsFile, errors, warnings);
  await validateAttributesJSON(workersFile, errors, warnings);
  await validateAttributesJSON(tasksFile, errors, warnings);

  // 3. Validate Skills consistency between Workers and Tasks
  await validateSkillsConsistency(workersFile, tasksFile, warnings);

  // 4. Validate Group consistency
  await validateGroupConsistency(clientsFile, workersFile, warnings);

  // 5. Validate MaxConcurrent vs Available Workers
  await validateConcurrencyConstraints(tasksFile, workersFile, warnings);

  // 6. Validate Phase availability
  await validatePhaseAvailability(tasksFile, workersFile, warnings);

  // 7. Add informational messages about successful validations
  if (taskIds.size > 0) {
    info.push({
      message: `✅ Found ${taskIds.size} valid TaskIDs in Tasks file: ${Array.from(taskIds).slice(0, 5).join(', ')}${taskIds.size > 5 ? '...' : ''}`,
      severity: 'info',
      type: 'task_inventory',
      fixable: false,
      relatedFiles: [tasksFile.name]
    });
  }

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

function findFileByType(files: FileReference[], type: 'client' | 'worker' | 'task'): FileReference | undefined {
  const typePatterns = {
    client: [/client/i, /customer/i, /company/i],
    worker: [/worker/i, /employee/i, /staff/i, /person/i],
    task: [/task/i, /job/i, /work/i, /activity/i]
  };

  const headerPatterns = {
    client: [/clientid/i, /clientname/i, /customer/i, /company/i, /requestedtask/i],
    worker: [/workerid/i, /workername/i, /employee/i, /skills/i, /availableslots/i],
    task: [/taskid/i, /taskname/i, /duration/i, /requiredskills/i, /preferredphases/i]
  };

  return files.find(file => {
    // Check filename
    const filenameMatch = typePatterns[type].some(pattern => pattern.test(file.name));
    
    // Check headers
    const headerMatch = file.headers.some(header => 
      headerPatterns[type].some(pattern => pattern.test(header))
    );
    
    return filenameMatch || headerMatch;
  });
}

function extractTaskIds(tasksFile: FileReference): Set<string> {
  const taskIds = new Set<string>();
  
  // Find all potential TaskID columns with flexible matching
  const taskIdColumns = findColumnsForField(tasksFile.headers, ['TaskID', 'ID', 'Task_ID', 'TID', 'JobID', 'TicketID']);
  
  console.log('🔍 Found potential TaskID columns:', taskIdColumns);
  
  // Extract TaskIDs from identified columns
  taskIdColumns.forEach(column => {
    tasksFile.data.forEach((row, index) => {
      const taskId = row[column];
      if (taskId && taskId !== '') {
        // Clean and normalize the TaskID - handle various formats
        let cleanTaskId = String(taskId).trim();
        
        // Remove quotes if present
        cleanTaskId = cleanTaskId.replace(/^["']|["']$/g, '');
        
        // Normalize to uppercase for consistent comparison
        cleanTaskId = cleanTaskId.toUpperCase();
        
        if (cleanTaskId) {
          taskIds.add(cleanTaskId);
          console.log(`📝 Row ${index + 1}, Column ${column}: Found TaskID "${cleanTaskId}"`);
        }
      }
    });
  });
  
  // If no TaskID columns found, search all columns for task-like patterns
  if (taskIds.size === 0) {
    console.log('⚠️ No TaskID columns found, searching all columns for task patterns...');
    
    tasksFile.headers.forEach(header => {
      tasksFile.data.forEach((row, index) => {
        const value = row[header];
        if (value && typeof value === 'string') {
          let cleanValue = value.trim().replace(/^["']|["']$/g, '').toUpperCase();
          // Look for patterns like T1, T123, TASK1, etc.
          if (/^T\d+$/i.test(cleanValue) || /^TASK\d+$/i.test(cleanValue)) {
            taskIds.add(cleanValue);
            console.log(`🎯 Row ${index + 1}, Column ${header}: Found task pattern "${cleanValue}"`);
          }
        }
      });
    });
  }
  
  // If still no TaskIDs, try the first column that contains ID-like values
  if (taskIds.size === 0) {
    console.log('⚠️ No task patterns found, checking first ID-like column...');
    
    const firstIdColumn = tasksFile.headers.find(h => 
      h.toLowerCase().includes('id')
    );
    
    if (firstIdColumn) {
      tasksFile.data.forEach((row, index) => {
        const value = row[firstIdColumn];
        if (value && value !== '') {
          const cleanValue = String(value).trim().replace(/^["']|["']$/g, '').toUpperCase();
          taskIds.add(cleanValue);
          console.log(`🆔 Row ${index + 1}, Column ${firstIdColumn}: Added ID "${cleanValue}"`);
        }
      });
    }
  }
  
  return taskIds;
}

function extractIds(file: FileReference, possibleColumns: string[]): Set<string> {
  const ids = new Set<string>();
  const idColumns = findColumnsForField(file.headers, possibleColumns);
  
  idColumns.forEach(column => {
    file.data.forEach(row => {
      const id = row[column];
      if (id && id !== '') {
        const cleanId = String(id).trim().replace(/^["']|["']$/g, '').toUpperCase();
        ids.add(cleanId);
      }
    });
  });
  
  return ids;
}

function findColumnsForField(headers: string[], possibleNames: string[]): string[] {
  const foundColumns: string[] = [];
  
  possibleNames.forEach(name => {
    const normalizedName = name.toLowerCase().replace(/[^a-z]/g, '');
    
    const matchingHeaders = headers.filter(header => {
      const normalizedHeader = header.toLowerCase().replace(/[^a-z]/g, '');
      return normalizedHeader === normalizedName || 
             normalizedHeader.includes(normalizedName) ||
             normalizedName.includes(normalizedHeader);
    });
    
    foundColumns.push(...matchingHeaders);
  });
  
  // Remove duplicates and return
  return Array.from(new Set(foundColumns));
}

async function validateTaskReferencesIndividually(clientsFile: FileReference, taskIds: Set<string>, errors: CrossFileValidationIssue[]) {
  // Find RequestedTaskIDs columns with flexible matching
  const requestedTaskColumns = findColumnsForField(clientsFile.headers, [
    'RequestedTaskIDs', 'RequestedTasks', 'TaskIDs', 'Tasks', 'Requested_Task_IDs'
  ]);

  console.log('🔍 Found RequestedTask columns:', requestedTaskColumns);

  requestedTaskColumns.forEach(requestedTaskColumn => {
    clientsFile.data.forEach((row, index) => {
      const requestedTasks = row[requestedTaskColumn];
      if (requestedTasks && requestedTasks !== '') {
        console.log(`📋 Row ${index + 1} processing requested tasks: "${requestedTasks}"`);
        
        // Parse the task list - handle multiple formats
        const taskList = parseTaskListRobust(requestedTasks);
        console.log(`📋 Row ${index + 1} parsed tasks:`, taskList);
        
        // Validate each task individually
        const invalidTasks: string[] = [];
        const validTasks: string[] = [];
        
        taskList.forEach(taskId => {
          // Normalize the requested task ID for comparison
          const normalizedTaskId = String(taskId).trim().replace(/^["']|["']$/g, '').toUpperCase();
          
          if (normalizedTaskId) {
            const isValid = taskIds.has(normalizedTaskId);
            console.log(`🔍 Checking TaskID "${normalizedTaskId}": ${isValid ? '✅ VALID' : '❌ INVALID'}`);
            
            if (isValid) {
              validTasks.push(normalizedTaskId);
            } else {
              invalidTasks.push(normalizedTaskId);
            }
          }
        });
        
        // Report invalid tasks
        if (invalidTasks.length > 0) {
          console.log(`❌ Invalid tasks found in row ${index + 1}:`, invalidTasks);
          console.log(`✅ Valid tasks in row ${index + 1}:`, validTasks);
          console.log(`📊 Available TaskIDs for comparison:`, Array.from(taskIds).slice(0, 10));
          
          errors.push({
            message: `Invalid task references: ${invalidTasks.join(', ')} not found in Tasks file`,
            severity: 'error',
            location: {
              fileId: clientsFile.id,
              fileName: clientsFile.name,
              row: index,
              column: requestedTaskColumn
            },
            value: requestedTasks,
            type: 'invalid_task_reference',
            fixable: false,
            relatedFiles: ['Tasks file']
          });
        } else if (validTasks.length > 0) {
          console.log(`✅ All tasks valid in row ${index + 1}:`, validTasks);
        }
      }
    });
  });
}

async function validateAttributesJSON(file: FileReference, errors: CrossFileValidationIssue[], warnings: CrossFileValidationIssue[]) {
  // Find AttributesJSON or similar columns
  const jsonColumns = findColumnsForField(file.headers, [
    'AttributesJSON', 'Attributes', 'JSON', 'Metadata', 'Properties', 'Details'
  ]);

  jsonColumns.forEach(jsonColumn => {
    file.data.forEach((row, index) => {
      const value = row[jsonColumn];
      if (value && value !== '') {
        const strValue = String(value).trim();
        
        // Check if it's intended to be JSON (starts with { or [)
        if (strValue.startsWith('{') || strValue.startsWith('[')) {
          try {
            JSON.parse(strValue);
            // Valid JSON - no error
          } catch (jsonError) {
            errors.push({
              message: `Malformed JSON in ${jsonColumn}: ${strValue.substring(0, 50)}${strValue.length > 50 ? '...' : ''}`,
              severity: 'error',
              location: {
                fileId: file.id,
                fileName: file.name,
                row: index,
                column: jsonColumn
              },
              value: strValue,
              type: 'malformed_json',
              fixable: true,
              relatedFiles: [file.name]
            });
          }
        } else {
          // It's text format - this is acceptable
          console.log(`📝 Row ${index + 1}, Column ${jsonColumn}: Text format detected: "${strValue.substring(0, 30)}..."`);
        }
      }
    });
  });
}

function parseTaskListRobust(taskString: string): string[] {
  if (!taskString) return [];
  
  // Handle different formats more robustly
  let str = String(taskString).trim();
  
  // Remove outer quotes if present
  str = str.replace(/^["']|["']$/g, '');
  
  console.log(`🔧 Parsing task string: "${str}"`);
  
  // Try JSON array format first: ["T1","T2","T3"] or [T1,T2,T3]
  if (str.startsWith('[') && str.endsWith(']')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        const result = parsed.map(String).map(s => s.trim()).filter(s => s);
        console.log(`📋 JSON array parsed:`, result);
        return result;
      }
    } catch (e) {
      console.log(`⚠️ JSON parsing failed, trying manual parsing...`);
      // Try to manually parse array-like string
      const innerContent = str.slice(1, -1); // Remove [ and ]
      const items = innerContent.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(s => s);
      console.log(`📋 Manual array parsing result:`, items);
      return items;
    }
  }
  
  // Handle comma-separated format: "T1,T2,T3" or "T1, T2, T3"
  if (str.includes(',')) {
    const result = str.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(s => s);
    console.log(`📋 Comma-separated parsing result:`, result);
    return result;
  }
  
  // Handle space-separated format: "T1 T2 T3"
  if (str.includes(' ') && !str.includes(',')) {
    const result = str.split(/\s+/).map(s => s.trim().replace(/^["']|["']$/g, '')).filter(s => s);
    console.log(`📋 Space-separated parsing result:`, result);
    return result;
  }
  
  // Handle semicolon-separated format: "T1;T2;T3"
  if (str.includes(';')) {
    const result = str.split(';').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(s => s);
    console.log(`📋 Semicolon-separated parsing result:`, result);
    return result;
  }
  
  // Single task ID
  const result = [str.replace(/^["']|["']$/g, '')];
  console.log(`📋 Single task parsing result:`, result);
  return result;
}

async function validateSkillsConsistency(workersFile: FileReference, tasksFile: FileReference, warnings: CrossFileValidationIssue[]) {
  const workerSkills = new Set<string>();
  const requiredSkills = new Set<string>();

  // Collect all worker skills
  const workerSkillsColumns = findColumnsForField(workersFile.headers, ['Skills', 'Competencies', 'Abilities']);
  
  workerSkillsColumns.forEach(column => {
    workersFile.data.forEach(row => {
      const skills = row[column];
      if (skills) {
        parseSkillsList(skills).forEach(skill => workerSkills.add(skill.toLowerCase().trim()));
      }
    });
  });

  // Collect all required skills from tasks
  const requiredSkillsColumns = findColumnsForField(tasksFile.headers, ['RequiredSkills', 'Skills', 'Needed_Skills']);
  
  requiredSkillsColumns.forEach(column => {
    tasksFile.data.forEach((row, index) => {
      const skills = row[column];
      if (skills) {
        const skillList = parseSkillsList(skills);
        skillList.forEach(skill => requiredSkills.add(skill.toLowerCase().trim()));
        
        // Check if required skills are available
        const unavailableSkills = skillList.filter(skill => 
          !workerSkills.has(skill.toLowerCase().trim())
        );
        
        if (unavailableSkills.length > 0) {
          warnings.push({
            message: `Required skills not available in any worker: ${unavailableSkills.join(', ')}`,
            severity: 'warning',
            location: {
              fileId: tasksFile.id,
              fileName: tasksFile.name,
              row: index,
              column: column
            },
            value: skills,
            type: 'skill_coverage_gap',
            fixable: false,
            relatedFiles: [workersFile.name]
          });
        }
      }
    });
  });
}

async function validateGroupConsistency(clientsFile: FileReference, workersFile: FileReference, warnings: CrossFileValidationIssue[]) {
  const clientGroupColumns = findColumnsForField(clientsFile.headers, ['GroupTag', 'Group', 'Category', 'Segment']);
  const workerGroupColumns = findColumnsForField(workersFile.headers, ['WorkerGroup', 'Group', 'Team', 'Department']);
  
  if (clientGroupColumns.length > 0 && workerGroupColumns.length > 0) {
    const clientGroups = new Set<string>();
    const workerGroups = new Set<string>();
    
    clientGroupColumns.forEach(column => {
      clientsFile.data.forEach(row => {
        const group = row[column];
        if (group && group !== '') {
          clientGroups.add(String(group).trim());
        }
      });
    });
    
    workerGroupColumns.forEach(column => {
      workersFile.data.forEach(row => {
        const group = row[column];
        if (group && group !== '') {
          workerGroups.add(String(group).trim());
        }
      });
    });
    
    // Check for group mismatches
    clientGroups.forEach(group => {
      if (!workerGroups.has(group)) {
        warnings.push({
          message: `Client group '${group}' has no corresponding workers`,
          severity: 'warning',
          type: 'group_mismatch',
          fixable: false,
          relatedFiles: [clientsFile.name, workersFile.name]
        });
      }
    });
  }
}

async function validateConcurrencyConstraints(tasksFile: FileReference, workersFile: FileReference, warnings: CrossFileValidationIssue[]) {
  const maxConcurrentColumns = findColumnsForField(tasksFile.headers, ['MaxConcurrent', 'Max_Concurrent', 'Parallel']);
  const requiredSkillsColumns = findColumnsForField(tasksFile.headers, ['RequiredSkills', 'Skills', 'Needed_Skills']);
  const workerSkillsColumns = findColumnsForField(workersFile.headers, ['Skills', 'Competencies', 'Abilities']);
  
  if (maxConcurrentColumns.length > 0 && requiredSkillsColumns.length > 0 && workerSkillsColumns.length > 0) {
    maxConcurrentColumns.forEach(maxConcurrentColumn => {
      requiredSkillsColumns.forEach(requiredSkillsColumn => {
        workerSkillsColumns.forEach(workerSkillsColumn => {
          tasksFile.data.forEach((row, index) => {
            const maxConcurrent = parseInt(row[maxConcurrentColumn] || '0');
            const requiredSkills = row[requiredSkillsColumn];
            
            if (maxConcurrent > 0 && requiredSkills) {
              const skillList = parseSkillsList(requiredSkills).map(s => s.toLowerCase().trim());
              const qualifiedWorkers = workersFile.data.filter(worker => {
                const workerSkillList = parseSkillsList(worker[workerSkillsColumn] || '').map(s => s.toLowerCase().trim());
                return skillList.every(skill => workerSkillList.includes(skill));
              });
              
              if (maxConcurrent > qualifiedWorkers.length) {
                warnings.push({
                  message: `MaxConcurrent (${maxConcurrent}) exceeds qualified workers (${qualifiedWorkers.length})`,
                  severity: 'warning',
                  location: {
                    fileId: tasksFile.id,
                    fileName: tasksFile.name,
                    row: index,
                    column: maxConcurrentColumn
                  },
                  value: maxConcurrent,
                  type: 'insufficient_workers',
                  fixable: false,
                  relatedFiles: [workersFile.name]
                });
              }
            }
          });
        });
      });
    });
  }
}

async function validatePhaseAvailability(tasksFile: FileReference, workersFile: FileReference, warnings: CrossFileValidationIssue[]) {
  const availablePhases = new Set<string>();
  const availableSlotsColumns = findColumnsForField(workersFile.headers, ['AvailableSlots', 'Slots', 'Schedule', 'Availability']);
  
  availableSlotsColumns.forEach(column => {
    workersFile.data.forEach(row => {
      const slots = row[column];
      if (slots) {
        parsePhaseList(slots).forEach(phase => availablePhases.add(phase));
      }
    });
  });

  const preferredPhasesColumns = findColumnsForField(tasksFile.headers, ['PreferredPhases', 'Phases', 'Timeline', 'Schedule']);
  
  if (preferredPhasesColumns.length > 0 && availablePhases.size > 0) {
    preferredPhasesColumns.forEach(column => {
      tasksFile.data.forEach((row, index) => {
        const preferredPhases = row[column];
        if (preferredPhases) {
          const phaseList = parsePhaseList(preferredPhases);
          const unavailablePhases = phaseList.filter(phase => !availablePhases.has(phase));
          
          if (unavailablePhases.length > 0) {
            warnings.push({
              message: `Preferred phases not available: ${unavailablePhases.join(', ')}`,
              severity: 'warning',
              location: {
                fileId: tasksFile.id,
                fileName: tasksFile.name,
                row: index,
                column: column
              },
              value: preferredPhases,
              type: 'phase_availability',
              fixable: false,
              relatedFiles: [workersFile.name]
            });
          }
        }
      });
    });
  }
}

function parseSkillsList(skillsString: string): string[] {
  if (!skillsString) return [];
  
  const str = String(skillsString).trim();
  
  // Try JSON array format first
  if (str.startsWith('[') && str.endsWith(']')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        return parsed.map(String).map(s => s.trim()).filter(s => s);
      }
    } catch {
      // Fall through to comma-separated parsing
    }
  }
  
  // Handle comma-separated format
  if (str.includes(',')) {
    return str.split(',').map(s => s.trim()).filter(s => s);
  }
  
  // Handle semicolon-separated format
  if (str.includes(';')) {
    return str.split(';').map(s => s.trim()).filter(s => s);
  }
  
  // Single skill
  return [str];
}

function parsePhaseList(phaseString: string): string[] {
  if (!phaseString) return [];
  
  const str = String(phaseString).trim();
  
  // Try JSON array format first: [1,2,3]
  if (str.startsWith('[') && str.endsWith(']')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        return parsed.map(String);
      }
    } catch {
      // Fall through to other parsing
    }
  }
  
  // Handle range format: "1-3", "1 - 3"
  if (str.includes('-')) {
    const parts = str.split('-').map(s => s.trim());
    if (parts.length === 2) {
      const start = parseInt(parts[0]);
      const end = parseInt(parts[1]);
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        const phases = [];
        for (let i = start; i <= end; i++) {
          phases.push(String(i));
        }
        return phases;
      }
    }
  }
  
  // Handle comma-separated: "1,2,3"
  if (str.includes(',')) {
    return str.split(',').map(s => s.trim()).filter(s => s);
  }
  
  // Single phase
  return [str];
}