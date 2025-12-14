/**
 * Digital Gradebook
 * Custom grading schemes, weighted assessments, and academic integrity
 */
import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Chip,
  LinearProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Save as SaveIcon, Download as DownloadIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../../services/api';
import Layout from '../../components/Layout';
import { downloadBlob, formatExportFilename } from '../../utils/exportHelpers';

const Gradebook: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [grades, setGrades] = useState<Record<number, Record<number, number>>>({});
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
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

  const { data: assignmentsData } = useQuery({
    queryKey: ['assignments', selectedClass?.id, selectedSubject?.id],
    queryFn: () => {
      if (!selectedClass || !selectedSubject) return null;
      return apiService.get(`/assessments/assignments/?class_obj=${selectedClass.id}&subject=${selectedSubject.id}`).then(res => res.data);
    },
    enabled: !!selectedClass && !!selectedSubject,
  });

  const classes = (classesData as any)?.results || [];
  const students = (studentsData as any)?.results || [];
  const assignments = (assignmentsData as any)?.results || [];

  // Fetch existing grades
  const { data: gradesData, isLoading: gradesLoading } = useQuery({
    queryKey: ['grades', selectedClass?.id, selectedSubject?.id],
    queryFn: () => {
      if (!selectedClass || !selectedSubject) return null;
      return apiService.get(`/assessments/grades/?class_obj=${selectedClass.id}&subject=${selectedSubject.id}`).then(res => res.data);
    },
    enabled: !!selectedClass && !!selectedSubject,
  });

  // Memoize existingGrades to prevent unnecessary re-renders
  const existingGrades = useMemo(() => (gradesData as any)?.results || [], [gradesData]);

  // Initialize grades state from existing grades
  React.useEffect(() => {
    if (existingGrades.length > 0) {
      const gradesMap: Record<number, Record<number, number>> = {};
      existingGrades.forEach((grade: any) => {
        const assessmentId = Number(grade.assessment || grade.assignment);
        if (!gradesMap[assessmentId]) {
          gradesMap[assessmentId] = {};
        }
        gradesMap[assessmentId][grade.student] = parseFloat(grade.score) || 0;
      });
      setGrades(gradesMap);
    }
  }, [existingGrades]);

  const handleGradeChange = (assignmentId: number, studentId: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    setGrades({
      ...grades,
      [assignmentId]: {
        ...grades[assignmentId],
        [studentId]: numValue,
      },
    });
  };

  const getStudentAverage = (studentId: number): string => {
    if (!assignments.length) return '0.0';
    let total = 0;
    let count = 0;
    assignments.forEach((assignment: any) => {
      const grade = grades[assignment.id]?.[studentId];
      if (grade !== undefined) {
        total += grade;
        count++;
      }
    });
    return count > 0 ? (total / count).toFixed(1) : '0.0';
  };

  const saveGradesMutation = useMutation({
    mutationFn: async () => {
      setSaving(true);
      const promises: Promise<any>[] = [];
      Object.entries(grades).forEach(([assignmentIdStr, assignmentGrades]) => {
        const assignmentId = Number(assignmentIdStr);
        if (!assignmentGrades) return;
        
        Object.entries(assignmentGrades).forEach(([studentIdStr, score]) => {
          const studentId = Number(studentIdStr);
          if (score > 0) {
            promises.push(
              apiService.post('/assessments/grades/', {
                assessment: assignmentId,
                student: studentId,
                score: score,
              }).catch((error) => {
                // If grade exists (409 conflict), try to update it
                if (error.response?.status === 409 || error.response?.status === 400) {
                  // Try to find existing grade and update
                  const existingGrade = existingGrades.find((g: any) => 
                    g.assessment === assignmentId && g.student === studentId
                  );
                  if (existingGrade) {
                    return apiService.patch(`/assessments/grades/${existingGrade.id}/`, {
                      score: score,
                    });
                  }
                }
                throw error;
              })
            );
          }
        });
      });
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades', selectedClass?.id, selectedSubject?.id] });
      queryClient.invalidateQueries({ queryKey: ['assignments', selectedClass?.id, selectedSubject?.id] });
      setSaving(false);
    },
    onError: (error) => {
      console.error('Error saving grades:', error);
      setSaving(false);
    },
  });

  const handleSaveGrades = () => {
    saveGradesMutation.mutate();
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['grades', selectedClass?.id, selectedSubject?.id] });
    queryClient.invalidateQueries({ queryKey: ['assignments', selectedClass?.id, selectedSubject?.id] });
  };

  const handleDownloadGrades = () => {
    if (!selectedClass || !selectedSubject || students.length === 0 || assignments.length === 0) {
      return;
    }

    // Prepare CSV data
    const headers = ['Student Name', 'Student ID', ...assignments.map((a: any) => a.title || 'Assignment'), 'Average'];
    const rows: string[][] = [headers];

    students.forEach((student: any) => {
      const row: string[] = [
        student.user_full_name || student.user?.full_name || '',
        student.student_id || student.id?.toString() || '',
      ];

      // Add grades for each assignment
      assignments.forEach((assignment: any) => {
        const grade = grades[assignment.id]?.[student.id];
        row.push(grade !== undefined ? grade.toString() : '');
      });

      // Add average
      const average = getStudentAverage(student.id);
      row.push(average);

      rows.push(row);
    });

    // Convert to CSV string
    const csvContent = rows.map(row => 
      row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = formatExportFilename(
      `Grades_${selectedClass.name}_${selectedSubject.id || selectedSubject.title}`,
      'csv'
    );
    downloadBlob(blob, filename);
  };

  return (
    <Layout>
      <Box sx={{ p: 3, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, background: 'linear-gradient(45deg, #1976D2 30%, #42A5F5 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Digital Gradebook
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh grades">
              <IconButton onClick={handleRefresh} disabled={!selectedClass || !selectedSubject}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download grades as CSV">
              <IconButton
                onClick={handleDownloadGrades}
                disabled={!selectedClass || !selectedSubject || students.length === 0 || assignments.length === 0}
                color="primary"
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveGrades}
              disabled={!selectedClass || !selectedSubject || saving}
              sx={{ textTransform: 'none' }}
            >
              {saving ? 'Saving...' : 'Save Grades'}
            </Button>
          </Box>
        </Box>

        <Card sx={{ mb: 3, p: 2 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Class</InputLabel>
                  <Select
                    value={selectedClass?.id || ''}
                    onChange={(e) => {
                      const newClass = classes.find((c: any) => c.id === e.target.value);
                      setSelectedClass(newClass);
                      setSelectedSubject(null);
                      setGrades({});
                    }}
                  >
                    {classes.map((cls: any) => (
                      <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Subject</InputLabel>
                  <Select
                    value={selectedSubject?.id || ''}
                    onChange={(e) => {
                      const newSubject = assignments.find((a: any) => a.subject === e.target.value);
                      setSelectedSubject(newSubject);
                      setGrades({});
                    }}
                    disabled={!selectedClass}
                  >
                    <MenuItem value="">Select Subject</MenuItem>
                    {assignments.map((a: any) => (
                      <MenuItem key={a.subject || a.id} value={a.subject || a.id}>
                        {a.subject_name || a.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {gradesLoading ? (
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              Loading grades...
            </Typography>
          </Paper>
        ) : selectedClass && selectedSubject && assignments.length > 0 && students.length > 0 ? (
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
                  {assignments.map((assignment: any) => (
                    <TableCell key={assignment.id} align="center" sx={{ fontWeight: 600 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {assignment.title}
                        </Typography>
                        {assignment.max_score && (
                          <Typography variant="caption" color="text.secondary">
                            /{assignment.max_score}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Average</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student: any) => (
                  <TableRow key={student.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {student.user_full_name || student.user?.full_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    {assignments.map((assignment: any) => (
                      <TableCell key={assignment.id} align="center">
                        <TextField
                          size="small"
                          type="number"
                          sx={{ width: 80 }}
                          value={grades[assignment.id]?.[student.id] || ''}
                          onChange={(e) => handleGradeChange(assignment.id, student.id, e.target.value)}
                          inputProps={{
                            min: 0,
                            max: assignment.max_score || 100,
                            step: 0.1,
                          }}
                        />
                      </TableCell>
                    ))}
                    <TableCell align="center">
                      {(() => {
                        const average = getStudentAverage(student.id);
                        const averageNum = parseFloat(average);
                        return (
                          <Chip
                            label={`${average}%`}
                            color={
                              averageNum >= 80 ? 'success' :
                              averageNum >= 60 ? 'warning' :
                              'error'
                            }
                            size="small"
                          />
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : selectedClass && selectedSubject ? (
          <Alert severity="info">
            No assignments found for this class and subject. Create assignments first.
          </Alert>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="body1" color="text.secondary">
              Please select a class and subject to view grades
            </Typography>
          </Paper>
        )}
      </Box>
    </Layout>
  );
};

export default Gradebook;


