'use client';

import React from 'react';
import type { DialogProps, DialogContentProps } from '@/types';

export const Dialog: React.FC<DialogProps> = ({
    open,
    onOpenChange,
    children,
    className = ''
}) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="fixed inset-0 bg-black/50"
                onClick={() => onOpenChange(false)}
            />
            <div className={`relative bg-gray-900 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto ${className}`}>
                {children}
            </div>
        </div>
    );
};

export const DialogContent: React.FC<DialogContentProps> = ({
    children,
    className = ''
}) => (
    <div className={`w-full max-w-6xl p-6 ${className}`}>
        {children}
    </div>
);