import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const SimpleMessageDialog = ({ open, onClose, item, itemType }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Generate initial message based on item type
  useState(() => {
    if (item) {
      let initialMessage = '';
      switch (itemType) {
        case 'marketplace':
          initialMessage = `Hi, I'm interested in your item "${item.title}". Is it still available?`;
          break;
        case 'ride':
          // Use the correct property for ride destination
          const destination = item.to_location || item.destination || item.to_location_custom || 'your destination';
          initialMessage = `Hi, I'm interested in your ride to ${destination}. Is there still space available?`;
          break;
        case 'lost':
          initialMessage = `Hi, I think I may have found your lost item "${item.title}". Can we connect?`;
          break;
        case 'found':
          initialMessage = `Hi, I think you may have found my item. The "${item.title}" you posted looks like mine. Can we connect?`;
          break;
        default:
          initialMessage = `Hi, I'm contacting you about your post "${item.title || 'your listing'}".`;
      }
      setMessage(initialMessage);
      console.log('Generated initial message:', initialMessage);
    }
  }, [item, itemType]);

  const handleSendMessage = async () => {
    if (!message.trim() || !item) return;

    // Get current user ID from token
    const token = localStorage.getItem('token');
    if (!token) {
      setSnackbar({
        open: true,
        message: 'Please log in to contact the user',
        severity: 'warning'
      });
      return;
    }

    setSending(true);
    try {
      // Get user ID from token - handle different token formats
      let userId;
      try {
        const decoded = jwtDecode(token);
        userId = decoded.sub || decoded.user_id;
        console.log('User ID from token:', userId);
      } catch (tokenError) {
        console.error('Error decoding token:', tokenError);
        throw new Error('Unable to authenticate. Please log in again.');
      }

      console.log('Sending message with data:', {
        sender_id: userId,
        receiver_id: item.user_id,
        content: message,
        item_id: item._id,
        item_type: itemType || 'general'
      });
      
      // Create a new message in the database
      try {
        await axios.post('/api/messages', {
          sender_id: userId,
          receiver_id: item.user_id,
          content: message,
          item_id: item._id,
          item_type: itemType || 'general'
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (apiError) {
        console.error('API error when sending message:', apiError);
        // Try an alternative approach - direct socket.io message
        try {
          // If the API call fails, we'll try to send the message directly to the backend
          // This is a fallback mechanism
          const response = await axios.post('/api/messages/direct', {
            sender_id: userId,
            receiver_id: item.user_id,
            content: message,
            item_id: item._id,
            item_type: itemType || 'general'
          }, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          console.log('Message sent via alternative route:', response.data);
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          throw new Error('Could not send message through any available channel');
        }
      }

      setSnackbar({
        open: true,
        message: 'Message sent successfully! Check your profile messages to continue the conversation.',
        severity: 'success'
      });

      // Close dialog after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error sending message:', error);
      setSnackbar({
        open: true,
        message: `Error sending message: ${error.response?.data?.message || error.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setSending(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: '1px solid #eee',
            bgcolor: itemType === 'lost' ? 'rgba(255, 82, 82, 0.05)' : 'rgba(0, 200, 83, 0.05)',
            '& .MuiTypography-root': {
              display: 'flex',
              alignItems: 'center',
              fontWeight: 'bold'
            }
          }}
        >
          Contact {itemType === 'marketplace' ? 'Seller' : itemType === 'ride' ? 'Driver' : itemType === 'lost' ? 'Owner' : 'Finder'}
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close" sx={{ ml: 'auto' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Re: {item?.title || 'Item'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your message will be sent to {item?.creator_name || 'the user'} and will appear in your messages.
            </Typography>
          </Box>
          
          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
          <Button 
            onClick={onClose} 
            color="inherit"
            disabled={sending}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSendMessage} 
            variant="contained" 
            color={itemType === 'lost' ? 'error' : itemType === 'found' ? 'success' : 'primary'}
            disabled={!message.trim() || sending}
            startIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {sending ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SimpleMessageDialog;
