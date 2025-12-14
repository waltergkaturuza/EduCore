/**
 * Teaching Analytics Dashboard
 * Teacher-level BI and performance insights
 */
import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { teachersService } from '../../services/teachers';
import Layout from '../../components/Layout';

const TeacherAnalytics: React.FC = () => {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['teacherAnalytics'],
    queryFn: () => teachersService.getLatestAnalytics(),
  });

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
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, background: 'linear-gradient(45deg, #1976D2 30%, #42A5F5 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Teaching Analytics
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Lesson Completion Rate</Typography>
                <Typography variant="h4">{analyticsData?.lesson_completion_rate?.toFixed(1) || 0}%</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Assessment Turnaround</Typography>
                <Typography variant="h4">{analyticsData?.assessment_turnaround_hours?.toFixed(1) || 0} hours</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
};

export default TeacherAnalytics;


