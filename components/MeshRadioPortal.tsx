import React, { useState } from 'react';
import { Wifi, WifiOff, Download, Upload, Check, RefreshCw, Server, Settings, Menu, X, ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react';
const MeshRadioPortal = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [updateProgress, setUpdateProgress] = useState(65);
    const [deviceConnected, setDeviceConnected] = useState(true);
    const [internetConnected, setInternetConnected] = useState(true);
    const [updateStage, setUpdateStage] = useState('upload');
    const [showUpdatePanel, setShowUpdatePanel] = useState(false);

    // Sample data
    const devices = [
        { id: 1, name: 'Mesh Rider', ip: '10.223.9.106', status: 'online', currentFirmware: '2.3.4', updatable: true },
        { id: 2, name: 'Mini OEM', ip: '10.223.9.107', status: 'online', currentFirmware: '2.3.4', updatable: true },
        { id: 3, name: 'Wearable', ip: '10.223.9.108', status: 'offline', currentFirmware: '2.2.0', updatable: false }
    ];

    const firmwareVersions = [
        { version: '2.4.0', date: '2025-02-15', status: 'latest', notes: 'Performance improvements and bug fixes' },
        { version: '2.3.4', date: '2025-01-10', status: 'stable', notes: 'Current installed version' },
        { version: '2.3.0', date: '2024-12-05', status: 'previous', notes: 'Added mesh networking enhancements' }
    ];

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center">
                    <button className="mr-2 p-1 text-gray-400 hover:text-white" onClick={() => setCollapsed(!collapsed)}>
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center">
                        <img
                            src="/logo.png"
                            alt="Mesh Rider Logo"
                            className="h-12 w-auto mr-4"
                        />
                        <div>
                            <h1 className="text-2xl font-bold text-white">Mesh Rider APP</h1>
                            <p className="text-gray-400 mt-1">Multi device login</p>
                        </div>
                    </div>
                </div>


                <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        {internetConnected ? (
                            <div className="flex items-center bg-green-600 px-2 py-1 rounded-md text-xs">
                                <Wifi size={16} className="mr-1" /> Internet Connected
                            </div>
                        ) : (
                            <div className="flex items-center bg-red-600 px-2 py-1 rounded-md text-xs">
                                <WifiOff size={16} className="mr-1" /> Internet Disconnected
                            </div>
                        )}
                    </div>

                    <div className="flex items-center">
                        {deviceConnected ? (
                            <div className="flex items-center bg-green-600 px-2 py-1 rounded-md text-xs">
                                <Server size={16} className="mr-1" /> Device Connected
                            </div>
                        ) : (
                            <div className="flex items-center bg-red-600 px-2 py-1 rounded-md text-xs">
                                <Server size={16} className="mr-1" /> Device Disconnected
                            </div>
                        )}
                    </div>

                    <button
                        className={`p-2 rounded-full ${showUpdatePanel ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => setShowUpdatePanel(!showUpdatePanel)}
                        title="System Updates"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel - Device Navigator */}
                <div className={`bg-gray-800 border-r border-gray-700 transition-all ${collapsed ? 'w-16' : 'w-64'}`}>
                    <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                        {!collapsed && <h2 className="font-semibold">List of devices</h2>}
                        <button className="p-1 text-gray-400 hover:text-white" onClick={() => setCollapsed(!collapsed)}>
                            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                        </button>
                    </div>

                    <div className="overflow-y-auto h-full">
                        {devices.map(device => (
                            <div key={device.id} className={`p-3 border-b border-gray-700 hover:bg-gray-700 cursor-pointer ${device.id === 1 ? 'bg-gray-700' : ''}`}>
                                {collapsed ? (
                                    <div className="flex justify-center">
                                        <div className={`w-3 h-3 rounded-full ${device.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{device.name}</span>
                                            <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                                        </div>
                                        <div className="text-sm text-gray-400 mt-1">{device.ip}</div>
                                        <div className="text-xs text-gray-500 mt-1">Firmware: v{device.currentFirmware}</div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Center Panel - WebGUI / LuCI Interface */}
                <div className="flex-1 bg-gray-900 overflow-auto">
                    <div className="p-4">
                        <div className="flex border-b border-gray-700 mb-4">
                            <div className="px-4 py-2 text-blue-400 border-b-2 border-blue-400">Dashboard</div>
                            <div className="px-4 py-2 text-gray-400 cursor-pointer hover:text-gray-200">Navigation</div>
                            <div className="px-4 py-2 text-gray-400 cursor-pointer hover:text-gray-200">Telemetry</div>
                            <div className="px-4 py-2 text-gray-400 cursor-pointer hover:text-gray-200">Configuration</div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                                <div className="p-4">
                                    <h3 className="text-lg font-medium mb-2">System Status</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Unit Name:</span>
                                            <span>Primary Flight Controller</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">IP Address:</span>
                                            <span>10.223.9.106</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">MAC Address:</span>
                                            <span>DE:AD:BE:EF:12:34</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Uptime:</span>
                                            <span>3 days, 7 hours</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">CPU Usage:</span>
                                            <span>12%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Memory:</span>
                                            <span>78 MB / 128 MB</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                                <div className="p-4">
                                    <h3 className="text-lg font-medium mb-2">Radio Status</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Mesh Status:</span>
                                            <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">Connected</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Mesh Peers:</span>
                                            <span>2 devices</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Signal Strength:</span>
                                            <span>-67 dBm (Good)</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">TX Rate:</span>
                                            <span>45 Mbps</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">RX Rate:</span>
                                            <span>52 Mbps</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Channel:</span>
                                            <span>36 (5 GHz)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden md:col-span-2">
                                <div className="p-4">
                                    <h3 className="text-lg font-medium mb-2">System Logs</h3>
                                    <div className="bg-gray-900 p-3 rounded font-mono text-sm h-40 overflow-y-auto">
                                        <div className="text-gray-500">[2025-03-04 08:23:15] System: Device started</div>
                                        <div className="text-blue-400">[2025-03-04 08:23:17] Network: Mesh network established</div>
                                        <div className="text-green-400">[2025-03-04 08:23:45] Update: Checking for updates</div>
                                        <div className="text-yellow-400">[2025-03-04 08:24:10] Warning: Update available (v2.4.0)</div>
                                        <div className="text-gray-500">[2025-03-04 09:15:22] System: CPU throttling reduced</div>
                                        <div className="text-gray-500">[2025-03-04 10:45:33] Network: New device joined mesh</div>
                                        <div className="text-blue-400">[2025-03-04 11:12:55] Info: Memory usage optimized</div>
                                        <div className="text-yellow-400">[2025-03-04 12:03:18] Warning: High temperature detected</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Update Management - Now conditionally rendered */}
                {showUpdatePanel && (
                    <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto transition-all">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                            <h2 className="font-semibold">System Updates</h2>
                            <button
                                className="p-1 text-gray-400 hover:text-white"
                                onClick={() => setShowUpdatePanel(false)}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-4">
                            <div className="mb-4 bg-blue-900 border border-blue-700 text-blue-100 p-3 rounded-md flex items-start">
                                <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">Update available: v2.4.0</span>
                            </div>

                            <div className="bg-gray-700 border border-gray-600 rounded-lg mb-4">
                                <div className="p-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-medium">Current Version</h3>
                                        <span className="bg-gray-600 text-xs px-2 py-1 rounded">v2.3.4</span>
                                    </div>
                                    <div className="text-sm text-gray-300">Installed: Jan 10, 2025</div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="flex justify-between items-center p-2 bg-gray-700 rounded-t-lg cursor-pointer">
                                    <h3 className="font-medium">Available Updates</h3>
                                    <ChevronRight size={16} />
                                </div>

                                <div className="border border-gray-700 rounded-b-lg">
                                    {firmwareVersions.map(fw => (
                                        <div key={fw.version} className={`p-3 border-b border-gray-700 last:border-b-0 ${fw.status === 'latest' ? 'bg-blue-900' : 'bg-gray-700'}`}>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <span className="font-medium">v{fw.version}</span>
                                                    <div className="text-xs text-gray-400">{fw.date}</div>
                                                </div>
                                                {fw.status === 'latest' && (
                                                    <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded">
                                                        Update
                                                    </button>
                                                )}
                                            </div>
                                            <div className="text-sm mt-1">{fw.notes}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="my-4 border-t border-gray-700" />

                            <div className="mb-4">
                                <h3 className="font-medium mb-2">Update Progress</h3>

                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Firmware v2.4.0</span>
                                        <span>{updateProgress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${updateProgress}%` }}></div>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center">
                                        <Check size={16} className="mr-2 text-green-500" />
                                        <span className="text-gray-300">Download from cloud</span>
                                    </div>

                                    <div className="flex items-center">
                                        <RefreshCw size={16} className="mr-2 text-blue-500 animate-spin" />
                                        <span className="text-white">Uploading to device</span>
                                    </div>

                                    <div className="flex items-center">
                                        <div className="w-4 h-4 mr-2" />
                                        <span className="text-gray-500">Verifying firmware</span>
                                    </div>

                                    <div className="flex items-center">
                                        <div className="w-4 h-4 mr-2" />
                                        <span className="text-gray-500">Installing update</span>
                                    </div>

                                    <div className="flex items-center">
                                        <div className="w-4 h-4 mr-2" />
                                        <span className="text-gray-500">Restarting device</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <button className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-2 rounded">
                                    Cancel
                                </button>
                                <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded">
                                    Pause
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Status Bar */}
            <div className="p-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400 flex justify-between">
                <div>Connected to: 10.223.9.106 (Primary Flight Controller)</div>
                <div>Last checked for updates: 2 hours ago</div>
            </div>

        </div>
    )
};

export default MeshRadioPortal;