import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
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
  TextField,
  Snackbar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import GroupIcon from '@mui/icons-material/Group';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import StoreIcon from '@mui/icons-material/Store';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuIcon from '@mui/icons-material/Menu';
import axios from 'axios';
import '../AppBackgrounds.css';
import MarketplaceItemDetailsDrawer from '../components/MarketplaceItemDetailsDrawer';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';

// Drawer width for the sidebar
const drawerWidth = 240;

const AdminDashboard = () => {
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editUserData, setEditUserData] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Handler to close edit drawer/modal
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
  const handleDeleteVerifiedUser = (userId) => {
    // Find the user to delete
    const userToDelete = verifiedUsers.find(user => user._id === userId);
    if (userToDelete) {
      setUserToDelete(userToDelete);
    setDeleteConfirmOpen(true);
    }
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
      const response = await axios.delete(`/api/admin/delete-user/${userToDelete._id}`);
      
      // Set success message with snackbar
      setSnackbar({
        open: true,
        message: response.data.message || 'User deleted successfully',
        severity: 'success'
      });
      
      // Immediately update the verified users list
      setVerifiedUsers(prevUsers => prevUsers.filter(user => user._id !== userToDelete._id));
      
      // Update user counts in statistics
      setStats(prevStats => ({
        ...prevStats,
        users: {
          ...prevStats.users,
          total: prevStats.users.total - 1,
          verified: prevStats.users.verified - 1
        }
      }));
      
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    } catch (err) {
      // Set error message with snackbar
      setSnackbar({
        open: true,
        message: `Failed to delete user: ${err.response?.data?.error || err.message}`,
        severity: 'error'
      });
      // Still refresh data to ensure UI is in sync with backend
      await fetchDashboardData(false);
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
      const adminInfo = localStorage.getItem('adminInfo');
      
      if (!adminToken || !adminInfo) {
        throw new Error('Admin authentication required');
      }
      
      // Set the authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
      
      await axios.put(`/api/admin/edit-user/${editUserData._id}`, editUserData);
      
      // Set success message with snackbar
      setSnackbar({
        open: true,
        message: 'User updated successfully',
        severity: 'success'
      });
      
      setEditUserOpen(false);
      setEditUserData(null);
      // Immediately update the verified users list
      setVerifiedUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === editUserData._id ? { ...user, ...editUserData } : user
        )
      );
      // Refresh all data to ensure consistency
      await fetchDashboardData();
    } catch (err) {
      // Set error message with snackbar
      setSnackbar({
        open: true,
        message: `Failed to edit user: ${err.response?.data?.error || err.message}`,
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');
  const [marketplaceItems, setMarketplaceItems] = useState([]);

  // Data fetchers (stub implementations)
  const fetchMarketplaceData = async () => {
    try {
      setLoading(true);
      const adminToken = localStorage.getItem('adminToken');
      const adminInfoStr = localStorage.getItem('adminInfo');
      
      if (!adminToken || !adminInfoStr) {
        throw new Error('Admin authentication required');
      }
      
      // Set the authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
      
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await axios.get(`/api/marketplace/items?_=${timestamp}`);
      setMarketplaceItems(response.data || []);
      
      // Update stats with the new marketplace data
      setStats(prev => ({
        ...prev,
        marketplace: {
          ...prev.marketplace,
          total_items: response.data?.length || 0
        },
        recent_activities: {
          ...prev.recent_activities,
          items: response.data?.slice(0, 5) || []
        }
      }));
    } catch (err) {
      console.error('Error fetching marketplace items:', err);
      setSnackbar({
        open: true,
        message: 'Failed to fetch marketplace items.',
        severity: 'error'
      });
      setMarketplaceItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Handlers for Marketplace
  const [marketplaceItemDetails, setMarketplaceItemDetails] = useState({ open: false, item: null });
  const handleViewMarketplaceItem = (item) => {
    setMarketplaceItemDetails({ open: true, item });
  };
  const handleCloseMarketplaceItemDetails = () => {
    setMarketplaceItemDetails({ open: false, item: null });
  };

  // Handlers for editing and deleting marketplace items

  // Marketplace Edit and Delete handlers
  const [editMarketplaceOpen, setEditMarketplaceOpen] = useState(false);
  const [editMarketplaceData, setEditMarketplaceData] = useState(null);
  const [deleteMarketplaceOpen, setDeleteMarketplaceOpen] = useState(false);
  const [marketplaceToDelete, setMarketplaceToDelete] = useState(null);
  const [marketplaceActionLoading, setMarketplaceActionLoading] = useState(''); // item id for which action is loading

  const handleEditMarketplaceItem = (item) => {
    setEditMarketplaceData(item);
    setEditMarketplaceOpen(true);
  };
  const handleEditMarketplaceClose = () => {
    setEditMarketplaceOpen(false);
    setEditMarketplaceData(null);
  };
  const handleEditMarketplaceSave = async () => {
    if (!editMarketplaceData) return;
    setMarketplaceActionLoading(editMarketplaceData._id);
    try {
      const adminToken = localStorage.getItem('adminToken');
      const adminInfoStr = localStorage.getItem('adminInfo');
      
      if (!adminToken || !adminInfoStr) {
        throw new Error('Admin authentication required');
      }
      
      // Set the authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
      
      await axios.put(`/api/marketplace/items/${editMarketplaceData._id}`, editMarketplaceData);
      setEditMarketplaceOpen(false);
      setEditMarketplaceData(null);
      
      // Immediately update the UI
      setMarketplaceItems(prevItems =>
        prevItems.map(item =>
          item._id === editMarketplaceData._id ? { ...item, ...editMarketplaceData } : item
        )
      );
      
      // Update recent activities if needed
      setStats(prev => ({
        ...prev,
        recent_activities: {
          ...prev.recent_activities,
          items: prev.recent_activities.items.map(item =>
            item._id === editMarketplaceData._id ? { ...item, ...editMarketplaceData } : item
          )
        }
      }));
      
      // Refresh all data to ensure consistency
      await fetchMarketplaceData();
      await fetchDashboardData();
    } catch (err) {
      console.error('Error editing marketplace item:', err);
      setSnackbar({
        open: true,
        message: `Failed to edit item: ${err.response?.data?.error || err.message}`,
        severity: 'error'
      });
    } finally {
      setMarketplaceActionLoading('');
    }
  };
  const handleDeleteMarketplaceItem = (item) => {
    setMarketplaceToDelete(item);
    setDeleteMarketplaceOpen(true);
  };
  const handleDeleteMarketplaceClose = () => {
    setDeleteMarketplaceOpen(false);
    setMarketplaceToDelete(null);
  };
  const handleDeleteMarketplaceConfirm = async () => {
    if (!marketplaceToDelete) return;
    setMarketplaceActionLoading(marketplaceToDelete._id);
    try {
      const adminToken = localStorage.getItem('adminToken');
      const adminInfoStr = localStorage.getItem('adminInfo');
      
      if (!adminToken || !adminInfoStr) {
        throw new Error('Admin authentication required');
      }
      
      // Set the authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
      
      await axios.delete(`/api/marketplace/items/${marketplaceToDelete._id}`);
      setDeleteMarketplaceOpen(false);
      setMarketplaceToDelete(null);
      
      // Immediately update the UI
      setMarketplaceItems(prevItems => prevItems.filter(item => item._id !== marketplaceToDelete._id));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        marketplace: {
          ...prev.marketplace,
          total_items: (prev.marketplace?.total_items || 0) - 1
        },
        recent_activities: {
          ...prev.recent_activities,
          items: prev.recent_activities.items.filter(item => item._id !== marketplaceToDelete._id)
        }
      }));
      
      // Refresh all data to ensure consistency
      await fetchMarketplaceData();
      await fetchDashboardData();
    } catch (err) {
      console.error('Error deleting marketplace item:', err);
      setSnackbar({
        open: true,
        message: `Failed to delete item: ${err.response?.data?.error || err.message}`,
        severity: 'error'
      });
    } finally {
      setMarketplaceActionLoading('');
    }
  };



  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [verifiedUsers, setVerifiedUsers] = useState([]);
  
  const [tokenVerified, setTokenVerified] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);


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
      navigate('/admin/login');
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
        
        // Set up polling to check for updates every 10 seconds
        const intervalId = setInterval(() => {
          fetchDashboardData(false); // Pass false to avoid showing loading state
        }, 10000);
        
        // Store the interval ID in a ref so we can clear it on unmount
        return () => clearInterval(intervalId);
      })
      .catch(err => {
        console.error("Dashboard data fetch failed, likely an auth issue:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminInfo');
          navigate('/admin/login');
        } else if (err.response?.status === 429) {
          // Rate limit error
          setSnackbar({
            open: true,
            message: "Rate limit exceeded. Please wait a moment and try again.",
            severity: 'error'
          });
          return false;
        }
      });
      
    // Clean up function to clear any intervals when component unmounts
    return () => {
      // This will be replaced by the actual cleanup function when the promise resolves
      console.log("AdminDashboard unmounting...");
    };
  }, [navigate, tokenVerified]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const fetchDashboardData = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      console.log("Fetching admin dashboard data...");
      
      // Create default empty stats in case of failure
      const defaultStats = {
        users: { total: 0, verified: 0, pending: 0 },
        marketplace: { total_items: 0 },
        recent_activities: { items: [] }
      };
      
      try {
        // Add timestamp to requests to prevent caching
        const timestamp = new Date().getTime();
        
        // Get statistics with cache busting
        console.log("Fetching statistics...");
        const statsResponse = await axios.get(`/api/admin/statistics?_=${timestamp}`);
        console.log("Statistics response:", statsResponse.data);
        
        // Get marketplace items count with cache busting
        const marketplaceResponse = await axios.get(`/api/marketplace/items?_=${timestamp}`);
        const marketplaceItemsCount = marketplaceResponse.data?.length || 0;
        
        // Combine stats with real-time marketplace count
        const combinedStats = {
          ...statsResponse.data,
          marketplace: {
            total_items: marketplaceItemsCount
          },
          recent_activities: {
            items: marketplaceResponse.data?.slice(0, 5) || [] // Show only 5 most recent items
          }
        };
        
        setStats(combinedStats);
        setMarketplaceItems(marketplaceResponse.data || []);
      } catch (statsErr) {
        console.error("Error fetching statistics:", statsErr);
        setStats(defaultStats);
        setSnackbar({
          open: true,
          message: `Failed to load dashboard data: ${statsErr.response?.data?.error || statsErr.message}`,
          severity: 'error'
        });
      }

      try {
        // Add timestamp to prevent caching
        const pendingTimestamp = new Date().getTime();
        
        // Get pending users
        console.log("Fetching pending users...");
        const pendingResponse = await axios.get(`/api/admin/pending-users?_=${pendingTimestamp}`);
        console.log("Pending users response:", pendingResponse.data);
        
        // Check if there are new pending users that weren't in our list before
        const newPendingUsers = pendingResponse.data || [];
        const currentPendingIds = pendingUsers.map(user => user._id);
        const hasNewPendingUsers = newPendingUsers.some(user => !currentPendingIds.includes(user._id));
        
        if (hasNewPendingUsers && pendingUsers.length > 0) {
          setSnackbar({
            open: true,
            message: 'New registration requests received!',
            severity: 'info'
          });
        }
        
        setPendingUsers(newPendingUsers);
        
        // Update stats with real pending count
        setStats(prev => ({
          ...prev,
          users: {
            ...prev.users,
            pending: newPendingUsers.length || 0
          }
        }));
      } catch (pendingErr) {
        console.error("Error fetching pending users:", pendingErr);
        setPendingUsers([]);
        setSnackbar({
          open: true,
          message: `Failed to load pending users: ${pendingErr.response?.data?.error || pendingErr.message}`,
          severity: 'error'
        });
      }

      try {
        // Add timestamp to prevent caching
        const verifiedTimestamp = new Date().getTime();
        
        // Get verified users
        console.log("Fetching verified users...");
        const verifiedResponse = await axios.get(`/api/admin/verified-users?_=${verifiedTimestamp}`);
        console.log("Verified users response:", verifiedResponse.data);
        
        // Check if there are changes in the verified users list
        const newVerifiedUsers = verifiedResponse.data || [];
        const currentVerifiedIds = verifiedUsers.map(user => user._id);
        
        // Find users that are in our current list but not in the new list (deleted users)
        const deletedUsers = verifiedUsers.filter(user => 
          !newVerifiedUsers.some(newUser => newUser._id === user._id)
        );
        
        if (deletedUsers.length > 0 && verifiedUsers.length > 0) {
          // This means some users were deleted from the database but still showing in our UI
          // We'll update the UI to match the database
          console.log('Detected deleted users that were still in UI:', deletedUsers);
        }
        
        setVerifiedUsers(newVerifiedUsers);
        
        // Update stats with real verified count
        setStats(prev => ({
          ...prev,
          users: {
            ...prev.users,
            verified: newVerifiedUsers.length || 0,
            total: (newVerifiedUsers.length || 0) + (prev.users.pending || 0)
          }
        }));
      } catch (verifiedErr) {
        console.error("Error fetching verified users:", verifiedErr);
        setVerifiedUsers([]);
        setSnackbar({
          open: true,
          message: `Failed to load verified users: ${verifiedErr.response?.data?.error || verifiedErr.message}`,
          severity: 'error'
        });
      }
      
      return true;
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setSnackbar({
        open: true,
        message: `Failed to load dashboard data: ${err.response?.data?.error || err.message}`,
        severity: 'error'
      });
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleApproveUser = async (userId) => {
    setActionLoading(userId);
    try {
      const adminToken = localStorage.getItem('adminToken');
      const adminInfoStr = localStorage.getItem('adminInfo');
      
      if (!adminToken || !adminInfoStr) {
        throw new Error('Admin authentication required');
      }
      
      // Set the authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
      
      await axios.put(`/api/admin/approve-user/${userId}`);
      
      // Update UI immediately
      const approvedUser = pendingUsers.find(user => user._id === userId);
      
      // Remove from pending users list
      setPendingUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
      
      // Add to verified users list if we have the user data
      if (approvedUser) {
        const updatedUser = {
          ...approvedUser,
          verification_status: 'approved',
          approved_at: new Date().toISOString()
        };
        
        // Make sure we don't add duplicates
        setVerifiedUsers(prevUsers => {
          // Check if user already exists in verified list
          const userExists = prevUsers.some(user => user._id === userId);
          if (userExists) {
            // Replace the existing user with updated data
            return prevUsers.map(user => 
              user._id === userId ? updatedUser : user
            );
          } else {
            // Add the new user to the top of the list
            return [updatedUser, ...prevUsers];
          }
        });
      }
      
      // Update user counts in statistics
      setStats(prevStats => ({
        ...prevStats,
        users: {
          ...prevStats.users,
          total: prevStats.users.total,
          verified: prevStats.users.verified + 1,
          pending: prevStats.users.pending - 1
        }
      }));
      
      setSnackbar({
        open: true,
        message: 'User approved successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error approving user:', err);
      setSnackbar({
        open: true, 
        message: `Failed to approve user: ${err.response?.data?.error || err.message}`,
        severity: 'error'
      });
    } finally {
      setActionLoading('');
      // Refresh data in the background to ensure consistency
      fetchDashboardData(false);
    }
  };

  const handleRejectUser = async (userId) => {
    setActionLoading(userId);
    try {
      const adminToken = localStorage.getItem('adminToken');
      const adminInfoStr = localStorage.getItem('adminInfo');
      
      if (!adminToken || !adminInfoStr) {
        throw new Error('Admin authentication required');
      }
      
      // Set the authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
      
      await axios.put(`/api/admin/reject-user/${userId}`);
      
      // Update UI immediately
      setPendingUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
      
      // Update user counts in statistics
      setStats(prevStats => ({
        ...prevStats,
        users: {
          ...prevStats.users,
          total: prevStats.users.total - 1,
          pending: prevStats.users.pending - 1
        }
      }));
      
      setSnackbar({
        open: true,
        message: 'User rejected successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error rejecting user:', err);
      setSnackbar({
        open: true, 
        message: `Failed to reject user: ${err.response?.data?.error || err.message}`,
        severity: 'error'
      });
    } finally {
      setActionLoading('');
      // Refresh data in the background to ensure consistency
      fetchDashboardData(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    // Navigate to homepage instead of login
    navigate('/');
  };

  // Handler for navigating to student pages while preserving admin session
  const handleStudentPageNavigation = (path) => {
    try {
      // Set admin visiting flag
      localStorage.setItem('adminVisitingStudentPage', 'true');
      
      // Get admin credentials
      const adminToken = localStorage.getItem('adminToken');
      const adminInfo = localStorage.getItem('adminInfo');
      
      if (!adminToken || !adminInfo) {
        throw new Error('Admin credentials missing');
      }
      
      // Save admin credentials in special keys
      localStorage.setItem('lastAdminToken', adminToken);
      localStorage.setItem('lastAdminInfo', adminInfo);
      
      // IMPORTANT: Create a temporary user token for SharedRoute to recognize
      // This ensures we don't get redirected to login
      localStorage.setItem('token', adminToken);
      
      // Set axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
      
      // Correct path if needed
      const correctedPath = path === '/ride-sharing' ? '/ride-booking' : path;
      
      // Navigate to page
      console.log(`Admin navigating to: ${correctedPath}`);
      navigate(correctedPath);
    } catch (error) {
      console.error('Error during navigation:', error);
      // Fallback to login if there's a problem
      navigate('/admin-login');
    }
  };

  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

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
    marketplace: { total_items: 0 },
    recent_activities: { items: [] }
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
        <ListItem 
          button 
          onClick={() => setActiveView('marketplace')}
          selected={activeView === 'marketplace'}
        >
          <ListItemIcon>
            <StoreIcon color={activeView === 'marketplace' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary="Manage Marketplace" />
        </ListItem>
        <ListItem 
          button 
          onClick={() => setActiveView('lostfound')}
          selected={activeView === 'lostfound'}
        >
          <ListItemIcon>
            <DoneAllIcon color={activeView === 'lostfound' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary="Manage Lost & Found (Demo)" />
        </ListItem>
        <ListItem 
          button 
          onClick={() => setActiveView('rideshare')}
          selected={activeView === 'rideshare'}
        >
          <ListItemIcon>
            <MeetingRoomIcon color={activeView === 'rideshare' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary="Manage Ride Share (Demo)" />
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
      </List>
      <Divider />
      <List>
        <ListItem button onClick={() => handleStudentPageNavigation('/marketplace')}>
          <ListItemIcon>
            <StoreIcon />
          </ListItemIcon>
          <ListItemText primary="Visit Marketplace" />
        </ListItem>
        <ListItem button onClick={() => handleStudentPageNavigation('/lost-found')}>
          <ListItemIcon>
            <HelpOutlineIcon />
          </ListItemIcon>
          <ListItemText primary="Visit Lost & Found" />
        </ListItem>
        <ListItem button onClick={() => handleStudentPageNavigation('/ride-sharing')}>
          <ListItemIcon>
            <DirectionsBusIcon />
          </ListItemIcon>
          <ListItemText primary="Visit Ride Share" />
        </ListItem>
      </List>
    </div>
  );

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
          <Box sx={{ mt: 2 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>Dashboard Overview</Typography>
            
            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ backgroundColor: '#e3f2fd', borderRadius: '12px', height: '100%' }}>
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
              
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ backgroundColor: '#fff8e1', borderRadius: '12px', height: '100%' }}>
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
              
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ backgroundColor: '#ffebee', borderRadius: '12px', height: '100%' }}>
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
            </Grid>

            {/* Recent activities section */}
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 3, borderRadius: '12px' }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Recent Activities</Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Latest Marketplace Items</Typography>
                  {safeStats.recent_activities.items.length > 0 ? (
                    <List sx={{ width: '100%' }}>
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
                </Paper>
              </Grid>
            </Grid>
          </Box>
        );

      case 'pending':
        return (
          <Box sx={{ mt: 2, maxWidth: '100%' }}>
            <Typography variant="h5" sx={{ mb: 3 }}>Pending Verification</Typography>
            <Paper sx={{ p: 3, borderRadius: '12px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Pending Users ({pendingUsers.length})
                </Typography>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={fetchDashboardData}
                  disabled={actionLoading !== ''}
                  size="small"
                >
                  Refresh
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {pendingUsers.length > 0 ? (
                <List sx={{ width: '100%', p: 0 }}>
                  {pendingUsers.map((user) => (
                    <ListItem 
                      key={user._id} 
                      divider
                      sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }}
                      secondaryAction={
                        <Box sx={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: 1, 
                          width: { xs: '100%', md: 'auto' },
                          mt: { xs: 1, md: 0 }
                        }}>
                          <Button 
                            variant="outlined" 
                            color="primary" 
                            size="small" 
                            onClick={() => handleViewUserDetails(user)}
                          >
                            View
                          </Button>
                          <Button 
                            variant="contained" 
                            color="success" 
                            size="small" 
                            onClick={() => handleApproveUser(user._id)}
                            disabled={actionLoading === user._id}
                          >
                            {actionLoading === user._id ? <CircularProgress size={20} color="inherit" /> : 'Approve'}
                          </Button>
                          <Button 
                            variant="contained" 
                            color="error" 
                            size="small" 
                            onClick={() => handleRejectUser(user._id)}
                            disabled={actionLoading === user._id}
                          >
                            {actionLoading === user._id ? <CircularProgress size={20} color="inherit" /> : 'Reject'}
                          </Button>
                        </Box>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar src={user.profile_picture || ''}>
                          {user.name ? user.name.charAt(0) : 'U'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.name}
                        secondary={
                          <>
                            {user.email} • {user.student_id || 'No ID'} • {user.department || 'No Dept'}
                            <br />
                            Registered: {new Date(user.created_at).toLocaleDateString()}
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
          <Box sx={{ mt: 2, maxWidth: '100%' }}>
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
                  disabled={actionLoading !== ''}
                  size="small"
                >
                  Refresh
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {verifiedUsers.length > 0 ? (
                <List sx={{ width: '100%', p: 0 }}>
                  {verifiedUsers.map((user) => (
                    <ListItem 
                      key={user._id} 
                      divider
                      sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }}
                      secondaryAction={
                        <Box sx={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: 1, 
                          width: { xs: '100%', md: 'auto' },
                          mt: { xs: 1, md: 0 }
                        }}>
                          <Button 
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={() => handleViewUserDetails(user)}
                          >
                            View
                          </Button>
                          <Button 
                            variant="contained"
                            color="info"
                            size="small"
                            onClick={() => handleEditUser(user)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() => handleDeleteVerifiedUser(user._id)}
                            disabled={actionLoading === user._id}
                          >
                            {actionLoading === user._id ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
                          </Button>
                        </Box>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar src={user.profile_picture || ''}>
                          {user.name ? user.name.charAt(0) : 'U'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.name}
                        secondary={
                          <>
                            {user.email} • {user.student_id || 'No ID'} • {user.department || 'No Dept'}
                            <br />
                            Verified: {user.approved_at ? new Date(user.approved_at).toLocaleDateString() : 'N/A'}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" align="center" sx={{ py: 3 }}>
                  No verified users found
                </Typography>
              )}
            </Paper>
          </Box>
        );

      case 'marketplace':
        return (
          <Box sx={{ mt: 2, maxWidth: '100%' }}>
            <Typography variant="h5" sx={{ mb: 3 }}>Manage Marketplace</Typography>
            <Paper sx={{ p: 3, borderRadius: '12px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Marketplace Items ({marketplaceItems.length})
                </Typography>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={fetchMarketplaceData}
                  disabled={actionLoading !== ''}
                  size="small"
                >
                  Refresh
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {marketplaceItems.length > 0 ?
                <List sx={{ width: '100%', p: 0 }}>
                  {marketplaceItems.map((item) => (
                    <ListItem 
                      key={item._id} 
                      divider
                      sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }}
                      secondaryAction={
                        <Box sx={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: 1,
                          width: { xs: '100%', md: 'auto' },
                          mt: { xs: 1, md: 0 }
                        }}>
                          <Button 
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => handleViewMarketplaceItem(item)}
                          >
                            View
                          </Button>
                          <Button 
                            variant="contained"
                            color="info"
                            size="small"
                            onClick={() => handleEditMarketplaceItem(item)}
                            disabled={marketplaceActionLoading === item._id}
                          >
                            {marketplaceActionLoading === item._id ? <CircularProgress size={20} color="inherit" /> : 'Edit'}
                          </Button>
                          <Button 
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() => handleDeleteMarketplaceItem(item)}
                            disabled={marketplaceActionLoading === item._id}
                          >
                            {marketplaceActionLoading === item._id ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
                          </Button>
                        </Box>
                      }
                    >
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
              : (
                <Typography variant="body1" align="center" sx={{ py: 3 }}>
                  No marketplace items found
                </Typography>
              )}
            </Paper>
          </Box>
        );

      case 'lostfound':
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>Manage Lost & Found (Demo)</Typography>
            <Paper sx={{ p: 3, borderRadius: '12px' }}>
              <Typography variant="body1" align="center" sx={{ py: 3 }}>
                Lost & Found management functionality will be implemented in another module.
              </Typography>
            </Paper>
          </Box>
        );

      case 'rideshare':
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>Manage Ride Share (Demo)</Typography>
            <Paper sx={{ p: 3, borderRadius: '12px' }}>
              <Typography variant="body1" align="center" sx={{ py: 3 }}>
                Ride Share management functionality will be implemented in another module.
              </Typography>
            </Paper>
          </Box>
        );

      case 'users':
        return (
          <Box sx={{ mt: 2, maxWidth: '100%' }}>
            <Typography variant="h5" sx={{ mb: 3 }}>Manage Users</Typography>
            
            {/* Pending Verification Users Section */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: '12px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Pending Verification ({pendingUsers.length})</Typography>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={fetchDashboardData}
                  disabled={actionLoading !== ''}
                  size="small"
                >
                  Refresh
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {pendingUsers.length > 0 ? (
                <List sx={{ width: '100%', p: 0 }}>
                  {pendingUsers.map((user) => (
                    <ListItem 
                      key={user._id} 
                      divider
                      sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }}
                      secondaryAction={
                        <Box sx={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: 1, 
                          width: { xs: '100%', md: 'auto' },
                          mt: { xs: 1, md: 0 }
                        }}>
                          <Button 
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={() => handleViewUserDetails(user)}
                          >
                            View
                          </Button>
                          <Button 
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => handleApproveUser(user._id)}
                            disabled={actionLoading === user._id}
                          >
                            {actionLoading === user._id ? <CircularProgress size={20} /> : 'Approve'}
                          </Button>
                          <Button 
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() => handleRejectUser(user._id)}
                            disabled={actionLoading === user._id}
                          >
                            {actionLoading === user._id ? <CircularProgress size={20} /> : 'Reject'}
                          </Button>
                        </Box>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar src={user.profile_picture || ''}>
                          {user.name ? user.name.charAt(0) : 'U'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.name}
                        secondary={
                          <>
                            {user.email} • {user.student_id || 'No ID'} • {user.department || 'No Dept'}
                            <br />
                            Registered: {new Date(user.created_at).toLocaleDateString()}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No pending verification requests
                </Typography>
              )}
            </Paper>
            
            {/* Verified Users Section */}
            <Paper sx={{ p: 3, borderRadius: '12px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Verified Users ({verifiedUsers.length})</Typography>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={fetchDashboardData}
                  disabled={actionLoading !== ''}
                  size="small"
                >
                  Refresh
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {verifiedUsers.length > 0 ? (
                <List sx={{ width: '100%', p: 0 }}>
                  {verifiedUsers.map((user) => (
                    <ListItem 
                      key={user._id} 
                      divider
                      sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }}
                      secondaryAction={
                        <Box sx={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: 1, 
                          width: { xs: '100%', md: 'auto' },
                          mt: { xs: 1, md: 0 }
                        }}>
                          <Button 
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={() => handleViewUserDetails(user)}
                          >
                            View
                          </Button>
                          <Button 
                            variant="contained"
                            color="info"
                            size="small"
                            onClick={() => handleEditUser(user)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() => handleDeleteVerifiedUser(user._id)}
                            disabled={actionLoading === user._id}
                          >
                            {actionLoading === user._id ? <CircularProgress size={20} /> : 'Delete'}
                          </Button>
                        </Box>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar src={user.profile_picture || ''}>
                          {user.name ? user.name.charAt(0) : 'U'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.name}
                        secondary={
                          <>
                            {user.email} • {user.student_id || 'No ID'} • {user.department || 'No Dept'}
                            <br />
                            Verified: {user.approved_at ? new Date(user.approved_at).toLocaleDateString() : 'N/A'}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No verified users found
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
    <Box sx={{ display: 'flex', maxWidth: '100vw', overflow: 'hidden' }}>
      {/* Dialogs and Modals */}
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
      
      {/* Delete Marketplace Item Dialog */}
      {deleteMarketplaceOpen && (
        <Dialog open={deleteMarketplaceOpen} onClose={handleDeleteMarketplaceClose}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete item <b>{marketplaceToDelete?.title}</b>?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteMarketplaceClose} color="primary">Cancel</Button>
            <Button onClick={handleDeleteMarketplaceConfirm} color="error" disabled={marketplaceActionLoading === marketplaceToDelete?._id}>
              {marketplaceActionLoading === marketplaceToDelete?._id ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
      
      {/* Edit Marketplace Item Drawer */}
      {editMarketplaceOpen && editMarketplaceData && (
        <Drawer
          anchor="right"
          open={editMarketplaceOpen}
          onClose={handleEditMarketplaceClose}
          sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 400 } } }}
        >
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>Edit Item</Typography>
            <TextField
              label="Title"
              value={editMarketplaceData?.title || ''}
              onChange={e => setEditMarketplaceData({ ...editMarketplaceData, title: e.target.value })}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Description"
              value={editMarketplaceData?.description || ''}
              onChange={e => setEditMarketplaceData({ ...editMarketplaceData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Price"
              type="number"
              value={editMarketplaceData?.price || ''}
              onChange={e => setEditMarketplaceData({ ...editMarketplaceData, price: e.target.value })}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Category"
              value={editMarketplaceData?.category || ''}
              onChange={e => setEditMarketplaceData({ ...editMarketplaceData, category: e.target.value })}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Condition"
              value={editMarketplaceData?.condition || ''}
              onChange={e => setEditMarketplaceData({ ...editMarketplaceData, condition: e.target.value })}
              fullWidth
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button onClick={handleEditMarketplaceClose} color="primary" sx={{ mr: 2 }}>Cancel</Button>
              <Button onClick={handleEditMarketplaceSave} color="success" variant="contained" disabled={marketplaceActionLoading === editMarketplaceData?._id}>
                {marketplaceActionLoading === editMarketplaceData?._id ? <CircularProgress size={20} color="inherit" /> : 'Save'}
              </Button>
            </Box>
          </Box>
        </Drawer>
      )}
      
      {/* Edit User Drawer */}
      {editUserOpen && (
        <Drawer 
          anchor="right" 
          open={editUserOpen} 
          onClose={handleEditUserClose} 
          sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 400 }, p: 0 } }}
        >
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>Edit User</Typography>
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
              <Button 
                onClick={handleEditUserSave} 
                color="success" 
                variant="contained" 
                disabled={actionLoading}
              >
                {actionLoading ? <CircularProgress size={20} color="inherit" /> : 'Save'}
              </Button>
            </Box>
          </Box>
        </Drawer>
      )}
      
      {/* Layout */}
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          boxSizing: 'border-box',
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
          p: { xs: 2, sm: 3 }, 
          width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` },
          maxWidth: '100%',
          overflowX: 'hidden',
          bgcolor: '#f5f5f5', 
          minHeight: '100vh' 
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        {renderContent()}
      </Box>

      {/* Marketplace Item Details Drawer */}
      <MarketplaceItemDetailsDrawer
        open={marketplaceItemDetails.open}
        item={marketplaceItemDetails.item}
        onClose={handleCloseMarketplaceItemDetails}
      />

      {/* User Details Dialog */}
      <Dialog open={userDetailsOpen} onClose={handleCloseUserDetails} maxWidth="sm" fullWidth>
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Name:</strong> {selectedUser.name}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Email:</strong> {selectedUser.email}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Username:</strong> {selectedUser.username}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Department:</strong> {selectedUser.department}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Semester:</strong> {selectedUser.semester}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Status:</strong> {selectedUser.verification_status}
              </Typography>
              {selectedUser.id_card_photo && (
                <Box mt={2}>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>ID Card:</strong>
                  </Typography>
                  <img 
                    src={selectedUser.id_card_photo} 
                    alt="ID Card" 
                    style={{ maxWidth: '100%', height: 'auto' }} 
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUserDetails} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminDashboard;