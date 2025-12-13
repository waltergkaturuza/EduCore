import React from 'react';
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
  Chip,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { academicsService } from '../services/academics';
import Layout from '../components/Layout';

const Classes: React.FC = () => {
  const { data: classes, isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await academicsService.getClasses();
      return response.data;
    },
  });

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Classes
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />}>
            Add Class
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Academic Year</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Class Teacher</TableCell>
                <TableCell>Streams</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">Loading...</TableCell>
                </TableRow>
              ) : !classes?.results || classes.results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">No classes found</TableCell>
                </TableRow>
              ) : (
                classes.results.map((cls: any) => (
                  <TableRow key={cls.id}>
                    <TableCell>{cls.name}</TableCell>
                    <TableCell>{cls.academic_year_name}</TableCell>
                    <TableCell>{cls.level}</TableCell>
                    <TableCell>{cls.capacity}</TableCell>
                    <TableCell>{cls.class_teacher_name || 'N/A'}</TableCell>
                    <TableCell>
                      {cls.streams?.map((stream: any) => (
                        <Chip key={stream.id} label={stream.name} size="small" sx={{ mr: 0.5 }} />
                      ))}
                    </TableCell>
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

export default Classes;

