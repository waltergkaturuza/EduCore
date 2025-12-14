/**
 * My Classes - Class & Subject Workspace
 * Each class opens a dedicated teaching workspace
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  LinearProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import {
  School as SchoolIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  EventNote as EventNoteIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import apiService from '../../services/api';
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

const MyClasses: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const { data: classesData, isLoading } = useQuery({
    queryKey: ['teacherClasses'],
    queryFn: () => apiService.get('/academics/classes/').then(res => res.data),
  });

  const { data: studentsData } = useQuery({
    queryKey: ['classStudents', selectedClass?.id],
    queryFn: () => {
      if (!selectedClass) return null;
      return apiService.get(`/students/students/?current_class=${selectedClass.id}`).then(res => res.data);
    },
    enabled: !!selectedClass,
  });

  const classes = (classesData as any)?.results || [];
  const students = (studentsData as any)?.results || [];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewClass = (classObj: any) => {
    setSelectedClass(classObj);
    setViewDialogOpen(true);
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
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, background: 'linear-gradient(45deg, #1976D2 30%, #42A5F5 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            My Classes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Dedicated teaching workspace for each class
          </Typography>
        </Box>

        {/* Classes Grid */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {classes.map((classObj: any) => (
            <Grid item xs={12} sm={6} md={4} key={classObj.id}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: 3,
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
                }}
                onClick={() => handleViewClass(classObj)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {classObj.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Grade {classObj.grade}
                      </Typography>
                    </Box>
                    <SchoolIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<PeopleIcon />}
                      label={`${classObj.student_count || 0} students`}
                      size="small"
                    />
                    <Chip
                      icon={<AssessmentIcon />}
                      label={`${classObj.subject_count || 0} subjects`}
                      size="small"
                      color="primary"
                    />
                    <Tooltip title="View attendance trends">
                      <Chip
                        icon={<EventNoteIcon />}
                        label="Attendance"
                        size="small"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewClass(classObj);
                          setTabValue(1);
                        }}
                        sx={{ cursor: 'pointer' }}
                      />
                    </Tooltip>
                    <Tooltip title="View performance trends">
                      <Chip
                        icon={<TrendingUpIcon />}
                        label="Trends"
                        size="small"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewClass(classObj);
                          setTabValue(2);
                        }}
                        sx={{ cursor: 'pointer' }}
                      />
                    </Tooltip>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Quick view">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewClass(classObj);
                        }}
                        sx={{ border: '1px solid', borderColor: 'divider' }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<OpenInNewIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/teacher/classes/${classObj.id}`);
                      }}
                    >
                      Open Workspace
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Class Details Dialog */}
        <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>
            {selectedClass?.name} - Teaching Workspace
          </DialogTitle>
          <DialogContent>
            {selectedClass && (
              <Box>
                <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Class Profile</Typography>
                      <Typography variant="h6" sx={{ mb: 1 }}>{selectedClass.name}</Typography>
                      <Typography variant="body2">Grade: {selectedClass.grade}</Typography>
                      {selectedClass.stream_name && (
                        <Typography variant="body2">Stream: {selectedClass.stream_name}</Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Enrollment</Typography>
                      <Typography variant="h6" sx={{ mb: 1 }}>{students.length} Students</Typography>
                      <Typography variant="body2">Active: {students.filter((s: any) => s.status === 'active').length}</Typography>
                    </Grid>
                  </Grid>
                </Paper>

                <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
                  <Tab label="Students" />
                  <Tab label="Attendance Stats" />
                  <Tab label="Performance" />
                </Tabs>

                <TabPanel value={tabValue} index={0}>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Student</TableCell>
                          <TableCell>ID</TableCell>
                          <TableCell>Attendance %</TableCell>
                          <TableCell>Average Mark</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {students.map((student: any) => (
                          <TableRow key={student.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                                  {student.user_full_name?.[0] || 'S'}
                                </Avatar>
                                {student.user_full_name}
                              </Box>
                            </TableCell>
                            <TableCell>{student.student_id}</TableCell>
                            <TableCell>
                              <Chip
                                label="85%"
                                size="small"
                                color="success"
                              />
                            </TableCell>
                            <TableCell>72%</TableCell>
                            <TableCell>
                              <Chip
                                label={student.status}
                                size="small"
                                color={student.status === 'active' ? 'success' : 'default'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                  <Card sx={{ p: 3, borderRadius: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <EventNoteIcon sx={{ color: '#1976D2' }} />
                      <Typography variant="h6">Attendance Statistics</Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Today</Typography>
                        <Typography variant="h5">92%</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">This Week</Typography>
                        <Typography variant="h5">88%</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">This Month</Typography>
                        <Typography variant="h5">85%</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Chronic Absentees</Typography>
                        <Typography variant="h5" color="error">2</Typography>
                      </Grid>
                    </Grid>
                  </Card>
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                  <Card sx={{ p: 3, borderRadius: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <TrendingUpIcon sx={{ color: '#1976D2' }} />
                      <Typography variant="h6">Performance Distribution</Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                          <Typography variant="h4" color="success.dark">15</Typography>
                          <Typography variant="body2">A (80-100%)</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
                          <Typography variant="h4" color="info.dark">20</Typography>
                          <Typography variant="body2">B (70-79%)</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
                          <Typography variant="h4" color="warning.dark">10</Typography>
                          <Typography variant="body2">C (60-69%)</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 2 }}>
                          <Typography variant="h4" color="error.dark">5</Typography>
                          <Typography variant="body2">Below 60%</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Card>
                </TabPanel>
              </Box>
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

export default MyClasses;


