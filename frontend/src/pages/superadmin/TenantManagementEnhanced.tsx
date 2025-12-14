import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Avatar,
  Switch,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Sms as SmsIcon,
  Payment as PaymentIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import AdvancedFilter, { FilterField } from '../../components/AdvancedFilter';
import { superadminService } from '../../services/superadmin';
import apiService from '../../services/api';
import { PaginatedResponse } from '../../types/api';
import { Download as DownloadIcon } from '@mui/icons-material';

interface Tenant {
  id: number;
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  school_type: string;
  subscription_plan: string;
  is_active: boolean;
  max_students: number;
  max_teachers: number;
  student_count?: number;
  teacher_count?: number;
  storage_used?: number;
  sms_balance?: number;
  last_login?: string;
}

const TenantManagementEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [impersonateOpen, setImpersonateOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants', filters, searchTerm, tabValue],
    queryFn: async () => {
      const params: any = {};
      if (filters.plan) params.subscription_plan = filters.plan;
      if (filters.status) params.is_active = filters.status === 'active';
      if (filters.city) params.city = filters.city;
      if (searchTerm) params.search = searchTerm;
      
      // Filter by tab
      if (tabValue === 1) params.is_active = true;
      else if (tabValue === 2) params.subscription_plan = 'free'; // Trial
      else if (tabValue === 3) params.is_active = false; // Suspended
      
      const response = await apiService.get<PaginatedResponse<Tenant>>('/tenants/', { params });
      return response.data;
    },
  });

  // Export tenants function
  const handleExportTenants = () => {
    if (!tenants?.results) return;
    
    const csvRows = [
      ['School Name', 'Code', 'Email', 'Phone', 'City', 'Province', 'Plan', 'Status', 'Students', 'Teachers', 'Storage (GB)'].join(','),
      ...tenants.results.map((t: Tenant) =>
        [
          `"${t.name}"`,
          t.code,
          t.email,
          t.phone,
          t.city,
          t.province,
          t.subscription_plan,
          t.is_active ? 'Active' : 'Suspended',
          t.student_count || 0,
          t.teacher_count || 0,
          t.storage_used || 0,
        ].join(',')
      ),
    ];
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tenants-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Filter fields for AdvancedFilter
  const filterFields: FilterField[] = [
    {
      name: 'plan',
      label: 'Subscription Plan',
      type: 'select',
      options: [
        { value: 'free', label: 'Free' },
        { value: 'basic', label: 'Basic' },
        { value: 'premium', label: 'Premium' },
        { value: 'enterprise', label: 'Enterprise' },
      ],
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'suspended', label: 'Suspended' },
      ],
    },
    {
      name: 'city',
      label: 'City',
      type: 'text',
    },
  ];

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.delete(`/tenants/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiService.post(`/tenants/${id}/${isActive ? 'activate' : 'deactivate'}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });

  const handleOpen = (tenant?: Tenant) => {
    setSelectedTenant(tenant || null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedTenant(null);
  };

  const handleView = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setViewOpen(true);
  };

  const handleImpersonate = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setImpersonateOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this school? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (tenant: Tenant) => {
    toggleActiveMutation.mutate({ id: tenant.id, isActive: !tenant.is_active });
  };

  const handleImpersonateConfirm = async () => {
    if (!selectedTenant) return;
    
    try {
      const result = await superadminService.startImpersonation(selectedTenant.id);
      // Store impersonation tokens
      localStorage.setItem('impersonation_token', result.tokens.access);
      localStorage.setItem('impersonation_session', JSON.stringify(result.session));
      // Redirect to tenant admin dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Impersonation failed:', error);
      alert('Failed to start impersonation session');
    }
    setImpersonateOpen(false);
  };

  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1, color: '#1e293b' }}>
              School Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage all schools on the platform
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportTenants}
              sx={{ borderRadius: 2 }}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpen()}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                },
              }}
            >
              Add School
            </Button>
          </Box>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <CheckCircleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {tenants?.results?.filter((t: Tenant) => t.is_active).length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Schools
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' }}>
                    <PaymentIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {tenants?.results?.filter((t: Tenant) => t.subscription_plan !== 'free').length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Paid Subscriptions
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {tenants?.results?.reduce((sum: number, t: Tenant) => sum + (t.student_count || 0), 0).toLocaleString() || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Students
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                    <CancelIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {tenants?.results?.filter((t: Tenant) => !t.is_active).length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Suspended Schools
                    </Typography>
                  </Box>
                </Box>
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
            }}
            onSearchChange={(search) => {
              setSearchTerm(search);
            }}
            searchPlaceholder="Search schools by name, code, email..."
          />
        </Paper>

        {/* Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="All Schools" />
            <Tab label="Active" />
            <Tab label="Trial" />
            <Tab label="Suspended" />
          </Tabs>
        </Paper>

        {/* Schools Table */}
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ background: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>School</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Plan</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Usage</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Last Login</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">Loading...</TableCell>
                </TableRow>
              ) : !tenants?.results || tenants.results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">No schools found</TableCell>
                </TableRow>
              ) : (
                tenants.results.map((tenant: Tenant) => (
                  <TableRow
                    key={tenant.id}
                    sx={{
                      '&:hover': {
                        background: '#f8fafc',
                      },
                      transition: 'background 0.2s',
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                          {tenant.name[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {tenant.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {tenant.code} • {tenant.city}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tenant.subscription_plan}
                        size="small"
                        sx={{
                          fontWeight: 500,
                          borderRadius: 2,
                          background:
                            tenant.subscription_plan === 'enterprise'
                              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                              : tenant.subscription_plan === 'premium'
                              ? 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)'
                              : undefined,
                          color: tenant.subscription_plan !== 'free' ? 'white' : undefined,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Switch
                          checked={tenant.is_active}
                          onChange={() => handleToggleActive(tenant)}
                          size="small"
                          color="success"
                        />
                        <Chip
                          label={tenant.is_active ? 'Active' : 'Suspended'}
                          color={tenant.is_active ? 'success' : 'default'}
                          size="small"
                          sx={{ fontWeight: 500, borderRadius: 2 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {tenant.student_count || 0} students / {tenant.teacher_count || 0} teachers
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {tenant.storage_used || 0}GB storage
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {tenant.last_login || 'Never'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleView(tenant)}
                            sx={{
                              color: '#6366f1',
                              '&:hover': {
                                background: 'rgba(99, 102, 241, 0.1)',
                              },
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View School Dashboard">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/superadmin/tenants/${tenant.id}`)}
                            sx={{
                              color: '#8b5cf6',
                              '&:hover': {
                                background: 'rgba(139, 92, 246, 0.1)',
                              },
                            }}
                          >
                            <PersonIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Impersonate">
                          <IconButton
                            size="small"
                            onClick={() => handleImpersonate(tenant)}
                            sx={{
                              color: '#10b981',
                              '&:hover': {
                                background: 'rgba(16, 185, 129, 0.1)',
                              },
                            }}
                          >
                            <LoginIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpen(tenant)}
                            sx={{
                              color: '#6366f1',
                              '&:hover': {
                                background: 'rgba(99, 102, 241, 0.1)',
                              },
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(tenant.id)}
                            sx={{
                              color: '#ef4444',
                              '&:hover': {
                                background: 'rgba(239, 68, 68, 0.1)',
                              },
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* View Tenant Dialog */}
        <Dialog
          open={viewOpen}
          onClose={() => setViewOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 600, fontSize: '1.5rem', pb: 1 }}>
            {selectedTenant?.name} - School Profile
          </DialogTitle>
          <DialogContent>
            {selectedTenant && (
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Contact Information
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Email:</strong> {selectedTenant.email}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Phone:</strong> {selectedTenant.phone}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Address:</strong> {selectedTenant.address}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Location:</strong> {selectedTenant.city}, {selectedTenant.province}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Usage & Resources
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <PersonIcon color="action" />
                    <Typography variant="body2">
                      {selectedTenant.student_count || 0} / {selectedTenant.max_students} students
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <StorageIcon color="action" />
                    <Typography variant="body2">
                      {selectedTenant.storage_used || 0}GB storage used
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <SmsIcon color="action" />
                    <Typography variant="body2">
                      {selectedTenant.sms_balance || 0} SMS credits
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button onClick={() => setViewOpen(false)} sx={{ borderRadius: 2 }}>
              Close
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setViewOpen(false);
                handleImpersonate(selectedTenant!);
              }}
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                },
              }}
            >
              Impersonate School
            </Button>
          </DialogActions>
        </Dialog>

        {/* Impersonate Confirmation Dialog */}
        <Dialog
          open={impersonateOpen}
          onClose={() => setImpersonateOpen(false)}
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 600 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SecurityIcon color="warning" />
              Impersonate School
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              You are about to log in as the administrator of <strong>{selectedTenant?.name}</strong>.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All actions taken while impersonating will be logged for audit purposes.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button onClick={() => setImpersonateOpen(false)} sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleImpersonateConfirm}
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                },
              }}
            >
              Confirm Impersonation
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add/Edit Dialog - Same as before but enhanced */}
        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 600, fontSize: '1.5rem', pb: 1 }}>
            {selectedTenant ? 'Edit School' : 'Add New School'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="School Name"
                margin="normal"
                defaultValue={selectedTenant?.name || ''}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                fullWidth
                label="School Code"
                margin="normal"
                defaultValue={selectedTenant?.code || ''}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                margin="normal"
                defaultValue={selectedTenant?.email || ''}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                fullWidth
                label="Phone"
                margin="normal"
                defaultValue={selectedTenant?.phone || ''}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Subscription Plan</InputLabel>
                <Select
                  label="Subscription Plan"
                  defaultValue={selectedTenant?.subscription_plan || 'free'}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="free">Free</MenuItem>
                  <MenuItem value="basic">Basic</MenuItem>
                  <MenuItem value="premium">Premium</MenuItem>
                  <MenuItem value="enterprise">Enterprise</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button onClick={handleClose} sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button
              onClick={handleClose}
              variant="contained"
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                },
              }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default TenantManagementEnhanced;

