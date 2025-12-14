/**
 * Admissions Pipeline (CRM-Style)
 * Complete admission management with stages, interviews, and enrollment
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  FileUpload as FileUploadIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schooladminService, AdmissionApplication } from '../../services/schooladmin';
import apiService from '../../services/api';
import AdvancedFilter, { FilterField } from '../../components/AdvancedFilter';
import Layout from '../../components/Layout';

const STAGES = [
  'application_received',
  'shortlisted',
  'interviewed',
  'accepted',
  'enrolled',
  'waitlisted',
  'rejected',
];

const STAGE_LABELS: Record<string, string> = {
  application_received: 'Application Received',
  shortlisted: 'Shortlisted',
  interviewed: 'Interviewed',
  accepted: 'Accepted',
  enrolled: 'Enrolled',
  waitlisted: 'Waitlisted',
  rejected: 'Rejected',
};

const STAGE_COLORS: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  application_received: 'default',
  shortlisted: 'primary',
  interviewed: 'primary',
  accepted: 'success',
  enrolled: 'success',
  waitlisted: 'warning',
  rejected: 'error',
};

const AdmissionsPipeline: React.FC = () => {
  const [filterStage, setFilterStage] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<AdmissionApplication | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [applicationForm, setApplicationForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    email: '',
    phone: '',
    address: '',
    applied_class: null as number | null,
  });
  const queryClient = useQueryClient();

  const { data: applicationsData, isLoading } = useQuery({
    queryKey: ['admissionApplications', filterStage, filters, searchTerm],
    queryFn: () => {
      const params: any = { ...filters };
      if (filterStage !== 'all') {
        params.stage = filterStage;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      return schooladminService.getAdmissionApplications(params);
    },
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiService.get('/academics/classes/').then(res => res.data),
  });

  const applications = useMemo(() => applicationsData?.results || [], [applicationsData]);
  const classes = (classesData as any)?.results || [];

  const deleteApplicationMutation = useMutation({
    mutationFn: (id: number) => apiService.delete(`/schooladmin/admission-applications/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissionApplications'] });
    },
  });

  const updateApplicationMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      schooladminService.updateAdmissionApplication(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissionApplications'] });
      setEditDialogOpen(false);
      setSelectedApplication(null);
    },
  });

  const moveStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: number; stage: string }) =>
      schooladminService.moveApplicationStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissionApplications'] });
    },
  });

  const sendAcceptanceLetterMutation = useMutation({
    mutationFn: (id: number) => schooladminService.sendAcceptanceLetter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissionApplications'] });
    },
  });

  const createApplicationMutation = useMutation({
    mutationFn: (data: any) => schooladminService.createAdmissionApplication(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissionApplications'] });
      setCreateDialogOpen(false);
      setApplicationForm({
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: '',
        email: '',
        phone: '',
        address: '',
        applied_class: null,
      });
    },
  });

  const handleCreateApplication = () => {
    createApplicationMutation.mutate(applicationForm);
  };

  const handleMoveStage = (application: AdmissionApplication, newStage: string) => {
    moveStageMutation.mutate({ id: application.id, stage: newStage });
  };

  const handleViewApplication = (application: AdmissionApplication) => {
    setSelectedApplication(application);
    setViewDialogOpen(true);
  };

  const handleEditApplication = (application: AdmissionApplication) => {
    setSelectedApplication(application);
    setApplicationForm({
      first_name: application.first_name,
      last_name: application.last_name,
      date_of_birth: application.date_of_birth,
      gender: application.gender,
      email: application.email,
      phone: application.phone,
      address: application.address || '',
      applied_class: application.applied_class,
    });
    setEditDialogOpen(true);
  };

  const handleDeleteApplication = (id: number) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      deleteApplicationMutation.mutate(id);
    }
  };

  const handleUpdateApplication = () => {
    if (selectedApplication) {
      updateApplicationMutation.mutate({ id: selectedApplication.id, data: applicationForm });
    }
  };

  const handleSendEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleUploadDocument = (applicationId: number) => {
    // Open file input dialog
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        // TODO: Implement document upload
        console.log('Upload documents for application:', applicationId, files);
      }
    };
    input.click();
  };

  const filterFields: FilterField[] = [
    {
      name: 'stage',
      label: 'Stage',
      type: 'select',
      options: [
        { value: 'all', label: 'All Stages' },
        ...STAGES.map(stage => ({ value: stage, label: STAGE_LABELS[stage] })),
      ],
    },
    {
      name: 'applied_class',
      label: 'Applied Class',
      type: 'select',
      options: classes.map((cls: any) => ({ value: cls.id, label: cls.name })),
    },
  ];

  // Group applications by stage
  const applicationsByStage = useMemo(() => {
    return applications.reduce((acc: Record<string, AdmissionApplication[]>, app) => {
      if (!acc[app.stage]) acc[app.stage] = [];
      acc[app.stage].push(app);
      return acc;
    }, {});
  }, [applications]);

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, background: 'linear-gradient(45deg, #1976D2 30%, #42A5F5 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Admissions Pipeline
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage student admissions from application to enrollment
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setApplicationForm({
                first_name: '',
                last_name: '',
                date_of_birth: '',
                gender: '',
                email: '',
                phone: '',
                address: '',
                applied_class: null,
              });
              setCreateDialogOpen(true);
            }}
            sx={{ borderRadius: 2 }}
          >
            New Application
          </Button>
        </Box>

        {/* Filters and View Toggle */}
        <Paper sx={{ mb: 3, p: 2, borderRadius: 2 }}>
          <Box sx={{ mb: 2 }}>
            <AdvancedFilter
              fields={filterFields}
              onFilterChange={(newFilters) => {
                setFilters(newFilters);
                if (newFilters.stage) {
                  setFilterStage(newFilters.stage);
                }
              }}
              onSearchChange={(search) => setSearchTerm(search)}
              searchPlaceholder="Search by name, application number, email..."
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Stage</InputLabel>
              <Select
                value={filterStage}
                label="Filter by Stage"
                onChange={(e) => setFilterStage(e.target.value)}
              >
                <MenuItem value="all">All Stages</MenuItem>
                {STAGES.map((stage) => (
                  <MenuItem key={stage} value={stage}>
                    {STAGE_LABELS[stage]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Tabs value={viewMode === 'kanban' ? 0 : 1} onChange={(e, v) => setViewMode(v === 0 ? 'kanban' : 'table')}>
              <Tab label="Kanban View" />
              <Tab label="Table View" />
            </Tabs>
          </Box>
        </Paper>

        {/* Loading State */}
        {isLoading ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Loading applications...
            </Typography>
          </Paper>
        ) : viewMode === 'kanban' ? (
          /* Pipeline View - Kanban Style */
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {STAGES.map((stage) => {
              const stageApplications = applicationsByStage[stage] || [];
              return (
                <Grid item xs={12} sm={6} md={4} lg={12 / 7} key={stage}>
                  <Card sx={{ borderRadius: 3, boxShadow: 3, height: '100%', minHeight: 400 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {STAGE_LABELS[stage]}
                        </Typography>
                        <Chip label={stageApplications.length} size="small" color={STAGE_COLORS[stage]} />
                      </Box>
                      <Box sx={{ maxHeight: 500, overflowY: 'auto' }}>
                        {stageApplications.length === 0 ? (
                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                            No applications
                          </Typography>
                        ) : (
                          stageApplications.map((app) => (
                            <Paper
                              key={app.id}
                              sx={{
                                p: 2,
                                mb: 1,
                                borderRadius: 2,
                                cursor: 'pointer',
                                '&:hover': { boxShadow: 3 },
                                position: 'relative',
                              }}
                              onClick={() => handleViewApplication(app)}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                                  {app.first_name?.[0]}{app.last_name?.[0]}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {app.first_name} {app.last_name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {app.application_number}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                                  <Tooltip title="Edit">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleEditApplication(app)}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteApplication(app.id)}
                                      disabled={deleteApplicationMutation.isPending}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Box>
                              {app.applied_class_name && (
                                <Chip label={app.applied_class_name} size="small" sx={{ mb: 1 }} />
                              )}
                              <Typography variant="caption" color="text.secondary" display="block">
                                Applied: {new Date(app.application_date).toLocaleDateString()}
                              </Typography>
                              {app.interview_date && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                  <ScheduleIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                  <Typography variant="caption" color="text.secondary">
                                    Interview: {new Date(app.interview_date).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              )}
                              <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }} onClick={(e) => e.stopPropagation()}>
                                <Tooltip title="Send Email">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleSendEmail(app.email)}
                                  >
                                    <EmailIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Call">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleCall(app.phone)}
                                  >
                                    <PhoneIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                {app.stage === 'accepted' && (
                                  <Tooltip title="Acceptance Letter Sent">
                                    <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main', mt: 0.5 }} />
                                  </Tooltip>
                                )}
                              </Box>
                            </Paper>
                          ))
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          /* Table View */
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Application #</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Applicant</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Applied Class</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Stage</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Application Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Interview Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No applications found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app) => (
                    <TableRow key={app.id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{app.application_number}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            {app.first_name?.[0]}{app.last_name?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {app.first_name} {app.last_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              DOB: {new Date(app.date_of_birth).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <EmailIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption">{app.email}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption">{app.phone}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {app.applied_class_name ? (
                          <Chip label={app.applied_class_name} size="small" />
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={STAGE_LABELS[app.stage]}
                          size="small"
                          color={STAGE_COLORS[app.stage]}
                        />
                      </TableCell>
                      <TableCell>{new Date(app.application_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {app.interview_date ? (
                          new Date(app.interview_date).toLocaleDateString()
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewApplication(app)}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleEditApplication(app)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Send Email">
                            <IconButton
                              size="small"
                              onClick={() => handleSendEmail(app.email)}
                            >
                              <EmailIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Call">
                            <IconButton
                              size="small"
                              onClick={() => handleCall(app.phone)}
                            >
                              <PhoneIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Upload Documents">
                            <IconButton
                              size="small"
                              onClick={() => handleUploadDocument(app.id)}
                            >
                              <FileUploadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteApplication(app.id)}
                              disabled={deleteApplicationMutation.isPending}
                            >
                              <DeleteIcon fontSize="small" />
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
        )}

        {/* Application Details Dialog */}
        <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Application Details - {selectedApplication?.first_name} {selectedApplication?.last_name}
          </DialogTitle>
          <DialogContent>
            {selectedApplication && (
              <Box>
                <Stepper activeStep={STAGES.indexOf(selectedApplication.stage)} sx={{ mb: 3 }}>
                  {STAGES.map((stage) => (
                    <Step key={stage}>
                      <StepLabel>{STAGE_LABELS[stage]}</StepLabel>
                    </Step>
                  ))}
                </Stepper>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="First Name" value={selectedApplication.first_name} disabled sx={{ mb: 2 }} />
                    <TextField fullWidth label="Last Name" value={selectedApplication.last_name} disabled sx={{ mb: 2 }} />
                    <TextField fullWidth label="Date of Birth" type="date" value={selectedApplication.date_of_birth} disabled sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
                    <TextField fullWidth label="Gender" value={selectedApplication.gender} disabled sx={{ mb: 2 }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Email" value={selectedApplication.email} disabled sx={{ mb: 2 }} />
                    <TextField fullWidth label="Phone" value={selectedApplication.phone} disabled sx={{ mb: 2 }} />
                    <TextField fullWidth label="Address" value={selectedApplication.address} multiline rows={3} disabled sx={{ mb: 2 }} />
                    <TextField fullWidth label="Applied Class" value={selectedApplication.applied_class_name || 'N/A'} disabled sx={{ mb: 2 }} />
                  </Grid>
                </Grid>

                {selectedApplication.interview_date && (
                  <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Interview Details</Typography>
                    <Typography variant="body2">Date: {new Date(selectedApplication.interview_date).toLocaleString()}</Typography>
                    {selectedApplication.interview_score && (
                      <Typography variant="body2">Score: {selectedApplication.interview_score}</Typography>
                    )}
                    {selectedApplication.interview_notes && (
                      <Typography variant="body2" sx={{ mt: 1 }}>Notes: {selectedApplication.interview_notes}</Typography>
                    )}
                  </Paper>
                )}

                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {STAGES.map((stage) => (
                    <Button
                      key={stage}
                      variant={selectedApplication.stage === stage ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => handleMoveStage(selectedApplication, stage)}
                      disabled={selectedApplication.stage === stage}
                    >
                      {STAGE_LABELS[stage]}
                    </Button>
                  ))}
                </Box>

                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Tooltip title="Send Email">
                    <IconButton
                      color="primary"
                      onClick={() => handleSendEmail(selectedApplication.email)}
                    >
                      <EmailIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Call">
                    <IconButton
                      color="primary"
                      onClick={() => handleCall(selectedApplication.phone)}
                    >
                      <PhoneIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Upload Documents">
                    <IconButton
                      color="primary"
                      onClick={() => handleUploadDocument(selectedApplication.id)}
                    >
                      <FileUploadIcon />
                    </IconButton>
                  </Tooltip>
                </Box>

                {selectedApplication.stage === 'accepted' && !selectedApplication.acceptance_letter_sent && (
                  <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={() => sendAcceptanceLetterMutation.mutate(selectedApplication.id)}
                    disabled={sendAcceptanceLetterMutation.isPending}
                    sx={{ mt: 2 }}
                  >
                    {sendAcceptanceLetterMutation.isPending ? 'Sending...' : 'Send Acceptance Letter'}
                  </Button>
                )}
                {selectedApplication.acceptance_letter_sent && (
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: 'success.main' }} />
                    <Typography variant="body2" color="success.main">
                      Acceptance letter sent on {selectedApplication.acceptance_letter_sent_at ? new Date(selectedApplication.acceptance_letter_sent_at).toLocaleDateString() : ''}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
            {selectedApplication && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => {
                  setViewDialogOpen(false);
                  handleEditApplication(selectedApplication);
                }}
              >
                Edit
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Edit Application Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedApplication(null);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Edit Admission Application</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="First Name"
              value={applicationForm.first_name}
              onChange={(e) => setApplicationForm({ ...applicationForm, first_name: e.target.value })}
              sx={{ mb: 2, mt: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Last Name"
              value={applicationForm.last_name}
              onChange={(e) => setApplicationForm({ ...applicationForm, last_name: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Date of Birth"
              type="date"
              value={applicationForm.date_of_birth}
              onChange={(e) => setApplicationForm({ ...applicationForm, date_of_birth: e.target.value })}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
              required
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Gender</InputLabel>
              <Select
                label="Gender"
                value={applicationForm.gender}
                onChange={(e) => setApplicationForm({ ...applicationForm, gender: e.target.value })}
                required
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={applicationForm.email}
              onChange={(e) => setApplicationForm({ ...applicationForm, email: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Phone"
              value={applicationForm.phone}
              onChange={(e) => setApplicationForm({ ...applicationForm, phone: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Address"
              multiline
              rows={3}
              value={applicationForm.address}
              onChange={(e) => setApplicationForm({ ...applicationForm, address: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Applied Class</InputLabel>
              <Select
                label="Applied Class"
                value={applicationForm.applied_class || ''}
                onChange={(e) => setApplicationForm({ ...applicationForm, applied_class: e.target.value as number || null })}
              >
                <MenuItem value="">None</MenuItem>
                {classes.map((cls: any) => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.name} ({cls.grade || ''})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setEditDialogOpen(false);
              setSelectedApplication(null);
            }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleUpdateApplication}
              disabled={updateApplicationMutation.isPending || !applicationForm.first_name || !applicationForm.last_name || !applicationForm.email}
            >
              {updateApplicationMutation.isPending ? 'Updating...' : 'Update Application'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Application Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>New Admission Application</DialogTitle>
          <DialogContent>
            <TextField 
              fullWidth 
              label="First Name" 
              value={applicationForm.first_name}
              onChange={(e) => setApplicationForm({ ...applicationForm, first_name: e.target.value })}
              sx={{ mb: 2, mt: 2 }} 
              required
            />
            <TextField 
              fullWidth 
              label="Last Name" 
              value={applicationForm.last_name}
              onChange={(e) => setApplicationForm({ ...applicationForm, last_name: e.target.value })}
              sx={{ mb: 2 }} 
              required
            />
            <TextField 
              fullWidth 
              label="Date of Birth" 
              type="date" 
              value={applicationForm.date_of_birth}
              onChange={(e) => setApplicationForm({ ...applicationForm, date_of_birth: e.target.value })}
              sx={{ mb: 2 }} 
              InputLabelProps={{ shrink: true }} 
              required
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Gender</InputLabel>
              <Select 
                label="Gender"
                value={applicationForm.gender}
                onChange={(e) => setApplicationForm({ ...applicationForm, gender: e.target.value })}
                required
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
              </Select>
            </FormControl>
            <TextField 
              fullWidth 
              label="Email" 
              type="email" 
              value={applicationForm.email}
              onChange={(e) => setApplicationForm({ ...applicationForm, email: e.target.value })}
              sx={{ mb: 2 }} 
              required
            />
            <TextField 
              fullWidth 
              label="Phone" 
              value={applicationForm.phone}
              onChange={(e) => setApplicationForm({ ...applicationForm, phone: e.target.value })}
              sx={{ mb: 2 }} 
              required
            />
            <TextField 
              fullWidth 
              label="Address" 
              multiline 
              rows={3} 
              value={applicationForm.address}
              onChange={(e) => setApplicationForm({ ...applicationForm, address: e.target.value })}
              sx={{ mb: 2 }} 
              required
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Applied Class</InputLabel>
              <Select 
                label="Applied Class"
                value={applicationForm.applied_class || ''}
                onChange={(e) => setApplicationForm({ ...applicationForm, applied_class: e.target.value as number })}
              >
                <MenuItem value="">None</MenuItem>
                {classes.map((cls: any) => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.name} ({cls.grade})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleCreateApplication}
              disabled={createApplicationMutation.isPending || !applicationForm.first_name || !applicationForm.last_name || !applicationForm.email}
            >
              {createApplicationMutation.isPending ? 'Creating...' : 'Create Application'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default AdmissionsPipeline;



