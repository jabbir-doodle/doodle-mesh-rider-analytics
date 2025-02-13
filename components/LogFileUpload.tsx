import React, { useCallback } from 'react';
import { Upload, FileSearch, ChevronRight } from 'lucide-react';

interface Props {
  onFileLoaded: (content: string) => void;
}

const LogFileUpload: React.FC<Props> = ({ onFileLoaded }) => {
  const handleFileDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      handleFile(file);
    },
    [onFileLoaded]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [onFileLoaded]
  );

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileLoaded(content);
    };
    reader.readAsText(file);
  };

  const steps = [
    {
      title: "Download Log File",
      description: "Download the 'Link Status Log' from Web GUI or Command Line (.tar.gz file)"
    },
    {
      title: "Extract Archive",
      description: "Extract the .tar.gz file into a folder (Right-click → Extract All in Windows)"
    },
    {
      title: "Locate Log File",
      description: "Navigate to: Downloads → longtermmon_smartradio-* → tmp → longtermlog → *.log"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto bg-gray-900 rounded-lg shadow-xl">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-800">
        <img
          src="/logo.png"
          alt="Mesh Rider Logo"
          className="h-12 mx-auto"
        />
      </div>

      {/* Upload Section */}
      <div className="p-6">
        <div
          className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <input
            type="file"
            id="fileInput"
            className="hidden"
            accept=".log,.json,.txt"
            onChange={handleFileSelect}
          />
          <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            Upload Link Status Log File
          </h3>
          <p className="text-gray-500 text-sm">
            Drag and drop your log file here, or click to select
          </p>
          <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
            <FileSearch className="w-4 h-4 mr-2" />
            Supports .log, .json, and .txt files
          </div>
        </div>
      </div>

      {/* Instructions Section */}
      <div className="p-6 bg-gray-800 rounded-b-lg">
        <h4 className="text-lg font-semibold text-gray-300 mb-4">Setup Instructions</h4>
        <div className="space-y-4">
          {steps.map((step, index) => (
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
    </div>
  );
};

export default LogFileUpload;