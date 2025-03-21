import React, { useCallback, useState, useEffect } from "react";
import { Upload, FileSearch, AlertCircle, X } from "lucide-react";
import JSZip from "jszip";
import ParticleBackground from '../ParticleBackground';

interface TarFile {
  name: string;
  buffer: ArrayBuffer;
}

interface Props {
  onFileLoaded: (content: string) => void;
  onBack: () => void; // Add this new prop
}

const LogFileUpload: React.FC<Props> = ({ onFileLoaded, onBack }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showCompatNote, setShowCompatNote] = useState(true);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileLoaded(content);
    };
    reader.onerror = (e) => {
      console.error("Error reading file:", e);
    };
    reader.readAsText(file);
  };

  const handleLogFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (files.length === 1) {
        handleFile(files[0]);
        return;
      }

      let combinedContent = "";
      let fileReadCount = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (ev) => {
          combinedContent += (ev.target?.result as string).trim() + "\n";
          fileReadCount++;
          if (fileReadCount === files.length) {
            combinedContent = combinedContent.trim();
            onFileLoaded(combinedContent);
          }
        };
        reader.readAsText(file);
      }
    }
  }, [onFileLoaded]);

  const handleArchiveFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleArchiveFile(file);
    }
  }, []);

  const processTarGzData = async (data: Uint8Array) => {
    let pakoModule, untarFn;
    try {
      pakoModule = await import("pako");
    } catch (error) {
      console.error("Error importing pako:", error);
      alert("Failed to load decompression library (pako).");
      return;
    }
    let decompressedData: Uint8Array;
    try {
      decompressedData = pakoModule.ungzip(data);
    } catch (error) {
      console.error("Error decompressing gz data:", error);
      alert("Error decompressing the archive. Ensure it is a valid tar.gz file.");
      return;
    }
    if (!decompressedData || decompressedData.length === 0) {
      alert("Decompression failed: no data returned.");
      return;
    }
    try {
      const untarImport = await import("js-untar");
      untarFn = untarImport.default;
    } catch (error) {
      console.error("Error importing js-untar:", error);
      alert("Failed to load tar extraction library (js-untar).");
      return;
    }
    let files;
    try {
      files = await untarFn(decompressedData.buffer);
    } catch (error) {
      console.error("Error extracting tar file:", error);
      alert("Error extracting the tar file from the archive.");
      return;
    }
    const logFiles = files.filter((f: TarFile) => f.name.includes("tmp/longtermlog") && f.name.endsWith(".log"));
    if (!logFiles || logFiles.length === 0) {
      alert("No .log files found in the extracted archive.");
      return;
    }
    logFiles.sort((a: TarFile, b: TarFile) => a.name.localeCompare(b.name));

    const decoder = new TextDecoder("utf-8");
    let combinedLogContent = "";
    for (const logFile of logFiles) {
      combinedLogContent += decoder.decode(logFile.buffer).trim() + "\n";
    }
    combinedLogContent = combinedLogContent.trim();
    onFileLoaded(combinedLogContent);
  };

  const handleArchiveFile = async (file: File) => {
    if (file.name.endsWith(".zip")) {
      const zip = await JSZip.loadAsync(file);
      const tarGzFileName = Object.keys(zip.files).find((name) => name.endsWith(".tar.gz"));
      if (!tarGzFileName) {
        alert("No .tar.gz file found in the zip archive.");
        return;
      }
      const tarGzData = await zip.files[tarGzFileName].async("uint8array");
      await processTarGzData(tarGzData);
    } else if (file.name.endsWith(".tar.gz")) {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      await processTarGzData(uint8Array);
    } else {
      alert("Unsupported file type. Please upload a .zip or .tar.gz file.");
    }
  };

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
    if (files.length > 0) {
      const logFiles = files.filter(file =>
        file.name.endsWith('.log') ||
        file.name.endsWith('.json') ||
        file.name.endsWith('.txt')
      );

      if (logFiles.length > 0) {
        handleFile(logFiles[0]);
      }
    }
  }, []);

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

  return (
    <div className="fixed inset-0 bg-gray-950">
      <ParticleBackground />
      <div className="h-full w-full overflow-auto">
        <div className="container mx-auto p-4 max-w-4xl">
          <div className="bg-gray-900 rounded-lg shadow-xl">
            <div className="flex flex-col items-center justify-center px-4 py-6 border-b border-gray-800 relative">
              {/* Back button - Add this */}
              <button
                onClick={onBack}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors focus:outline-none"
                aria-label="Go back to dashboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Rest of the header */}
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
              <div
                className={`border-2 border-dashed ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700'
                  } rounded-lg p-4 md:p-8 text-center cursor-pointer hover:border-blue-500 transition-colors`}
                onClick={() => document.getElementById("fileInput")?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="fileInput"
                  className="hidden"
                  accept=".log,.json,.txt"
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
                  Supports .log, .json, and .txt
                </div>
              </div>
            </div>

            <div className="px-4 pb-4 md:px-6 md:pb-6">
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 md:py-3 px-4 rounded-lg transition-colors text-sm md:text-base"
                onClick={() => document.getElementById("archiveInput")?.click()}
              >
                Upload Archive (.zip or .tar.gz)
              </button>
              <input
                type="file"
                id="archiveInput"
                className="hidden"
                accept=".zip,.tar.gz"
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