"use client";

import React, { useState, useEffect, FC } from 'react';
import LogFileUpload from './logviewer/LogFileUpload';
import RangeCalculator from './Range';
import ThroughputCalculator from './ThroughputCalculator';
import ParticleBackground from './ParticleBackground';
import LinkStatusAnalyzer from './logviewer/LinkStatusAnalyzer';
import ThemeToggle from './ThemeToggle';
import MeshRiderApp from './MeshRiderApp';
import AIAssistant from './AIAssistant'; // Import the new component
import { useTheme } from './ThemeProvider';
import { useToolContext } from './context/ToolContext'; // Import the context
import { motion } from 'framer-motion';
import FloatingChatButton from './FloatingChatButton';
import ApiManagementPlatform from './ApiManagementPlatform';
import FirmwarePortal from './FirmwarePortal';
import MeshRadioPortal from './MeshRadioPortal';

interface Tool {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    iconBg: string;
    comingSoon?: boolean; // Add this flag
}

interface ToolHeaderProps {
    title: string;
}

const heroVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0, transition: { duration: 1.2 } },
};

const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } },
};

const ComingSoonRibbon = () => (
    <div className="absolute -top-1 -right-1 overflow-hidden w-24 h-24 z-10">
        <div className="absolute top-0 right-0 transform rotate-45 translate-y-4 -translate-x-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold py-1 px-8 shadow-md">
            COMING SOON
        </div>
    </div>
);

const MeshToolbox: FC = () => {
    const { isDarkMode } = useTheme();
    const {
        logFileContent,
        setLogFileContent,
        activeTool,
        setActiveTool
    } = useToolContext();

    const [hoveredTool, setHoveredTool] = useState<string | null>(null);
    const [animateCards, setAnimateCards] = useState<boolean>(false);

    useEffect(() => {
        setAnimateCards(true);
    }, []);

    const tools: Tool[] = [
        {
            id: "logviewer",
            title: "Mesh Rider Log Viewer",
            description: "Dive deep into network logs with interactive visualizations.",
            icon: "📋",
            color: "#10B981",
            iconBg: "#D1FAE5",
        },
        {
            id: "throughput",
            title: "Throughput Estimation",
            description: "Analyze network throughput with precision performance charts.",
            icon: "📊",
            color: "#3B82F6",
            iconBg: "#DBEAFE",
        },
        {
            id: "range",
            title: "Range Estimation",
            description: "Optimize your network range with advanced analytics.",
            icon: "📏",
            color: "#8B5CF6",
            iconBg: "#EDE9FE",
        },
        {
            id: "app",
            title: "Mesh Rider App",
            description: "Control and monitor your network on the go.",
            icon: "📱",
            color: "#06B6D4",    // Changed from #F43F5E
            iconBg: "#CFFAFE",  // Changed from #FFE4E6
        },
        {
            id: "ai",
            title: "Mesh Rider AI Agent",
            description: "Get instant help and insights with our AI-powered assistant.",
            icon: "🤖",
            color: "#F59E0B",
            iconBg: "#FEF3C7",
            comingSoon: true
        },
        {
            id: "api",
            title: "API Management",
            description: "Configure and test network APIs with our interactive console.",
            icon: "🔌",
            color: "#EC4899",
            iconBg: "#FCE7F3",
            comingSoon: true // Add this flag
        },
        {
            id: "meshconnect",
            title: "Mesh Rider Firmware",
            description: "Manage firmware updates with comprehensive versioning control system.",
            icon: "🔄",
            color: "#0EA5E9",
            iconBg: "#BAE6FD",
        },
        {
            id: "meshmulti",
            title: "Mesh Rider Multi-Device",
            description: "Manage multiple devices with ease and efficiency.",
            icon: "🔄",
            color: "#0EA5E9",
            iconBg: "#BAE6FD",
        },
    ];

    // Minimal inline icons for each tool card
    const getToolIcon = (toolId: string) => {
        switch (toolId) {
            case 'throughput':
                return (
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="#3B82F6" strokeWidth="2" />
                        <path d="M8 16V12" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
                        <path d="M12 16V8" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
                        <path d="M16 16V10" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                );
            case 'range':
                return (
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9" stroke="#8B5CF6" strokeWidth="2" />
                        <circle cx="12" cy="12" r="5" stroke="#8B5CF6" strokeWidth="2" />
                        <circle cx="12" cy="12" r="1" fill="#8B5CF6" />
                    </svg>
                );
            case 'logviewer':
                return (
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                        <path d="M14 3H6C4.895 3 4 3.895 4 5V19C4 20.105 4.895 21 6 21H18C19.105 21 20 20.105 20 19V9L14 3Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M14 3V9H20" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M8 13H16" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M8 17H16" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                );
            case 'app':
                return (
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                        <rect x="5" y="2" width="14" height="20" rx="3" stroke="#06B6D4" strokeWidth="2" />
                        <path d="M12 18H12.01" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                );
            case 'meshconnect':
                return (
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                        <path d="M12 16V21" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M8 16H16" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <rect x="4" y="3" width="16" height="13" rx="2" stroke="#0EA5E9" strokeWidth="2" />
                        <path d="M9 9L12 12L15 9" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 12V6" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                );
            case 'ai':
                return (
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="#F59E0B" strokeWidth="2" />
                        <path d="M8 12C8 10 9.5 9 12 9C14.5 9 16 10 16 12C16 14 14.5 15 12 15C9.5 15 8 14 8 12Z" stroke="#F59E0B" strokeWidth="2" />
                        <path d="M12 16V18" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
                        <path d="M9 7L10 8" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
                        <path d="M15 7L14 8" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                );
            case 'api':
                return (
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                        <path d="M4 6H20M4 12H20M4 18H14" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M17 16L21 20M21 16L17 20" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                );
            case 'meshmulti':
                return (
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                        <path d="M12 16V21" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M8 16H16" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <rect x="4" y="3" width="16" height="13" rx="2" stroke="#0EA5E9" strokeWidth="2" />
                        <path d="M9 9L12 12L15 9" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 12V6" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const handleToolLaunch = (toolId: string): void => {
        setActiveTool(toolId);
    };
    const handleBackToMain = (): void => {
        setActiveTool(null);
    };

    // Simple subheader
    const ToolHeader: FC<ToolHeaderProps> = ({ title }) => (
        <div className="flex items-center justify-between mb-8">
            <button
                onClick={handleBackToMain}
                className="flex items-center text-lg font-semibold transition-transform hover:scale-105"
            >
                <svg className="w-6 h-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Toolbox
            </button>
            <ThemeToggle />
        </div>
    );

    if (activeTool === 'throughput') {
        return (
            <div className="min-h-screen overflow-y-auto transition-colors bg-gray-900">
                <div className="max-w-6xl mx-auto p-6 pb-24">
                    <ToolHeader title="Throughput Estimation Tool" />
                    <ThroughputCalculator />
                </div>
            </div>
        );
    }
    if (activeTool === 'range') {
        return (
            <div className="min-h-screen overflow-y-auto transition-colors bg-gray-900">
                <div className="max-w-6xl mx-auto p-6 pb-24">
                    <ToolHeader title="Range Estimation Tool" />
                    <RangeCalculator />
                </div>
            </div>
        );
    }
    if (activeTool === 'meshconnect') {
        return (
            <div className="min-h-screen overflow-y-auto transition-colors bg-gray-900">
                <div className="max-w-6xl mx-auto p-6 pb-24">
                    <FirmwarePortal
                        isDarkMode={isDarkMode}
                        onBack={() => {
                            console.log("Back button clicked");
                            setActiveTool(null); // or router.push('/') or whatever navigation you need
                        }}
                    />
                </div>
            </div>
        );
    }

    if (activeTool === 'meshmulti') {
        return (
            <div className="min-h-screen overflow-y-auto transition-colors bg-gray-900">
                <div className="max-w-6xl mx-auto p-6 pb-24">
                    <ToolHeader title="Multi Device" />
                    <MeshRadioPortal />
                </div>
            </div>
        );
    }
    if (activeTool === 'logviewer') {
        return (
            <div className="min-h-screen overflow-y-auto transition-colors bg-gray-900">
                <LogFileUpload
                    onFileLoaded={(content) => {
                        setLogFileContent(content);
                        setActiveTool('logviewer-analysis');
                    }}
                    onBack={() => setActiveTool('')} // This will return to the main dashboard
                />
            </div>
        );
    }

    if (activeTool === 'logviewer-analysis') {
        return (
            <div className="min-h-screen overflow-y-auto transition-colors bg-gray-900">
                <LinkStatusAnalyzer
                    initialData={logFileContent || undefined}
                    onBack={() => setActiveTool('logviewer')}
                />
            </div>
        );
    }


    if (activeTool === 'app') {
        return (
            <div className="min-h-screen overflow-y-auto transition-colors bg-gray-900">
                <div className="max-w-6xl mx-auto p-6 pb-24">
                    <ToolHeader title="Mesh Rider Mobile App" />
                    <MeshRiderApp />
                </div>
            </div>
        );
    }

    if (activeTool === 'ai') {
        return (
            <div className="min-h-screen overflow-y-auto transition-colors bg-gray-900">
                <div className="max-w-6xl mx-auto p-6 pb-24">
                    <ToolHeader title="MeshRider AI Assistant" />
                    <AIAssistant />
                </div>
            </div>
        );
    }
    if (activeTool === 'api') {
        return (
            <div className="min-h-screen overflow-y-auto transition-colors bg-gray-900">
                <div className="max-w-6xl mx-auto p-6 pb-24">
                    <ToolHeader title="API Management Platform" />
                    <ApiManagementPlatform />
                </div>
            </div>
        );
    }

    return (
        <div className={`relative min-h-screen w-full overflow-y-auto transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
            {isDarkMode ? (
                <ParticleBackground />
            ) : (<ParticleBackground />)}

            <div className="relative z-20 max-w-7xl mx-auto p-4 pb-24">
                <ThemeToggle />

                <motion.section
                    className="text-center mb-10 pt-4"
                    variants={heroVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="flex flex-col items-center justify-center">
                        <img src="/logo.png" alt="Mesh Rider Logo" className="h-16 w-auto mb-4" />
                        <h2 className="text-5xl font-extrabold glowing-text mb-4">Mesh Rider Toolbox</h2>
                        <p className="text-xl max-w-3xl mx-auto">
                            Discover advanced tools for configuration, monitoring, and management
                            designed to optimize your Mesh Rider network.
                        </p>
                    </div>
                </motion.section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    {tools.map((tool, index) => (
                        <motion.div
                            key={tool.id}
                            className="relative theme-card border rounded-xl overflow-hidden shadow-2xl transition-all"
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
                            style={{ transitionDelay: `${index * 100}ms` }}
                            onMouseEnter={() => setHoveredTool(tool.id)}
                            onMouseLeave={() => setHoveredTool(null)}
                        >
                            {tool.comingSoon && <ComingSoonRibbon />}
                            <div className="absolute inset-0 bg-gradient-to-br opacity-40"
                                style={{
                                    background: `linear-gradient(135deg, ${tool.color}40 0%, transparent 60%)`
                                }}
                            />
                            <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full blur-3xl"
                                style={{
                                    background: `radial-gradient(circle, ${tool.color}20 0%, transparent 70%)`
                                }}
                            />
                            <div className="relative z-10 p-6">
                                <div className="flex items-center">
                                    <div
                                        className="flex-shrink-0 p-4 rounded-xl transition-transform duration-300"
                                        style={{
                                            backgroundColor: `${tool.color}20`,
                                            transform: hoveredTool === tool.id ? 'scale(1.1) rotate(5deg)' : 'scale(1)',
                                        }}
                                    >
                                        {getToolIcon(tool.id)}
                                    </div>
                                    <div className="ml-4 text-left">
                                        <h3
                                            className="text-2xl font-bold"
                                            style={{
                                                color: hoveredTool === tool.id ? tool.color : isDarkMode ? '#fff' : '#333',
                                            }}
                                        >
                                            {tool.title}
                                        </h3>
                                        <p className="text-sm text-gray-400 mt-2">{tool.description}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleToolLaunch(tool.id)}
                                    className="mt-6 w-full py-3 rounded-lg font-medium transition-colors duration-300"
                                    style={{
                                        backgroundColor: hoveredTool === tool.id ? tool.color : `${tool.color}20`,
                                        color: hoveredTool === tool.id ? '#fff' : tool.color,
                                    }}
                                >
                                    Launch Tool
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="p-6 rounded-xl border bg-opacity-30 backdrop-blur-lg mb-16">
                    <h2 className="text-2xl font-bold mb-4">Recent Updates</h2>
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                            <p className="text-gray-300">Mesh Rider Mobile App now available on Android, Windows, and Linux/Ubuntu OS</p>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                            <p className="text-gray-300">Throughput Estimation Tool updated with enhanced accuracy and real-time metrics</p>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-purple-500 mr-3"></div>
                            <p className="text-gray-300">Range Estimation Tool now integrates terrain analysis for precision results</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MeshToolbox;