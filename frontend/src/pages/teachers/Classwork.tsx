/**
 * Classwork - Google Classroom-like View
 * Comprehensive classwork management across all classes
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogContent,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Divider,
  Paper,
  Menu,
  MenuList,
  Stack,
  ButtonGroup,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Add as AddIcon,
  Quiz as QuizIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Folder as FolderIcon,
  MoreVert as MoreVertIcon,
  Topic as TopicIcon,
  CloudQueue as DriveIcon,
  YouTube as YouTubeIcon,
  Link as LinkIcon,
  Upload as UploadIcon,
  Create as CreateIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Close as CloseIcon,
  FormatBold as FormatBoldIcon,
  FormatItalic as FormatItalicIcon,
  FormatUnderlined as FormatUnderlinedIcon,
  FormatListBulleted as FormatListBulletedIcon,
  FormatListNumbered as FormatListNumberedIcon,
  Clear as ClearIcon,
  Info as InfoIcon,
  Autorenew as AutorenewIcon,
  School as SchoolIcon,
  CalendarToday as CalendarTodayIcon,
  Save as SaveIcon,
  AccessTime as AccessTimeIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../../services/api';
import { teachersService } from '../../services/teachers';
import Layout from '../../components/Layout';

const Classwork: React.FC = () => {
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [createMenuAnchor, setCreateMenuAnchor] = useState<null | HTMLElement>(null);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [postType, setPostType] = useState<'assignment' | 'quiz' | 'question' | 'material'>('assignment');
  const queryClient = useQueryClient();

  // Form state
  const [postForm, setPostForm] = useState({
    title: '',
    description: '',
    class_obj: '',
    points: 100,
    due_date: '',
    topic: '',
    assign_to: 'all',
    attachments: [] as any[],
  });
  const [assignMenuAnchor, setAssignMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedAttachments, setSelectedAttachments] = useState<any[]>([]);
  const [errors, setErrors] = useState<{ title?: string; class_obj?: string }>({});

  // Fetch all classes
  const { data: classesData } = useQuery({
    queryKey: ['teacherClasses'],
    queryFn: () => apiService.get('/academics/classes/').then(res => res.data),
  });

  // Fetch all classwork (filtered)
  const { data: classworkData, isLoading: classworkLoading } = useQuery({
    queryKey: ['allClasswork', selectedClass, selectedTopic],
    queryFn: () => {
      const params: any = {
        post_type: 'assignment,quiz,question,material',
      };
      if (selectedClass !== 'all') {
        params.class_obj = selectedClass;
      }
      if (selectedTopic !== 'all') {
        params.topic = selectedTopic;
      }
      return teachersService.getClassPosts(params);
    },
  });

  // Fetch topics for selected class in form
  const { data: formTopicsData } = useQuery<{ results: any[]; count: number; next: string | null; previous: string | null }>({
    queryKey: ['formClassTopics', postForm.class_obj],
    queryFn: async () => {
      if (!postForm.class_obj) {
        return { results: [], count: 0, next: null, previous: null };
      }
      return teachersService.getClassTopics({ class_obj: Number(postForm.class_obj) });
    },
    enabled: !!postForm.class_obj && postDialogOpen,
  });

  // Fetch topics for selected class in filter
  const { data: topicsData } = useQuery<{ results: any[]; count: number; next: string | null; previous: string | null }>({
    queryKey: ['classTopics', selectedClass],
    queryFn: async () => {
      if (selectedClass === 'all') {
        return { results: [], count: 0, next: null, previous: null };
      }
      return teachersService.getClassTopics({ class_obj: Number(selectedClass) });
    },
    enabled: selectedClass !== 'all',
  });

  const classes = (classesData as any)?.results || [];
  const classwork = (classworkData as any)?.results || [];
  const topics = (topicsData as any)?.results || [];
  const formTopics = (formTopicsData as any)?.results || [];

  const handleCreateMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setCreateMenuAnchor(event.currentTarget);
  };

  const handleCreateMenuClose = () => {
    setCreateMenuAnchor(null);
  };

  const handleCreatePost = (type: typeof postType) => {
    setPostType(type);
    setPostDialogOpen(true);
    handleCreateMenuClose();
    setPostForm({
      title: '',
      description: '',
      class_obj: selectedClass !== 'all' ? selectedClass : '',
      points: 100,
      due_date: '',
      topic: '',
      assign_to: 'all',
      attachments: [],
    });
  };

  const createPostMutation = useMutation({
    mutationFn: (data: any) => teachersService.createClassPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allClasswork'] });
      queryClient.invalidateQueries({ queryKey: ['classPosts'] });
      setPostDialogOpen(false);
      setPostForm({
        title: '',
        description: '',
        class_obj: '',
        points: 100,
        due_date: '',
        topic: '',
        assign_to: 'all',
        attachments: [],
      });
      setSelectedAttachments([]);
      setErrors({});
    },
    onError: (error: any) => {
      console.error('Error creating post:', error);
      // Could add error toast notification here
    },
  });

  const handleSubmitPost = (isDraft: boolean = false, scheduleTime?: string) => {
    // Validation
    const newErrors: { title?: string; class_obj?: string } = {};
    if (!postForm.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!postForm.class_obj) {
      newErrors.class_obj = 'Please select a class';
    }
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) return;

    // Prepare attachments for upload
    const attachmentsToSend = selectedAttachments.map(att => ({
      name: att.name,
      type: att.type || 'file',
      url: att.url || null,
      // File will be uploaded separately if needed
    }));

    const formData: any = {
      class_obj: Number(postForm.class_obj),
      post_type: postType,
      title: postForm.title.trim(),
      description: postForm.description || '',
      topic: postForm.topic || null,
      attachments: attachmentsToSend,
      is_draft: isDraft,
    };

    // Add scheduled_time if provided
    if (scheduleTime) {
      formData.scheduled_time = new Date(scheduleTime).toISOString();
    }

    // Note: Points and due_date will need to be handled via linked_assignment, linked_quiz, or linked_question
    // For now, we'll store them in a metadata field or handle them in a follow-up API call
    // The backend ClassPost model doesn't have direct points/due_date fields - they're on linked objects

    createPostMutation.mutate(formData);
  };

  const handleAssignMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (postForm.title && postForm.class_obj) {
      setAssignMenuAnchor(event.currentTarget);
    }
  };

  const handleAssignMenuClose = () => {
    setAssignMenuAnchor(null);
  };

  const handleSchedulePost = () => {
    // For now, just assign immediately. In future, could open a date picker
    handleSubmitPost(false);
    handleAssignMenuClose();
  };

  const handleSaveDraft = () => {
    handleSubmitPost(true);
    handleAssignMenuClose();
  };

  // Format date for display
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <Layout>
      <Box sx={{ p: 3, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 400, mb: 0.5, color: '#202124' }}>
              Classwork
            </Typography>
            <Typography variant="body2" sx={{ color: '#5f6368' }}>
              Manage assignments, quizzes, and materials across all your classes
            </Typography>
          </Box>
          <Tooltip title="Classwork Settings">
            <IconButton
              sx={{ color: '#5f6368' }}
              onClick={() => {
                // Could open settings dialog
                alert('Settings coming soon!');
              }}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Filters and Create Button */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flex: 1, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Class</InputLabel>
              <Select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedTopic('all'); // Reset topic when class changes
                }}
                sx={{ bgcolor: 'white' }}
              >
                <MenuItem value="all">All classes</MenuItem>
                {classes.map((cls: any) => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Topic</InputLabel>
              <Select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                disabled={selectedClass === 'all'}
                sx={{ bgcolor: 'white' }}
              >
                <MenuItem value="all">All topics</MenuItem>
                <MenuItem value="uncategorized">Uncategorized</MenuItem>
                {topics.map((topic: any) => (
                  <MenuItem key={topic.id} value={topic.id}>
                    {topic.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateMenuOpen}
            sx={{
              bgcolor: '#1967d2',
              textTransform: 'none',
              borderRadius: '24px',
              px: 3,
              '&:hover': { bgcolor: '#1557b0' }
            }}
          >
            Create
            <ArrowDropDownIcon />
          </Button>

          <Menu
            anchorEl={createMenuAnchor}
            open={Boolean(createMenuAnchor)}
            onClose={handleCreateMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuList>
              <MenuItem onClick={() => handleCreatePost('assignment')}>
                <AssignmentIcon sx={{ mr: 2, color: '#5f6368' }} />
                Assignment
              </MenuItem>
              <MenuItem onClick={() => handleCreatePost('quiz')}>
                <QuizIcon sx={{ mr: 2, color: '#5f6368' }} />
                Quiz assignment
              </MenuItem>
              <MenuItem onClick={() => handleCreatePost('question')}>
                <QuestionAnswerIcon sx={{ mr: 2, color: '#5f6368' }} />
                Question
              </MenuItem>
              <MenuItem onClick={() => handleCreatePost('material')}>
                <FolderIcon sx={{ mr: 2, color: '#5f6368' }} />
                Material
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => navigate('/teacher/classes')}>
                <AutorenewIcon sx={{ mr: 2, color: '#5f6368' }} />
                Reuse post
              </MenuItem>
              <MenuItem onClick={() => navigate('/teacher/classes')}>
                <TopicIcon sx={{ mr: 2, color: '#5f6368' }} />
                Topic
              </MenuItem>
            </MenuList>
          </Menu>
        </Box>

        {/* Classwork List */}
        {classworkLoading ? (
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              Loading classwork...
            </Typography>
          </Paper>
        ) : classwork.length === 0 ? (
          <Card elevation={0} sx={{ border: '1px solid #dadce0', borderRadius: '8px' }}>
            <CardContent>
              <Typography color="text.secondary" align="center" sx={{ py: 8 }}>
                No classwork yet. Create an assignment, quiz, or material to get started!
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Card elevation={0} sx={{ border: '1px solid #dadce0', borderRadius: '8px', bgcolor: 'white' }}>
            <List>
              {classwork.map((item: any, idx: number) => (
                <React.Fragment key={item.id}>
                  <ListItem 
                    sx={{ 
                      py: 2,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#f8f9fa' }
                    }}
                    onClick={() => navigate(`/teacher/classes/${item.class_obj}`)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: '#1967d2', 
                        width: 40, 
                        height: 40 
                      }}>
                        {item.post_type === 'assignment' ? <AssignmentIcon /> :
                         item.post_type === 'quiz' ? <QuizIcon /> :
                         item.post_type === 'question' ? <QuestionAnswerIcon /> :
                         <FolderIcon />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 400 }}>
                            {item.title}
                          </Typography>
                          <Chip
                            size="small"
                            label={item.class_name || 'Class'}
                            icon={<SchoolIcon />}
                            sx={{ 
                              height: 20, 
                              fontSize: '0.75rem',
                              bgcolor: '#e8f0fe',
                              color: '#1967d2'
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          {item.due_date && (
                            <Typography variant="body2" sx={{ color: '#5f6368', display: 'inline' }}>
                              Due {new Date(item.due_date).toLocaleDateString()}
                            </Typography>
                          )}
                          {!item.due_date && item.published_at && (
                            <Typography variant="body2" sx={{ color: '#5f6368', display: 'inline' }}>
                              Posted {new Date(item.published_at).toLocaleDateString()}
                            </Typography>
                          )}
                          {item.topic && (
                            <Chip
                              size="small"
                              label={item.topic.name}
                              icon={<TopicIcon />}
                              sx={{ 
                                ml: 1, 
                                height: 20, 
                                fontSize: '0.75rem',
                                bgcolor: '#e8f0fe', 
                                color: '#1967d2'
                              }}
                            />
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        size="small" 
                        edge="end"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {idx < classwork.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Card>
        )}

        {/* Create Post Dialog - Full Screen Style */}
        <Dialog 
          open={postDialogOpen} 
          onClose={() => setPostDialogOpen(false)} 
          maxWidth="lg" 
          fullWidth
          PaperProps={{
            sx: {
              maxWidth: '900px',
              maxHeight: '90vh',
              borderRadius: '8px',
            }
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              p: 2,
              borderBottom: '1px solid #dadce0',
              bgcolor: 'white'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton 
                  size="small" 
                  onClick={() => setPostDialogOpen(false)}
                  sx={{ color: '#5f6368' }}
                >
                  <CloseIcon />
                </IconButton>
                <IconButton 
                  size="small"
                  sx={{ color: '#5f6368', ml: 0.5 }}
                  onClick={() => {
                    if (window.confirm('Discard this assignment?')) {
                      setPostDialogOpen(false);
                    }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                  {postType === 'assignment' && <AssignmentIcon sx={{ color: '#5f6368', fontSize: 20 }} />}
                  {postType === 'quiz' && <QuizIcon sx={{ color: '#5f6368', fontSize: 20 }} />}
                  {postType === 'question' && <QuestionAnswerIcon sx={{ color: '#5f6368', fontSize: 20 }} />}
                  {postType === 'material' && <FolderIcon sx={{ color: '#5f6368', fontSize: 20 }} />}
                  <Typography variant="h6" sx={{ textTransform: 'capitalize', fontWeight: 400, fontSize: '1.125rem', color: '#202124' }}>
                    {postType}
                  </Typography>
                </Box>
              </Box>
              <ButtonGroup variant="outlined" sx={{ border: 'none' }}>
                <Button
                  onClick={() => handleSubmitPost(false)}
                  disabled={!postForm.title || !postForm.class_obj || createPostMutation.isPending}
                  sx={{
                    textTransform: 'none',
                    bgcolor: (postForm.title && postForm.class_obj) ? '#1967d2' : '#f1f3f4',
                    color: (postForm.title && postForm.class_obj) ? 'white' : '#5f6368',
                    border: 'none',
                    borderRadius: '4px',
                    px: 3,
                    py: 1,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: (postForm.title && postForm.class_obj) ? '#1557b0' : '#f1f3f4',
                    },
                    '&.Mui-disabled': {
                      bgcolor: '#f1f3f4',
                      color: '#5f6368',
                      border: 'none',
                    }
                  }}
                >
                  {postType === 'assignment' || postType === 'quiz' ? 'Assign' : 'Post'}
                </Button>
                <Button
                  size="small"
                  onClick={handleAssignMenuOpen}
                  disabled={!postForm.title || !postForm.class_obj}
                  sx={{ 
                    minWidth: 'auto', 
                    px: 0.5,
                    bgcolor: (postForm.title && postForm.class_obj) ? '#1967d2' : '#f1f3f4',
                    color: (postForm.title && postForm.class_obj) ? 'white' : '#5f6368',
                    border: 'none',
                    '&:hover': {
                      bgcolor: (postForm.title && postForm.class_obj) ? '#1557b0' : '#f1f3f4',
                    },
                    '&.Mui-disabled': {
                      bgcolor: '#f1f3f4',
                      color: '#5f6368',
                      border: 'none',
                    }
                  }}
                >
                  <ArrowDropDownIcon />
                </Button>
              </ButtonGroup>
              
              {/* Assign Menu Dropdown */}
              <Menu
                anchorEl={assignMenuAnchor}
                open={Boolean(assignMenuAnchor)}
                onClose={handleAssignMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuList>
                  <MenuItem onClick={() => { handleSubmitPost(false); handleAssignMenuClose(); }}>
                    <AssignmentIcon sx={{ mr: 2, fontSize: 20, color: '#5f6368' }} />
                    {postType === 'assignment' || postType === 'quiz' ? 'Assign' : 'Post'}
                  </MenuItem>
                  <MenuItem onClick={handleSchedulePost}>
                    <AccessTimeIcon sx={{ mr: 2, fontSize: 20, color: '#5f6368' }} />
                    Schedule
                  </MenuItem>
                  <MenuItem onClick={handleSaveDraft}>
                    <SaveIcon sx={{ mr: 2, fontSize: 20, color: '#5f6368' }} />
                    Save draft
                  </MenuItem>
                </MenuList>
              </Menu>
            </Box>

            {/* Content */}
            <DialogContent sx={{ p: 0, display: 'flex', flex: 1, overflow: 'hidden' }}>
              <Grid container sx={{ height: '100%' }}>
                {/* Main Content */}
                <Grid item xs={12} md={8} sx={{ borderRight: '1px solid #dadce0', display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
                  <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
                    {/* Title Field */}
                    <Box sx={{ mb: 3 }}>
                      <TextField
                        fullWidth
                        label="Title"
                        required
                        value={postForm.title}
                        onChange={(e) => {
                          setPostForm({ ...postForm, title: e.target.value });
                          if (errors.title) setErrors({ ...errors, title: undefined });
                        }}
                        error={!!errors.title}
                        helperText={errors.title}
                        InputLabelProps={{ 
                          shrink: true,
                          sx: { 
                            fontSize: '0.875rem',
                            color: '#5f6368',
                            fontWeight: 400
                          }
                        }}
                        InputProps={{
                          sx: {
                            fontSize: '1rem',
                            '&:focus-within': {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#1967d2',
                                borderWidth: '2px'
                              }
                            }
                          }
                        }}
                        placeholder="Title*"
                      />
                      <Typography variant="caption" sx={{ color: '#5f6368', mt: 0.5, display: 'block' }}>
                        *Required
                      </Typography>
                    </Box>
                    
                    {/* Instructions Field with Rich Text Toolbar */}
                    <Box sx={{ mb: 3 }}>
                      <TextField
                        fullWidth
                        label="Instructions (optional)"
                        multiline
                        rows={6}
                        value={postForm.description}
                        onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                        InputLabelProps={{ 
                          shrink: true,
                          sx: { 
                            fontSize: '0.875rem',
                            color: '#5f6368',
                            fontWeight: 400
                          }
                        }}
                        placeholder="Instructions..."
                        InputProps={{
                          sx: {
                            fontSize: '0.875rem',
                          }
                        }}
                      />
                      {/* Rich Text Toolbar - Below textarea */}
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.5, 
                        mt: 1,
                        borderTop: '1px solid #e0e0e0',
                        pt: 1
                      }}>
                        <IconButton 
                          size="small" 
                          sx={{ 
                            width: 32, 
                            height: 32,
                            '&:hover': { bgcolor: '#f1f3f4' }
                          }}
                          onClick={() => {
                            document.execCommand('bold', false);
                          }}
                        >
                          <FormatBoldIcon sx={{ fontSize: 18, color: '#5f6368' }} />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          sx={{ 
                            width: 32, 
                            height: 32,
                            '&:hover': { bgcolor: '#f1f3f4' }
                          }}
                          onClick={() => {
                            document.execCommand('italic', false);
                          }}
                        >
                          <FormatItalicIcon sx={{ fontSize: 18, color: '#5f6368' }} />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          sx={{ 
                            width: 32, 
                            height: 32,
                            '&:hover': { bgcolor: '#f1f3f4' }
                          }}
                          onClick={() => {
                            document.execCommand('underline', false);
                          }}
                        >
                          <FormatUnderlinedIcon sx={{ fontSize: 18, color: '#5f6368' }} />
                        </IconButton>
                        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20 }} />
                        <IconButton 
                          size="small" 
                          sx={{ 
                            width: 32, 
                            height: 32,
                            '&:hover': { bgcolor: '#f1f3f4' }
                          }}
                          onClick={() => {
                            document.execCommand('insertUnorderedList', false);
                          }}
                        >
                          <FormatListBulletedIcon sx={{ fontSize: 18, color: '#5f6368' }} />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          sx={{ 
                            width: 32, 
                            height: 32,
                            '&:hover': { bgcolor: '#f1f3f4' }
                          }}
                          onClick={() => {
                            document.execCommand('insertOrderedList', false);
                          }}
                        >
                          <FormatListNumberedIcon sx={{ fontSize: 18, color: '#5f6368' }} />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          sx={{ 
                            width: 32, 
                            height: 32,
                            '&:hover': { bgcolor: '#f1f3f4' }
                          }}
                          onClick={() => {
                            document.execCommand('removeFormat', false);
                          }}
                        >
                          <ClearIcon sx={{ fontSize: 18, color: '#5f6368' }} />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Attachments */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1.5, color: '#5f6368', fontWeight: 500, fontSize: '0.875rem' }}>
                        Attach
                      </Typography>
                      <Stack direction="row" spacing={2} flexWrap="wrap">
                        <Button
                          variant="outlined"
                          startIcon={<DriveIcon />}
                          sx={{ 
                            textTransform: 'none', 
                            borderColor: '#dadce0', 
                            color: '#202124',
                            borderRadius: '24px',
                            px: 2,
                            py: 0.75,
                            fontSize: '0.875rem',
                            '&:hover': {
                              borderColor: '#1967d2',
                              bgcolor: '#f8f9fa'
                            }
                          }}
                        >
                          Drive
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<YouTubeIcon />}
                          sx={{ 
                            textTransform: 'none', 
                            borderColor: '#dadce0', 
                            color: '#202124',
                            borderRadius: '24px',
                            px: 2,
                            py: 0.75,
                            fontSize: '0.875rem',
                            '&:hover': {
                              borderColor: '#1967d2',
                              bgcolor: '#f8f9fa'
                            }
                          }}
                        >
                          YouTube
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<CreateIcon />}
                          sx={{ 
                            textTransform: 'none', 
                            borderColor: '#dadce0', 
                            color: '#202124',
                            borderRadius: '24px',
                            px: 2,
                            py: 0.75,
                            fontSize: '0.875rem',
                            '&:hover': {
                              borderColor: '#1967d2',
                              bgcolor: '#f8f9fa'
                            }
                          }}
                        >
                          Create
                        </Button>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<UploadIcon />}
                          sx={{ 
                            textTransform: 'none', 
                            borderColor: '#dadce0', 
                            color: '#202124',
                            borderRadius: '24px',
                            px: 2,
                            py: 0.75,
                            fontSize: '0.875rem',
                            '&:hover': {
                              borderColor: '#1967d2',
                              bgcolor: '#f8f9fa'
                            }
                          }}
                        >
                          Upload
                          <input
                            type="file"
                            hidden
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              const newAttachments = files.map(file => ({
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                file: file,
                              }));
                              setSelectedAttachments([...selectedAttachments, ...newAttachments]);
                            }}
                          />
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<LinkIcon />}
                          onClick={() => {
                            const url = prompt('Enter URL:');
                            if (url) {
                              setSelectedAttachments([...selectedAttachments, {
                                name: url,
                                type: 'link',
                                url: url,
                              }]);
                            }
                          }}
                          sx={{ 
                            textTransform: 'none', 
                            borderColor: '#dadce0', 
                            color: '#202124',
                            borderRadius: '24px',
                            px: 2,
                            py: 0.75,
                            fontSize: '0.875rem',
                            '&:hover': {
                              borderColor: '#1967d2',
                              bgcolor: '#f8f9fa'
                            }
                          }}
                        >
                          Link
                        </Button>
                      </Stack>
                      
                      {/* Show selected attachments */}
                      {selectedAttachments.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          {selectedAttachments.map((att: any, idx: number) => (
                            <Chip
                              key={idx}
                              label={att.name || 'Attachment'}
                              onDelete={() => {
                                setSelectedAttachments(selectedAttachments.filter((_, i) => i !== idx));
                              }}
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Grid>

                {/* Sidebar */}
                <Grid item xs={12} md={4} sx={{ bgcolor: '#f8f9fa', p: 3, overflow: 'auto' }}>
                  <Stack spacing={3}>
                    {/* For */}
                    <FormControl fullWidth error={!!errors.class_obj}>
                      <InputLabel shrink sx={{ fontSize: '0.875rem', color: '#5f6368' }}>
                        For
                      </InputLabel>
                      <Select
                        value={postForm.class_obj}
                        onChange={(e) => {
                          setPostForm({ ...postForm, class_obj: e.target.value, topic: '' }); // Reset topic when class changes
                          if (errors.class_obj) setErrors({ ...errors, class_obj: undefined });
                        }}
                        required
                        sx={{ 
                          bgcolor: 'white',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: errors.class_obj ? '#d32f2f' : '#dadce0'
                          }
                        }}
                      >
                        <MenuItem value="">Select a class</MenuItem>
                        {classes.map((cls: any) => (
                          <MenuItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.class_obj && (
                        <Typography variant="caption" sx={{ color: '#d32f2f', mt: 0.5, ml: 1.75 }}>
                          {errors.class_obj}
                        </Typography>
                      )}
                    </FormControl>

                    {/* Assign to (for student selection) */}
                    {postForm.class_obj && (
                      <FormControl fullWidth>
                        <InputLabel shrink sx={{ fontSize: '0.875rem', color: '#5f6368' }}>
                          Assign to
                        </InputLabel>
                        <Select
                          value={postForm.assign_to}
                          onChange={(e) => setPostForm({ ...postForm, assign_to: e.target.value })}
                          sx={{ 
                            bgcolor: 'white',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#dadce0'
                            }
                          }}
                        >
                          <MenuItem value="all">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PeopleIcon sx={{ fontSize: 18, color: '#5f6368' }} />
                              <Typography>All students</Typography>
                            </Box>
                          </MenuItem>
                          {/* Could add individual student selection here if needed */}
                        </Select>
                      </FormControl>
                    )}

                    {/* Points (for assignments/quizzes) */}
                    {(postType === 'assignment' || postType === 'quiz') && (
                      <FormControl fullWidth>
                        <InputLabel shrink sx={{ fontSize: '0.875rem', color: '#5f6368' }}>
                          Points
                        </InputLabel>
                        <Select
                          value={postForm.points}
                          onChange={(e) => setPostForm({ ...postForm, points: Number(e.target.value) })}
                          sx={{ 
                            bgcolor: 'white',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#dadce0'
                            }
                          }}
                        >
                          <MenuItem value={0}>No points</MenuItem>
                          <MenuItem value={50}>50</MenuItem>
                          <MenuItem value={100}>100</MenuItem>
                          <MenuItem value={200}>200</MenuItem>
                          <MenuItem value={500}>500</MenuItem>
                        </Select>
                      </FormControl>
                    )}

                    {/* Due Date */}
                    {(postType === 'assignment' || postType === 'quiz' || postType === 'question') && (
                      <FormControl fullWidth>
                        <InputLabel shrink sx={{ fontSize: '0.875rem', color: '#5f6368' }}>
                          Due
                        </InputLabel>
                        <TextField
                          type="datetime-local"
                          value={postForm.due_date ? formatDateForInput(postForm.due_date) : ''}
                          onChange={(e) => setPostForm({ ...postForm, due_date: e.target.value })}
                          placeholder="No due date"
                          InputLabelProps={{ 
                            shrink: true,
                            sx: { fontSize: '0.875rem', color: '#5f6368' }
                          }}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton size="small" edge="end">
                                  <CalendarTodayIcon sx={{ fontSize: 18, color: '#5f6368' }} />
                                </IconButton>
                              </InputAdornment>
                            ),
                            sx: {
                              bgcolor: 'white',
                              fontSize: '0.875rem'
                            }
                          }}
                          sx={{ bgcolor: 'white' }}
                        />
                      </FormControl>
                    )}

                    {/* Topic */}
                    {postForm.class_obj && (
                      <FormControl fullWidth>
                        <InputLabel shrink sx={{ fontSize: '0.875rem', color: '#5f6368' }}>
                          Topic
                        </InputLabel>
                        <Select
                          value={postForm.topic}
                          onChange={(e) => setPostForm({ ...postForm, topic: e.target.value })}
                          displayEmpty
                          sx={{ 
                            bgcolor: 'white',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#dadce0'
                            }
                          }}
                        >
                          <MenuItem value="">
                            <em style={{ color: '#9aa0a6' }}>No topic</em>
                          </MenuItem>
                          {formTopics.map((topic: any) => (
                            <MenuItem key={topic.id} value={topic.id}>
                              {topic.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}

                    {/* Rubric (for assignments) */}
                    {postType === 'assignment' && (
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon sx={{ fontSize: 18 }} />}
                        sx={{ 
                          textTransform: 'none', 
                          borderColor: '#dadce0',
                          justifyContent: 'flex-start',
                          bgcolor: 'white',
                          py: 1.5,
                          fontSize: '0.875rem',
                          color: '#202124',
                          '&:hover': {
                            borderColor: '#1967d2',
                            bgcolor: '#f8f9fa'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'space-between' }}>
                          <Typography sx={{ fontSize: '0.875rem' }}>Rubric</Typography>
                          <InfoIcon sx={{ fontSize: 16, color: '#5f6368' }} />
                        </Box>
                      </Button>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </DialogContent>
          </Box>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default Classwork;
