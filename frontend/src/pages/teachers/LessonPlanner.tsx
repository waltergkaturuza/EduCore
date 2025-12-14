/**
 * Lesson Planner & Curriculum Mapping
 * Advanced lesson planning with AI assistance
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
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Paper,
  Alert,
  IconButton,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Lightbulb as LightbulbIcon,
  School as SchoolIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teachersService, LessonPlan, LessonTemplate } from '../../services/teachers';
import apiService from '../../services/api';
import Layout from '../../components/Layout';

const LessonPlanner: React.FC = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<LessonPlan | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<LessonTemplate | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [lessonForm, setLessonForm] = useState<any>({
    title: '',
    topic: '',
    subject: null,
    class_obj: null,
    curriculum_framework: 'zimsec',
    blooms_taxonomy_level: 'understand',
    teaching_methods: [],
    objectives: [],
    activities: [],
    planned_duration_minutes: 40,
    scheduled_date: '',
    scheduled_time: '',
  });
  const queryClient = useQueryClient();

  const { data: plansData, isLoading } = useQuery({
    queryKey: ['lessonPlans'],
    queryFn: () => teachersService.getLessonPlans(),
  });

  const { data: templatesData } = useQuery({
    queryKey: ['lessonTemplates'],
    queryFn: () => teachersService.getLessonTemplates(),
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => apiService.get('/academics/subjects/').then(res => res.data),
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiService.get('/academics/classes/').then(res => res.data),
  });

  const plans = (plansData as any)?.results || [];
  const templates = (templatesData as any)?.results || [];
  const subjects = (subjectsData as any)?.results || [];
  const classes = (classesData as any)?.results || [];

  const createPlanMutation = useMutation({
    mutationFn: (data: any) => teachersService.createLessonPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessonPlans'] });
      setCreateDialogOpen(false);
      setLessonForm({
        title: '',
        topic: '',
        subject: null,
        class_obj: null,
        curriculum_framework: 'zimsec',
        blooms_taxonomy_level: 'understand',
        teaching_methods: [],
        objectives: [],
        activities: [],
        planned_duration_minutes: 40,
        scheduled_date: '',
        scheduled_time: '',
      });
    },
  });

  const handleCreatePlan = () => {
    createPlanMutation.mutate(lessonForm);
  };

  const handleGetAISuggestions = async () => {
    try {
      const suggestions = await teachersService.getAISuggestions({
        topic: lessonForm.topic,
        subject_id: lessonForm.subject,
        teaching_method: lessonForm.teaching_methods[0],
        blooms_level: lessonForm.blooms_taxonomy_level,
      });
      setAiSuggestions(suggestions);
      setAiSuggestionsOpen(true);
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
    }
  };

  const handleUseTemplate = (template: LessonTemplate) => {
    setLessonForm({
      ...lessonForm,
      objectives: template.default_objectives || [],
      teaching_methods: template.default_teaching_methods || [],
      activities: template.default_activities || [],
      blooms_taxonomy_level: template.default_blooms_level || 'understand',
    });
    setTemplateDialogOpen(false);
  };

  const deletePlanMutation = useMutation({
    mutationFn: (id: number) => teachersService.deleteLessonPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessonPlans'] });
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const applyAISuggestions = () => {
    if (aiSuggestions) {
      setLessonForm({
        ...lessonForm,
        objectives: aiSuggestions.objectives || lessonForm.objectives,
        activities: aiSuggestions.activities || lessonForm.activities,
      });
      setAiSuggestionsOpen(false);
    }
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
              Lesson Planner
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Advanced lesson planning with curriculum mapping and AI assistance
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<SchoolIcon />}
              onClick={() => setTemplateDialogOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              Templates
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedPlan(null);
                setCreateDialogOpen(true);
              }}
              sx={{ borderRadius: 2 }}
            >
              New Lesson Plan
            </Button>
          </Box>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="All Plans" />
            <Tab label="Scheduled" />
            <Tab label="Delivered" />
            <Tab label="Drafts" />
          </Tabs>
        </Paper>

        {/* Filtered Plans */}
        {tabValue === 0 && plans.length === 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            No lesson plans yet. Create your first lesson plan to get started!
          </Alert>
        )}

        {/* Lesson Plans Grid */}
        <Grid container spacing={3}>
          {plans
            .filter((plan: LessonPlan) => {
              if (tabValue === 0) return true;
              if (tabValue === 1) return plan.status === 'scheduled';
              if (tabValue === 2) return plan.status === 'delivered';
              if (tabValue === 3) return plan.status === 'draft';
              return true;
            })
            .map((plan: LessonPlan) => (
            <Grid item xs={12} md={6} lg={4} key={plan.id}>
              <Card sx={{ borderRadius: 3, boxShadow: 3, height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {plan.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {plan.subject_name} • {plan.class_name}
                      </Typography>
                    </Box>
                    <Chip
                      label={plan.status}
                      size="small"
                      color={
                        plan.status === 'delivered' ? 'success' :
                        plan.status === 'scheduled' ? 'primary' :
                        'default'
                      }
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">Topic:</Typography>
                    <Typography variant="body2">{plan.topic}</Typography>
                  </Box>

                  {plan.scheduled_date && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <ScheduleIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(plan.scheduled_date).toLocaleDateString()}
                        {plan.scheduled_time && ` at ${plan.scheduled_time}`}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip label={plan.curriculum_framework.toUpperCase()} size="small" />
                    <Chip label={plan.blooms_taxonomy_level} size="small" variant="outlined" />
                    <Chip label={`${plan.planned_duration_minutes} min`} size="small" variant="outlined" />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => {
                          setSelectedPlan(plan);
                          setLessonForm({
                            ...plan,
                            subject: plan.subject,
                            class_obj: plan.class_obj,
                          });
                          setCreateDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      {plan.status === 'scheduled' && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={async () => {
                            await teachersService.markLessonDelivered(plan.id);
                            queryClient.invalidateQueries({ queryKey: ['lessonPlans'] });
                          }}
                        >
                          Mark Delivered
                        </Button>
                      )}
                    </Box>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this lesson plan?')) {
                          deletePlanMutation.mutate(plan.id);
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Create/Edit Lesson Plan Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedPlan ? 'Edit Lesson Plan' : 'New Lesson Plan'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Lesson Title"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Topic"
                  value={lessonForm.topic}
                  onChange={(e) => setLessonForm({ ...lessonForm, topic: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Subject</InputLabel>
                  <Select
                    label="Subject"
                    value={lessonForm.subject || ''}
                    onChange={(e) => setLessonForm({ ...lessonForm, subject: e.target.value })}
                    required
                  >
                    {subjects.map((subject: any) => (
                      <MenuItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Class</InputLabel>
                  <Select
                    label="Class"
                    value={lessonForm.class_obj || ''}
                    onChange={(e) => setLessonForm({ ...lessonForm, class_obj: e.target.value })}
                    required
                  >
                    {classes.map((cls: any) => (
                      <MenuItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Curriculum Framework</InputLabel>
                  <Select
                    label="Curriculum Framework"
                    value={lessonForm.curriculum_framework}
                    onChange={(e) => setLessonForm({ ...lessonForm, curriculum_framework: e.target.value })}
                  >
                    <MenuItem value="zimsec">ZIMSEC</MenuItem>
                    <MenuItem value="cambridge">Cambridge</MenuItem>
                    <MenuItem value="ib">International Baccalaureate</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Bloom's Taxonomy Level</InputLabel>
                  <Select
                    label="Bloom's Taxonomy Level"
                    value={lessonForm.blooms_taxonomy_level}
                    onChange={(e) => setLessonForm({ ...lessonForm, blooms_taxonomy_level: e.target.value })}
                  >
                    <MenuItem value="remember">Remember</MenuItem>
                    <MenuItem value="understand">Understand</MenuItem>
                    <MenuItem value="apply">Apply</MenuItem>
                    <MenuItem value="analyze">Analyze</MenuItem>
                    <MenuItem value="evaluate">Evaluate</MenuItem>
                    <MenuItem value="create">Create</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Learning Objectives"
                  multiline
                  rows={3}
                  value={lessonForm.objectives?.join('\n') || ''}
                  onChange={(e) => setLessonForm({
                    ...lessonForm,
                    objectives: e.target.value.split('\n').filter((o: string) => o.trim()),
                  })}
                  placeholder="Enter objectives, one per line"
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2">Teaching Methods</Typography>
                  <Button
                    size="small"
                    startIcon={<LightbulbIcon />}
                    onClick={handleGetAISuggestions}
                  >
                    Get AI Suggestions
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {['lecture', 'group_work', 'practical', 'discussion', 'demonstration'].map((method) => (
                    <FormControlLabel
                      key={method}
                      control={
                        <Checkbox
                          checked={lessonForm.teaching_methods?.includes(method) || false}
                          onChange={(e) => {
                            const methods = lessonForm.teaching_methods || [];
                            if (e.target.checked) {
                              setLessonForm({ ...lessonForm, teaching_methods: [...methods, method] });
                            } else {
                              setLessonForm({ ...lessonForm, teaching_methods: methods.filter((m: string) => m !== method) });
                            }
                          }}
                        />
                      }
                      label={method.replace('_', ' ')}
                    />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Planned Duration (minutes)"
                  type="number"
                  value={lessonForm.planned_duration_minutes}
                  onChange={(e) => setLessonForm({ ...lessonForm, planned_duration_minutes: parseInt(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Scheduled Date"
                  type="date"
                  value={lessonForm.scheduled_date}
                  onChange={(e) => setLessonForm({ ...lessonForm, scheduled_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Content"
                  multiline
                  rows={6}
                  value={lessonForm.content || ''}
                  onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                  placeholder="Lesson content and notes..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setCreateDialogOpen(false);
              setSelectedPlan(null);
            }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreatePlan}
              disabled={createPlanMutation.isPending || !lessonForm.title || !lessonForm.subject || !lessonForm.class_obj}
              startIcon={<SaveIcon />}
            >
              {createPlanMutation.isPending ? 'Saving...' : 'Save Lesson Plan'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Template Dialog */}
        <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SchoolIcon sx={{ color: '#1976D2' }} />
              <Typography variant="h6">Lesson Templates</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            {templates.length === 0 ? (
              <Alert severity="info">No templates available. Create lesson plans to build your template library.</Alert>
            ) : (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {templates.map((template: LessonTemplate) => (
                  <Grid item xs={12} sm={6} key={template.id}>
                    <Paper
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        border: selectedTemplate?.id === template.id ? '2px solid #1976D2' : '1px solid #e0e0e0',
                        '&:hover': { bgcolor: '#f5f5f5' },
                      }}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {template.description}
                      </Typography>
                      <Chip label={template.subject_name || 'All Subjects'} size="small" sx={{ mr: 1 }} />
                      <Typography variant="caption" color="text.secondary">
                        Used {template.usage_count} times
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => selectedTemplate && handleUseTemplate(selectedTemplate)}
              disabled={!selectedTemplate}
              startIcon={<SaveIcon />}
            >
              Use Template
            </Button>
          </DialogActions>
        </Dialog>

        {/* AI Suggestions Dialog */}
        <Dialog open={aiSuggestionsOpen} onClose={() => setAiSuggestionsOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LightbulbIcon sx={{ color: '#1976D2' }} />
              <Typography variant="h6">AI Suggestions</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            {aiSuggestions ? (
              <Box sx={{ mt: 2 }}>
                {aiSuggestions.objectives && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      Suggested Objectives
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                      <ul>
                        {aiSuggestions.objectives.map((obj: string, idx: number) => (
                          <li key={idx}>
                            <Typography variant="body2">{obj}</Typography>
                          </li>
                        ))}
                      </ul>
                    </Paper>
                  </Box>
                )}
                {aiSuggestions.activities && (
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      Suggested Activities
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                      <ul>
                        {aiSuggestions.activities.map((act: string, idx: number) => (
                          <li key={idx}>
                            <Typography variant="body2">{act}</Typography>
                          </li>
                        ))}
                      </ul>
                    </Paper>
                  </Box>
                )}
              </Box>
            ) : (
              <Alert severity="info">No suggestions available. Please provide more details about your lesson.</Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAiSuggestionsOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={applyAISuggestions}
              disabled={!aiSuggestions}
              startIcon={<SaveIcon />}
            >
              Apply Suggestions
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default LessonPlanner;


