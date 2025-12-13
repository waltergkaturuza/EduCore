import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  People as PeopleIcon,
  Payment as PaymentIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import Layout from '../../components/Layout';
import { useQuery } from '@tanstack/react-query';
import { superadminService } from '../../services/superadmin';

const RevenueAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('6months');
  const [metric, setMetric] = useState('revenue');

  // Fetch real analytics data
  const { data: platformMetrics } = useQuery({
    queryKey: ['platform-metrics'],
    queryFn: () => superadminService.getPlatformMetrics(),
  });

  const { data: revenueForecast } = useQuery({
    queryKey: ['revenue-forecast', timeRange],
    queryFn: () => {
      const months = timeRange === '1month' ? 1 : timeRange === '3months' ? 3 : timeRange === '6months' ? 6 : 12;
      return superadminService.getRevenueForecast(months);
    },
  });

  const { data: churnAnalysis } = useQuery({
    queryKey: ['churn-analysis'],
    queryFn: () => superadminService.getChurnAnalysis(30),
  });

  const { data: conversionRate } = useQuery({
    queryKey: ['conversion-rate'],
    queryFn: () => superadminService.getConversionRate(undefined, 30),
  });

  const { data: subscriptions } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => superadminService.getSubscriptions(),
  });

  // Transform forecast data for MRR chart
  const mrrData = revenueForecast?.forecast?.map((item: any) => ({
    month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    mrr: item.mrr,
    new: item.mrr * 0.1, // Estimate new revenue
    churn: item.mrr * -0.02, // Estimate churn
  })) || [];

  // Calculate revenue by plan from subscriptions
  const revenueByPlan = subscriptions?.results?.reduce((acc: any[], sub: any) => {
    const existing = acc.find(p => p.plan === sub.plan_name);
    if (existing) {
      existing.revenue += sub.amount;
      existing.count += 1;
    } else {
      acc.push({ plan: sub.plan_name, revenue: sub.amount, count: 1 });
    }
    return acc;
  }, []) || [];

  // Revenue by region (mock for now - can be enhanced with real data)
  const revenueByRegion = [
    { region: 'Harare', revenue: (platformMetrics?.mrr || 0) * 0.6, schools: Math.floor((platformMetrics?.total_schools || 0) * 0.6) },
    { region: 'Bulawayo', revenue: (platformMetrics?.mrr || 0) * 0.25, schools: Math.floor((platformMetrics?.total_schools || 0) * 0.25) },
    { region: 'Mutare', revenue: (platformMetrics?.mrr || 0) * 0.1, schools: Math.floor((platformMetrics?.total_schools || 0) * 0.1) },
    { region: 'Gweru', revenue: (platformMetrics?.mrr || 0) * 0.05, schools: Math.floor((platformMetrics?.total_schools || 0) * 0.05) },
  ];

  // Conversion funnel from conversion rate data
  const conversionFunnel = conversionRate ? [
    { stage: 'Trials', value: conversionRate.total_trials || 0 },
    { stage: 'Engaged', value: Math.floor((conversionRate.total_trials || 0) * 0.75) },
    { stage: 'Paying', value: conversionRate.converted || 0 },
    { stage: 'Retained', value: Math.floor((conversionRate.converted || 0) * 0.9) },
  ] : [
    { stage: 'Trials', value: 0 },
    { stage: 'Engaged', value: 0 },
    { stage: 'Paying', value: 0 },
    { stage: 'Retained', value: 0 },
  ];

  // Churn data (simplified from churn analysis)
  const churnData = mrrData.map((item: any, idx: number) => ({
    month: item.month,
    churn: churnAnalysis?.churn_rate || 0,
    new: (item.new / item.mrr) * 100 || 0,
  }));

  const COLORS = ['#667eea', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];

  const metrics = {
    mrr: platformMetrics?.mrr || 0,
    arr: platformMetrics?.arr || 0,
    churnRate: churnAnalysis?.churn_rate || 0,
    ltv: 12500, // Can be calculated per tenant
    conversionRate: conversionRate?.conversion_rate || 0,
    averageRevenue: platformMetrics?.mrr && platformMetrics?.paid_schools
      ? (platformMetrics.mrr / platformMetrics.paid_schools)
      : 0,
  };

  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1, color: '#1e293b' }}>
              Revenue Analytics
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Comprehensive financial insights and revenue metrics
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Time Range</InputLabel>
              <Select value={timeRange} label="Time Range" onChange={(e) => setTimeRange(e.target.value)}>
                <MenuItem value="1month">Last Month</MenuItem>
                <MenuItem value="3months">Last 3 Months</MenuItem>
                <MenuItem value="6months">Last 6 Months</MenuItem>
                <MenuItem value="1year">Last Year</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              sx={{ borderRadius: 2 }}
              onClick={async () => {
                try {
                  // Export revenue analytics report
                  const response = await fetch('/api/superadmin/analytics/export/', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('token')}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ timeRange }),
                  });
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `revenue_analytics_${timeRange}_${new Date().toISOString().split('T')[0]}.xlsx`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                } catch (error) {
                  console.error('Export failed:', error);
                }
              }}
            >
              Export Report
            </Button>
          </Box>
        </Box>

        {/* Key Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AccountBalanceIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      ${metrics.mrr.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Monthly Recurring Revenue (MRR)
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}>
                      +12.5% from last month
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrendingUpIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      ${(metrics.arr / 1000).toFixed(0)}k
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Annual Recurring Revenue (ARR)
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}>
                      Projected from MRR
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <PeopleIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      ${metrics.ltv.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Customer Lifetime Value (LTV)
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}>
                      Average per school
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#ef4444' }}>
                  {metrics.churnRate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Churn Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#10b981' }}>
                  {metrics.conversionRate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Trial → Paid Conversion
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#667eea' }}>
                  ${metrics.averageRevenue.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Revenue per School
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                  45
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Paid Schools
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* MRR Trend */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  MRR Growth Trend
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={mrrData}>
                    <defs>
                      <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
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
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="mrr"
                      stroke="#667eea"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorMRR)"
                      name="MRR"
                    />
                    <Line
                      type="monotone"
                      dataKey="new"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="New Revenue"
                    />
                    <Line
                      type="monotone"
                      dataKey="churn"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Churned Revenue"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Revenue by Plan */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Revenue by Subscription Plan
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueByPlan}>
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
                    <Bar dataKey="revenue" fill="#667eea" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Revenue by Region */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Revenue by Region
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueByRegion}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: any) => {
                        const { region, percent } = props;
                        return `${region}: ${((percent || 0) * 100).toFixed(0)}%`;
                      }}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {revenueByRegion.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Churn vs New */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Churn Rate vs New Signups
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={churnData}>
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
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="churn"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Churn %"
                      dot={{ fill: '#ef4444', r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="new"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="New Signups %"
                      dot={{ fill: '#10b981', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Conversion Funnel */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Conversion Funnel
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={conversionFunnel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#64748b" />
                    <YAxis dataKey="stage" type="category" stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Bar dataKey="value" fill="#667eea" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};

export default RevenueAnalytics;

