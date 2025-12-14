/**
 * Finance & Fees Management
 * Advanced fees engine with complex structures, multi-currency, and reconciliation
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
  LinearProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  AttachMoney as AttachMoneyIcon,
  Receipt as ReceiptIcon,
  Sync as SyncIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
import { feesService } from '../../services/fees';
import apiService from '../../services/api';
import Layout from '../../components/Layout';

const FinanceFees: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [reconciliationDialogOpen, setReconciliationDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [reconciliationDate, setReconciliationDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceForm, setInvoiceForm] = useState({
    student: null as number | null,
    fee_structure: null as number | null,
    term: '',
    academic_year: null as number | null,
    due_date: '',
    notes: '',
  });
  const queryClient = useQueryClient();

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['feeInvoices'],
    queryFn: () => feesService.getInvoices(),
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['payments'],
    queryFn: () => apiService.get('/fees/payments/').then(res => res.data),
  });

  const { data: feeStructuresData } = useQuery({
    queryKey: ['feeStructuresEnhanced'],
    queryFn: () => apiService.get('/schooladmin/fee-structures-enhanced/').then(res => res.data),
  });

  const { data: studentsData } = useQuery({
    queryKey: ['students'],
    queryFn: () => apiService.get('/students/').then(res => res.data),
  });

  const { data: academicYearsData } = useQuery({
    queryKey: ['academicYears'],
    queryFn: () => apiService.get('/academics/academic-years/').then(res => res.data),
  });

  const invoices = (invoicesData as any)?.results || [];
  const payments = (paymentsData as any)?.results || [];
  const feeStructures = (feeStructuresData as any)?.results || [];
  const students = (studentsData as any)?.results || [];
  const academicYears = (academicYearsData as any)?.results || [];

  // Calculate statistics
  const totalInvoiced = invoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.total_amount || 0), 0);
  const totalPaid = invoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.paid_amount || 0), 0);
  const totalOutstanding = invoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.balance || 0), 0);
  const collectionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;

  // Prepare chart data
  const paymentMethodData = payments.reduce((acc: Record<string, number>, payment: any) => {
    acc[payment.payment_method] = (acc[payment.payment_method] || 0) + parseFloat(payment.amount || 0);
    return acc;
  }, {});

  const paymentMethodChartData = Object.entries(paymentMethodData).map(([name, value]) => ({
    name: name.toUpperCase(),
    value,
  }));

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const createInvoiceMutation = useMutation({
    mutationFn: (data: any) => feesService.createInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeInvoices'] });
      setInvoiceDialogOpen(false);
      setInvoiceForm({
        student: null,
        fee_structure: null,
        term: '',
        academic_year: null,
        due_date: '',
        notes: '',
      });
    },
  });

  const reconcileMutation = useMutation({
    mutationFn: (date: string) => apiService.post('/schooladmin/payment-reconciliations/', { reconciliation_date: date }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['feeInvoices'] });
      setReconciliationDialogOpen(false);
    },
  });

  const handleCreateInvoice = () => {
    createInvoiceMutation.mutate(invoiceForm);
  };

  const handleReconcile = () => {
    reconcileMutation.mutate(reconciliationDate);
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
              Finance & Fees Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Advanced fees engine with complex structures and reconciliation
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<SyncIcon />}
              onClick={() => setReconciliationDialogOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              Reconcile
            </Button>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={() => setInvoiceDialogOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              New Invoice
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Invoiced</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                      ${totalInvoiced.toFixed(2)}
                    </Typography>
                  </Box>
                  <AttachMoneyIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Total Paid</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'success.main' }}>
                      ${totalPaid.toFixed(2)}
                    </Typography>
                  </Box>
                  <ReceiptIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.5 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Outstanding</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'error.main' }}>
                  ${totalOutstanding.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Collection Rate</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: collectionRate >= 80 ? 'success.main' : 'warning.main' }}>
                      {collectionRate.toFixed(1)}%
                    </Typography>
                  </Box>
                  {collectionRate >= 80 ? (
                    <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.5 }} />
                  ) : (
                    <TrendingUpIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.5 }} />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Invoices" />
            <Tab label="Payments" />
            <Tab label="Fee Structures" />
            <Tab label="Analytics" />
          </Tabs>

          {/* Invoices Tab */}
          <Box sx={{ p: 3 }}>
            {tabValue === 0 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Student</TableCell>
                      <TableCell>Total Amount</TableCell>
                      <TableCell>Paid</TableCell>
                      <TableCell>Balance</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.map((invoice: any) => (
                      <TableRow key={invoice.id} hover>
                        <TableCell>{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.student?.user?.full_name || invoice.student_name}</TableCell>
                        <TableCell>${parseFloat(invoice.total_amount || 0).toFixed(2)}</TableCell>
                        <TableCell>${parseFloat(invoice.paid_amount || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <Typography color={parseFloat(invoice.balance || 0) > 0 ? 'error.main' : 'success.main'}>
                            ${parseFloat(invoice.balance || 0).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={invoice.status}
                            size="small"
                            color={
                              invoice.status === 'paid' ? 'success' :
                              invoice.status === 'overdue' ? 'error' :
                              invoice.status === 'partial' ? 'warning' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>{invoice.due_date}</TableCell>
                        <TableCell>
                          <IconButton size="small">
                            <DownloadIcon />
                          </IconButton>
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

            {/* Payments Tab */}
            {tabValue === 1 && (
              <Box>
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Payment Methods</Typography>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={paymentMethodChartData}
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
                              {paymentMethodChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#1976D2', '#42A5F5', '#66BB6A', '#FFA726', '#EF5350'][index % 5]} />
                              ))}
                            </Pie>
                            <RechartsTooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Payment #</TableCell>
                        <TableCell>Invoice</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Method</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Reference</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payments.map((payment: any) => (
                        <TableRow key={payment.id} hover>
                          <TableCell>{payment.payment_number}</TableCell>
                          <TableCell>{payment.invoice?.invoice_number || payment.invoice_number}</TableCell>
                          <TableCell>${parseFloat(payment.amount || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            <Chip label={payment.payment_method} size="small" />
                          </TableCell>
                          <TableCell>{payment.payment_date}</TableCell>
                          <TableCell>
                            <Chip
                              label={payment.status}
                              size="small"
                              color={payment.status === 'completed' ? 'success' : payment.status === 'failed' ? 'error' : 'default'}
                            />
                          </TableCell>
                          <TableCell>{payment.transaction_reference || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Fee Structures Tab */}
            {tabValue === 2 && (
              <Grid container spacing={3}>
                {feeStructures.map((structure: any) => (
                  <Grid item xs={12} md={6} key={structure.id}>
                    <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {structure.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {structure.academic_year_name}
                            </Typography>
                          </Box>
                          <Chip label={structure.currency} size="small" />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
                          ${parseFloat(structure.base_amount || 0).toFixed(2)}
                        </Typography>
                        {structure.allow_installments && (
                          <Chip label="Installments Allowed" color="success" size="small" sx={{ mb: 1 }} />
                        )}
                        {structure.inflation_adjustment_enabled && (
                          <Chip label={`Inflation: ${structure.inflation_rate}%`} size="small" sx={{ mb: 1, ml: 1 }} />
                        )}
                        <Box sx={{ mt: 2 }}>
                          <Button size="small" startIcon={<EditIcon />}>Edit</Button>
                          <Button size="small" startIcon={<DownloadIcon />}>Export</Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            {/* Analytics Tab */}
            {tabValue === 3 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <TrendingUpIcon sx={{ color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>Collection Trend</Typography>
                      </Box>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={[]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Line type="monotone" dataKey="collected" stroke="#66BB6A" strokeWidth={2} />
                          <Line type="monotone" dataKey="outstanding" stroke="#EF5350" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <AttachMoneyIcon sx={{ color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>Payment Methods Distribution</Typography>
                      </Box>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={paymentMethodChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Bar dataKey="value" fill="#1976D2" name="Amount ($)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <ReceiptIcon sx={{ color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>Monthly Collection Overview</Typography>
                      </Box>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={[]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Bar dataKey="collected" fill="#66BB6A" name="Collected ($)" />
                          <Bar dataKey="outstanding" fill="#EF5350" name="Outstanding ($)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
        </Paper>

        {/* Reconciliation Dialog */}
        <Dialog open={reconciliationDialogOpen} onClose={() => setReconciliationDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Payment Reconciliation</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              Reconcile payments for a specific date. The system will compare expected vs received amounts.
            </Alert>
            <TextField
              fullWidth
              label="Reconciliation Date"
              type="date"
              value={reconciliationDate}
              onChange={(e) => setReconciliationDate(e.target.value)}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />
            <Button 
              variant="contained" 
              fullWidth 
              startIcon={<SyncIcon />}
              onClick={handleReconcile}
              disabled={reconcileMutation.isPending}
            >
              {reconcileMutation.isPending ? 'Reconciling...' : 'Run Reconciliation'}
            </Button>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReconciliationDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Create Invoice Dialog */}
        <Dialog open={invoiceDialogOpen} onClose={() => setInvoiceDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create New Invoice</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mb: 2, mt: 2 }}>
              <InputLabel>Student</InputLabel>
              <Select
                label="Student"
                value={invoiceForm.student || ''}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, student: e.target.value as number })}
                required
              >
                <MenuItem value="">Select Student</MenuItem>
                {students.map((student: any) => (
                  <MenuItem key={student.id} value={student.id}>
                    {student.first_name} {student.last_name} ({student.student_number})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Fee Structure</InputLabel>
              <Select
                label="Fee Structure"
                value={invoiceForm.fee_structure || ''}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, fee_structure: e.target.value as number })}
                required
              >
                <MenuItem value="">Select Fee Structure</MenuItem>
                {feeStructures.map((fs: any) => (
                  <MenuItem key={fs.id} value={fs.id}>
                    {fs.name} - {fs.currency} {fs.total_amount}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Academic Year</InputLabel>
              <Select
                label="Academic Year"
                value={invoiceForm.academic_year || ''}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, academic_year: e.target.value as number })}
                required
              >
                <MenuItem value="">Select Academic Year</MenuItem>
                {academicYears.map((ay: any) => (
                  <MenuItem key={ay.id} value={ay.id}>
                    {ay.name} ({ay.start_date} - {ay.end_date})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Term</InputLabel>
              <Select
                label="Term"
                value={invoiceForm.term}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, term: e.target.value })}
                required
              >
                <MenuItem value="1">Term 1</MenuItem>
                <MenuItem value="2">Term 2</MenuItem>
                <MenuItem value="3">Term 3</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Due Date"
              type="date"
              value={invoiceForm.due_date}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={invoiceForm.notes}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setInvoiceDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleCreateInvoice}
              disabled={createInvoiceMutation.isPending || !invoiceForm.student || !invoiceForm.fee_structure || !invoiceForm.academic_year || !invoiceForm.term}
            >
              {createInvoiceMutation.isPending ? 'Creating...' : 'Create Invoice'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default FinanceFees;

