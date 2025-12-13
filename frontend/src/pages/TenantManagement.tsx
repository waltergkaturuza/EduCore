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
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import apiService from '../services/api';
import { PaginatedResponse } from '../types/api';

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
}

const TenantManagement: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const queryClient = useQueryClient();

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const response = await apiService.get<PaginatedResponse<Tenant>>('/tenants/');
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.delete(`/tenants/${id}/`),
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

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this school? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" component="h1">
            School Management
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
            Add School
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>School Name</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>City</TableCell>
                <TableCell>Subscription</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">Loading...</TableCell>
                </TableRow>
              ) : !tenants?.results || tenants.results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">No schools found</TableCell>
                </TableRow>
              ) : (
                tenants.results.map((tenant: Tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>{tenant.name}</TableCell>
                    <TableCell>{tenant.code}</TableCell>
                    <TableCell>{tenant.email}</TableCell>
                    <TableCell>{tenant.city}</TableCell>
                    <TableCell>
                      <Chip label={tenant.subscription_plan} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tenant.is_active ? 'Active' : 'Inactive'}
                        color={tenant.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpen(tenant)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(tenant.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedTenant ? 'Edit School' : 'Add New School'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="School Name"
                margin="normal"
                defaultValue={selectedTenant?.name || ''}
              />
              <TextField
                fullWidth
                label="School Code"
                margin="normal"
                defaultValue={selectedTenant?.code || ''}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                margin="normal"
                defaultValue={selectedTenant?.email || ''}
              />
              <TextField
                fullWidth
                label="Phone"
                margin="normal"
                defaultValue={selectedTenant?.phone || ''}
              />
              <TextField
                fullWidth
                label="Address"
                margin="normal"
                multiline
                rows={2}
                defaultValue={selectedTenant?.address || ''}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="City"
                  margin="normal"
                  defaultValue={selectedTenant?.city || ''}
                />
                <TextField
                  fullWidth
                  label="Province"
                  margin="normal"
                  defaultValue={selectedTenant?.province || ''}
                />
              </Box>
              <FormControl fullWidth margin="normal">
                <InputLabel>School Type</InputLabel>
                <Select label="School Type" defaultValue={selectedTenant?.school_type || 'combined'}>
                  <MenuItem value="primary">Primary School</MenuItem>
                  <MenuItem value="secondary">Secondary School</MenuItem>
                  <MenuItem value="combined">Combined</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Subscription Plan</InputLabel>
                <Select label="Subscription Plan" defaultValue={selectedTenant?.subscription_plan || 'free'}>
                  <MenuItem value="free">Free</MenuItem>
                  <MenuItem value="basic">Basic</MenuItem>
                  <MenuItem value="premium">Premium</MenuItem>
                  <MenuItem value="enterprise">Enterprise</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleClose} variant="contained">Save</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default TenantManagement;



