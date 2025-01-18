import React, { useState, useCallback } from 'react';
import { FileUp, Table, AlertCircle, FileText, ArrowRightLeft } from 'lucide-react';
import Papa from 'papaparse';

type FileData = {
  headers: string[];
  rows: Record<string, string>[];
  fileName: string;
};

function App() {
  const [file1Data, setFile1Data] = useState<FileData | null>(null);
  const [file2Data, setFile2Data] = useState<FileData | null>(null);
  const [differences, setDifferences] = useState<Record<string, any>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [showDiffSummary, setShowDiffSummary] = useState(true);

  const normalizeValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  };

  const processFile = async (file: File): Promise<FileData> => {
    return new Promise((resolve, reject) => {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        reject(new Error('Please select a CSV file'));
        return;
      }

      Papa.parse(file, {
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: (header) => header.trim(),
        transform: (value) => normalizeValue(value),
        complete: (results) => {
          try {
            if (!results.data || !Array.isArray(results.data)) {
              throw new Error('Invalid CSV format');
            }

            const filteredData = results.data.filter(row => 
              Object.values(row).some(val => normalizeValue(val) !== '')
            );

            if (filteredData.length === 0) {
              throw new Error('File contains no data');
            }

            const headers = Object.keys(filteredData[0]).map(h => h.trim()).filter(h => h);
            
            if (headers.length === 0) {
              throw new Error('No valid columns found in file');
            }

            const cleanData = filteredData.map(row => {
              const cleanRow: Record<string, string> = {};
              headers.forEach(header => {
                cleanRow[header] = normalizeValue(row[header]);
              });
              return cleanRow;
            });

            resolve({
              headers,
              rows: cleanData,
              fileName: file.name
            });
          } catch (err) {
            reject(err);
          }
        },
        error: (error) => reject(new Error(`CSV parsing error: ${error.message}`))
      });
    });
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>, fileNum: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsComparing(true);

    try {
      const data = await processFile(file);
      
      if (fileNum === 2 && file1Data) {
        const file1Headers = new Set(file1Data.headers.sort());
        const file2Headers = new Set(data.headers.sort());
        
        if (file1Headers.size !== file2Headers.size || 
            !Array.from(file1Headers).every(header => file2Headers.has(header))) {
          throw new Error('Files have different column structures');
        }
      }
      
      if (fileNum === 1) {
        setFile1Data(data);
        setFile2Data(null);
        setDifferences([]);
      } else {
        setFile2Data(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
      if (fileNum === 1) {
        setFile1Data(null);
      } else {
        setFile2Data(null);
      }
    } finally {
      setIsComparing(false);
    }
  }, [file1Data]);

  const compareFiles = useCallback(() => {
    if (!file1Data || !file2Data) return;

    setIsComparing(true);
    setError(null);

    try {
      const allDifferences: Record<string, any>[] = [];
      const headers = file1Data.headers;
      const maxRows = Math.max(file1Data.rows.length, file2Data.rows.length);

      for (let i = 0; i < maxRows; i++) {
        const row1 = file1Data.rows[i] || {};
        const row2 = file2Data.rows[i] || {};
        let hasDifference = false;

        const rowDiff: Record<string, any> = {
          _rowIndex: i + 1,
          _lineNumber: i + 2
        };

        if (!file1Data.rows[i] || !file2Data.rows[i]) {
          hasDifference = true;
          headers.forEach(header => {
            rowDiff[header] = {
              file1: normalizeValue(row1[header]),
              file2: normalizeValue(row2[header]),
              isDifferent: true,
              missing: !file1Data.rows[i] ? 'file1' : 'file2'
            };
          });
        } else {
          headers.forEach(header => {
            const value1 = normalizeValue(row1[header]);
            const value2 = normalizeValue(row2[header]);

            if (value1 !== value2) {
              hasDifference = true;
              rowDiff[header] = {
                file1: value1,
                file2: value2,
                isDifferent: true
              };
            } else {
              rowDiff[header] = {
                file1: value1,
                file2: value2,
                isDifferent: false
              };
            }
          });
        }

        if (hasDifference) {
          allDifferences.push(rowDiff);
        }
      }

      setDifferences(allDifferences);
      if (allDifferences.length === 0) {
        setError('No differences found between the files');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare files');
      setDifferences([]);
    } finally {
      setIsComparing(false);
    }
  }, [file1Data, file2Data]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="flex-grow p-3 sm:p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg sm:shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-8 border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                CSV Comparison Tool
              </h1>
            </div>
            
            {error && (
              <div className="mb-6 p-3 sm:p-4 bg-red-50 rounded-lg border border-red-100 flex items-start gap-2 sm:gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm sm:text-base text-red-700">{error}</div>
              </div>
            )}

            <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
              {[
                { num: 1, data: file1Data, label: 'Original CSV' },
                { num: 2, data: file2Data, label: 'Comparison CSV' }
              ].map((file) => (
                <div key={file.num} className="relative">
                  <label className="block">
                    <span className="text-gray-700 font-medium text-base sm:text-lg mb-2 block">{file.label}</span>
                    <div className="mt-2">
                      <label className="relative group cursor-pointer">
                        <div className="w-full flex flex-col items-center px-4 sm:px-6 py-6 sm:py-8 bg-white rounded-lg sm:rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-500 transition-all duration-200 ease-in-out">
                          <div className="w-12 sm:w-16 h-12 sm:h-16 mb-3 sm:mb-4 rounded-full bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                            <FileUp className="w-6 sm:w-8 h-6 sm:h-8 text-blue-500" />
                          </div>
                          <div className="text-center">
                            <span className="text-blue-600 font-semibold text-sm sm:text-base block mb-1">
                              {file.data ? 'Change file' : 'Select CSV'}
                            </span>
                            <span className="text-xs sm:text-sm text-gray-500">
                              .csv files only
                            </span>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept=".csv"
                            onChange={(e) => handleFileUpload(e, file.num)}
                          />
                        </div>
                      </label>
                    </div>
                  </label>
                  {file.data && (
                    <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-blue-50 rounded-lg text-xs sm:text-sm">
                      <div className="text-blue-700">
                        <span className="font-medium">{file.data.fileName}</span>
                        <span className="mx-2">•</span>
                        {file.data.rows.length} rows
                        <span className="mx-2">•</span>
                        {file.data.headers.length} columns
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={compareFiles}
              disabled={!file1Data || !file2Data || isComparing}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-medium text-base sm:text-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-200 ease-in-out flex items-center justify-center gap-2"
            >
              <ArrowRightLeft className="w-4 sm:w-5 h-4 sm:h-5" />
              {isComparing ? 'Comparing...' : 'Compare Files'}
            </button>
          </div>

          {differences.length > 0 && (
            <div className="bg-white rounded-lg sm:rounded-xl shadow-lg sm:shadow-xl p-4 sm:p-6 md:p-8 border border-gray-100 animate-fadeIn mb-4 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Table className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                  <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">
                    {showDiffSummary ? 'Quick Difference Summary' : 'Detailed Comparison'}
                  </h2>
                </div>
                <button
                  onClick={() => setShowDiffSummary(!showDiffSummary)}
                  className="text-sm sm:text-base text-gray-500 hover:text-gray-700"
                >
                  Show {showDiffSummary ? 'Full Comparison' : 'Summary'}
                </button>
              </div>
              
              {showDiffSummary ? (
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg font-mono text-xs sm:text-sm">
                  <div className="mb-3 sm:mb-4 text-gray-700">
                    Found {differences.length} differences in files:
                    <div className="text-xs mt-1 text-gray-500">
                      {file1Data?.fileName} ↔ {file2Data?.fileName}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {differences.map((diff, index) => (
                      <div 
                        key={diff._rowIndex}
                        className={`py-2 ${index !== differences.length - 1 ? 'border-b border-gray-200' : ''}`}
                      >
                        <div className="text-gray-600">
                          Line {diff._lineNumber}:
                        </div>
                        {Object.entries(diff).map(([key, value]) => {
                          if (key.startsWith('_')) return null;
                          if (!value.isDifferent) return null;
                          return (
                            <div key={key} className="ml-4 mt-1">
                              <span className="text-gray-500">{key}:</span>
                              {value.missing ? (
                                <span className="text-red-600 ml-2">
                                  Missing in {value.missing === 'file1' ? 'first' : 'second'} file
                                </span>
                              ) : (
                                <div className="ml-2">
                                  <div className="text-red-600">- {value.file1 || '(empty)'}</div>
                                  <div className="text-green-600">+ {value.file2 || '(empty)'}</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0 sm:rounded-xl border border-gray-200">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="sticky left-0 bg-gray-50 px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Line
                          </th>
                          {file1Data?.headers.map((header) => (
                            <th
                              key={header}
                              scope="col"
                              className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {differences.map((row) => (
                          <tr key={row._rowIndex} className="hover:bg-gray-50">
                            <td className="sticky left-0 bg-gray-50 px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">
                              {row._lineNumber}
                            </td>
                            {file1Data?.headers.map((header) => (
                              <td
                                key={header}
                                className={`px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm ${
                                  row[header]?.isDifferent
                                    ? 'bg-red-50'
                                    : ''
                                }`}
                              >
                                {row[header]?.isDifferent ? (
                                  <div className="space-y-1">
                                    {row[header].missing === 'file1' ? (
                                      <div className="text-red-600 italic font-medium">Missing in File 1</div>
                                    ) : row[header].missing === 'file2' ? (
                                      <div className="text-red-600 italic font-medium">Missing in File 2</div>
                                    ) : (
                                      <>
                                        <div className="text-red-600 line-through">
                                          {row[header].file1 || '(empty)'}
                                        </div>
                                        <div className="text-green-600 font-medium">
                                          {row[header].file2 || '(empty)'}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-700">{row[header]?.file1}</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-auto py-6 px-4 bg-white bg-opacity-90 border-t border-gray-200">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-600">
          <p className="mb-1">Copyright © 2025 Ed Bates (TECHBLIP LLC)</p>
          <p className="text-xs">This software is released under the Apache-2.0 License. See the LICENSE file for details</p>
        </div>
      </footer>
    </div>
  );
}

export default App;