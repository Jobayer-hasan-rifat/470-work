import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { jwtDecode as jwt_decode } from 'jwt-decode';
import { io } from 'socket.io-client';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  CircularProgress,
  Chip,
  Tooltip,
  Snackbar,
  Alert,
  Divider
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';

const MessageDisplay = ({ userId }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Initialize socket connection
  useEffect(() => {
    if (!userId) return;
    
    // Connect to socket server
    const socketInstance = io('http://localhost:5000');
    setSocket(socketInstance);
    
    // Socket event listeners
    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setIsSocketConnected(true);
      
      // Register user with socket
      socketInstance.emit('register_user', { user_id: userId });
    });
    
    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsSocketConnected(false);
    });
    
    socketInstance.on('new_message', (message) => {
      console.log('New message received:', message);
      
      // Add message to the list if it belongs to the current conversation
      if (selectedConversation) {
        const isForCurrentConversation = (
          (message.sender_id === userId && message.receiver_id === selectedConversation.other_participant?.id) ||
          (message.sender_id === selectedConversation.other_participant?.id && message.receiver_id === userId)
        );
        
        if (isForCurrentConversation) {
          // Add the new message to the messages list
          setMessages(prevMessages => [...prevMessages, message]);
          
          // Mark the message as read if it's from the other user
          if (message.sender_id === selectedConversation.other_participant?.id) {
            markConversationAsRead(selectedConversation._id);
          }
        }
      }
      
      // Always update conversations list to show the latest message
      fetchConversations();
    });
    
    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
      showSnackbar(error.message || 'An error occurred', 'error');
    });
    
    // Clean up on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [userId, selectedConversation]);
  
  // Fetch conversations whenever the component mounts or userId changes
  useEffect(() => {
    if (userId) {
      fetchConversations();
    }
  }, [userId]);
  
  // Fetch messages whenever the selected conversation changes
  useEffect(() => {
    if (selectedConversation && selectedConversation._id) {
      fetchMessages(selectedConversation._id);
      
      // Mark conversation as read when selected
      markConversationAsRead(selectedConversation._id);
    }
  }, [selectedConversation?._id]);
  
  // Scroll to bottom of messages when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Fetch all conversations for the current user
  const fetchConversations = async () => {
    if (!userId) return;
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }
      
      const response = await axios.get('/api/messages/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data) {
        setConversations(response.data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations. Please try again later.');
      setLoading(false);
    }
  };
  
  // Fetch messages for a specific conversation
  const fetchMessages = async (conversationId) => {
    if (!conversationId) return;
    
    setLoadingMessages(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }
      
      const response = await axios.get(`/api/messages/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data) {
        setMessages(response.data);
        setLoadingMessages(false);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages. Please try again later.');
      setLoadingMessages(false);
    }
  };
  
  // Show snackbar message
  const showSnackbar = (message, severity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  
  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };
  
  // Handle selecting a conversation
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setError(null);
    
    // Mark conversation as read when selected
    if (conversation && conversation._id) {
      markConversationAsRead(conversation._id);
    }
  };
  
  // Mark conversation as read
  const markConversationAsRead = async (conversationId) => {
    if (!conversationId || !userId) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      await axios.put(`/api/messages/conversations/${conversationId}/read`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Update the UI to show messages as read
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.receiver_id === userId && !msg.read ? { ...msg, read: true } : msg
        )
      );
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };
  
  // Handle input change
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
  };
  
  // Handle file selection
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      
      // Create new attachments with preview
      const newAttachments = files.map(file => ({
        id: `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file: file,
        name: file.name,
        type: file.type,
        size: file.size,
        preview: URL.createObjectURL(file)
      }));
      
      setAttachments([...attachments, ...newAttachments]);
    }
  };
  
  // Handle removing an attachment
  const handleRemoveAttachment = (attachmentId) => {
    const updatedAttachments = attachments.filter(attachment => attachment.id !== attachmentId);
    setAttachments(updatedAttachments);
  };
  
  // Handle sending a message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    
    if ((!newMessage.trim() && attachments.length === 0) || !selectedConversation) return;
    
    setSendingMessage(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        setSendingMessage(false);
        return;
      }
      
      // Prepare message data
      const messageData = {
        receiver_id: selectedConversation.other_participant.id,
        content: newMessage.trim(),
        conversation_id: selectedConversation._id
      };
      
      // Create a temporary message to show immediately in the UI
      const tempMessage = {
        _id: `temp-${Date.now()}`,
        sender_id: userId,
        receiver_id: selectedConversation.other_participant.id,
        content: newMessage.trim(),
        created_at: new Date().toISOString(),
        read: false,
        pending: true // Mark as pending until confirmed by server
      };
      
      // Add the temporary message to the UI immediately
      setMessages(prevMessages => [...prevMessages, tempMessage]);
      
      let response;
      
      // Handle attachments if any
      if (attachments.length > 0) {
        setUploadingAttachment(true);
        
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('receiver_id', selectedConversation.other_participant.id);
        formData.append('content', newMessage.trim());
        formData.append('conversation_id', selectedConversation._id);
        
        // Append each attachment
        attachments.forEach(attachment => {
          formData.append('image', attachment.file);
        });
        
        // Send message with attachment
        response = await axios.post('/api/messages/upload', formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Send text-only message
        response = await axios.post('/api/messages', messageData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      if (response.data && response.data.status === 'success') {
        // Clear input and attachments
        setNewMessage('');
        setAttachments([]);
        
        // Update conversation with new message
        updateConversationWithNewMessage(messageData.content);
        
        // Replace the temporary message with the confirmed one from the server
        if (response.data.data) {
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg._id === tempMessage._id ? { ...response.data.data, pending: false } : msg
            )
          );
        }
        
        // If the conversation was just created, refresh conversations list
        if (!selectedConversation._id.startsWith('temp-')) {
          fetchConversations();
        }
      } else {
        // Remove the temporary message if there was an error
        setMessages(prevMessages => prevMessages.filter(msg => msg._id !== tempMessage._id));
        throw new Error(response.data?.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showSnackbar('Error sending message. Please try again.', 'error');
    } finally {
      setSendingMessage(false);
      setUploadingAttachment(false);
    }
  };
  
  // Helper function to update conversation with new message
  const updateConversationWithNewMessage = (messageContent) => {
    if (!selectedConversation) return;
    
    setConversations(prevConversations => 
      prevConversations.map(conv => 
        conv._id === selectedConversation._id 
          ? { 
              ...conv, 
              last_message: messageContent,
              last_message_time: new Date().toISOString()
            } 
          : conv
      )
    );
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Today, show time only
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffDays < 7) {
      // This week, show day name
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      // Older, show date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  
  // Generate color from string
  const stringToColor = (string) => {
    if (!string) return '#6573c3'; // Default color
    
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    
    return color;
  };
  
  return (
    <Box sx={{ display: 'flex', height: '100%', width: '100%' }}>
      {/* Conversations List */}
      <Paper 
        elevation={0} 
        sx={{ 
          width: 320, 
          height: '100%', 
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Messages</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <TextField
              placeholder="Search conversations..."
              variant="outlined"
              size="small"
              fullWidth
              sx={{ mr: 1 }}
            />
            <Tooltip title="Refresh">
              <span>
                <IconButton size="small" onClick={fetchConversations} disabled={loading}>
                  {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
        
        <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
          {conversations.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <ChatBubbleOutlineIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No conversations yet. Start chatting with users from the Marketplace, Lost & Found, or Ride Share pages.
              </Typography>
            </Box>
          ) : (
            conversations.map(conversation => (
              <ListItem
                key={conversation._id}
                button
                selected={selectedConversation?._id === conversation._id}
                onClick={() => handleSelectConversation(conversation)}
                sx={{ 
                  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                  bgcolor: selectedConversation?._id === conversation._id ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.08)'
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar 
                    sx={{ 
                      bgcolor: stringToColor(conversation.other_participant?.name),
                      width: 48,
                      height: 48
                    }}
                  >
                    {conversation.other_participant?.name?.charAt(0).toUpperCase() || <PersonIcon />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 'medium', 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ 
                        maxWidth: '70%', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap' 
                      }}>
                        {conversation.other_participant?.name || 'Unknown User'}
                      </span>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimestamp(conversation.last_message_time)}
                      </Typography>
                    </Typography>
                  }
                  secondary={
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%'
                      }}
                    >
                      {conversation.last_message || 'No messages yet'}
                    </Typography>
                  }
                />
              </ListItem>
            ))
          )}
        </List>
      </Paper>
      
      {/* Message Display */}
      <Paper 
        elevation={0} 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          height: '100%',
          bgcolor: 'rgba(0, 0, 0, 0.02)'
        }}
      >
        {selectedConversation ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Conversation Header */}
            <Box sx={{ 
              p: 2, 
              borderBottom: '1px solid rgba(0, 0, 0, 0.12)', 
              display: 'flex', 
              alignItems: 'center',
              bgcolor: 'background.paper'
            }}>
              <Avatar 
                sx={{ 
                  bgcolor: stringToColor(selectedConversation.other_participant?.name),
                  width: 40,
                  height: 40,
                  mr: 2
                }}
              >
                {selectedConversation.other_participant?.name?.charAt(0).toUpperCase() || <PersonIcon />}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  {selectedConversation.other_participant?.name || 'Unknown User'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedConversation.other_participant?.email || ''}
                </Typography>
              </Box>
            </Box>
            
            {/* Messages Area */}
            <Box sx={{ 
              flexGrow: 1, 
              overflow: 'auto', 
              p: 2,
              display: 'flex',
              flexDirection: 'column'
            }}>
              {loadingMessages ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : messages.length === 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  p: 3
                }}>
                  <ChatBubbleOutlineIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">No messages yet</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                    Start the conversation by sending a message below.
                  </Typography>
                </Box>
              ) : (
                messages.map((message, index) => {
                  const isCurrentUser = message.sender_id === userId;
                  const showDate = index === 0 || 
                    new Date(message.created_at).toDateString() !== 
                    new Date(messages[index - 1].created_at).toDateString();
                  
                  return (
                    <React.Fragment key={`${message._id}-${index}`}>
                      {showDate && (
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            my: 2 
                          }}
                        >
                          <Chip 
                            label={new Date(message.created_at).toLocaleDateString()} 
                            size="small"
                            sx={{ bgcolor: 'rgba(0, 0, 0, 0.08)' }}
                          />
                        </Box>
                      )}
                      
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                          mb: 1.5
                        }}
                      >
                        <Box 
                          sx={{ 
                            maxWidth: '70%',
                            display: 'flex',
                            flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                            alignItems: 'flex-end'
                          }}
                        >
                          {!isCurrentUser && (
                            <Avatar 
                              sx={{ 
                                width: 32, 
                                height: 32, 
                                mr: 1,
                                bgcolor: stringToColor(selectedConversation.other_participant?.name)
                              }}
                            >
                              {selectedConversation.other_participant?.name?.charAt(0).toUpperCase() || <PersonIcon />}
                            </Avatar>
                          )}
                          
                          <Box 
                            sx={{ 
                              bgcolor: isCurrentUser ? 'primary.main' : 'background.paper',
                              color: isCurrentUser ? 'primary.contrastText' : 'text.primary',
                              borderRadius: 2,
                              p: 1.5,
                              boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
                              position: 'relative',
                              opacity: message.pending ? 0.7 : 1
                            }}
                          >
                            {message.content && (
                              <Typography variant="body1">{message.content}</Typography>
                            )}
                            
                            {message.image_url && (
                              <Box 
                                component="img"
                                src={message.image_url}
                                alt="Attachment"
                                sx={{ 
                                  maxWidth: '100%', 
                                  maxHeight: 200, 
                                  borderRadius: 1,
                                  mt: message.content ? 1 : 0
                                }}
                              />
                            )}
                            
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                display: 'block', 
                                textAlign: 'right', 
                                mt: 0.5,
                                color: isCurrentUser ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'
                              }}
                            >
                              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {message.pending && ' • Sending...'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </Box>
            
            {/* Message Input */}
            <Box sx={{ 
              p: 2, 
              borderTop: '1px solid rgba(0, 0, 0, 0.12)', 
              bgcolor: 'background.paper'
            }}>
              <form onSubmit={handleSendMessage}>
                {attachments.length > 0 && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 1,
                    mb: 2
                  }}>
                    {attachments.map((attachment, index) => (
                      <Box 
                        key={`${attachment.id}-${index}`}
                        sx={{ 
                          width: 80, 
                          height: 80, 
                          position: 'relative',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)'
                        }}
                      >
                        <Box
                          component="img"
                          src={attachment.preview}
                          alt={attachment.name}
                          sx={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                        <IconButton 
                          size="small"
                          sx={{ 
                            position: 'absolute', 
                            top: -8, 
                            right: -8,
                            bgcolor: 'background.paper',
                            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)',
                            '&:hover': {
                              bgcolor: 'background.paper'
                            }
                          }}
                          onClick={() => handleRemoveAttachment(attachment.id)}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Tooltip title="Attach file">
                    <span>
                      <IconButton 
                        color="primary"
                        onClick={() => fileInputRef.current.click()}
                        disabled={sendingMessage}
                        type="button"
                      >
                        <AttachFileIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleFileSelect}
                    multiple
                  />
                  
                  <TextField
                    fullWidth
                    placeholder="Type a message..."
                    variant="outlined"
                    size="small"
                    value={newMessage}
                    onChange={handleInputChange}
                    disabled={sendingMessage}
                    sx={{ 
                      mx: 1,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '20px'
                      }
                    }}
                  />
                  
                  <Tooltip title="Send message">
                    <span>
                      <IconButton 
                        color="primary" 
                        onClick={handleSendMessage}
                        disabled={(!newMessage.trim() && attachments.length === 0) || sendingMessage}
                        type="submit"
                      >
                        {sendingMessage ? (
                          <CircularProgress size={24} thickness={4} />
                        ) : (
                          <SendIcon />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </form>
            </Box>
          </Box>
        ) : (
          <Box sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            p: 3,
            bgcolor: 'rgba(0, 0, 0, 0.02)'
          }}>
            <ChatBubbleOutlineIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">No conversation selected</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
              Select a conversation from the list or start a new one by contacting users from the Marketplace, Lost & Found, or Ride Share pages.
            </Typography>
          </Box>
        )}
      </Paper>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MessageDisplay;
