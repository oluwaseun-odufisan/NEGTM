// src/pages/PerformanceBoard.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Trophy, Star, Award, Gift, ChevronDown, ChevronUp, ArrowLeft, X, ThumbsUp, MessageCircle, Users, Zap, Flame, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import Confetti from 'react-confetti';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const avatars = [
  { type: 'basic', url: 'https://via.placeholder.com/100?text=Basic' },
  { type: 'warrior', url: 'https://via.placeholder.com/100?text=Warrior' },
  { type: 'mage', url: 'https://via.placeholder.com/100?text=Mage' },
  { type: 'legend', url: 'https://via.placeholder.com/100?text=Legend' },
];

const PerformanceBoard = () => {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [usersPerformance, setUsersPerformance] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserInteractions, setSelectedUserInteractions] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeData, setChallengeData] = useState({ title: '', description: '', points: 0, type: 'individual' });
  const [redemptionAmount, setRedemptionAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [sortBy, setSortBy] = useState('points');
  const [sortOrder, setSortOrder] = useState('desc');
  const [timeMachineValue, setTimeMachineValue] = useState(0);
  const [hypeEvent, setHypeEvent] = useState(null);
  const canvasRef = useRef(null);
  const animationFrame = useRef(null);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No auth token');
    return { Authorization: `Bearer ${token}` };
  }, []);

  const fetchPerformanceData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [performanceRes, challengesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/performance/users`, { headers: getAuthHeaders() }),
        axios.get(`${API_BASE_URL}/api/performance/challenges`, { headers: getAuthHeaders() }),
      ]);
      setUsersPerformance(performanceRes.data.users);
      setChallenges(challengesRes.data.challenges);
      updateLeaderboard(performanceRes.data.users);
    } catch (err) {
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  const updateLeaderboard = (data) => {
    const sorted = [...data].sort((a, b) => b.points - a.points);
    setLeaderboard(sorted);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    canvas.style.cursor = 'pointer';

    let backgroundStars = [];
    for (let i = 0; i < 200; i++) {
      backgroundStars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1 + 0.5,
        alpha: Math.random() * 0.5 + 0.5,
      });
    }

    const maxPoints = leaderboard.length > 0 ? Math.max(1, Math.max(...leaderboard.map(p => p.points || 0))) : 1;
    const stars = leaderboard.slice(0, 3).map((u, i) => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      targetRadius: ((u.points || 0) / maxPoints) * 20 + 5,
      radius: 0, // Start small for animation
      color: getLevelColor(u.level),
      orbit: Math.random() * Math.PI * 2,
      orbitRadius: (u.points || 0) / 10 + 100,
      speed: Math.random() * 0.01 + 0.005,
      glow: (u.points || 0) / 100,
      user: u,
      pulse: 0,
    }));

    const animate = (time) => {
      ctx.fillStyle = '#F0F8FF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Background stars with twinkle
      backgroundStars.forEach(bg => {
        ctx.beginPath();
        ctx.arc(bg.x, bg.y, bg.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,0,255, ${Math.sin(time / 1000 + bg.x) * 0.3 + bg.alpha})`;
        ctx.fill();
      });

      stars.forEach(star => {
        star.orbit += star.speed;
        star.x = canvas.width / 2 + Math.cos(star.orbit) * star.orbitRadius;
        star.y = canvas.height / 2 + Math.sin(star.orbit) * star.orbitRadius;

        star.pulse = Math.sin(time / 500) * 2;

        const outerRadius = star.targetRadius + star.glow + star.pulse;
        if (!isFinite(outerRadius)) return; // Skip if NaN

        // Glow
        const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, outerRadius);
        gradient.addColorStop(0, star.color);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(star.x, star.y, outerRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Star core
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.targetRadius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.fill();

        // Name label
        ctx.fillStyle = '#00008B';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(star.user.name, star.x, star.y + star.targetRadius + 20);

        // Grow animation
        if (star.radius < star.targetRadius) {
          star.radius += 0.5;
        }
      });

      animationFrame.current = requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      stars.forEach(star => {
        if (Math.hypot(star.x - x, star.y - y) < star.targetRadius + 20) {
          setSelectedUser(star.user);
        }
      });
    };

    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrame.current);
    };
  }, [leaderboard]);

  const getLevelColor = (level) => {
    switch (level) {
      case 'Novice': return '#87CEEB'; // Light Blue
      case 'Apprentice': return '#4169E1'; // Royal Blue
      case 'Expert': return '#0000FF'; // Blue
      case 'Master': return '#00008B'; // Dark Blue
      default: return '#ADD8E6'; // Light Blue
    }
  };

  const handleCheer = async (targetId) => {
    try {
      await axios.post(`${API_BASE_URL}/api/performance/interactions`, {
        type: 'cheer',
        to: targetId,
      }, { headers: getAuthHeaders() });
      toast.success('Cheer sent!');
      if (selectedUser?._id === targetId) {
        fetchInteractions(targetId);
      }
      setHypeEvent({ type: 'cheer', from: user.name, to: targetId });
      setTimeout(() => setHypeEvent(null), 3000);
    } catch (err) {
      toast.error('Failed to send cheer');
    }
  };

  const handleEndorse = async (targetId) => {
    try {
      await axios.post(`${API_BASE_URL}/api/performance/interactions`, {
        type: 'endorse',
        to: targetId,
      }, { headers: getAuthHeaders() });
      toast.success('Endorsement sent!');
      if (selectedUser?._id === targetId) {
        fetchInteractions(targetId);
      }
      setHypeEvent({ type: 'endorse', from: user.name, to: targetId });
      setTimeout(() => setHypeEvent(null), 3000);
    } catch (err) {
      toast.error('Failed to send endorsement');
    }
  };

  const handleComment = async (targetId) => {
    if (!newComment.trim()) return;
    try {
      await axios.post(`${API_BASE_URL}/api/performance/interactions`, {
        type: 'comment',
        to: targetId,
        content: newComment,
      }, { headers: getAuthHeaders() });
      setNewComment('');
      toast.success('Comment posted!');
      fetchInteractions(targetId);
    } catch (err) {
      toast.error('Failed to post comment');
    }
  };

  const fetchInteractions = async (userId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/performance/interactions/${userId}`, { headers: getAuthHeaders() });
      setSelectedUserInteractions(res.data.interactions);
    } catch (err) {
      toast.error('Failed to fetch interactions');
    }
  };

  useEffect(() => {
    if (selectedUser) {
      fetchInteractions(selectedUser._id);
    }
  }, [selectedUser]);

  const handleCreateChallenge = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/performance/challenges`, challengeData, { headers: getAuthHeaders() });
      toast.success('Challenge created!');
      setShowChallengeModal(false);
      setChallengeData({ title: '', description: '', points: 0, type: 'individual' });
      fetchPerformanceData();
    } catch (err) {
      toast.error('Failed to create challenge');
    }
  };

  const handleJoinChallenge = async (challengeId) => {
    try {
      await axios.post(`${API_BASE_URL}/api/performance/challenges/${challengeId}/join`, {}, { headers: getAuthHeaders() });
      toast.success('Joined challenge!');
      fetchPerformanceData();
    } catch (err) {
      toast.error('Failed to join challenge');
    }
  };

  const handleCompleteChallenge = async (challengeId) => {
    try {
      await axios.post(`${API_BASE_URL}/api/performance/challenges/${challengeId}/complete`, {}, { headers: getAuthHeaders() });
      toast.success('Challenge completed! Points awarded.');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      fetchPerformanceData();
    } catch (err) {
      toast.error('Failed to complete challenge');
    }
  };

  const getAvatar = (userData) => {
    const avatar = avatars.find(a => a.type === userData.avatarType) || avatars[0];
    return (
      <img 
        src={avatar.url} 
        alt="avatar" 
        className="w-20 h-20 rounded-full object-cover" 
      />
    );
  };

  const getPredictiveData = (historical) => {
    // Simple linear regression for prediction
    if (historical.length < 2) return Array(7).fill(historical[0]?.points || 0);
    const x = historical.map((h, i) => i);
    const y = historical.map(h => h.points);
    const slope = (y[y.length - 1] - y[0]) / (x[x.length - 1] - x[0]);
    const future = [];
    for (let i = 1; i <= 7; i++) {
      future.push(Math.max(0, y[y.length - 1] + slope * i));
    }
    return future;
  };

  const sortUsers = () => {
    return [...usersPerformance].sort((a, b) => {
      let compare;
      switch (sortBy) {
        case 'points': compare = b.points - a.points; break;
        case 'tasks': compare = b.completedTasks - a.completedTasks; break;
        case 'streak': compare = b.currentStreak - a.currentStreak; break;
        default: compare = b.points - a.points;
      }
      return sortOrder === 'asc' ? -compare : compare;
    });
  };

  const handleRedeem = async () => {
    if (redemptionAmount <= 0 || redemptionAmount > selectedUser.points) {
      toast.error('Invalid redemption amount');
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/api/performance/redeem`, {
        userId: selectedUser._id,
        amount: redemptionAmount,
      }, { headers: getAuthHeaders() });
      toast.success('Points redeemed! Bonus processed.');
      setShowRedemptionModal(false);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      fetchPerformanceData();
    } catch (err) {
      toast.error('Failed to redeem points');
    }
  };

  const approveRedemption = async (userId, redemptionId) => {
    try {
      await axios.post(`${API_BASE_URL}/api/performance/approve-redemption`, {
        userId,
        redemptionId,
      }, { headers: getAuthHeaders() });
      toast.success('Redemption approved!');
      fetchPerformanceData();
    } catch (err) {
      toast.error('Failed to approve redemption');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen text-blue-600 text-xl font-medium">Loading Performance Universe...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-8">
      <Toaster />
      {showConfetti && <Confetti />}
      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-2xl p-4 sm:p-8 overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-indigo-900 flex items-center gap-3">
            <Trophy className="text-yellow-500 w-8 h-8 animate-bounce" /> Performance Universe
          </h1>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all text-sm sm:text-base font-medium shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
        </div>

        {/* Performance Universe */}
        <div className="relative mb-12">
          <canvas ref={canvasRef} className="w-full h-[400px] sm:h-[600px] rounded-3xl shadow-lg" />
          <div className="absolute top-4 right-4 flex gap-2">
            <button className="p-2 bg-white/80 rounded-full shadow" onClick={fetchPerformanceData}>
              <Zap className="w-5 h-5 text-yellow-500" />
            </button>
          </div>
        </div>

        {/* Top Performers Podium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-6 sm:p-8 mb-8 sm:mb-12 shadow-lg"
        >
          <h2 className="text-xl sm:text-2xl font-semibold mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3 text-indigo-900">
            <Award className="text-yellow-500 w-6 h-6" /> Top Performers
          </h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 mb-6 sm:mb-8">
            {[1, 0, 2].map((pos, i) => {
              const performer = leaderboard[pos];
              if (!performer) return null;
              const medalColors = [
                { bg: 'bg-yellow-200', text: 'text-yellow-900', medal: '🏆 1st' },
                { bg: 'bg-gray-200', text: 'text-gray-900', medal: '🥈 2nd' },
                { bg: 'bg-orange-200', text: 'text-orange-900', medal: '🥉 3rd' }
              ][i];
              return (
                <div
                  key={pos}
                  className={`text-center cursor-pointer hover:shadow-md transition-all p-4 rounded-xl bg-white shadow-sm flex flex-col items-center ${i === 0 ? 'order-last sm:order-first' : ''} w-48 sm:w-64`}
                  onClick={() => setSelectedUser(performer)}
                >
                  <div className={`w-24 h-24 sm:w-32 h-32 mx-auto rounded-full flex items-center justify-center text-3xl sm:text-4xl font-bold mb-3 shadow-md ${medalColors.bg} ${medalColors.text}`}>
                    {performer.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-semibold text-lg sm:text-xl mb-1">{performer.name}</h3>
                  <p className="text-blue-600 font-medium text-base sm:text-lg mb-1">{performer.points} pts</p>
                  <p className="text-sm text-gray-600 mb-2">{performer.level}</p>
                  <div className="text-2xl sm:text-3xl font-bold">
                    {medalColors.medal}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Sorting */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value="points">Points</option>
            <option value="tasks">Completed Tasks</option>
            <option value="streak">Streak</option>
          </select>
          <button 
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            {sortOrder === 'desc' ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {sortUsers().map(u => (
            <motion.div 
              key={u._id}
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-3xl p-4 sm:p-6 shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-100 overflow-hidden relative"
              onClick={() => setSelectedUser(u)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-50/50 opacity-0 hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{u.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-500">{u.role}</p>
                  </div>
                  <div className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${
                    u.level === 'Master' ? 'bg-indigo-100 text-indigo-800' :
                    u.level === 'Expert' ? 'bg-yellow-100 text-yellow-800' :
                    u.level === 'Apprentice' ? 'bg-gray-100 text-gray-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {u.level}
                  </div>
                </div>
                <div className="flex justify-center mb-4">
                  {getAvatar(u)}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-xl">
                    <p className="text-2xl sm:text-3xl font-bold text-blue-600">{u.points}</p>
                    <p className="text-xs text-gray-600 mt-1">Points</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-green-50 rounded-xl">
                    <p className="text-2xl sm:text-3xl font-bold text-green-600">{u.completedTasks}</p>
                    <p className="text-xs text-gray-600 mt-1">Tasks</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-orange-600 text-sm font-medium mb-4">
                  <Flame className="w-4 h-4 animate-pulse" /> Streak: {u.currentStreak} days
                </div>
                <div>
                  <h4 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-gray-800 text-sm sm:text-base">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" /> Badges
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {u.badges.map((badge, i) => (
                      <motion.span 
                        key={i} 
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                        whileHover={{ scale: 1.1 }}
                      >
                        {badge}
                      </motion.span>
                    ))}
                    {u.badges.length === 0 && <p className="text-xs sm:text-sm text-gray-500">No badges yet</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        {/* Seasonal Competitions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-3xl p-6 sm:p-8 shadow-lg"
        >
          <h2 className="text-xl sm:text-2xl font-semibold mb-6 flex items-center gap-3 text-indigo-900">
            <Users className="text-blue-500 w-6 h-6" /> Seasonal Competitions
          </h2>
          <Slider dots={true} infinite={true} speed={500} slidesToShow={3} slidesToScroll={1} responsive={[
            { breakpoint: 1024, settings: { slidesToShow: 2 } },
            { breakpoint: 600, settings: { slidesToShow: 1 } }
          ]}>
            {challenges.map(ch => (
              <div key={ch._id} className="px-2">
                <div className="p-4 bg-white rounded-xl shadow-md">
                  <h3 className="font-semibold mb-2">{ch.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{ch.description}</p>
                  <p className="text-sm font-medium text-blue-600 mb-4">{ch.points} points</p>
                  <button 
                    onClick={() => handleJoinChallenge(ch._id)}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Join
                  </button>
                  <button 
                    onClick={() => handleCompleteChallenge(ch._id)}
                    className="w-full py-2 mt-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    Complete
                  </button>
                </div>
              </div>
            ))}
          </Slider>
          {user.role === 'admin' && (
            <button 
              onClick={() => setShowChallengeModal(true)}
              className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm font-medium"
            >
              Create New Challenge
            </button>
          )}
        </motion.div>
        {/* Hall of Fame */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-white rounded-3xl p-6 sm:p-8 shadow-lg"
        >
          <h2 className="text-xl sm:text-2xl font-semibold mb-6 flex items-center gap-3 text-indigo-900">
            <Trophy className="text-yellow-500 w-6 h-6" /> Hall of Fame
          </h2>
          <div className="space-y-4">
            {leaderboard.map((u, i) => (
              <div key={u._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-medium">{i + 1}.</span>
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    {getAvatar(u)}
                  </div>
                  <div>
                    <p className="font-semibold">{u.name}</p>
                    <p className="text-sm text-gray-600">{u.points} lifetime points</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">Max Streak: {u.maxStreak}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Hype Event Animation */}
      <AnimatePresence>
        {hypeEvent && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-full px-6 py-3 shadow-lg flex items-center gap-2 text-sm font-medium"
          >
            {hypeEvent.type === 'cheer' ? <ThumbsUp className="text-green-500" /> : <Award className="text-blue-500" />}
            {hypeEvent.from} {hypeEvent.type}ed {hypeEvent.to}!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Challenge Creation Modal */}
      <AnimatePresence>
        {showChallengeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setShowChallengeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Challenge</h3>
              <input
                type="text"
                placeholder="Title"
                value={challengeData.title}
                onChange={(e) => setChallengeData({...challengeData, title: e.target.value})}
                className="w-full p-2 border rounded mb-2 text-sm"
              />
              <textarea
                placeholder="Description"
                value={challengeData.description}
                onChange={(e) => setChallengeData({...challengeData, description: e.target.value})}
                className="w-full p-2 border rounded mb-2 text-sm"
                rows={3}
              />
              <input
                type="number"
                placeholder="Points"
                value={challengeData.points}
                onChange={(e) => setChallengeData({...challengeData, points: parseInt(e.target.value) || 0})}
                className="w-full p-2 border rounded mb-2 text-sm"
              />
              <select
                value={challengeData.type}
                onChange={(e) => setChallengeData({...challengeData, type: e.target.value})}
                className="w-full p-2 border rounded mb-4 text-sm"
              >
                <option value="individual">Individual</option>
                <option value="team">Team</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <div className="flex justify-end gap-4">
                <button onClick={() => setShowChallengeModal(false)} className="text-gray-600 text-sm">Cancel</button>
                <button onClick={handleCreateChallenge} className="bg-blue-600 text-white px-4 py-2 rounded text-sm">Create</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Redemption Modal */}
      <AnimatePresence>
        {showRedemptionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setShowRedemptionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Redemption</h3>
              <p className="text-gray-600 mb-6 text-sm">Redeem {redemptionAmount} points for ${(redemptionAmount * 0.01).toFixed(2)} bonus?</p>
              <p className="text-xs text-gray-500 mb-6">This will be processed by admin and added to your next payment.</p>
              <div className="flex justify-end gap-4">
                <button 
                  onClick={() => setShowRedemptionModal(false)}
                  className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRedeem}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition text-sm"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl m-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6 sm:mb-8">
                <div className="flex items-center gap-4">
                  <div>
                    {getAvatar(selectedUser)}
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-indigo-900 mb-1 sm:mb-2">{selectedUser.name}</h2>
                    <p className="text-sm text-gray-600">{selectedUser.role} • Level {selectedUser.level}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Left Column: Stats and Badges */}
                <div className="space-y-6">
                  <motion.div 
                    className="grid grid-cols-2 gap-4"
                    variants={{
                      hidden: { opacity: 0, scale: 0.95 },
                      visible: { opacity: 1, scale: 1 }
                    }}
                    initial="hidden"
                    animate="visible"
                    transition={{ duration: 0.5 }}
                  >
                    <div className="p-4 sm:p-6 bg-blue-50 rounded-2xl text-center shadow-sm">
                      <p className="text-3xl sm:text-4xl font-bold text-blue-600 mb-1 sm:mb-2">{selectedUser.points}</p>
                      <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Points</p>
                    </div>
                    <div className="p-4 sm:p-6 bg-green-50 rounded-2xl text-center shadow-sm">
                      <p className="text-3xl sm:text-4xl font-bold text-green-600 mb-1 sm:mb-2">{selectedUser.completedTasks}</p>
                      <p className="text-xs sm:text-sm text-gray-600 font-medium">Tasks Completed</p>
                    </div>
                    <div className="p-4 sm:p-6 bg-purple-50 rounded-2xl text-center shadow-sm">
                      <p className="text-3xl sm:text-4xl font-bold text-purple-600 mb-1 sm:mb-2">{selectedUser.completedGoals}</p>
                      <p className="text-xs sm:text-sm text-gray-600 font-medium">Goals Achieved</p>
                    </div>
                    <div className="p-4 sm:p-6 bg-yellow-50 rounded-2xl text-center shadow-sm">
                      <p className="text-3xl sm:text-4xl font-bold text-yellow-600 mb-1 sm:mb-2">{selectedUser.badges.length}</p>
                      <p className="text-xs sm:text-sm text-gray-600 font-medium">Badges Earned</p>
                    </div>
                  </motion.div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                      <Award className="text-yellow-500 w-5 h-5" /> Badges Collection
                    </h3>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      {selectedUser.badges.map((badge, i) => (
                        <div key={i} className="p-3 sm:p-4 bg-gray-50 rounded-xl flex items-center gap-3 shadow-sm">
                          <div className="w-8 h-8 sm:w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                            <Star className="text-yellow-500 w-4 h-4 sm:w-5 h-5" />
                          </div>
                          <span className="font-medium text-gray-800 text-sm">{badge}</span>
                        </div>
                      ))}
                      {selectedUser.badges.length === 0 && (
                        <p className="col-span-2 text-center text-gray-500 py-4 text-sm">No badges earned yet. Keep working!</p>
                      )}
                    </div>
                  </div>

                  {/* Social Interactions */}
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                      <MessageCircle className="text-blue-500 w-5 h-5" /> Social Feed
                    </h3>
                    <div className="flex gap-4 mb-4">
                      <button onClick={() => handleCheer(selectedUser._id)} className="flex-1 py-2 bg-green-100 text-green-700 rounded-lg flex items-center justify-center gap-2 text-sm">
                        <ThumbsUp size={16} /> Cheer
                      </button>
                      <button onClick={() => handleEndorse(selectedUser._id)} className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center gap-2 text-sm">
                        <Award size={16} /> Endorse
                      </button>
                    </div>
                    <div className="flex gap-2 mb-4">
                      <input 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 p-2 border rounded-lg text-sm"
                      />
                      <button onClick={() => handleComment(selectedUser._id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                        Post
                      </button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                      {selectedUserInteractions.map((int, i) => (
                        <div key={i} className="p-2 bg-gray-50 rounded-lg text-sm">
                          <span className="font-medium">{int.from.name}</span>: {int.type === 'comment' ? int.content : int.type.charAt(0).toUpperCase() + int.type.slice(1)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Charts and Analytics */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 sm:p-6 rounded-2xl shadow-sm">
                    <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Task Completion by Priority</h3>
                    <Bar 
                      data={{
                        labels: ['Low', 'Medium', 'High'],
                        datasets: [{
                          label: 'Completed',
                          data: [
                            selectedUser.tasks.filter(t => t.priority === 'Low' && t.completed).length,
                            selectedUser.tasks.filter(t => t.priority === 'Medium' && t.completed).length,
                            selectedUser.tasks.filter(t => t.priority === 'High' && t.completed).length
                          ],
                          backgroundColor: ['#3B82F6', '#10B981', '#EF4444'],
                        }],
                      }}
                      options={{
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: {
                          y: { beginAtZero: true, precision: 0 }
                        }
                      }}
                    />
                  </div>

                  <div className="bg-gray-50 p-4 sm:p-6 rounded-2xl shadow-sm">
                    <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Overall Progress</h3>
                    <Pie 
                      data={{
                        labels: ['Completed Tasks', 'Pending Tasks', 'Completed Goals', 'Active Goals'],
                        datasets: [{
                          data: [
                            selectedUser.completedTasks,
                            selectedUser.tasks.length - selectedUser.completedTasks,
                            selectedUser.completedGoals,
                            selectedUser.goals.length - selectedUser.completedGoals
                          ],
                          backgroundColor: ['#10B981', '#EF4444', '#3B82F6', '#F59E0B'],
                        }],
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { position: 'bottom', labels: { font: { size: 12 } } }
                        }
                      }}
                    />
                  </div>

                  {/* Progress Heatmap */}
                  <div className="bg-gray-50 p-4 sm:p-6 rounded-2xl shadow-sm">
                    <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Progress Heatmap (Last Year)</h3>
                    <CalendarHeatmap
                      startDate={new Date(new Date().setDate(new Date().getDate() - 365))}
                      endDate={new Date()}
                      values={selectedUser.historicalPerformance.map(h => ({ date: new Date(h.date), count: h.tasksCompleted + h.goalsCompleted }))}
                      classForValue={(value) => {
                        if (!value) return 'color-empty';
                        return `color-scale-${Math.min(4, Math.ceil(value.count / 2))}`;
                      }}
                      showWeekdayLabels={true}
                    />
                  </div>

                  {/* Time Machine */}
                  <div className="bg-gray-50 p-4 sm:p-6 rounded-2xl shadow-sm">
                    <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-500" /> Time Machine
                    </h3>
                    <input
                      type="range"
                      min={0}
                      max={selectedUser.historicalPerformance.length - 1}
                      value={timeMachineValue}
                      onChange={(e) => setTimeMachineValue(parseInt(e.target.value))}
                      className="w-full mb-4"
                    />
                    {selectedUser.historicalPerformance[timeMachineValue] && (
                      <>
                        <p className="text-sm">Date: {new Date(selectedUser.historicalPerformance[timeMachineValue].date).toLocaleDateString()}</p>
                        <p className="text-sm">Points: {selectedUser.historicalPerformance[timeMachineValue].points}</p>
                        <p className="text-sm">Tasks Completed: {selectedUser.historicalPerformance[timeMachineValue].tasksCompleted}</p>
                        <p className="text-sm">Goals Completed: {selectedUser.historicalPerformance[timeMachineValue].goalsCompleted}</p>
                      </>
                    )}
                  </div>

                  {/* Predictive Analytics */}
                  <div className="bg-gray-50 p-4 sm:p-6 rounded-2xl shadow-sm">
                    <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Predictive Performance (Next Week)</h3>
                    <Line
                      data={{
                        labels: ['Now', '+1d', '+2d', '+3d', '+4d', '+5d', '+6d', '+7d'],
                        datasets: [{
                          label: 'Projected Points',
                          data: [selectedUser.points, ...getPredictiveData(selectedUser.historicalPerformance)],
                          borderColor: '#3B82F6',
                          tension: 0.1,
                        }],
                      }}
                      options={{
                        responsive: true,
                        scales: {
                          y: { beginAtZero: false }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-green-50 rounded-2xl shadow-sm">
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                  <Gift className="text-green-600 w-5 h-5" /> Redeem Points for Bonus
                </h3>
                <p className="text-sm text-gray-600 mb-3 sm:mb-4">Available points: {selectedUser.points}</p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <input
                    type="number"
                    value={redemptionAmount}
                    onChange={(e) => setRedemptionAmount(Math.max(0, Math.min(selectedUser.points, parseInt(e.target.value) || 0)))}
                    className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 transition text-sm"
                    placeholder="Enter amount"
                    min="1"
                    max={selectedUser.points}
                  />
                  <button 
                    onClick={() => setShowRedemptionModal(true)}
                    disabled={redemptionAmount <= 0}
                    className="px-5 sm:px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                  >
                    Redeem
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">1 point = $0.01 bonus (admin approval required)</p>
              </div>

              {user.role === 'admin' && (
                <div className="mt-6 p-4 bg-gray-50 rounded-2xl shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">Admin: Redemption History</h3>
                  <div className="space-y-2">
                    {selectedUser.redemptionHistory.map((red, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-white rounded-lg text-sm">
                        <span>Amount: {red.amount} ({red.status})</span>
                        <button 
                          onClick={() => approveRedemption(selectedUser._id, red._id)}
                          disabled={red.status !== 'pending'}
                          className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50 text-xs"
                        >
                          Approve
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PerformanceBoard;