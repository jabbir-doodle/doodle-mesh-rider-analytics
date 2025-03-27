import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Bot, User, Loader2, X, Check, Copy, ChevronDown, ChevronUp,
    Radio, Activity, Signal, Sparkles, MessageSquare, HelpCircle, ThumbsUp,
    ThumbsDown, Zap, Wifi, BarChart2, Info, RefreshCw, MapPin
} from 'lucide-react';
import {
    CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip,
    LineChart, Line, Legend, ReferenceLine,
    ScatterChart, Scatter, ZAxis
} from 'recharts';
import { useToolContext } from '../context/ToolContext';
import { enhanceSystemPrompt, enhanceAIResponse } from '../enhancedResponseProcessor';
import { toast } from 'sonner';
import type { Message } from '@/types';
import { useRouter } from 'next/navigation';

type CoveragePoint = {
    x: number;
    y: number;
    z: number;
    snr?: number;
    distance?: number;
};

interface AIAssistantProps {
    showInSidebar?: boolean;
}

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

const chartVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
        opacity: 1,
        height: 'auto',
        transition: {
            duration: 0.4,
            ease: "easeInOut"
        }
    },
    exit: {
        opacity: 0,
        height: 0,
        transition: {
            duration: 0.3,
            ease: "easeInOut"
        }
    }
};

const AIAssistant: React.FC<AIAssistantProps> = ({ showInSidebar = false }) => {
    const router = useRouter();
    const { activeTool, setActiveTool } = useToolContext();
    const [input, setInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [expandedCharts, setExpandedCharts] = useState<number[]>([]);
    const [assistantMode, setAssistantMode] = useState<'chat' | 'expert'>('expert');
    const [showFeedback, setShowFeedback] = useState<number | null>(null);
    const [animateInput, setAnimateInput] = useState(false);
    const [activeChartTab, setActiveChartTab] = useState<'throughput' | 'snr' | 'coverage'>('throughput');
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Hello! I'm your Mesh Rider AI Assistant by Doodle Labs. How can I help optimize your wireless mesh network today?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (activeTool) setShowSuggestions(true);
    }, [activeTool]);

    const sendMessage = async (inputText: string) => {
        if (!inputText.trim() || isLoading) return false;
        try {
            setIsLoading(true);
            setLastError(null);
            const userMessage: Message = {
                role: 'user',
                content: inputText,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, userMessage]);
            const systemPrompt = "You are a highly technical Mesh Rider AI Assistant specialized in wireless mesh network optimization.";
            const enhancedPrompt = enhanceSystemPrompt(systemPrompt, activeTool || 'default');
            const payloadMessages = [
                { role: 'system', content: enhancedPrompt },
                ...messages.map(msg => ({ role: msg.role, content: msg.content })),
                { role: 'user', content: inputText }
            ];
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: payloadMessages, context: { activeTool, logFileContent: '' } })
            });
            if (!res.ok) throw new Error(`API response error: ${res.status}`);
            const data = await res.json();
            const aiResponseText: string = data.content;
            const enhancedResponse = enhanceAIResponse(aiResponseText, inputText, activeTool || 'default');
            setMessages(prev => [...prev, enhancedResponse]);
            return true;
        } catch (error) {
            setLastError(error instanceof Error ? error.message : 'Unknown error');
            toast.error("Error processing request. Please try again.");
            const errorMsg: Message = {
                role: 'assistant',
                content: "I'm sorry, but I encountered an error processing your request. Please try again.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorMsg]);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const clearMessages = () => {
        setMessages([
            {
                role: 'assistant',
                content: "Hello! I'm your Mesh Rider AI Assistant by Doodle Labs. How can I help optimize your wireless mesh network today?",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ]);
        toast.success("Conversation history cleared");
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (await sendMessage(input)) setInput('');
    };

    const handleCopyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const toggleChartExpansion = (index: number) => {
        setExpandedCharts(expandedCharts.includes(index)
            ? expandedCharts.filter(i => i !== index)
            : [...expandedCharts, index]
        );
    };

    const suggestions = {
        general: [
            "What's the difference between RSSI and SNR?",
            "How do environmental factors affect my mesh network?",
            "Which Doodle Labs radio would work best for my deployment?"
        ],
        range: [
            "Calculate maximum range for 5GHz at 20MHz bandwidth",
            "How to optimize my antenna setup for rainy environments?",
            "What's the impact of multipath fading on my network?"
        ],
        throughput: [
            "Calculate throughput at 2km using RM-1700 in clear weather",
            "What MCS rate should I expect with -65dBm RSSI?",
            "Bandwidth vs range tradeoffs for my Smart Radio"
        ],
        logviewer: [
            "Analyze this log for network bottlenecks",
            "What's causing packet loss between these nodes?",
            "How to improve mesh stability in my topology?"
        ],
        products: [
            "Compare OEM vs Wearable form factors",
            "Which frequency band is best for long-distance links?",
            "Recommend a radio for drone operations in urban areas"
        ]
    };

    const getActiveSuggestions = () => {
        if (activeTool === 'range') return [...suggestions.range, ...suggestions.general];
        if (activeTool === 'throughput') return [...suggestions.throughput, ...suggestions.general];
        if (activeTool === 'logviewer' || activeTool === 'logviewer-analysis') return [...suggestions.logviewer, ...suggestions.general];
        return suggestions.general;
    };

    const handleSuggestionClick = (s: string) => {
        setInput(s);
        setAnimateInput(true);
        if (inputRef.current) inputRef.current.focus();
    };

    const renderThroughputChart = (data: any) => (
        <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="distance" label={{ value: "Distance (km)", position: "insideBottom", offset: -5, fill: "#aaa" }} tick={{ fill: "#aaa" }} />
                    <YAxis
                        yAxisId="left"
                        label={{ value: "Throughput (Mbps)", angle: -90, position: "insideLeft", offset: 10, fill: "#f59e0b" }}
                        stroke="#f59e0b"
                        tick={{ fill: "#aaa" }}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        label={{ value: "Fresnel Zone (m)", angle: 90, position: "insideRight", offset: 10, fill: "#10b981" }}
                        stroke="#10b981"
                        tick={{ fill: "#aaa" }}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: "rgba(17,24,39,0.95)", borderColor: "#4b5563", color: "#e5e7eb", borderRadius: "0.5rem", border: "none" }}
                        labelStyle={{ color: "#f3f4f6", fontWeight: "bold", marginBottom: "0.5rem" }}
                        itemStyle={{ padding: "0.25rem 0" }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "1rem" }} />
                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="throughput"
                        name="Throughput (Mbps)"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        dot={{ stroke: "#f59e0b", strokeWidth: 2, r: 4, fill: "#f59e0b" }}
                        activeDot={{ stroke: "#f59e0b", strokeWidth: 2, r: 6, fill: "#f59e0b" }}
                        animationDuration={1500}
                    />
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="fresnelClearance"
                        name="Fresnel Zone (m)"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ stroke: "#10b981", strokeWidth: 2, r: 4, fill: "#10b981" }}
                        activeDot={{ stroke: "#10b981", strokeWidth: 2, r: 6, fill: "#10b981" }}
                        animationDuration={1500}
                        animationBegin={300}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );

    const renderSnrChart = (data: any) => (
        <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="distance" label={{ value: "Distance (km)", position: "insideBottom", offset: -5, fill: "#aaa" }} tick={{ fill: "#aaa" }} />
                    <YAxis label={{ value: "SNR (dB)", angle: -90, position: "insideLeft", offset: 10, fill: "#3b82f6" }} stroke="#3b82f6" tick={{ fill: "#aaa" }} />
                    <Tooltip
                        contentStyle={{ backgroundColor: "rgba(17,24,39,0.95)", borderColor: "#4b5563", color: "#e5e7eb", borderRadius: "0.5rem", border: "none" }}
                        labelStyle={{ color: "#f3f4f6", fontWeight: "bold", marginBottom: "0.5rem" }}
                        itemStyle={{ padding: "0.25rem 0" }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "1rem" }} />
                    <Line
                        type="monotone"
                        dataKey="snr"
                        name="Signal-to-Noise Ratio (dB)"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ stroke: "#3b82f6", strokeWidth: 2, r: 4, fill: "#3b82f6" }}
                        activeDot={{ stroke: "#3b82f6", strokeWidth: 2, r: 6, fill: "#3b82f6" }}
                        animationDuration={1500}
                    />
                    {data[0]?.receivedPower && (
                        <Line
                            type="monotone"
                            dataKey="receivedPower"
                            name="Received Signal Power (dBm)"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            dot={{ stroke: "#8b5cf6", strokeWidth: 2, r: 4, fill: "#8b5cf6" }}
                            activeDot={{ stroke: "#8b5cf6", strokeWidth: 2, r: 6, fill: "#8b5cf6" }}
                            animationDuration={1500}
                            animationBegin={200}
                        />
                    )}
                    <ReferenceLine y={25} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Excellent', position: 'right', fill: '#10b981' }} />
                    <ReferenceLine y={15} stroke="#eab308" strokeDasharray="3 3" label={{ value: 'Good', position: 'right', fill: '#eab308' }} />
                    <ReferenceLine y={10} stroke="#f97316" strokeDasharray="3 3" label={{ value: 'Fair', position: 'right', fill: '#f97316' }} />
                    <ReferenceLine y={5} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Poor', position: 'right', fill: '#ef4444' }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );

    const renderCoverageMap = (data: CoveragePoint[]) => {
        const maxDistance = Math.max(...data.map((p) => p.distance || 0));
        const coveragePoints: CoveragePoint[] = [];
        const angles = [0, 45, 90, 135, 180, 225, 270, 315];
        data.forEach((point) => {
            angles.forEach((angle) => {
                const radians = angle * Math.PI / 180;
                coveragePoints.push({
                    x: Math.cos(radians) * (point.distance || 0) * 1000,
                    y: Math.sin(radians) * (point.distance || 0) * 1000,
                    z: point.z,
                    snr: point.snr,
                    distance: point.distance
                });
            });
        });

        return (
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            type="number"
                            dataKey="x"
                            domain={[-(maxDistance || 0) * 1000, (maxDistance || 0) * 1000]}
                            tick={{ fill: "#aaa" }}
                            label={{ value: "Distance East-West (m)", position: "insideBottom", offset: -5, fill: "#aaa" }}
                        />
                        <YAxis
                            type="number"
                            dataKey="y"
                            domain={[-(maxDistance || 0) * 1000, (maxDistance || 0) * 1000]}
                            tick={{ fill: "#aaa" }}
                            label={{ value: "Distance North-South (m)", angle: -90, position: "insideLeft", offset: 10, fill: "#aaa" }}
                        />
                        <ZAxis type="number" range={[50, 400]} />
                        <Tooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            formatter={(value, name, props) => {
                                if (name === 'z') return [`${(props.payload as CoveragePoint).z.toFixed(1)} Mbps`, 'Throughput'];
                                if (name === 'distance') return [`${(props.payload as CoveragePoint).distance?.toFixed(2)} km`, 'Distance'];
                                if (name === 'snr') return [`${(props.payload as CoveragePoint).snr?.toFixed(1)} dB`, 'SNR'];
                                return [value, name];
                            }}
                            contentStyle={{ backgroundColor: "rgba(17,24,39,0.95)", borderColor: "#4b5563", color: "#e5e7eb", borderRadius: "0.5rem", border: "none" }}
                        />
                        <Legend />
                        <Scatter
                            name="Coverage"
                            data={coveragePoints}
                            fill="#3b82f6"
                            fillOpacity={0.7}
                        />
                        <Scatter
                            name="Transmitter"
                            data={[{ x: 0, y: 0, z: 100 }]}
                            fill="#f43f5e"
                            shape="cross"
                            legendType="none"
                        />
                        <ReferenceLine x={0} stroke="#6b7280" />
                        <ReferenceLine y={0} stroke="#6b7280" />
                        {[1, 2, 3, 5].filter(d => d <= (maxDistance || 0)).map((radius) => {
                            const ringPoints: CoveragePoint[] = [];
                            for (let angle = 0; angle < 360; angle += 10) {
                                const radians = angle * Math.PI / 180;
                                ringPoints.push({
                                    x: Math.cos(radians) * radius * 1000,
                                    y: Math.sin(radians) * radius * 1000,
                                    z: 1
                                });
                            }
                            return (
                                <Scatter
                                    key={`ring-${radius}`}
                                    name={`${radius}km`}
                                    data={ringPoints}
                                    fill="#6b7280"
                                    fillOpacity={0.3}
                                    shape="circle"
                                    legendType="none"
                                />
                            );
                        })}
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        );
    };

    const renderProductRecommendation = (productId: string) => {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-700/50 shadow-lg"
            >
                <div className="flex items-center gap-3 mb-2">
                    <Radio className="h-5 w-5 text-indigo-400" />
                    <h4 className="text-base font-medium text-white">Recommended Product</h4>
                </div>
                <div className="flex flex-col md:flex-row items-start gap-4">
                    <div className="bg-black/30 rounded-lg p-2 flex items-center justify-center">
                        <Wifi className="h-12 w-12 text-indigo-500" />
                    </div>
                    <div>
                        <h5 className="text-lg font-semibold text-white">{productId}</h5>
                        <p className="text-gray-300 mt-1">Optimized for your specific network requirements</p>
                        <div className="mt-3 flex gap-2">
                            <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors">
                                View Details
                            </button>
                            <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-md transition-colors">
                                Compare
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    const renderChart = (data: any, index: number) => {
        const isExpanded = expandedCharts.includes(index);

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="mt-6 bg-gray-850 rounded-xl overflow-hidden border border-gray-700 shadow-lg"
            >
                <div className="bg-gradient-to-r from-gray-800 to-gray-750 p-4 border-b border-gray-700">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            <Wifi className="h-5 w-5 mr-2 text-violet-400" />
                            <h4 className="text-base font-medium text-white">RF Performance Analysis</h4>
                        </div>
                        <button
                            onClick={() => toggleChartExpansion(index)}
                            className="p-1.5 bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors"
                        >
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                    </div>
                    {isExpanded && (
                        <div className="flex space-x-2 mt-4">
                            <button
                                onClick={() => setActiveChartTab("throughput")}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeChartTab === "throughput" ? "bg-violet-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
                            >
                                <BarChart2 className="w-4 h-4 inline mr-1" />
                                Throughput
                            </button>
                            <button
                                onClick={() => setActiveChartTab("snr")}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeChartTab === "snr" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
                            >
                                <Activity className="w-4 h-4 inline mr-1" />
                                SNR Analysis
                            </button>
                            <button
                                onClick={() => setActiveChartTab("coverage")}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeChartTab === "coverage" ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
                            >
                                <MapPin className="w-4 h-4 inline mr-1" />
                                Coverage Map
                            </button>
                        </div>
                    )}
                </div>

                <motion.div
                    variants={chartVariants}
                    initial="hidden"
                    animate={isExpanded ? "visible" : "hidden"}
                    exit="exit"
                    className="overflow-hidden"
                >
                    <div className="p-6">
                        {activeChartTab === "throughput" && renderThroughputChart(data)}
                        {activeChartTab === "snr" && renderSnrChart(data)}
                        {activeChartTab === "coverage" && renderCoverageMap(data)}
                        <div className="mt-8 bg-gray-900/50 rounded-xl p-5 border border-gray-800">
                            <div className="flex items-center mb-3">
                                <Info className="w-5 h-5 mr-2 text-blue-400" />
                                <h3 className="text-lg font-medium">Analysis Summary</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-start gap-2">
                                        <div className="mt-1 h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                                            <Signal className="h-3 w-3 text-blue-500" />
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-medium text-blue-400">Signal Quality</h5>
                                            <p className="text-sm text-gray-300">Excellent at close range, degrades beyond 3km</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <div className="mt-1 h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                            <Activity className="h-3 w-3 text-emerald-500" />
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-medium text-emerald-400">Performance</h5>
                                            <p className="text-sm text-gray-300">Optimal for video streaming up to 2.5km</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-2">
                                        <div className="mt-1 h-5 w-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                                            <Zap className="h-3 w-3 text-amber-500" />
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-medium text-amber-400">Power Requirements</h5>
                                            <p className="text-sm text-gray-300">Standard 12V DC, 1.5A recommended</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <div className="mt-1 h-5 w-5 rounded-full bg-red-500/20 flex items-center justify-center">
                                            <MapPin className="h-3 w-3 text-red-500" />
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-medium text-red-400">Environment Impact</h5>
                                            <p className="text-sm text-gray-300">Rain attenuation significant above 3GHz</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        );
    };

    return (
        <div className="flex flex-col h-full min-h-screen bg-gray-900">
            {/* Header Section */}
            <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center mb-6"
                    >
                        <div className="flex items-center">
                            <img
                                src="/logo.png"
                                alt="Mesh Rider Logo"
                                className="h-12 w-auto mr-4"
                            />
                            <div>
                                <h1 className="text-2xl font-bold text-white">
                                    Mesh Rider AI Assistant
                                </h1>
                                <p className="text-gray-400 mt-1">
                                    RF performance analyzer for mesh network planning and optimization
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <div className="flex flex-wrap gap-2 md:gap-4 mb-2">
                        <button
                            onClick={() => setAssistantMode('chat')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${assistantMode === 'chat'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                        >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Chat Mode
                        </button>
                        <button
                            onClick={() => setAssistantMode('expert')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${assistantMode === 'expert'
                                ? 'bg-violet-600 text-white shadow-md shadow-violet-900/30'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Expert Mode
                        </button>

                        <button
                            onClick={clearMessages}
                            className="flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors ml-auto"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            New Chat
                        </button>

                        <button
                            onClick={() => setActiveTool(null)}
                            className="flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                        >
                            <HelpCircle className="w-4 h-4 mr-2" />
                            Back to Toolbox
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Tools Panel - Left Sidebar */}
                    <div className="lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                            className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-lg"
                        >
                            <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                                <Radio className="w-5 h-5 mr-2 text-violet-400" />
                                Network Tools
                            </h3>

                            <div className="space-y-3">
                                <button
                                    onClick={() => setActiveTool('range')}
                                    className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-200 transition-all">
                                    <div className="flex items-center">
                                        <Signal className="w-5 h-5 mr-3 text-blue-400" />
                                        <span>Range Calculator</span>
                                    </div>
                                    <ChevronDown size={16} />
                                </button>

                                <button
                                    onClick={() => setActiveTool('throughput')}
                                    className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-200 transition-all">
                                    <div className="flex items-center">
                                        <BarChart2 className="w-5 h-5 mr-3 text-amber-400" />
                                        <span>Throughput Analyzer</span>
                                    </div>
                                    <ChevronDown size={16} />
                                </button>

                                <button
                                    onClick={() => setActiveTool('coverage')}
                                    className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-200 transition-all">
                                    <div className="flex items-center">
                                        <MapPin className="w-5 h-5 mr-3 text-emerald-400" />
                                        <span>Coverage Mapper</span>
                                    </div>
                                    <ChevronDown size={16} />
                                </button>

                                <button
                                    onClick={() => setActiveTool('logviewer')}
                                    className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-200 transition-all">
                                    <div className="flex items-center">
                                        <Activity className="w-5 h-5 mr-3 text-red-400" />
                                        <span>Log Analyzer</span>
                                    </div>
                                    <ChevronDown size={16} />
                                </button>
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-700">
                                <h4 className="text-sm font-medium text-gray-400 mb-3">HARDWARE MODELS</h4>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setActiveTool('app')}
                                        className="w-full text-left p-2 rounded hover:bg-gray-700/50 text-gray-300 transition-colors text-sm flex items-center">
                                        <Wifi className="w-4 h-4 mr-2 text-indigo-400" />
                                        RM-1700 Smart Radio
                                    </button>
                                    <button
                                        onClick={() => setActiveTool('app')}
                                        className="w-full text-left p-2 rounded hover:bg-gray-700/50 text-gray-300 transition-colors text-sm flex items-center">
                                        <Wifi className="w-4 h-4 mr-2 text-indigo-400" />
                                        RM-2450 OEM Module
                                    </button>
                                    <button
                                        onClick={() => setActiveTool('app')}
                                        className="w-full text-left p-2 rounded hover:bg-gray-700/50 text-gray-300 transition-colors text-sm flex items-center">
                                        <Wifi className="w-4 h-4 mr-2 text-indigo-400" />
                                        RM-3100 Wearable Radio
                                    </button>
                                    <button
                                        onClick={() => setActiveTool('app')}
                                        className="w-full text-left p-2 rounded hover:bg-gray-700/50 text-gray-300 transition-colors text-sm flex items-center">
                                        <Wifi className="w-4 h-4 mr-2 text-indigo-400" />
                                        RM-5700 MIMO Radio
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Main Chat Panel */}
                    <div className="lg:col-span-2">
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden h-full flex flex-col"
                        >
                            {/* Chat Header */}
                            <div className="bg-gradient-to-r from-gray-800 to-gray-750 p-4 border-b border-gray-700 flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-violet-600/20 mr-3">
                                        <Bot className="h-5 w-5 text-violet-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-medium text-white">AI Assistant</h3>
                                        <p className="text-xs text-gray-400">Powered by Doodle Labs</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300 transition-colors"
                                        onClick={clearMessages}
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                    <button className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300 transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                {messages.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        variants={itemVariants}
                                        className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                                    >
                                        <div className={`max-w-3xl ${msg.role === 'assistant' ? 'bg-gray-750 border-gray-700' : 'bg-indigo-900/30 border-indigo-800'} rounded-xl p-4 border shadow-md`}>
                                            <div className="flex items-center mb-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${msg.role === 'assistant' ? 'bg-violet-600/30' : 'bg-indigo-600/30'}`}>
                                                    {msg.role === 'assistant' ?
                                                        <Bot className="h-4 w-4 text-violet-400" /> :
                                                        <User className="h-4 w-4 text-indigo-400" />
                                                    }
                                                </div>
                                                <div className="flex justify-between items-center w-full">
                                                    <span className="text-sm font-medium text-gray-300">
                                                        {msg.role === 'assistant' ? 'Mesh Rider Assistant' : 'You'}
                                                    </span>
                                                    <span className="text-xs text-gray-500">{msg.timestamp}</span>
                                                </div>
                                            </div>
                                            <div className="pl-10 text-gray-200">
                                                {msg.content}
                                            </div>

                                            {/* Charts and visualizations */}
                                            {msg.charts && msg.charts.length > 0 && renderChart(msg.charts, i)}

                                            {/* Product recommendations */}
                                            {msg.products && msg.products.length > 0 && msg.products.map((p, index) => (
                                                <div key={index}>{renderProductRecommendation(p)}</div>
                                            ))}

                                            {/* Message actions */}
                                            <div className="mt-3 pl-10 flex items-center gap-4">
                                                <div
                                                    onClick={() => handleCopyToClipboard(msg.content ?? '', i)}
                                                    className="flex items-center gap-1 text-gray-400 hover:text-gray-200 cursor-pointer transition-colors"
                                                >
                                                    {copiedIndex === i ? <Check size={14} /> : <Copy size={14} />}
                                                    <span className="text-xs">{copiedIndex === i ? 'Copied' : 'Copy'}</span>
                                                </div>

                                                {msg.role === 'assistant' && (
                                                    <div className="flex items-center gap-2">
                                                        <button className="flex items-center gap-1 text-gray-400 hover:text-green-400 transition-colors">
                                                            <ThumbsUp size={14} />
                                                            <span className="text-xs">Helpful</span>
                                                        </button>
                                                        <button className="flex items-center gap-1 text-gray-400 hover:text-red-400 transition-colors">
                                                            <ThumbsDown size={14} />
                                                            <span className="text-xs">Not helpful</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                <div ref={messagesEndRef} />

                                {/* Loading indicator */}
                                {isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex justify-start"
                                    >
                                        <div className="bg-gray-750 border-gray-700 rounded-xl p-4 border shadow-md max-w-3xl">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-violet-600/30 flex items-center justify-center mr-2">
                                                    <Loader2 className="h-4 w-4 text-violet-400 animate-spin" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-300">Mesh Rider Assistant is thinking...</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Suggestions */}
                            {showSuggestions && (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="p-4 border-t border-gray-700 bg-gray-850"
                                >
                                    <h4 className="text-sm font-medium text-gray-400 mb-3">SUGGESTED QUERIES</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {getActiveSuggestions().slice(0, 4).map((s, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSuggestionClick(s)}
                                                className="px-3 py-2 bg-gray-700/70 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors border border-gray-600"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Input Area */}
                            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700 bg-gray-800">
                                <div className="flex items-start gap-2">
                                    <motion.div
                                        animate={animateInput ? { scale: [1, 1.02, 1] } : {}}
                                        transition={{ duration: 0.3 }}
                                        className="flex-1 relative"
                                    >
                                        <textarea
                                            ref={inputRef}
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            onFocus={() => setAnimateInput(false)}
                                            placeholder="Type your message or question here..."
                                            rows={3}
                                            className="w-full p-3 bg-gray-750 border border-gray-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none text-white placeholder-gray-500 resize-none"
                                        />
                                        <AnimatePresence>
                                            {input.length > 0 && (
                                                <motion.button
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    type="button"
                                                    onClick={() => setInput('')}
                                                    className="absolute right-3 top-3 p-1 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-400"
                                                >
                                                    <X size={14} />
                                                </motion.button>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        type="submit"
                                        disabled={isLoading || !input.trim()}
                                        className={`p-3 rounded-xl ${isLoading || !input.trim()
                                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/30 hover:from-violet-500 hover:to-indigo-500'
                                            } transition-all`}
                                    >
                                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                    </motion.button>
                                </div>

                                {lastError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-2 p-2 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm flex items-center"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        {lastError}
                                    </motion.div>
                                )}

                                <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
                                    <span>Powered by Doodle Labs</span>
                                    <button type="button" onClick={() => setShowSuggestions(!showSuggestions)} className="text-gray-400 hover:text-gray-300">
                                        {showSuggestions ? 'Hide suggestions' : 'Show suggestions'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AIAssistant;