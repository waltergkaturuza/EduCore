import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  School as SchoolIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superadminService } from '../../services/superadmin';
import apiService from '../../services/api';

interface Module {
  id: number;
  name: string;
  description: string;
  is_enabled_globally: boolean;
  enabled_for_tenants: number[];
  total_tenants: number;
}

interface FeatureFlag {
  id: number;
  name: string;
  key: string;
  description: string;
  is_enabled: boolean;
  enabled_for_tenants: number[];
  rollout_percentage: number;
}

const FeatureFlags: React.FC = () => {
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const queryClient = useQueryClient();

  // Fetch feature flags from API
  const { data: featureFlagsData, isLoading: featureFlagsLoading, refetch: refetchFeatureFlags } = useQuery({
    queryKey: ['featureFlags'],
    queryFn: superadminService.getFeatureFlags,
  });
  const featureFlags: FeatureFlag[] = featureFlagsData?.results || [];

  // Fetch modules from backend
  const { data: modulesData, isLoading: modulesLoading } = useQuery<{ results: Module[] }>({
    queryKey: ['modules'],
    queryFn: async () => {
      try {
        const response = await apiService.get<{ results: Module[] }>('/superadmin/modules/');
        return response.data;
      } catch (error) {
        // If endpoint doesn't exist yet, return empty array
        return { results: [] };
      }
    },
  });
  const modules: Module[] = modulesData?.results || [];

  // Toggle feature flag mutation
  const toggleFeatureFlagMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: number; isEnabled: boolean }) =>
      superadminService.updateFeatureFlag(id, { is_enabled: !isEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featureFlags'] });
    },
  });

  const handleToggleModule = (module: Module) => {
    // Toggle logic - implement when modules API is available
    console.log('Toggle module', module.id);
  };

  const handleToggleFlag = (flag: FeatureFlag) => {
    toggleFeatureFlagMutation.mutate({ id: flag.id, isEnabled: flag.is_enabled });
  };

  const deleteFeatureFlagMutation = useMutation({
    mutationFn: async (id: number) => {
      // Delete feature flag - implement API call when available
      return apiService.delete(`/superadmin/feature-flags/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featureFlags'] });
      refetchFeatureFlags();
    },
  });

  const handleDeleteFlag = (id: number) => {
    if (window.confirm('Are you sure you want to delete this feature flag? This action cannot be undone.')) {
      deleteFeatureFlagMutation.mutate(id);
    }
  };

  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <SettingsIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                Feature Flags & Module Management
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary">
              Control which features and modules are available to schools
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Refresh feature flags">
              <IconButton onClick={() => refetchFeatureFlags()} color="primary">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setFlagDialogOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              New Feature Flag
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setModuleDialogOpen(true)}
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                },
              }}
            >
              New Module
            </Button>
          </Box>
        </Box>

        {/* Modules Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Modules
          </Typography>
          {modulesLoading ? (
            <LinearProgress sx={{ mb: 3 }} />
          ) : modules.length === 0 ? (
            <Alert severity="info">No modules configured</Alert>
          ) : (
            <Grid container spacing={3}>
              {modules.map((module) => (
                <Grid item xs={12} md={6} key={module.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          {module.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {module.description}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <Chip
                            label={module.is_enabled_globally ? 'Enabled Globally' : 'Per-Tenant'}
                            size="small"
                            color={module.is_enabled_globally ? 'success' : 'default'}
                            sx={{ borderRadius: 2 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {module.enabled_for_tenants.length} / {module.total_tenants} schools
                          </Typography>
                        </Box>
                      </Box>
                      <Tooltip title={module.is_enabled_globally ? 'Disable globally' : 'Enable globally'}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {module.is_enabled_globally ? (
                            <ToggleOnIcon sx={{ color: 'success.main', fontSize: 32 }} />
                          ) : (
                            <ToggleOffIcon sx={{ color: 'text.disabled', fontSize: 32 }} />
                          )}
                          <Switch
                            checked={module.is_enabled_globally}
                            onChange={() => handleToggleModule(module)}
                            color="success"
                          />
                        </Box>
                      </Tooltip>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => {
                          setSelectedModule(module);
                          setModuleDialogOpen(true);
                        }}
                      >
                        Configure
                      </Button>
                      <Button
                        size="small"
                        startIcon={<SchoolIcon />}
                        onClick={() => {
                          setSelectedModule(module);
                          setModuleDialogOpen(true);
                        }}
                      >
                        Assign to Schools
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Feature Flags Section */}
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Feature Flags
          </Typography>
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ background: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Feature Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Key</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Rollout</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Enabled For</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {featureFlagsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">Loading...</TableCell>
                  </TableRow>
                ) : featureFlags.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No feature flags found</TableCell>
                  </TableRow>
                ) : (
                  featureFlags.map((flag: any) => (
                    <TableRow key={flag.id}>
                    <TableCell sx={{ fontWeight: 500 }}>{flag.name}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#64748b' }}>
                        {flag.key}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {flag.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={flag.is_enabled}
                        onChange={() => handleToggleFlag(flag)}
                        color="success"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {flag.rollout_percentage || 0}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {(flag.enabled_for_tenants?.length || 0)} schools
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Tooltip title="Edit feature flag">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setFlagDialogOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete feature flag">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteFlag(flag.id)}
                            disabled={deleteFeatureFlagMutation.isPending}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Module Configuration Dialog */}
        <Dialog
          open={moduleDialogOpen}
          onClose={() => {
            setModuleDialogOpen(false);
            setSelectedModule(null);
          }}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 600, fontSize: '1.5rem' }}>
            {selectedModule ? 'Configure Module' : 'Create New Module'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Module Name"
                margin="normal"
                defaultValue={selectedModule?.name || ''}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                margin="normal"
                defaultValue={selectedModule?.description || ''}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <FormControlLabel
                control={<Checkbox defaultChecked={selectedModule?.is_enabled_globally || false} />}
                label="Enable globally for all schools"
                sx={{ mt: 2 }}
              />
              {!selectedModule?.is_enabled_globally && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Select schools to enable this module for:
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      multiple
                      defaultValue={selectedModule?.enabled_for_tenants || []}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value={1}>Greenwood High</MenuItem>
                      <MenuItem value={2}>Riverside Academy</MenuItem>
                      <MenuItem value={3}>Sunset Primary</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button
              onClick={() => {
                setModuleDialogOpen(false);
                setSelectedModule(null);
              }}
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setModuleDialogOpen(false);
                setSelectedModule(null);
              }}
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

        {/* Feature Flag Dialog */}
        <Dialog
          open={flagDialogOpen}
          onClose={() => setFlagDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 600, fontSize: '1.5rem' }}>
            Create Feature Flag
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Feature Name"
                margin="normal"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                fullWidth
                label="Feature Key"
                margin="normal"
                helperText="Used in code (e.g., ai_grade_prediction)"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                margin="normal"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Rollout Percentage</InputLabel>
                <Select label="Rollout Percentage" defaultValue={0} sx={{ borderRadius: 2 }}>
                  <MenuItem value={0}>0% (Disabled)</MenuItem>
                  <MenuItem value={25}>25%</MenuItem>
                  <MenuItem value={50}>50%</MenuItem>
                  <MenuItem value={75}>75%</MenuItem>
                  <MenuItem value={100}>100% (All Schools)</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button onClick={() => setFlagDialogOpen(false)} sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => setFlagDialogOpen(false)}
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                },
              }}
            >
              Create Flag
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default FeatureFlags;

