/**
 * Exam Lifecycle Management
 * Complete exam management with moderation workflows and locking
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
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schooladminService, ExamCycle } from '../../services/schooladmin';
import Layout from '../../components/Layout';

const EXAM_STAGES = [
  'planning',
  'scheduled',
  'in_progress',
  'marking',
  'moderation',
  'approved',
  'locked',
  'published',
];

const EXAM_STAGE_LABELS: Record<string, string> = {
  planning: 'Planning',
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  marking: 'Marking',
  moderation: 'Moderation',
  approved: 'Approved',
  locked: 'Locked',
  published: 'Published',
};

const ExamLifecycle: React.FC = () => {
  const [selectedCycle, setSelectedCycle] = useState<ExamCycle | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [moderationDialogOpen, setModerationDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const queryClient = useQueryClient();

  const { data: cyclesData, isLoading } = useQuery({
    queryKey: ['examCycles'],
    queryFn: () => schooladminService.getExamCycles(),
  });

  const cycles = cyclesData?.results || [];

  const lockMutation = useMutation({
    mutationFn: (id: number) => schooladminService.lockExamCycle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examCycles'] });
    },
  });

  const unlockMutation = useMutation({
    mutationFn: (id: number) => schooladminService.unlockExamCycle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examCycles'] });
    },
  });

  const handleViewCycle = (cycle: ExamCycle) => {
    setSelectedCycle(cycle);
    setViewDialogOpen(true);
  };

  const handleLock = (id: number) => {
    if (window.confirm('Lock this exam cycle? No further changes will be allowed.')) {
      lockMutation.mutate(id);
    }
  };

  const handleUnlock = (id: number) => {
    if (window.confirm('Unlock this exam cycle? Changes will be allowed again.')) {
      unlockMutation.mutate(id);
    }
  };

  const handleEdit = (cycle: ExamCycle) => {
    setSelectedCycle(cycle);
    setEditDialogOpen(true);
  };

  const sendNotificationMutation = useMutation({
    mutationFn: (id: number) => {
      // TODO: Implement send notification API call
      return Promise.resolve({ success: true });
    },
    onSuccess: () => {
      // Show success message
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
              Exam Lifecycle Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Complete exam management with moderation workflows and locking
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            New Exam Cycle
          </Button>
        </Box>

        {/* Tabs for filtering exam cycles */}
        <Paper sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="All Cycles" />
            <Tab label="Active" />
            <Tab label="Locked" />
            <Tab label="Moderation Required" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {/* Filtered cycles based on tab */}
            {(() => {
              let filteredCycles = cycles;
              if (tabValue === 1) {
                filteredCycles = cycles.filter((c: ExamCycle) => c.status === 'in_progress' || c.status === 'marking');
              } else if (tabValue === 2) {
                filteredCycles = cycles.filter((c: ExamCycle) => c.is_locked);
              } else if (tabValue === 3) {
                filteredCycles = cycles.filter((c: ExamCycle) => c.moderation_required && c.moderation_status !== 'approved');
              }

              return filteredCycles.length === 0 ? (
                <Alert severity="info">No exam cycles found for this filter.</Alert>
              ) : (
                <Grid container spacing={3}>
                  {filteredCycles.map((cycle: ExamCycle) => (
                    <Grid item xs={12} md={6} lg={4} key={cycle.id}>
                      <Card sx={{ borderRadius: 3, boxShadow: 3, border: cycle.is_locked ? '2px solid' : 'none', borderColor: cycle.is_locked ? 'error.main' : 'transparent' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {cycle.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {cycle.term_name} - {cycle.academic_year_name}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton size="small" onClick={() => handleEdit(cycle)} title="Edit">
                                <EditIcon fontSize="small" />
                              </IconButton>
                              {cycle.moderation_required && cycle.moderation_status !== 'approved' && (
                                <IconButton 
                                  size="small" 
                                  onClick={() => sendNotificationMutation.mutate(cycle.id)}
                                  title="Send notification"
                                  color="primary"
                                >
                                  <SendIcon fontSize="small" />
                                </IconButton>
                              )}
                              {cycle.is_locked && (
                                <Chip icon={<LockIcon />} label="Locked" color="error" size="small" />
                              )}
                            </Box>
                          </Box>
                          <Box sx={{ mb: 2 }}>
                            <Chip
                              label={EXAM_STAGE_LABELS[cycle.status] || cycle.status}
                              size="small"
                              {...(cycle.status === 'moderation' || cycle.moderation_required
                                ? { icon: <WarningIcon sx={{ fontSize: 14 }} /> }
                                : {})}
                              color={
                                cycle.status === 'published' ? 'success' :
                                cycle.status === 'locked' ? 'error' :
                                cycle.status === 'moderation' ? 'warning' : 'default'
                              }
                              sx={{ mr: 1 }}
                            />
                            <Chip label={cycle.exam_type} size="small" variant="outlined" />
                          </Box>
                          {cycle.moderation_required && (
                            <Alert 
                              severity={cycle.moderation_status === 'approved' ? 'success' : 'warning'} 
                              sx={{ mb: 2 }}
                              icon={cycle.moderation_status !== 'approved' ? <WarningIcon /> : undefined}
                            >
                              Moderation: {cycle.moderation_status}
                            </Alert>
                          )}
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button size="small" startIcon={<VisibilityIcon />} onClick={() => handleViewCycle(cycle)}>
                              View
                            </Button>
                            {!cycle.is_locked ? (
                              <Button size="small" startIcon={<LockIcon />} onClick={() => handleLock(cycle.id)} color="error">
                                Lock
                              </Button>
                            ) : (
                              <Button size="small" startIcon={<LockOpenIcon />} onClick={() => handleUnlock(cycle.id)}>
                                Unlock
                              </Button>
                            )}
                            {cycle.moderation_required && cycle.moderation_status !== 'approved' && (
                              <Button size="small" startIcon={<CheckCircleIcon />} onClick={() => { setSelectedCycle(cycle); setModerationDialogOpen(true); }}>
                                Moderate
                              </Button>
                            )}
                            <Button size="small" startIcon={<DownloadIcon />}>Export</Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              );
            })()}
          </Box>
        </Paper>

        {/* Exam Cycle Details Dialog */}
        <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>
            Exam Cycle - {selectedCycle?.name}
          </DialogTitle>
          <DialogContent>
            {selectedCycle && (
              <Box>
                <Stepper activeStep={EXAM_STAGES.indexOf(selectedCycle.status)} sx={{ mb: 3, mt: 2 }}>
                  {EXAM_STAGES.map((stage) => (
                    <Step key={stage}>
                      <StepLabel>{EXAM_STAGE_LABELS[stage]}</StepLabel>
                    </Step>
                  ))}
                </Stepper>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Details</Typography>
                        <TextField fullWidth label="Name" value={selectedCycle.name} disabled sx={{ mb: 2 }} />
                        <TextField fullWidth label="Academic Year" value={selectedCycle.academic_year_name} disabled sx={{ mb: 2 }} />
                        <TextField fullWidth label="Term" value={selectedCycle.term_name} disabled sx={{ mb: 2 }} />
                        <FormControl fullWidth sx={{ mb: 2 }}>
                          <InputLabel>Exam Type</InputLabel>
                          <Select value={selectedCycle.exam_type} label="Exam Type" disabled>
                            <MenuItem value="formative">Formative</MenuItem>
                            <MenuItem value="summative">Summative</MenuItem>
                            <MenuItem value="mid_term">Mid-Term</MenuItem>
                            <MenuItem value="final">Final</MenuItem>
                          </Select>
                        </FormControl>
                        {selectedCycle.start_date && (
                          <TextField fullWidth label="Start Date" type="date" value={selectedCycle.start_date} disabled sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
                        )}
                        {selectedCycle.end_date && (
                          <TextField fullWidth label="End Date" type="date" value={selectedCycle.end_date} disabled sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Status & Moderation</Typography>
                        <Box sx={{ mb: 2 }}>
                          <Chip
                            label={EXAM_STAGE_LABELS[selectedCycle.status] || selectedCycle.status}
                            color={selectedCycle.status === 'published' ? 'success' : 'default'}
                            sx={{ mb: 1, display: 'block' }}
                          />
                          {selectedCycle.is_locked && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                              This exam cycle is locked. No changes are allowed.
                            </Alert>
                          )}
                        </Box>
                        {selectedCycle.moderation_required && (
                          <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Moderation Status</Typography>
                            <Chip
                              label={selectedCycle.moderation_status}
                              color={selectedCycle.moderation_status === 'approved' ? 'success' : 'warning'}
                              sx={{ mb: 2 }}
                            />
                            {selectedCycle.moderated_by_name && (
                              <Typography variant="body2" color="text.secondary">
                                Moderated by: {selectedCycle.moderated_by_name}
                              </Typography>
                            )}
                            {selectedCycle.moderated_at && (
                              <Typography variant="body2" color="text.secondary">
                                On: {new Date(selectedCycle.moderated_at).toLocaleString()}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
            <Button variant="contained" startIcon={<DownloadIcon />}>Export Results</Button>
          </DialogActions>
        </Dialog>

        {/* Create Exam Cycle Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Exam Cycle</DialogTitle>
          <DialogContent>
            <TextField fullWidth label="Name" sx={{ mt: 2, mb: 2 }} placeholder="e.g., End of Term 1 Exams" />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Academic Year</InputLabel>
              <Select label="Academic Year">
                <MenuItem value={1}>2024</MenuItem>
                <MenuItem value={2}>2025</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Term</InputLabel>
              <Select label="Term">
                <MenuItem value={1}>Term 1</MenuItem>
                <MenuItem value={2}>Term 2</MenuItem>
                <MenuItem value={3}>Term 3</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Exam Type</InputLabel>
              <Select label="Exam Type" defaultValue="summative">
                <MenuItem value="formative">Formative</MenuItem>
                <MenuItem value="summative">Summative</MenuItem>
                <MenuItem value="mid_term">Mid-Term</MenuItem>
                <MenuItem value="final">Final</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth label="Start Date" type="date" sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
            <TextField fullWidth label="End Date" type="date" sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button variant="contained">Create Exam Cycle</Button>
          </DialogActions>
        </Dialog>

        {/* Moderation Dialog */}
        <Dialog open={moderationDialogOpen} onClose={() => setModerationDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Grade Moderation - {selectedCycle?.name}</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              Review and moderate grades for this exam cycle. Changes will be logged for audit purposes.
            </Alert>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Original Score</TableCell>
                    <TableCell>Moderated Score</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Sample moderation data */}
                  <TableRow>
                    <TableCell>John Doe</TableCell>
                    <TableCell>Mathematics</TableCell>
                    <TableCell>85</TableCell>
                    <TableCell>
                      <TextField type="number" size="small" defaultValue={85} sx={{ width: 80 }} />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" placeholder="Reason for change" />
                    </TableCell>
                    <TableCell>
                      <Button size="small">Approve</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModerationDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" startIcon={<CheckCircleIcon />}>Approve All</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Exam Cycle Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Exam Cycle - {selectedCycle?.name}</DialogTitle>
          <DialogContent>
            {selectedCycle && (
              <Box sx={{ mt: 2 }}>
                <TextField fullWidth label="Name" defaultValue={selectedCycle.name} sx={{ mb: 2 }} />
                <Alert severity="info" sx={{ mb: 2 }}>
                  Edit exam cycle details. Note: Some fields may be locked if the cycle is published.
                </Alert>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button variant="contained">Save Changes</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default ExamLifecycle;




