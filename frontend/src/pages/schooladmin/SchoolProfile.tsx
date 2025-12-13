/**
 * School Profile & Governance
 * School identity, registration, compliance, branding, and academic configuration
 */
import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  Alert,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Upload as UploadIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  School as SchoolIcon,
  Description as DescriptionIcon,
  Palette as PaletteIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../../services/api';
import Layout from '../../components/Layout';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const SchoolProfile: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadType, setUploadType] = useState('');
  const queryClient = useQueryClient();

  // Fetch school profile
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['schoolProfile'],
    queryFn: () => apiService.get('/schooladmin/school-profile/').then(res => res.data),
  });

  // Fetch academic config
  const { data: academicConfigData } = useQuery({
    queryKey: ['academicConfig'],
    queryFn: () => apiService.get('/schooladmin/academic-config/').then(res => res.data),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => apiService.patch('/schooladmin/school-profile/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schoolProfile'] });
      setEditMode(false);
    },
  });

  const updateAcademicConfigMutation = useMutation({
    mutationFn: (data: any) => apiService.patch('/schooladmin/academic-config/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicConfig'] });
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSave = () => {
    // Save logic will be handled by individual forms
    setEditMode(false);
  };

  if (isLoading) {
    return (
      <Layout>
        <Box sx={{ p: 3 }}>
          <Typography>Loading...</Typography>
        </Box>
      </Layout>
    );
  }

  const profile = (profileData as any)?.results?.[0] || profileData;
  const academicConfig = (academicConfigData as any)?.results?.[0] || academicConfigData;

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, background: 'linear-gradient(45deg, #1976D2 30%, #42A5F5 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              School Profile & Governance
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage school identity, compliance, and academic configuration
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={editMode ? <SaveIcon /> : <EditIcon />}
            onClick={() => editMode ? handleSave() : setEditMode(true)}
            sx={{ borderRadius: 2 }}
          >
            {editMode ? 'Save Changes' : 'Edit Profile'}
          </Button>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="School Identity" icon={<SchoolIcon />} iconPosition="start" />
            <Tab label="Registration & Compliance" icon={<DescriptionIcon />} iconPosition="start" />
            <Tab label="Branding" icon={<PaletteIcon />} iconPosition="start" />
            <Tab label="Academic Configuration" icon={<SettingsIcon />} iconPosition="start" />
          </Tabs>

          {/* School Identity Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Basic Information</Typography>
                    <TextField
                      fullWidth
                      label="School Name"
                      value={profile?.tenant_name || ''}
                      disabled={!editMode}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Ministry Registration Number"
                      value={profile?.ministry_registration_number || ''}
                      disabled={!editMode}
                      onChange={(e) => updateProfileMutation.mutate({ ministry_registration_number: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Accreditation Status</InputLabel>
                      <Select
                        value={profile?.accreditation_status || 'pending'}
                        label="Accreditation Status"
                        disabled={!editMode}
                        onChange={(e) => updateProfileMutation.mutate({ accreditation_status: e.target.value })}
                      >
                        <MenuItem value="accredited">Accredited</MenuItem>
                        <MenuItem value="provisional">Provisional</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="suspended">Suspended</MenuItem>
                      </Select>
                    </FormControl>
                    {profile?.accreditation_expiry && (
                      <TextField
                        fullWidth
                        label="Accreditation Expiry"
                        type="date"
                        value={profile.accreditation_expiry}
                        disabled={!editMode}
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Status</Typography>
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        icon={profile?.accreditation_status === 'accredited' ? <CheckCircleIcon /> : <WarningIcon />}
                        label={`Accreditation: ${profile?.accreditation_status || 'Pending'}`}
                        color={profile?.accreditation_status === 'accredited' ? 'success' : 'warning'}
                        sx={{ mb: 1 }}
                      />
                    </Box>
                    {profile?.accreditation_expiry && (
                      <Alert severity={new Date(profile.accreditation_expiry) > new Date() ? 'info' : 'warning'} sx={{ mb: 2 }}>
                        Accreditation expires: {new Date(profile.accreditation_expiry).toLocaleDateString()}
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Registration & Compliance Tab */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Documents</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                          <DescriptionIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>Registration Certificate</Typography>
                          {profile?.registration_certificate ? (
                            <Button size="small" href={profile.registration_certificate} target="_blank">
                              View Document
                            </Button>
                          ) : (
                            <Button size="small" startIcon={<UploadIcon />} onClick={() => { setUploadType('registration'); setUploadDialogOpen(true); }}>
                              Upload
                            </Button>
                          )}
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                          <DescriptionIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>Constitution</Typography>
                          {profile?.constitution ? (
                            <Button size="small" href={profile.constitution} target="_blank">
                              View Document
                            </Button>
                          ) : (
                            <Button size="small" startIcon={<UploadIcon />} onClick={() => { setUploadType('constitution'); setUploadDialogOpen(true); }}>
                              Upload
                            </Button>
                          )}
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Branding Tab */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Branding</Typography>
                    <Box sx={{ mb: 3, textAlign: 'center' }}>
                      {profile?.logo ? (
                        <Box component="img" src={profile.logo} alt="School Logo" sx={{ maxWidth: 200, maxHeight: 200, borderRadius: 2 }} />
                      ) : (
                        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2, border: '2px dashed', borderColor: 'divider' }}>
                          <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                          <Typography variant="body2" color="text.secondary">No logo uploaded</Typography>
                        </Paper>
                      )}
                      <Button
                        variant="outlined"
                        startIcon={<UploadIcon />}
                        onClick={() => { setUploadType('logo'); setUploadDialogOpen(true); }}
                        sx={{ mt: 2 }}
                      >
                        Upload Logo
                      </Button>
                    </Box>
                    <TextField
                      fullWidth
                      label="Primary Color"
                      type="color"
                      value={profile?.primary_color || '#1976D2'}
                      disabled={!editMode}
                      sx={{ mb: 2 }}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      fullWidth
                      label="Secondary Color"
                      type="color"
                      value={profile?.secondary_color || '#424242'}
                      disabled={!editMode}
                      sx={{ mb: 2 }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Digital Signatures</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Paper sx={{ p: 2, borderRadius: 2 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>Principal Signature</Typography>
                          {profile?.principal_signature ? (
                            <Box component="img" src={profile.principal_signature} alt="Principal Signature" sx={{ maxHeight: 100 }} />
                          ) : (
                            <Button size="small" startIcon={<UploadIcon />} onClick={() => { setUploadType('principal_signature'); setUploadDialogOpen(true); }}>
                              Upload
                            </Button>
                          )}
                        </Paper>
                      </Grid>
                      <Grid item xs={12}>
                        <Paper sx={{ p: 2, borderRadius: 2 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>Bursar Signature</Typography>
                          {profile?.bursar_signature ? (
                            <Box component="img" src={profile.bursar_signature} alt="Bursar Signature" sx={{ maxHeight: 100 }} />
                          ) : (
                            <Button size="small" startIcon={<UploadIcon />} onClick={() => { setUploadType('bursar_signature'); setUploadDialogOpen(true); }}>
                              Upload
                            </Button>
                          )}
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Academic Configuration Tab */}
          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Curriculum & Grading</Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Curriculum Framework</InputLabel>
                      <Select
                        value={academicConfig?.curriculum_framework || 'zimsec'}
                        label="Curriculum Framework"
                        disabled={!editMode}
                        onChange={(e) => updateAcademicConfigMutation.mutate({ curriculum_framework: e.target.value })}
                      >
                        <MenuItem value="zimsec">ZIMSEC</MenuItem>
                        <MenuItem value="cambridge">Cambridge</MenuItem>
                        <MenuItem value="ib">International Baccalaureate</MenuItem>
                        <MenuItem value="custom">Custom</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Grading System</InputLabel>
                      <Select
                        value={academicConfig?.grading_system || 'numeric'}
                        label="Grading System"
                        disabled={!editMode}
                        onChange={(e) => updateAcademicConfigMutation.mutate({ grading_system: e.target.value })}
                      >
                        <MenuItem value="numeric">Numeric (0-100)</MenuItem>
                        <MenuItem value="letter">Letter Grades (A-F)</MenuItem>
                        <MenuItem value="gpa">GPA (0-4.0)</MenuItem>
                        <MenuItem value="competency">Competency-Based</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={academicConfig?.report_card_approval_required || false}
                          disabled={!editMode}
                          onChange={(e) => updateAcademicConfigMutation.mutate({ report_card_approval_required: e.target.checked })}
                        />
                      }
                      label="Report Card Approval Required"
                      sx={{ mb: 2 }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Promotion Rules</Typography>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Promotion rules are configured in JSON format. Contact system administrator for changes.
                    </Alert>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {JSON.stringify(academicConfig?.promotion_rules || {}, null, 2)}
                      </Typography>
                    </Paper>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>

        {/* Upload Dialog */}
        <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Upload {uploadType}</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              type="file"
              inputProps={{ accept: uploadType === 'logo' || uploadType.includes('signature') ? 'image/*' : '.pdf,.doc,.docx' }}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => setUploadDialogOpen(false)}>Upload</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default SchoolProfile;

