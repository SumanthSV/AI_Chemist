'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
  ColumnFiltersState,
  ColumnDef
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  AlertTriangle,
  Edit3,
  Check,
  X,
  Key,
  Link,
  Trash2
} from 'lucide-react';

interface DataGridProps {
  data: any[];
  headers: string[];
  validationResults?: {
    errors: any[];
    warnings: any[];
    info: any[];
  };
  onDataUpdate?: (rowIndex: number, columnId: string, value: any) => void;
  onDeleteRow?: (rowIndex: number) => void;
  keyColumns?: string[];
  relationshipSuggestions?: Array<{
    sourceColumn: string;
    targetFile: string;
    targetColumn: string;
    confidence: number;
  }>;
  showRowNumbers?: boolean;
  enableInlineEdit?: boolean;
}

export default function DataGrid({ 
  data, 
  headers, 
  validationResults, 
  onDataUpdate,
  onDeleteRow,
  keyColumns = [],
  relationshipSuggestions = [],
  showRowNumbers = false,
  enableInlineEdit = true
}: DataGridProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [editingCell, setEditingCell] = useState<{ row: number; column: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Auto-detect key columns if not provided
  const detectedKeyColumns = useMemo(() => {
    if (keyColumns.length > 0) return keyColumns;
    
    return headers.filter(header => {
      const lowerHeader = header.toLowerCase();
      if (lowerHeader.includes('id') || lowerHeader.includes('key')) {
        // Check if values are mostly unique
        const values = data.map(row => row[header]).filter(val => val !== null && val !== '');
        const uniqueValues = new Set(values);
        return uniqueValues.size / values.length > 0.9;
      }
      return false;
    });
  }, [headers, data, keyColumns]);

  // Helper function to get data type info and styling
  const getColumnStyle = (header: string, value: any) => {
    const isKey = detectedKeyColumns.includes(header);
    const hasRelationship = relationshipSuggestions.some(r => r.sourceColumn === header);
    
    if (isKey) {
      return { 
        icon: '🔑', 
        bgColor: 'bg-amber-50 border-amber-200', 
        textColor: 'text-amber-800',
        headerBg: 'bg-amber-100',
        type: 'Key Column'
      };
    }
    if (hasRelationship) {
      return { 
        icon: '🔗', 
        bgColor: 'bg-purple-50 border-purple-200', 
        textColor: 'text-purple-800',
        headerBg: 'bg-purple-100',
        type: 'Relationship'
      };
    }
    if (typeof value === 'number' || (!isNaN(Number(value)) && value !== '' && value !== null)) {
      return { 
        icon: '🔢', 
        bgColor: 'bg-blue-50 border-blue-200', 
        textColor: 'text-blue-800',
        headerBg: 'bg-blue-100',
        type: 'Number'
      };
    }
    if (typeof value === 'string' && value.includes('@')) {
      return { 
        icon: '📧', 
        bgColor: 'bg-pink-50 border-pink-200', 
        textColor: 'text-pink-800',
        headerBg: 'bg-pink-100',
        type: 'Email'
      };
    }
    if (value instanceof Date || (!isNaN(Date.parse(value)) && String(value).includes('-'))) {
      return { 
        icon: '📅', 
        bgColor: 'bg-indigo-50 border-indigo-200', 
        textColor: 'text-indigo-800',
        headerBg: 'bg-indigo-100',
        type: 'Date'
      };
    }
    return { 
      icon: '📝', 
      bgColor: 'bg-gray-50 border-gray-200', 
      textColor: 'text-gray-800',
      headerBg: 'bg-gray-100',
      type: 'Text'
    };
  };

  // Helper function to check if cell has validation issues
  const getCellError = (rowIndex: number, columnId: string) => {
    if (!validationResults) return null;
    
    const allIssues = [
      ...(validationResults.errors || []),
      ...(validationResults.warnings || []),
      ...(validationResults.info || [])
    ];
    
    return allIssues.find(issue => 
      issue.location?.row === rowIndex && issue.location?.column === columnId
    );
  };

  const handleCellEdit = useCallback((rowIndex: number, columnId: string, currentValue: any) => {
    if (!enableInlineEdit) return;
    setEditingCell({ row: rowIndex, column: columnId });
    setEditValue(String(currentValue || ''));
  }, [enableInlineEdit]);

  const handleSaveEdit = useCallback(() => {
    if (editingCell && onDataUpdate) {
      onDataUpdate(editingCell.row, editingCell.column, editValue);
    }
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, onDataUpdate]);

  const handleCancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const columns = useMemo(() => {
    const dataColumns: ColumnDef<any>[] = headers.map((header) => ({
      accessorKey: header,
      header: ({ column }) => {
        const sampleValue = data[0]?.[header];
        const style = getColumnStyle(header, sampleValue);
        const isKey = detectedKeyColumns.includes(header);
        const relationship = relationshipSuggestions.find(r => r.sourceColumn === header);
        
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className={`h-auto p-2 font-semibold w-full justify-start ${style.headerBg} hover:opacity-80 transition-all min-w-[100px] sm:min-w-[120px]`}
          >
            <div className="flex flex-col items-start gap-1 w-full">
              <div className="flex items-center gap-1 sm:gap-2 w-full min-w-0">
                <span className="text-xs sm:text-sm">{style.icon}</span>
                <span className="flex-1 text-left font-bold truncate text-xs sm:text-sm" title={header}>
                  {header}
                </span>
                {isKey && <Key className="h-2 w-2 sm:h-3 sm:w-3 text-amber-600 flex-shrink-0" />}
                {relationship && <Link className="h-2 w-2 sm:h-3 sm:w-3 text-purple-600 flex-shrink-0" />}
                {column.getIsSorted() === "asc" ? (
                  <ArrowUp className="h-2 w-2 sm:h-3 sm:w-3 flex-shrink-0" />
                ) : column.getIsSorted() === "desc" ? (
                  <ArrowDown className="h-2 w-2 sm:h-3 sm:w-3 flex-shrink-0" />
                ) : (
                  <ArrowUpDown className="h-2 w-2 sm:h-3 sm:w-3 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1 w-full">
                <Badge variant="outline" className="text-xs font-medium px-1 py-0">
                  {style.type}
                </Badge>
                {relationship && (
                  <Badge variant="secondary" className="text-xs truncate max-w-[60px] sm:max-w-[80px] px-1 py-0" title={relationship.targetFile}>
                    → {relationship.targetFile}
                  </Badge>
                )}
              </div>
            </div>
          </Button>
        );
      },
      cell: ({ row, column }) => {
        const value = row.getValue(column.id);
        const error = getCellError(row.index, column.id);
        const style = getColumnStyle(column.id, value);
        const isEditing = editingCell?.row === row.index && editingCell?.column === column.id;
        
        return (
          <div className={`relative group transition-all duration-200 min-w-[100px] sm:min-w-[120px] ${
            error 
              ? 'bg-red-50 border-2 border-red-300 rounded-lg' 
              : `${style.bgColor} border hover:shadow-sm`
          }`}>
            {isEditing ? (
              <div className="flex items-center gap-1 p-1 sm:p-2">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="h-6 sm:h-8 text-xs sm:text-sm border-0 bg-white shadow-sm min-w-0"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <Button size="sm" variant="ghost" onClick={handleSaveEdit} className="h-6 w-6 sm:h-8 sm:w-8 p-0 flex-shrink-0">
                  <Check className="h-2 w-2 sm:h-3 sm:w-3 text-green-600" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-6 w-6 sm:h-8 sm:w-8 p-0 flex-shrink-0">
                  <X className="h-2 w-2 sm:h-3 sm:w-3 text-red-600" />
                </Button>
              </div>
            ) : (
              <div 
                className="p-1 sm:p-2 cursor-pointer hover:bg-opacity-80 transition-all duration-200 min-h-[2rem] sm:min-h-[2.5rem] flex items-center"
                onClick={() => handleCellEdit(row.index, column.id, value)}
              >
                <div className="flex items-center gap-1 sm:gap-2 w-full min-w-0">
                  <span className={`flex-1 break-words text-xs sm:text-sm ${error ? 'text-red-800 font-medium' : style.textColor}`}>
                    {value !== undefined && value !== null && value !== ''
                        ? <>{String(value)}</>
                        : <span className="text-gray-400 italic">empty</span>}
                  </span>
                  {error && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <AlertTriangle className="h-2 w-2 sm:h-3 sm:w-3 text-red-500" />
                      <Badge 
                        variant={error.severity === 'error' ? 'destructive' : 'secondary'}
                        className="text-xs px-1 py-0"
                      >
                        {error.severity}
                      </Badge>
                    </div>
                  )}
                  {enableInlineEdit && (
                    <Edit3 className="h-2 w-2 sm:h-3 sm:w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  )}
                </div>
                {error && (
                  <div className="absolute top-full left-0 right-0 p-2 bg-red-100 border border-red-200 rounded-b-lg z-10 shadow-lg">
                    <p className="text-xs text-red-700 font-medium">{error.message}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      },
    }));

    // Add row number column if requested
    if (showRowNumbers) {
      const rowNumberColumn: ColumnDef<any> = {
        id: 'rowNumber',
        header: '#',
        cell: ({ row }) => (
          <div className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 bg-gray-50 border-r min-w-[40px] sm:min-w-[60px]">
            <span className="text-xs sm:text-sm font-mono text-gray-600">{row.index + 1}</span>
            {onDeleteRow && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDeleteRow(row.index)}
                className="h-4 w-4 sm:h-6 sm:w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-2 w-2 sm:h-3 sm:w-3" />
              </Button>
            )}
          </div>
        ),
        enableSorting: false,
        enableColumnFilter: false,
      };
      
      dataColumns.unshift(rowNumberColumn);
    }

    return dataColumns;
  }, [headers, data, validationResults, detectedKeyColumns, relationshipSuggestions, editingCell, editValue, handleCellEdit, handleSaveEdit, handleCancelEdit, showRowNumbers, onDeleteRow, enableInlineEdit]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  return (
    <div className="w-full">
      {/* Search and Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg border-b">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Search className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
          <Input
            placeholder="Search all data..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(String(event.target.value))}
            className="max-w-sm bg-white text-xs sm:text-sm h-8 sm:h-10"
          />
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <div className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
            Showing {table.getFilteredRowModel().rows.length} of {data.length} rows
          </div>
          {enableInlineEdit && (
            <Badge variant="outline" className="text-xs">
              <Edit3 className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
              Click to edit
            </Badge>
          )}
        </div>
      </div>

      {/* Relationship Suggestions */}
      {relationshipSuggestions.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-x border-purple-200 p-3 sm:p-4">
          <h4 className="font-semibold text-purple-800 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
            <Link className="h-3 w-3 sm:h-4 sm:w-4" />
            Detected Relationships
          </h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
            {relationshipSuggestions.map((suggestion, index) => (
              <div key={index} className="flex items-center gap-2 text-xs sm:text-sm bg-white p-2 sm:p-3 rounded-lg border border-purple-200">
                <Badge variant="outline" className="text-purple-700 font-medium text-xs">
                  {suggestion.sourceColumn}
                </Badge>
                <span className="text-gray-500">→</span>
                <Badge variant="secondary" className="font-medium text-xs">
                  {suggestion.targetFile}.{suggestion.targetColumn}
                </Badge>
                <Badge variant="outline" className="text-xs ml-auto">
                  {Math.round(suggestion.confidence * 100)}% match
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="border-x border-b rounded-b-lg bg-white overflow-hidden">
        <div className="overflow-auto max-h-[400px] sm:max-h-[600px] w-full">
          <Table className="data-table">
            <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b-2 border-gray-200">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="p-0 border-r border-gray-200 last:border-r-0">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-gray-50/50 transition-colors border-b border-gray-100"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="p-0 border-r border-gray-100 last:border-r-0">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-gray-500 text-sm"
                  >
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}