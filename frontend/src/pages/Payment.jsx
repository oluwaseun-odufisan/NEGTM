import React from 'react';
import { CreditCard } from 'lucide-react';

const Payment = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 via-teal-50 to-teal-100 flex items-center justify-center p-6">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-md border border-teal-100/50 max-w-md w-full text-center animate-pulse-slow">
                <div className="flex justify-center mb-4">
                    <div className="p-4 bg-teal-50 rounded-full">
                        <CreditCard className="w-12 h-12 text-teal-500 animate-bounce" />
                    </div>
                </div>
                <h1 className="text-2xl font-semibold text-teal-700 mb-2">Payment</h1>
                <p className="text-sm text-gray-600 mb-4">
                    Payment features are coming soon!.
                </p>
                <a
                    href="/"
                    className="inline-block px-6 py-2 bg-teal-500 text-white rounded-full hover:bg-teal-600 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                    Back to Dashboard
                </a>
            </div>
        </div>
    );
};

export default Payment;