"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface TroubleshootIssue {
    id: string;
    title: string;
    description: string;
    steps: string[];
    category: 'connectivity' | 'performance' | 'configuration' | 'hardware';
}

const Troubleshoot: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedIssue, setSelectedIssue] = useState<TroubleshootIssue | null>(null);

    const categories = [
        { id: 'connectivity', title: 'Connectivity Issues', icon: '🔌', color: '#3B82F6' },
        { id: 'performance', title: 'Performance Problems', icon: '🚀', color: '#10B981' },
        { id: 'configuration', title: 'Configuration Errors', icon: '⚙️', color: '#F59E0B' },
        { id: 'hardware', title: 'Hardware Failures', icon: '🔧', color: '#DC2626' },
    ];

    const issues: TroubleshootIssue[] = [
        {
            id: '1',
            title: 'Cannot Connect to Mesh Network',
            description: 'Unable to establish connection with the mesh network',
            category: 'connectivity',
            steps: [
                'Check if the device is powered on and LEDs are active',
                'Verify network credentials are correct',
                'Ensure device is within range of other mesh nodes',
                'Reset network settings and try reconnecting',
                'Check for firmware updates'
            ]
        },
        {
            id: '2',
            title: 'Slow Network Performance',
            description: 'Network speed is significantly slower than expected',
            category: 'performance',
            steps: [
                'Check current network load and connected devices',
                'Verify signal strength between nodes',
                'Look for interference from other wireless devices',
                'Optimize node placement for better coverage',
                'Update to latest firmware version'
            ]
        },
        {
            id: '3',
            title: 'Configuration Not Saving',
            description: 'Settings changes are not persisting after save',
            category: 'configuration',
            steps: [
                'Verify admin credentials and permissions',
                'Check if device storage is full',
                'Clear browser cache and cookies',
                'Try a different web browser',
                'Factory reset and reconfigure if needed'
            ]
        },
        {
            id: '4',
            title: 'Device Not Responding',
            description: 'Hardware appears to be unresponsive or offline',
            category: 'hardware',
            steps: [
                'Check power supply and connections',
                'Look for any physical damage or overheating',
                'Perform a hard reset (hold reset button for 10 seconds)',
                'Check system logs for error messages',
                'Contact support if hardware failure is suspected'
            ]
        }
    ];

    const filteredIssues = selectedCategory 
        ? issues.filter(issue => issue.category === selectedCategory)
        : issues;

    return (
        <div className="max-w-6xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
            >
                <h2 className="text-3xl font-bold mb-4">Network Troubleshooting</h2>
                <p className="text-gray-400">
                    Select a category to find solutions for common issues
                </p>
            </motion.div>

            {/* Category Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {categories.map((category) => (
                    <motion.button
                        key={category.id}
                        onClick={() => setSelectedCategory(
                            selectedCategory === category.id ? null : category.id
                        )}
                        className={`p-6 rounded-xl border transition-all ${
                            selectedCategory === category.id
                                ? 'border-2 shadow-lg'
                                : 'border-gray-700 hover:border-gray-600'
                        }`}
                        style={{
                            borderColor: selectedCategory === category.id ? category.color : undefined,
                            backgroundColor: selectedCategory === category.id ? `${category.color}10` : undefined
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div className="text-4xl mb-2">{category.icon}</div>
                        <h3 className="font-semibold">{category.title}</h3>
                    </motion.button>
                ))}
            </div>

            {/* Issues List */}
            <div className="grid gap-4">
                {filteredIssues.map((issue) => (
                    <motion.div
                        key={issue.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="p-6 rounded-xl border border-gray-700 hover:border-gray-600 cursor-pointer"
                        onClick={() => setSelectedIssue(
                            selectedIssue?.id === issue.id ? null : issue
                        )}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xl font-semibold">{issue.title}</h3>
                            <span className="text-2xl">
                                {selectedIssue?.id === issue.id ? '−' : '+'}
                            </span>
                        </div>
                        <p className="text-gray-400 mb-4">{issue.description}</p>
                        
                        {selectedIssue?.id === issue.id && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 space-y-3"
                            >
                                <h4 className="font-semibold text-lg mb-2">Troubleshooting Steps:</h4>
                                <ol className="space-y-2">
                                    {issue.steps.map((step, index) => (
                                        <li key={index} className="flex items-start">
                                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold mr-3">
                                                {index + 1}
                                            </span>
                                            <span className="text-gray-300">{step}</span>
                                        </li>
                                    ))}
                                </ol>
                                <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                                    <p className="text-sm text-blue-400">
                                        💡 If these steps don't resolve your issue, please contact support with your device logs.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </div>

            {filteredIssues.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500">No issues found in this category.</p>
                </div>
            )}
        </div>
    );
};

export default Troubleshoot;