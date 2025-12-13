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

  const plans: SubscriptionPlan[] = plansData?.results 
    ? plansData.results.map((plan: any) => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : Object.keys(plan.features || {}),
      }))
    : [
    {
      id: 1,
      name: 'Free',
      price_monthly: 0,
      price_yearly: 0,
      max_students: 50,
      max_teachers: 5,
      features: ['Basic Features', 'Email Support'],
      is_active: true,
    },
    {
      id: 2,
      name: 'Basic',
      price_monthly: 50,
      price_yearly: 500,
      max_students: 200,
      max_teachers: 15,
      features: ['All Free Features', 'SMS Notifications', 'Priority Support'],
      is_active: true,
    },
    {
      id: 3,
      name: 'Premium',
      price_monthly: 150,
      price_yearly: 1500,
      max_students: 1000,
      max_teachers: 50,
      features: ['All Basic Features', 'Advanced Analytics', 'API Access', 'Custom Branding'],
      is_active: true,
    },
    {
      id: 4,
      name: 'Enterprise',
      price_monthly: 500,
      price_yearly: 5000,
      max_students: -1, // Unlimited
      max_teachers: -1,
      features: ['All Premium Features', 'Dedicated Support', 'Custom Integrations', 'White Label'],
      is_active: true,
    },
  ];

  const subscriptions: SchoolSubscription[] = [
    { id: 1, school_name: 'Greenwood High', plan_name: 'Enterprise', status: 'active', billing_cycle: 'yearly', amount: 5000, next_billing_date: '2024-07-15', trial_ends_at: undefined },
    { id: 2, school_name: 'Riverside Academy', plan_name: 'Premium', status: 'trial', billing_cycle: 'monthly', amount: 150, next_billing_date: '2024-07-01', trial_ends_at: '2024-07-01' },
    { id: 3, school_name: 'Sunset Primary', plan_name: 'Basic', status: 'active', billing_cycle: 'monthly', amount: 50, next_billing_date: '2024-07-10', trial_ends_at: undefined },
  ];

  const invoices: Invoice[] = invoicesData?.results?.map((inv: any) => ({
    id: inv.id,
    invoice_number: inv.invoice_number,
    school_name: inv.tenant_name,
    amount: inv.total,
    status: inv.status,
    due_date: inv.due_date,
    paid_date: inv.paid_date,
  })) || [
    { id: 1, invoice_number: 'INV-2024-001', school_name: 'Greenwood High', amount: 5000, status: 'paid', due_date: '2024-06-15', paid_date: '2024-06-14' },
    { id: 2, invoice_number: 'INV-2024-002', school_name: 'Riverside Academy', amount: 150, status: 'pending', due_date: '2024-07-01', paid_date: undefined },
    { id: 3, invoice_number: 'INV-2024-003', school_name: 'Sunset Primary', amount: 50, status: 'overdue', due_date: '2024-06-10', paid_date: undefined },
  ];

  const revenueData = [
    { month: 'Jan', revenue: 120000, subscriptions: 38 },
    { month: 'Feb', revenue: 125000, subscriptions: 40 },
    { month: 'Mar', revenue: 130000, subscriptions: 42 },
    { month: 'Apr', revenue: 135000, subscriptions: 43 },
    { month: 'May', revenue: 140000, subscriptions: 44 },
    { month: 'Jun', revenue: 145000, subscriptions: 45 },
  ];

  const planDistribution = [
    { name: 'Enterprise', value: 12, revenue: 60000 },
    { name: 'Premium', value: 15, revenue: 22500 },
    { name: 'Basic', value: 10, revenue: 500 },
    { name: 'Free', value: 8, revenue: 0 },
  ];

  const COLORS = ['#667eea', '#ec4899', '#10b981', '#f59e0b'];

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
                      $145,000
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
                      $1.74M
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
                      82%
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
                      3
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
                        startIcon={<EditIcon />}
                        onClick={() => setPlanDialogOpen(true)}
                        fullWidth
                      >
                        Edit
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* School Subscriptions Tab */}
        {tabValue === 1 && (
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

        {/* Invoices Tab */}
        {tabValue === 2 && (
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
                      <Tooltip title="Download PDF">
                        <IconButton size="small">
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Analytics Tab */}
        {tabValue === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Revenue & Subscription Growth
                  </Typography>
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
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Plan Distribution
                  </Typography>
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
      </Container>
    </Layout>
  );
};

export default SubscriptionBilling;

