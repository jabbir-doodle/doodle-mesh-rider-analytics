import React, { useState } from 'react';
import { Bot, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AIAssistant from './AIAssistant';

const FloatingChatButton: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <div className="fixed bottom-4 right-4 z-50">
                <motion.button
                    onClick={() => setIsOpen(!isOpen)}
                    className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-indigo-600 text-white shadow-lg"
                >
                    {isOpen ? (
                        <X className="h-6 w-6 text-white" />
                    ) : (
                        <Bot className="h-6 w-6 text-white" />
                    )}
                </motion.button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="fixed bottom-20 right-4 w-96 h-[70vh] z-40 rounded-lg overflow-hidden shadow-2xl"
                    >
                        <AIAssistant showInSidebar={true} />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default FloatingChatButton;
