import React, { useState, FC, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import {
    Download,
    AlertTriangle,
    Check,
    ChevronDown,
    ChevronUp,
    Lock,
    Search,
    Radio,
    Shield,
    Package,
    Calendar,
    FileText,
    TerminalSquare,
    Info,
    Menu,
    X,
    Zap,
    Activity,
    ArrowRight,
    Layers,
    Wifi
} from 'lucide-react';

// Particle Background Component
const ParticleBackground = () => (
    <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black opacity-80"></div>
        <div className="w-full h-full bg-[radial-gradient(circle_at_center,rgba(60,70,90,0.8)_0%,transparent_70%)]"></div>
    </div>
);

const Animations = {
    containerVariants: {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    },
    itemVariants: {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    },
    fadeIn: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.5 } }
    }
};

interface FirmwareChecksum {
    sha256: string;
    md5: string;
}

interface BaseFirmware {
    version: string;
    releaseDate: string;
    size: string;
    status: string;
    hardwareModels: string[];
    downloadUrl: string;
    changes: string[];
    security?: string;
    checksums: FirmwareChecksum;
    dependencies: string[];
    hasTechnicalDocumentation: boolean;
    compatibilityScore: number;
    warning?: string;
    testResults?: string;
    developerNotes?: string;
    commitId?: string;
    testStatus?: string;
}

interface FirmwareData {
    stable: BaseFirmware[];
    beta: BaseFirmware[];
    developer: BaseFirmware[];
    [key: string]: BaseFirmware[];
}

interface FirmwarePortalProps {
    isDarkMode?: boolean;
    onBack?: () => void; // Add this new prop
}

const FirmwarePortal: FC<FirmwarePortalProps> = ({ isDarkMode = true, onBack }) => {
    const [activeTab, setActiveTab] = useState<'stable' | 'beta' | 'developer'>('stable');
    const [expandedVersion, setExpandedVersion] = useState('firmware-2024-10.4');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [advancedSearch, setAdvancedSearch] = useState(false);

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

    useEffect(() => {
        // Force scroll to top when component mounts
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;

        // Reset expanded version when changing tabs to avoid content being pushed down
        setExpandedVersion('');
    }, [activeTab]); // Add activeTab as a dependency to reset scroll on tab change

    const firmwareData: FirmwareData = {
        stable: [
            {
                version: 'firmware-2024-10.4',
                releaseDate: '2024-10-25',
                size: '15.8 MB',
                status: 'current',
                hardwareModels: ['RM-2030', 'RM-5700', 'RM-6200'],
                downloadUrl: '#',
                changes: [
                    'Added support in the automatic calibration restoration daemon for RM-2030 model variants.'
                ],
                security: 'Critical',
                checksums: {
                    sha256: '8a4b2c6d8e0f1a3c5e7g9i8j7k6l5m4n3o2p1q0r9s8t7u6v5w4x3y2z1',
                    md5: 'a1b2c3d4e5f6g7h8i9j0k1l2'
                },
                dependencies: [
                    'Bootloader v3.2 or later',
                    'Hardware revision A4 or newer for RM-2030'
                ],
                hasTechnicalDocumentation: true,
                compatibilityScore: 98
            },
            {
                version: 'firmware-2024-10.3',
                releaseDate: '2024-10-18',
                size: '15.6 MB',
                status: 'previous',
                hardwareModels: ['RM-5700', 'RM-6200'],
                downloadUrl: '#',
                changes: [
                    'Fixed a bug in the Simple Configuration page for RM-5700 Japan region where the Active Frequency Band was not selectable.'
                ],
                security: 'High',
                checksums: {
                    sha256: '7b5c3d9e1f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2c4d',
                    md5: 'c3d4e5f6g7h8i9j0k1l2m3'
                },
                dependencies: [
                    'Bootloader v3.2 or later'
                ],
                hasTechnicalDocumentation: true,
                compatibilityScore: 95
            },
            {
                version: 'firmware-2024-10.2',
                releaseDate: '2024-10-10',
                size: '15.5 MB',
                status: 'previous',
                hardwareModels: ['RM-5700', 'RM-6200', 'RM-3050'],
                downloadUrl: '#',
                changes: [
                    'Added support for new models where the available sub-models (frequency bands) can be added with a software license.',
                    'This feature has no impact on existing hardware.'
                ],
                security: 'Medium',
                checksums: {
                    sha256: '5d7e9f3a1c8b2d6e0f4g8h2i6j0k4l8m2n6o0p4q8r2s6t0u4v8w2x6y0z',
                    md5: 'e5f6g7h8i9j0k1l2m3n4o5'
                },
                dependencies: [
                    'Bootloader v3.2 or later'
                ],
                hasTechnicalDocumentation: true,
                compatibilityScore: 90
            }
        ],
        beta: [
            {
                version: 'firmware-2024-11.0-beta.2',
                releaseDate: '2024-10-30',
                size: '16.2 MB',
                status: 'beta',
                hardwareModels: ['RM-5700', 'RM-6200'],
                downloadUrl: '#',
                changes: [
                    'Improved signal processing algorithm with 15% better noise rejection.',
                    'New advanced frequency scanning capabilities.'
                ],
                warning: 'Not recommended for production environments. May cause instability on RM-5700 models manufactured before 2023.',
                checksums: {
                    sha256: '2a6c8e4f0g2h4i6j8k0l2m4n6o8p0q2r4s6t8u0v2w4x6y8z0a2b4c6d8e0',
                    md5: 'g7h8i9j0k1l2m3n4o5p6q7'
                },
                dependencies: [
                    'Bootloader v3.3 or later',
                    'Hardware revision 2.5+ for RM-5700'
                ],
                hasTechnicalDocumentation: true,
                compatibilityScore: 85,
                testResults: "Passes 45/48 automated tests"
            }
        ],
        developer: [
            {
                version: 'firmware-2024-11.0-dev.4',
                releaseDate: '2024-10-31',
                size: '16.5 MB',
                status: 'development',
                hardwareModels: ['RM-5700', 'RM-6200'],
                downloadUrl: '#',
                changes: [
                    'Integration of new DSP algorithms for adaptive noise cancellation.',
                    'Prototype implementation of dynamic frequency allocation for dense deployments.',
                    'API endpoint improvements for third-party integration.',
                    'Debug tools for signal analysis.'
                ],
                warning: 'Development build. Unstable and not for production use.',
                checksums: {
                    sha256: '0d2f4h6j8l0n2p4r6t8v0x2z4b6d8f0h2j4l6n8p0r2t4v6x8z0b2d4f6h',
                    md5: 'm3n4o5p6q7r8s9t0u1v2w3'
                },
                dependencies: [
                    'Bootloader v3.3 or later',
                    'Development hardware kit'
                ],
                hasTechnicalDocumentation: true,
                developerNotes: 'Includes debugging symbols and development tools. Memory footprint increased by 2.3MB.',
                commitId: 'fe8dc64',
                testStatus: 'Partial',
                compatibilityScore: 70
            }
        ]
    };

    const filteredVersions: BaseFirmware[] = (activeTab === 'developer' && !isAuthenticated)
        ? []
        : firmwareData[activeTab]?.filter(version => {
            const matchesSearch = searchQuery === '' ||
                version.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
                version.changes.some(change => change.toLowerCase().includes(searchQuery.toLowerCase()));

            return matchesSearch;
        }) || [];

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === 'developer' && password === 'password') {
            setIsAuthenticated(true);
            setShowModal(false);
            setNotificationMessage('Developer access granted');
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
        } else {
            setNotificationMessage('Invalid credentials');
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
        }
    };

    const toggleVersionDetails = (version: string) => {
        if (expandedVersion === version) {
            setExpandedVersion('');
        } else {
            setExpandedVersion(version);
        }
    };

    const handleDownload = (firmwareVersion: string) => {
        setNotificationMessage(`Downloading ${firmwareVersion}...`);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'current':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-00 bg-opacity-20 text-green-300"><Check size={12} className="mr-1" /> Current</span>;
            case 'beta':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500 bg-opacity-20 text-yellow-300"><AlertTriangle size={12} className="mr-1" /> Beta</span>;
            case 'previous':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500 bg-opacity-20 text-blue-300"><Info size={12} className="mr-1" /> Previous</span>;
            case 'development':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500 bg-opacity-20 text-purple-300"><TerminalSquare size={12} className="mr-1" /> Development</span>;
            default:
                return null;
        }
    };

    const getSecurityBadge = (level: string) => {
        switch (level) {
            case 'Critical':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500 bg-opacity-20 text-red-300"><Shield size={12} className="mr-1" /> Critical</span>;
            case 'High':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500 bg-opacity-20 text-orange-300"><Shield size={12} className="mr-1" /> High</span>;
            case 'Medium':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500 bg-opacity-20 text-yellow-300"><Shield size={12} className="mr-1" /> Medium</span>;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100">
            <ParticleBackground />

            {/* Add Back Button - Position it in the top left */}
            {onBack && (
                <button
                    onClick={onBack}
                    className="fixed top-4 left-4 z-50 p-1.5 rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors focus:outline-none shadow-lg"
                    aria-label="Go back to dashboard"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
            )}

            {/* Notification Toast */}
            {showNotification && (
                <div className="fixed top-4 right-4 z-50">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`px-4 py-3 rounded-lg shadow-lg flex items-center ${notificationMessage.includes('Invalid')
                            ? 'bg-red-600 text-white'
                            : 'bg-blue-600 text-white'
                            }`}
                    >
                        {notificationMessage.includes('Invalid')
                            ? <AlertTriangle size={18} className="mr-2" />
                            : <Check size={18} className="mr-2" />
                        }
                        <span>{notificationMessage}</span>
                    </motion.div>
                </div>
            )}

            {/* Mobile menu toggle */}
            {isMobile && (
                <div className="fixed top-4 right-4 z-50">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="bg-gray-800 p-2 rounded-full text-gray-300 shadow-md"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            )}

            {/* Mobile sidebar menu */}
            {isMobile && isMobileMenuOpen && (
                <div className="fixed inset-0 bg-gray-900/90 z-40 overflow-auto">
                    <div className="p-4 pt-16">
                        <div className="grid grid-cols-1 gap-4 mb-6">
                            <button
                                onClick={() => {
                                    setActiveTab('stable');
                                    setIsMobileMenuOpen(false);
                                }}
                                className="p-4 bg-gray-800 rounded-lg flex items-center gap-2"
                            >
                                <Check size={20} className="text-green-500" />
                                <span className="text-white">Stable Releases</span>
                            </button>

                            <button
                                onClick={() => {
                                    setActiveTab('beta');
                                    setIsMobileMenuOpen(false);
                                }}
                                className="p-4 bg-gray-800 rounded-lg flex items-center gap-2"
                            >
                                <AlertTriangle size={20} className="text-yellow-500" />
                                <span className="text-white">Beta Channel</span>
                            </button>

                            {isAuthenticated && (
                                <button
                                    onClick={() => {
                                        setActiveTab('developer');
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="p-4 bg-gray-800 rounded-lg flex items-center gap-2"
                                >
                                    <TerminalSquare size={20} className="text-purple-500" />
                                    <span className="text-white">Developer Builds</span>
                                </button>
                            )}

                            {!isAuthenticated && (
                                <button
                                    onClick={() => {
                                        setShowModal(true);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="p-4 bg-amber-900/30 rounded-lg flex items-center gap-2"
                                >
                                    <Lock size={20} className="text-amber-400" />
                                    <span className="text-white">Developer Access</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="relative z-20 pt-8 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={Animations.containerVariants}
                    className="space-y-8"
                >
                    <motion.div variants={Animations.itemVariants} className="flex items-center mb-6">
                        <div className="flex items-center">
                            <img src="https://learn.doodlelabs.com/hubfs/mesh%20rider%20logo.png" alt="Mesh Rider Logo" className="h-12 w-auto mr-4" />
                            <div>
                                <h1 className="text-2xl font-bold text-white">Mesh Rider Firmware Management</h1>
                                <p className="text-gray-400 mt-1">Network firmware deployment and version control</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Search Box */}
                    <motion.div variants={Animations.itemVariants} className="bg-gray-850 rounded-2xl overflow-hidden shadow-xl">
                        <div className="p-6 border-b border-gray-700">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-medium text-white flex items-center">
                                    <Search className="w-5 h-5 mr-2 text-amber-400" />
                                    <span>Find Firmware</span>
                                </h2>
                                <button
                                    onClick={() => setAdvancedSearch(!advancedSearch)}
                                    className="flex items-center text-sm px-3 py-1 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-300"
                                >
                                    <span>{advancedSearch ? "Simple Search" : "Advanced Search"}</span>
                                    {advancedSearch ? <ChevronUp className="ml-1 w-4 h-4" /> : <ChevronDown className="ml-1 w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search size={18} className="text-gray-500" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-10 pr-4 py-3 rounded-lg text-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:ring-amber-500 focus:border-amber-500 focus:outline-none focus:ring-2"
                                    placeholder="Search firmware by version, features, or changelog..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <AnimatePresence>
                                {advancedSearch && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="pt-4 mt-4 border-t border-gray-700">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <label htmlFor="model" className="block text-sm font-medium text-gray-300">Hardware Model</label>
                                                    <select
                                                        id="model"
                                                        className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full p-2.5"
                                                    >
                                                        <option value="">All Models</option>
                                                        <option value="RM-2030">RM-2030</option>
                                                        <option value="RM-5700">RM-5700</option>
                                                        <option value="RM-6200">RM-6200</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label htmlFor="security" className="block text-sm font-medium text-gray-300">Security Level</label>
                                                    <select
                                                        id="security"
                                                        className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full p-2.5"
                                                    >
                                                        <option value="">Any Level</option>
                                                        <option value="Critical">Critical</option>
                                                        <option value="High">High</option>
                                                        <option value="Medium">Medium</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label htmlFor="dateRange" className="block text-sm font-medium text-gray-300">Release Date</label>
                                                    <select
                                                        id="dateRange"
                                                        className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full p-2.5"
                                                    >
                                                        <option value="">Any Date</option>
                                                        <option value="7">Last 7 days</option>
                                                        <option value="30">Last 30 days</option>
                                                        <option value="90">Last 90 days</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* Firmware Categories - Make more prominent */}
                    <motion.div variants={Animations.itemVariants} className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center">
                                <Layers className="w-5 h-5 mr-2 text-amber-400" />
                                <span>Firmware Channels</span>
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div
                                className={`bg-gray-850 p-4 rounded-2xl shadow-md cursor-pointer hover:bg-gray-800 transition-colors ${activeTab === 'stable' ? 'ring-2 ring-amber-500' : ''}`}
                                onClick={() => setActiveTab('stable')}
                            >
                                <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-green-900/30 flex items-center justify-center mr-3">
                                        <Check className="w-5 h-5 text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-white">Stable Releases</h3>
                                        <p className="text-gray-400 text-sm">{firmwareData.stable.length} versions</p>
                                    </div>
                                </div>
                            </div>

                            <div
                                className={`bg-gray-850 p-4 rounded-2xl shadow-md cursor-pointer hover:bg-gray-800 transition-colors ${activeTab === 'beta' ? 'ring-2 ring-amber-500' : ''}`}
                                onClick={() => setActiveTab('beta')}
                            >
                                <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-yellow-900/30 flex items-center justify-center mr-3">
                                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-white">Beta Channel</h3>
                                        <p className="text-gray-400 text-sm">{firmwareData.beta.length} versions</p>
                                    </div>
                                </div>
                            </div>

                            <div
                                className={`bg-gray-850 p-4 rounded-2xl shadow-md cursor-pointer hover:bg-gray-800 transition-colors ${activeTab === 'developer' ? 'ring-2 ring-amber-500' : ''}`}
                                onClick={() => {
                                    if (!isAuthenticated) {
                                        setShowModal(true);
                                    } else {
                                        setActiveTab('developer');
                                    }
                                }}
                            >
                                <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-purple-900/30 flex items-center justify-center mr-3">
                                        {isAuthenticated ? (
                                            <TerminalSquare className="w-5 h-5 text-purple-400" />
                                        ) : (
                                            <Lock className="w-5 h-5 text-purple-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-white">Developer Builds</h3>
                                        <p className="text-gray-400 text-sm">
                                            {isAuthenticated
                                                ? `${firmwareData.developer.length} versions`
                                                : "Requires authentication"
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* System Status Cards */}


                    {/* Firmware section header - More visible */}
                    <motion.div variants={Animations.itemVariants} className="flex items-center justify-between mb-6 bg-blue-900/20 p-4 rounded-xl">
                        <div className="flex items-center">
                            <ArrowRight className="w-5 h-5 mr-2 text-amber-400" />
                            <h2 className="text-xl font-bold text-white">
                                {activeTab === 'stable' && 'Stable Releases'}
                                {activeTab === 'beta' && 'Beta Channel'}
                                {activeTab === 'developer' && 'Developer Builds'}
                            </h2>
                        </div>
                        <div className="bg-blue-900/30 text-blue-300 px-3 py-1.5 rounded-lg text-sm font-medium">
                            <Info className="inline-block h-4 w-4 mr-1" />
                            {filteredVersions.length} versions available
                        </div>
                    </motion.div>

                    {/* Firmware list */}
                    {filteredVersions.length === 0 ? (
                        <motion.div
                            variants={Animations.fadeIn}
                            className="bg-gray-850 rounded-2xl p-12 text-center shadow-xl border border-gray-700"
                        >
                            {activeTab === 'developer' && !isAuthenticated ? (
                                <div className="max-w-md mx-auto">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-900/50 text-purple-400 mb-6">
                                        <Lock size={28} />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-3 text-white">
                                        Developer Access Required
                                    </h3>
                                    <p className="text-gray-400 mb-6">
                                        You need developer credentials to access development builds. Please login with your developer account.
                                    </p>
                                    <motion.button
                                        onClick={() => setShowModal(true)}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-2 px-6 rounded-full shadow-lg flex items-center mx-auto space-x-2"
                                    >
                                        <Lock className="w-4 h-4" />
                                        <span>Developer Login</span>
                                    </motion.button>
                                </div>
                            ) : (
                                <div className="max-w-md mx-auto">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-700 text-gray-400 mb-6">
                                        <Search size={28} />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-3 text-white">
                                        No Matching Firmware
                                    </h3>
                                    <p className="text-gray-400">
                                        We couldn't find any firmware that matches your search. Try adjusting your search criteria.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div variants={Animations.itemVariants} className="space-y-6">
                            {filteredVersions.map((firmware: BaseFirmware, index) => (
                                <motion.div
                                    key={firmware.version}
                                    custom={index}
                                    variants={Animations.itemVariants}
                                    className="bg-white-150 rounded-2xl overflow-hidden shadow-xl border border-black-100"
                                >
                                    {/* Card header */}
                                    <div
                                        className={`p-5 cursor-pointer ${firmware.status === 'current' ? 'bg-gradient-to-r from-white-900/30 to-white-900/30' : ''
                                            }`}
                                        onClick={() => toggleVersionDetails(firmware.version)}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center">
                                                {firmware.status === 'current' && (
                                                    <div className="flex-shrink-0 h-10 w-1 bg-green-500 rounded-full mr-4"></div>
                                                )}
                                                <div>
                                                    <div className="flex items-center flex-wrap gap-2">
                                                        <h3 className="font-medium text-lg text-white">
                                                            {firmware.version}
                                                        </h3>
                                                        <div className="flex gap-2">
                                                            {getStatusBadge(firmware.status)}
                                                            {firmware.security && getSecurityBadge(firmware.security)}
                                                        </div>
                                                    </div>
                                                    <div className="mt-1 flex items-center text-xs text-gray-400">
                                                        <Calendar size={12} className="mr-1" />
                                                        <span className="mr-3">{firmware.releaseDate}</span>
                                                        <Package size={12} className="mr-1" />
                                                        <span>{firmware.size}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center mt-4 sm:mt-0">
                                                <motion.button
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    className="mr-3 px-4 py-2 rounded-lg text-white text-sm font-medium bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg transition-all flex items-center"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownload(firmware.version);
                                                    }}
                                                >
                                                    <Download size={14} className="mr-2" /> Download
                                                </motion.button>
                                                <button
                                                    className="p-2 rounded-full bg-white-700 text-gray-400 hover:bg-gray-600 hover:text-white transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleVersionDetails(firmware.version);
                                                    }}
                                                >
                                                    {expandedVersion === firmware.version ?
                                                        <ChevronUp size={18} /> :
                                                        <ChevronDown size={18} />
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card expanded content */}
                                    {expandedVersion === firmware.version && (
                                        <div className="p-5 border-t border-gray-700">
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                {/* Left column (changes and compatibility) */}
                                                <div className="lg:col-span-2">
                                                    <div className="mb-6">
                                                        <h4 className="text-sm font-semibold mb-3 text-gray-300 flex items-center">
                                                            <ArrowRight className="w-4 h-4 mr-2 text-amber-400" />
                                                            What's New
                                                        </h4>
                                                        <ul className="space-y-2 text-gray-300">
                                                            {firmware.changes.map((change: string, index: number) => (
                                                                <li key={index} className="flex items-start">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 mr-2 flex-shrink-0"></div>
                                                                    <span className="text-sm">{change}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    <div className="mb-6">
                                                        <h4 className="text-sm font-semibold mb-3 text-gray-300 flex items-center">
                                                            <Radio className="w-4 h-4 mr-2 text-amber-400" />
                                                            Compatible Hardware
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {firmware.hardwareModels.map((model: string, index: number) => (
                                                                <span
                                                                    key={index}
                                                                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-white-700 text-gray-300 border border-gray-600"
                                                                >
                                                                    {model}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {firmware.warning && (
                                                        <div className="p-4 mb-6 rounded-lg bg-yellow-900/30 text-yellow-300 flex">
                                                            <AlertTriangle size={18} className="mr-3 mt-0.5 flex-shrink-0" />
                                                            <span className="text-sm">{firmware.warning}</span>
                                                        </div>
                                                    )}

                                                    {firmware.dependencies && (
                                                        <div className="mb-6">
                                                            <h4 className="text-sm font-semibold mb-3 text-gray-300 flex items-center">
                                                                <Activity className="w-4 h-4 mr-2 text-amber-400" />
                                                                Requirements
                                                            </h4>
                                                            <ul className="space-y-2 text-gray-300">
                                                                {firmware.dependencies.map((dep: string, index: number) => (
                                                                    <li key={index} className="flex items-start">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 mr-2 flex-shrink-0"></div>
                                                                        <span className="text-sm">{dep}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right column (technical details) */}
                                                <div>
                                                    {/* Compatibility card */}
                                                    <div className="rounded-lg p-4 mb-4 bg-gray-800/50 border border-gray-700">
                                                        <h4 className="text-sm font-semibold mb-3 flex items-center text-gray-300">
                                                            <Shield size={14} className="mr-2 text-amber-400" />
                                                            Compatibility
                                                        </h4>

                                                        <div className="mb-2">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-xs text-gray-400">
                                                                    Compatibility Score
                                                                </span>
                                                                <span className="text-xs font-medium text-gray-300">
                                                                    {firmware.compatibilityScore}%
                                                                </span>
                                                            </div>
                                                            <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full ${firmware.compatibilityScore > 90
                                                                        ? 'bg-green-500'
                                                                        : firmware.compatibilityScore > 70
                                                                            ? 'bg-yellow-500'
                                                                            : 'bg-red-500'
                                                                        }`}
                                                                    style={{ width: `${firmware.compatibilityScore}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>

                                                        {firmware.testResults && (
                                                            <div className="mt-3 text-xs text-gray-400">
                                                                {firmware.testResults}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* File verification card */}
                                                    <div className="rounded-lg p-4 mb-4 bg-gray-800/50 border border-gray-700">
                                                        <h4 className="text-sm font-semibold mb-3 flex items-center text-gray-300">
                                                            <Shield size={14} className="mr-2 text-amber-400" />
                                                            File Verification
                                                        </h4>

                                                        <div className="mb-3">
                                                            <p className="text-xs font-medium mb-1 text-gray-400">
                                                                SHA-256 Checksum:
                                                            </p>
                                                            <div className="p-2 rounded bg-grey-900/50 text-xs text-blue-400 mb-2 break-all font-mono">
                                                                {firmware.checksums.sha256}
                                                            </div>

                                                            <p className="text-xs font-medium mb-1 text-gray-400">
                                                                MD5 Checksum:
                                                            </p>
                                                            <div className="p-2 rounded bg-black-900/50 text-xs text-gray-400 break-all font-mono">
                                                                {firmware.checksums.md5}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Documentation links */}
                                                    <div className="space-y-2">
                                                        <motion.button
                                                            whileHover={{ scale: 1.03 }}
                                                            whileTap={{ scale: 0.97 }}
                                                            className="w-full py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white transition-colors"
                                                        >
                                                            <FileText size={14} className="mr-2" /> Release Notes
                                                        </motion.button>

                                                        {firmware.hasTechnicalDocumentation && (
                                                            <button className="w-full py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors">
                                                                <FileText size={14} className="mr-2" /> Technical Documentation
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Developer notes - only visible for developer builds */}
                                                    {firmware.developerNotes && (
                                                        <div className="mt-4 rounded-lg p-4 bg-purple-900/30 text-purple-300">
                                                            <h4 className="text-sm font-semibold mb-2 flex items-center">
                                                                <TerminalSquare size={14} className="mr-2" /> Developer Notes
                                                            </h4>
                                                            <p className="text-xs">{firmware.developerNotes}</p>
                                                            {firmware.commitId && (
                                                                <div className="mt-2 text-xs">
                                                                    Commit: <code className="font-mono bg-gray-900/50 px-1 py-0.5 rounded">{firmware.commitId}</code>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    <motion.div variants={Animations.itemVariants} className="text-center text-xs text-gray-400 mt-8">
                        <p>Mesh Rider Firmware Management Portal</p>
                        <p className="mt-1">© 2024 Doodle Labs. All rights reserved.</p>
                    </motion.div>
                </motion.div>
            </div>

            {/* Developer login modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full p-6 rounded-xl shadow-2xl bg-gray-850 border border-gray-700"
                    >
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-900/30 text-amber-400 mb-4">
                                <Lock size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white">
                                Developer Access
                            </h3>
                            <p className="mt-1 text-sm text-gray-400">
                                Enter your credentials to access developer builds
                            </p>
                        </div>

                        <form onSubmit={handleLogin}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1 text-gray-300">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    className="block w-full px-3 py-2.5 rounded-lg text-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:ring-amber-500 focus:border-amber-500 focus:outline-none focus:ring-2"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="developer"
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-1 text-gray-300">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    className="block w-full px-3 py-2.5 rounded-lg text-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:ring-amber-500 focus:border-amber-500 focus:outline-none focus:ring-2"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="password"
                                />
                            </div>
                            <div className="flex justify-between items-center">
                                <button
                                    type="button"
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-black-700 hover:bg-gray-600 text-gray-300 transition-colors"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    type="submit"
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="px-4 py-2 rounded-lg text-white text-sm font-medium bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md transition-colors"
                                >
                                    Login
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default FirmwarePortal;