import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
  LinearProgress,
  Avatar,
} from '@mui/material';
import {
  People as PeopleIcon,
  EventNote as AttendanceIcon,
  Assignment as AssignmentIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Layout from '../components/Layout';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect superadmin to superadmin dashboard, admin to school admin dashboard
  React.useEffect(() => {
    if (user?.role === 'superadmin') {
      navigate('/superadmin', { replace: true });
    } else if (user?.role === 'admin') {
      navigate('/schooladmin/dashboard', { replace: true });
    }
  }, [user?.role, navigate]);

  // Mock data for charts
  const attendanceData = [
    { name: 'Mon', value: 95 },
    { name: 'Tue', value: 92 },
    { name: 'Wed', value: 98 },
    { name: 'Thu', value: 94 },
    { name: 'Fri', value: 96 },
    { name: 'Sat', value: 90 },
  ];

  const gradeDistribution = [
    { name: 'A', value: 35, color: '#10b981' },
    { name: 'B', value: 30, color: '#3b82f6' },
    { name: 'C', value: 20, color: '#f59e0b' },
    { name: 'D', value: 10, color: '#ef4444' },
    { name: 'F', value: 5, color: '#64748b' },
  ];

  const stats = [
    {
      label: 'Total Students',
      value: '1,234',
      change: '+12%',
      icon: <PeopleIcon />,
      color: '#6366f1',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      label: 'Today\'s Attendance',
      value: '95%',
      change: '+2%',
      icon: <AttendanceIcon />,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    },
    {
      label: 'Pending Assignments',
      value: '23',
      change: '-5',
      icon: <AssignmentIcon />,
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    },
    {
      label: 'Outstanding Fees',
      value: '$12,450',
      change: '-8%',
      icon: <PaymentIcon />,
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    },
  ];

  const studentStats = [
    {
      label: 'Average Grade',
      value: '85%',
      progress: 85,
      icon: <TrendingUpIcon />,
      color: '#6366f1',
    },
    {
      label: 'Attendance Rate',
      value: '98%',
      progress: 98,
      icon: <AttendanceIcon />,
      color: '#10b981',
    },
    {
      label: 'Pending Assignments',
      value: '5',
      progress: 60,
      icon: <AssignmentIcon />,
      color: '#f59e0b',
    },
    {
      label: 'Outstanding Fees',
      value: '$450',
      progress: 30,
      icon: <PaymentIcon />,
      color: '#ef4444',
    },
  ];

  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 700, mb: 1, color: '#1e293b' }}
          >
            Welcome back, {user?.first_name}! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening with your {user?.role === 'student' ? 'progress' : 'school'} today.
          </Typography>
        </Box>

        {/* Stats Cards */}
        {(user?.role === 'admin' || user?.role === 'teacher') && (
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
        )}

        {/* Student/Parent Stats */}
        {(user?.role === 'student' || user?.role === 'parent') && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {studentStats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          background: stat.color,
                          mr: 2,
                        }}
                      >
                        {stat.icon}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                          {stat.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stat.label}
                        </Typography>
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={stat.progress}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#e2e8f0',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          background: stat.color,
                        },
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Grid container spacing={3}>
          {/* Charts Section */}
          {(user?.role === 'admin' || user?.role === 'teacher') && (
            <>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                      Weekly Attendance Trend
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={attendanceData}>
                        <defs>
                          <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#667eea" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" />
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
                          dataKey="value"
                          stroke="#667eea"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorAttendance)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                      Grade Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={gradeDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(props: any) => {
                            const { name, percent } = props;
                            return `${name} ${((percent || 0) * 100).toFixed(0)}%`;
                          }}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {gradeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}

          {/* Quick Actions */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {(user?.role === 'admin' || user?.role === 'teacher') && (
                    <>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => navigate('/attendance')}
                        sx={{
                          py: 1.5,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                          },
                        }}
                      >
                        Mark Attendance
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => navigate('/assessments')}
                        sx={{ py: 1.5 }}
                      >
                        Create Assignment
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => navigate('/fees')}
                        sx={{ py: 1.5 }}
                      >
                        Record Payment
                      </Button>
                    </>
                  )}
                  {(user?.role === 'student' || user?.role === 'parent') && (
                    <>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => navigate('/assessments')}
                        sx={{
                          py: 1.5,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                          },
                        }}
                      >
                        View Assignments
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => navigate('/lms')}
                        sx={{ py: 1.5 }}
                      >
                        Access e-Learning
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => navigate('/fees')}
                        sx={{ py: 1.5 }}
                      >
                        View Fees
                      </Button>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Recent Activity
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[1, 2, 3].map((item) => (
                    <Box
                      key={item}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        borderRadius: 2,
                        background: '#f8fafc',
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        }}
                      >
                        <CheckCircleIcon />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Activity {item}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item} hour{item > 1 ? 's' : ''} ago
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};

export default Dashboard;
