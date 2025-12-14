/**
 * Timetable Management
 * Intelligent timetable engine with versioning and conflict detection
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Paper,
  Alert,
  AlertTitle,
  Switch,
  FormControlLabel,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Publish as PublishIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../../services/api';
import Layout from '../../components/Layout';

const TimetableManagement: React.FC = () => {
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const queryClient = useQueryClient();

  const { data: versionsData, isLoading } = useQuery({
    queryKey: ['timetableVersions'],
    queryFn: () => apiService.get('/schooladmin/timetable-versions/').then(res => res.data),
  });

  const versions = (versionsData as any)?.results || [];

  const publishMutation = useMutation({
    mutationFn: (id: number) => apiService.post(`/schooladmin/timetable-versions/${id}/publish/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetableVersions'] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: number) => apiService.post(`/schooladmin/timetable-versions/${id}/activate/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetableVersions'] });
    },
  });

  const deleteVersionMutation = useMutation({
    mutationFn: (id: number) => apiService.delete(`/schooladmin/timetable-versions/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetableVersions'] });
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['timetableVersions'] });
  };

  const handleEdit = (version: any) => {
    setSelectedVersion(version);
    setEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this timetable version? This action cannot be undone.')) {
      deleteVersionMutation.mutate(id);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewVersion = (version: any) => {
    setSelectedVersion(version);
    setViewDialogOpen(true);
  };

  const handlePublish = (id: number) => {
    if (window.confirm('Publish this timetable version? This will unpublish other versions.')) {
      publishMutation.mutate(id);
    }
  };

  const handleActivate = (id: number) => {
    if (window.confirm('Activate this timetable version? This will deactivate other versions.')) {
      activateMutation.mutate(id);
    }
  };

  // Sample timetable data structure
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = ['08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00', '13:00-14:00', '14:00-15:00'];

  if (isLoading) {
    return (
      <Layout>
        <Box sx={{ p: 3 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
            Loading timetable versions...
          </Typography>
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
              Timetable Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Intelligent timetable engine with versioning and conflict detection
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={handleRefresh} color="primary" title="Refresh">
              <RefreshIcon />
            </IconButton>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              New Timetable Version
            </Button>
          </Box>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="All Versions" />
            <Tab label="Active Version" />
            <Tab label="Published Versions" />
            <Tab label="Conflicts" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {/* All Versions Tab */}
            {tabValue === 0 && (
              <Box>
                {versions.length === 0 ? (
                  <Alert severity="info">No timetable versions found. Create a new version to get started.</Alert>
                ) : (
                  <Grid container spacing={3}>
                    {versions.map((version: any) => (
                      <Grid item xs={12} md={6} lg={4} key={version.id}>
                        <Card sx={{ borderRadius: 3, boxShadow: 3, border: version.is_active ? '2px solid' : 'none', borderColor: version.is_active ? 'primary.main' : 'transparent' }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                              <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                  {version.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {version.academic_year_name} - v{version.version_number}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <IconButton size="small" onClick={() => handleEdit(version)} title="Edit">
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" color="error" onClick={() => handleDelete(version.id)} title="Delete" disabled={deleteVersionMutation.isPending}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                            {version.is_active && <Chip label="Active" color="primary" size="small" sx={{ mb: 1, mr: 1 }} />}
                            {version.is_published && <Chip label="Published" color="success" size="small" sx={{ mb: 1 }} />}
                            <Box sx={{ mb: 2 }}>
                              <Chip
                                label={version.generation_method.replace('_', ' ').toUpperCase()}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 1 }}
                              />
                              {version.has_conflicts && (
                                <Chip
                                  label="Has Conflicts"
                                  size="small"
                                  color="error"
                                  icon={<WarningIcon />}
                                />
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Button
                                size="small"
                                startIcon={<VisibilityIcon />}
                                onClick={() => handleViewVersion(version)}
                              >
                                View
                              </Button>
                              {!version.is_published && (
                                <Button
                                  size="small"
                                  startIcon={<PublishIcon />}
                                  onClick={() => handlePublish(version.id)}
                                >
                                  Publish
                                </Button>
                              )}
                              {!version.is_active && (
                                <Button
                                  size="small"
                                  startIcon={<CheckCircleIcon />}
                                  onClick={() => handleActivate(version.id)}
                                >
                                  Activate
                                </Button>
                              )}
                              <Button size="small" startIcon={<DownloadIcon />}>
                                Export
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}

            {/* Active Version Tab */}
            {tabValue === 1 && (
              <Box>
                {versions.filter((v: any) => v.is_active).length === 0 ? (
                  <Alert severity="warning">No active timetable version found. Activate a version to view it here.</Alert>
                ) : (
                  <Grid container spacing={3}>
                    {versions
                      .filter((v: any) => v.is_active)
                      .map((version: any) => (
                        <Grid item xs={12} md={6} lg={4} key={version.id}>
                          <Card sx={{ borderRadius: 3, boxShadow: 3, border: '2px solid', borderColor: 'primary.main' }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                                <Box>
                                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    {version.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {version.academic_year_name} - v{version.version_number}
                                  </Typography>
                                </Box>
                                <Chip label="Active" color="primary" size="small" />
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Button size="small" startIcon={<VisibilityIcon />} onClick={() => handleViewVersion(version)}>
                                  View
                                </Button>
                                <Button size="small" startIcon={<DownloadIcon />}>Export</Button>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                  </Grid>
                )}
              </Box>
            )}

            {/* Published Versions Tab */}
            {tabValue === 2 && (
              <Box>
                {versions.filter((v: any) => v.is_published).length === 0 ? (
                  <Alert severity="info">No published timetable versions found.</Alert>
                ) : (
                  <Grid container spacing={3}>
                    {versions
                      .filter((v: any) => v.is_published)
                      .map((version: any) => (
                        <Grid item xs={12} md={6} lg={4} key={version.id}>
                          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                                <Box>
                                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    {version.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {version.academic_year_name} - v{version.version_number}
                                  </Typography>
                                </Box>
                                <Chip label="Published" color="success" size="small" />
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Button size="small" startIcon={<VisibilityIcon />} onClick={() => handleViewVersion(version)}>
                                  View
                                </Button>
                                <Button size="small" startIcon={<DownloadIcon />}>Export</Button>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                  </Grid>
                )}
              </Box>
            )}

            {/* Conflicts Tab */}
            {tabValue === 3 && (
              <Box>
                {versions.filter((v: any) => v.has_conflicts).length === 0 ? (
                  <Alert severity="success">
                    <AlertTitle>No Conflicts</AlertTitle>
                    All timetable versions are conflict-free!
                  </Alert>
                ) : (
                  <Box>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <AlertTitle>Conflicts Detected</AlertTitle>
                      The following timetable versions have conflicts that need to be resolved.
                    </Alert>
                    <Grid container spacing={3}>
                      {versions
                        .filter((v: any) => v.has_conflicts)
                        .map((version: any) => (
                          <Grid item xs={12} md={6} lg={4} key={version.id}>
                            <Card sx={{ borderRadius: 3, boxShadow: 3, border: '2px solid', borderColor: 'error.main' }}>
                              <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                                  <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                      {version.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {version.academic_year_name} - v{version.version_number}
                                    </Typography>
                                  </Box>
                                  <Chip label="Has Conflicts" color="error" size="small" icon={<WarningIcon />} />
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                  <Button size="small" startIcon={<VisibilityIcon />} onClick={() => handleViewVersion(version)}>
                                    View Conflicts
                                  </Button>
                                  <Button size="small" startIcon={<EditIcon />} onClick={() => handleEdit(version)}>
                                    Resolve
                                  </Button>
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                    </Grid>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Paper>


        {/* Timetable View Dialog */}
        <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="xl" fullWidth>
          <DialogTitle>
            Timetable - {selectedVersion?.name}
          </DialogTitle>
          <DialogContent>
            {selectedVersion && (
              <Box>
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                        {daysOfWeek.map((day) => (
                          <TableCell key={day} sx={{ fontWeight: 600 }}>{day}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {periods.map((period, periodIdx) => (
                        <TableRow key={periodIdx}>
                          <TableCell sx={{ fontWeight: 600 }}>{period}</TableCell>
                          {daysOfWeek.map((day, dayIdx) => (
                            <TableCell key={dayIdx}>
                              <Paper sx={{ p: 1, bgcolor: 'primary.light', color: 'white', borderRadius: 1, textAlign: 'center' }}>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>Math</Typography>
                                <Typography variant="caption" display="block">Form 1A</Typography>
                                <Typography variant="caption" display="block">Room 101</Typography>
                              </Paper>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
            <Button variant="contained" startIcon={<DownloadIcon />}>Export PDF</Button>
          </DialogActions>
        </Dialog>

        {/* Create Version Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Timetable Version</DialogTitle>
          <DialogContent>
            <TextField fullWidth label="Version Name" sx={{ mt: 2, mb: 2 }} placeholder="e.g., Main Timetable, Emergency Timetable" />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Academic Year</InputLabel>
              <Select label="Academic Year">
                <MenuItem value={1}>2024</MenuItem>
                <MenuItem value={2}>2025</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Generation Method</InputLabel>
              <Select label="Generation Method" defaultValue="manual">
                <MenuItem value="manual">Manual</MenuItem>
                <MenuItem value="ai_assisted">AI-Assisted</MenuItem>
                <MenuItem value="auto">Automatic</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Set as Active"
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button variant="contained">Create Version</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Version Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Timetable Version - {selectedVersion?.name}</DialogTitle>
          <DialogContent>
            {selectedVersion && (
              <Box sx={{ mt: 2 }}>
                <TextField fullWidth label="Version Name" defaultValue={selectedVersion.name} sx={{ mb: 2 }} />
                <Alert severity="info" sx={{ mb: 2 }}>
                  Edit timetable version details. Changes will affect all associated timetable slots.
                </Alert>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button variant="contained">Save Changes</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default TimetableManagement;

