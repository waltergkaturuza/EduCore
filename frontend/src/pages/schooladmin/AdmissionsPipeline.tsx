/**
 * Admissions Pipeline (CRM-Style)
 * Complete admission management with stages, interviews, and enrollment
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
import AdvancedFilter from '../../components/AdvancedFilter';
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
  const [selectedApplication, setSelectedApplication] = useState<AdmissionApplication | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: applicationsData, isLoading } = useQuery({
    queryKey: ['admissionApplications', filterStage],
    queryFn: () => schooladminService.getAdmissionApplications({
      stage: filterStage !== 'all' ? filterStage : undefined,
    }),
  });

  const applications = applicationsData?.results || [];

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

  const handleMoveStage = (application: AdmissionApplication, newStage: string) => {
    moveStageMutation.mutate({ id: application.id, stage: newStage });
  };

  const handleViewApplication = (application: AdmissionApplication) => {
    setSelectedApplication(application);
    setViewDialogOpen(true);
  };

  // Group applications by stage
  const applicationsByStage = applications.reduce((acc: Record<string, AdmissionApplication[]>, app) => {
    if (!acc[app.stage]) acc[app.stage] = [];
    acc[app.stage].push(app);
    return acc;
  }, {});

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
            onClick={() => setCreateDialogOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            New Application
          </Button>
        </Box>

        {/* Pipeline View - Kanban Style */}
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
                      {stageApplications.map((app) => (
                        <Paper
                          key={app.id}
                          sx={{
                            p: 2,
                            mb: 1,
                            borderRadius: 2,
                            cursor: 'pointer',
                            '&:hover': { boxShadow: 3 },
                          }}
                          onClick={() => handleViewApplication(app)}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                              {app.first_name[0]}{app.last_name[0]}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {app.first_name} {app.last_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {app.application_number}
                              </Typography>
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
                        </Paper>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

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

                {selectedApplication.stage === 'accepted' && !selectedApplication.acceptance_letter_sent && (
                  <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={() => sendAcceptanceLetterMutation.mutate(selectedApplication.id)}
                    sx={{ mt: 2 }}
                  >
                    Send Acceptance Letter
                  </Button>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Create Application Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>New Admission Application</DialogTitle>
          <DialogContent>
            <TextField fullWidth label="First Name" sx={{ mb: 2, mt: 2 }} />
            <TextField fullWidth label="Last Name" sx={{ mb: 2 }} />
            <TextField fullWidth label="Date of Birth" type="date" sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Gender</InputLabel>
              <Select label="Gender">
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth label="Email" type="email" sx={{ mb: 2 }} />
            <TextField fullWidth label="Phone" sx={{ mb: 2 }} />
            <TextField fullWidth label="Address" multiline rows={3} sx={{ mb: 2 }} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button variant="contained">Create Application</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default AdmissionsPipeline;



