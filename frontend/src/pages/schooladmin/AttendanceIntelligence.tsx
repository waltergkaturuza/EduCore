/**
 * Attendance Intelligence Center
 * Real-time attendance tracking with alerts and analytics
 */
import React, { useState, useMemo } from 'react';
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
import AdvancedFilter, { FilterField } from '../../components/AdvancedFilter';
import Layout from '../../components/Layout';
import { schooladminService } from '../../services/schooladmin';
import { downloadBlob, formatExportFilename } from '../../utils/exportHelpers';

const AttendanceIntelligence: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRangeStart, setDateRangeStart] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [dateRangeEnd, setDateRangeEnd] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'line' | 'area' | 'bar'>('area');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Fetch today's attendance
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance', selectedDate, filters, searchTerm],
    queryFn: () => {
      const params: any = { date: selectedDate, ...filters };
      if (searchTerm) params.search = searchTerm;
      if (selectedClass !== 'all') params.class = selectedClass;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      return attendanceService.getAll(params);
    },
  });

  // Fetch attendance for date range (for analytics)
  const { data: attendanceRangeData, isLoading: isRangeLoading } = useQuery({
    queryKey: ['attendanceRange', dateRangeStart, dateRangeEnd],
    queryFn: () =>
      attendanceService.getAll({
        date_from: dateRangeStart,
        date_to: dateRangeEnd,
      }).then(res => res.data),
    enabled: tabValue === 2, // Only fetch when Analytics tab is active
  });

  // Fetch attendance alerts
  const { data: alertsData } = useQuery({
    queryKey: ['attendanceAlerts', filters],
    queryFn: () => {
      const params: any = { ...filters };
      return schooladminService.getAttendanceAlerts(params);
    },
  });

  // Fetch classes for filter
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiService.get('/academics/classes/').then(res => res.data),
  });

  // Fetch dashboard metrics for chronic absenteeism
  const { data: metricsData } = useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: () => schooladminService.getLatestMetrics(),
    enabled: tabValue === 3, // Only fetch when Chronic Absenteeism tab is active
  });

  const sendAlertMutation = useMutation({
    mutationFn: (id: number) => schooladminService.sendAttendanceAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendanceAlerts'] });
    },
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiService.patch(`/attendance/attendance/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setDetailDialogOpen(false);
      setSelectedAttendance(null);
    },
  });

  const attendances = useMemo(() => (attendanceData as any)?.results || [], [attendanceData]);
  const alerts = useMemo(() => (alertsData as any)?.results || [], [alertsData]);
  const classes = useMemo(() => (classesData as any)?.results || [], [classesData]);

  // Calculate statistics
  const presentCount = useMemo(
    () => attendances.filter((a: any) => a.status === 'present').length,
    [attendances]
  );
  const absentCount = useMemo(
    () => attendances.filter((a: any) => a.status === 'absent').length,
    [attendances]
  );
  const lateCount = useMemo(
    () => attendances.filter((a: any) => a.status === 'late').length,
    [attendances]
  );
  const excusedCount = useMemo(
    () => attendances.filter((a: any) => a.status === 'excused').length,
    [attendances]
  );
  const attendanceRate = useMemo(
    () => (attendances.length > 0 ? (presentCount / attendances.length) * 100 : 0),
    [attendances, presentCount]
  );

  // Prepare chart data from real backend data
  const dailyAttendanceData = useMemo(() => {
    const rangeAttendances = (attendanceRangeData as any)?.results || [];
    if (!rangeAttendances.length) return [];
    
    // Group by date
    const groupedByDate: Record<string, { present: number; absent: number; late: number; excused: number }> = {};
    rangeAttendances.forEach((att: any) => {
      const dateKey = new Date(att.date).toLocaleDateString('en-US', { weekday: 'short' });
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = { present: 0, absent: 0, late: 0, excused: 0 };
      }
      if (att.status === 'present') groupedByDate[dateKey].present++;
      else if (att.status === 'absent') groupedByDate[dateKey].absent++;
      else if (att.status === 'late') groupedByDate[dateKey].late++;
      else if (att.status === 'excused') groupedByDate[dateKey].excused++;
    });

    // Convert to array format
    return Object.entries(groupedByDate)
      .map(([date, counts]) => ({
        date,
        ...counts,
      }))
      .sort((a, b) => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days.indexOf(a.date) - days.indexOf(b.date);
      });
  }, [attendanceRangeData]);

  // Chronic absenteeism data from metrics or calculate from attendance
  const chronicAbsenteeismData = useMemo(() => {
    // If we have metrics data with chronic absenteeism count
    if (metricsData?.chronic_absenteeism_count) {
      // We need to fetch actual students - for now use alerts as they contain student info
      return alerts.filter((alert: any) => alert.alert_type === 'chronic_absenteeism').map((alert: any) => ({
        student: alert.student?.user?.full_name || alert.student_name || 'Unknown',
        class: alert.student?.current_class?.name || alert.class_name || '-',
        absences: alert.absences_30_days || 0,
        riskLevel: alert.severity === 'critical' ? 'Critical' : alert.severity === 'high' ? 'High' : 'Medium',
        alertId: alert.id,
      }));
    }
    // Fallback: calculate from alerts
    return alerts.filter((alert: any) => alert.alert_type === 'chronic_absenteeism').map((alert: any) => ({
      student: alert.student?.user?.full_name || alert.student_name || 'Unknown',
      class: alert.student?.current_class?.name || alert.class_name || '-',
      absences: 10, // Default estimate
      riskLevel: alert.severity === 'critical' ? 'Critical' : alert.severity === 'high' ? 'High' : 'Medium',
      alertId: alert.id,
    }));
  }, [metricsData, alerts]);

  const filterFields: FilterField[] = useMemo(
    () => [
      {
        name: 'class',
        label: 'Class',
        type: 'select',
        options: [
          { value: 'all', label: 'All Classes' },
          ...classes.map((cls: any) => ({ value: cls.id, label: cls.name })),
        ],
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'all', label: 'All Statuses' },
          { value: 'present', label: 'Present' },
          { value: 'absent', label: 'Absent' },
          { value: 'late', label: 'Late' },
          { value: 'excused', label: 'Excused' },
        ],
      },
    ],
    [classes]
  );

  const handleViewDetails = (attendance: any) => {
    setSelectedAttendance(attendance);
    setDetailDialogOpen(true);
  };

  const handleExportAttendance = () => {
    // Generate CSV
    const headers = ['Student', 'Class', 'Date', 'Status', 'Remarks', 'Marked By'];
    const rows = attendances.map((att: any) => [
      att.student?.user?.full_name || att.student_name || '',
      att.class_obj?.name || att.class_name || '',
      att.date || '',
      att.status || '',
      att.remarks || '',
      att.marked_by?.full_name || '-',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map((cell: string | number) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    downloadBlob(blob, formatExportFilename('attendance', selectedDate));
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['attendance'] });
    queryClient.invalidateQueries({ queryKey: ['attendanceRange'] });
    queryClient.invalidateQueries({ queryKey: ['attendanceAlerts'] });
  };

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
              InputLabelProps={{ shrink: true }}
              label="Date"
            />
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              sx={{ borderRadius: 2 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExportAttendance}
              disabled={attendances.length === 0}
              sx={{ borderRadius: 2 }}
            >
              Export
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Attendance Rate</Typography>
                  {attendanceRate >= 90 ? (
                    <CheckCircleIcon sx={{ opacity: 0.9 }} />
                  ) : attendanceRate >= 70 ? (
                    <WarningIcon sx={{ opacity: 0.9 }} />
                  ) : null}
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                  {attendanceRate.toFixed(1)}%
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                  <PeopleIcon sx={{ fontSize: 14, opacity: 0.9 }} />
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {presentCount} present out of {attendances.length}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Present</Typography>
                  <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'success.main' }}>
                  {presentCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Absent</Typography>
                  <WarningIcon sx={{ color: 'error.main', fontSize: 20 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'error.main' }}>
                  {absentCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Late</Typography>
                  <WarningIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'warning.main' }}>
                  {lateCount}
                </Typography>
                {excusedCount > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {excusedCount} excused
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Advanced Filter */}
        <Paper sx={{ mb: 3, p: 2, borderRadius: 2 }}>
          <AdvancedFilter
            fields={filterFields}
            onFilterChange={(newFilters) => {
              setFilters(newFilters);
              if (newFilters.class) setSelectedClass(newFilters.class);
              if (newFilters.status) setSelectedStatus(newFilters.status);
            }}
            onSearchChange={(search) => setSearchTerm(search)}
            searchPlaceholder="Search by student name..."
          />
        </Paper>

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
              <>
                {attendances.length === 0 ? (
                  <Alert severity="info">
                    <AlertTitle>No Attendance Records</AlertTitle>
                    No attendance records found for {new Date(selectedDate).toLocaleDateString()}
                  </Alert>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Student</TableCell>
                          <TableCell>Class</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Remarks</TableCell>
                          <TableCell>Marked By</TableCell>
                          <TableCell align="right">Actions</TableCell>
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
                                {...(attendance.status === 'present'
                                  ? { icon: <CheckCircleIcon sx={{ fontSize: 14 }} /> }
                                  : attendance.status === 'absent' || attendance.status === 'late'
                                  ? { icon: <WarningIcon sx={{ fontSize: 14 }} /> }
                                  : {})}
                                color={
                                  attendance.status === 'present'
                                    ? 'success'
                                    : attendance.status === 'absent'
                                    ? 'error'
                                    : attendance.status === 'late'
                                    ? 'warning'
                                    : 'default'
                                }
                              />
                            </TableCell>
                            <TableCell>{new Date(attendance.date).toLocaleDateString()}</TableCell>
                            <TableCell>{attendance.remarks || '-'}</TableCell>
                            <TableCell>{attendance.marked_by?.full_name || '-'}</TableCell>
                            <TableCell align="right">
                              <IconButton size="small" onClick={() => handleViewDetails(attendance)}>
                                <EditIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
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
                  <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          type="date"
                          label="Start Date"
                          value={dateRangeStart}
                          onChange={(e) => setDateRangeStart(e.target.value)}
                          size="small"
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          type="date"
                          label="End Date"
                          value={dateRangeEnd}
                          onChange={(e) => setDateRangeEnd(e.target.value)}
                          size="small"
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small">
                          <InputLabel>View Type</InputLabel>
                          <Select value={viewMode} label="View Type" onChange={(e) => setViewMode(e.target.value as 'line' | 'area' | 'bar')}>
                            <MenuItem value="line">Line Chart</MenuItem>
                            <MenuItem value="area">Area Chart</MenuItem>
                            <MenuItem value="bar">Bar Chart</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TrendingUpIcon sx={{ color: 'primary.main' }} />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Attendance Trend ({new Date(dateRangeStart).toLocaleDateString()} - {new Date(dateRangeEnd).toLocaleDateString()})
                          </Typography>
                        </Box>
                      </Box>
                      {isRangeLoading ? (
                        <LinearProgress />
                      ) : dailyAttendanceData.length === 0 ? (
                        <Alert severity="info">No attendance data available for the selected date range.</Alert>
                      ) : viewMode === 'line' ? (
                        <ResponsiveContainer width="100%" height={400}>
                          <LineChart data={dailyAttendanceData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Line type="monotone" dataKey="present" stroke="#66BB6A" strokeWidth={2} name="Present" dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="absent" stroke="#EF5350" strokeWidth={2} name="Absent" dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="late" stroke="#FFA726" strokeWidth={2} name="Late" dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="excused" stroke="#9E9E9E" strokeWidth={2} name="Excused" dot={{ r: 4 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : viewMode === 'area' ? (
                        <ResponsiveContainer width="100%" height={400}>
                          <AreaChart data={dailyAttendanceData}>
                            <defs>
                              <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#66BB6A" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#66BB6A" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#EF5350" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#EF5350" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FFA726" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#FFA726" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="colorExcused" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#9E9E9E" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#9E9E9E" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Area type="monotone" dataKey="present" stackId="1" stroke="#66BB6A" fill="url(#colorPresent)" fillOpacity={0.6} name="Present" />
                            <Area type="monotone" dataKey="absent" stackId="1" stroke="#EF5350" fill="url(#colorAbsent)" fillOpacity={0.6} name="Absent" />
                            <Area type="monotone" dataKey="late" stackId="1" stroke="#FFA726" fill="url(#colorLate)" fillOpacity={0.6} name="Late" />
                            <Area type="monotone" dataKey="excused" stackId="1" stroke="#9E9E9E" fill="url(#colorExcused)" fillOpacity={0.6} name="Excused" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart data={dailyAttendanceData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Bar dataKey="present" stackId="a" fill="#66BB6A" name="Present" />
                            <Bar dataKey="absent" stackId="a" fill="#EF5350" name="Absent" />
                            <Bar dataKey="late" stackId="a" fill="#FFA726" name="Late" />
                            <Bar dataKey="excused" stackId="a" fill="#9E9E9E" name="Excused" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* Chronic Absenteeism Tab */}
            {tabValue === 3 && (
              <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <WarningIcon sx={{ color: 'warning.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Chronic Absenteeism Risk</Typography>
                    {metricsData?.chronic_absenteeism_count && (
                      <Chip
                        label={`${metricsData.chronic_absenteeism_count} At Risk`}
                        color="error"
                        size="small"
                        sx={{ ml: 'auto' }}
                      />
                    )}
                  </Box>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Students with 10% or more absences in the last 30 days are flagged as at risk. Risk Index:{' '}
                    {metricsData?.chronic_absenteeism_risk_index || 0}%
                  </Alert>
                  {chronicAbsenteeismData.length === 0 ? (
                    <Alert severity="success">
                      <AlertTitle>No Chronic Absenteeism Issues</AlertTitle>
                      Great news! No students are currently flagged for chronic absenteeism.
                    </Alert>
                  ) : (
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
                          {chronicAbsenteeismData.map((item: any, index: number) => (
                            <TableRow key={index} hover>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <PeopleIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                  {item.student}
                                </Box>
                              </TableCell>
                              <TableCell>{item.class}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {item.absences}
                                  </Typography>
                                  {item.absences >= 10 && <WarningIcon sx={{ color: 'error.main', fontSize: 18 }} />}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={item.riskLevel}
                                  color={
                                    item.riskLevel === 'Critical'
                                      ? 'error'
                                      : item.riskLevel === 'High'
                                      ? 'warning'
                                      : 'default'
                                  }
                                  size="small"
                                  icon={
                                    item.riskLevel === 'Critical' || item.riskLevel === 'High' ? (
                                      <WarningIcon sx={{ fontSize: 14 }} />
                                    ) : (
                                      <CheckCircleIcon sx={{ fontSize: 14 }} />
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="small"
                                  startIcon={<SendIcon />}
                                  onClick={() => item.alertId && sendAlertMutation.mutate(item.alertId)}
                                  disabled={sendAlertMutation.isPending}
                                >
                                  Send Alert
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            )}
          </Box>
        </Paper>

        {/* Attendance Detail Dialog */}
        <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Attendance Record</DialogTitle>
          <DialogContent>
            {selectedAttendance && (
              <Box sx={{ pt: 2 }}>
                <TextField
                  fullWidth
                  label="Student"
                  value={selectedAttendance.student?.user?.full_name || selectedAttendance.student_name || ''}
                  disabled
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Class"
                  value={selectedAttendance.class_obj?.name || selectedAttendance.class_name || ''}
                  disabled
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={selectedAttendance.date || ''}
                  disabled
                  sx={{ mb: 2 }}
                  InputLabelProps={{ shrink: true }}
                />
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    label="Status"
                    value={selectedAttendance.status || 'present'}
                    onChange={(e) =>
                      setSelectedAttendance({ ...selectedAttendance, status: e.target.value })
                    }
                  >
                    <MenuItem value="present">Present</MenuItem>
                    <MenuItem value="absent">Absent</MenuItem>
                    <MenuItem value="late">Late</MenuItem>
                    <MenuItem value="excused">Excused</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Remarks"
                  multiline
                  rows={3}
                  value={selectedAttendance.remarks || ''}
                  onChange={(e) => setSelectedAttendance({ ...selectedAttendance, remarks: e.target.value })}
                  sx={{ mb: 2 }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => {
                if (selectedAttendance) {
                  updateAttendanceMutation.mutate({
                    id: selectedAttendance.id,
                    data: {
                      status: selectedAttendance.status,
                      remarks: selectedAttendance.remarks,
                    },
                  });
                }
              }}
              disabled={updateAttendanceMutation.isPending}
            >
              {updateAttendanceMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default AttendanceIntelligence;

