/**
 * CPD Dashboard
 * Continuing Professional Development tracking
 */
import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  IconButton,
  Divider,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Event as EventIcon,
  School as SchoolIcon,
  WorkspacePremium as WorkspacePremiumIcon,
  AccessTime as AccessTimeIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teachersService } from '../../services/teachers';
import apiService from '../../services/api';
import Layout from '../../components/Layout';

const CPDDashboard: React.FC = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const queryClient = useQueryClient();

  const [cpdForm, setCpdForm] = useState({
    title: '',
    description: '',
    cpd_type: 'internal_training',
    start_date: '',
    end_date: '',
    completion_date: '',
    cpd_points: '0',
    hours: '',
    provider: '',
    provider_type: 'school',
    certificate_number: '',
    skills_gained: [] as string[],
    competencies_addressed: [] as string[],
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { data: cpdData, isLoading } = useQuery({
    queryKey: ['cpdRecords'],
    queryFn: () => teachersService.getCPDRecords(),
  });

  const cpdRecords = (cpdData as any)?.results || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => teachersService.createCPDRecord(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpdRecords'] });
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Error creating CPD record:', error);
      if (error.response?.data) {
        setErrors(error.response.data);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => teachersService.updateCPDRecord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpdRecords'] });
      setEditingRecord(null);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Error updating CPD record:', error);
      if (error.response?.data) {
        setErrors(error.response.data);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.delete(`/teachers/cpd-records/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpdRecords'] });
    },
  });

  const resetForm = () => {
    setCpdForm({
      title: '',
      description: '',
      cpd_type: 'internal_training',
      start_date: '',
      end_date: '',
      completion_date: '',
      cpd_points: '0',
      hours: '',
      provider: '',
      provider_type: 'school',
      certificate_number: '',
      skills_gained: [],
      competencies_addressed: [],
    });
    setErrors({});
  };

  const handleOpenCreate = () => {
    resetForm();
    setEditingRecord(null);
    setCreateDialogOpen(true);
  };

  const handleOpenEdit = (record: any) => {
    setEditingRecord(record);
    setCpdForm({
      title: record.title || '',
      description: record.description || '',
      cpd_type: record.cpd_type || 'internal_training',
      start_date: record.start_date || '',
      end_date: record.end_date || '',
      completion_date: record.completion_date || '',
      cpd_points: String(record.cpd_points || '0'),
      hours: record.hours ? String(record.hours) : '',
      provider: record.provider || '',
      provider_type: record.provider_type || 'school',
      certificate_number: record.certificate_number || '',
      skills_gained: record.skills_gained || [],
      competencies_addressed: record.competencies_addressed || [],
    });
    setCreateDialogOpen(true);
  };

  const handleSubmit = () => {
    const newErrors: { [key: string]: string } = {};
    if (!cpdForm.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!cpdForm.cpd_type) {
      newErrors.cpd_type = 'CPD type is required';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const formData: any = {
      title: cpdForm.title.trim(),
      description: cpdForm.description,
      cpd_type: cpdForm.cpd_type,
      provider: cpdForm.provider,
      provider_type: cpdForm.provider_type,
      cpd_points: parseFloat(cpdForm.cpd_points) || 0,
      skills_gained: cpdForm.skills_gained,
      competencies_addressed: cpdForm.competencies_addressed,
      certificate_number: cpdForm.certificate_number,
    };

    if (cpdForm.start_date) formData.start_date = cpdForm.start_date;
    if (cpdForm.end_date) formData.end_date = cpdForm.end_date;
    if (cpdForm.completion_date) formData.completion_date = cpdForm.completion_date;
    if (cpdForm.hours) formData.hours = parseFloat(cpdForm.hours);

    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getCpdTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      internal_training: 'Internal Training',
      external_course: 'External Course',
      workshop: 'Workshop',
      conference: 'Conference',
      online_course: 'Online Course',
      certification: 'Certification',
      mentorship: 'Mentorship',
      other: 'Other',
    };
    return labels[type] || type;
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
      <Box sx={{ p: 3, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, background: 'linear-gradient(45deg, #1976D2 30%, #42A5F5 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            CPD Dashboard
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{
              bgcolor: '#1976D2',
              borderRadius: '24px',
              px: 3,
              textTransform: 'none',
              '&:hover': { bgcolor: '#1565C0' }
            }}
          >
            Add CPD Record
          </Button>
        </Box>

        {cpdRecords.length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center', bgcolor: 'white', borderRadius: 3 }}>
            <WorkspacePremiumIcon sx={{ fontSize: 64, color: '#bdbdbd', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No CPD Records Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Start tracking your professional development by adding your first CPD record
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
              Add Your First CPD Record
            </Button>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {cpdRecords.map((record: any) => (
              <Grid item xs={12} md={6} lg={4} key={record.id}>
                <Card sx={{ borderRadius: 3, boxShadow: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Chip
                        label={getCpdTypeLabel(record.cpd_type)}
                        size="small"
                        sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }}
                      />
                      {record.is_verified ? (
                        <Tooltip title="Verified">
                          <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20 }} />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Not verified">
                          <CancelIcon sx={{ color: '#f44336', fontSize: 20 }} />
                        </Tooltip>
                      )}
                    </Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                      {record.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                      {record.description || 'No description provided'}
                    </Typography>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WorkspacePremiumIcon sx={{ fontSize: 18, color: '#1976d2' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {record.cpd_points} CPD Points
                        </Typography>
                      </Box>
                      {record.hours && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccessTimeIcon sx={{ fontSize: 18, color: '#757575' }} />
                          <Typography variant="body2" color="text.secondary">
                            {record.hours} hours
                          </Typography>
                        </Box>
                      )}
                      {record.provider && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SchoolIcon sx={{ fontSize: 18, color: '#757575' }} />
                          <Typography variant="body2" color="text.secondary">
                            {record.provider}
                          </Typography>
                        </Box>
                      )}
                      {record.completion_date && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EventIcon sx={{ fontSize: 18, color: '#757575' }} />
                          <Typography variant="body2" color="text.secondary">
                            Completed: {new Date(record.completion_date).toLocaleDateString()}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                  <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <IconButton size="small" onClick={() => handleOpenEdit(record)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this CPD record?')) {
                          deleteMutation.mutate(record.id);
                        }
                      }}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Create/Edit Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={() => {
            setCreateDialogOpen(false);
            resetForm();
          }}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
            }
          }}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
            <Typography variant="h6">
              {editingRecord ? 'Edit CPD Record' : 'Add CPD Record'}
            </Typography>
            <IconButton size="small" onClick={() => {
              setCreateDialogOpen(false);
              resetForm();
            }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Title *"
                value={cpdForm.title}
                onChange={(e) => {
                  setCpdForm({ ...cpdForm, title: e.target.value });
                  if (errors.title) setErrors({ ...errors, title: '' });
                }}
                error={!!errors.title}
                helperText={errors.title}
                required
              />

              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={cpdForm.description}
                onChange={(e) => setCpdForm({ ...cpdForm, description: e.target.value })}
              />

              <FormControl fullWidth required error={!!errors.cpd_type}>
                <InputLabel>CPD Type *</InputLabel>
                <Select
                  value={cpdForm.cpd_type}
                  onChange={(e) => {
                    setCpdForm({ ...cpdForm, cpd_type: e.target.value });
                    if (errors.cpd_type) setErrors({ ...errors, cpd_type: '' });
                  }}
                  label="CPD Type *"
                >
                  <MenuItem value="internal_training">Internal Training</MenuItem>
                  <MenuItem value="external_course">External Course</MenuItem>
                  <MenuItem value="workshop">Workshop</MenuItem>
                  <MenuItem value="conference">Conference</MenuItem>
                  <MenuItem value="online_course">Online Course</MenuItem>
                  <MenuItem value="certification">Certification</MenuItem>
                  <MenuItem value="mentorship">Mentorship</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={cpdForm.start_date}
                    onChange={(e) => setCpdForm({ ...cpdForm, start_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={cpdForm.end_date}
                    onChange={(e) => setCpdForm({ ...cpdForm, end_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Completion Date"
                type="date"
                value={cpdForm.completion_date}
                onChange={(e) => setCpdForm({ ...cpdForm, completion_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="CPD Points"
                    type="number"
                    value={cpdForm.cpd_points}
                    onChange={(e) => setCpdForm({ ...cpdForm, cpd_points: e.target.value })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Points</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Hours"
                    type="number"
                    value={cpdForm.hours}
                    onChange={(e) => setCpdForm({ ...cpdForm, hours: e.target.value })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Hours</InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>

              <FormControl fullWidth>
                <InputLabel>Provider Type</InputLabel>
                <Select
                  value={cpdForm.provider_type}
                  onChange={(e) => setCpdForm({ ...cpdForm, provider_type: e.target.value })}
                  label="Provider Type"
                >
                  <MenuItem value="school">School</MenuItem>
                  <MenuItem value="external">External</MenuItem>
                  <MenuItem value="online">Online Platform</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Provider/Organization"
                value={cpdForm.provider}
                onChange={(e) => setCpdForm({ ...cpdForm, provider: e.target.value })}
              />

              <TextField
                fullWidth
                label="Certificate Number"
                value={cpdForm.certificate_number}
                onChange={(e) => setCpdForm({ ...cpdForm, certificate_number: e.target.value })}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => {
              setCreateDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              startIcon={editingRecord ? <EditIcon /> : <AddIcon />}
            >
              {editingRecord ? 'Update' : 'Create'} CPD Record
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default CPDDashboard;


