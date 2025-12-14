/**
 * Teacher Dashboard (Daily Command Center)
 * "Everything I need to teach today — in one place"
 */
import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Alert,
  AlertTitle,
  IconButton,
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  EventNote as EventNoteIcon,
  Assessment as AssessmentIcon,
  Message as MessageIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  CloudQueue as CloudQueueIcon,
  CloudOff as CloudOffIcon,
  Sync as SyncIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teachersService, TeacherDashboardMetrics } from '../../services/teachers';
import Layout from '../../components/Layout';

const TeacherDashboard: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: metricsData, isLoading, error, refetch } = useQuery<TeacherDashboardMetrics>({
    queryKey: ['teacherDashboardMetrics'],
    queryFn: async () => {
      try {
        console.log('[TeacherDashboard] Fetching metrics...');
        const data = await teachersService.getLatestMetrics();
        console.log('[TeacherDashboard] Metrics received:', data);
        return data;
      } catch (err: any) {
        console.error('[TeacherDashboard] Error fetching metrics:', err);
        throw err;
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 1,
  });

  const calculateMetricsMutation = useMutation({
    mutationFn: () => teachersService.calculateMetrics(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherDashboardMetrics'] });
      setRefreshing(false);
    },
    onError: () => {
      setRefreshing(false);
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    calculateMetricsMutation.mutate();
  };

  // Helper function to safely convert to number
  const toNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (value === null || value === undefined) return 0;
    const parsed = Number(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Render loading state
  if (isLoading) {
    return (
      <Layout>
        <Box sx={{ p: 3 }}>
          <LinearProgress />
          <Typography sx={{ mt: 2 }}>Loading dashboard...</Typography>
        </Box>
      </Layout>
    );
  }

  // Render error state
  if (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : (error as any)?.response?.data?.error || 'Unknown error';
    
    return (
      <Layout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            <AlertTitle>Error Loading Dashboard</AlertTitle>
            {errorMessage}
          </Alert>
          <Button variant="contained" onClick={() => refetch()} sx={{ mt: 2 }}>
            Retry
          </Button>
        </Box>
      </Layout>
    );
  }

  // Render no data state
  if (!metricsData) {
    return (
      <Layout>
        <Box sx={{ p: 3 }}>
          <Alert severity="info">
            <AlertTitle>No Data</AlertTitle>
            No dashboard metrics available. Click refresh to calculate metrics.
          </Alert>
          <Button variant="contained" onClick={handleRefresh} sx={{ mt: 2 }} disabled={refreshing}>
            {refreshing ? 'Calculating...' : 'Calculate Metrics'}
          </Button>
        </Box>
      </Layout>
    );
  }

  const metrics = metricsData;

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, background: 'linear-gradient(45deg, #1976D2 30%, #42A5F5 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Teacher Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Everything I need to teach today — in one place
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip
              icon={metrics.is_online ? <CloudQueueIcon /> : <CloudOffIcon />}
              label={metrics.is_online ? 'Online' : 'Offline'}
              color={metrics.is_online ? 'success' : 'default'}
              size="small"
            />
            <Tooltip title="Sync data">
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing}
                color="primary"
              >
                <SyncIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{ borderRadius: 2 }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Core Dashboard Widgets */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Today's Classes */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: 3,
                height: '100%',
                cursor: 'pointer',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
                transition: 'all 0.3s',
              }}
              onClick={() => window.location.href = '/teacher/classes'}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Today's Classes</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                      {toNumber(metrics.today_classes_count)}
                    </Typography>
                    <Tooltip title="View all classes">
                      <IconButton size="small" sx={{ color: 'white', mt: 1 }}>
                        <PeopleIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <SchoolIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Next Class Countdown */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Next Class</Typography>
                    {metrics.next_class_countdown_minutes ? (
                      <>
                        <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                          {Math.floor(metrics.next_class_countdown_minutes / 60)}h {metrics.next_class_countdown_minutes % 60}m
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>
                          Countdown
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="h6" sx={{ mt: 1 }}>
                        No more classes today
                      </Typography>
                    )}
                  </Box>
                  <ScheduleIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Pending Attendance */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Pending Attendance</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                      {toNumber(metrics.pending_attendance_count)}
                    </Typography>
                  </Box>
                  <EventNoteIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Pending Assignments to Mark */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                color: 'white',
                borderRadius: 3,
                height: '100%',
                cursor: 'pointer',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
                transition: 'all 0.3s',
              }}
              onClick={() => window.location.href = '/teacher/classwork'}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Assignments to Mark</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                      {toNumber(metrics.pending_assignments_to_mark)}
                    </Typography>
                    <Tooltip title="View assessments">
                      <IconButton size="small" sx={{ color: 'white', mt: 1 }}>
                        <AssessmentIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <AssignmentIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Secondary Widgets Row */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, textAlign: 'center', p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {toNumber(metrics.pending_lesson_plans_count)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pending Lesson Plans
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, textAlign: 'center', p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {toNumber(metrics.upcoming_exams_count)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Upcoming Exams
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: 2,
                textAlign: 'center',
                p: 2,
                cursor: 'pointer',
                '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                transition: 'all 0.2s',
              }}
              onClick={() => window.location.href = '/teacher/parents'}
            >
              <Tooltip title="View messages">
                <IconButton size="small" sx={{ mb: 1 }}>
                  <MessageIcon color="primary" />
                </IconButton>
              </Tooltip>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {toNumber(metrics.unread_messages_count)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Unread Messages
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: 2,
                textAlign: 'center',
                p: 2,
                cursor: 'pointer',
                '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                transition: 'all 0.2s',
              }}
              onClick={() => {
                // Could navigate to notifications page
                window.location.href = '/notifications';
              }}
            >
              <Tooltip title="View notifications">
                <IconButton size="small" sx={{ mb: 1 }}>
                  <NotificationsIcon color="primary" />
                </IconButton>
              </Tooltip>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {toNumber(metrics.announcements_count)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Announcements
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, textAlign: 'center', p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {toNumber(metrics.cpd_reminders_count)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                CPD Reminders
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, textAlign: 'center', p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {toNumber(metrics.pending_offline_actions)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pending Sync
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Smart & AI-Driven Widgets */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Students at Risk */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 3, height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Students at Risk
                  </Typography>
                  <WarningIcon color="warning" />
                </Box>
                {Array.isArray(metrics.students_at_risk) && metrics.students_at_risk.length > 0 ? (
                  <List>
                    {metrics.students_at_risk.slice(0, 5).map((student: any, index: number) => (
                      <React.Fragment key={index}>
                        <ListItem
                          secondaryAction={
                            <Tooltip title="Student needs attention">
                              <IconButton edge="end" size="small">
                                <CheckCircleIcon color="warning" />
                              </IconButton>
                            </Tooltip>
                          }
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'warning.main' }}>
                              {student.student_name?.[0] || 'S'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={student.student_name}
                            secondary={
                              <Box>
                                <Typography variant="caption" display="block">
                                  {student.class_name} • Risk Score: {student.risk_score}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                  {student.risk_factors?.map((factor: string, i: number) => (
                                    <Chip key={i} label={factor} size="small" color="warning" sx={{ fontSize: '0.7rem' }} />
                                  ))}
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < metrics.students_at_risk.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Alert severity="success">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon />
                      No students at risk
                    </Box>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Suggested Remedial Actions */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 3, height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Suggested Actions
                  </Typography>
                  <LightbulbIcon color="primary" />
                </Box>
                {Array.isArray(metrics.suggested_remedial_actions) && metrics.suggested_remedial_actions.length > 0 ? (
                  <List>
                    {metrics.suggested_remedial_actions.map((action: any, index: number) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: action.priority === 'high' ? 'error.main' : 'warning.main' }}>
                              {action.priority === 'high' ? '!' : 'i'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={action.action}
                            secondary={
                              <Typography variant="caption">
                                {action.affected_students} students affected • {action.type}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {index < metrics.suggested_remedial_actions.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info">No suggested actions at this time</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Teaching Insights & Performance Trend */}
        <Grid container spacing={3}>
          {/* Teaching Insights */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Teaching Insights
                </Typography>
                {Array.isArray(metrics.teaching_insights) && metrics.teaching_insights.length > 0 ? (
                  <List>
                    {metrics.teaching_insights.map((insight: any, index: number) => (
                      <Alert
                        key={index}
                        severity={insight.type === 'warning' ? 'warning' : 'info'}
                        sx={{ mb: 1 }}
                      >
                        {insight.message}
                      </Alert>
                    ))}
                  </List>
                ) : (
                  <Alert severity="success">All systems optimal</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Class Performance Trend */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Performance Trend
                  </Typography>
                  <TrendingUpIcon color="primary" />
                </Box>
                {metrics.class_performance_trend && Object.keys(metrics.class_performance_trend).length > 0 ? (
                  <Box>
                    {Object.entries(metrics.class_performance_trend).map(([week, score]: [string, any]) => (
                      <Box key={week} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">{week.replace('_', ' ').toUpperCase()}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {toNumber(score).toFixed(1)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={toNumber(score)}
                          sx={{ height: 8, borderRadius: 1 }}
                        />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Alert severity="info">No trend data available</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Workload Balance Indicator */}
        {metrics.workload_balance_score !== null && (
          <Card sx={{ mt: 3, borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Workload Balance
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {toNumber(metrics.workload_balance_score) >= 70 ? 'Well balanced' : toNumber(metrics.workload_balance_score) >= 50 ? 'Moderate load' : 'High workload'}
                  </Typography>
                </Box>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant="determinate"
                    value={toNumber(metrics.workload_balance_score)}
                    size={80}
                    thickness={4}
                    sx={{
                      color: toNumber(metrics.workload_balance_score) >= 70 ? 'success.main' : toNumber(metrics.workload_balance_score) >= 50 ? 'warning.main' : 'error.main',
                    }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h6" component="div" color="text.secondary">
                      {toNumber(metrics.workload_balance_score).toFixed(0)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Layout>
  );
};

export default TeacherDashboard;


