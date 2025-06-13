import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Send, Smile, Paperclip, Users, Plus, X, Search, ChevronDown, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import io from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';
import toast, { Toaster } from 'react-hot-toast';
import { Tooltip } from 'react-tooltip';
import moment from 'moment-timezone';
import { debounce } from 'lodash';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const SOCKET_URL = API_BASE_URL;

const TeamChat = () => {
  const { user, onLogout } = useOutletContext();
  const [chatMode, setChatMode] = useState(localStorage.getItem('chatMode') || 'individual');
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [file, setFile] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [chatTimestamps, setChatTimestamps] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaViewer, setMediaViewer] = useState({ isOpen: false, fileUrl: '', contentType: '', fileName: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userChatMap, setUserChatMap] = useState({});
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [selectionMode, setSelectionMode] = useState(null); // 'edit' or 'delete'
  const [selectedMessages, setSelectedMessages] = useState([]);
  const socket = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    console.log('TeamChat mounted with user:', user?._id);
  }, [user]);

  useEffect(() => {
    localStorage.setItem('chatMode', chatMode);
  }, [chatMode]);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      setShowScrollButton(false);
    }
  }, []);

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
      setShowScrollButton(!isAtBottom);
    }
  };

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Session expired. Please log in again.');
      onLogout?.();
      throw new Error('No auth token');
    }
    return { Authorization: `Bearer ${token}` };
  }, [onLogout]);

  const getInitials = (name) => {
    if (!name) return '';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + (words[1]?.[0] || '')).toUpperCase();
  };

  const fetchInitialChats = useCallback(async () => {
    try {
      setIsLoading(true);
      const [usersResponse, groupsResponse, timestampsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/chats/users`, { headers: getAuthHeaders() }),
        axios.get(`${API_BASE_URL}/api/chats/groups`, { headers: getAuthHeaders() }),
        axios.get(`${API_BASE_URL}/api/chats/timestamps`, { headers: getAuthHeaders() }),
      ]);

      const validUsers = usersResponse.data.users.filter((u) => {
        if (!u._id || typeof u._id !== 'string' || !u.name || !u.email) {
          console.warn('Invalid user detected:', u);
          return false;
        }
        return u._id !== user?._id;
      });
      setUsers(validUsers);

      const validGroups = (groupsResponse.data.groups || []).filter((g) => g._id && g.members?.length > 0);
      setGroups(validGroups);

      setChatTimestamps(timestampsResponse.data.timestamps || {});

      const chats = await Promise.all(
        validUsers.map(async (u) => {
          const chatResponse = await axios.post(
            `${API_BASE_URL}/api/chats/individual`,
            { recipientId: u._id },
            { headers: getAuthHeaders() }
          );
          return { userId: u._id, chatId: chatResponse.data.chat._id };
        })
      );
      const map = chats.reduce((acc, { userId, chatId }) => {
        acc[userId] = chatId;
        return acc;
      }, {});
      setUserChatMap(map);
    } catch (error) {
      console.error('Fetch initial chats error:', error.message);
      toast.error('Failed to load chats.');
      if (error.response?.status === 401) onLogout?.();
    } finally {
      setIsLoading(false);
    }
  }, [user, getAuthHeaders, onLogout]);

  useEffect(() => {
    if (!user) return;

    socket.current = io(SOCKET_URL, {
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.current.on('connect', () => {
      console.log('Socket connected:', socket.current.id);
      reconnectAttempts.current = 0;
      socket.current.emit('joinChat', `user:${user._id}`);
      if (selectedChat?._id) socket.current.emit('joinChat', selectedChat._id);
    });

    socket.current.on('message', (message) => {
      if (!message?._id || !message?.chatId) {
        console.warn('Invalid message received:', message);
        return;
      }

      setMessages((prev) => {
        if (prev.some((msg) => msg._id === message._id)) return prev;
        if (message.chatId === selectedChat?._id) {
          setTimeout(scrollToBottom, 0);
          return [...prev, message];
        }
        return prev;
      });

      setChatTimestamps((prev) => ({
        ...prev,
        [message.chatId]: message.createdAt || new Date().toISOString(),
      }));

      if (message.sender?._id !== user?._id && message.chatId !== selectedChat?._id) {
        toast.success('New message received!');
        setUnreadCounts((prev) => ({
          ...prev,
          [message.chatId]: (prev[message.chatId] || 0) + 1,
        }));
      }
    });

    socket.current.on('messageUpdated', (message) => {
      if (message.chatId === selectedChat?._id) {
        setMessages((prev) =>
          prev.map((msg) => (msg._id === message._id ? message : msg))
        );
      }
    });

    socket.current.on('messageDeleted', (message) => {
      if (message.chatId === selectedChat?._id) {
        setMessages((prev) =>
          prev.map((msg) => (msg._id === message._id ? message : msg))
        );
      }
    });

    socket.current.on('typing', ({ chatId, userId, isTyping }) => {
      if (chatId && userId && userId !== user?._id) {
        setTypingUsers((prev) => ({
          ...prev,
          [chatId]: { id: userId, isTyping },
        }));
      }
    });

    socket.current.on('groupCreated', (response) => {
      if (response.success && response.group?._id) {
        setGroups((prev) => {
          if (prev.some((g) => g._id === response.group._id)) return prev;
          return [...prev, response.group];
        });
        toast.success('Group created!');
        setSelectedChat({ ...response.group, type: 'group' });
        setChatMode('group');
        socket.current.emit('joinChat', response.group._id);
      } else {
        toast.error('Failed to process group creation.');
      }
    });

    socket.current.on('groupUpdated', (response) => {
      if (response.success && response.group?._id) {
        setGroups((prev) =>
          prev.map((g) => (g._id === response.group._id ? response.group : g))
        );
        if (selectedChat?._id === response.group._id) {
          setSelectedChat({ ...response.group, type: 'group' });
        }
        toast.success('Group updated!');
      } else {
        toast.error('Failed to process group update.');
      }
    });

    socket.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current += 1;
        toast.error(`Connection lost. Reconnecting (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
      } else {
        toast.error('Failed to reconnect to chat server. Please refresh the page.');
      }
    });

    socket.current.on('error', (error) => {
      console.error('Socket error:', error.message);
      toast.error('Chat error: ' + error.message);
    });

    return () => {
      socket.current?.emit('leaveChat', selectedChat?._id);
      socket.current?.emit('leaveChat', `user:${user._id}`);
      socket.current?.disconnect();
    };
  }, [user, selectedChat, scrollToBottom]);

  useEffect(() => {
    if (!user) return;
    fetchInitialChats();
  }, [user, fetchInitialChats]);

  const selectIndividualChat = useCallback(async (recipient) => {
    if (!recipient?._id || typeof recipient._id !== 'string') {
      toast.error('Invalid user selected.');
      return;
    }
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/chats/individual`,
        { recipientId: recipient._id },
        { headers: getAuthHeaders() }
      );
      const chat = response.data.chat;
      if (!chat?._id) throw new Error('Invalid chat data received');
      setSelectedChat({ ...chat, type: 'individual', recipient });
      setUnreadCounts((prev) => ({ ...prev, [chat._id]: 0 }));
      socket.current?.emit('joinChat', chat._id);
      setCurrentPage(1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start chat.');
      if (error.response?.status === 401) onLogout?.();
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders, onLogout]);

  const selectGroupChat = useCallback((group) => {
    if (!group?._id) {
      toast.error('Invalid group selected.');
      return;
    }
    setSelectedChat({ ...group, type: 'group' });
    setUnreadCounts((prev) => ({ ...prev, [group._id]: 0 }));
    socket.current?.emit('joinChat', group._id);
    setCurrentPage(1);
  }, [selectedChat]);

  const fetchMessages = useCallback(async () => {
    if (!selectedChat?._id) return;

    try {
      setIsLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/chats/${selectedChat._id}/messages?limit=50`,
        { headers: getAuthHeaders() }
      );
      const { messages: newMessages, pagination } = response.data;
      if (!Array.isArray(newMessages)) {
        console.warn('Invalid messages data:', newMessages);
        throw new Error('Invalid messages data');
      }
      setMessages((prev) => {
        const existingIds = new Set(prev.map((msg) => msg._id));
        const filteredMessages = newMessages.filter((msg) => !existingIds.has(msg._id));
        return currentPage === 1 ? filteredMessages : [...filteredMessages, ...prev];
      });
      setTotalPages(pagination.totalPages);
      setTimeout(scrollToBottom, 10);
      setUnreadCounts((prev) => ({ ...prev, [selectedChat._id]: 0 }));
      if (newMessages.length > 0) {
        setChatTimestamps((prev) => ({
          ...prev,
          [selectedChat._id]: newMessages[newMessages.length - 1].createdAt,
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch messages.');
      if (error.response?.status === 401) onLogout?.();
    } finally {
      setIsLoading(false);
    }
  }, [selectedChat, currentPage, getAuthHeaders, scrollToBottom, onLogout]);

  useEffect(() => {
    fetchMessages();
    return () => {
      socket.current?.emit('leaveChat', selectedChat?._id);
    };
  }, [fetchMessages, selectedChat]);

  const loadMoreMessages = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const debouncedHandleTyping = debounce(() => {
    if (selectedChat?._id) {
      socket.current?.emit('typing', {
        chatId: selectedChat._id,
        userId: user?._id,
        isTyping: true,
      });
    }
  }, 500);

  const handleTyping = () => {
    debouncedHandleTyping();
  };

  useEffect(() => {
    if (!selectedChat) {
      setTypingUsers({});
      return;
    }

    const typingTimeout = setTimeout(() => {
      socket.current?.emit('typing', {
        chatId: selectedChat._id,
        userId: user?._id,
        isTyping: false,
      });
    }, 2000);

    return () => clearTimeout(typingTimeout);
  }, [newMessage, selectedChat, user]);

  const uploadFile = async (file) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post(`${API_BASE_URL}/api/chats/upload`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to upload file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() && !file && !editingMessageId) return;

    let fileUrl = '';
    let contentType = '';
    let fileName = '';

    if (file) {
      try {
        const { fileUrl: uploadedUrl, contentType: fileContentType, fileName: uploadedFileName } = await uploadFile(file);
        fileUrl = uploadedUrl;
        contentType = fileContentType;
        fileName = uploadedFileName;
      } catch (error) {
        toast.error(error.message);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    try {
      setIsLoading(true);
      if (editingMessageId) {
        // Update existing message
        const response = await axios.put(
          `${API_BASE_URL}/api/chats/messages/${editingMessageId}`,
          { content: newMessage.trim() },
          { headers: getAuthHeaders() }
        );
        socket.current?.emit('messageUpdated', {
          chatId: selectedChat._id,
          message: response.data.message,
        });
        toast.success('Message updated.');
      } else {
        // Send new message
        const message = {
          chatId: selectedChat._id,
          content: newMessage.trim(),
          fileUrl,
          contentType,
          fileName,
        };
        const response = await axios.post(
          `${API_BASE_URL}/api/chats/${selectedChat._id}/messages`,
          message,
          { headers: getAuthHeaders() }
        );
        socket.current?.emit('message', response.data.message);
      }
      setNewMessage('');
      setFile(null);
      setEditingMessageId(null);
      setSelectionMode(null);
      setSelectedMessages([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(scrollToBottom, 1);
      setChatTimestamps((prev) => ({
        ...prev,
        [selectedChat._id]: new Date().toISOString(),
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send or update message.');
      if (error.response?.status === 401) onLogout?.();
    } finally {
      setIsLoading(false);
    }
  }, [selectedChat, newMessage, file, editingMessageId, getAuthHeaders, scrollToBottom, onLogout]);

  const handleDeleteMessages = async () => {
    if (selectedMessages.length === 0) {
      toast.error('Please select at least one message to delete.');
      return;
    }

    try {
      setIsLoading(true);
      await Promise.all(
        selectedMessages.map(async (messageId) => {
          await axios.delete(`${API_BASE_URL}/api/chats/messages/${messageId}`, {
            headers: getAuthHeaders(),
          });
          socket.current?.emit('messageDeleted', { chatId: selectedChat._id, messageId });
        })
      );
      setSelectionMode(null);
      setSelectedMessages([]);
      toast.success(`Deleted ${selectedMessages.length} message(s).`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete messages.');
      if (error.response?.status === 401) onLogout?.();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (selectedUsers.length < 1) {
      toast.error('At least one member required.');
      return;
    }

    try {
      setIsLoading(true);
      const validSelectedUsers = selectedUsers.filter((id) => users.some((u) => u._id === id));
      if (validSelectedUsers.length === 0) {
        toast.error('No valid members selected.');
        return;
      }

      const payload = {
        name: groupName || 'Unnamed Group',
        members: [...new Set([...validSelectedUsers, user._id])],
      };

      await axios.post(`${API_BASE_URL}/api/chats/messages`, payload, {
        headers: getAuthHeaders(),
      });

      setShowGroupModal(false);
      setGroupName('');
      setSelectedUsers([]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create group.');
      if (error.response?.status === 401) onLogout?.();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMembers = async (groupId, newMembers) => {
    try {
      setIsLoading(true);
      const validNewMembers = newMembers.filter((id) => users.some((u) => u._id === id));
      if (validNewMembers.length === 0) {
        toast.error('No valid members selected.');
        return;
      }

      const payload = { members: validNewMembers };
      await axios.put(`${API_BASE_URL}/api/chats/groups/${groupId}/members`, payload, {
        headers: getAuthHeaders(),
      });

      setShowGroupModal(false);
      setSelectedUsers([]);
    } catch (error) {
      toast.error('Add members error:', error.message);
      toast.error('Failed to add members.');
      if (error.response?.status === 401) onLogout?.();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error('File size exceeds 50MB.');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleCloseChat = () => {
    socket.current?.emit('leaveChat', selectedChat?._id);
    setSelectedChat(null);
    setMessages([]);
    setCurrentPage(1);
    setSelectionMode(null);
    setSelectedMessages([]);
    setEditingMessageId(null);
    setNewMessage('');
  };

  const handleChatModeChange = (mode) => {
    if (mode === chatMode) return;
    setChatMode(mode);
    socket.current?.emit('leaveChat', selectedChat?._id);
    setSelectedChat(null);
    setMessages([]);
    setSearchQuery('');
    setCurrentPage(1);
    setSelectionMode(null);
    setSelectedMessages([]);
    setEditingMessageId(null);
    setNewMessage('');
  };

  const openMediaViewer = (fileUrl, contentType, fileName) => {
    setMediaViewer({ isOpen: true, fileUrl, contentType, fileName });
  };

  const closeMediaViewer = () => {
    setMediaViewer({ isOpen: false, fileUrl: '', contentType: '', fileName: '' });
  };

  const toggleMessageSelection = (messageId) => {
    const message = messages.find((msg) => msg._id === messageId);
    if (!message || message.isDeleted) return;

    if (selectionMode === 'edit') {
      if (message.sender?._id !== user?._id) {
        toast.error('You can only edit your own messages.');
        return;
      }
      setSelectedMessages([messageId]);
      setEditingMessageId(messageId);
      setNewMessage(message.content || '');
    } else if (selectionMode === 'delete') {
      setSelectedMessages((prev) =>
        prev.includes(messageId)
          ? prev.filter((id) => id !== messageId)
          : [...prev, messageId]
      );
    }
  };

  const isSenderMessage = (message) => {
    return message.sender?._id === user?._id && !message.isDeleted;
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const chatIdA = userChatMap[a._id];
    const chatIdB = userChatMap[b._id];
    const timeA = chatTimestamps[chatIdA] || '1970-01-01T00:00:00Z';
    const timeB = chatTimestamps[chatIdB] || '1970-01-01T00:00:00Z';
    return new Date(timeB) - new Date(timeA);
  });

  const sortedGroups = [...groups].sort((a, b) => {
    const timeA = chatTimestamps[a._id] || a.updatedAt || '1970-01-01T00:00:00Z';
    const timeB = chatTimestamps[b._id] || b.updatedAt || '1970-01-01T00:00:00Z';
    return new Date(timeB) - new Date(timeA);
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-600">Please log in to access the chat.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[calc(95vh-4rem)] bg-gray-100 flex flex-col shadow-md"
    >
      <Toaster position="bottom-right" />
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">TeamChat</h1>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleChatModeChange('individual')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                chatMode === 'individual'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Individual Chats
            </button>
            <button
              type="button"
              onClick={() => handleChatModeChange('group')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                chatMode === 'group'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Group Chats
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 flex max-w-7xl mx-auto w-full p-6 gap-6 overflow-hidden">
        <motion.aside
          initial={{ x: -100 }}
          animate={{ x: 0 }}
          className="w-80 bg-white rounded-lg shadow-md p-4 flex flex-col h-full border border-gray-200"
        >
          {isLoading && <p className="text-sm text-gray-500 mb-4">Loading chats...</p>}
          {chatMode === 'group' && (
            <button
              type="button"
              onClick={() => {
                setShowGroupModal(true);
                setSelectedUsers([]);
              }}
              className="mb-4 px-4 py-2 text-sm bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors duration-200 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Group
            </button>
          )}
          {chatMode === 'individual' && (
            <div className="mb-4 flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 transition-colors"
              />
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            {chatMode === 'individual' && sortedUsers.length === 0 && !isLoading && (
              <p className="text-sm text-gray-500 text-center">No users found</p>
            )}
            {chatMode === 'group' && sortedGroups.length === 0 && !isLoading && (
              <p className="text-sm text-gray-500 text-center">No groups found</p>
            )}
            {chatMode === 'individual'
              ? sortedUsers.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => selectIndividualChat(u)}
                    className={`p-3 rounded-md cursor-pointer transition-colors duration-200 ${
                      selectedChat?.recipient?._id === u._id ? 'bg-teal-100' : 'hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-800 flex items-center justify-center text-sm font-semibold">
                            {getInitials(u.name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </div>
                        {unreadCounts[userChatMap[u._id]] > 0 && (
                          <span className="bg-red-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadCounts[userChatMap[u._id]]}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                : sortedGroups.map((g) => (
                    <div
                      key={g._id}
                      onClick={() => selectGroupChat(g)}
                      className={`p-3 rounded-md cursor-pointer transition-colors duration-200 ${
                        selectedChat?._id === g._id ? 'bg-teal-100' : 'hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-800 flex items-center justify-center text-sm font-semibold">
                            {getInitials(g.name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{g.name}</p>
                            <p className="text-xs text-gray-500">{g.members.length} members</p>
                          </div>
                        </div>
                        {unreadCounts[g._id] > 0 && (
                          <span className="bg-red-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadCounts[g._id]}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </motion.aside>
            <motion.section
              initial={{ y: 0 }}
              animate={{ y: 0 }}
              className="flex-1 bg-white rounded-lg shadow-md p-6 flex flex-col h-full border border-gray-200 relative"
            >
              {selectedChat ? (
                <>
                  <div className="border-b border-gray-200 pb-4 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {chatMode === 'individual' ? selectedChat.recipient?.name || 'Anonymous' : selectedChat.name || 'Unnamed Group'}
                        </h2>
                        {chatMode === 'group' && (
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-600">{selectedChat.members?.length || 0} members</p>
                            <button
                              type="button"
                              onClick={() => setShowMembersModal(true)}
                              className="p-2 text-teal-600 hover:bg-teal-100 rounded-full transition-colors duration-200"
                              data-tooltip-id="view-members"
                              data-tooltip-content="View Members"
                            >
                              <Users className="w-4 h-4" />
                              <Tooltip id="view-members" />
                            </button>
                          </div>
                        )}
                      </div>
                      {selectionMode && (
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-800">
                            {selectedMessages.length} selected
                          </p>
                          {selectionMode === 'delete' && (
                            <button
                              type="button"
                              onClick={handleDeleteMessages}
                              className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                            >
                              Delete
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectionMode(null);
                              setSelectedMessages([]);
                              setEditingMessageId(null);
                              setNewMessage('');
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-200 rounded-full transition-colors duration-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!selectionMode && (
                        <>
                          <button
                            type="button"
                            onClick={() => setSelectionMode('edit')}
                            className="p-2 text-blue-500 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors duration-200"
                            data-tooltip-id="edit-messages"
                            data-tooltip-content="Select to Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                            <Tooltip id="edit-messages" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectionMode('delete')}
                            className="p-2 text-red-600 bg-red-100 hover:bg-red-200 rounded-full transition-colors duration-200"
                            data-tooltip-id="delete-messages"
                            data-tooltip-content="Select to Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                            <Tooltip id="delete-messages" />
                          </button>
                        </>
                      )}
                      {chatMode === 'group' && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowGroupModal(true);
                            setSelectedUsers([]);
                          }}
                          className="p-2 text-teal-600 hover:bg-teal-100 rounded-full transition-colors duration-200"
                          data-tooltip-id="add-members"
                          data-tooltip-content="Add Members"
                        >
                          <Users className="w-4 h-4" />
                          <Tooltip id="add-members" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleCloseChat}
                        className="p-2 text-gray-600 hover:bg-gray-200 rounded-full transition-colors duration-200"
                        data-tooltip-id="close-chat"
                        data-tooltip-content="Close Chat"
                      >
                        <X className="w-4 h-4" />
                        <Tooltip id="close-chat" />
                      </button>
                    </div>
                  </div>
                  <div
                    className="flex-1 overflow-y-auto mb-4 px-2 scroll-smooth"
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                  >
                    {isLoading && <p className="text-center text-sm text-gray-500">Loading messages...</p>}
                    {currentPage < totalPages && (
                      <button
                        type="button"
                        onClick={loadMoreMessages}
                        className="mx-auto mb-4 px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200"
                      >
                        Load More
                      </button>
                    )}
                    {!isLoading && messages.length === 0 && (
                      <p className="text-center text-sm text-gray-500">No messages yet</p>
                    )}
                    <AnimatePresence>
                      {messages.map((msg, index) => (
                        <motion.div
                          key={msg._id || `msg-${index}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className={`mb-4 flex ${
                            msg.sender?._id === user?._id ? 'justify-end' : 'justify-start'
                          } items-end gap-2 relative ${selectionMode ? 'cursor-pointer' : ''}`}
                          onClick={() => {
                            if (selectionMode) {
                              if (selectionMode === 'edit' && msg.sender?._id !== user?._id) {
                                return;
                              }
                              if (msg.isDeleted) return;
                              toggleMessageSelection(msg._id);
                            }
                          }}
                        >
                          {msg.sender?._id !== user?._id && (
                            <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-800 flex items-center justify-center text-sm font-semibold">
                              {getInitials(msg.sender?.name || 'Anonymous')}
                            </div>
                          )}
                          <div
                            className={`max-w-[70%] p-3 rounded-2xl shadow-sm relative ${
                              msg.sender?._id === user?._id
                                ? 'bg-teal-600 text-white rounded-br-none'
                                : 'bg-gray-100 text-gray-800 rounded-bl-none'
                            } ${selectedMessages.includes(msg._id) ? 'ring-2 ring-blue-500' : ''}`}
                          >
                            {selectionMode && !msg.isDeleted && (
                              <input
                                type="checkbox"
                                checked={selectedMessages.includes(msg._id)}
                                className="absolute -left-6 top-1/2 -translate-y-1/2"
                                readOnly
                              />
                            )}
                            <p className="text-xs font-medium mb-1">
                              {msg.sender?._id === user?._id ? 'You' : msg.sender?.name || 'Anonymous'}
                            </p>
                            {msg.isDeleted ? (
                              <p className="text-sm italic text-gray-500">This message was deleted</p>
                            ) : (
                              <>
                                {msg.content && <p className="text-sm break-words">{msg.content}</p>}
                                {msg.isEdited && (
                                  <p className="text-xs italic mt-1 ${
                                    msg.sender?._id === user?._id ? 'text-teal-200' : 'text-gray-500'
                                  }">(Edited)</p>
                                )}
                                {msg.fileUrl && (
                                  <div className="mt-2">
                                    {msg.contentType === 'image' && (
                                      <div
                                        className="cursor-pointer"
                                        onClick={() => openMediaViewer(msg.fileUrl, 'image', msg.fileName || 'Image')}
                                      >
                                        <img
                                          src={msg.fileUrl}
                                          alt={msg.fileName || 'Shared image'}
                                          className="max-w-full h-auto rounded-md"
                                        />
                                      </div>
                                    )}
                                    {msg.contentType === 'video' && (
                                      <div
                                        className="cursor-pointer"
                                        onClick={() => openMediaViewer(msg.fileUrl, 'video', msg.fileName || 'Video')}
                                      >
                                        <video
                                          src={msg.fileUrl}
                                          controls
                                          className="max-w-full h-auto rounded-md"
                                        />
                                      </div>
                                    )}
                                    {msg.contentType === 'audio' && (
                                      <div
                                        className="cursor-pointer"
                                        onClick={() => openMediaViewer(msg.fileUrl, 'audio', msg.fileName || 'Audio')}
                                      >
                                        <audio src={msg.fileUrl} controls className="w-full" />
                                      </div>
                                    )}
                                    {msg.contentType === 'application' && (
                                      <div className="flex flex-col gap-2">
                                        <button
                                          onClick={() =>
                                            openMediaViewer(
                                              msg.fileUrl,
                                              msg.fileUrl.includes('.pdf') ? 'pdf' : 'application',
                                              msg.fileName || 'Document'
                                            )
                                          }
                                          className={`flex items-center gap-1 text-sm ${
                                            msg.sender?._id === user?._id
                                              ? 'text-teal-200 hover:text-teal-100'
                                              : 'text-gray-600 hover:text-gray-800'
                                          }`}
                                        >
                                          <Paperclip className="w-4 h-4" /> View {msg.fileName || 'Document'}
                                        </button>
                                        <a
                                          href={msg.fileUrl}
                                          download={msg.fileName || 'Document'}
                                          className={`flex items-center gap-1 text-sm ${
                                            msg.sender?._id === user?._id
                                              ? 'text-teal-200 hover:text-teal-100'
                                              : 'text-gray-600 hover:text-gray-800'
                                          }`}
                                        >
                                          <Paperclip className="w-4 h-4" /> Download {msg.fileName || 'Document'}
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                            <p
                              className={`text-xs text-right mt-1 ${
                                msg.sender?._id === user?._id ? 'text-teal-300' : 'text-gray-500'
                              }`}
                            >
                              {msg.createdAt
                                ? moment.utc(msg.createdAt).tz('Africa/Lagos').format('MMM D, YYYY, h:mm A')
                                : 'Unknown'}
                            </p>
                          </div>
                          {msg.sender?._id === user?._id && (
                            <div className="w-8 h-8 rounded-full bg-teal-400 text-teal-800 flex items-center justify-center text-sm font-semibold">
                              {getInitials(msg.sender?.name || 'You')}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                    {typingUsers[selectedChat._id]?.isTyping && typingUsers[selectedChat._id]?.id !== user?._id && (
                      <p className="text-xs text-gray-500 italic mt-2">
                        {users.find((u) => u._id === typingUsers[selectedChat._id]?.id)?.name || 'Someone'} is typing...
                      </p>
                    )}
                  </div>
                  {showScrollButton && (
                    <button
                      onClick={scrollToBottom}
                      className="absolute bottom-20 right-4 p-2 bg-teal-600 text-white rounded-full shadow-md hover:bg-teal-700 transition-colors duration-200"
                      data-tooltip-id="scroll-to-bottom"
                      data-tooltip-content="Scroll to Bottom"
                    >
                      <ChevronDown className="w-5 h-5" />
                      <Tooltip id="scroll-to-bottom" />
                    </button>
                  )}
                  <div className="flex items-end gap-2 relative">
                    {editingMessageId && (
                      <div className="absolute -top-10 left-0 bg-gray-100 p-2 rounded-md flex items-center gap-2">
                        <p className="text-xs text-gray-600">Editing message...</p>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMessageId(null);
                            setNewMessage('');
                            setSelectionMode(null);
                            setSelectedMessages([]);
                          }}
                          className="p-1 text-gray-600 hover:text-gray-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {showEmojiPicker && (
                      <div className="absolute bottom-16 left-0 z-10">
                        <EmojiPicker onEmojiClick={(emoji) => setNewMessage((prev) => prev + emoji.emoji)} />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-2 text-gray-600 hover:text-teal-600 transition-colors duration-200"
                      data-tooltip-id="emoji"
                      data-tooltip-content="Emoji"
                    >
                      <Smile className="w-5 h-5" />
                      <Tooltip id="emoji" />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-gray-600 hover:text-teal-600 transition-colors duration-200"
                      data-tooltip-id="attach"
                      data-tooltip-content="Attach File"
                    >
                      <Paperclip className="w-5 h-5" />
                      <Tooltip id="attach" />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                      onChange={handleFileChange}
                    />
                    {file && (
                      <div className="flex items-center gap-2 text-sm">
                        <p className="truncate max-w-[150px]">{file.name}</p>
                        <button type="button" onClick={() => setFile(null)} className="text-red-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {isUploading && <p className="text-sm text-gray-500">Uploading...</p>}
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={editingMessageId ? 'Edit your message...' : 'Type a message...'}
                      className="flex-1 p-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 transition-colors duration-200"
                      disabled={selectionMode && !editingMessageId}
                    />
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={(!newMessage.trim() && !file) || isUploading || (selectionMode && !editingMessageId)}
                      className={`p-2 rounded-md transition-colors duration-200 ${
                        (newMessage.trim() || file) && !isUploading && (!selectionMode || editingMessageId)
                          ? 'bg-teal-600 text-white hover:bg-teal-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      data-tooltip-id="send"
                      data-tooltip-content={editingMessageId ? 'Update' : 'Send'}
                    >
                      <Send className="w-5 h-5" />
                      <Tooltip id="send" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-500 text-sm">Select a chat to start messaging.</p>
                </div>
              )}
            </motion.section>
          </main>
          {showGroupModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            >
              <motion.div className="bg-white rounded-lg p-6 w-full max-w-md shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedChat?.type === 'group' ? 'Add Members' : 'Create Group'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setShowGroupModal(false);
                      setSelectedUsers([]);
                    }}
                    className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {selectedChat?.type !== 'group' && (
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name (optional)"
                    className="w-full p-2 mb-4 text-sm border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-600 transition-colors duration-200"
                  />
                )}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Select Members</p>
                  <div className="max-h-40 overflow-y-auto">
                    {users
                      .filter((u) => !selectedChat?.members?.some((m) => m._id === u._id))
                      .map((u) => (
                        <label
                          key={u._id}
                          className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors duration-200"
                        >
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(u._id)}
                            onChange={() => {
                              if (!u._id || typeof u._id !== 'string') {
                                toast.error('Invalid user selected.');
                                return;
                              }
                              setSelectedUsers((prev) =>
                                prev.includes(u._id) ? prev.filter((id) => id !== u._id) : [...prev, u._id]
                              );
                            }}
                          />
                          <span className="text-sm text-gray-600">{u.name}</span>
                        </label>
                      ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    selectedChat?.type === 'group'
                      ? handleAddMembers(selectedChat._id, selectedUsers)
                      : handleCreateGroup()
                  }
                  className="w-full px-4 py-2 bg-gray-800 text-white font-medium rounded-md hover:bg-gray-700 transition-colors duration-200"
                >
                  {selectedChat?.type === 'group' ? 'Add Members' : 'Create Group'}
                </button>
              </motion.div>
            </motion.div>
          )}
          {showMembersModal && selectedChat?.type === 'group' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div className="bg-white rounded-lg p-6 w-full max-w-md shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedChat.name || 'Unnamed Group'} Members
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowMembersModal(false)}
                    className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {(selectedChat.members || []).map((member) => (
                    <div key={member._id} className="flex items-center gap-2 p-2 border-b border-gray-200">
                      <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-800 flex items-center justify-center text-sm font-semibold">
                        {getInitials(member.name || 'Unknown')}
                      </div>
                      <span className="text-sm text-gray-600">{member.name || 'Anonymous'}</span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowMembersModal(false)}
                  className="w-full px-4 py-2 mt-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
          {mediaViewer.isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            >
              <motion.div className="bg-white rounded-lg p-4 w-full max-w-4xl h-[90vh] flex flex-col shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 truncate max-w-[50%]">
                    {mediaViewer.fileName || 'Preview'}
                  </h2>
                  <div className="flex gap-2">
                    <a
                      href={mediaViewer.fileUrl}
                      download={mediaViewer.fileName || 'Download'}
                      className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors duration-200"
                    >
                      Download
                    </a>
                    <button
                      type="button"
                      onClick={closeMediaViewer}
                      className="p-2 text-gray-600 hover:bg-gray-200 rounded-full transition-colors duration-200"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  {mediaViewer.contentType === 'image' && (
                    <img
                      src={mediaViewer.fileUrl}
                      alt={mediaViewer.fileName || 'Preview'}
                      className="max-w-full max-h-full h-auto object-contain mx-auto"
                    />
                  )}
                  {mediaViewer.contentType === 'video' && (
                    <video
                      src={mediaViewer.fileUrl}
                      controls
                      autoPlay
                      className="max-w-full max-h-full h-auto mx-auto"
                    />
                  )}
                  {mediaViewer.contentType === 'audio' && (
                    <audio src={mediaViewer.fileUrl} controls className="w-full mx-auto" />
                  )}
                  {mediaViewer.contentType === 'pdf' && (
                    <iframe src={mediaViewer.fileUrl} className="w-full h-full border-none" title="PDF Preview" />
                  )}
                  {mediaViewer.contentType === 'application' && (
                    <iframe
                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(mediaViewer.fileUrl)}&embedded=true`}
                      className="w-full h-full border-none"
                      title="Document Preview"
                    />
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      );
    };

    export default TeamChat;