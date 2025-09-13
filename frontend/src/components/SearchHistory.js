import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Box
} from '@mui/material';
import { History, Search } from '@mui/icons-material';

const SearchHistory = ({ searchHistory, onSearchFromHistory }) => {
  if (!searchHistory || searchHistory.length === 0) {
    return null;
  }

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <History sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6">Recent Searches</Typography>
      </Box>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {searchHistory.slice(0, 5).map((search, index) => (
          <Chip
            key={index}
            label={search.query}
            onClick={() => onSearchFromHistory(search.query)}
            clickable
            variant="outlined"
            size="small"
            icon={<Search />}
          />
        ))}
      </Box>
    </Paper>
  );
};

export default SearchHistory;
