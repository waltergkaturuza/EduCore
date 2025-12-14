/**
 * Student Records (360° View)
 * Comprehensive student profile with academic trajectory, documents, and lifecycle
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
  Tabs,
  Tab,
  Avatar,
  Paper,
  Divider,
  LinearProgress,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  FileUpload as FileUploadIcon,
  Download as DownloadIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  AttachMoney as AttachMoneyIcon,
  History as HistoryIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsService } from '../../services/students';
import apiService from '../../services/api';
import AdvancedFilter, { FilterField } from '../../components/AdvancedFilter';
import Layout from '../../components/Layout';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const StudentRecords: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('all');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [enrollForm, setEnrollForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    email: '',
    phone: '',
    address: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    guardian_relationship: '',
    enrollment_class: null as number | null,
    enrollment_date: new Date().toISOString().split('T')[0],
    student_number: '',
  });
  const queryClient = useQueryClient();

  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['students', filters, searchTerm],
    queryFn: () => {
      const params: any = { ...filters };
      if (searchTerm) params.search = searchTerm;
      return studentsService.getAll(params);
    },
  });

  const students = useMemo(() => (studentsData as any)?.results || [], [studentsData]);

  const { data: documentsData } = useQuery({
    queryKey: ['studentDocuments', selectedStudent?.id],
    queryFn: () => apiService.get(`/schooladmin/student-documents/?student=${selectedStudent?.id}`).then(res => res.data),
    enabled: !!selectedStudent,
  });

  const { data: lifecycleEventsData } = useQuery({
    queryKey: ['studentLifecycleEvents', selectedStudent?.id],
    queryFn: () => apiService.get(`/schooladmin/student-lifecycle-events/?student=${selectedStudent?.id}`).then(res => res.data),
    enabled: !!selectedStudent,
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiService.get('/academics/classes/').then(res => res.data),
  });

  const { data: academicYearsData } = useQuery({
    queryKey: ['academicYears'],
    queryFn: () => apiService.get('/academics/academic-years/').then(res => res.data),
  });

  const classes = useMemo(() => (classesData as any)?.results || [], [classesData]);
  const academicYears = useMemo(() => (academicYearsData as any)?.results || [], [academicYearsData]);

  const deleteDocumentMutation = useMutation({
    mutationFn: (id: number) => apiService.delete(`/schooladmin/student-documents/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentDocuments', selectedStudent?.id] });
    },
  });

  const filterFields: FilterField[] = useMemo(
    () => [
      {
        name: 'class',
        label: 'Class',
        type: 'select',
        options: [
          { value: 'all', label: 'All Classes' },
          ...classes.map((cls: any) => ({ value: cls.id, label: cls.name })),
        ],
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'all', label: 'All Statuses' },
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'graduated', label: 'Graduated' },
          { value: 'transferred', label: 'Transferred' },
        ],
      },
    ],
    [classes]
  );

  const handleViewStudent = (student: any) => {
    setSelectedStudent(student);
    setViewDialogOpen(true);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const enrollStudentMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        // First create the user account
        const userData = {
          email: data.email,
          password: 'TempPassword123!', // Should be changed on first login
          first_name: data.first_name,
          last_name: data.last_name,
          role: 'student',
          phone: data.phone,
        };
        const userResponse = await apiService.post<any>('/users/register/', userData);
        
        // Then create the student record
        const userResponseData = userResponse.data as any;
        const studentData = {
          user: userResponseData?.user?.id || userResponseData?.id,
          student_number: data.student_number || `STU${Date.now()}`,
          date_of_birth: data.date_of_birth,
          gender: data.gender,
          address: data.address,
          guardian_name: data.guardian_name,
          guardian_phone: data.guardian_phone,
          guardian_email: data.guardian_email,
          guardian_relationship: data.guardian_relationship,
          enrollment_date: data.enrollment_date,
          current_class: data.enrollment_class,
        };
        return await studentsService.create(studentData);
      } catch (error: any) {
        console.error('Enrollment error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setEnrollDialogOpen(false);
      setEnrollForm({
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: '',
        email: '',
        phone: '',
        address: '',
        guardian_name: '',
        guardian_phone: '',
        guardian_email: '',
        guardian_relationship: '',
        enrollment_class: null,
        enrollment_date: new Date().toISOString().split('T')[0],
        student_number: '',
      });
    },
    onError: (error: any) => {
      console.error('Failed to enroll student:', error);
      alert(error?.response?.data?.error || error?.message || 'Failed to enroll student. Please try again.');
    },
  });

  const handleEnrollStudent = () => {
    enrollStudentMutation.mutate(enrollForm);
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
              Student Records (360° View)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Comprehensive student profiles with complete academic and personal history
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setEnrollDialogOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Enroll Student
          </Button>
        </Box>

        {/* Advanced Filter */}
        <Paper sx={{ mb: 3, p: 2, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Academic Year</InputLabel>
                <Select
                  value={selectedAcademicYear}
                  label="Academic Year"
                  onChange={(e) => setSelectedAcademicYear(e.target.value)}
                >
                  <MenuItem value="all">All Academic Years</MenuItem>
                  {academicYears.map((year: any) => (
                    <MenuItem key={year.id} value={year.id}>
                      {year.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={8}>
              <AdvancedFilter
                fields={filterFields}
                onFilterChange={(newFilters) => {
                  setFilters(newFilters);
                }}
                onSearchChange={(search) => setSearchTerm(search)}
                searchPlaceholder="Search by name, student ID, email..."
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Students Table */}
        <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 3 }}>
          <CardContent>
            {isLoading ? (
              <LinearProgress />
            ) : students.length === 0 ? (
              <Alert severity="info">No students found.</Alert>
            ) : (
              <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell>Gender</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student: any) => (
                    <TableRow key={student.id} hover>
                      <TableCell>{student.student_id}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                            {student.user?.first_name?.[0]}{student.user?.last_name?.[0]}
                          </Avatar>
                          {student.user?.full_name || `${student.user?.first_name} ${student.user?.last_name}`}
                        </Box>
                      </TableCell>
                      <TableCell>{student.current_class?.name || 'N/A'}</TableCell>
                      <TableCell>{student.gender}</TableCell>
                      <TableCell>
                        <Chip
                          label={student.status || 'active'}
                          size="small"
                          color={student.status === 'active' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleViewStudent(student)}>
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
          </CardContent>
        </Card>

        {/* Student Details Dialog */}
        <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>
            Student Profile - {selectedStudent?.user?.full_name || selectedStudent?.user?.first_name} {selectedStudent?.user?.last_name}
          </DialogTitle>
          <DialogContent>
            {selectedStudent && (
              <Box>
                <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tab label="Overview" icon={<SchoolIcon />} iconPosition="start" />
                  <Tab label="Academic" icon={<AssessmentIcon />} iconPosition="start" />
                  <Tab label="Documents" icon={<DescriptionIcon />} iconPosition="start" />
                  <Tab label="Lifecycle" icon={<HistoryIcon />} iconPosition="start" />
                  <Tab label="Financial" icon={<AttachMoneyIcon />} iconPosition="start" />
                </Tabs>

                {/* Overview Tab */}
                <TabPanel value={tabValue} index={0}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Avatar sx={{ width: 120, height: 120, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}>
                            {selectedStudent.user?.first_name?.[0]}{selectedStudent.user?.last_name?.[0]}
                          </Avatar>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {selectedStudent.user?.full_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedStudent.student_id}
                          </Typography>
                          <Chip label={selectedStudent.status || 'active'} color="success" sx={{ mt: 2 }} />
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={8}>
                      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Personal Information</Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <TextField fullWidth label="Date of Birth" value={selectedStudent.date_of_birth || ''} disabled />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField fullWidth label="Gender" value={selectedStudent.gender || ''} disabled />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField fullWidth label="Phone" value={selectedStudent.phone || ''} disabled />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField fullWidth label="Email" value={selectedStudent.user?.email || ''} disabled />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField fullWidth label="Address" value={selectedStudent.address || ''} multiline rows={2} disabled />
                            </Grid>
                            {selectedStudent.medical_conditions && (
                              <Grid item xs={12}>
                                <Paper sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Medical Conditions</Typography>
                                  <Typography variant="body2">{selectedStudent.medical_conditions}</Typography>
                                </Paper>
                              </Grid>
                            )}
                            {selectedStudent.special_needs && (
                              <Grid item xs={12}>
                                <Paper sx={{ p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Special Needs</Typography>
                                  <Typography variant="body2">{selectedStudent.special_needs}</Typography>
                                </Paper>
                              </Grid>
                            )}
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </TabPanel>

                {/* Academic Tab */}
                <TabPanel value={tabValue} index={1}>
                  <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Academic Information</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label="Current Class" value={selectedStudent.current_class?.name || 'N/A'} disabled />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label="Stream" value={selectedStudent.current_stream?.name || 'N/A'} disabled />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label="Admission Date" value={selectedStudent.admission_date || ''} disabled />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label="Admission Number" value={selectedStudent.admission_number || 'N/A'} disabled />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </TabPanel>

                {/* Documents Tab */}
                <TabPanel value={tabValue} index={2}>
                  <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>Digital Document Vault</Typography>
                        <Button
                          variant="outlined"
                          startIcon={<FileUploadIcon />}
                          onClick={() => setDocumentDialogOpen(true)}
                        >
                          Upload Document
                        </Button>
                      </Box>
                      <Grid container spacing={2}>
                        {((documentsData as any)?.results || []).map((doc: any) => (
                          <Grid item xs={12} sm={6} md={4} key={doc.id}>
                            <Paper sx={{ p: 2, borderRadius: 2, border: doc.is_verified ? '2px solid' : '1px solid', borderColor: doc.is_verified ? 'success.main' : 'divider', position: 'relative' }}>
                              <IconButton
                                size="small"
                                sx={{ position: 'absolute', top: 8, right: 8 }}
                                color="error"
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this document?')) {
                                    deleteDocumentMutation.mutate(doc.id);
                                  }
                                }}
                                disabled={deleteDocumentMutation.isPending}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {doc.title}
                                </Typography>
                                {doc.is_verified && <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />}
                              </Box>
                              <Chip label={doc.document_type} size="small" sx={{ mb: 1 }} />
                              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                <Button size="small" startIcon={<DownloadIcon />} href={doc.file} target="_blank">
                                  Download
                                </Button>
                              </Box>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </TabPanel>

                {/* Lifecycle Tab */}
                <TabPanel value={tabValue} index={3}>
                  <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Student Lifecycle Events</Typography>
                      {((lifecycleEventsData as any)?.results || []).length === 0 ? (
                        <Alert severity="info">No lifecycle events recorded for this student.</Alert>
                      ) : (
                        <Timeline>
                          {((lifecycleEventsData as any)?.results || [])
                            .sort((a: any, b: any) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
                            .map((event: any, index: number) => (
                              <TimelineItem key={event.id}>
                                <TimelineOppositeContent sx={{ flex: 0.3 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(event.event_date).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </Typography>
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    {new Date(event.event_date).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </Typography>
                                </TimelineOppositeContent>
                                <TimelineSeparator>
                                  <TimelineDot
                                    color={
                                      event.event_type === 'enrollment'
                                        ? 'primary'
                                        : event.event_type === 'graduation'
                                        ? 'success'
                                        : event.event_type === 'transfer_out' || event.event_type === 'withdrawal'
                                        ? 'error'
                                        : 'warning'
                                    }
                                    variant="outlined"
                                  >
                                    <HistoryIcon sx={{ fontSize: 16 }} />
                                  </TimelineDot>
                                  {index < ((lifecycleEventsData as any)?.results || []).length - 1 && (
                                    <TimelineConnector />
                                  )}
                                </TimelineSeparator>
                                <TimelineContent>
                                  <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                        {event.event_type.replace(/_/g, ' ').toUpperCase()}
                                      </Typography>
                                      <Chip
                                        label={event.event_type.replace(/_/g, ' ')}
                                        size="small"
                                        color={
                                          event.event_type === 'enrollment'
                                            ? 'primary'
                                            : event.event_type === 'graduation'
                                            ? 'success'
                                            : event.event_type === 'transfer_out' || event.event_type === 'withdrawal'
                                            ? 'error'
                                            : 'warning'
                                        }
                                      />
                                    </Box>
                                    {event.from_class && (
                                      <Typography variant="body2" color="text.secondary">
                                        From: {event.from_class}
                                      </Typography>
                                    )}
                                    {event.to_class && (
                                      <Typography variant="body2" color="text.secondary">
                                        To: {event.to_class}
                                      </Typography>
                                    )}
                                    {event.reason && (
                                      <Typography variant="body2" sx={{ mt: 1 }}>
                                        {event.reason}
                                      </Typography>
                                    )}
                                    {event.notes && (
                                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                                        {event.notes}
                                      </Typography>
                                    )}
                                  </Paper>
                                </TimelineContent>
                              </TimelineItem>
                            ))}
                        </Timeline>
                      )}
                    </CardContent>
                  </Card>
                </TabPanel>

                {/* Financial Tab */}
                <TabPanel value={tabValue} index={4}>
                  <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Fee & Billing History</Typography>
                      <Alert severity="info">
                        Financial information will be displayed here. Connect to fees API.
                      </Alert>
                    </CardContent>
                  </Card>
                </TabPanel>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Upload Document Dialog */}
        <Dialog open={documentDialogOpen} onClose={() => setDocumentDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogContent>
            <TextField fullWidth label="Document Type" select sx={{ mt: 2, mb: 2 }}>
              <MenuItem value="birth_certificate">Birth Certificate</MenuItem>
              <MenuItem value="id_copy">ID Copy</MenuItem>
              <MenuItem value="medical">Medical Records</MenuItem>
              <MenuItem value="transfer">Transfer Certificate</MenuItem>
              <MenuItem value="certificate">Certificate</MenuItem>
              <MenuItem value="transcript">Transcript</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
            <TextField fullWidth label="Title" sx={{ mb: 2 }} />
            <TextField fullWidth label="Description" multiline rows={3} sx={{ mb: 2 }} />
            <TextField fullWidth type="file" inputProps={{ accept: '.pdf,.jpg,.jpeg,.png' }} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDocumentDialogOpen(false)}>Cancel</Button>
            <Button variant="contained">Upload</Button>
          </DialogActions>
        </Dialog>

        {/* Enroll Student Dialog */}
        <Dialog open={enrollDialogOpen} onClose={() => setEnrollDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Enroll New Student</DialogTitle>
          <DialogContent>
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 2, fontWeight: 600 }}>Student Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={enrollForm.first_name}
                  onChange={(e) => setEnrollForm({ ...enrollForm, first_name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={enrollForm.last_name}
                  onChange={(e) => setEnrollForm({ ...enrollForm, last_name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  value={enrollForm.date_of_birth}
                  onChange={(e) => setEnrollForm({ ...enrollForm, date_of_birth: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Gender"
                  select
                  value={enrollForm.gender}
                  onChange={(e) => setEnrollForm({ ...enrollForm, gender: e.target.value })}
                  required
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={enrollForm.email}
                  onChange={(e) => setEnrollForm({ ...enrollForm, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={enrollForm.phone}
                  onChange={(e) => setEnrollForm({ ...enrollForm, phone: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  multiline
                  rows={2}
                  value={enrollForm.address}
                  onChange={(e) => setEnrollForm({ ...enrollForm, address: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Student Number"
                  value={enrollForm.student_number}
                  onChange={(e) => setEnrollForm({ ...enrollForm, student_number: e.target.value })}
                  placeholder="Auto-generated if left empty"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Enrollment Date"
                  type="date"
                  value={enrollForm.enrollment_date}
                  onChange={(e) => setEnrollForm({ ...enrollForm, enrollment_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Enrollment Class"
                  select
                  value={enrollForm.enrollment_class || ''}
                  onChange={(e) => setEnrollForm({ ...enrollForm, enrollment_class: e.target.value ? Number(e.target.value) : null })}
                  required
                >
                  <MenuItem value="">Select Class</MenuItem>
                  {classes.map((cls: any) => (
                    <MenuItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.grade})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>Guardian Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Guardian Name"
                  value={enrollForm.guardian_name}
                  onChange={(e) => setEnrollForm({ ...enrollForm, guardian_name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Relationship"
                  select
                  value={enrollForm.guardian_relationship}
                  onChange={(e) => setEnrollForm({ ...enrollForm, guardian_relationship: e.target.value })}
                  required
                >
                  <MenuItem value="parent">Parent</MenuItem>
                  <MenuItem value="guardian">Guardian</MenuItem>
                  <MenuItem value="relative">Relative</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Guardian Phone"
                  value={enrollForm.guardian_phone}
                  onChange={(e) => setEnrollForm({ ...enrollForm, guardian_phone: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Guardian Email"
                  type="email"
                  value={enrollForm.guardian_email}
                  onChange={(e) => setEnrollForm({ ...enrollForm, guardian_email: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEnrollDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleEnrollStudent}
              disabled={
                enrollStudentMutation.isPending || 
                !enrollForm.first_name || 
                !enrollForm.last_name || 
                !enrollForm.email || 
                !enrollForm.date_of_birth || 
                !enrollForm.gender ||
                !enrollForm.enrollment_class ||
                !enrollForm.guardian_name
              }
            >
              {enrollStudentMutation.isPending ? 'Enrolling...' : 'Enroll Student'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default StudentRecords;

