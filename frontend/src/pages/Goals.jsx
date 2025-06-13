import React from 'react';
import { Target } from 'lucide-react';

const Goals = () => {
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-md border border-teal-100/50">
                <div className="flex items-center gap-3 mb-6">
                    <Target className="w-8 h-8 text-teal-500" />
                    <h1 className="text-2xl font-semibold text-gray-800">Goals</h1>
                </div>
                <p className="text-gray-600">This is a placeholder for the Goals page. Add your goals tracking functionality here.</p>
            </div>
        </div>
    );
};

export default Goals;