import React, { useState } from 'react';
import { PlayCircle, FileText, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

const Training = () => {
    const [expandedModule, setExpandedModule] = useState(null);

    const trainingModules = [
        {
            id: 1,
            title: 'Introduction to Project Management',
            type: 'Video',
            duration: '45 min',
            thumbnail: 'https://via.placeholder.com/150',
            link: '#',
            description: 'Learn the fundamentals of project management, including planning, execution, and monitoring.',
        },
        {
            id: 2,
            title: 'Effective Communication Skills',
            type: 'Document',
            size: '2.5 MB',
            link: '#',
            description: 'A comprehensive guide to improving workplace communication.',
        },
        {
            id: 3,
            title: 'Advanced Data Analysis',
            type: 'Video',
            duration: '1 hr 20 min',
            thumbnail: 'https://via.placeholder.com/150',
            link: '#',
            description: 'Master data analysis techniques using modern tools and methodologies.',
        },
        {
            id: 4,
            title: 'Team Leadership Guide',
            type: 'Document',
            size: '1.8 MB',
            link: '#',
            description: 'Strategies for leading teams effectively and fostering collaboration.',
        },
    ];

    const toggleModule = (id) => {
        setExpandedModule(expandedModule === id ? null : id);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Training Hub</h1>

                <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Recommended Training Modules</h2>
                    <div className="space-y-4">
                        {trainingModules.map((module) => (
                            <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                                <div
                                    className="flex items-center justify-between cursor-pointer"
                                    onClick={() => toggleModule(module.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        {module.type === 'Video' ? (
                                            <img
                                                src={module.thumbnail}
                                                alt={module.title}
                                                className="w-24 h-16 object-cover rounded-md"
                                            />
                                        ) : (
                                            <div className="w-24 h-16 flex items-center justify-center bg-gray-100 rounded-md">
                                                <FileText className="w-8 h-8 text-teal-500" />
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-base font-semibold text-gray-800">{module.title}</h3>
                                            <p className="text-sm text-gray-600">
                                                {module.type} • {module.type === 'Video' ? module.duration : module.size}
                                            </p>
                                        </div>
                                    </div>
                                    {expandedModule === module.id ? (
                                        <ChevronUp className="w-5 h-5 text-teal-500" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-teal-500" />
                                    )}
                                </div>
                                {expandedModule === module.id && (
                                    <div className="mt-4">
                                        <p className="text-sm text-gray-600 mb-2">{module.description}</p>
                                        <a
                                            href={module.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition"
                                        >
                                            {module.type === 'Video' ? (
                                                <>
                                                    <PlayCircle className="w-5 h-5" /> Watch Now
                                                </>
                                            ) : (
                                                <>
                                                    <ExternalLink className="w-5 h-5" /> View Document
                                                </>
                                            )}
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-md p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Progress</h2>
                    <div className="space-y-4">
                        {trainingModules.map((module) => (
                            <div key={module.id} className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-800">{module.title}</h3>
                                    <p className="text-xs text-gray-600">
                                        {module.type} • {Math.floor(Math.random() * 100)}% Complete
                                    </p>
                                </div>
                                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-teal-500"
                                        style={{ width: `${Math.floor(Math.random() * 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Training;