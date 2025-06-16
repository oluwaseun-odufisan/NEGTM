import React, { useState } from 'react';
import { Video, Mic, Monitor, Users, Settings, X } from 'lucide-react';

const Meeting = () => {
    const [isVideoOn, setIsVideoOn] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [participants, setParticipants] = useState([
        { id: 1, name: 'Segun Johnson', videoOn: true, micOn: true },
        { id: 2, name: 'Wale Ojo', videoOn: false, micOn: true },
        { id: 3, name: 'Alice Ugo', videoOn: true, micOn: false },
    ]);
    const [inviteLink, setInviteLink] = useState('https://yourapp.com/meeting/abc123');

    const toggleVideo = () => setIsVideoOn(!isVideoOn);
    const toggleMic = () => setIsMicOn(!isMicOn);
    const toggleScreenShare = () => setIsScreenSharing(!isScreenSharing);

    const copyInviteLink = () => {
        navigator.clipboard.write(inviteLink);
        alert('Invite link copied to clipboard!');
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6 ">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Meeting Room</h1>

                {/* Main Meeting Area */}
                <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {participants.map((participant) => (
                            <div key={participant.id} className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
                                {participant.videoOn ? (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <span className="text-lg">Video Feed Placeholder</span>
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-700">
                                        <span className="text-white text-xl font-semibold">{participant.name.charAt(0)}</span>
                                    </div>
                                )}
                                <div className="absolute bottom-2 left-2 flex items-center gap-2">
                                    <span className="text-white text-sm font-medium">{participant.name}</span>
                                    {participant.micOn ? (
                                        <Mic className="w-4 h-4 text-green-400" />
                                    ) : (
                                        <Mic className="w-4 h-4 text-red-400" />
                                    )}
                                </div>
                            </div>
                        ))}
                        {/* User's Video */}
                        <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
                            {isVideoOn ? (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <span className="text-lg">Your Video Feed</span>
                                </div>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-700">
                                    <span className="text-white text-xl font-semibold">You</span>
                                </div>
                            )}
                            <div className="absolute bottom-2 left-2 flex items-center gap-2">
                                <span className="text-white text-sm font-medium">You</span>
                                {isMicOn ? (
                                    <Mic className="w-4 h-4 text-green-400" />
                                ) : (
                                    <Mic className="w-4 h-4 text-red-400" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={toggleVideo}
                            className={`p-3 rounded-full ${isVideoOn ? 'bg-green-500' : 'bg-red-500'} text-white hover:opacity-90 transition`}
                        >
                            <Video className="w-6 h-6" />
                        </button>
                        <button
                            onClick={toggleMic}
                            className={`p-3 rounded-full ${isMicOn ? 'bg-green-500' : 'bg-red-500'} text-white hover:opacity-90 transition`}
                        >
                            <Mic className="w-6 h-6" />
                        </button>
                        <button
                            onClick={toggleScreenShare}
                            className={`p-3 rounded-full ${isScreenSharing ? 'bg-green-500' : 'bg-gray-500'} text-white hover:opacity-90 transition`}
                        >
                            <Monitor className="w-6 h-6" />
                        </button>
                        <button className="p-3 rounded-full bg-gray-500 text-white hover:opacity-90 transition">
                            <Settings className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Participants and Invite */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-teal-500" /> Participants ({participants.length + 1})
                        </h2>
                        <ul className="space-y-2">
                            {participants.map((participant) => (
                                <li key={participant.id} className="flex items-center justify-between">
                                    <span className="text-gray-700">{participant.name}</span>
                                    <div className="flex gap-2">
                                        <span className={`text-xs ${participant.videoOn ? 'text-green-500' : 'text-red-500'}`}>
                                            {participant.videoOn ? 'Video On' : 'Video Off'}
                                        </span>
                                        <span className={`text-xs ${participant.micOn ? 'text-green-500' : 'text-red-500'}`}>
                                            {participant.micOn ? 'Mic On' : 'Mic Off'}
                                        </span>
                                    </div>
                                </li>
                            ))}
                            <li className="flex items-center justify-between">
                                <span className="text-gray-700">You</span>
                                <div className="flex gap-2">
                                    <span className={`text-xs ${isVideoOn ? 'text-green-500' : 'text-red-500'}`}>
                                        {isVideoOn ? 'Video On' : 'Video Off'}
                                    </span>
                                    <span className={`text-xs ${isMicOn ? 'text-green-500' : 'text-red-500'}`}>
                                        {isMicOn ? 'Mic On' : 'Mic Off'}
                                    </span>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-white rounded-2xl shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Invite to Meeting</h2>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={inviteLink}
                                readOnly
                                className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                            />
                            <button
                                onClick={copyInviteLink}
                                className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition"
                            >
                                Copy Link
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Meeting;