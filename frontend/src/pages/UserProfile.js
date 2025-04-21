import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Grid, 
  Paper, 
  Button, 
  Avatar, 
  TextField,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  IconButton,
  Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import StoreIcon from '@mui/icons-material/Store';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../AppBackgrounds.css';

const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [idCardImage, setIdCardImage] = useState(null);
  const [marketplacePosts, setMarketplacePosts] = useState([]);
  const [lostFoundItems, setLostFoundItems] = useState([]);
  const [rideRequests, setRideRequests] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [updatedUser, setUpdatedUser] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingIdCard, setUploadingIdCard] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, postId: null, postType: null });

  useEffect(() => {
    document.body.classList.add('user-profile-page');
    return () => {
      document.body.classList.remove('user-profile-page');
    };
  }, []);

  // Load user data from localStorage and fetch additional details from API
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (!token || !userData) {
        navigate('/login');
        return;
      }
      
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setUpdatedUser(parsedUser);
        
        // Set default headers for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Fetch complete user details
        fetchUserDetails(parsedUser.id);
        
        // Fetch user activity from all sections
        fetchMarketplacePosts(parsedUser.id);
        fetchLostFoundItems(parsedUser.id);
        fetchRideRequests(parsedUser.id);
      } catch (err) {
        console.error('Error parsing user data:', err);
        navigate('/login');
      }
    };
    
    checkAuth();
  }, [navigate]);

  const fetchUserDetails = async (userId) => {
    try {
      const response = await axios.get(`/api/users/${userId}`);
      setUser(prevUser => ({ ...prevUser, ...response.data }));
      setUpdatedUser(prevUser => ({ ...prevUser, ...response.data }));
      
      // Check if user has a profile picture
      if (response.data.profile_picture) {
        setProfileImage(response.data.profile_picture);
      }
      
      // Check if user has an ID card image
      if (response.data.id_card_image) {
        setIdCardImage(response.data.id_card_image);
      } else if (response.data.id_card_photo) {
        // Try alternative field name for ID card photo
        setIdCardImage(response.data.id_card_photo);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user details:', err);
      setLoading(false);
    }
  };

  const fetchMarketplacePosts = async (userId) => {
    setLoadingPosts(true);
    try {
      const response = await axios.get(`/api/marketplace/user-items/${userId}`);
      setMarketplacePosts(response.data || []);
      setLoadingPosts(false);
    } catch (err) {
      console.error('Error fetching marketplace posts:', err);
      setLoadingPosts(false);
    }
  };
  
  const fetchLostFoundItems = async (userId) => {
    try {
      const response = await axios.get(`/api/lost-found/user-items/${userId}`);
      setLostFoundItems(response.data || []);
    } catch (err) {
      console.error('Error fetching lost & found items:', err);
    }
  };
  
  const fetchRideRequests = async (userId) => {
    try {
      const response = await axios.get(`/api/ride/user-requests/${userId}`);
      setRideRequests(response.data || []);
    } catch (err) {
      console.error('Error fetching ride requests:', err);
    }
  };

  const handleProfileImageChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        setProfileImage(e.target.result);
      };
      
      reader.readAsDataURL(file);
      uploadProfileImage(file);
    }
  };

  const uploadProfileImage = async (file) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('profile_picture', file);
      
      const response = await axios.post(`/api/users/${user.id}/profile-picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.profile_picture) {
        setProfileImage(response.data.profile_picture);
        
        // Update local storage user data
        const userData = JSON.parse(localStorage.getItem('user'));
        userData.profile_picture = response.data.profile_picture;
        localStorage.setItem('user', JSON.stringify(userData));
        
        setSnackbar({
          open: true,
          message: 'Profile picture updated successfully',
          severity: 'success'
        });
      }
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      setSnackbar({
        open: true,
        message: 'Failed to upload profile picture',
        severity: 'error'
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleIdCardImageChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        setIdCardImage(e.target.result);
      };
      
      reader.readAsDataURL(file);
      uploadIdCardImage(file);
    }
  };

  const uploadIdCardImage = async (file) => {
    setUploadingIdCard(true);
    try {
      const formData = new FormData();
      formData.append('id_card_image', file);
      
      const response = await axios.post(`/api/users/${user.id}/id-card-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.id_card_image) {
        setIdCardImage(response.data.id_card_image);
        
        // Update local storage user data
        const userData = JSON.parse(localStorage.getItem('user'));
        userData.id_card_image = response.data.id_card_image;
        localStorage.setItem('user', JSON.stringify(userData));
        
        setSnackbar({
          open: true,
          message: 'ID card image uploaded successfully',
          severity: 'success'
        });
      }
    } catch (err) {
      console.error('Error uploading ID card image:', err);
      setSnackbar({
        open: true,
        message: 'Failed to upload ID card image',
        severity: 'error'
      });
    } finally {
      setUploadingIdCard(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setUpdatedUser(user);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedUser(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    try {
      const response = await axios.put(`/api/users/${user.id}`, updatedUser);
      
      // Update local state and localStorage
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      
      setEditMode(false);
      setSnackbar({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      setSnackbar({
        open: true,
        message: 'Failed to update profile',
        severity: 'error'
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
    
    setSnackbar({
      open: true,
      message: 'Logged out successfully',
      severity: 'success'
    });
  };

  // Load user posts based on active tab
  useEffect(() => {
    if (user?._id) {
      setLoadingPosts(true);
      
      const endpoint = 
        tabValue === 0 ? `/api/marketplace/user-items/${user._id}` : 
        tabValue === 1 ? `/api/lost-found/user-items/${user._id}` : 
        `/api/ride/user-requests/${user._id}`;
      
      axios.get(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
        .then(response => {
          if (tabValue === 0) {
            setMarketplacePosts(response.data || []);
          } else if (tabValue === 1) {
            setLostFoundItems(response.data || []);
          } else {
            setRideRequests(response.data || []);
          }
        })
        .catch(error => {
          console.error(`Error fetching user ${tabValue === 0 ? 'marketplace items' : tabValue === 1 ? 'lost & found items' : 'rides'}:`, error);
          setSnackbar({
            open: true,
            message: `Failed to load your ${tabValue === 0 ? 'marketplace items' : tabValue === 1 ? 'lost & found items' : 'rides'}.`,
            severity: 'error'
          });
        })
        .finally(() => {
          setLoadingPosts(false);
        });
    }
  }, [user, tabValue]);

  // Handle delete dialog actions
  const handleOpenDeleteDialog = (id, type) => {
    setDeleteDialog({
      open: true,
      postId: id,
      postType: type
    });
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      postId: null,
      postType: null
    });
  };

  const handleDeleteItem = () => {
    if (!deleteDialog.postId || !deleteDialog.postType) return;
    
    const endpoint = 
      deleteDialog.postType === 'marketplace' ? `/api/marketplace/items/${deleteDialog.postId}` : 
      deleteDialog.postType === 'lostfound' ? `/api/lost-found/items/${deleteDialog.postId}` : 
      `/api/ride/requests/${deleteDialog.postId}`;
    
    axios.delete(endpoint, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(() => {
        // Remove deleted item from state
        if (deleteDialog.postType === 'marketplace') {
          setMarketplacePosts(prev => prev.filter(item => item._id !== deleteDialog.postId));
        } else if (deleteDialog.postType === 'lostfound') {
          setLostFoundItems(prev => prev.filter(item => item._id !== deleteDialog.postId));
        } else {
          setRideRequests(prev => prev.filter(ride => ride._id !== deleteDialog.postId));
        }
        
        setSnackbar({
          open: true,
          message: `${deleteDialog.postType === 'marketplace' ? 'Item' : deleteDialog.postType === 'lostfound' ? 'Report' : 'Ride'} deleted successfully.`,
          severity: 'success'
        });
      })
      .catch(error => {
        console.error('Error deleting item:', error);
        setSnackbar({
          open: true,
          message: `Failed to delete ${deleteDialog.postType === 'marketplace' ? 'item' : deleteDialog.postType === 'lostfound' ? 'report' : 'ride'}.`,
          severity: 'error'
        });
      })
      .finally(() => {
        handleCloseDeleteDialog();
      });
  };

  // User Activity Tabs Section
  const renderUserActivity = () => {
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mt: 4,
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.5)'
        }}
      >
        <Typography variant="h5" gutterBottom>
          Your Activity
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="user activity tabs"
            sx={{ mb: 2 }}
          >
            <Tab 
              icon={<StoreIcon />} 
              label="Marketplace" 
              id="tab-0" 
              aria-controls="tabpanel-0" 
            />
            <Tab 
              icon={<HelpOutlineIcon />} 
              label="Lost & Found" 
              id="tab-1" 
              aria-controls="tabpanel-1" 
            />
            <Tab 
              icon={<DirectionsBusIcon />} 
              label="Ride Sharing" 
              id="tab-2" 
              aria-controls="tabpanel-2" 
            />
          </Tabs>
        </Box>
        
        {/* Marketplace Tab */}
        <div
          role="tabpanel"
          hidden={tabValue !== 0}
          id="tabpanel-0"
          aria-labelledby="tab-0"
        >
          {tabValue === 0 && (
            <>
              {loadingPosts ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : marketplacePosts.length > 0 ? (
                <Grid container spacing={3}>
                  {marketplacePosts.map((post) => (
                    <Grid item xs={12} sm={6} md={4} key={post._id}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardMedia
                          component="img"
                          height="140"
                          image={post.image || 'https://via.placeholder.com/300x140?text=No+Image'}
                          alt={post.title}
                        />
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" component="div" gutterBottom noWrap>
                            {post.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {post.description.length > 100 ? post.description.substring(0, 100) + '...' : post.description}
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="h6" color="primary">
                              ${post.price}
                            </Typography>
                            <Chip label={post.category} size="small" color="primary" variant="outlined" />
                          </Box>
                        </CardContent>
                        <CardActions>
                          <Button size="small" onClick={() => navigate(`/marketplace/item/${post._id}`)}>
                            View
                          </Button>
                          <Button size="small" color="primary" onClick={() => navigate(`/marketplace/edit/${post._id}`)}>
                            Edit
                          </Button>
                          <Button size="small" color="error" onClick={() => handleOpenDeleteDialog(post._id, 'marketplace')}>
                            Delete
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    You haven't posted any items in the marketplace yet.
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<StoreIcon />}
                    onClick={() => navigate('/marketplace/sell')}
                  >
                    Create Your First Post
                  </Button>
                </Box>
              )}
            </>
          )}
        </div>
        
        {/* Lost & Found Tab */}
        <div
          role="tabpanel"
          hidden={tabValue !== 1}
          id="tabpanel-1"
          aria-labelledby="tab-1"
        >
          {tabValue === 1 && (
            <>
              {loadingPosts ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : lostFoundItems.length > 0 ? (
                <Grid container spacing={3}>
                  {lostFoundItems.map((item) => (
                    <Grid item xs={12} sm={6} md={4} key={item._id}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box 
                          sx={{ 
                            p: 1, 
                            bgcolor: item.status === 'LOST' ? 'error.main' : 'success.main',
                            color: 'white',
                            textAlign: 'center'
                          }}
                        >
                          <Typography variant="subtitle2">
                            {item.status}
                          </Typography>
                        </Box>
                        <CardMedia
                          component="img"
                          height="140"
                          image={item.image || 'https://via.placeholder.com/300x140?text=No+Image'}
                          alt={item.title}
                        />
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" component="div" gutterBottom noWrap>
                            {item.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {item.description.length > 100 ? item.description.substring(0, 100) + '...' : item.description}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2">
                              <strong>Location:</strong> {item.location}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Date:</strong> {new Date(item.date).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </CardContent>
                        <CardActions>
                          <Button size="small" onClick={() => navigate(`/lost-found/item/${item._id}`)}>
                            View
                          </Button>
                          <Button size="small" color="primary" onClick={() => navigate(`/lost-found/edit/${item._id}`)}>
                            Edit
                          </Button>
                          <Button size="small" color="error" onClick={() => handleOpenDeleteDialog(item._id, 'lostfound')}>
                            Delete
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    You haven't reported any lost or found items yet.
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<HelpOutlineIcon />}
                    onClick={() => navigate('/lost-found/report')}
                  >
                    Report Lost or Found Item
                  </Button>
                </Box>
              )}
            </>
          )}
        </div>
        
        {/* Ride Sharing Tab */}
        <div
          role="tabpanel"
          hidden={tabValue !== 2}
          id="tabpanel-2"
          aria-labelledby="tab-2"
        >
          {tabValue === 2 && (
            <>
              {loadingPosts ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : rideRequests.length > 0 ? (
                <Grid container spacing={3}>
                  {rideRequests.map((ride) => (
                    <Grid item xs={12} sm={6} md={4} key={ride._id}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box 
                          sx={{ 
                            p: 1, 
                            bgcolor: ride.type === 'OFFER' ? 'success.main' : 'info.main',
                            color: 'white',
                            textAlign: 'center'
                          }}
                        >
                          <Typography variant="subtitle2">
                            {ride.type === 'OFFER' ? 'OFFERING RIDE' : 'REQUESTING RIDE'}
                          </Typography>
                        </Box>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" component="div" gutterBottom>
                            {ride.origin} → {ride.destination}
                          </Typography>
                          <Typography variant="body2" paragraph>
                            {new Date(ride.date).toLocaleDateString()} at {ride.time}
                          </Typography>
                          <Divider sx={{ my: 1 }} />
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                <strong>Type:</strong> {ride.type}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                <strong>Seats:</strong> {ride.seats}
                              </Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="body2">
                                <strong>Price:</strong> ${ride.price}
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                        <CardActions>
                          <Button size="small" onClick={() => navigate(`/ride-booking/ride/${ride._id}`)}>
                            View
                          </Button>
                          <Button size="small" color="primary" onClick={() => navigate(`/ride-booking/edit/${ride._id}`)}>
                            Edit
                          </Button>
                          <Button size="small" color="error" onClick={() => handleOpenDeleteDialog(ride._id, 'ride')}>
                            Delete
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    You haven't created any ride requests or offers yet.
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<DirectionsBusIcon />}
                    onClick={() => navigate('/ride-booking/new')}
                  >
                    Create a Ride Request/Offer
                  </Button>
                </Box>
              )}
            </>
          )}
        </div>
      </Paper>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* User Profile Section */}
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              borderRadius: '16px', 
              mb: 4,
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.5)'
            }}
          >
            <Grid container spacing={3}>
              {/* Profile Image Section */}
              <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar 
                    src={profileImage} 
                    alt={user?.name || 'User'} 
                    sx={{ 
                      width: 200, 
                      height: 200, 
                      mb: 2,
                      border: '3px solid #1976d2',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                      bgcolor: 'secondary.main',
                      fontSize: 80
                    }}
                  >
                    {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                  </Avatar>
                  {uploadingImage ? (
                    <CircularProgress 
                      size={30} 
                      sx={{ 
                        position: 'absolute', 
                        bottom: 20, 
                        right: 0 
                      }} 
                    />
                  ) : (
                    <IconButton
                      color="primary"
                      aria-label="upload picture"
                      component="label"
                      sx={{ 
                        position: 'absolute', 
                        bottom: 20, 
                        right: 0, 
                        backgroundColor: 'white',
                        '&:hover': { backgroundColor: '#f5f5f5' }
                      }}
                    >
                      <input 
                        hidden 
                        accept="image/*" 
                        type="file" 
                        onChange={handleProfileImageChange} 
                      />
                      <PhotoCameraIcon />
                    </IconButton>
                  )}
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {user?.name}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {user?.email}
                </Typography>
                
                {/* ID Card View Section */}
                <Box sx={{ 
                  mt: 3, 
                  width: '100%', 
                  p: 2, 
                  borderRadius: '8px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.5)',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)'
                }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500 }}>
                    ID Card
                  </Typography>
                  
                  {idCardImage ? (
                    <Box sx={{ position: 'relative', mb: 1 }}>
                      <img 
                        src={idCardImage} 
                        alt="ID Card" 
                        style={{ 
                          width: '100%', 
                          borderRadius: '4px',
                          maxHeight: '120px',
                          objectFit: 'contain',
                          border: '1px solid rgba(0, 0, 0, 0.1)'
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          console.error('Error loading ID card image');
                          // Show a fallback element when image fails to load
                          const parent = e.target.parentNode;
                          const fallback = document.createElement('div');
                          fallback.style.padding = '20px';
                          fallback.style.background = 'rgba(0, 0, 0, 0.03)';
                          fallback.style.borderRadius = '4px';
                          fallback.style.color = 'rgba(0, 0, 0, 0.6)';
                          fallback.innerText = 'Unable to load ID card image';
                          parent.appendChild(fallback);
                        }}
                      />
                    </Box>
                  ) : (
                    <Box sx={{ p: 2, bgcolor: 'rgba(0, 0, 0, 0.03)', borderRadius: '4px' }}>
                      <Typography variant="body2" color="text.secondary">
                        ID card image not available
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                {!editMode && (
                  <Box sx={{ mt: 3, width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button 
                      variant="contained" 
                      className="gradient-primary"
                      fullWidth
                      onClick={handleEditClick}
                      startIcon={<EditIcon />}
                    >
                      Edit Profile
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="error"
                      fullWidth
                      startIcon={<LogoutIcon />}
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  </Box>
                )}
              </Grid>
              
              {/* User Details Section */}
              <Grid item xs={12} md={8}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  {editMode ? 'Edit Profile' : 'Profile Information'}
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                {editMode ? (
                  <>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Name"
                          name="name"
                          variant="outlined"
                          value={updatedUser.name || ''}
                          onChange={handleInputChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          name="email"
                          variant="outlined"
                          value={updatedUser.email || ''}
                          disabled
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Student ID"
                          name="student_id"
                          variant="outlined"
                          value={updatedUser.student_id || ''}
                          onChange={handleInputChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Department"
                          name="department"
                          variant="outlined"
                          value={updatedUser.department || ''}
                          onChange={handleInputChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Semester"
                          name="semester"
                          variant="outlined"
                          value={updatedUser.semester || ''}
                          onChange={handleInputChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Phone"
                          name="phone"
                          variant="outlined"
                          value={updatedUser.phone || ''}
                          onChange={handleInputChange}
                          placeholder="Add your phone number"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Address"
                          name="address"
                          variant="outlined"
                          multiline
                          rows={2}
                          value={updatedUser.address || ''}
                          onChange={handleInputChange}
                        />
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        variant="outlined" 
                        color="error" 
                        startIcon={<CancelIcon />} 
                        sx={{ mr: 2 }}
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<SaveIcon />}
                        onClick={handleSaveChanges}
                      >
                        Save Changes
                      </Button>
                    </Box>
                  </>
                ) : (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Student ID
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {user?.student_id || 'Not provided'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Department
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {user?.department || 'Not provided'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Semester
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {user?.semester || 'Not provided'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {user?.phone || 'Not provided'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Address
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {user?.address || 'Not provided'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Account Status
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: user?.verification_status === 'approved' ? 'green' : 'orange',
                          fontWeight: 600,
                          mb: 2
                        }}
                      >
                        {user?.verification_status === 'approved' ? 'Verified' : 'Pending Verification'}
                      </Typography>
                    </Grid>
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Paper>
          
          {/* User Activity Section with Tabs */}
          {renderUserActivity()}
          
          {/* Delete Confirmation Dialog */}
          <Dialog
            open={deleteDialog.open}
            onClose={handleCloseDeleteDialog}
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
          >
            <DialogTitle id="delete-dialog-title">
              Confirm Delete
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="delete-dialog-description">
                Are you sure you want to delete this {
                  deleteDialog.postType === 'marketplace' ? 'marketplace item' : 
                  deleteDialog.postType === 'lostfound' ? 'lost & found report' : 
                  'ride request'
                }? This action cannot be undone.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
              <Button onClick={handleDeleteItem} color="error" autoFocus>
                Delete
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Snackbar for notifications */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert 
              onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
              severity={snackbar.severity}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </>
      )}
    </Container>
  );
};

export default UserProfile; 