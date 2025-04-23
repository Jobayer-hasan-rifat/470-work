import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Button, 
  Box, 
  TextField, 
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  Snackbar,
  Alert
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import axios from 'axios';
import '../AppBackgrounds.css';

const Marketplace = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    condition: '',
    priceRange: { min: '', max: '' }
  });
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    price: '',
    condition: '',
    category: '',
    images: []
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  const isLoggedIn = localStorage.getItem('token') !== null;
  
  const categories = ['Electronics', 'Books', 'Furniture', 'Clothing', 'Other'];
  const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

  useEffect(() => {
    fetchItems();
    document.body.classList.add('marketplace-page');
    
    // Set up polling to check for updates every 10 seconds
    const intervalId = setInterval(() => {
      fetchItems(false); // Pass false to avoid showing loading state
    }, 10000);
    
    return () => {
      document.body.classList.remove('marketplace-page');
      clearInterval(intervalId);
    };
  }, []);

  const fetchItems = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const response = await axios.get('http://localhost:5000/api/marketplace/items');
      const newItems = response.data;
      
      // Check if items have been deleted
      const currentItemIds = items.map(item => item._id);
      const newItemIds = newItems.map(item => item._id);
      
      // Find deleted items (items that were in the current list but not in the new list)
      const deletedItems = items.filter(item => !newItemIds.includes(item._id));
      
      if (deletedItems.length > 0 && items.length > 0) {
        setNotification({
          open: true,
          message: `${deletedItems.length} item(s) have been removed from the marketplace`,
          severity: 'info'
        });
      }
      
      setItems(newItems);
    } catch (err) {
      setError('Failed to load items. Please try again later.');
      console.error(err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handlePriceRangeChange = (type, value) => {
    setFilters({
      ...filters,
      priceRange: {
        ...filters.priceRange,
        [type]: value
      }
    });
  };

  const handleNewItemChange = (e) => {
    const { name, value } = e.target;
    setNewItem({
      ...newItem,
      [name]: value
    });
  };

  const handleAddItem = async () => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', newItem.title);
      formData.append('description', newItem.description);
      formData.append('price', newItem.price);
      formData.append('condition', newItem.condition);
      formData.append('category', newItem.category);
      if (newItem.images && newItem.images.length > 0) {
        Array.from(newItem.images).slice(0, 3).forEach((file, idx) => {
          formData.append('images', file);
        });
      }
      await axios.post(
        'http://localhost:5000/api/marketplace/items',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      // Refresh items
      fetchItems();
      // Close dialog and reset form
      setOpenAddDialog(false);
      setNewItem({
        title: '',
        description: '',
        price: '',
        condition: '',
        category: '',
        images: []
      });
    } catch (err) {
      console.error('Error adding item:', err);
    }
  };


  const filteredItems = items.filter(item => {
    // Search query filter
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filter
    const matchesCategory = !filters.category || item.category === filters.category;
    
    // Condition filter
    const matchesCondition = !filters.condition || item.condition === filters.condition;
    
    // Price range filter
    const { min, max } = filters.priceRange;
    const matchesMinPrice = !min || item.price >= parseFloat(min);
    const matchesMaxPrice = !max || item.price <= parseFloat(max);
    
    return matchesSearch && matchesCategory && matchesCondition && matchesMinPrice && matchesMaxPrice;
  });

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Marketplace
        </Typography>
        {isLoggedIn && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => setOpenAddDialog(true)}
          >
            Add Item
          </Button>
        )}
      </Box>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            placeholder="Search items..."
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <FormControl fullWidth>
            <InputLabel id="category-label">Category</InputLabel>
            <Select
              labelId="category-label"
              id="category"
              value={filters.category}
              label="Category"
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {categories.map(category => (
                <MenuItem key={category} value={category}>{category}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} md={2}>
          <FormControl fullWidth>
            <InputLabel id="condition-label">Condition</InputLabel>
            <Select
              labelId="condition-label"
              id="condition"
              value={filters.condition}
              label="Condition"
              onChange={(e) => handleFilterChange('condition', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {conditions.map(condition => (
                <MenuItem key={condition} value={condition}>{condition}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} md={2}>
          <TextField
            fullWidth
            label="Min Price"
            type="number"
            value={filters.priceRange.min}
            onChange={(e) => handlePriceRangeChange('min', e.target.value)}
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <TextField
            fullWidth
            label="Max Price"
            type="number"
            value={filters.priceRange.max}
            onChange={(e) => handlePriceRangeChange('max', e.target.value)}
          />
        </Grid>
      </Grid>
      
      {loading ? (
        <Typography>Loading items...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : filteredItems.length === 0 ? (
        <Typography>No items found matching your filters.</Typography>
      ) : (
        <Grid container spacing={3}>
          {filteredItems.map((item) => (
            <Grid item key={item._id} xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="140"
                  image={item.images?.[0] || "https://via.placeholder.com/300x200?text=No+Image"}
                  alt={item.title}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="div">
                    {item.title}
                  </Typography>
                  <Typography variant="h6" color="primary" gutterBottom>
                    ${item.price}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Chip label={item.category} size="small" />
                    <Chip label={item.condition} size="small" variant="outlined" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {item.description.length > 100 
                      ? `${item.description.substring(0, 100)}...` 
                      : item.description}
                  </Typography>
                  <Button size="small" variant="outlined">View Details</Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Add Item Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add New Item
          <IconButton
            aria-label="close"
            onClick={() => setOpenAddDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Title"
                name="title"
                value={newItem.title}
                onChange={handleNewItemChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Description"
                name="description"
                multiline
                rows={4}
                value={newItem.description}
                onChange={handleNewItemChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Price"
                name="price"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                value={newItem.price}
                onChange={handleNewItemChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Condition</InputLabel>
                <Select
                  name="condition"
                  value={newItem.condition}
                  onChange={handleNewItemChange}
                  label="Condition"
                >
                  {conditions.map(condition => (
                    <MenuItem key={condition} value={condition}>{condition}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={newItem.category}
                  onChange={handleNewItemChange}
                  label="Category"
                >
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Upload up to 3 Photos</Typography>
              <input
                accept="image/*"
                type="file"
                multiple
                style={{ display: 'none' }}
                id="marketplace-image-upload"
                onChange={e => {
                  const files = Array.from(e.target.files).slice(0, 3);
                  setNewItem({
                    ...newItem,
                    images: files
                  });
                }}
              />
              <label htmlFor="marketplace-image-upload">
                <Button variant="outlined" component="span">
                  Upload Photos
                </Button>
              </label>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                {newItem.images && Array.from(newItem.images).map((file, idx) => (
                  <Box key={idx} sx={{ position: 'relative' }}>
                    <img
                      src={typeof file === 'string' ? file : URL.createObjectURL(file)}
                      alt={`Preview ${idx + 1}`}
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid #ccc' }}
                    />
                    <IconButton
                      size="small"
                      sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'white' }}
                      onClick={() => {
                        const updated = Array.from(newItem.images);
                        updated.splice(idx, 1);
                        setNewItem({ ...newItem, images: updated });
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddItem}>Add Item</Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNotification(prev => ({ ...prev, open: false }))} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Marketplace; 