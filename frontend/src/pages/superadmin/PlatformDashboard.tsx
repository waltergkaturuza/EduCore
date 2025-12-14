import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Business as BusinessIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Sms as SmsIcon,
  Storage as StorageIcon,
  CloudQueue as CloudQueueIcon,
  Payment as PaymentIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from '../../components/Layout';
import { superadminService, PlatformMetrics } from '../../services/superadmin';
import { useWebSocket } from '../../hooks/useWebSocket';
import apiService from '../../services/api';
import { PaginatedResponse } from '../../types/api';

const PlatformDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Fetch real platform metrics
  const { data: metrics, isLoading: metricsLoading, refetch } = useQuery<PlatformMetrics>({
    queryKey: ['platform-metrics'],
    queryFn: () => superadminService.getMetrics(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch recent tenants
  const { data: recentTenants } = useQuery({
    queryKey: ['recent-tenants'],
    queryFn: async () => {
      const response = await apiService.get<PaginatedResponse<any>>('/tenants/', {
        params: { ordering: '-created_at', page_size: 5 }
      });
      return response.data;
    },
  });

  // WebSocket for real-time updates
  const { isConnected, lastMessage } = useWebSocket({
    url: process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws/superadmin/updates/',
    onMessage: (data) => {
      if (data.type === 'tenant_update' || data.type === 'subscription_update') {
        refetch(); // Refresh metrics on updates
      }
    },
  });

  // Use real data or fallback to defaults
  const metricsData = metrics || {
    total_schools: 0,
    active_schools: 0,
    total_students: 0,
    total_teachers: 0,
    total_parents: 0,
    mrr: 0,
    arr: 0,
    trial_schools: 0,
    paid_schools: 0,
    sms_sent: 0,
    sms_remaining: 0,
    storage_used: 0,
    storage_total: 0,
    uptime: 99.98,
    error_rate: 0.02,
    new_signups: 0,
    payment_success_rate: 98.5,
  };

  const revenueData = [
    { month: 'Jan', revenue: 120000, mrr: 120000 },
    { month: 'Feb', revenue: 122000, mrr: 122000 },
    { month: 'Mar', revenue: 125000, mrr: 125000 },
    { month: 'Apr', revenue: 128000, mrr: 128000 },
    { month: 'May', revenue: 130000, mrr: 130000 },
    { month: 'Jun', revenue: 125000, mrr: 125000 },
  ];

  const schoolGrowthData = [
    { month: 'Jan', schools: 38 },
    { month: 'Feb', schools: 40 },
    { month: 'Mar', schools: 42 },
    { month: 'Apr', schools: 43 },
    { month: 'May', schools: 44 },
    { month: 'Jun', schools: 45 },
  ];

  const planDistribution = [
    { plan: 'Enterprise', count: 12, revenue: 72000 },
    { plan: 'Premium', count: 15, revenue: 45000 },
    { plan: 'Basic', count: 10, revenue: 8000 },
    { plan: 'Free', count: 8, revenue: 0 },
  ];

  // Fetch system alerts from backend
  const { data: alertsData } = useQuery<{ results: any[] }>({
    queryKey: ['system-alerts'],
    queryFn: async () => {
      try {
        const response = await apiService.get<{ results: any[] }>('/superadmin/system-alerts/', {
          params: { limit: 5, status: 'active' }
        });
        return response.data;
      } catch (error) {
        return { results: [] };
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  interface SystemAlert {
    id: number;
    type: string;
    message: string;
    time: string;
  }
  
  const systemAlerts: SystemAlert[] = (alertsData?.results || []).map((alert: any): SystemAlert => ({
    id: alert.id,
    type: alert.severity || alert.type || 'info',
    message: alert.message || alert.description,
    time: alert.created_at ? `${Math.floor((Date.now() - new Date(alert.created_at).getTime()) / 60000)} min ago` : 'Just now',
  }));

  if (metricsLoading) {
    return (
      <Layout>
        <Container>
          <Box sx={{ p: 3 }}>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography>Loading platform metrics...</Typography>
          </Box>
        </Container>
      </Layout>
    );
  }

  const recentTenantsList = (recentTenants as any)?.results || [];

  const stats = [
    {
      label: 'Total Schools',
      value: metricsData.total_schools?.toString() || '0',
      change: `+${metricsData.new_signups || 0} this week`,
      icon: <BusinessIcon />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      action: () => navigate('/superadmin/tenants'),
    },
    {
      label: 'Active Schools',
      value: metricsData.active_schools?.toString() || '0',
      change: `${metricsData.total_schools ? ((metricsData.active_schools / metricsData.total_schools) * 100).toFixed(0) : 0}% active`,
      icon: <CheckCircleIcon />,
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    },
    {
      label: 'Total Users',
      value: ((metricsData.total_students || 0) + (metricsData.total_teachers || 0) + (metricsData.total_parents || 0)).toLocaleString(),
      change: 'Across all schools',
      icon: <PeopleIcon />,
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    },
    {
      label: 'Monthly Revenue',
      value: `$${metricsData.mrr?.toLocaleString() || '0'}`,
      change: `ARR: $${metricsData.arr ? (metricsData.arr / 1000).toFixed(0) : 0}k`,
      icon: <AccountBalanceIcon />,
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      action: () => navigate('/superadmin/revenue'),
    },
    {
      label: 'Trial vs Paid',
      value: `${metricsData.paid_schools || 0}/${metricsData.trial_schools || 0}`,
      change: `${metricsData.total_schools ? ((metricsData.paid_schools / metricsData.total_schools) * 100).toFixed(0) : 0}% paid`,
      icon: <PaymentIcon />,
      gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    },
    {
      label: 'System Uptime',
      value: `${metricsData.uptime?.toFixed(2) || '99.98'}%`,
      change: `Error rate: ${metricsData.error_rate?.toFixed(2) || '0.02'}%`,
      icon: <CloudQueueIcon />,
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    },
    {
      label: 'SMS Usage',
      value: `${metricsData.sms_sent ? (metricsData.sms_sent / 1000).toFixed(0) : 0}k sent`,
      change: `${metricsData.sms_remaining ? (metricsData.sms_remaining / 1000).toFixed(0) : 0}k remaining`,
      icon: <SmsIcon />,
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    },
    {
      label: 'Storage Usage',
      value: `${metricsData.storage_used?.toFixed(0) || 0}GB`,
      change: `${metricsData.storage_total ? ((metricsData.storage_used / metricsData.storage_total) * 100).toFixed(0) : 0}% used`,
      icon: <StorageIcon />,
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    },
  ];

  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1, color: '#1e293b' }}>
              Platform Overview
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body1" color="text.secondary">
                Real-time health and performance metrics of your entire platform
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 2 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: isConnected ? 'success.main' : 'error.main',
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/superadmin/tenants/new')}
              sx={{ borderRadius: 2 }}
            >
              Add School
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/superadmin/announcements')}
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                },
              }}
            >
              Send Announcement
            </Button>
          </Box>
        </Box>

        {/* WebSocket Status */}
        {lastMessage && (
          <Box sx={{ mb: 2 }}>
            <Paper sx={{ p: 1.5, bgcolor: 'info.light', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScheduleIcon sx={{ fontSize: 18 }} />
              <Typography variant="caption">
                Last update: {lastMessage.timestamp ? new Date(lastMessage.timestamp).toLocaleTimeString() : 'Just now'}
              </Typography>
            </Paper>
          </Box>
        )}

        {/* System Alerts */}
        {systemAlerts.length > 0 && (
          <Box sx={{ mb: 3 }}>
            {systemAlerts.map((alert: SystemAlert) => (
              <Paper
                key={alert.id}
                sx={{
                  p: 2,
                  mb: 1,
                  borderRadius: 2,
                  background: alert.type === 'warning' ? '#fef3c7' : '#dbeafe',
                  border: `1px solid ${alert.type === 'warning' ? '#fbbf24' : '#60a5fa'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                {alert.type === 'warning' ? (
                  <WarningIcon sx={{ color: '#f59e0b' }} />
                ) : (
                  <CheckCircleIcon sx={{ color: '#3b82f6' }} />
                )}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {alert.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {alert.time}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        )}

        {/* Key Metrics Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  background: stat.gradient,
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: stat.action ? 'pointer' : 'default',
                  transition: 'transform 0.2s',
                  '&:hover': stat.action ? { transform: 'translateY(-4px)' } : {},
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
                onClick={stat.action}
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

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Revenue Trend */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Revenue Trend (MRR)
                    </Typography>
                  </Box>
                  <Button size="small" onClick={() => navigate('/superadmin/revenue')}>
                    View Details
                  </Button>
                </Box>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#667eea" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="mrr"
                      stroke="#667eea"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* School Growth */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  School Growth
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={schoolGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="schools"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Plan Distribution */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Subscription Plan Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={planDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="plan" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Bar dataKey="count" fill="#667eea" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Signups */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Recent School Signups
                  </Typography>
                  <Button size="small" onClick={() => navigate('/superadmin/tenants')}>
                    View All
                  </Button>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>School</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Plan</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentTenantsList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center">No recent signups</TableCell>
                        </TableRow>
                      ) : (
                        recentTenantsList.map((tenant: any) => (
                          <TableRow key={tenant.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                  {tenant.name?.[0] || 'S'}
                                </Avatar>
                                <Typography sx={{ fontWeight: 500 }}>{tenant.name || tenant.tenant_name || 'N/A'}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={tenant.subscription_plan?.name || tenant.plan || 'Free'}
                                size="small"
                                sx={{
                                  fontWeight: 500,
                                  borderRadius: 2,
                                  background:
                                    tenant.subscription_plan?.name === 'Enterprise' || tenant.plan === 'Enterprise'
                                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                      : tenant.subscription_plan?.name === 'Premium' || tenant.plan === 'Premium'
                                      ? 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)'
                                      : undefined,
                                  color: (tenant.subscription_plan?.name || tenant.plan) !== 'Free' ? 'white' : undefined,
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={tenant.status || 'active'}
                                size="small"
                                color={tenant.status === 'active' ? 'success' : tenant.status === 'trial' ? 'warning' : 'default'}
                                sx={{ fontWeight: 500, borderRadius: 2 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <ScheduleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                {tenant.created_at
                                  ? new Date(tenant.created_at).toLocaleDateString()
                                  : tenant.date || '-'}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};

export default PlatformDashboard;

