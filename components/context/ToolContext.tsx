'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

interface ToolContextType {
    activeTool: string | null;
    setActiveTool: (tool: string | null) => void;
    logFileContent: string | null;
    setLogFileContent: (content: string | null) => void;
    toolParameters: { [key: string]: any };
    setToolParameters: (params: { [key: string]: any }) => void;
}

const ToolContext = createContext<ToolContextType | undefined>(undefined);

export function ToolProvider({ children }: { children: ReactNode }) {
    const [logFileContent, setLogFileContent] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [toolParameters, setToolParameters] = useState<{ [key: string]: any }>({});

    const contextValue: ToolContextType = {
        logFileContent,
        setLogFileContent,
        activeTool,
        setActiveTool,
        toolParameters,
        setToolParameters
    };

    return (
        <ToolContext.Provider value={contextValue}>
            {children}
        </ToolContext.Provider>
    );
}

export function useToolContext() {
    const context = useContext(ToolContext);
    if (context === undefined) {
        throw new Error('useToolContext must be used within a ToolProvider');
    }
    return context;
}
