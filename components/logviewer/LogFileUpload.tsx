import React, { useCallback, useState, useEffect, useRef } from "react";
import { Upload, FileSearch, AlertCircle, X, Info } from "lucide-react";
import JSZip from "jszip";
import ParticleBackground from '../ParticleBackground';

interface TarFile {
  name: string;
  buffer: ArrayBuffer;
}

interface Props {
  onFileLoaded: (content: string) => void;
  onBack: () => void;
}

const LogFileUpload: React.FC<Props> = ({ onFileLoaded, onBack }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showCompatNote, setShowCompatNote] = useState(true);
  const [processingFile, setProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const archiveInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkDevice = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // Check if the device is Android
      const android = /Android/i.test(navigator.userAgent);
      setIsAndroid(android);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  // Determine if content is a log file by examining patterns
  const isLogFileContent = (content: string): boolean => {
    if (!content || typeof content !== 'string') return false;

    const sample = content.slice(0, 2000); // Check first 2000 chars for performance

    // Common log file patterns
    const logPatterns = [
      // Timestamp patterns
      /\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}/,  // 2023-01-30 14:30:45 or 2023-01-30T14:30:45
      /\w{3}\s\d{2}\s\d{2}:\d{2}:\d{2}/,          // Jan 30 14:30:45

      // Log level indicators
      /\b(ERROR|INFO|DEBUG|WARN|WARNING|FATAL|TRACE)\b/i,

      // Common log format elements
      /\[([\w\s\d:./-]+)\]/,                      // [Thread-1] or [2023-01-30]

      // Mesh Rider specific patterns
      /\blongtermlog\b/i,
      /\bsmartradio\b/i,
      /\bmesh\b/i,
      /\bconnection\sstate\b/i,
      /\bsignal\sstrength\b/i
    ];

    // Check if at least 2 patterns match to confirm it's a log file
    const matchCount = logPatterns.reduce((count, pattern) =>
      pattern.test(sample) ? count + 1 : count, 0);

    return matchCount >= 2;
  };

  // Process file regardless of extension
  const handleFile = (file: File) => {
    setProcessingFile(true);

    // First check if the filename suggests it's a log file
    const isLogByName = file.name.endsWith('.log') ||
      file.name.includes('log') ||
      file.name.includes('debug');

    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;

      // If it's not a log by name, check the content
      if (!isLogByName && !isLogFileContent(content)) {
        setProcessingFile(false);

        // Show a confirmation dialog if content doesn't match log patterns
        if (window.confirm('The selected file does not appear to be a log file. Process it anyway?')) {
          onFileLoaded(content);
        }
        return;
      }

      setProcessingFile(false);
      onFileLoaded(content);
    };

    reader.onerror = (e) => {
      console.error("Error reading file:", e);
      setProcessingFile(false);
      alert(`Error reading file: ${file.name}. Please try another file.`);
    };

    reader.readAsText(file);
  };

  // Enhanced log file selection handler
  const handleLogFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length === 1) {
      handleFile(files[0]);
      return;
    }

    // Process multiple files
    setProcessingFile(true);
    let combinedContent = "";
    let fileReadCount = 0;

    // Sort files by name for consistent ordering
    const sortedFiles = Array.from(files).sort((a, b) => a.name.localeCompare(b.name));

    for (let i = 0; i < sortedFiles.length; i++) {
      const file = sortedFiles[i];
      const reader = new FileReader();

      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        combinedContent += content.trim() + "\n";
        fileReadCount++;

        if (fileReadCount === sortedFiles.length) {
          combinedContent = combinedContent.trim();
          setProcessingFile(false);
          onFileLoaded(combinedContent);
        }
      };

      reader.onerror = () => {
        fileReadCount++;
        console.error(`Error reading file: ${file.name}`);

        if (fileReadCount === sortedFiles.length) {
          setProcessingFile(false);
          // Still proceed with whatever content we could read
          if (combinedContent.trim().length > 0) {
            onFileLoaded(combinedContent.trim());
          } else {
            alert("Failed to read any of the selected files. Please try again.");
          }
        }
      };

      reader.readAsText(file);
    }
  }, [onFileLoaded]);

  // Archive file handling (enhanced for better error handling)
  const handleArchiveFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProcessingFile(true);
      try {
        await handleArchiveFile(file);
      } catch (error) {
        console.error("Archive processing error:", error);
        alert("Failed to process the archive file. Please ensure it's a valid .zip or .tar.gz file.");
      } finally {
        setProcessingFile(false);
      }
    }
  }, []);

  // Process tar.gz data with improved error handling
  const processTarGzData = async (data: Uint8Array) => {
    try {
      const pakoModule = await import("pako");
      const decompressedData = pakoModule.ungzip(data);

      if (!decompressedData || decompressedData.length === 0) {
        throw new Error("Decompression failed: no data returned");
      }

      const untarImport = await import("js-untar");
      const untarFn = untarImport.default;
      const files = await untarFn(decompressedData.buffer);

      // Find log files with more relaxed pattern matching
      const logFiles = files.filter((f: TarFile) => {
        const isLogExtension = f.name.endsWith(".log");
        const containsLogKeyword = f.name.includes("log");
        const inLogDirectory = f.name.includes("/log/") || f.name.includes("/logs/");

        return isLogExtension || (containsLogKeyword && (inLogDirectory || f.name.includes("tmp")));
      });

      if (!logFiles || logFiles.length === 0) {
        throw new Error("No log files found in the extracted archive");
      }

      // Sort log files by name for consistent ordering
      logFiles.sort((a: TarFile, b: TarFile) => a.name.localeCompare(b.name));

      const decoder = new TextDecoder("utf-8");
      let combinedLogContent = "";

      for (const logFile of logFiles) {
        try {
          combinedLogContent += decoder.decode(logFile.buffer).trim() + "\n";
        } catch (decodeError) {
          console.warn(`Could not decode ${logFile.name}:`, decodeError);
          // Continue with other files
        }
      }

      combinedLogContent = combinedLogContent.trim();

      if (combinedLogContent.length === 0) {
        throw new Error("Could not extract any readable content from log files");
      }

      onFileLoaded(combinedLogContent);
    } catch (error) {
      console.error("Error processing tar.gz data:", error);
      throw error; // Re-throw to be handled by the caller
    }
  };

  // Handle archive file with better file type detection
  const handleArchiveFile = async (file: File) => {
    // Check file extension and MIME type
    const fileName = file.name.toLowerCase();
    const isZip = fileName.endsWith(".zip") || file.type === "application/zip";
    const isTarGz = fileName.endsWith(".tar.gz") || fileName.endsWith(".tgz") ||
      file.type === "application/gzip" || file.type === "application/x-gzip";

    if (isZip) {
      try {
        const zip = await JSZip.loadAsync(file);

        // First try to find tar.gz files
        const tarGzFileName = Object.keys(zip.files).find((name) =>
          name.endsWith(".tar.gz") || name.endsWith(".tgz"));

        if (tarGzFileName) {
          const tarGzData = await zip.files[tarGzFileName].async("uint8array");
          await processTarGzData(tarGzData);
          return;
        }

        // If no tar.gz found, look for log files directly
        const logFileNames = Object.keys(zip.files).filter((name) =>
          name.endsWith(".log") || (name.includes("log") && !zip.files[name].dir));

        if (logFileNames.length > 0) {
          // Extract and combine log files
          let combinedContent = "";

          for (const logFileName of logFileNames.sort()) {
            try {
              const content = await zip.files[logFileName].async("text");
              combinedContent += content.trim() + "\n";
            } catch (error) {
              console.warn(`Could not extract ${logFileName}:`, error);
              // Continue with other files
            }
          }

          combinedContent = combinedContent.trim();

          if (combinedContent.length > 0) {
            onFileLoaded(combinedContent);
            return;
          }
        }

        throw new Error("No log files or tar.gz archives found in the zip file");
      } catch (error) {
        console.error("Error processing zip file:", error);
        throw error;
      }
    } else if (isTarGz) {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      await processTarGzData(uint8Array);
    } else {
      throw new Error("Unsupported file type. Please upload a .zip or .tar.gz file.");
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Accept a wider range of files when dropped
    const logFiles = files.filter(file =>
      file.name.endsWith('.log') ||
      file.name.endsWith('.json') ||
      file.name.endsWith('.txt') ||
      file.name.includes('log') ||
      file.type === 'text/plain' ||
      file.type === 'application/octet-stream'
    );

    if (logFiles.length > 0) {
      if (logFiles.length === 1) {
        handleFile(logFiles[0]);
      } else {
        // Handle multiple files
        let combinedContent = "";
        let fileReadCount = 0;
        setProcessingFile(true);

        for (const file of logFiles) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            combinedContent += (ev.target?.result as string).trim() + "\n";
            fileReadCount++;

            if (fileReadCount === logFiles.length) {
              setProcessingFile(false);
              onFileLoaded(combinedContent.trim());
            }
          };

          reader.onerror = () => {
            fileReadCount++;

            if (fileReadCount === logFiles.length && combinedContent.trim().length > 0) {
              setProcessingFile(false);
              onFileLoaded(combinedContent.trim());
            }
          };

          reader.readAsText(file);
        }
      }
    } else if (files.some(file => file.name.endsWith('.zip') || file.name.endsWith('.tar.gz') || file.name.endsWith('.tgz'))) {
      // Handle archive files
      const archiveFile = files.find(file =>
        file.name.endsWith('.zip') ||
        file.name.endsWith('.tar.gz') ||
        file.name.endsWith('.tgz')
      );

      if (archiveFile) {
        handleArchiveFile(archiveFile).catch(error => {
          console.error("Error processing dropped archive:", error);
          alert("Failed to process the dropped archive file.");
          setProcessingFile(false);
        });
      }
    } else {
      alert("No supported files found. Please upload log files (.log, .txt, .json) or archives (.zip, .tar.gz).");
    }
  }, [handleFile]);

  // Instructions for users
  const logInstructions = [
    {
      title: "Download Log File",
      description: "Download the 'Link Status Log' (.tar.gz) from Mesh Rider app, Web GUI, or CLI."
    },
    {
      title: "Extract Archive",
      description: "Extract the .tar.gz into a folder (Right-click → Extract All)."
    },
    {
      title: "Locate Log File",
      description: "Check: Downloads/longtermmon_smartradio-*/tmp/longtermlog/*.log"
    }
  ];

  const archiveInstructions = [
    {
      title: "Upload Archive",
      description: "Alternatively, upload longtermmon_smartradio- .zip or .tar.gz directly to extract the .log file."
    }
  ];

  // Custom file selection trigger for Android
  const triggerFileSelection = (inputType: 'log' | 'archive') => {
    if (inputType === 'log' && fileInputRef.current) {
      fileInputRef.current.click();
    } else if (inputType === 'archive' && archiveInputRef.current) {
      archiveInputRef.current.click();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-950">
      <ParticleBackground />
      <div className="h-full w-full overflow-auto">
        <div className="container mx-auto p-4 max-w-4xl">
          <div className="bg-gray-900 rounded-lg shadow-xl">
            <div className="flex flex-col items-center justify-center px-4 py-6 border-b border-gray-800 relative">
              {/* Back button */}
              <button
                onClick={onBack}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors focus:outline-none"
                aria-label="Go back to dashboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Header */}
              <div className="mb-3 flex justify-center">
                <img
                  src="/logo.png"
                  alt="Mesh Rider Logo"
                  style={{
                    display: "block",
                    height: "auto",
                    maxWidth: "150px",
                    width: "100%"
                  }}
                />
              </div>
              <h1 className="glowing-text text-white text-center">Mesh Rider Log Viewer</h1>
            </div>

            <div className="p-4 md:p-6">
              {/* Enhanced drop area with broader file support */}
              <div
                className={`border-2 border-dashed ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700'
                  } rounded-lg p-4 md:p-8 text-center cursor-pointer hover:border-blue-500 transition-colors`}
                onClick={() => triggerFileSelection('log')}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="fileInput"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".log,.json,.txt,text/plain,application/octet-stream,*/*"
                  multiple
                  onChange={handleLogFileSelect}
                />
                <Upload className="w-8 h-8 md:w-12 md:h-12 text-blue-500 mx-auto mb-2 md:mb-4" />
                <h3 className="text-lg md:text-xl font-semibold text-gray-300 mb-1 md:mb-2">Upload Log File</h3>
                <p className="text-xs md:text-sm text-gray-500">
                  Drag and drop your log file here, or click to select
                </p>
                <div className="flex items-center justify-center mt-2 md:mt-4 text-xs md:text-sm text-gray-500">
                  <FileSearch className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                  Supports .log, .json, .txt, and other text files
                </div>
              </div>


            </div>

            <div className="px-4 pb-4 md:px-6 md:pb-6">
              {/* Archive upload button with better feedback */}
              <button
                className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-2 md:py-3 px-4 rounded-lg transition-colors text-sm md:text-base flex items-center justify-center ${processingFile ? 'opacity-70 cursor-not-allowed' : ''}`}
                onClick={() => !processingFile && triggerFileSelection('archive')}
                disabled={processingFile}
              >
                {processingFile ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Upload Archive (.zip or .tar.gz)'
                )}
              </button>
              <input
                type="file"
                id="archiveInput"
                ref={archiveInputRef}
                className="hidden"
                accept=".zip,.tar.gz,.tgz,application/zip,application/gzip,application/x-gzip"
                onChange={handleArchiveFileSelect}
              />
            </div>

            <div className={`p-4 md:p-6 bg-gray-800 rounded-b-lg ${isMobile ? 'text-sm' : ''}`}>
              <h4 className="text-base md:text-lg font-semibold text-gray-300 mb-3 md:mb-4">Log File Setup Instructions</h4>
              <div className="space-y-3 md:space-y-4">
                {logInstructions.map((step, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs md:text-sm">
                      {index + 1}
                    </div>
                    <div className="ml-3 md:ml-4">
                      <h5 className="text-gray-300 font-medium text-sm md:text-base">{step.title}</h5>
                      <p className="text-gray-500 text-xs md:text-sm mt-0.5 md:mt-1">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 md:p-6 bg-gray-800 rounded-b-lg mt-2 md:mt-4">
              <h4 className="text-base md:text-lg font-semibold text-gray-300 mb-3 md:mb-4">Archive Upload Instructions</h4>
              <div className="space-y-3 md:space-y-4">
                {archiveInstructions.map((step, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold text-xs md:text-sm">
                      {index + 1}
                    </div>
                    <div className="ml-3 md:ml-4">
                      <h5 className="text-gray-300 font-medium text-sm md:text-base">{step.title}</h5>
                      <p className="text-gray-500 text-xs md:text-sm mt-0.5 md:mt-1">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {showCompatNote && (
            <div className="mt-4 bg-blue-900/40 border border-blue-700 rounded-lg p-3 md:p-4 flex items-start">
              <AlertCircle className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 text-blue-400 mr-3" />
              <div className="flex-grow">
                <h4 className="text-sm md:text-base font-medium text-blue-300">Firmware Compatibility Notice</h4>
                <p className="text-xs md:text-sm text-blue-200 mt-1">
                  The Log File Viewer is only compatible with firmware versions released after June 2024
                  (versions 06.1, 06.2, 06.3, 06.4, 10.2, 10.4, etc.)
                </p>
              </div>
              <button
                className="flex-shrink-0 text-blue-400 hover:text-blue-200 transition-colors"
                onClick={() => setShowCompatNote(false)}
                aria-label="Dismiss compatibility notice"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogFileUpload;