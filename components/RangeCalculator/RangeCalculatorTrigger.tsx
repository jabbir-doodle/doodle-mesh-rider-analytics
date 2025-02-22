'use client';

import React, { useState } from 'react';
import { Radio } from 'lucide-react';
import RangeCalculator from './RangeCalculator';

const RangeCalculatorTrigger: React.FC = () => {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
                <Radio className="h-5 w-5" />
                <span>Range Calculator</span>
            </button>

            <RangeCalculator
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    );
};

export default RangeCalculatorTrigger;