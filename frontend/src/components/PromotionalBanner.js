import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';

const PromotionalBanner = () => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = +new Date('2024-07-04T00:00:00') - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        day: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        mins: Math.floor((difference / 1000 / 60) % 60),
        secs: Math.floor((difference / 1000) % 60),
      };
    } else {
      timeLeft = { day: 0, hours: 0, mins: 0, secs: 0 };
    }
    return timeLeft;
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  });

  return (
    <Box
      sx={{
        backgroundColor: '#ffc220',
        color: '#000',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 3,
        py: 1.5,
        borderRadius: 1,
        mt: 1,
        mb: 3,
        fontWeight: 'bold',
        fontSize: { xs: '0.9rem', md: '1.1rem' },
      }}
    >
      <Typography>
        Walmart+ Get 50% off a year of Walmart+ to shop hot Deals first
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography>
          Early Access starts in:
        </Typography>
        <Typography sx={{ fontFamily: 'monospace' }}>
          {String(timeLeft.day).padStart(2, '0')} : {String(timeLeft.hours).padStart(2, '0')} : {String(timeLeft.mins).padStart(2, '0')}
        </Typography>
        <Button
          variant="outlined"
          sx={{
            borderColor: '#000',
            color: '#000',
            borderRadius: '20px',
            textTransform: 'none',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: '#000',
              color: '#ffc220',
              borderColor: '#000',
            },
          }}
        >
          Join Walmart+
        </Button>
      </Box>
    </Box>
  );
};

export default PromotionalBanner;