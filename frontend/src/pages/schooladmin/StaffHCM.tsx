/**
 * Staff & Human Capital Management
 * Comprehensive staff records, appraisals, and leave management
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
  Avatar,
  LinearProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Rating,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Assessment as AssessmentIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../../services/api';
import Layout from '../../components/Layout';

const StaffHCM: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: staffData, isLoading } = useQuery({
    queryKey: ['staffRecords'],
    queryFn: () => apiService.get('/schooladmin/staff-records/').then(res => res.data),
  });

  const { data: appraisalsData } = useQuery({
    queryKey: ['staffAppraisals'],
    queryFn: () => apiService.get('/schooladmin/staff-appraisals/').then(res => res.data),
  });

  const { data: leaveRequestsData } = useQuery({
    queryKey: ['leaveRequests'],
    queryFn: () => apiService.get('/schooladmin/leave-requests/').then(res => res.data),
  });

  const staff = (staffData as any)?.results || [];
  const appraisals = (appraisalsData as any)?.results || [];
  const leaveRequests = (leaveRequestsData as any)?.results || [];

  const approveLeaveMutation = useMutation({
    mutationFn: (id: number) => apiService.post(`/schooladmin/leave-requests/${id}/approve/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
    },
  });

  const rejectLeaveMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      apiService.post(`/schooladmin/leave-requests/${id}/reject/`, { rejection_reason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
    },
  });

  const handleViewStaff = (staffMember: any) => {
    setSelectedStaff(staffMember);
    setViewDialogOpen(true);
  };

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
              Staff & Human Capital Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Comprehensive staff records, appraisals, and leave management
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 2 }}>
            Add Staff Member
          </Button>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Staff Records" />
            <Tab label="Appraisals" />
            <Tab label="Leave Requests" />
          </Tabs>

          {/* Staff Records Tab */}
          <Box sx={{ p: 3 }}>
            {tabValue === 0 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee #</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Position</TableCell>
                      <TableCell>Employment Type</TableCell>
                      <TableCell>Hire Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {staff.map((staffMember: any) => (
                      <TableRow key={staffMember.id} hover>
                        <TableCell>{staffMember.employee_number}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                              {staffMember.user_name?.[0] || 'S'}
                            </Avatar>
                            {staffMember.user_name}
                          </Box>
                        </TableCell>
                        <TableCell>{staffMember.department || '-'}</TableCell>
                        <TableCell>{staffMember.position || '-'}</TableCell>
                        <TableCell>
                          <Chip label={staffMember.employment_type?.replace('_', ' ')} size="small" />
                        </TableCell>
                        <TableCell>{staffMember.hire_date}</TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleViewStaff(staffMember)}>
                            <VisibilityIcon />
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

            {/* Appraisals Tab */}
            {tabValue === 1 && (
              <Grid container spacing={3}>
                {appraisals.map((appraisal: any) => (
                  <Grid item xs={12} md={6} key={appraisal.id}>
                    <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {appraisal.staff_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {appraisal.appraisal_period}
                            </Typography>
                          </Box>
                          {appraisal.overall_score && (
                            <Chip
                              label={`${appraisal.overall_score.toFixed(1)}/100`}
                              color={appraisal.overall_score >= 80 ? 'success' : appraisal.overall_score >= 60 ? 'warning' : 'error'}
                            />
                          )}
                        </Box>
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Attendance</Typography>
                            <Rating value={(appraisal.attendance_score || 0) / 20} readOnly size="small" />
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Student Outcomes</Typography>
                            <Rating value={(appraisal.student_outcomes_score || 0) / 20} readOnly size="small" />
                          </Grid>
                        </Grid>
                        {appraisal.supervisor_comments && (
                          <Paper sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1, mb: 1 }}>
                            <Typography variant="caption" color="text.secondary">Supervisor Comments</Typography>
                            <Typography variant="body2">{appraisal.supervisor_comments}</Typography>
                          </Paper>
                        )}
                        <Button size="small" startIcon={<VisibilityIcon />} sx={{ mt: 1 }}>
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            {/* Leave Requests Tab */}
            {tabValue === 2 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Staff</TableCell>
                      <TableCell>Leave Type</TableCell>
                      <TableCell>Start Date</TableCell>
                      <TableCell>End Date</TableCell>
                      <TableCell>Days</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leaveRequests.map((request: any) => (
                      <TableRow key={request.id} hover>
                        <TableCell>{request.staff_name}</TableCell>
                        <TableCell>
                          <Chip label={request.leave_type.replace('_', ' ')} size="small" />
                        </TableCell>
                        <TableCell>{request.start_date}</TableCell>
                        <TableCell>{request.end_date}</TableCell>
                        <TableCell>{request.days_requested}</TableCell>
                        <TableCell>
                          <Chip
                            label={request.status}
                            size="small"
                            color={
                              request.status === 'approved' ? 'success' :
                              request.status === 'rejected' ? 'error' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {request.status === 'pending' && (
                            <>
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => approveLeaveMutation.mutate(request.id)}
                              >
                                <CheckCircleIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  const reason = window.prompt('Rejection reason:');
                                  if (reason) rejectLeaveMutation.mutate({ id: request.id, reason });
                                }}
                              >
                                <CancelIcon />
                              </IconButton>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Paper>

        {/* Staff Details Dialog */}
        <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Staff Profile - {selectedStaff?.user_name}
          </DialogTitle>
          <DialogContent>
            {selectedStaff && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar sx={{ width: 100, height: 100, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}>
                        {selectedStaff.user_name?.[0] || 'S'}
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {selectedStaff.user_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedStaff.employee_number}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Employment Details</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label="Department" value={selectedStaff.department || ''} disabled />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label="Position" value={selectedStaff.position || ''} disabled />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label="Employment Type" value={selectedStaff.employment_type?.replace('_', ' ') || ''} disabled />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label="Hire Date" value={selectedStaff.hire_date || ''} disabled />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label="Annual Leave Balance" value={selectedStaff.annual_leave_balance || 0} disabled />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label="Sick Leave Balance" value={selectedStaff.sick_leave_balance || 0} disabled />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default StaffHCM;

