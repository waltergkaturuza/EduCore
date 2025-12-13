import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { assessmentsService } from '../services/assessments';
import Layout from '../components/Layout';

const Assessments: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const { data: assignments } = useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      const response = await assessmentsService.getAssignments();
      return response.data;
    },
  });

  const { data: grades } = useQuery({
    queryKey: ['grades'],
    queryFn: async () => {
      const response = await assessmentsService.getGrades();
      return response.data;
    },
  });

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Assessments
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />}>
            New Assignment
          </Button>
        </Box>

        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="Assignments" />
            <Tab label="Grades" />
            <Tab label="Report Cards" />
          </Tabs>
        </Paper>

        {tabValue === 0 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Class</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments?.results?.map((assignment: any) => (
                  <TableRow key={assignment.id}>
                    <TableCell>{assignment.title}</TableCell>
                    <TableCell>{assignment.subject_name}</TableCell>
                    <TableCell>{assignment.class_name}</TableCell>
                    <TableCell>{new Date(assignment.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={assignment.is_published ? 'Published' : 'Draft'}
                        color={assignment.is_published ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
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

        {tabValue === 1 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Assessment</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Percentage</TableCell>
                  <TableCell>Grade</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {grades?.results?.map((grade: any) => (
                  <TableRow key={grade.id}>
                    <TableCell>{grade.student_name}</TableCell>
                    <TableCell>{grade.assessment_name}</TableCell>
                    <TableCell>{grade.score}</TableCell>
                    <TableCell>{grade.percentage}%</TableCell>
                    <TableCell>
                      <Chip label={grade.letter_grade} size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
    </Layout>
  );
};

export default Assessments;

