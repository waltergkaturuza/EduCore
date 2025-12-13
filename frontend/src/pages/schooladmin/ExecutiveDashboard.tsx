/**
 * Executive School Dashboard (Command Center)
 * Real-time decision-making cockpit for school administrators
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
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  AttachMoney as AttachMoneyIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { schooladminService, DashboardMetrics } from '../../services/schooladmin';
import Layout from '../../components/Layout';

const COLORS = ['#1976D2', '#42A5F5', '#66BB6A', '#FFA726', '#EF5350', '#AB47BC'];

const ExecutiveDashboard: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);

  const { data: metricsData, isLoading, error, refetch } = useQuery<DashboardMetrics>({
    queryKey: ['dashboardMetrics'],
    queryFn: async () => {
      try {
        const data = await schooladminService.getLatestMetrics();
        console.log('Dashboard metrics received:', data);
        return data;
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
        throw err;
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 1,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await schooladminService.calculateMetrics();
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <Layout>
        <Box sx={{ p: 3 }}>
          <LinearProgress />
          <Typography sx={{ mt: 2 }}>Loading dashboard metrics...</Typography>
        </Box>
      </Layout>
    );
  }

  if (error) {
    console.error('Dashboard metrics error:', error);
    return (
      <Layout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            <AlertTitle>Error</AlertTitle>
            Failed to load dashboard metrics: {error instanceof Error ? error.message : 'Unknown error'}. Please try again.
          </Alert>
          <Button variant="contained" onClick={() => refetch()} sx={{ mt: 2 }}>
            Retry
          </Button>
        </Box>
      </Layout>
    );
  }

  if (!metricsData) {
    return (
      <Layout>
        <Box sx={{ p: 3 }}>
          <Alert severity="info">
            <AlertTitle>No Data</AlertTitle>
            No dashboard metrics available. Click refresh to calculate metrics.
          </Alert>
          <Button variant="contained" onClick={handleRefresh} sx={{ mt: 2 }}>
            Calculate Metrics
          </Button>
        </Box>
      </Layout>
    );
  }

  const metrics = metricsData as DashboardMetrics;

  // Handle case where metrics might be empty or have default values
  if (!metrics || Object.keys(metrics).length === 0) {
    return (
      <Layout>
        <Box sx={{ p: 3 }}>
          <Alert severity="info">
            <AlertTitle>No Metrics</AlertTitle>
            Dashboard metrics are being calculated. Please wait or click refresh.
          </Alert>
          <Button variant="contained" onClick={handleRefresh} sx={{ mt: 2 }}>
            Calculate Metrics
          </Button>
        </Box>
      </Layout>
    );
  }

  // Prepare chart data
  const enrollmentByGenderData = Object.entries(metrics.enrollment_by_gender || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const enrollmentByGradeData = Object.entries(metrics.enrollment_by_grade || {})
    .slice(0, 10)
    .map(([name, value]) => ({
      name,
      value,
    }));

  const revenueForecastData = Object.entries(metrics.revenue_forecast || {}).map(([name, value]) => ({
    month: name,
    revenue: value,
  }));

  // Helper function to safely convert to number
  const toNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (value === null || value === undefined) return 0;
    const parsed = Number(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Ensure we have valid numeric values for display
  const safeMetrics = {
    total_enrollment: toNumber(metrics.total_enrollment),
    enrollment_by_gender: metrics.enrollment_by_gender || {},
    enrollment_by_grade: metrics.enrollment_by_grade || {},
    teacher_utilization_ratio: toNumber(metrics.teacher_utilization_ratio),
    student_teacher_ratio: toNumber(metrics.student_teacher_ratio),
    active_teachers: toNumber(metrics.active_teachers),
    total_teachers: toNumber(metrics.total_teachers),
    attendance_percentage_today: toNumber(metrics.attendance_percentage_today),
    attendance_today: toNumber(metrics.attendance_today),
    academic_performance_index: toNumber(metrics.academic_performance_index),
    average_grade: toNumber(metrics.average_grade),
    fee_collection_vs_target: toNumber(metrics.fee_collection_vs_target),
    fee_collection_today: toNumber(metrics.fee_collection_today),
    chronic_absenteeism_risk_index: toNumber(metrics.chronic_absenteeism_risk_index),
    chronic_absenteeism_count: toNumber(metrics.chronic_absenteeism_count),
    outstanding_fees_30_days: toNumber(metrics.outstanding_fees_30_days),
    outstanding_fees_60_days: toNumber(metrics.outstanding_fees_60_days),
    outstanding_fees_90_days: toNumber(metrics.outstanding_fees_90_days),
    compliance_alerts: Array.isArray(metrics.compliance_alerts) ? metrics.compliance_alerts : [],
    at_risk_students: Array.isArray(metrics.at_risk_students) ? metrics.at_risk_students : [],
    revenue_forecast: metrics.revenue_forecast || {},
  };

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, background: 'linear-gradient(45deg, #1976D2 30%, #42A5F5 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Executive Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time decision-making cockpit
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{ borderRadius: 2 }}
          >
            Refresh Metrics
          </Button>
        </Box>

        {/* Strategic Widgets */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Total Enrollment */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Enrollment</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                      {safeMetrics.total_enrollment}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <PeopleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        {(safeMetrics.enrollment_by_gender as any)?.male || 0}M / {(safeMetrics.enrollment_by_gender as any)?.female || 0}F
                      </Typography>
                    </Box>
                  </Box>
                  <PeopleIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Teacher Utilization */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Teacher Utilization</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                      {safeMetrics.teacher_utilization_ratio.toFixed(1)}%
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <SchoolIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        {safeMetrics.active_teachers}/{safeMetrics.total_teachers} Active
                      </Typography>
                    </Box>
                  </Box>
                  <SchoolIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Student-Teacher Ratio */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Student-Teacher Ratio</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                      {safeMetrics.student_teacher_ratio.toFixed(1)}:1
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {safeMetrics.student_teacher_ratio <= 25 ? (
                        <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      ) : (
                        <WarningIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      )}
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        {safeMetrics.student_teacher_ratio <= 25 ? 'Optimal' : 'High'}
                      </Typography>
                    </Box>
                  </Box>
                  <SchoolIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Attendance Today */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white', borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Attendance Today</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                      {safeMetrics.attendance_percentage_today.toFixed(1)}%
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        {safeMetrics.attendance_today} present
                      </Typography>
                    </Box>
                  </Box>
                  <CheckCircleIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Academic Performance */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Academic Performance Index</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: safeMetrics.academic_performance_index >= 70 ? 'success.main' : 'warning.main' }}>
                  {safeMetrics.academic_performance_index.toFixed(1)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={safeMetrics.academic_performance_index}
                  sx={{ mt: 2, height: 8, borderRadius: 4 }}
                  color={safeMetrics.academic_performance_index >= 70 ? 'success' : 'warning'}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Average Grade: {safeMetrics.average_grade.toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Fee Collection */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Fee Collection vs Target</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: safeMetrics.fee_collection_vs_target >= 80 ? 'success.main' : 'warning.main' }}>
                  {safeMetrics.fee_collection_vs_target.toFixed(1)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={safeMetrics.fee_collection_vs_target}
                  sx={{ mt: 2, height: 8, borderRadius: 4 }}
                  color={safeMetrics.fee_collection_vs_target >= 80 ? 'success' : 'warning'}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Today: ${safeMetrics.fee_collection_today.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Chronic Absenteeism */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 3, border: safeMetrics.chronic_absenteeism_risk_index > 10 ? '2px solid' : 'none', borderColor: 'error.main' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Chronic Absenteeism Risk</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: safeMetrics.chronic_absenteeism_risk_index > 10 ? 'error.main' : 'text.primary' }}>
                  {safeMetrics.chronic_absenteeism_risk_index.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {safeMetrics.chronic_absenteeism_count} students at risk
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Outstanding Fees */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Outstanding Fees</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                  ${(safeMetrics.outstanding_fees_30_days + safeMetrics.outstanding_fees_60_days + safeMetrics.outstanding_fees_90_days).toFixed(2)}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip label={`30d: $${safeMetrics.outstanding_fees_30_days.toFixed(2)}`} size="small" sx={{ mr: 0.5 }} />
                  <Chip label={`60d: $${safeMetrics.outstanding_fees_60_days.toFixed(2)}`} size="small" sx={{ mr: 0.5 }} />
                  <Chip label={`90d: $${safeMetrics.outstanding_fees_90_days.toFixed(2)}`} size="small" color="error" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts Row */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Enrollment by Gender */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Enrollment by Gender</Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={enrollmentByGenderData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: any) => {
                        const { name, percent } = props;
                        return `${name || ''}: ${((percent || 0) * 100).toFixed(1)}%`;
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {enrollmentByGenderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Enrollment by Grade */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Enrollment by Grade</Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={enrollmentByGradeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="value" stroke="#1976D2" fill="#42A5F5" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Revenue Forecast */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Revenue Forecast</Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={revenueForecastData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#66BB6A" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Compliance Alerts */}
        {safeMetrics.compliance_alerts && safeMetrics.compliance_alerts.length > 0 && (
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Compliance Alerts</Typography>
              {(safeMetrics.compliance_alerts || []).map((alert: any, index: number) => (
                <Alert
                  key={index}
                  severity={alert.severity === 'high' ? 'error' : alert.severity === 'medium' ? 'warning' : 'info'}
                  sx={{ mb: 1 }}
                >
                  <AlertTitle>{alert.type}</AlertTitle>
                  {alert.message}
                </Alert>
              ))}
            </CardContent>
          </Card>
        )}

        {/* At-Risk Students */}
        {safeMetrics.at_risk_students && safeMetrics.at_risk_students.length > 0 && (
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>At-Risk Students</Typography>
              <Grid container spacing={2}>
                {safeMetrics.at_risk_students.slice(0, 6).map((student: any, index: number) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {student.student_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Risk Score: {student.risk_score}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {student.risk_factors.map((factor: string, idx: number) => (
                            <Chip key={idx} label={factor} size="small" color="error" sx={{ mr: 0.5, mb: 0.5 }} />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}
      </Box>
    </Layout>
  );
};

export default ExecutiveDashboard;

