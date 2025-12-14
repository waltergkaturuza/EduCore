import React, { useState, useMemo } from 'react';
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
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Switch,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  CreditCard as CreditCardIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../../components/Layout';
import { superadminService } from '../../services/superadmin';
import AdvancedFilter, { FilterField } from '../../components/AdvancedFilter';

interface SubscriptionPlan {
  id: number;
  name: string;
  price_monthly: number;
  price_yearly: number;
  max_students: number;
  max_teachers: number;
  features: string[] | Record<string, any>;
  is_active: boolean;
}

interface SchoolSubscription {
  id: number;
  school_name: string;
  plan_name: string;
  status: 'active' | 'trial' | 'expired' | 'cancelled';
  billing_cycle: 'monthly' | 'yearly';
  amount: number;
  next_billing_date: string;
  trial_ends_at?: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  school_name: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  due_date: string;
  paid_date?: string;
}

const SubscriptionBilling: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [search, setSearch] = useState('');

  // Fetch real data
  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => superadminService.getSubscriptionPlans(),
  });

  const { data: subscriptionsData, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['subscriptions', filters, search],
    queryFn: () => {
      const params: any = { ...filters };
      if (search) params.search = search;
      return superadminService.getSubscriptions(params);
    },
  });

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices', filters, search],
    queryFn: () => {
      const params: any = { ...filters };
      if (search) params.search = search;
      return superadminService.getInvoices(params);
    },
  });

  // Fetch platform metrics for overview cards
  const { data: metricsData } = useQuery({
    queryKey: ['platform-metrics'],
    queryFn: () => superadminService.getPlatformMetrics(),
  });

  // Fetch revenue analytics
  const { data: revenueAnalyticsData } = useQuery({
    queryKey: ['revenue-analytics'],
    queryFn: () => superadminService.getRevenueForecast(6),
    enabled: false, // Disable if endpoint doesn't exist yet - will calculate from subscriptions
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      return superadminService.deleteSubscriptionPlan(planId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    },
  });

  const deleteSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: number) => {
      return superadminService.cancelSubscription(subscriptionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });

  const handleDeletePlan = (planId: number) => {
    if (window.confirm('Are you sure you want to delete this subscription plan?')) {
      deletePlanMutation.mutate(planId);
    }
  };

  const handleDeleteSubscription = (subscriptionId: number) => {
    if (window.confirm('Are you sure you want to cancel this subscription?')) {
      deleteSubscriptionMutation.mutate(subscriptionId);
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceDialogOpen(true);
  };

  const filterFields: FilterField[] = [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'trial', label: 'Trial' },
        { value: 'expired', label: 'Expired' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
    {
      name: 'billing_cycle',
      label: 'Billing Cycle',
      type: 'select',
      options: [
        { value: 'monthly', label: 'Monthly' },
        { value: 'yearly', label: 'Yearly' },
      ],
    },
  ];

  // Process plans data from backend - NO MOCK DATA
  const plans: SubscriptionPlan[] = plansData?.results 
    ? plansData.results.map((plan: any) => ({
        ...plan,
        features: Array.isArray(plan.features) 
          ? plan.features 
          : typeof plan.features === 'object' && plan.features !== null
          ? Object.keys(plan.features).filter((key: string) => plan.features[key] === true)
          : [],
      }))
    : [];

  // Process subscriptions data from backend - NO MOCK DATA
  const subscriptions: SchoolSubscription[] = useMemo(() => {
    return subscriptionsData?.results?.map((sub: any) => ({
      id: sub.id,
      school_name: sub.tenant_name || sub.school_name || 'Unknown School',
      plan_name: sub.plan_name || sub.plan?.name || 'No Plan',
      status: sub.status,
      billing_cycle: sub.billing_cycle,
      amount: sub.amount || (sub.billing_cycle === 'yearly' ? sub.plan?.price_yearly : sub.plan?.price_monthly) || 0,
      next_billing_date: sub.next_billing_date,
      trial_ends_at: sub.trial_ends_at,
    })) || [];
  }, [subscriptionsData]);

  // Process invoices data from backend - NO MOCK DATA
  const invoices: Invoice[] = invoicesData?.results?.map((inv: any) => ({
    id: inv.id,
    invoice_number: inv.invoice_number,
    school_name: inv.tenant_name || inv.school_name || 'Unknown School',
    amount: inv.total || inv.amount || 0,
    status: inv.status,
    due_date: inv.due_date,
    paid_date: inv.paid_date,
  })) || [];

  // Calculate revenue data from analytics or subscriptions - NO MOCK DATA
  const revenueData = useMemo(() => {
    if (revenueAnalyticsData?.monthly_data && Array.isArray(revenueAnalyticsData.monthly_data)) {
      return revenueAnalyticsData.monthly_data.map((item: any) => ({
        month: new Date(item.month).toLocaleDateString('en-US', { month: 'short' }),
        revenue: item.revenue || 0,
        subscriptions: item.subscriptions_count || 0,
      }));
    }
    
    // Fallback: calculate from subscriptions if analytics not available
    if (subscriptions.length > 0) {
      const monthlyData: Record<string, { revenue: number; subscriptions: number }> = {};
      subscriptions.forEach((sub: SchoolSubscription) => {
        if (sub.status === 'active' || sub.status === 'trial') {
          const monthKey = sub.next_billing_date 
            ? new Date(sub.next_billing_date).toLocaleDateString('en-US', { month: 'short' })
            : new Date().toLocaleDateString('en-US', { month: 'short' });
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { revenue: 0, subscriptions: 0 };
          }
          // Calculate monthly equivalent
          const monthlyAmount = sub.billing_cycle === 'yearly' ? sub.amount / 12 : sub.amount;
          monthlyData[monthKey].revenue += monthlyAmount;
          monthlyData[monthKey].subscriptions += 1;
        }
      });
      return Object.entries(monthlyData)
        .sort(([a], [b]) => {
          const dateA = new Date(a + ' 1, 2024');
          const dateB = new Date(b + ' 1, 2024');
          return dateA.getTime() - dateB.getTime();
        })
        .slice(-6)
        .map(([month, data]) => ({
          month,
          revenue: Math.round(data.revenue),
          subscriptions: data.subscriptions,
        }));
    }
    
    return [];
  }, [revenueAnalyticsData, subscriptions]);

  // Calculate plan distribution from subscriptions - NO MOCK DATA
  const planDistribution = useMemo(() => {
    const distribution: Record<string, { count: number; revenue: number }> = {};
    
    subscriptions.forEach((sub: SchoolSubscription) => {
      if (sub.status === 'active' || sub.status === 'trial') {
        const planName = sub.plan_name;
        if (!distribution[planName]) {
          distribution[planName] = { count: 0, revenue: 0 };
        }
        distribution[planName].count += 1;
        // Calculate monthly equivalent revenue
        const monthlyAmount = sub.billing_cycle === 'yearly' ? sub.amount / 12 : sub.amount;
        distribution[planName].revenue += monthlyAmount;
      }
    });
    
    return Object.entries(distribution).map(([name, data]) => ({
      name,
      value: data.count,
      revenue: Math.round(data.revenue),
    }));
  }, [subscriptions]);

  const COLORS = ['#667eea', '#ec4899', '#10b981', '#f59e0b'];

  // Calculate overview metrics from backend data
  const calculatedMRR = useMemo(() => {
    // Calculate MRR from active subscriptions
    return subscriptions
      .filter(s => s.status === 'active' || s.status === 'trial')
      .reduce((total, sub) => {
        const monthlyAmount = sub.billing_cycle === 'yearly' ? sub.amount / 12 : sub.amount;
        return total + monthlyAmount;
      }, 0);
  }, [subscriptions]);

  const mrr = metricsData?.mrr || calculatedMRR;
  const arr = metricsData?.arr || (calculatedMRR * 12);
  const paidSchools = metricsData?.paid_schools || subscriptions.filter(s => s.status === 'active' && s.plan_name !== 'Free').length;
  const totalSchools = subscriptions.length;
  const conversionRate = totalSchools > 0 ? ((paidSchools / totalSchools) * 100).toFixed(0) : '0';
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;

  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1, color: '#1e293b' }}>
              Subscription & Billing Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage subscription plans, school subscriptions, and invoices
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setPlanDialogOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
              },
            }}
          >
            New Plan
          </Button>
        </Box>

        {/* Revenue Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <PaymentIcon />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      ${mrr.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Monthly Recurring Revenue
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <TrendingUpIcon />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      ${(arr / 1000000).toFixed(2)}M
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Annual Recurring Revenue
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <CreditCardIcon />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {conversionRate}%
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Paid Conversion Rate
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <ReceiptIcon />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {overdueInvoices}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Overdue Invoices
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="Subscription Plans" />
            <Tab label="School Subscriptions" />
            <Tab label="Invoices" />
            <Tab label="Analytics" />
          </Tabs>
        </Paper>

        {/* Subscription Plans Tab */}
        {tabValue === 0 && (
          <>
            {plansLoading ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <LinearProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Loading subscription plans...
                </Typography>
              </Paper>
            ) : plans.length > 0 ? (
              <Grid container spacing={3}>
                {plans.map((plan) => (
              <Grid item xs={12} md={6} lg={3} key={plan.id}>
                <Card
                  sx={{
                    height: '100%',
                    position: 'relative',
                    border: plan.name === 'Enterprise' ? '2px solid #667eea' : '1px solid #e2e8f0',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {plan.name}
                      </Typography>
                      <Switch checked={plan.is_active} size="small" />
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea' }}>
                        ${plan.price_monthly}
                        <Typography component="span" variant="body2" color="text.secondary">
                          /month
                        </Typography>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ${plan.price_yearly}/year (save {plan.price_yearly > 0 ? Math.round(((plan.price_monthly * 12 - plan.price_yearly) / (plan.price_monthly * 12)) * 100) : 0}%)
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Max Students:</strong> {plan.max_students === -1 ? 'Unlimited' : plan.max_students}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Max Teachers:</strong> {plan.max_teachers === -1 ? 'Unlimited' : plan.max_teachers}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        Features:
                      </Typography>
                      {plan.features.map((feature: string, idx: number) => (
                        <Typography key={idx} variant="body2" sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircleIcon sx={{ fontSize: 16, color: '#10b981' }} />
                          {feature}
                        </Typography>
                      ))}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => {
                          setPlanDialogOpen(true);
                          navigate(`/superadmin/subscriptions/plan/${plan.id}`);
                        }}
                        fullWidth
                      >
                        Edit
                      </Button>
                      <Tooltip title="Delete Plan">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeletePlan(plan.id)}
                          disabled={deletePlanMutation.isPending}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No Subscription Plans Found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create your first subscription plan to get started
                </Typography>
              </Paper>
            )}
          </>
        )}

        {/* School Subscriptions Tab */}
        {tabValue === 1 && (
          <>
            <Box sx={{ mb: 2 }}>
              <AdvancedFilter
                fields={filterFields}
                onFilterChange={(newFilters) => setFilters(newFilters)}
                onSearchChange={(searchTerm) => setSearch(searchTerm)}
                searchPlaceholder="Search by school name..."
              />
            </Box>
            {subscriptionsLoading ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <LinearProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Loading subscriptions...
                </Typography>
              </Paper>
            ) : subscriptions.length > 0 ? (
              <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                <Table>
              <TableHead>
                <TableRow sx={{ background: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 600 }}>School</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Plan</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Billing Cycle</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Next Billing</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell sx={{ fontWeight: 500 }}>{sub.school_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={sub.plan_name}
                        size="small"
                        sx={{
                          fontWeight: 500,
                          borderRadius: 2,
                          background:
                            sub.plan_name === 'Enterprise'
                              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                              : sub.plan_name === 'Premium'
                              ? 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)'
                              : undefined,
                          color: sub.plan_name !== 'Free' && sub.plan_name !== 'Basic' ? 'white' : undefined,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={sub.status}
                        size="small"
                        color={
                          sub.status === 'active'
                            ? 'success'
                            : sub.status === 'trial'
                            ? 'warning'
                            : 'default'
                        }
                        sx={{ fontWeight: 500, borderRadius: 2 }}
                      />
                    </TableCell>
                    <TableCell>{sub.billing_cycle}</TableCell>
                    <TableCell>${sub.amount}</TableCell>
                    <TableCell>
                      {sub.trial_ends_at ? (
                        <Box>
                          <Typography variant="body2">Trial ends: {sub.trial_ends_at}</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={75}
                            sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                          />
                        </Box>
                      ) : (
                        sub.next_billing_date
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Tooltip title="Edit Subscription">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/superadmin/subscriptions/${sub.id}`)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel Subscription">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteSubscription(sub.id)}
                            disabled={deleteSubscriptionMutation.isPending}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No Subscriptions Found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {search || Object.keys(filters).length > 0
                    ? 'Try adjusting your filters or search terms'
                    : 'No school subscriptions yet'}
                </Typography>
              </Paper>
            )}
          </>
        )}

        {/* Invoices Tab */}
        {tabValue === 2 && (
          <>
            <Box sx={{ mb: 2 }}>
              <AdvancedFilter
                fields={[
                  {
                    name: 'status',
                    label: 'Invoice Status',
                    type: 'select',
                    options: [
                      { value: 'paid', label: 'Paid' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'overdue', label: 'Overdue' },
                    ],
                  },
                ]}
                onFilterChange={(newFilters) => setFilters(newFilters)}
                onSearchChange={(searchTerm) => setSearch(searchTerm)}
                searchPlaceholder="Search by invoice number or school..."
              />
            </Box>
            {invoicesLoading ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <LinearProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Loading invoices...
                </Typography>
              </Paper>
            ) : invoices.length > 0 ? (
              <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                <Table>
                  <TableHead>
                <TableRow sx={{ background: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Invoice #</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>School</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Paid Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell sx={{ fontWeight: 500 }}>{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.school_name}</TableCell>
                    <TableCell>${invoice.amount}</TableCell>
                    <TableCell>
                      <Chip
                        label={invoice.status}
                        size="small"
                        color={
                          invoice.status === 'paid'
                            ? 'success'
                            : invoice.status === 'overdue'
                            ? 'error'
                            : 'warning'
                        }
                        icon={
                          invoice.status === 'paid' ? (
                            <CheckCircleIcon />
                          ) : invoice.status === 'overdue' ? (
                            <WarningIcon />
                          ) : undefined
                        }
                        sx={{ fontWeight: 500, borderRadius: 2 }}
                      />
                    </TableCell>
                    <TableCell>{invoice.due_date}</TableCell>
                    <TableCell>{invoice.paid_date || '-'}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Tooltip title="View Invoice">
                          <IconButton
                            size="small"
                            onClick={() => handleViewInvoice(invoice)}
                          >
                            <ReceiptIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download PDF">
                          <IconButton size="small">
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No Invoices Found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {search || Object.keys(filters).length > 0
                    ? 'Try adjusting your filters or search terms'
                    : 'No invoices generated yet'}
                </Typography>
              </Paper>
            )}
          </>
        )}

        {/* Analytics Tab */}
        {tabValue === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Revenue & Subscription Growth
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>View Type</InputLabel>
                      <Select
                        value="area"
                        label="View Type"
                        onChange={() => {}}
                      >
                        <MenuItem value="area">Area Chart</MenuItem>
                        <MenuItem value="line">Line Chart</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  {revenueData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#667eea" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" />
                      <YAxis yAxisId="left" stroke="#64748b" />
                      <YAxis yAxisId="right" orientation="right" stroke="#64748b" />
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: 'none',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        stroke="#667eea"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="subscriptions"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: '#10b981', r: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  <Box sx={{ mt: 2 }}>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <RechartsTooltip
                          contentStyle={{
                            borderRadius: 8,
                            border: 'none',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#667eea"
                          strokeWidth={3}
                          dot={{ fill: '#667eea', r: 5 }}
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="subscriptions"
                          stroke="#10b981"
                          strokeWidth={3}
                          dot={{ fill: '#10b981', r: 5 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                    </>
                  ) : (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No revenue data available yet
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Plan Distribution
                  </Typography>
                  {planDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={planDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: any) => {
                          const { name, percent } = props;
                          return `${name}: ${((percent || 0) * 100).toFixed(0)}%`;
                        }}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {planDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  ) : (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No subscription data available yet
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Create/Edit Plan Dialog */}
        <Dialog
          open={planDialogOpen}
          onClose={() => setPlanDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 600, fontSize: '1.5rem' }}>
            Create Subscription Plan
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField fullWidth label="Plan Name" margin="normal" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth label="Monthly Price ($)" type="number" margin="normal" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="Yearly Price ($)" type="number" margin="normal" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth label="Max Students" type="number" margin="normal" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="Max Teachers" type="number" margin="normal" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button onClick={() => setPlanDialogOpen(false)} sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => setPlanDialogOpen(false)}
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                },
              }}
            >
              Save Plan
            </Button>
          </DialogActions>
        </Dialog>

        {/* Invoice Detail Dialog */}
        <Dialog
          open={invoiceDialogOpen}
          onClose={() => {
            setInvoiceDialogOpen(false);
            setSelectedInvoice(null);
          }}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 600, fontSize: '1.5rem' }}>
            Invoice Details
          </DialogTitle>
          <DialogContent>
            {selectedInvoice ? (
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Invoice Number
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                      {selectedInvoice.invoice_number}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={selectedInvoice.status}
                        color={
                          selectedInvoice.status === 'paid'
                            ? 'success'
                            : selectedInvoice.status === 'overdue'
                            ? 'error'
                            : 'warning'
                        }
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      School Name
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                      {selectedInvoice.school_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Amount
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                      ${selectedInvoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Due Date
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                      {selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString() : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Paid Date
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                      {selectedInvoice.paid_date ? new Date(selectedInvoice.paid_date).toLocaleDateString() : '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <Box sx={{ pt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No invoice selected
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button
              onClick={() => {
                setInvoiceDialogOpen(false);
                setSelectedInvoice(null);
              }}
              sx={{ borderRadius: 2 }}
            >
              Close
            </Button>
            {selectedInvoice && (
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => {
                  if (selectedInvoice) {
                    superadminService.downloadInvoice(selectedInvoice.id).then((blob) => {
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `${selectedInvoice.invoice_number}.pdf`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      window.URL.revokeObjectURL(url);
                    });
                  }
                }}
                sx={{
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                Download PDF
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default SubscriptionBilling;

