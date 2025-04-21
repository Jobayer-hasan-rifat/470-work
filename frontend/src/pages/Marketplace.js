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
  Divider
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
  
  const isLoggedIn = localStorage.getItem('token') !== null;
  
  const categories = ['Electronics', 'Books', 'Furniture', 'Clothing', 'Other'];
  const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

  useEffect(() => {
    fetchItems();
    document.body.classList.add('marketplace-page');
    return () => {
      document.body.classList.remove('marketplace-page');
    };
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/marketplace/items');
      setItems(response.data);
    } catch (err) {
      setError('Failed to load items. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
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
      await axios.post(
        'http://localhost:5000/api/marketplace/items', 
        newItem, 
        {
          headers: {
            Authorization: `Bearer ${token}`
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
              <TextField
                fullWidth
                label="Image URL"
                name="image"
                placeholder="Enter image URL"
                onBlur={(e) => {
                  if (e.target.value) {
                    setNewItem({
                      ...newItem,
                      images: [...newItem.images, e.target.value]
                    });
                    e.target.value = '';
                  }
                }}
              />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {newItem.images.map((url, index) => (
                  <Chip 
                    key={index} 
                    label={`Image ${index + 1}`} 
                    onDelete={() => {
                      const updatedImages = [...newItem.images];
                      updatedImages.splice(index, 1);
                      setNewItem({...newItem, images: updatedImages});
                    }}
                  />
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
    </Container>
  );
};

export default Marketplace; 