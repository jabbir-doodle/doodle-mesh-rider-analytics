import React from 'react';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import ParticleBackground from '../ParticleBackground';

interface LogErrorProps {
    message: string;
    onBack: () => void;
}

const LogError: React.FC<LogErrorProps> = ({ message, onBack }) => (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-950">
        <ParticleBackground />
        <div className="relative z-10 w-full max-w-3xl p-4">
            <div className="bg-gray-900 rounded-lg shadow-xl p-6 border border-gray-800">
                <div className="flex items-center text-red-400 mb-4">
                    <AlertTriangle className="h-8 w-8 mr-3" />
                    <h2 className="text-xl font-semibold">Log File Error</h2>
                </div>

                <p className="text-gray-300 mb-6">{message}</p>

                <div className="bg-red-900/20 border border-red-900/40 rounded-lg p-4 mb-6">
                    <h3 className="text-red-400 font-medium mb-2">Troubleshooting Tips:</h3>
                    <ul className="text-gray-300 text-sm space-y-2">
                        <li>• Make sure you're uploading a log file from the Mesh Rider device</li>
                        <li>• Try opening the file in a text editor and check if it contains JSON data</li>
                        <li>• Re-export the log from your device and try again</li>
                        <li>• If using an archive file, try extracting it manually first</li>
                    </ul>
                </div>

                <button
                    onClick={onBack}
                    className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go back and try another file
                </button>
            </div>
        </div>
    </div>
);

export default LogError;