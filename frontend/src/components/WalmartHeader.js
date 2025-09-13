import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  Menu,
  MenuList,
  ListItemText,
  ListItemIcon,
  Divider,
  Popover
} from '@mui/material';
import {
  LocationOn,
  Search,
  AccountCircle,
  ShoppingCart,
  FavoriteBorder,
  Reorder
} from '@mui/icons-material';

const categories = [
  'Departments',
  'New Arrivals',
  'Rollbacks & more',
  'Dinner Made Easy',
  'Pharmacy Delivery',
  'Trending',
  'Swim Shop',
  'My Items',
  'Auto Service',
  'Walmart+',
  'More'
];

const WalmartHeader = ({ cartCount = 0, cartTotal = 0, userName = 'Guest' }) => {
  const [location, setLocation] = useState('Sacramento, 95829');
  const [locationAnchorEl, setLocationAnchorEl] = useState(null);
  const [navAnchorEl, setNavAnchorEl] = useState(null);

  const handleLocationClick = (event) => {
    setLocationAnchorEl(event.currentTarget);
  };

  const handleLocationClose = () => {
    setLocationAnchorEl(null);
  };

  const openLocationPopover = Boolean(locationAnchorEl);

  const handleNavMenuClick = (event) => {
    setNavAnchorEl(event.currentTarget);
  };

  const handleNavMenuClose = () => {
    setNavAnchorEl(null);
  };

  return (
    <>
      {/* Top Bar */}
      <AppBar position="static" sx={{ backgroundColor: '#0046be', minHeight: 48, boxShadow: 'none' }}>
        <Toolbar sx={{ minHeight: 48, px: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={handleLocationClick} sx={{ color: 'white' }} size="small">
              <LocationOn fontSize="small" />
            </IconButton>
            <Typography variant="body2" sx={{ color: 'white', cursor: 'pointer' }} onClick={handleLocationClick}>
              Pickup or delivery? {location}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Button sx={{ color: 'white', textTransform: 'none', fontSize: 14 }}>Reorder My Items</Button>
            <Button sx={{ color: 'white', textTransform: 'none', fontSize: 14 }}>Sign In Account</Button>
            <IconButton sx={{ color: 'white' }}>
              <ShoppingCart />
              <Typography variant="body2" sx={{ ml: 0.5 }}>
                ${cartTotal.toFixed(2)}
              </Typography>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Location Popover */}
      <Popover
        open={openLocationPopover}
        anchorEl={locationAnchorEl}
        onClose={handleLocationClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Is this the right location?
          </Typography>
          <Typography variant="body2" gutterBottom>
            {location}
          </Typography>
          <Button variant="contained" size="small" onClick={handleLocationClose}>
            Yes
          </Button>
          <Button variant="text" size="small" onClick={handleLocationClose} sx={{ ml: 1 }}>
            Change
          </Button>
        </Box>
      </Popover>

      {/* Search Bar and Navigation */}
      <AppBar position="static" sx={{ backgroundColor: '#0071ce', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <Toolbar sx={{ px: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <Box sx={{ mr: 2 }}>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Walmart_logo.svg/2560px-Walmart_logo.svg.png"
                alt="Walmart Logo"
                style={{ height: 40, cursor: 'pointer' }}
              />
            </Box>
            <Box sx={{ flexGrow: 1, position: 'relative' }}>
              <input
                type="text"
                placeholder="Search everything at Walmart online and in store"
                style={{
                  width: '100%',
                  padding: '8px 40px 8px 12px',
                  borderRadius: 4,
                  border: 'none',
                  fontSize: 16,
                }}
              />
              <IconButton
                sx={{
                  position: 'absolute',
                  right: 4,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#0046be',
                }}
              >
                <Search />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 3 }}>
            <Button sx={{ color: 'white', textTransform: 'none' }}>
              <FavoriteBorder sx={{ mr: 0.5 }} />
              Reorder
            </Button>
            <Button sx={{ color: 'white', textTransform: 'none' }}>
              <AccountCircle sx={{ mr: 0.5 }} />
              Sign In
            </Button>
            <IconButton sx={{ color: 'white' }}>
              <ShoppingCart />
              <Typography variant="body2" sx={{ ml: 0.5 }}>
                {cartCount}
              </Typography>
            </IconButton>
          </Box>
          <IconButton
            sx={{ display: { md: 'none' }, color: 'white' }}
            onClick={handleNavMenuClick}
            aria-label="menu"
          >
            <Reorder />
          </IconButton>
        </Toolbar>

        {/* Navigation Menu */}
        <Box sx={{ backgroundColor: '#0071ce', px: 2 }}>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3, py: 1 }}>
            {categories.map((category) => (
              <Button key={category} sx={{ color: 'white', textTransform: 'none', fontWeight: 'bold' }}>
                {category}
              </Button>
            ))}
          </Box>
          <Menu
            anchorEl={navAnchorEl}
            open={Boolean(navAnchorEl)}
            onClose={handleNavMenuClose}
            sx={{ display: { md: 'none' } }}
          >
            <MenuList>
              {categories.map((category) => (
                <MenuItem key={category} onClick={handleNavMenuClose}>
                  <ListItemText>{category}</ListItemText>
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </Box>
      </AppBar>
    </>
  );
};

export default WalmartHeader;