/**
 * Ministry Exports
 * ZIMSEC/Ministry-compliant export formats and submission tracking
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
  Paper,
  Alert,
  LinearProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schooladminService, MinistryExport } from '../../services/schooladmin';
import apiService from '../../services/api';
import Layout from '../../components/Layout';

const MinistryExports: React.FC = () => {
  const [createExportDialogOpen, setCreateExportDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedExport, setSelectedExport] = useState<MinistryExport | null>(null);
  const queryClient = useQueryClient();

  const { data: exportsData, isLoading } = useQuery({
    queryKey: ['ministryExports'],
    queryFn: () => schooladminService.getMinistryExports(),
  });

  const { data: formatsData } = useQuery({
    queryKey: ['ministryExportFormats'],
    queryFn: () => apiService.get('/schooladmin/ministry-export-formats/').then(res => res.data),
  });

  const exports = (exportsData as any)?.results || [];
  const formats = (formatsData as any)?.results || [];

  const generateMutation = useMutation({
    mutationFn: (id: number) => schooladminService.generateMinistryExport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministryExports'] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => schooladminService.submitMinistryExport(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministryExports'] });
      setSubmitDialogOpen(false);
    },
  });

  const handleGenerate = (id: number) => {
    if (window.confirm('Generate this ministry export? This may take a few moments.')) {
      generateMutation.mutate(id);
    }
  };

  const handleSubmit = (exportItem: MinistryExport) => {
    setSelectedExport(exportItem);
    setSubmitDialogOpen(true);
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
              Ministry Exports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ZIMSEC/Ministry-compliant export formats and submission tracking
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateExportDialogOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            New Export
          </Button>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Exports</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                      {exports.length}
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
                <Typography variant="body2" color="text.secondary">Submitted</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'success.main' }}>
                  {exports.filter((e: MinistryExport) => e.submitted_to_ministry).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Export Formats</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'primary.main' }}>
                  {formats.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Pending</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'warning.main' }}>
                  {exports.filter((e: MinistryExport) => e.status === 'generating' || e.status === 'completed' && !e.submitted_to_ministry).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Export Formats */}
        <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Available Export Formats</Typography>
            <Grid container spacing={2}>
              {formats.map((format: any) => (
                <Grid item xs={12} sm={6} md={4} key={format.id}>
                  <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      {format.format_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {format.ministry_department}
                    </Typography>
                    <Chip label={format.format_type.replace('_', ' ')} size="small" />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Exports Table */}
        <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Export History</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Export Name</TableCell>
                    <TableCell>Format</TableCell>
                    <TableCell>Academic Year</TableCell>
                    <TableCell>Term</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Exported</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {exports.map((exportItem: MinistryExport) => (
                    <TableRow key={exportItem.id} hover>
                      <TableCell>{exportItem.export_name}</TableCell>
                      <TableCell>{exportItem.export_format_name}</TableCell>
                      <TableCell>{exportItem.academic_year_name || '-'}</TableCell>
                      <TableCell>{exportItem.term_name || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={exportItem.status}
                          size="small"
                          color={
                            exportItem.status === 'completed' ? 'success' :
                            exportItem.status === 'generating' ? 'warning' :
                            exportItem.status === 'submitted' ? 'info' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {exportItem.submitted_to_ministry ? (
                          <Chip icon={<CheckCircleIcon />} label="Yes" size="small" color="success" />
                        ) : (
                          <Chip label="No" size="small" />
                        )}
                      </TableCell>
                      <TableCell>{new Date(exportItem.exported_at).toLocaleString()}</TableCell>
                      <TableCell>
                        {exportItem.status === 'completed' && exportItem.file && (
                          <IconButton size="small" href={exportItem.file} target="_blank">
                            <DownloadIcon />
                          </IconButton>
                        )}
                        {exportItem.status === 'generating' && (
                          <Button size="small" onClick={() => handleGenerate(exportItem.id)}>
                            Generate
                          </Button>
                        )}
                        {exportItem.status === 'completed' && !exportItem.submitted_to_ministry && (
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleSubmit(exportItem)}
                          >
                            <SendIcon />
                          </IconButton>
                        )}
                        {exportItem.submitted_to_ministry && exportItem.submission_reference && (
                          <Tooltip title={`Reference: ${exportItem.submission_reference}`}>
                            <CheckCircleIcon color="success" />
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Create Export Dialog */}
        <Dialog open={createExportDialogOpen} onClose={() => setCreateExportDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create Ministry Export</DialogTitle>
          <DialogContent>
            <TextField fullWidth label="Export Name" sx={{ mt: 2, mb: 2 }} />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Export Format</InputLabel>
              <Select label="Export Format">
                {formats.map((format: any) => (
                  <MenuItem key={format.id} value={format.id}>
                    {format.format_name} - {format.ministry_department}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Academic Year</InputLabel>
              <Select label="Academic Year">
                <MenuItem value={1}>2024</MenuItem>
                <MenuItem value={2}>2025</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Term (Optional)</InputLabel>
              <Select label="Term (Optional)">
                <MenuItem value="">None</MenuItem>
                <MenuItem value={1}>Term 1</MenuItem>
                <MenuItem value={2}>Term 2</MenuItem>
                <MenuItem value={3}>Term 3</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateExportDialogOpen(false)}>Cancel</Button>
            <Button variant="contained">Create Export</Button>
          </DialogActions>
        </Dialog>

        {/* Submit Dialog */}
        <Dialog open={submitDialogOpen} onClose={() => setSubmitDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Submit to Ministry</DialogTitle>
          <DialogContent>
            {selectedExport && (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Mark this export as submitted to {selectedExport.export_format_name?.includes('ZIMSEC') ? 'ZIMSEC' : 'Ministry of Education'}
                </Alert>
                <TextField
                  fullWidth
                  label="Submission Reference"
                  placeholder="e.g., REF-2024-001"
                  sx={{ mb: 2 }}
                  helperText="Reference number provided by the ministry"
                />
                <TextField
                  fullWidth
                  label="Submission Notes"
                  multiline
                  rows={3}
                  sx={{ mb: 2 }}
                  placeholder="Additional notes about the submission..."
                />
                <TextField
                  fullWidth
                  label="Submission Date"
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSubmitDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => {
                if (selectedExport) {
                  const reference = (document.querySelector('input[placeholder="e.g., REF-2024-001"]') as HTMLInputElement)?.value || '';
                  const notes = (document.querySelector('textarea') as HTMLTextAreaElement)?.value || '';
                  submitMutation.mutate({
                    id: selectedExport.id,
                    data: { submission_reference: reference, submission_notes: notes },
                  });
                }
              }}
            >
              Submit to Ministry
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default MinistryExports;

