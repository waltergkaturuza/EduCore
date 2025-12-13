import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
} from '@mui/material';
import { PlayArrow as PlayIcon } from '@mui/icons-material';
import Layout from '../components/Layout';

const LMS: React.FC = () => {
  // Mock courses - replace with actual API call
  const courses = [
    {
      id: 1,
      title: 'Mathematics Grade 7',
      description: 'Introduction to algebra and geometry',
      thumbnail: '',
      lessonCount: 12,
    },
    {
      id: 2,
      title: 'English Language',
      description: 'Grammar and composition',
      thumbnail: '',
      lessonCount: 15,
    },
  ];

  return (
    <Layout>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom>
          e-Learning
        </Typography>

        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid item xs={12} sm={6} md={4} key={course.id}>
              <Card>
                {course.thumbnail && (
                  <CardMedia
                    component="img"
                    height="140"
                    image={course.thumbnail}
                    alt={course.title}
                  />
                )}
                <CardContent>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {course.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {course.description}
                  </Typography>
                  <Chip label={`${course.lessonCount} Lessons`} size="small" />
                </CardContent>
                <CardActions>
                  <Button size="small" startIcon={<PlayIcon />}>
                    Start Course
                  </Button>
                  <Button size="small">View Details</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Layout>
  );
};

export default LMS;



