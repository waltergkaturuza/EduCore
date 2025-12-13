import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
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
  TextField,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsService } from '../services/students';
import Layout from '../components/Layout';

const Students: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await studentsService.getAll();
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => studentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const handleOpen = (student?: any) => {
    setSelectedStudent(student || null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedStudent(null);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1, color: '#1e293b' }}>
              Students
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and view all student records
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
              },
            }}
          >
            Add Student
          </Button>
        </Box>

        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ background: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Student ID</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Class</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">Loading...</TableCell>
                </TableRow>
              ) : !data?.results || data.results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">No students found</TableCell>
                </TableRow>
              ) : (
                data.results.map((student: any) => (
                  <TableRow
                    key={student.id}
                    sx={{
                      '&:hover': {
                        background: '#f8fafc',
                      },
                      transition: 'background 0.2s',
                    }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>{student.student_id}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{student.user_full_name}</TableCell>
                    <TableCell>{student.current_class_name || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={student.status}
                        color={
                          student.status === 'active' ? 'success' :
                          student.status === 'inactive' ? 'default' : 'warning'
                        }
                        size="small"
                        sx={{ fontWeight: 500, borderRadius: 2 }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleOpen(student)}
                        sx={{
                          color: '#6366f1',
                          '&:hover': {
                            background: 'rgba(99, 102, 241, 0.1)',
                          },
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(student.id)}
                        sx={{
                          color: '#ef4444',
                          '&:hover': {
                            background: 'rgba(239, 68, 68, 0.1)',
                          },
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 600, fontSize: '1.5rem', pb: 1 }}>
            {selectedStudent ? 'Edit Student' : 'Add New Student'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Student ID"
                margin="normal"
                defaultValue={selectedStudent?.student_id || ''}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
              <TextField
                fullWidth
                label="First Name"
                margin="normal"
                defaultValue={selectedStudent?.user?.first_name || ''}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
              <TextField
                fullWidth
                label="Last Name"
                margin="normal"
                defaultValue={selectedStudent?.user?.last_name || ''}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                margin="normal"
                defaultValue={selectedStudent?.user?.email || ''}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button onClick={handleClose} sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button
              onClick={handleClose}
              variant="contained"
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                },
              }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default Students;

