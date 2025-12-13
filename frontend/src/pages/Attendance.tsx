import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Chip,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '../services/attendance';
import { academicsService } from '../services/academics';
import Layout from '../components/Layout';

const Attendance: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await academicsService.getClasses();
      return response.data;
    },
  });

  const { data: attendance, isLoading } = useQuery({
    queryKey: ['attendance', selectedClass, selectedDate],
    queryFn: async () => {
      const response = await attendanceService.getAll({
        class: selectedClass,
        date: selectedDate,
      });
      return response.data;
    },
    enabled: !!selectedClass,
  });

  return (
    <Layout>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom>
          Attendance
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Class</InputLabel>
              <Select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                label="Class"
              >
                {classes?.results?.map((cls: any) => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              type="date"
              label="Date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="contained" sx={{ ml: 'auto' }}>
              Mark Attendance
            </Button>
          </Box>
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">Loading...</TableCell>
                </TableRow>
              ) : !attendance?.results || attendance.results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">No attendance records found</TableCell>
                </TableRow>
              ) : (
                attendance.results.map((record: any) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.student_id}</TableCell>
                    <TableCell>{record.student_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={record.status}
                        color={
                          record.status === 'present' ? 'success' :
                          record.status === 'absent' ? 'error' :
                          record.status === 'late' ? 'warning' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{record.date}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </Layout>
  );
};

export default Attendance;

