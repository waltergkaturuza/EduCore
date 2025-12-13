import React, { useState } from 'react';
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
  LinearProgress,
  Alert,
  Button,
  IconButton,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  CloudQueue as CloudQueueIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Memory as MemoryIcon,
  NetworkCheck as NetworkCheckIcon,
} from '@mui/icons-material';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import Layout from '../../components/Layout';
import { superadminService } from '../../services/superadmin';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useQueryClient } from '@tanstack/react-query';

const SystemMonitoring: React.FC = () => {
  const queryClient = useQueryClient();

  // Fetch system health data
  const { data: healthData, isLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => superadminService.getSystemHealth(24),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // WebSocket for real-time updates
  const { isConnected } = useWebSocket({
    url: process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws/superadmin/monitoring/',
    onMessage: (data) => {
      if (data.type === 'system_health') {
        // Update health data in real-time
        queryClient.setQueryData(['system-health'], (old: any) => ({
          ...old,
          results: [data.data, ...(old?.results || []).slice(0, 99)],
        }));
      }
    },
  });

  const latestHealth = healthData?.results?.[0] || {
    response_time_avg: 0,
    response_time_p95: 0,
    error_rate: 0,
    cpu_usage: 0,
    memory_usage: 0,
    storage_used_gb: 0,
    storage_total_gb: 0,
    active_users: 0,
    api_requests_24h: 0,
    background_jobs_queued: 0,
    background_jobs_failed: 0,
  };

  // Transform health history for charts
  const responseTimeData = healthData?.results?.slice(0, 24).reverse().map((h: any, idx: number) => ({
    time: new Date(h.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    ms: h.response_time_avg || 0,
  })) || [];

  const errorRateData = healthData?.results?.slice(0, 24).reverse().map((h: any, idx: number) => ({
    time: new Date(h.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    rate: h.error_rate || 0,
  })) || [];

  const systemHealth = {
    uptime: 99.98, // Calculate from health data if available
    responseTime: latestHealth.response_time_avg || 0,
    errorRate: latestHealth.error_rate || 0,
    activeUsers: latestHealth.active_users || 0,
    apiRequests: latestHealth.api_requests_24h || 0,
    queueSize: latestHealth.background_jobs_queued || 0,
    storageUsed: latestHealth.storage_used_gb || 0,
    storageTotal: latestHealth.storage_total_gb || 0,
    memoryUsed: latestHealth.memory_usage || 0,
    cpuUsage: latestHealth.cpu_usage || 0,
  };

  const systemAlerts = [
    { id: 1, severity: 'warning', message: 'API response time above threshold', time: '2 min ago', status: 'active' },
    { id: 2, severity: 'info', message: 'Scheduled backup completed successfully', time: '1 hour ago', status: 'resolved' },
    { id: 3, severity: 'error', message: 'Payment gateway timeout detected', time: '15 min ago', status: 'active' },
  ];

  const backgroundJobs = [
    { id: 1, name: 'Email Queue Processor', status: 'running', processed: 1250, failed: 2, lastRun: '2 min ago' },
    { id: 2, name: 'SMS Queue Processor', status: 'running', processed: 850, failed: 0, lastRun: '1 min ago' },
    { id: 3, name: 'Report Generator', status: 'idle', processed: 45, failed: 0, lastRun: '30 min ago' },
    { id: 4, name: 'Backup Job', status: 'completed', processed: 1, failed: 0, lastRun: '2 hours ago' },
  ];

  const apiEndpoints = [
    { endpoint: '/api/auth/login', requests: 1250, avgResponse: 145, errorRate: 0.1, status: 'healthy' },
    { endpoint: '/api/students/', requests: 8500, avgResponse: 120, errorRate: 0.05, status: 'healthy' },
    { endpoint: '/api/attendance/', requests: 3200, avgResponse: 180, errorRate: 0.2, status: 'warning' },
    { endpoint: '/api/fees/', requests: 2100, avgResponse: 200, errorRate: 0.15, status: 'healthy' },
    { endpoint: '/api/assessments/', requests: 5600, avgResponse: 165, errorRate: 0.08, status: 'healthy' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1, color: '#1e293b' }}>
              System Monitoring & Health
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Real-time system performance and health metrics
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={isConnected ? 'Live' : 'Disconnected'}
              color={isConnected ? 'success' : 'error'}
              size="small"
            />
            <Typography variant="caption" color="text.secondary">
              {isLoading ? 'Loading...' : `Last updated: ${new Date().toLocaleTimeString()}`}
            </Typography>
            <IconButton
              onClick={() => queryClient.invalidateQueries({ queryKey: ['system-health'] })}
              sx={{ color: '#667eea' }}
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {/* System Alerts */}
        {systemAlerts.filter(a => a.status === 'active').length > 0 && (
          <Box sx={{ mb: 3 }}>
            {systemAlerts
              .filter(a => a.status === 'active')
              .map((alert) => (
                <Alert
                  key={alert.id}
                  severity={alert.severity as 'warning' | 'error' | 'info'}
                  sx={{ mb: 1, borderRadius: 2 }}
                  action={
                    <Button size="small" color="inherit">
                      View Details
                    </Button>
                  }
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {alert.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {alert.time}
                    </Typography>
                  </Box>
                </Alert>
              ))}
          </Box>
        )}

        {/* Key Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: systemHealth.uptime > 99.9
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CloudQueueIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {systemHealth.uptime}%
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      System Uptime
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: systemHealth.responseTime < 200
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <SpeedIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {systemHealth.responseTime}ms
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Avg Response Time
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: systemHealth.errorRate < 0.1
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ErrorIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {systemHealth.errorRate}%
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Error Rate
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <NetworkCheckIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {systemHealth.apiRequests.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      API Requests (24h)
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Resource Usage */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Storage Usage
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      {systemHealth.storageUsed}GB / {systemHealth.storageTotal}GB
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {Math.round((systemHealth.storageUsed / systemHealth.storageTotal) * 100)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(systemHealth.storageUsed / systemHealth.storageTotal) * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <StorageIcon sx={{ color: '#667eea', fontSize: 40, opacity: 0.3 }} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Memory Usage
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{systemHealth.memoryUsed}% Used</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {100 - systemHealth.memoryUsed}% Free
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={systemHealth.memoryUsed}
                    color={systemHealth.memoryUsed > 80 ? 'error' : systemHealth.memoryUsed > 60 ? 'warning' : 'primary'}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <MemoryIcon sx={{ color: '#667eea', fontSize: 40, opacity: 0.3 }} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  CPU Usage
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{systemHealth.cpuUsage}% Used</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {100 - systemHealth.cpuUsage}% Free
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={systemHealth.cpuUsage}
                    color={systemHealth.cpuUsage > 80 ? 'error' : systemHealth.cpuUsage > 60 ? 'warning' : 'primary'}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <SpeedIcon sx={{ color: '#667eea', fontSize: 40, opacity: 0.3 }} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  API Response Time (24h)
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={responseTimeData}>
                    <defs>
                      <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#667eea" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#64748b" />
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
                      dataKey="ms"
                      stroke="#667eea"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorResponse)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Error Rate (24h)
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={errorRateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#64748b" />
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
                      dataKey="rate"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ fill: '#ef4444', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Background Jobs */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Background Jobs Status
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Job Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Processed</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Failed</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Last Run</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {backgroundJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell sx={{ fontWeight: 500 }}>{job.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={job.status}
                          size="small"
                          color={
                            job.status === 'running'
                              ? 'success'
                              : job.status === 'completed'
                              ? 'primary'
                              : 'default'
                          }
                          sx={{ fontWeight: 500, borderRadius: 2 }}
                        />
                      </TableCell>
                      <TableCell>{job.processed}</TableCell>
                      <TableCell>
                        <Chip
                          label={job.failed}
                          size="small"
                          color={job.failed > 0 ? 'error' : 'success'}
                          sx={{ fontWeight: 500, borderRadius: 2 }}
                        />
                      </TableCell>
                      <TableCell>{job.lastRun}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* API Endpoints Performance */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              API Endpoints Performance
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Endpoint</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Requests (24h)</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Avg Response</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Error Rate</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {apiEndpoints.map((endpoint, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                        {endpoint.endpoint}
                      </TableCell>
                      <TableCell>{endpoint.requests.toLocaleString()}</TableCell>
                      <TableCell>{endpoint.avgResponse}ms</TableCell>
                      <TableCell>
                        <Chip
                          label={`${endpoint.errorRate}%`}
                          size="small"
                          color={endpoint.errorRate > 0.1 ? 'warning' : 'success'}
                          sx={{ fontWeight: 500, borderRadius: 2 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={endpoint.status}
                          size="small"
                          color={getStatusColor(endpoint.status) as any}
                          sx={{ fontWeight: 500, borderRadius: 2 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Container>
    </Layout>
  );
};

export default SystemMonitoring;

