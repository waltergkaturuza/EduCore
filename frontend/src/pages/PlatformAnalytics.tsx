import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import Layout from '../components/Layout';

const PlatformAnalytics: React.FC = () => {
  // Mock data - replace with actual API calls
  const analytics = {
    totalSchools: 45,
    activeSchools: 42,
    totalUsers: 12500,
    totalStudents: 9800,
    totalRevenue: 125000,
    growthRate: 15.5,
  };

  const stats = [
    { 
      label: 'Total Schools', 
      value: analytics.totalSchools.toString(), 
      icon: <SchoolIcon />, 
      color: '#1976d2',
      change: '+3 this month'
    },
    { 
      label: 'Active Schools', 
      value: analytics.activeSchools.toString(), 
      icon: <TrendingUpIcon />, 
      color: '#2e7d32',
      change: '98% active rate'
    },
    { 
      label: 'Total Users', 
      value: analytics.totalUsers.toLocaleString(), 
      icon: <PeopleIcon />, 
      color: '#ed6c02',
      change: `+${analytics.growthRate}% growth`
    },
    { 
      label: 'Monthly Revenue', 
      value: `$${analytics.totalRevenue.toLocaleString()}`, 
      icon: <AccountBalanceIcon />, 
      color: '#9c27b0',
      change: 'USD'
    },
  ];

  return (
    <Layout>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom>
          Platform Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Overview of all schools and platform performance
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ color: stat.color, mr: 2, fontSize: 40 }}>
                      {stat.icon}
                    </Box>
                    <Box>
                      <Typography variant="h4" component="div">
                        {stat.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {stat.change}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                School Growth
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Chart showing school growth over time (to be implemented)
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Revenue Trends
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Chart showing revenue trends (to be implemented)
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};

export default PlatformAnalytics;




