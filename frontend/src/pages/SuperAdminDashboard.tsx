import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
} from '@mui/material';
import {
  Business as BusinessIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import apiService from '../services/api';
import { PaginatedResponse } from '../types/api';

interface Tenant {
  id: number;
  name: string;
  code: string;
  subscription_plan: string;
  is_active: boolean;
  max_students: number;
  max_teachers: number;
}

const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const response = await apiService.get<PaginatedResponse<Tenant>>('/tenants/');
      return response.data;
    },
  });

  const stats = [
    { 
      label: 'Total Schools', 
      value: tenants?.count?.toString() || '0', 
      icon: <BusinessIcon />, 
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      change: '+3 this month'
    },
    { 
      label: 'Active Schools', 
      value: tenants?.results?.filter((t: Tenant) => t.is_active).length.toString() || '0', 
      icon: <TrendingUpIcon />, 
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      change: '98% active rate'
    },
    { 
      label: 'Total Capacity', 
      value: tenants?.results?.reduce((sum: number, t: Tenant) => sum + (t.max_students || 0), 0).toString() || '0', 
      icon: <PeopleIcon />, 
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      change: 'Across all schools'
    },
    { 
      label: 'Premium Schools', 
      value: tenants?.results?.filter((t: Tenant) => t.subscription_plan !== 'free').length.toString() || '0', 
      icon: <AccountBalanceIcon />, 
      gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
      change: 'Paid subscriptions'
    },
  ];

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1, color: '#1e293b' }}>
              Platform Administration
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage all schools and platform settings
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => navigate('/superadmin/tenants/new')}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
              },
            }}
          >
            Add New School
          </Button>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  background: stat.gradient,
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '100px',
                    height: '100px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '50%',
                    transform: 'translate(30%, -30%)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {stat.icon}
                    </Box>
                    <Box
                      sx={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 2,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {stat.change}
                    </Box>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Paper sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
              All Schools
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ background: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>School Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Subscription Plan</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Capacity</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tenants?.results?.map((tenant: Tenant) => (
                  <TableRow
                    key={tenant.id}
                    sx={{
                      '&:hover': {
                        background: '#f8fafc',
                      },
                      transition: 'background 0.2s',
                    }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>{tenant.name}</TableCell>
                    <TableCell>{tenant.code}</TableCell>
                    <TableCell>
                      <Chip
                        label={tenant.subscription_plan}
                        size="small"
                        sx={{
                          fontWeight: 500,
                          borderRadius: 2,
                          background: tenant.subscription_plan === 'enterprise'
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : tenant.subscription_plan === 'premium'
                            ? 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)'
                            : undefined,
                          color: tenant.subscription_plan !== 'free' ? 'white' : undefined,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tenant.is_active ? 'Active' : 'Inactive'}
                        color={tenant.is_active ? 'success' : 'default'}
                        size="small"
                        sx={{ fontWeight: 500, borderRadius: 2 }}
                      />
                    </TableCell>
                    <TableCell>
                      {tenant.max_students} students / {tenant.max_teachers} teachers
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => navigate(`/superadmin/tenants/${tenant.id}`)}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 500,
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </Layout>
  );
};

export default SuperAdminDashboard;

