import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Grid, 
  Paper, 
  Divider,
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  ListItemIcon,
  Avatar, 
  Button, 
  Card, 
  CardContent,
  CircularProgress,
  Alert,
  Drawer,
  Toolbar,
  IconButton,
  AppBar,
  CssBaseline,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import GroupIcon from '@mui/icons-material/Group';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import StoreIcon from '@mui/icons-material/Store';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuIcon from '@mui/icons-material/Menu';
import axios from 'axios';
import '../AppBackgrounds.css';

// Drawer width for the sidebar
const drawerWidth = 240;

const AdminDashboard = () => {
  // ...existing state...
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editUserData, setEditUserData] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Handler to open edit drawer/modal
  const handleEditUser = (user) => {
    setEditUserData(user);
    setEditUserOpen(true);
  };

  // Handler to close edit drawer/modal
  const handleEditUserClose = () => {
    setEditUserOpen(false);
    setEditUserData(null);
  };

  // Handler to open delete confirmation dialog
  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  // Handler to close delete confirmation dialog
  const handleDeleteUserClose = () => {
    setDeleteConfirmOpen(false);
    setUserToDelete(null);
  };

  // Handler to actually delete user
  const handleDeleteUserConfirm = async () => {
    if (!userToDelete) return;
    setActionLoading(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
      await axios.delete(`/api/admin/delete-user/${userToDelete._id}`);
      setError('');
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      await fetchDashboardData();
    } catch (err) {
      setError(`Failed to delete user: ${err.response?.data?.error || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handler to save edited user
  const handleEditUserSave = async () => {
    if (!editUserData) return;
    setActionLoading(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
      await axios.put(`/api/admin/edit-user/${editUserData._id}`, editUserData);
      setError('');
      setEditUserOpen(false);
      setEditUserData(null);
      await fetchDashboardData();
    } catch (err) {
      setError(`Failed to edit user: ${err.response?.data?.error || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [verifiedUsers, setVerifiedUsers] = useState([]);
  const [debugInfo, setDebugInfo] = useState(null);
  const [tokenVerified, setTokenVerified] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add('admin-dashboard-page');
    return () => document.body.classList.remove('admin-dashboard-page');
  }, []);

  // Check if admin is logged in
  useEffect(() => {
    console.log("AdminDashboard mounted, checking auth...");
    
    const adminToken = localStorage.getItem('adminToken');
    const adminInfo = localStorage.getItem('adminInfo');
    
    console.log("Admin token:", adminToken ? "Present" : "Missing");
    console.log("Admin info:", adminInfo);
    
    if (!adminToken) {
      console.log("No admin token found, redirecting to login");
      navigate('/admin-login');
      return;
    }

    // Set up axios default headers
    axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
    console.log("Authorization header set");

    // If we've already verified the token in this session, skip verification
    if (tokenVerified) {
      console.log("Token already verified in this session");
      fetchDashboardData();
      return;
    }

    // Attempt to fetch dashboard data directly
    // If it fails due to auth issues, then redirect to login
    fetchDashboardData()
      .then(() => {
        setTokenVerified(true);
      })
      .catch(err => {
        console.error("Dashboard data fetch failed, likely an auth issue:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminInfo');
          navigate('/admin-login');
        } else if (err.response?.status === 429) {
          // Rate limit error
          setError("Rate limit exceeded. Please wait a moment and try again.");
          setTimeout(() => {
            window.location.reload();
          }, 5000); // Wait 5 seconds and reload
        }
      });
  }, [navigate, tokenVerified]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      console.log("Fetching admin dashboard data...");
      
      // Create default empty stats in case of failure
      const defaultStats = {
        users: { total: 0, verified: 0, pending: 0 },
        rooms: { total: 0 },
        marketplace: { total_items: 0 },
        recent_activities: { bookings: [], items: [] }
      };
      
      try {
        // Get statistics
        console.log("Fetching statistics...");
        const statsResponse = await axios.get('/api/admin/statistics');
        console.log("Statistics response:", statsResponse.data);
        setStats(statsResponse.data);
      } catch (statsErr) {
        console.error("Error fetching statistics:", statsErr);
        setStats(defaultStats);
        
        setDebugInfo(prev => ({
          ...prev,
          statisticsError: {
            message: statsErr.message,
            status: statsErr.response?.status,
            data: statsErr.response?.data
          }
        }));
        
        // If this is an authorization error, redirect to login
        if (statsErr.response?.status === 401 || statsErr.response?.status === 403) {
          throw statsErr; // Propagate auth errors to the main catch block
        }
      }

      try {
        // Get pending users
        console.log("Fetching pending users...");
        const pendingResponse = await axios.get('/api/admin/pending-users');
        console.log("Pending users response:", pendingResponse.data);
        setPendingUsers(pendingResponse.data || []);
      } catch (pendingErr) {
        console.error("Error fetching pending users:", pendingErr);
        setPendingUsers([]);
        
        setDebugInfo(prev => ({
          ...prev,
          pendingUsersError: {
            message: pendingErr.message,
            status: pendingErr.response?.status,
            data: pendingErr.response?.data
          }
        }));
        
        // If this is an authorization error, redirect to login
        if (pendingErr.response?.status === 401 || pendingErr.response?.status === 403) {
          throw pendingErr; // Propagate auth errors to the main catch block
        }
      }

      try {
        // Get verified users
        console.log("Fetching verified users...");
        const verifiedResponse = await axios.get('/api/admin/verified-users');
        console.log("Verified users response:", verifiedResponse.data);
        setVerifiedUsers(verifiedResponse.data || []);
      } catch (verifiedErr) {
        console.error("Error fetching verified users:", verifiedErr);
        setVerifiedUsers([]);
        
        setDebugInfo(prev => ({
          ...prev,
          verifiedUsersError: {
            message: verifiedErr.message,
            status: verifiedErr.response?.status,
            data: verifiedErr.response?.data
          }
        }));
        
        // If this is an authorization error, redirect to login
        if (verifiedErr.response?.status === 401 || verifiedErr.response?.status === 403) {
          throw verifiedErr; // Propagate auth errors to the main catch block
        }
      }
      
      setError('');
      return true;
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setDebugInfo({
        error: err.toString(),
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url
      });
      
      if (err.response?.status === 429) {
        setError('Rate limit exceeded. Please wait a moment and try again.');
      } else if (err.response?.status === 404) {
        setError('API endpoint not found. Check server logs for details.');
      } else {
        setError(`Failed to load dashboard data: ${err.response?.data?.error || err.message}`);
      }
      
      throw err; // Re-throw for the calling function to handle
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId) => {
    setActionLoading(true);
    try {
      console.log(`Approving user with ID: ${userId}`);
      
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('No admin token found');
      }
      
      // Ensure the authorization header is set
      axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
      
      const response = await axios.post(`/api/admin/approve-user/${userId}`);
      console.log("Approval response:", response.data);
      
      // Refresh data after approval
      await fetchDashboardData();
      
      // Show success message
      setError('');
    } catch (err) {
      console.error('Error approving user:', err);
      
      setDebugInfo(prev => ({
        ...prev,
        approveUserError: {
          userId,
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
          url: err.config?.url
        }
      }));
      
      if (err.response?.status === 404) {
        setError(`Failed to approve user: User not found or API endpoint not available.`);
      } else {
      setError(`Failed to approve user: ${err.response?.data?.error || err.message}`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectUser = async (userId) => {
    setActionLoading(true);
    try {
      console.log(`Rejecting user with ID: ${userId}`);
      
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('No admin token found');
      }
      
      // Ensure the authorization header is set
      axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
      
      const response = await axios.post(`/api/admin/reject-user/${userId}`);
      console.log("Rejection response:", response.data);
      
      // Refresh data after rejection
      await fetchDashboardData();
      
      // Show success message
      setError('');
    } catch (err) {
      console.error('Error rejecting user:', err);
      
      setDebugInfo(prev => ({
        ...prev,
        rejectUserError: {
          userId,
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
          url: err.config?.url
        }
      }));
      
      if (err.response?.status === 404) {
        setError(`Failed to reject user: User not found or API endpoint not available.`);
      } else {
      setError(`Failed to reject user: ${err.response?.data?.error || err.message}`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    // Navigate to homepage instead of login
    navigate('/');
  };

  const handleViewUserDetails = (user) => {
    setSelectedUser(user);
    setUserDetailsOpen(true);
  };

  const handleCloseUserDetails = () => {
    setUserDetailsOpen(false);
    setSelectedUser(null);
  };

  // Safety check for stats
  const safeStats = stats || {
    users: { total: 0, verified: 0, pending: 0 },
    rooms: { total: 0 },
    marketplace: { total_items: 0 },
    recent_activities: { bookings: [], items: [] }
  };

  // Sidebar drawer content
  const drawerContent = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
          Admin Panel
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem 
          button 
          onClick={() => setActiveView('dashboard')}
          selected={activeView === 'dashboard'}
        >
          <ListItemIcon>
            <DashboardIcon color={activeView === 'dashboard' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem 
          button 
          onClick={() => setActiveView('pending')}
          selected={activeView === 'pending'}
        >
          <ListItemIcon>
            <PendingActionsIcon color={activeView === 'pending' ? 'warning' : 'inherit'} />
          </ListItemIcon>
          <ListItemText 
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Pending Requests
                {pendingUsers.length > 0 && (
                  <Box 
                    sx={{ 
                      ml: 1, 
                      bgcolor: '#ed6c02', 
                      color: 'white', 
                      borderRadius: '50%', 
                      width: 24, 
                      height: 24, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '0.75rem' 
                    }}
                  >
                    {pendingUsers.length}
                  </Box>
                )}
              </Box>
            } 
          />
        </ListItem>
        <ListItem 
          button 
          onClick={() => setActiveView('verified')}
          selected={activeView === 'verified'}
        >
          <ListItemIcon>
            <DoneAllIcon color={activeView === 'verified' ? 'success' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary="Verified Users" />
        </ListItem>
      </List>
      <Divider />
      <List>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <ExitToAppIcon color="error" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
        <ListItem button onClick={() => navigate('/')}>
          <ListItemIcon>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary="Go to Homepage" />
        </ListItem>
      </List>
    </div>
  );

  // User details dialog component
  const UserDetailsDialog = () => {
    if (!selectedUser) return null;

    // Format ID card photo URL properly
    const formatImageUrl = (url) => {
      if (!url) return null;
      if (url.startsWith('http')) return url;
      // If it's a relative URL, prepend the API URL (default to empty if not set)
      return `${process.env.REACT_APP_API_URL || ''}${url.startsWith('/') ? url : `/${url}`}`;
    };

    return (
      <Drawer
        anchor="right"
        open={userDetailsOpen}
        onClose={handleCloseUserDetails}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: '500px' },
            padding: 3,
            boxSizing: 'border-box'
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">User Details</Typography>
            <IconButton onClick={handleCloseUserDetails}>
              <MenuIcon />
            </IconButton>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>Personal Information</Typography>
            <Typography><strong>Name:</strong> {selectedUser.name}</Typography>
            <Typography><strong>Email:</strong> {selectedUser.email}</Typography>
            <Typography><strong>Username:</strong> {selectedUser.username || 'N/A'}</Typography>
            <Typography><strong>Student ID:</strong> {selectedUser.student_id}</Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>Academic Information</Typography>
            <Typography><strong>Department:</strong> {selectedUser.department}</Typography>
            <Typography><strong>Semester:</strong> {selectedUser.semester}</Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>Verification Status</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box 
                sx={{ 
                  bgcolor: selectedUser.verification_status === 'approved' ? 'success.main' : 
                          selectedUser.verification_status === 'pending' ? 'warning.main' : 'error.main',
                  color: 'white',
                  px: 2,
                  py: 0.5,
                  borderRadius: 1,
                  display: 'inline-block'
                }}
              >
                {selectedUser.verification_status === 'approved' ? 'Approved' : 
                 selectedUser.verification_status === 'pending' ? 'Pending' : 'Rejected'}
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>ID Card Photo</Typography>
            {selectedUser.id_card_photo ? (
              <Box sx={{ mt: 1, mb: 3, textAlign: 'center' }}>
                <img 
                  src={formatImageUrl(selectedUser.id_card_photo)} 
                  alt="ID Card" 
                  style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }} 
                />
              </Box>
            ) : (
              <Typography color="text.secondary">No ID card photo available</Typography>
            )}
          </Box>
          
          {selectedUser.verification_status === 'pending' && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button 
                variant="contained" 
                color="success" 
                onClick={() => {
                  handleApproveUser(selectedUser._id);
                  handleCloseUserDetails();
                }}
                disabled={actionLoading}
              >
                Approve User
              </Button>
              <Button 
                variant="contained" 
                color="error" 
                onClick={() => {
                  handleRejectUser(selectedUser._id);
                  handleCloseUserDetails();
                }}
                disabled={actionLoading}
              >
                Reject User
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>
    );
  };

  // Render different content based on active view
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      );
    }

    switch (activeView) {
      case 'dashboard':
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>Dashboard Overview</Typography>
            <Grid container spacing={3}>
              {/* Summary cards */}
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ backgroundColor: '#e3f2fd', borderRadius: '12px' }}>
                  <CardContent>
                    <Typography variant="h6" color="#1565c0">Total Users</Typography>
                    <Typography variant="h3" sx={{ my: 1, fontWeight: 600 }}>{safeStats.users.total}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <GroupIcon color="primary" />
                      <Typography variant="body2" sx={{ ml: 1 }}>Registered accounts</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ backgroundColor: '#fff8e1', borderRadius: '12px' }}>
                  <CardContent>
                    <Typography variant="h6" color="#ed6c02">Pending Verification</Typography>
                    <Typography variant="h3" sx={{ my: 1, fontWeight: 600 }}>{safeStats.users.pending}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PendingActionsIcon color="warning" />
                      <Typography variant="body2" sx={{ ml: 1 }}>Awaiting approval</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ backgroundColor: '#f1f8e9', borderRadius: '12px' }}>
                  <CardContent>
                    <Typography variant="h6" color="#2e7d32">Active Rooms</Typography>
                    <Typography variant="h3" sx={{ my: 1, fontWeight: 600 }}>{safeStats.rooms.total}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <MeetingRoomIcon color="success" />
                      <Typography variant="body2" sx={{ ml: 1 }}>Available rooms</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ backgroundColor: '#ffebee', borderRadius: '12px' }}>
                  <CardContent>
                    <Typography variant="h6" color="#c62828">Marketplace Items</Typography>
                    <Typography variant="h3" sx={{ my: 1, fontWeight: 600 }}>{safeStats.marketplace.total_items}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <StoreIcon color="error" />
                      <Typography variant="body2" sx={{ ml: 1 }}>Listed items</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Recent activities section */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, borderRadius: '12px' }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Recent Activities</Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" sx={{ mb: 1 }}>Latest Bookings</Typography>
                      {safeStats.recent_activities.bookings.length > 0 ? (
                        <List>
                          {safeStats.recent_activities.bookings.map((booking) => (
                            <ListItem key={booking._id} divider>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: '#1976d2' }}>
                                  <MeetingRoomIcon />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={`Room Booking: ${booking.purpose}`}
                                secondary={`Date: ${new Date(booking.date).toLocaleDateString()} | Time: ${booking.start_time}-${booking.end_time}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No recent bookings</Typography>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" sx={{ mb: 1 }}>Latest Marketplace Items</Typography>
                      {safeStats.recent_activities.items.length > 0 ? (
                        <List>
                          {safeStats.recent_activities.items.map((item) => (
                            <ListItem key={item._id} divider>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: '#c62828' }}>
                                  <StoreIcon />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={item.title}
                                secondary={`Price: $${item.price} | Category: ${item.category}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No recent marketplace items</Typography>
                      )}
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        );

      case 'pending':
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>Pending Verification Requests</Typography>
            <Paper sx={{ p: 3, borderRadius: '12px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Pending Requests ({pendingUsers.length})
                </Typography>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={fetchDashboardData}
                  disabled={actionLoading}
                  startIcon={actionLoading ? <CircularProgress size={20} /> : null}
                >
                  Refresh
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {pendingUsers.length > 0 ? (
                <List>
                  {pendingUsers.map((user) => (
                    <ListItem 
                      key={user._id} 
                      divider 
                      secondaryAction={
                        <Box>
                          <Button 
                            variant="outlined" 
                            color="primary" 
                            size="small" 
                            onClick={() => handleViewUserDetails(user)}
                            sx={{ mr: 1 }}
                          >
                            View Details
                          </Button>
                          <Button 
                            variant="contained" 
                            color="success" 
                            size="small" 
                            onClick={() => handleApproveUser(user._id)}
                            sx={{ mr: 1 }}
                            disabled={actionLoading}
                          >
                            {actionLoading ? <CircularProgress size={20} color="inherit" /> : 'Approve'}
                          </Button>
                          <Button 
                            variant="contained" 
                            color="error" 
                            size="small" 
                            onClick={() => handleRejectUser(user._id)}
                            disabled={actionLoading}
                          >
                            {actionLoading ? <CircularProgress size={20} color="inherit" /> : 'Reject'}
                          </Button>
                        </Box>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#ed6c02' }}>
                          <PendingActionsIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.name}
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              Email: {user.email} | Student ID: {user.student_id}
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2">
                              Department: {user.department} | Semester: {user.semester}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" align="center" sx={{ py: 3 }}>
                  No pending verification requests
                </Typography>
              )}
            </Paper>
          </Box>
        );

      case 'verified':
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>Verified Users</Typography>
            <Paper sx={{ p: 3, borderRadius: '12px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Verified Users ({verifiedUsers.length})
                </Typography>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={fetchDashboardData}
                  disabled={actionLoading}
                >
                  Refresh
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {verifiedUsers.length > 0 ? (
                <List>
                  {verifiedUsers.map((user) => (
                    <ListItem 
                      key={user._id} 
                      divider
                      secondaryAction={
                        <Box>
                          <Button 
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={() => handleViewUserDetails(user)}
                            sx={{ mr: 1 }}
                          >
                            View Details
                          </Button>
                          <Button 
                            variant="contained"
                            color="info"
                            size="small"
                            onClick={() => handleEditUser(user)}
                            sx={{ mr: 1 }}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() => handleDeleteUser(user)}
                          >
                            Delete
                          </Button>
                        </Box>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#2e7d32' }}>
                          <DoneAllIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.name}
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              Email: {user.email} | Student ID: {user.student_id}
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2">
                              Department: {user.department} | Semester: {user.semester}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" align="center" sx={{ py: 3 }}>
                  No verified users yet
                </Typography>
              )}
            </Paper>
          </Box>
        );

      default:
        return <Typography>Select an option from the sidebar</Typography>;
    }
  };

  return (
    <>
      {/* Delete Confirmation Dialog */}
      {deleteConfirmOpen && (
        <Dialog open={deleteConfirmOpen} onClose={handleDeleteUserClose}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete user <b>{userToDelete?.name}</b>?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteUserClose} color="primary">Cancel</Button>
            <Button onClick={handleDeleteUserConfirm} color="error" disabled={actionLoading}>
              {actionLoading ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {/* Edit User Drawer/Modal */}
      {editUserOpen && (
        <Drawer anchor="right" open={editUserOpen} onClose={handleEditUserClose} sx={{'& .MuiDrawer-paper': { width: 400, p: 3 }}}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Edit User</Typography>
            <TextField
              label="Name"
              value={editUserData?.name || ''}
              onChange={e => setEditUserData({ ...editUserData, name: e.target.value })}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Email"
              value={editUserData?.email || ''}
              onChange={e => setEditUserData({ ...editUserData, email: e.target.value })}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Student ID"
              value={editUserData?.student_id || ''}
              onChange={e => setEditUserData({ ...editUserData, student_id: e.target.value })}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Department"
              value={editUserData?.department || ''}
              onChange={e => setEditUserData({ ...editUserData, department: e.target.value })}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Semester"
              value={editUserData?.semester || ''}
              onChange={e => setEditUserData({ ...editUserData, semester: e.target.value })}
              fullWidth
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button onClick={handleEditUserClose} color="primary" sx={{ mr: 2 }}>Cancel</Button>
              <Button onClick={handleEditUserSave} color="success" variant="contained" disabled={actionLoading}>
                {actionLoading ? <CircularProgress size={20} color="inherit" /> : 'Save'}
              </Button>
            </Box>
          </Box>
        </Drawer>
      )}
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            bgcolor: '#1a237e'
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              Admin Dashboard
            </Typography>
            <Button 
              color="inherit" 
              onClick={handleLogout}
              startIcon={<ExitToAppIcon />}
            >
              Logout
            </Button>
          </Toolbar>
        </AppBar>
      
      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawerContent}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>
      
      {/* Main content */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          bgcolor: '#f5f5f5', 
          minHeight: '100vh' 
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {renderContent()}
      </Box>
    </Box>
    </>

  );
};

export default AdminDashboard; 