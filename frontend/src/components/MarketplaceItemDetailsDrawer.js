import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Divider,
  Button
} from '@mui/material';

const formatImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${process.env.REACT_APP_API_URL || ''}${url.startsWith('/') ? url : `/${url}`}`;
};

const MarketplaceItemDetailsDrawer = ({ open, item, onClose }) => {
  if (!item) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ '& .MuiDrawer-paper': { width: 400, p: 3 } }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {item.title}
        </Typography>
        {item.images && item.images.length > 0 && (
          <CardMedia
            component="img"
            height="200"
            image={formatImageUrl(item.images[0])}
            alt={item.title}
            sx={{ mb: 2, borderRadius: 2 }}
          />
        )}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" color="text.secondary">
              Category: <Chip label={item.category} size="small" sx={{ ml: 1 }} />
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Condition: <Chip label={item.condition} size="small" sx={{ ml: 1 }} />
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Price: <b>${item.price}</b>
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body1" sx={{ mb: 1 }}>
              {item.description}
            </Typography>
            {item.seller && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Seller: {item.seller.name || item.seller}
                </Typography>
                {item.seller.email && (
                  <Typography variant="body2" color="text.secondary">
                    Email: {item.seller.email}
                  </Typography>
                )}
              </>
            )}
          </CardContent>
        </Card>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button onClick={onClose} color="primary" variant="contained">Close</Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default MarketplaceItemDetailsDrawer;
