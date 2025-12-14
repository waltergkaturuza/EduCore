/**
 * Reports & Analytics
 * Intelligence center with custom reports and analytics
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
  Tabs,
  Tab,
  Paper,
  Alert,
  LinearProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
  BarChart as BarChartIcon,
  Description as DescriptionIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schooladminService, GeneratedReport } from '../../services/schooladmin';
import apiService from '../../services/api';
import Layout from '../../components/Layout';

const ReportsAnalytics: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [createReportDialogOpen, setCreateReportDialogOpen] = useState(false);
  const [createQueryDialogOpen, setCreateQueryDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['generatedReports'],
    queryFn: () => schooladminService.getGeneratedReports(),
  });

  const { data: queriesData } = useQuery({
    queryKey: ['analyticsQueries'],
    queryFn: () => apiService.get('/schooladmin/analytics-queries/').then(res => res.data),
  });

  const { data: templatesData } = useQuery({
    queryKey: ['reportTemplates'],
    queryFn: () => apiService.get('/schooladmin/report-templates/').then(res => res.data),
  });

  const reports = (reportsData as any)?.results || [];
  const queries = (queriesData as any)?.results || [];
  const templates = (templatesData as any)?.results || [];

  const regenerateMutation = useMutation({
    mutationFn: (id: number) => schooladminService.regenerateReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generatedReports'] });
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, background: 'linear-gradient(45deg, #1976D2 30%, #42A5F5 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Reports & Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Intelligence center with custom reports and analytics
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<BarChartIcon />}
              onClick={() => setCreateQueryDialogOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              New Query
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateReportDialogOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              Generate Report
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Generated Reports</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                      {reports.length}
                    </Typography>
                  </Box>
                  <DescriptionIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Analytics Queries</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'primary.main' }}>
                  {queries.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Report Templates</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'primary.main' }}>
                  {templates.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">This Month</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'primary.main' }}>
                  {reports.filter((r: GeneratedReport) => {
                    const reportDate = new Date(r.generated_at);
                    const now = new Date();
                    return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
                  }).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Generated Reports" icon={<DescriptionIcon />} iconPosition="start" />
            <Tab label="Analytics Queries" icon={<BarChartIcon />} iconPosition="start" />
            <Tab label="Templates" icon={<AssessmentIcon />} iconPosition="start" />
          </Tabs>

          {/* Generated Reports Tab */}
          <Box sx={{ p: 3 }}>
            {tabValue === 0 && (
              <>
                {reports.length === 0 ? (
                  <Alert severity="info">No reports have been generated yet. Create a new report to get started.</Alert>
                ) : (
                  <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Report Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Format</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Records</TableCell>
                      <TableCell>Generated</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reports.map((report: GeneratedReport) => (
                      <TableRow key={report.id} hover>
                        <TableCell>{report.report_name}</TableCell>
                        <TableCell>
                          <Chip label={report.report_type} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip label={report.format.toUpperCase()} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={report.status}
                            size="small"
                            color={
                              report.status === 'completed' ? 'success' :
                              report.status === 'generating' ? 'warning' :
                              'error'
                            }
                          />
                        </TableCell>
                        <TableCell>{report.record_count}</TableCell>
                        <TableCell>{new Date(report.generated_at).toLocaleString()}</TableCell>
                        <TableCell>
                          {report.status === 'completed' && report.file && (
                            <IconButton size="small" href={report.file} target="_blank">
                              <DownloadIcon />
                            </IconButton>
                          )}
                          <IconButton size="small" onClick={() => regenerateMutation.mutate(report.id)}>
                            <RefreshIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
                )}
              </>
            )}

            {/* Analytics Queries Tab */}
            {tabValue === 1 && (
              <Grid container spacing={3}>
                {queries.map((query: any) => (
                  <Grid item xs={12} md={6} key={query.id}>
                    <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {query.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {query.description || 'No description'}
                            </Typography>
                          </Box>
                          {query.is_shared && <Chip label="Shared" size="small" color="success" />}
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Chip label={query.query_type.replace('_', ' ')} size="small" sx={{ mr: 1 }} />
                          <Chip label={query.visualization_type} size="small" variant="outlined" />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" startIcon={<BarChartIcon />}>Execute</Button>
                          <Button size="small" startIcon={<VisibilityIcon />}>View</Button>
                          <Button size="small" startIcon={<EditIcon />}>Edit</Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            {/* Templates Tab */}
            {tabValue === 2 && (
              <Grid container spacing={3}>
                {templates.map((template: any) => (
                  <Grid item xs={12} md={6} lg={4} key={template.id}>
                    <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {template.name}
                          </Typography>
                          {template.is_ministry_format && (
                            <Chip label="Ministry" size="small" color="success" />
                          )}
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Chip label={template.report_type} size="small" sx={{ mr: 1 }} />
                          <Chip label={template.template_format.toUpperCase()} size="small" variant="outlined" />
                        </Box>
                        <Button size="small" startIcon={<AddIcon />} fullWidth>
                          Generate Report
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Paper>

        {/* Create Report Dialog */}
        <Dialog open={createReportDialogOpen} onClose={() => setCreateReportDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Generate Report</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
              <InputLabel>Report Template</InputLabel>
              <Select label="Report Template">
                {templates.map((template: any) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name} ({template.report_type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Report Type</InputLabel>
              <Select label="Report Type" defaultValue="academic">
                <MenuItem value="academic">Academic Report</MenuItem>
                <MenuItem value="attendance">Attendance Report</MenuItem>
                <MenuItem value="financial">Financial Report</MenuItem>
                <MenuItem value="enrollment">Enrollment Report</MenuItem>
                <MenuItem value="staff">Staff Report</MenuItem>
                <MenuItem value="ministry">Ministry Report</MenuItem>
                <MenuItem value="custom">Custom Report</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Format</InputLabel>
              <Select label="Format" defaultValue="pdf">
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="excel">Excel</MenuItem>
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="html">HTML</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth label="Date Range Start" type="date" sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
            <TextField fullWidth label="Date Range End" type="date" sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateReportDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" startIcon={<AddIcon />}>Generate</Button>
          </DialogActions>
        </Dialog>

        {/* Create Query Dialog */}
        <Dialog open={createQueryDialogOpen} onClose={() => setCreateQueryDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create Analytics Query</DialogTitle>
          <DialogContent>
            <TextField fullWidth label="Query Name" sx={{ mt: 2, mb: 2 }} />
            <TextField fullWidth label="Description" multiline rows={2} sx={{ mb: 2 }} />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Query Type</InputLabel>
              <Select label="Query Type">
                <MenuItem value="enrollment_trend">Enrollment Trend</MenuItem>
                <MenuItem value="attendance_analysis">Attendance Analysis</MenuItem>
                <MenuItem value="academic_performance">Academic Performance</MenuItem>
                <MenuItem value="financial_analysis">Financial Analysis</MenuItem>
                <MenuItem value="teacher_effectiveness">Teacher Effectiveness</MenuItem>
                <MenuItem value="custom">Custom Query</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Visualization Type</InputLabel>
              <Select label="Visualization Type" defaultValue="table">
                <MenuItem value="line">Line Chart</MenuItem>
                <MenuItem value="bar">Bar Chart</MenuItem>
                <MenuItem value="pie">Pie Chart</MenuItem>
                <MenuItem value="table">Table</MenuItem>
                <MenuItem value="heatmap">Heatmap</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateQueryDialogOpen(false)}>Cancel</Button>
            <Button variant="contained">Create Query</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default ReportsAnalytics;

