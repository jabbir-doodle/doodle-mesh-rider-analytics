import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
    Wifi, WifiOff, Download, Upload, Check, RefreshCw, Server, Settings,
    Menu, ChevronRight, ChevronLeft, AlertTriangle, Activity, Zap,
    CheckCircle, XCircle, Info, ArrowRight, Package, Layers, HardDrive,
    Search, CloudUpload, FileText, RotateCw, Network
} from 'lucide-react';
import axios, { AxiosProgressEvent, AxiosResponse } from 'axios';

// Define TypeScript interfaces
interface DeviceInfo {
    ip: string;
    name: string;
    status: 'online' | 'offline';
    currentFirmware: string;
    updatable: boolean;
    type: string;
    sessionToken: string;
    lastChecked: string;
    authenticated?: boolean;
    boardName?: string;
    target?: string;
    needsUpdate?: boolean;
    lastUpdated?: string;
}

interface FirmwareVersion {
    version: string;
    date: string;
    status: 'latest' | 'stable' | 'previous';
    notes: string;
    url: string;
}

interface SharePointConfig {
    url: string;
    folderPath: string;
    token: string;
}

interface LogEntry {
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
}

interface Credentials {
    username: string;
    password: string;
}

interface AuthResult {
    success: boolean;
    token?: string;
}

interface FirmwareInfo {
    version: string;
    boardName: string;
    target: string;
    arch: string;
}

interface UbusResponse {
    result: [number, any];
    id: number;
    jsonrpc: string;
}

type UpdateStageType =
    'discovery' |
    'preparation' |
    'download' |
    'upload' |
    'install' |
    'monitoring' |
    'complete' |
    'failed' |
    'timeout';

const FirmwareUpdateTool: React.FC = () => {
    const [collapsed, setCollapsed] = useState<boolean>(false);
    const [updateProgress, setUpdateProgress] = useState<number>(0);
    const [updateStage, setUpdateStage] = useState<UpdateStageType>('discovery');
    const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(null);
    const [activeTab, setActiveTab] = useState<string>('devices');
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [isScanning, setIsScanning] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [devices, setDevices] = useState<DeviceInfo[]>([]);
    const [firmwareVersions, setFirmwareVersions] = useState<FirmwareVersion[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [credentials, setCredentials] = useState<Credentials>({
        username: 'admin',
        password: 'admin'
    });
    const [networkRange, setNetworkRange] = useState<string>('10.223.42.0/24');
    const [sharepointConfig, setSharepointConfig] = useState<SharePointConfig>({
        url: 'https://yourcompany.sharepoint.com/sites/firmware',
        folderPath: '/DoodleLabsFirmware',
        token: ''
    });

    const addLog = (message: string, type: LogEntry['type'] = 'info'): void => {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        setLogs(prev => [...prev, { timestamp, message, type }]);
    };

    const scanNetwork = useCallback(async (): Promise<void> => {
        if (isScanning) return;

        setIsScanning(true);
        setDevices([]);
        setStatusMessage('Scanning network for Doodle Smart Radios...');
        addLog('Starting network scan');

        try {
            const ipRange = parseNetworkRange(networkRange);
            const discoveredDevices: DeviceInfo[] = [];

            for (let ip of ipRange) {
                try {
                    setStatusMessage(`Checking ${ip}...`);
                    const deviceInfo = await checkDevice(ip);
                    if (deviceInfo) {
                        discoveredDevices.push(deviceInfo);
                        addLog(`Discovered device at ${ip}`, 'success');
                        setDevices([...discoveredDevices]);
                    }
                } catch (error) {
                    console.error(`Error checking ${ip}:`, error);
                }
            }

            if (discoveredDevices.length === 0) {
                setStatusMessage('No devices found. Please check your network settings.');
                addLog('Network scan complete - No devices found', 'warning');
            } else {
                setStatusMessage(`Found ${discoveredDevices.length} device(s).`);
                addLog(`Network scan complete - Found ${discoveredDevices.length} device(s)`, 'success');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            setErrorMessage(`Scan failed: ${errorMessage}`);
            addLog(`Scan failed: ${errorMessage}`, 'error');
        } finally {
            setIsScanning(false);
        }
    }, [networkRange, isScanning]);

    const parseNetworkRange = (range: string): string[] => {
        if (!range.includes('/')) {
            return [range];
        }

        const [baseIp, prefix] = range.split('/');
        const ipParts = baseIp.split('.');
        const ipStart = parseInt(ipParts[3]);

        const ipCount = Math.min(254, Math.pow(2, 32 - parseInt(prefix)));
        const results: string[] = [];

        for (let i = 1; i < ipCount; i++) {
            results.push(`${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.${i + ipStart}`);
        }

        return results;
    };

    const checkDevice = async (ip: string): Promise<DeviceInfo | null> => {
        try {
            const response = await axios.get(`/api/proxy`, {
                timeout: 5000,
                headers: { 'x-target-ip': ip }
            });

            if (response.status === 200) {
                const deviceInfo: DeviceInfo = {
                    ip: ip,
                    name: `Doodle Smart Radio (${ip})`,
                    status: 'online',
                    currentFirmware: 'Unknown',
                    updatable: false,
                    type: 'radio',
                    sessionToken: '',
                    lastChecked: new Date().toISOString()
                };

                const authResult = await authenticateDevice(ip);
                if (authResult.success && authResult.token) {
                    deviceInfo.sessionToken = authResult.token;
                    deviceInfo.authenticated = true;

                    const firmwareInfo = await getFirmwareInfo(ip, authResult.token);
                    if (firmwareInfo) {
                        deviceInfo.currentFirmware = firmwareInfo.version;
                        deviceInfo.boardName = firmwareInfo.boardName;
                        deviceInfo.target = firmwareInfo.target;
                        deviceInfo.updatable = true;
                        deviceInfo.name = `${firmwareInfo.boardName} (${ip})`;
                        deviceInfo.needsUpdate = await checkIfUpdateNeeded(firmwareInfo.version);
                    }
                } else {
                    deviceInfo.authenticated = false;
                }

                return deviceInfo;
            }
        } catch (error) {
            return null;
        }
        return null;
    };

    const authenticateDevice = async (ip: string): Promise<AuthResult> => {
        try {
            const authRequest = {
                jsonrpc: "2.0",
                id: 4,
                method: "call",
                params: [
                    "00000000000000000000000000000000",
                    "session",
                    "login",
                    { username: credentials.username, password: credentials.password }
                ]
            };

            const response = await axios.post<UbusResponse>(`/api/proxy/ubus`, authRequest, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-target-ip': ip
                },
                timeout: 5000
            });

            const sessionToken = response.data?.result?.[1]?.ubus_rpc_session;

            return {
                success: !!sessionToken,
                token: sessionToken
            };
        } catch (error) {
            console.error('Authentication error:', error);
            return { success: false };
        }
    };

    const getFirmwareInfo = async (ip: string, token: string): Promise<FirmwareInfo | null> => {
        try {
            const boardInfoRequest = {
                jsonrpc: "2.0",
                id: 1,
                method: "call",
                params: [token, "system", "board", {}]
            };

            const response = await axios.post<UbusResponse>(`/api/proxy/ubus`, boardInfoRequest, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-target-ip': ip
                },
                timeout: 5000
            });

            const boardInfo = response.data?.result?.[1];

            if (boardInfo) {
                return {
                    version: boardInfo.release?.version || 'Unknown',
                    boardName: boardInfo.board_name || 'Doodle Smart Radio',
                    target: boardInfo.release?.target || 'Unknown',
                    arch: boardInfo.release?.arch || 'Unknown'
                };
            }

            return null;
        } catch (error) {
            console.error('Failed to get firmware info:', error);
            return null;
        }
    };

    const uploadFirmwareToDevice = async (device: DeviceInfo, firmwareBlob: Blob): Promise<boolean> => {
        try {
            setUpdateStage('upload');
            setStatusMessage(`Uploading firmware to ${device.name}`);
            addLog(`Starting firmware upload to ${device.ip}`, 'info');

            const formData = new FormData();
            formData.append('sessionid', device.sessionToken);
            formData.append('filename', '/tmp/firmware.bin');
            formData.append('filemode', '600');
            formData.append('filedata', firmwareBlob);

            const response = await axios.post(`/api/proxy/cgi-bin/cgi-upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'x-target-ip': device.ip
                },
                onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = 40 + Math.round((progressEvent.loaded * 40) / progressEvent.total);
                        setUpdateProgress(percentCompleted);
                    }
                }
            });

            setUpdateProgress(80);
            addLog('Firmware upload completed', 'success');

            if (response.data?.success) {
                return true;
            } else {
                throw new Error('Upload failed: Device returned error');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            setErrorMessage(`Firmware upload failed: ${errorMessage}`);
            addLog(`Firmware upload failed: ${errorMessage}`, 'error');
            throw error;
        }
    };

    const startFirmwareUpdate = async (device: DeviceInfo, keepSettings: boolean = true): Promise<boolean> => {
        try {
            setUpdateStage('install');
            setStatusMessage(`Installing firmware on ${device.name}`);
            addLog(`Starting firmware installation on ${device.ip}`, 'info');

            const upgradeRequest = {
                jsonrpc: "2.0",
                id: 5,
                method: "call",
                params: [device.sessionToken, "rpc-sys", "upgrade_start", [keepSettings ? 1 : 0]]
            };

            const response = await axios.post(`/api/proxy/ubus`, upgradeRequest, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-target-ip': device.ip
                }
            });

            if (response.data?.result) {
                setUpdateProgress(90);
                addLog('Firmware installation initiated', 'success');

                monitorUpdateProgress(device);
                return true;
            } else {
                throw new Error('Update failed: Device returned error');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            setErrorMessage(`Firmware installation failed: ${errorMessage}`);
            addLog(`Firmware installation failed: ${errorMessage}`, 'error');
            throw error;
        }
    };

    const checkIfUpdateNeeded = async (currentVersion: string): Promise<boolean> => {
        if (!firmwareVersions.length) {
            await fetchFirmwareVersions();
        }

        if (firmwareVersions.length > 0) {
            const latestVersion = firmwareVersions[0];
            return compareVersions(currentVersion, latestVersion.version) < 0;
        }

        return false;
    };

    const compareVersions = (v1: string, v2: string): number => {
        const v1Parts = v1.split('.').map(p => parseInt(p));
        const v2Parts = v2.split('.').map(p => parseInt(p));

        for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
            const part1 = i < v1Parts.length ? v1Parts[i] : 0;
            const part2 = i < v2Parts.length ? v2Parts[i] : 0;

            if (part1 !== part2) {
                return part1 - part2;
            }
        }

        return 0;
    };

    const fetchFirmwareVersions = async (): Promise<FirmwareVersion[]> => {
        try {
            setStatusMessage('Fetching available firmware versions...');

            // Mock data - in a real app, fetch from SharePoint
            const mockFirmwareVersions: FirmwareVersion[] = [
                {
                    version: '2024-10.2',
                    date: '2024-10-15',
                    status: 'latest',
                    notes: 'Latest firmware with mesh network improvements',
                    url: `${sharepointConfig.url}${sharepointConfig.folderPath}/2024-10.2/doodle-labs-firmware-2024-10.2-ar71xx-generic-smartradio-squashfs-sysupgrade.bin`
                },
                {
                    version: '2024-7.1',
                    date: '2024-07-20',
                    status: 'stable',
                    notes: 'Stable release with security patches',
                    url: `${sharepointConfig.url}${sharepointConfig.folderPath}/2024-7.1/doodle-labs-firmware-2024-7.1-ar71xx-generic-smartradio-squashfs-sysupgrade.bin`
                },
                {
                    version: '2024-5.3',
                    date: '2024-05-08',
                    status: 'previous',
                    notes: 'Previous release with basic functionality',
                    url: `${sharepointConfig.url}${sharepointConfig.folderPath}/2024-5.3/doodle-labs-firmware-2024-5.3-ar71xx-generic-smartradio-squashfs-sysupgrade.bin`
                }
            ];

            setFirmwareVersions(mockFirmwareVersions);
            addLog(`Retrieved ${mockFirmwareVersions.length} firmware versions`, 'success');
            setStatusMessage('');

            return mockFirmwareVersions;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            setErrorMessage(`Failed to fetch firmware versions: ${errorMessage}`);
            addLog(`Failed to fetch firmware versions: ${errorMessage}`, 'error');
            return [];
        }
    };

    const downloadFirmware = async (firmwareUrl: string): Promise<Blob> => {
        try {
            setUpdateStage('download');
            setStatusMessage(`Downloading firmware from ${firmwareUrl}`);
            addLog(`Starting firmware download from ${firmwareUrl}`, 'info');

            const simulateProgress = setInterval(() => {
                setUpdateProgress(prev => {
                    if (prev >= 40) {
                        clearInterval(simulateProgress);
                        return 40;
                    }
                    return prev + 2;
                });
            }, 500);

            const response = await axios.get(firmwareUrl, {
                responseType: 'blob',
                headers: {
                    'Authorization': `Bearer ${sharepointConfig.token}`
                },
                onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 40) / progressEvent.total);
                        setUpdateProgress(percentCompleted);
                    }
                }
            });

            clearInterval(simulateProgress);
            setUpdateProgress(40);
            addLog('Firmware download completed', 'success');

            return response.data;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            setErrorMessage(`Firmware download failed: ${errorMessage}`);
            addLog(`Firmware download failed: ${errorMessage}`, 'error');
            throw error;
        }
    };



    const monitorUpdateProgress = async (device: DeviceInfo): Promise<void> => {
        setUpdateStage('monitoring');
        setStatusMessage(`Waiting for ${device.name} to reboot`);
        addLog(`Monitoring device reboot process for ${device.ip}`, 'info');

        let retryCount = 0;
        const maxRetries = 36; // 3 minutes with 5-second intervals
        const checkInterval = setInterval(async () => {
            try {
                const response = await axios.get(`/api/proxy`, {
                    headers: {
                        'x-target-ip': device.ip
                    },
                    timeout: 2000
                });

                if (response.status === 200) {
                    clearInterval(checkInterval);
                    const firmwareInfo = await getFirmwareInfo(device.ip, device.sessionToken);

                    if (firmwareInfo && firmwareInfo.version === firmwareVersions[0].version) {
                        setUpdateProgress(100);
                        setUpdateStage('complete');
                        setStatusMessage(`Update completed successfully for ${device.name}`);
                        addLog(`Device ${device.ip} is back online with new firmware version`, 'success');

                        setDevices(prev => prev.map(d => {
                            if (d.ip === device.ip) {
                                return {
                                    ...d,
                                    currentFirmware: firmwareVersions[0].version,
                                    needsUpdate: false,
                                    lastUpdated: new Date().toISOString()
                                };
                            }
                            return d;
                        }));
                    } else {
                        throw new Error('Firmware version mismatch after update');
                    }
                    setIsUpdating(false);
                }
            } catch (error) {
                retryCount++;
                setUpdateProgress(90 + Math.floor((retryCount / maxRetries) * 5));

                if (retryCount >= maxRetries) {
                    clearInterval(checkInterval);
                    setUpdateStage('timeout');
                    setStatusMessage(`Update status unknown for ${device.name}. Please verify manually.`);
                    addLog(`Monitor timeout for ${device.ip}, manual verification required`, 'warning');
                    setIsUpdating(false);
                }
            }
        }, 5000);

        // Safety timeout
        setTimeout(() => {
            if (updateStage === 'monitoring') {
                clearInterval(checkInterval);
                setUpdateStage('timeout');
                setStatusMessage(`Update verification timed out for ${device.name}`);
                addLog(`Update verification timeout for ${device.ip}`, 'warning');
                setIsUpdating(false);
            }
        }, 180000); // 3 minutes timeout
    };

    const handleUpdateDevice = async (device: DeviceInfo): Promise<void> => {
        if (isUpdating) return;

        try {
            setSelectedDevice(device);
            setIsUpdating(true);
            setUpdateProgress(0);
            setUpdateStage('preparation');
            setStatusMessage('Preparing for firmware update...');
            addLog(`Starting update process for ${device.ip}`, 'info');

            const latestFirmware = firmwareVersions.find(fw => fw.status === 'latest');
            if (!latestFirmware) {
                throw new Error('No firmware available for update');
            }

            const firmwareBlob = await downloadFirmware(latestFirmware.url);
            const uploadSuccess = await uploadFirmwareToDevice(device, firmwareBlob);

            if (uploadSuccess) {
                await startFirmwareUpdate(device, true);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            setErrorMessage(`Update process failed: ${errorMessage}`);
            addLog(`Update process failed: ${errorMessage}`, 'error');
            setIsUpdating(false);
            setUpdateStage('failed');
        }
    };

    const getUpdateStageIcon = () => {
        switch (updateStage) {
            case 'discovery':
                return <Search className="animate-pulse" />;
            case 'preparation':
                return <Package className="animate-pulse" />;
            case 'download':
                return <Download className="animate-pulse" />;
            case 'upload':
                return <Upload className="animate-pulse" />;
            case 'install':
                return <Activity className="animate-pulse" />;
            case 'monitoring':
                return <RefreshCw className="animate-spin" />;
            case 'complete':
                return <CheckCircle className="text-green-500" />;
            case 'failed':
                return <XCircle className="text-red-500" />;
            case 'timeout':
                return <AlertTriangle className="text-amber-500" />;
            default:
                return <Info />;
        }
    };

    const getDeviceStatusIcon = (device: DeviceInfo) => {
        if (!device.authenticated) {
            return <AlertTriangle size={16} className="text-amber-500" />;
        }

        return device.status === 'online'
            ? <Check size={16} className="text-green-500" />
            : <XCircle size={16} className="text-red-500" />;
    };

    useEffect(() => {
        fetchFirmwareVersions();
    }, []);

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
                                    Mesh Rider Firmware Manager
                                </h1>
                                <p className="text-gray-400 mt-1">
                                    LAN-based smart radio updates with SharePoint integration
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="flex justify-between items-center">
                        <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={networkRange}
                                    onChange={(e) => setNetworkRange(e.target.value)}
                                    placeholder="Network Range (e.g. 10.223.42.0/24)"
                                    className="px-3 py-2 bg-gray-800 rounded-l-md border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <button
                                    onClick={scanNetwork}
                                    disabled={isScanning}
                                    className="flex items-center bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-r-md text-white font-medium transition-colors disabled:opacity-50"
                                >
                                    {isScanning ? (
                                        <RefreshCw size={18} className="mr-2 animate-spin" />
                                    ) : (
                                        <Search size={18} className="mr-2" />
                                    )}
                                    Scan Network
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setActiveTab('devices')}
                                className={`px-3 py-2 rounded-md font-medium text-sm ${activeTab === 'devices' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                            >
                                <Server size={16} className="inline mr-1" /> Devices
                            </button>
                            <button
                                onClick={() => setActiveTab('updates')}
                                className={`px-3 py-2 rounded-md font-medium text-sm ${activeTab === 'updates' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                            >
                                <Download size={16} className="inline mr-1" /> Updates
                            </button>
                            <button
                                onClick={() => setActiveTab('logs')}
                                className={`px-3 py-2 rounded-md font-medium text-sm ${activeTab === 'logs' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                            >
                                <FileText size={16} className="inline mr-1" /> Logs
                            </button>
                        </div>
                    </motion.div>

                    {statusMessage && (
                        <motion.div
                            variants={itemVariants}
                            className="bg-blue-900/20 border border-blue-800/30 rounded-xl p-4 flex items-center"
                        >
                            <div className="mr-3 text-blue-400">
                                {getUpdateStageIcon()}
                            </div>
                            <p>{statusMessage}</p>
                        </motion.div>
                    )}

                    {errorMessage && (
                        <motion.div
                            variants={itemVariants}
                            className="bg-red-900/20 border border-red-800/30 rounded-xl p-4 flex items-center"
                        >
                            <AlertTriangle size={20} className="mr-3 text-red-400" />
                            <p>{errorMessage}</p>
                            <button
                                onClick={() => setErrorMessage('')}
                                className="ml-auto text-gray-400 hover:text-white"
                            >
                                <XCircle size={16} />
                            </button>
                        </motion.div>
                    )}

                    <motion.div variants={itemVariants} className="bg-gray-850 rounded-2xl overflow-hidden shadow-xl">
                        {activeTab === 'devices' && (
                            <div className="p-6">
                                <h2 className="text-xl font-medium mb-4 flex items-center">
                                    <Network className="w-5 h-5 mr-2 text-blue-400" />
                                    <span>Connected Devices</span>
                                </h2>

                                {devices.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <Server size={48} className="mx-auto mb-4 opacity-50" />
                                        <p className="mb-4">No devices detected on the network.</p>
                                        <button
                                            onClick={scanNetwork}
                                            disabled={isScanning}
                                            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-white font-medium transition-colors disabled:opacity-50"
                                        >
                                            {isScanning ? 'Scanning...' : 'Scan for Devices'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {devices.map((device) => (
                                            <div
                                                key={device.ip}
                                                className="border border-gray-700 rounded-xl overflow-hidden bg-gray-800/50"
                                            >
                                                <div className="p-4 flex justify-between items-center">
                                                    <div className="flex items-center">
                                                        <div className="p-2 bg-gray-700 rounded-lg mr-3">
                                                            <Server size={24} />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-medium text-lg">{device.name}</h3>
                                                            <p className="text-gray-400 text-sm">{device.ip}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center space-x-2">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${device.authenticated ?
                                                            device.needsUpdate ? 'bg-amber-700/30 text-amber-400' : 'bg-green-700/30 text-green-400' :
                                                            'bg-red-700/30 text-red-400'
                                                            }`}>
                                                            {device.authenticated ?
                                                                device.needsUpdate ? 'Update Available' : 'Up to Date' :
                                                                'Authentication Failed'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="border-t border-gray-700 px-4 py-3 flex justify-between bg-gray-800/30">
                                                    <div className="grid grid-cols-2 gap-4 flex-grow">
                                                        <div>
                                                            <span className="text-gray-400 text-sm">Firmware:</span>
                                                            <span className="ml-2">{device.currentFirmware || 'Unknown'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400 text-sm">Status:</span>
                                                            <span className="ml-2 flex items-center">
                                                                {getDeviceStatusIcon(device)}
                                                                <span className="ml-1">{device.status}</span>
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400 text-sm">Board:</span>
                                                            <span className="ml-2">{device.boardName || 'Unknown'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400 text-sm">Target:</span>
                                                            <span className="ml-2">{device.target || 'Unknown'}</span>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        {device.authenticated && device.needsUpdate && (
                                                            <button
                                                                onClick={() => handleUpdateDevice(device)}
                                                                disabled={isUpdating}
                                                                className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-md text-white text-sm font-medium transition-colors disabled:opacity-50"
                                                            >
                                                                {isUpdating && selectedDevice?.ip === device.ip ? (
                                                                    <><RefreshCw size={14} className="inline mr-1 animate-spin" /> Updating...</>
                                                                ) : (
                                                                    <><Download size={14} className="inline mr-1" /> Update</>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'updates' && (
                            <div className="p-6">
                                <h2 className="text-xl font-medium mb-4 flex items-center">
                                    <CloudUpload className="w-5 h-5 mr-2 text-blue-400" />
                                    <span>Available Firmware Updates</span>
                                </h2>

                                {isUpdating && selectedDevice && (
                                    <div className="mb-6 bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-medium flex items-center">
                                                <RefreshCw className="w-5 h-5 mr-2 text-blue-400" />
                                                <span>Update Progress</span>
                                            </h3>

                                            <div className="text-right">
                                                <div className="text-lg font-semibold">{updateProgress.toFixed(1)}%</div>
                                                <div className="text-gray-400 text-sm">Updating {selectedDevice.name}</div>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-blue-600"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${updateProgress}%` }}
                                                    transition={{ duration: 0.5 }}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center">
                                                {updateStage === 'download' || updateStage === 'upload' || updateStage === 'install' || updateStage === 'monitoring' || updateStage === 'complete' ? (
                                                    <Check size={18} className="mr-3 text-green-500" />
                                                ) : (
                                                    <div className="w-[18px] h-[18px] mr-3" />
                                                )}
                                                <span className={updateStage === 'download' ? 'font-medium' : updateStage === 'upload' || updateStage === 'install' || updateStage === 'monitoring' || updateStage === 'complete' ? '' : 'text-gray-400'}>
                                                    Download firmware from SharePoint
                                                </span>
                                            </div>

                                            <div className="flex items-center">
                                                {updateStage === 'upload' || updateStage === 'install' || updateStage === 'monitoring' || updateStage === 'complete' ? (
                                                    <Check size={18} className="mr-3 text-green-500" />
                                                ) : updateStage === 'download' ? (
                                                    <RefreshCw size={18} className="mr-3 text-blue-500 animate-spin" />
                                                ) : (
                                                    <div className="w-[18px] h-[18px] mr-3" />
                                                )}
                                                <span className={updateStage === 'upload' ? 'font-medium' : updateStage === 'install' || updateStage === 'monitoring' || updateStage === 'complete' ? '' : 'text-gray-400'}>
                                                    Upload firmware to device
                                                </span>
                                            </div>

                                            <div className="flex items-center">
                                                {updateStage === 'install' || updateStage === 'monitoring' || updateStage === 'complete' ? (
                                                    <Check size={18} className="mr-3 text-green-500" />
                                                ) : updateStage === 'upload' ? (
                                                    <RefreshCw size={18} className="mr-3 text-blue-500 animate-spin" />
                                                ) : (
                                                    <div className="w-[18px] h-[18px] mr-3" />
                                                )}
                                                <span className={updateStage === 'install' ? 'font-medium' : updateStage === 'monitoring' || updateStage === 'complete' ? '' : 'text-gray-400'}>
                                                    Install firmware on device
                                                </span>
                                            </div>

                                            <div className="flex items-center">
                                                {updateStage === 'complete' ? (
                                                    <Check size={18} className="mr-3 text-green-500" />
                                                ) : updateStage === 'monitoring' ? (
                                                    <RefreshCw size={18} className="mr-3 text-blue-500 animate-spin" />
                                                ) : (
                                                    <div className="w-[18px] h-[18px] mr-3" />
                                                )}
                                                <span className={updateStage === 'monitoring' ? 'font-medium' : updateStage === 'complete' ? '' : 'text-gray-400'}>
                                                    Reboot and verify device
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {firmwareVersions.map((firmware) => (
                                        <div
                                            key={firmware.version}
                                            className={`border ${firmware.status === 'latest' ? 'border-blue-700' : 'border-gray-700'} rounded-xl overflow-hidden ${firmware.status === 'latest' ? 'bg-blue-900/20' : 'bg-gray-800/50'}`}
                                        >
                                            <div className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="flex items-center">
                                                            <h3 className="font-medium text-lg">Version {firmware.version}</h3>
                                                            {firmware.status === 'latest' && (
                                                                <span className="ml-2 bg-blue-600/30 text-blue-400 text-xs px-2 py-1 rounded-full">
                                                                    Latest
                                                                </span>
                                                            )}
                                                            {firmware.status === 'stable' && (
                                                                <span className="ml-2 bg-green-600/30 text-green-400 text-xs px-2 py-1 rounded-full">
                                                                    Stable
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-gray-400 text-sm mt-1">Released: {firmware.date}</p>
                                                    </div>

                                                    <div>
                                                        <a
                                                            href={firmware.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md text-white text-sm font-medium transition-colors inline-flex items-center"
                                                        >
                                                            <Download size={14} className="mr-1" />
                                                            Download
                                                        </a>
                                                    </div>
                                                </div>

                                                <div className="mt-3">
                                                    <h4 className="text-sm font-medium text-gray-300 mb-1">Release Notes:</h4>
                                                    <p className="text-gray-400 text-sm">{firmware.notes}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 bg-gray-800/30 rounded-xl p-5 border border-gray-700">
                                    <h3 className="text-lg font-medium mb-3 flex items-center">
                                        <Settings className="w-5 h-5 mr-2 text-blue-400" />
                                        <span>SharePoint Configuration</span>
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">
                                                SharePoint URL
                                            </label>
                                            <input
                                                type="text"
                                                value={sharepointConfig.url}
                                                onChange={(e) => setSharepointConfig({ ...sharepointConfig, url: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">
                                                Folder Path
                                            </label>
                                            <input
                                                type="text"
                                                value={sharepointConfig.folderPath}
                                                onChange={(e) => setSharepointConfig({ ...sharepointConfig, folderPath: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-400 mb-1">
                                                SharePoint Access Token
                                            </label>
                                            <input
                                                type="password"
                                                value={sharepointConfig.token}
                                                onChange={(e) => setSharepointConfig({ ...sharepointConfig, token: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4 flex justify-end">
                                        <button
                                            onClick={fetchFirmwareVersions}
                                            className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-md text-white text-sm font-medium transition-colors"
                                        >
                                            Refresh Firmware List
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'logs' && (
                            <div className="p-6">
                                <h2 className="text-xl font-medium mb-4 flex items-center">
                                    <FileText className="w-5 h-5 mr-2 text-blue-400" />
                                    <span>Operation Logs</span>
                                </h2>

                                <div className="bg-gray-900/70 rounded-lg font-mono text-sm h-96 overflow-y-auto p-4 border border-gray-700">
                                    {logs.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>No logs available. Start scanning or updating to generate logs.</p>
                                        </div>
                                    ) : (
                                        logs.map((log, index) => (
                                            <div
                                                key={index}
                                                className={`mb-1 ${log.type === 'error' ? 'text-red-400' :
                                                    log.type === 'warning' ? 'text-amber-400' :
                                                        log.type === 'success' ? 'text-green-400' :
                                                            'text-gray-400'
                                                    }`}
                                            >
                                                <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="mt-4 flex justify-between">
                                    <button
                                        onClick={() => setLogs([])}
                                        className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md text-white text-sm font-medium transition-colors"
                                    >
                                        Clear Logs
                                    </button>

                                    <button
                                        onClick={() => {
                                            const logText = logs.map(log => `[${log.timestamp}] ${log.message}`).join('\n');
                                            const blob = new Blob([logText], { type: 'text/plain' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `firmware-update-logs-${new Date().toISOString().split('T')[0]}.txt`;
                                            a.click();
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-md text-white text-sm font-medium transition-colors"
                                    >
                                        Download Logs
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    <motion.div variants={itemVariants} className="flex justify-between text-xs text-gray-500">
                        <div>
                            {devices.length ? `${devices.length} device(s) found • ${devices.filter(d => d.needsUpdate).length} update(s) available` : 'No devices connected'}
                        </div>
                        <div>
                            Mesh Rider Firmware Manager v1.0.0
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default FirmwareUpdateTool;