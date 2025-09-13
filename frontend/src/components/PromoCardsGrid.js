import React from 'react';
import { Box, Grid, Card, CardMedia, CardContent, Typography, Button } from '@mui/material';

const promoCards = [
  {
    title: 'Summer home trends from $6',
    description: 'Shop home',
    image: 'https://images.pexels.com/photos/1866149/pexels-photo-1866149.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    link: '#'
  },
  {
    title: 'Get it in as fast as an hour*',
    description: 'Hot July 4th savings',
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    link: '#'
  },
  {
    title: 'Tons of classroom supplies for teachers',
    description: 'Shop now',
    image: 'https://images.pexels.com/photos/414645/pexels-photo-414645.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    link: '#'
  },
  {
    title: 'Save on La Roche-Posay Anthelios',
    description: 'Shop now',
    image: 'https://images.pexels.com/photos/356040/pexels-photo-356040.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    link: '#'
  },
  {
    title: 'Premium beauty. Victoria’s Secret.',
    description: 'Shop now',
    image: 'https://images.pexels.com/photos/3612656/pexels-photo-3612656.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    link: '#'
  }
];

const PromoCardsGrid = () => {
  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
      <Grid container spacing={3}>
        {promoCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <Card sx={{ borderRadius: 2, boxShadow: 3, cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="180"
                image={card.image}
                alt={card.title}
                sx={{ borderTopLeftRadius: 8, borderTopRightRadius: 8 }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {card.title}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  href={card.link}
                  sx={{
                    textTransform: 'none',
                    borderColor: '#0071ce',
                    color: '#0071ce',
                    fontWeight: 'bold',
                    '&:hover': {
                      backgroundColor: '#0071ce',
                      color: '#fff',
                      borderColor: '#0071ce',
                    },
                  }}
                >
                  {card.description}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default PromoCardsGrid;