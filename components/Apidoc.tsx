'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, FileText, AlertTriangle, CheckCircle, XCircle,
    Zap, Filter, Search, ChevronDown, Code,
    Download, Clipboard, ArrowRight, Copy, ExternalLink
} from 'lucide-react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

// Mock API data - In production, you would fetch this from your API or load from files
const apiData = {
    categories: [
        {
            name: "Wireless Settings",
            color: "#F59E0B",
            endpoints: [
                {
                    id: "get-power",
                    name: "Get Power",
                    description: "Returns the current power settings for the radio device",
                    request: {
                        jsonrpc: "2.0",
                        id: 1,
                        method: "call",
                        params: ["<session_token>", "file", "exec", { "command": "iw", "params": ["wlan0", "info"] }]
                    },
                    examples: {
                        cli: "iw wlan0 info",
                        python: 'import requests\nimport json\n\ndef get_power(session_token):\n    url = "http://example.com"\n    payload = {\n        "jsonrpc": "2.0",\n        "id": 1,\n        "method": "call",\n        "params": [session_token, "file", "exec", {"command":"iw","params":["wlan0", "info"]}]\n    }\n    response = requests.post(url, json=payload)\n    return response.json()',
                        curl: 'curl -X POST "http://example.com" \\\n-H "Content-Type: application/json" \\\n-d \'{\n  "jsonrpc": "2.0",\n  "id": 1,\n  "method": "call",\n  "params": ["SESSION_TOKEN", "file", "exec", {"command":"iw","params":["wlan0", "info"]}]\n}\''
                    },
                    parsing: "txpower",
                    sampleResponse: {
                        result: [
                            0,
                            {
                                "stdout": "Interface wlan0\n\ttype: managed\n\twiphy: 0\n\tchannel: 36 (5180 MHz), width: 80 MHz, center1: 5210 MHz\n\ttxpower: 20.00 dBm\n",
                                "stderr": "",
                                "code": 0
                            }
                        ]
                    }
                },
                {
                    id: "get-associations",
                    name: "Get Associations",
                    description: "Returns the list of associated clients",
                    request: {
                        jsonrpc: "2.0",
                        id: 1,
                        method: "call",
                        params: ["<session_token>", "iwinfo", "assoclist", { "device": "wlan0" }]
                    },
                    examples: {
                        cli: "iwinfo wlan0 assoclist",
                        python: '# Python code example for Get Associations',
                        curl: '# cURL example for Get Associations'
                    },
                    parsing: "mac",
                    sampleResponse: {
                        result: [
                            {
                                "results": [
                                    {
                                        "mac": "00:11:22:33:44:55",
                                        "signal": -65,
                                        "noise": -95,
                                        "inactive": 10,
                                        "tx": {
                                            "rate": 650000,
                                            "mcs": 7,
                                            "40mhz": true,
                                            "short_gi": true
                                        },
                                        "rx": {
                                            "rate": 650000,
                                            "mcs": 7,
                                            "40mhz": true,
                                            "short_gi": true
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                },
                {
                    id: "get-mcs-rate",
                    name: "Get currently used MCS rate",
                    description: "Returns the MCS rate of the latest packet",
                    request: {
                        jsonrpc: "2.0",
                        id: 1,
                        method: "call",
                        params: ["<session_token>", "iwinfo", "assoclist", { "device": "wlan0" }]
                    },
                    examples: {
                        cli: "iwinfo wlan0 assoclist",
                        python: '# Python code for MCS rate',
                        curl: '# cURL for MCS rate'
                    },
                    parsing: "tx.mcs",
                    sampleResponse: {}
                },
                {
                    id: "get-frequencies",
                    name: "Get Supported Frequencies",
                    description: "Returns supported frequencies in current operating band",
                    request: {
                        jsonrpc: "2.0",
                        id: 1,
                        method: "call",
                        params: ["<session_token>", "iwinfo", "freqlist", { "device": "wlan0" }]
                    },
                    examples: {
                        cli: "iwinfo wlan0 freqlist",
                        python: '# Python example',
                        curl: '# cURL example'
                    },
                    parsing: "",
                    sampleResponse: {}
                }
            ]
        },
        {
            name: "System Settings",
            color: "#3B82F6",
            endpoints: [
                {
                    id: "get-cpu-load",
                    name: "Get CPU Load",
                    description: "Returns the current CPU load of the device",
                    request: {
                        jsonrpc: "2.0",
                        id: 1,
                        method: "call",
                        params: ["<session_token>", "file", "exec", { "command": "uptime" }]
                    },
                    examples: {
                        cli: "uptime",
                        python: '# Python example for CPU load',
                        curl: '# cURL example for CPU load'
                    },
                    parsing: "",
                    sampleResponse: {}
                },
                {
                    id: "get-memory-usage",
                    name: "Get Memory Usage",
                    description: "Returns the current memory usage (free memory)",
                    request: {
                        jsonrpc: "2.0",
                        id: 1,
                        method: "call",
                        params: ["<session_token>", "file", "exec", { "command": "free", "params": ["-m"] }]
                    },
                    examples: {
                        cli: "free -m",
                        python: '# Python example for memory usage',
                        curl: '# cURL example for memory usage'
                    },
                    parsing: "",
                    sampleResponse: {}
                }
            ]
        }
    ]
};

const ApiDocumentation = () => {
    const [selectedCategory, setSelectedCategory] = useState(apiData.categories[0]);
    const [selectedEndpoint, setSelectedEndpoint] = useState(apiData.categories[0].endpoints[0]);
    const [token, setToken] = useState('');
    const [response, setResponse] = useState<string | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [codeTab, setCodeTab] = useState('cli');
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Filter endpoints based on search term
    const filteredEndpoints = selectedCategory.endpoints.filter(endpoint =>
        endpoint.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Execute API request
    const executeRequest = () => {
        setIsExecuting(true);

        // Simulate API call - in a real app, you would make an actual fetch request
        setTimeout(() => {
            setResponse("No sample response available");
            setIsExecuting(false);
        }, 1500);
    };

    // Copy code to clipboard
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // You could add a toast notification here
    };

    // Generate Postman collection
    const generatePostmanCollection = () => {
        const collection = {
            info: {
                name: "Mesh Rider API Collection",
                schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
            },
            item: apiData.categories.map(category => ({
                name: category.name,
                item: category.endpoints.map(endpoint => ({
                    name: endpoint.name,
                    request: {
                        method: "POST",
                        header: [{ key: "Content-Type", value: "application/json" }],
                        body: {
                            mode: "raw",
                            raw: JSON.stringify(endpoint.request, null, 2)
                        },
                        url: { raw: "{{baseUrl}}?{{timestamp}}" }
                    }
                }))
            }))
        };

        // Create a downloadable file
        const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mesh-rider-api-collection.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 12
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100">
            <div className="pt-8 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="space-y-8"
                >
                    <motion.div variants={itemVariants} className="flex items-center mb-6">
                        <div className="flex items-center">
                            <img
                                src="/logo.png"
                                alt="Mesh Rider Logo"
                                className="h-12 w-auto mr-4"
                            />
                            <div>
                                <h1 className="text-2xl font-bold text-white">
                                    Mesh Rider API Documentation
                                </h1>
                                <p className="text-gray-400 mt-1">
                                    Complete reference for Mesh Rider radio JSON-RPC API
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <div className="flex flex-col md:flex-row gap-6">
                        {/* API Categories Sidebar */}
                        <motion.div variants={itemVariants} className="w-full md:w-64 lg:w-72 flex-shrink-0">
                            <div className="bg-gray-850 rounded-xl p-5 mb-4 sticky top-4">
                                <div className="relative mb-4">
                                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Search APIs..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="space-y-4">
                                    {apiData.categories.map((category, categoryIndex) => (
                                        <div key={categoryIndex}>
                                            <button
                                                onClick={() => setSelectedCategory(category)}
                                                className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between ${selectedCategory.name === category.name ? 'bg-gray-800' : 'hover:bg-gray-800/50'}`}
                                            >
                                                <div className="flex items-center">
                                                    <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
                                                    <span>{category.name}</span>
                                                </div>
                                                <span className="text-xs bg-gray-800/80 px-2 py-0.5 rounded-full">
                                                    {category.endpoints.length}
                                                </span>
                                            </button>

                                            {selectedCategory.name === category.name && (
                                                <div className="mt-2 ml-4 space-y-1">
                                                    {filteredEndpoints.map((endpoint, endpointIndex) => (
                                                        <button
                                                            key={endpointIndex}
                                                            onClick={() => setSelectedEndpoint(endpoint)}
                                                            className={`w-full text-left px-3 py-1.5 text-sm rounded-md flex items-center ${selectedEndpoint.id === endpoint.id ? 'bg-blue-900/30 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-gray-800/30'}`}
                                                        >
                                                            {selectedEndpoint.id === endpoint.id && (
                                                                <ArrowRight size={12} className="mr-1 flex-shrink-0" />
                                                            )}
                                                            <span className={!selectedEndpoint || selectedEndpoint.id !== endpoint.id ? 'ml-4' : ''}>
                                                                {endpoint.name}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-800">
                                    <button
                                        onClick={generatePostmanCollection}
                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                                    >
                                        <Download size={16} />
                                        Postman Collection
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Main Content */}
                        <motion.div variants={itemVariants} className="flex-grow">
                            {selectedEndpoint && (
                                <>
                                    {/* API Information */}
                                    <div className="bg-gray-850 rounded-xl p-5 mb-6 border border-gray-800/50">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h2 className="text-xl font-semibold">{selectedEndpoint.name}</h2>
                                                    <div className="px-2 py-0.5 rounded-full text-xs bg-gray-800/80 text-gray-300">
                                                        {selectedCategory.name}
                                                    </div>
                                                </div>
                                                <p className="text-gray-400 mt-1">{selectedEndpoint.description}</p>
                                            </div>
                                            <div className="bg-gray-800/80 px-3 py-1 rounded-full text-sm flex items-center">
                                                <Code size={14} className="mr-1.5" />
                                                JSON-RPC
                                            </div>
                                        </div>

                                        {selectedEndpoint.parsing && (
                                            <div className="mt-4 flex items-start bg-blue-900/10 p-3 rounded-lg border border-blue-900/20">
                                                <Zap size={18} className="text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                                                <div>
                                                    <span className="text-sm text-blue-400 font-medium">API Parsing</span>
                                                    <p className="text-sm text-gray-400">
                                                        Extract <code className="px-1.5 py-0.5 bg-gray-800 rounded-md text-blue-300">{selectedEndpoint.parsing}</code> from the response to get the relevant data.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Request Body */}
                                    <div className="bg-gray-850 rounded-xl p-5 mb-6 border border-gray-800/50">
                                        <h3 className="text-lg font-medium mb-3 flex items-center">
                                            <Code size={18} className="mr-2 text-blue-400" />
                                            Request Body
                                        </h3>
                                        <div className="relative">
                                            <button
                                                onClick={() => copyToClipboard(JSON.stringify(selectedEndpoint.request, null, 2))}
                                                className="absolute top-2 right-2 p-1.5 bg-gray-800/90 rounded-md hover:bg-gray-700 transition-colors"
                                                title="Copy to clipboard"
                                            >
                                                <Copy size={14} />
                                            </button>
                                            <SyntaxHighlighter
                                                language="json"
                                                style={atomOneDark}
                                                customStyle={{
                                                    padding: '1rem',
                                                    borderRadius: '0.5rem',
                                                    backgroundColor: '#111827'
                                                }}
                                            >
                                                {JSON.stringify(selectedEndpoint.request, null, 2)}
                                            </SyntaxHighlighter>
                                        </div>
                                    </div>

                                    {/* Code Examples */}
                                    <div className="bg-gray-850 rounded-xl overflow-hidden mb-6 border border-gray-800/50">
                                        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
                                            <h3 className="text-lg font-medium flex items-center">
                                                <FileText size={18} className="mr-2 text-blue-400" />
                                                Examples
                                            </h3>

                                            <div className="flex bg-gray-800 rounded-lg">
                                                <button
                                                    onClick={() => setCodeTab('cli')}
                                                    className={`px-3 py-1.5 text-sm rounded-lg ${codeTab === 'cli' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                                >
                                                    CLI
                                                </button>
                                                <button
                                                    onClick={() => setCodeTab('python')}
                                                    className={`px-3 py-1.5 text-sm rounded-lg ${codeTab === 'python' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                                >
                                                    Python
                                                </button>
                                                <button
                                                    onClick={() => setCodeTab('curl')}
                                                    className={`px-3 py-1.5 text-sm rounded-lg ${codeTab === 'curl' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                                >
                                                    cURL
                                                </button>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            {/* <button 
                                                onClick={() => copyToClipboard(selectedEndpoint.examples[codeTab])}
                                                className="absolute top-2 right-2 p-1.5 bg-gray-800/90 rounded-md hover:bg-gray-700 transition-colors"
                                                title="Copy to clipboard"
                                            >
                                                <Copy size={14} />
                                            </button> */}

                                            <SyntaxHighlighter
                                                language={codeTab === 'cli' ? 'bash' : codeTab === 'python' ? 'python' : 'bash'}
                                                style={atomOneDark}
                                                customStyle={{
                                                    padding: '1.5rem',
                                                    backgroundColor: '#111827',
                                                    borderRadius: '0 0 0.5rem 0.5rem',
                                                    maxHeight: '400px',
                                                    overflowY: 'auto'
                                                }} children={''}                                            >
                                                {/* // {selectedEndpoint.examples[codeTab]} */}
                                            </SyntaxHighlighter>
                                        </div>
                                    </div>

                                    {/* Try It Section */}
                                    <div className="bg-gray-850 rounded-xl p-5 mb-6 border border-gray-800/50">
                                        <h3 className="text-lg font-medium mb-4 flex items-center">
                                            <Play size={18} className="mr-2 text-amber-500" />
                                            Try It
                                        </h3>

                                        <div className="mb-4">
                                            <label className="block text-sm text-gray-400 mb-1">
                                                Authentication Token
                                            </label>
                                            <input
                                                type="text"
                                                value={token}
                                                onChange={(e) => setToken(e.target.value)}
                                                placeholder="Enter your session token"
                                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <button
                                                onClick={() => setShowAdvanced(!showAdvanced)}
                                                className="text-sm text-gray-400 hover:text-white flex items-center"
                                            >
                                                <ChevronDown
                                                    size={16}
                                                    className={`mr-1 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
                                                />
                                                {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
                                            </button>

                                            <AnimatePresence>
                                                {showAdvanced && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="mt-4 pt-4 border-t border-gray-700 overflow-hidden"
                                                    >
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">
                                                                    Request Timeout (ms)
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    defaultValue={5000}
                                                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">
                                                                    Base URL
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    defaultValue="https://api.example.com"
                                                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                                                                />
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <button
                                            onClick={executeRequest}
                                            disabled={isExecuting}
                                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                                        >
                                            {isExecuting ? (
                                                <>
                                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                                    Executing...
                                                </>
                                            ) : (
                                                <>
                                                    <Play size={16} />
                                                    Execute Request
                                                </>
                                            )}
                                        </button>

                                        {response && (
                                            <div className="mt-4">
                                                <h4 className="text-sm text-gray-400 mb-2">Response</h4>
                                                <div className="relative">
                                                    <button
                                                        onClick={() => copyToClipboard(JSON.stringify(response, null, 2))}
                                                        className="absolute top-2 right-2 p-1.5 bg-gray-800/90 rounded-md hover:bg-gray-700 transition-colors"
                                                        title="Copy to clipboard"
                                                    >
                                                        <Copy size={14} />
                                                    </button>
                                                    <SyntaxHighlighter
                                                        language="json"
                                                        style={atomOneDark}
                                                        customStyle={{
                                                            padding: '1rem',
                                                            borderRadius: '0.5rem',
                                                            backgroundColor: '#111827'
                                                        }}
                                                    >
                                                        {JSON.stringify(response, null, 2)}
                                                    </SyntaxHighlighter>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Run in Postman Button */}
                                    <motion.div
                                        variants={itemVariants}
                                        className="flex items-start bg-gradient-to-r from-orange-900/10 to-amber-900/10 p-5 rounded-xl border border-amber-900/20"
                                    >
                                        <img
                                            src="/postman-logo.svg"
                                            alt="Postman"
                                            className="w-8 h-8 mr-4"
                                        />
                                        <div>
                                            <h3 className="font-medium">Run this API in Postman</h3>
                                            <p className="text-gray-400 mt-1 text-sm">
                                                Import this API directly into Postman to test and experiment with the endpoint.
                                            </p>
                                            <a
                                                href="#"
                                                className="mt-3 inline-flex items-center bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                <ExternalLink size={14} className="mr-1.5" />
                                                Run in Postman
                                            </a>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ApiDocumentation;