/**
 * Student Records (360° View)
 * Comprehensive student profile with academic trajectory, documents, and lifecycle
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
  Avatar,
  Paper,
  Divider,
  LinearProgress,
  Alert,
  MenuItem,
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
import AdvancedFilter from '../../components/AdvancedFilter';
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
  const queryClient = useQueryClient();

  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentsService.getAll(),
  });

  const students = (studentsData as any)?.results || [];

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

  const handleViewStudent = (student: any) => {
    setSelectedStudent(student);
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
              Student Records (360° View)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Comprehensive student profiles with complete academic and personal history
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 2 }}>
            Enroll Student
          </Button>
        </Box>

        {/* Students Table */}
        <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 3 }}>
          <CardContent>
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
                            <Paper sx={{ p: 2, borderRadius: 2, border: doc.is_verified ? '2px solid' : '1px solid', borderColor: doc.is_verified ? 'success.main' : 'divider' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {doc.title}
                                </Typography>
                                {doc.is_verified && <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />}
                              </Box>
                              <Chip label={doc.document_type} size="small" sx={{ mb: 1 }} />
                              <Box sx={{ mt: 1 }}>
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
                      <Box>
                        {((lifecycleEventsData as any)?.results || []).map((event: any, index: number) => (
                          <Box key={event.id} sx={{ mb: 3, position: 'relative', pl: 4 }}>
                            <Box
                              sx={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                                border: '2px solid',
                                borderColor: 'background.paper',
                              }}
                            />
                            {index < ((lifecycleEventsData as any)?.results || []).length - 1 && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  left: 5,
                                  top: 12,
                                  width: 2,
                                  height: 'calc(100% + 12px)',
                                  bgcolor: 'divider',
                                }}
                              />
                            )}
                            <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {event.event_type.replace('_', ' ').toUpperCase()}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(event.event_date).toLocaleDateString()}
                                </Typography>
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
                            </Paper>
                          </Box>
                        ))}
                      </Box>
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
      </Box>
    </Layout>
  );
};

export default StudentRecords;

