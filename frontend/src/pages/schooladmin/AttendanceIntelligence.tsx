/**
 * Attendance Intelligence Center
 * Real-time attendance tracking with alerts and analytics
 */
import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Paper,
  Alert,
  AlertTitle,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Send as SendIcon,
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { attendanceService } from '../../services/attendance';
import apiService from '../../services/api';
import AdvancedFilter from '../../components/AdvancedFilter';
import Layout from '../../components/Layout';

const AttendanceIntelligence: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const queryClient = useQueryClient();

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance', selectedDate],
    queryFn: () => attendanceService.getAll({ date: selectedDate }),
  });

  const { data: alertsData } = useQuery({
    queryKey: ['attendanceAlerts'],
    queryFn: () => apiService.get('/schooladmin/attendance-alerts/').then(res => res.data),
  });

  const sendAlertMutation = useMutation({
    mutationFn: (id: number) => apiService.post(`/schooladmin/attendance-alerts/${id}/send_alert/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendanceAlerts'] });
    },
  });

  const attendances = (attendanceData as any)?.results || [];
  const alerts = (alertsData as any)?.results || [];

  // Calculate statistics
  const presentCount = attendances.filter((a: any) => a.status === 'present').length;
  const absentCount = attendances.filter((a: any) => a.status === 'absent').length;
  const lateCount = attendances.filter((a: any) => a.status === 'late').length;
  const attendanceRate = attendances.length > 0 ? (presentCount / attendances.length) * 100 : 0;

  // Prepare chart data
  const dailyAttendanceData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      present: Math.floor(Math.random() * 200) + 150,
      absent: Math.floor(Math.random() * 50) + 10,
      late: Math.floor(Math.random() * 20) + 5,
    };
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (isLoading) {
    return (
      <Layout>
        <Box sx={{ p: 3 }}>
          <LinearProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, background: 'linear-gradient(45deg, #1976D2 30%, #42A5F5 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Attendance Intelligence Center
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time attendance tracking with alerts and analytics
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              size="small"
              sx={{ borderRadius: 2 }}
            />
            <Button variant="outlined" startIcon={<RefreshIcon />} sx={{ borderRadius: 2 }}>
              Refresh
            </Button>
            <Button variant="contained" startIcon={<DownloadIcon />} sx={{ borderRadius: 2 }}>
              Export
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Attendance Rate</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                  {attendanceRate.toFixed(1)}%
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9, mt: 1, display: 'block' }}>
                  {presentCount} present out of {attendances.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Present</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'success.main' }}>
                  {presentCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Absent</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'error.main' }}>
                  {absentCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Late</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'warning.main' }}>
                  {lateCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Today's Attendance" />
            <Tab label="Alerts" />
            <Tab label="Analytics" />
            <Tab label="Chronic Absenteeism" />
          </Tabs>

          {/* Today's Attendance Tab */}
          <Box sx={{ p: 3 }}>
            {tabValue === 0 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell>Class</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Remarks</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendances.map((attendance: any) => (
                      <TableRow key={attendance.id} hover>
                        <TableCell>{attendance.student?.user?.full_name || attendance.student_name}</TableCell>
                        <TableCell>{attendance.class_obj?.name || attendance.class_name}</TableCell>
                        <TableCell>
                          <Chip
                            label={attendance.status}
                            size="small"
                            color={
                              attendance.status === 'present' ? 'success' :
                              attendance.status === 'absent' ? 'error' :
                              attendance.status === 'late' ? 'warning' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>{attendance.date}</TableCell>
                        <TableCell>{attendance.remarks || '-'}</TableCell>
                        <TableCell>
                          <IconButton size="small">
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Alerts Tab */}
            {tabValue === 1 && (
              <Box>
                {alerts.map((alert: any) => (
                  <Alert
                    key={alert.id}
                    severity={alert.severity === 'critical' ? 'error' : alert.severity === 'high' ? 'warning' : 'info'}
                    sx={{ mb: 2 }}
                    action={
                      <Button
                        size="small"
                        startIcon={<SendIcon />}
                        onClick={() => sendAlertMutation.mutate(alert.id)}
                        disabled={alert.is_sent}
                      >
                        {alert.is_sent ? 'Sent' : 'Send Alert'}
                      </Button>
                    }
                  >
                    <AlertTitle>{alert.alert_type.replace('_', ' ').toUpperCase()}</AlertTitle>
                    {alert.message}
                  </Alert>
                ))}
              </Box>
            )}

            {/* Analytics Tab */}
            {tabValue === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>7-Day Attendance Trend</Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={dailyAttendanceData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Area type="monotone" dataKey="present" stackId="1" stroke="#66BB6A" fill="#66BB6A" fillOpacity={0.6} />
                          <Area type="monotone" dataKey="absent" stackId="1" stroke="#EF5350" fill="#EF5350" fillOpacity={0.6} />
                          <Area type="monotone" dataKey="late" stackId="1" stroke="#FFA726" fill="#FFA726" fillOpacity={0.6} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* Chronic Absenteeism Tab */}
            {tabValue === 3 && (
              <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Chronic Absenteeism Risk</Typography>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Students with 10% or more absences in the last 30 days are flagged as at risk.
                  </Alert>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Student</TableCell>
                          <TableCell>Class</TableCell>
                          <TableCell>Absences (30 days)</TableCell>
                          <TableCell>Risk Level</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {/* Sample data - replace with real data */}
                        <TableRow>
                          <TableCell>John Doe</TableCell>
                          <TableCell>Form 1A</TableCell>
                          <TableCell>8</TableCell>
                          <TableCell>
                            <Chip label="High Risk" color="error" size="small" />
                          </TableCell>
                          <TableCell>
                            <Button size="small" startIcon={<SendIcon />}>Send Alert</Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            )}
          </Box>
        </Paper>
      </Box>
    </Layout>
  );
};

export default AttendanceIntelligence;

