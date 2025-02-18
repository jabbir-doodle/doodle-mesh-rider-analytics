"use client";  // <-- Add this at the very top

import React, { useCallback } from "react";
import { Upload, FileSearch } from "lucide-react";
import JSZip from "jszip";

// If you have type definitions for your .tar files, define them here
interface TarFile {
  name: string;
  buffer: ArrayBuffer;
}

interface Props {
  onFileLoaded: (content: string) => void;
}

const LogFileUpload: React.FC<Props> = ({ onFileLoaded }) => {
  // Basic .log file handler
  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileLoaded(content);
    };
    reader.readAsText(file);
  };

  const handleLogFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, []);

  // Called when the user picks a .zip or .tar.gz file
  const handleArchiveFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleArchiveFile(file);
    }
  }, []);

  // Process the tar.gz data: ungzip + untar, then find .log
  const processTarGzData = async (data: Uint8Array) => {
    // Dynamically import pako + js-untar so SSR never sees them
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
      // Decompress .gz
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
      // Dynamically import the default export from js-untar
      const untarImport = await import("js-untar");
      untarFn = untarImport.default; // default export
    } catch (error) {
      console.error("Error importing js-untar:", error);
      alert("Failed to load tar extraction library (js-untar).");
      return;
    }

    let files: TarFile[];
    try {
      // Extract .tar
      files = (await untarFn(decompressedData.buffer)) as TarFile[];
    } catch (error) {
      console.error("Error extracting tar file:", error);
      alert("Error extracting the tar file from the archive.");
      return;
    }

    // Look for .log in tmp/longtermlog
    const logFile = files.find((f) => f.name.includes("tmp/longtermlog") && f.name.endsWith(".log"));
    if (!logFile) {
      alert("No .log file found in the extracted archive.");
      return;
    }

    // Decode log
    const decoder = new TextDecoder("utf-8");
    const logContent = decoder.decode(logFile.buffer);
    onFileLoaded(logContent);
  };

  // Checks file extension and processes accordingly
  const handleArchiveFile = async (file: File) => {
    if (file.name.endsWith(".zip")) {
      // If it's a zip, we look inside for a .tar.gz
      const zip = await JSZip.loadAsync(file);
      const tarGzFileName = Object.keys(zip.files).find((name) => name.endsWith(".tar.gz"));
      if (!tarGzFileName) {
        alert("No .tar.gz file found in the zip archive.");
        return;
      }
      const tarGzData = await zip.files[tarGzFileName].async("uint8array");
      await processTarGzData(tarGzData);
    } else if (file.name.endsWith(".tar.gz")) {
      // If it's a direct .tar.gz
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      await processTarGzData(uint8Array);
    } else {
      alert("Unsupported file type. Please upload a .zip or .tar.gz file.");
    }
  };

  // UI instructions
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
    <div className="max-w-4xl mx-auto bg-gray-900 rounded-lg shadow-xl">
      <div className="p-6 border-b border-gray-800">
        <img src="/logo.png" alt="Mesh Rider Logo" className="h-12 mx-auto" />
      </div>

      {/* Log file upload */}
      <div className="p-6">
        <div
          className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
          onClick={() => document.getElementById("fileInput")?.click()}
        >
          <input
            type="file"
            id="fileInput"
            className="hidden"
            accept=".log,.json,.txt"
            onChange={handleLogFileSelect}
          />
          <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">Upload Log File</h3>
          <p className="text-gray-500 text-sm">
            Drag and drop your log file here, or click to select
          </p>
          <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
            <FileSearch className="w-4 h-4 mr-2" />
            Supports .log, .json, and .txt
          </div>
        </div>
      </div>

      {/* Archive upload */}
      <div className="p-6">
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors"
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

      {/* Instructions */}
      <div className="p-6 bg-gray-800 rounded-b-lg">
        <h4 className="text-lg font-semibold text-gray-300 mb-4">Log File Setup Instructions</h4>
        <div className="space-y-4">
          {logInstructions.map((step, index) => (
            <div key={index} className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {index + 1}
              </div>
              <div className="ml-4">
                <h5 className="text-gray-300 font-medium">{step.title}</h5>
                <p className="text-gray-500 text-sm mt-1">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-6 bg-gray-800 rounded-b-lg mt-4">
        <h4 className="text-lg font-semibold text-gray-300 mb-4">Archive Upload Instructions</h4>
        <div className="space-y-4">
          {archiveInstructions.map((step, index) => (
            <div key={index} className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                {index + 1}
              </div>
              <div className="ml-4">
                <h5 className="text-gray-300 font-medium">{step.title}</h5>
                <p className="text-gray-500 text-sm mt-1">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LogFileUpload;
