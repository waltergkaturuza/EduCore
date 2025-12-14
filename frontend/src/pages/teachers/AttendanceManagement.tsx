/**
 * Attendance Management (Enterprise-Grade)
 * One-click attendance marking with intelligence & alerts
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
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../../services/api';
import Layout from '../../components/Layout';

const AttendanceManagement: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<Record<number, string>>({});
  const [remarksData, setRemarksData] = useState<Record<number, string>>({});
  const [markDialogOpen, setMarkDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['teacherClasses'],
    queryFn: () => apiService.get('/academics/classes/').then(res => res.data),
  });

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['classStudents', selectedClass?.id, attendanceDate],
    queryFn: () => {
      if (!selectedClass) return null;
      return apiService.get(`/students/students/?current_class=${selectedClass.id}`).then(res => res.data);
    },
    enabled: !!selectedClass,
  });

  const { data: existingAttendanceData } = useQuery({
    queryKey: ['attendance', selectedClass?.id, attendanceDate],
    queryFn: () => {
      if (!selectedClass) return null;
      return apiService.get(`/attendance/attendances/?class_obj=${selectedClass.id}&date=${attendanceDate}`).then(res => res.data);
    },
    enabled: !!selectedClass,
  });

  const classes = (classesData as any)?.results || [];
  
  // Memoize students to prevent unnecessary re-renders
  const students = useMemo(() => (studentsData as any)?.results || [], [studentsData]);
  
  // Memoize existingAttendance to prevent unnecessary re-renders
  const existingAttendance = useMemo(() => (existingAttendanceData as any)?.results || [], [existingAttendanceData]);

  // Initialize attendance data
  React.useEffect(() => {
    if (students.length > 0) {
      const initialData: Record<number, string> = {};
      const initialRemarks: Record<number, string> = {};
      students.forEach((student: any) => {
        const existing = existingAttendance.find((a: any) => a.student === student.id);
        initialData[student.id] = existing?.status || 'present';
        initialRemarks[student.id] = existing?.remarks || '';
      });
      setAttendanceData(initialData);
      setRemarksData(initialRemarks);
    }
  }, [students, existingAttendance]);

  const markAttendanceMutation = useMutation({
    mutationFn: async (data: { student: number; status: string; remarks?: string }[]) => {
      // Mark attendance for all students
      const promises = data.map((item) =>
        apiService.post('/attendance/attendances/', {
          student: item.student,
          class_obj: selectedClass.id,
          date: attendanceDate,
          status: item.status,
          remarks: item.remarks,
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setMarkDialogOpen(false);
      alert('Attendance marked successfully!');
    },
  });

  const handleBulkMark = (status: string) => {
    const newData = { ...attendanceData };
    students.forEach((student: any) => {
      newData[student.id] = status;
    });
    setAttendanceData(newData);
  };

  const handleSaveAttendance = () => {
    const data = students.map((student: any) => ({
      student: student.id,
      status: attendanceData[student.id] || 'present',
      remarks: remarksData[student.id] || '',
    }));
    markAttendanceMutation.mutate(data);
  };

  const handleOpenMarkDialog = (student: any) => {
    setSelectedStudent(student);
    setMarkDialogOpen(true);
  };

  const handleCloseMarkDialog = () => {
    setMarkDialogOpen(false);
    setSelectedStudent(null);
  };

  const handleMarkInDialog = (status: string) => {
    if (selectedStudent) {
      setAttendanceData({ ...attendanceData, [selectedStudent.id]: status });
    }
    handleCloseMarkDialog();
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'present':
        return (
          <Chip
            icon={<CheckCircleIcon />}
            label="Present"
            color="success"
            size="small"
          />
        );
      case 'absent':
        return (
          <Chip
            icon={<CancelIcon />}
            label="Absent"
            color="error"
            size="small"
          />
        );
      case 'late':
        return (
          <Chip
            icon={<ScheduleIcon />}
            label="Late"
            color="warning"
            size="small"
          />
        );
      case 'excused':
        return (
          <Chip
            icon={<WarningIcon />}
            label="Excused"
            color="info"
            size="small"
          />
        );
      default:
        return null;
    }
  };

  if (classesLoading) {
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
              Attendance Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              One-click attendance marking with intelligence & alerts
            </Typography>
          </Box>
        </Box>

        {/* Class & Date Selection */}
        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Select Class</InputLabel>
                  <Select
                    label="Select Class"
                    value={selectedClass?.id || ''}
                    onChange={(e) => {
                      const cls = classes.find((c: any) => c.id === e.target.value);
                      setSelectedClass(cls);
                    }}
                  >
                    {classes.map((cls: any) => (
                      <MenuItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Attendance Table */}
        {studentsLoading ? (
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                Loading students...
              </Typography>
            </CardContent>
          </Card>
        ) : selectedClass && students.length > 0 && (
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selectedClass.name} - {new Date(attendanceDate).toLocaleDateString()}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleBulkMark('present')}
                    sx={{ textTransform: 'none' }}
                  >
                    Mark All Present
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={() => handleBulkMark('absent')}
                    sx={{ textTransform: 'none' }}
                  >
                    Mark All Absent
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveAttendance}
                    disabled={markAttendanceMutation.isPending}
                    sx={{ textTransform: 'none' }}
                  >
                    {markAttendanceMutation.isPending ? 'Saving...' : 'Save Attendance'}
                  </Button>
                </Box>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell>ID</TableCell>
                      <TableCell align="center">Present</TableCell>
                      <TableCell align="center">Absent</TableCell>
                      <TableCell align="center">Late</TableCell>
                      <TableCell align="center">Excused</TableCell>
                      <TableCell>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((student: any) => (
                      <TableRow key={student.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {student.user_full_name || student.user?.full_name}
                          {getStatusChip(attendanceData[student.id] || 'present')}
                        </Box>
                      </TableCell>
                      <TableCell>{student.student_id || student.id}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => setAttendanceData({ ...attendanceData, [student.id]: 'present' })}
                        >
                          <CheckCircleIcon
                            sx={{
                              color: attendanceData[student.id] === 'present' ? 'success.main' : 'action.disabled',
                            }}
                          />
                        </IconButton>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setAttendanceData({ ...attendanceData, [student.id]: 'absent' })}
                        >
                          <CancelIcon
                            sx={{
                              color: attendanceData[student.id] === 'absent' ? 'error.main' : 'action.disabled',
                            }}
                          />
                        </IconButton>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => setAttendanceData({ ...attendanceData, [student.id]: 'late' })}
                        >
                          <ScheduleIcon
                            sx={{
                              color: attendanceData[student.id] === 'late' ? 'warning.main' : 'action.disabled',
                            }}
                          />
                        </IconButton>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => setAttendanceData({ ...attendanceData, [student.id]: 'excused' })}
                        >
                          <WarningIcon
                            sx={{
                              color: attendanceData[student.id] === 'excused' ? 'info.main' : 'action.disabled',
                            }}
                          />
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <TextField
                            size="small"
                            placeholder="Optional remarks"
                            fullWidth
                            value={remarksData[student.id] || ''}
                            onChange={(e) => setRemarksData({ ...remarksData, [student.id]: e.target.value })}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleOpenMarkDialog(student)}
                            title="Quick mark attendance"
                          >
                            <ScheduleIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Summary */}
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Total</Typography>
                    <Typography variant="h6">{students.length}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Present</Typography>
                    <Typography variant="h6" color="success.main">
                      {Object.values(attendanceData).filter((s) => s === 'present').length}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Absent</Typography>
                    <Typography variant="h6" color="error.main">
                      {Object.values(attendanceData).filter((s) => s === 'absent').length}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Attendance %</Typography>
                    <Typography variant="h6">
                      {students.length > 0
                        ? ((Object.values(attendanceData).filter((s) => s === 'present' || s === 'late' || s === 'excused').length / students.length) * 100).toFixed(1)
                        : 0}%
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        )}

        {!selectedClass && (
          <Alert severity="info">Please select a class to mark attendance</Alert>
        )}

        {/* Quick Mark Attendance Dialog */}
        <Dialog
          open={markDialogOpen}
          onClose={handleCloseMarkDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Mark Attendance - {selectedStudent?.user_full_name || selectedStudent?.user?.full_name}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Select Status:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant={attendanceData[selectedStudent?.id] === 'present' ? 'contained' : 'outlined'}
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleMarkInDialog('present')}
                    sx={{ textTransform: 'none', py: 1.5 }}
                  >
                    Present
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant={attendanceData[selectedStudent?.id] === 'absent' ? 'contained' : 'outlined'}
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => handleMarkInDialog('absent')}
                    sx={{ textTransform: 'none', py: 1.5 }}
                  >
                    Absent
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant={attendanceData[selectedStudent?.id] === 'late' ? 'contained' : 'outlined'}
                    color="warning"
                    startIcon={<ScheduleIcon />}
                    onClick={() => handleMarkInDialog('late')}
                    sx={{ textTransform: 'none', py: 1.5 }}
                  >
                    Late
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant={attendanceData[selectedStudent?.id] === 'excused' ? 'contained' : 'outlined'}
                    color="info"
                    startIcon={<WarningIcon />}
                    onClick={() => handleMarkInDialog('excused')}
                    sx={{ textTransform: 'none', py: 1.5 }}
                  >
                    Excused
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Remarks (Optional)"
                    multiline
                    rows={3}
                    value={remarksData[selectedStudent?.id] || ''}
                    onChange={(e) => {
                      if (selectedStudent) {
                        setRemarksData({ ...remarksData, [selectedStudent.id]: e.target.value });
                      }
                    }}
                    sx={{ mt: 2 }}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseMarkDialog} sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                handleCloseMarkDialog();
              }}
              sx={{ textTransform: 'none' }}
            >
              Done
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default AttendanceManagement;


