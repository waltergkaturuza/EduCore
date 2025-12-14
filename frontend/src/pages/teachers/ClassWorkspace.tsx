/**
 * Class Workspace - Google Classroom-like Interface
 * Complete class management with Stream, Classwork, People, and Grades
 */
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
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
  ClickAwayListener,
  Popper,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Stack,
  ButtonGroup,
  Tooltip,
} from '@mui/material';
import {
  Stream as StreamIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  Grade as GradeIcon,
  Add as AddIcon,
  Announcement as AnnouncementIcon,
  Quiz as QuizIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Folder as FolderIcon,
  Schedule as ScheduleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  AttachFile as AttachFileIcon,
  Topic as TopicIcon,
  Code as CodeIcon,
  Close as CloseIcon,
  CloudQueue as DriveIcon,
  YouTube as YouTubeIcon,
  Link as LinkIcon,
  Upload as UploadIcon,
  Create as CreateIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Check as CheckIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  FormatBold as FormatBoldIcon,
  FormatItalic as FormatItalicIcon,
  FormatUnderlined as FormatUnderlinedIcon,
  FormatListBulleted as FormatListBulletedIcon,
  FormatListNumbered as FormatListNumberedIcon,
  Clear as ClearIcon,
  Info as InfoIcon,
  Autorenew as AutorenewIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../../services/api';
import { teachersService } from '../../services/teachers';
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

const ClassWorkspace: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [createMenuAnchor, setCreateMenuAnchor] = useState<null | HTMLElement>(null);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [postType, setPostType] = useState<'announcement' | 'assignment' | 'quiz' | 'question' | 'material' | 'reuse_post' | 'topic'>('assignment');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const queryClient = useQueryClient();

  // Form state
  const [postForm, setPostForm] = useState({
    title: '',
    description: '',
    points: 100,
    due_date: '',
    topic: '',
    assign_to: 'all',
    attachments: [] as any[],
    is_draft: false,
    scheduled_time: '',
  });
  const [attachmentMenuAnchor, setAttachmentMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [viewPostId, setViewPostId] = useState<number | null>(null);

  // Fetch class details
  const { data: classData, isLoading: classLoading } = useQuery({
    queryKey: ['class', classId],
    queryFn: () => apiService.get(`/academics/classes/${classId}/`).then(res => res.data),
    enabled: !!classId,
  });

  // Fetch class posts (Stream)
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['classPosts', classId],
    queryFn: () => teachersService.getClassPostsStream(Number(classId)),
    enabled: !!classId && !!classData,
  });

  // Fetch classwork (filtered by post_type)
  const { data: classworkData, isLoading: classworkLoading } = useQuery({
    queryKey: ['classwork', classId, selectedTopic],
    queryFn: () => teachersService.getClassPosts({
      class_obj: Number(classId),
      post_type: 'assignment,quiz,question,material',
      topic: selectedTopic !== 'all' ? selectedTopic : undefined,
    }),
    enabled: !!classId && tabValue === 1,
  });

  // Fetch topics
  const { data: topicsData } = useQuery({
    queryKey: ['classTopics', classId],
    queryFn: () => teachersService.getClassTopics({ class_obj: Number(classId) }),
    enabled: !!classId,
  });

  // Fetch students
  const { data: studentsData } = useQuery({
    queryKey: ['classStudents', classId],
    queryFn: () => apiService.get(`/students/students/?current_class=${classId}`).then(res => res.data),
    enabled: !!classId,
  });

  // Fetch class code
  const { data: classCodeData } = useQuery({
    queryKey: ['classCode', classId],
    queryFn: () => teachersService.getClassCodes({ class_obj: Number(classId) }),
    enabled: !!classId,
  });

  const posts = (postsData as any)?.results || [];
  const classwork = (classworkData as any)?.results || [];
  const topics = (topicsData as any)?.results || [];
  const students = (studentsData as any)?.results || [];
  const classCode = (classCodeData as any)?.results?.[0];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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
    // Reset form
    setPostForm({
      title: '',
      description: '',
      points: 100,
      due_date: '',
      topic: '',
      assign_to: 'all',
      attachments: [],
      is_draft: false,
      scheduled_time: '',
    });
  };

  const createPostMutation = useMutation({
    mutationFn: (data: any) => teachersService.createClassPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classPosts', classId] });
      queryClient.invalidateQueries({ queryKey: ['classwork', classId] });
      setPostDialogOpen(false);
      setPostForm({
        title: '',
        description: '',
        points: 100,
        due_date: '',
        topic: '',
        assign_to: 'all',
        attachments: [],
        is_draft: false,
        scheduled_time: '',
      });
    },
  });

  const handleSubmitPost = () => {
    const formData = {
      class_obj: Number(classId),
      post_type: postType,
      title: postForm.title,
      description: postForm.description,
      topic: postForm.topic || null,
      due_date: postType === 'assignment' || postType === 'quiz' ? postForm.due_date : null,
      attachments: postForm.attachments,
      is_draft: postForm.is_draft,
      scheduled_time: postForm.scheduled_time || null,
      ...(postType === 'assignment' && { linked_assignment: null }), // Will be created separately
    };
    createPostMutation.mutate(formData);
  };

  if (classLoading) {
    return (
      <Layout>
        <Box sx={{ p: 3 }}>
          <LinearProgress />
        </Box>
      </Layout>
    );
  }

  const classObj = classData as any;

  return (
    <Layout>
      <Box sx={{ p: 3, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Button onClick={() => navigate('/teacher/classes')} sx={{ mb: 2, textTransform: 'none' }}>
            ← Back to Classes
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 400, mb: 0.5, color: '#202124' }}>
                {classObj?.name || 'Class'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#5f6368' }}>
                {classObj?.subject?.name || 'Subject'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {classCode && (
                <Chip
                  icon={<CodeIcon />}
                  label={classCode.code}
                  sx={{ 
                    bgcolor: '#f1f3f4', 
                    color: '#202124',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    height: 36,
                    '& .MuiChip-icon': { color: '#5f6368' }
                  }}
                />
              )}
              <Button 
                variant="outlined" 
                startIcon={<EditIcon />}
                sx={{ textTransform: 'none', borderColor: '#dadce0' }}
              >
                Class Settings
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Tabs */}
        <Paper elevation={0} sx={{ borderBottom: '1px solid #dadce0', mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                minHeight: 48,
                color: '#5f6368',
                '&.Mui-selected': {
                  color: '#1967d2',
                  fontWeight: 500,
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#1967d2',
                height: 3,
              },
            }}
          >
            <Tab icon={<StreamIcon />} iconPosition="start" label="Stream" />
            <Tab icon={<AssignmentIcon />} iconPosition="start" label="Classwork" />
            <Tab icon={<PeopleIcon />} iconPosition="start" label="People" />
            <Tab icon={<GradeIcon />} iconPosition="start" label="Grades" />
          </Tabs>
        </Paper>

        {/* Stream Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              {/* Create Post Card */}
              <Card elevation={0} sx={{ mb: 2, border: '1px solid #dadce0', borderRadius: '8px' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#1967d2', width: 40, height: 40 }}>
                      {(classObj?.teacher?.first_name?.[0] || 'T')}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <TextField
                        fullWidth
                        placeholder="Share something with your class..."
                        onClick={() => handleCreatePost('announcement')}
                        InputProps={{
                          readOnly: true,
                          sx: { cursor: 'pointer', bgcolor: '#f8f9fa', borderRadius: '24px' }
                        }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Posts Feed */}
              {postsLoading ? (
                <LinearProgress />
              ) : posts.length === 0 ? (
                <Card elevation={0} sx={{ border: '1px solid #dadce0' }}>
                  <CardContent>
                    <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                      No posts yet. Share something with your class!
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post: any) => (
                  <Card key={post.id} elevation={0} sx={{ mb: 2, border: '1px solid #dadce0', borderRadius: '8px' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Avatar sx={{ width: 40, height: 40 }}>
                            {post.teacher?.first_name?.[0] || 'T'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                              {post.teacher?.full_name || 'Teacher'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#5f6368' }}>
                              {new Date(post.published_at || post.created_at).toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton size="small">
                          <MoreVertIcon />
                        </IconButton>
                      </Box>

                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 400 }}>
                        {post.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#202124', mb: 2 }}>
                        {post.description}
                      </Typography>

                      {post.topic && (
                        <Chip
                          size="small"
                          icon={<TopicIcon />}
                          label={post.topic_name || post.topic.name}
                          sx={{ mb: 2, bgcolor: '#e8f0fe', color: '#1967d2' }}
                        />
                      )}

                      {post.due_date && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                          <ScheduleIcon sx={{ fontSize: 16, color: '#5f6368' }} />
                          <Typography variant="caption" color="text.secondary">
                            Due: {new Date(post.due_date).toLocaleString()}
                          </Typography>
                        </Box>
                      )}

                      {post.attachments && post.attachments.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          {post.attachments.map((att: any, idx: number) => (
                            <Chip
                              key={idx}
                              icon={<AttachFileIcon />}
                              label={att.name || 'Attachment'}
                              size="small"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))}
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View post details">
                          <IconButton
                            size="small"
                            onClick={() => {
                              // Could open a detailed view dialog
                              setViewPostId(post.id);
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete post">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this post?')) {
                                teachersService.deleteClassPost(post.id).then(() => {
                                  queryClient.invalidateQueries({ queryKey: ['classPosts', classId] });
                                });
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#5f6368' }}>
                          {post.comment_count || 0} comments
                        </Typography>
                        <Button size="small" sx={{ textTransform: 'none', color: '#1967d2' }}>
                          Add class comment
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))
              )}
            </Grid>

            {/* Sidebar */}
            <Grid item xs={12} md={4}>
              <Card elevation={0} sx={{ mb: 2, border: '1px solid #dadce0', borderRadius: '8px', position: 'sticky', top: 20 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 400 }}>
                    Class Code
                  </Typography>
                  <Box sx={{ 
                    textAlign: 'center', 
                    p: 3, 
                    bgcolor: '#f8f9fa', 
                    borderRadius: '8px', 
                    mb: 2,
                    border: '1px solid #dadce0'
                  }}>
                    <Typography variant="h4" sx={{ fontWeight: 400, letterSpacing: 2, fontFamily: 'monospace' }}>
                      {classCode?.code || 'ABC123'}
                    </Typography>
                  </Box>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    size="small"
                    sx={{ textTransform: 'none', borderColor: '#dadce0' }}
                    onClick={() => {
                      navigator.clipboard.writeText(classCode?.code || '');
                    }}
                  >
                    Copy Code
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Classwork Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
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
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
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
                  <MenuItem onClick={() => handleCreatePost('reuse_post')}>
                    <AutorenewIcon sx={{ mr: 2, color: '#5f6368' }} />
                    Reuse post
                  </MenuItem>
                  <MenuItem onClick={() => handleCreatePost('topic')}>
                    <TopicIcon sx={{ mr: 2, color: '#5f6368' }} />
                    Topic
                  </MenuItem>
                </MenuList>
              </Menu>

              <FormControl size="small" sx={{ minWidth: 200 }}>
                <Select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  displayEmpty
                  sx={{ textTransform: 'none', bgcolor: 'white' }}
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
          </Box>

          {classworkLoading ? (
            <LinearProgress />
          ) : classwork.length === 0 ? (
            <Card elevation={0} sx={{ border: '1px solid #dadce0', borderRadius: '8px' }}>
              <CardContent>
                <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                  No classwork yet. Create an assignment, quiz, or material!
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <List sx={{ bgcolor: 'white', borderRadius: '8px', border: '1px solid #dadce0' }}>
              {classwork.map((item: any, idx: number) => (
                <React.Fragment key={item.id}>
                  <ListItem sx={{ py: 2 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#1967d2', width: 40, height: 40 }}>
                        {item.post_type === 'assignment' ? <AssignmentIcon /> :
                         item.post_type === 'quiz' ? <QuizIcon /> :
                         item.post_type === 'question' ? <QuestionAnswerIcon /> :
                         <FolderIcon />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" sx={{ fontWeight: 400 }}>
                          {item.title}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          {item.due_date && (
                            <Typography variant="body2" sx={{ color: '#5f6368', display: 'inline' }}>
                              Due {new Date(item.due_date).toLocaleDateString()}
                            </Typography>
                          )}
                          {item.posted_at && (
                            <Typography variant="body2" sx={{ color: '#5f6368', display: 'inline', ml: item.due_date ? 2 : 0 }}>
                              Posted {new Date(item.posted_at).toLocaleDateString()}
                            </Typography>
                          )}
                          {item.topic && (
                            <Chip
                              size="small"
                              label={item.topic.name}
                              sx={{ ml: 1, bgcolor: '#e8f0fe', color: '#1967d2', height: 20, fontSize: '0.75rem' }}
                            />
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton size="small" edge="end">
                        <MoreVertIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {idx < classwork.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </TabPanel>

        {/* People Tab */}
        <TabPanel value={tabValue} index={2}>
          <Card elevation={0} sx={{ border: '1px solid #dadce0', borderRadius: '8px' }}>
            <CardContent>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 400 }}>
                  Teachers
                </Typography>
                <Button 
                  size="small" 
                  startIcon={<AddIcon />}
                  sx={{ textTransform: 'none', color: '#1967d2' }}
                >
                  Add Teacher
                </Button>
              </Box>
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      {(classObj?.teacher?.first_name?.[0] || 'T')}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={classObj?.teacher?.full_name || 'Teacher'}
                    secondary="Teacher"
                  />
                  <Chip label="Owner" size="small" sx={{ bgcolor: '#e8f0fe', color: '#1967d2' }} />
                </ListItem>
              </List>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 400 }}>
                  Students ({students.length})
                </Typography>
                <Button 
                  size="small" 
                  startIcon={<AddIcon />}
                  sx={{ textTransform: 'none', color: '#1967d2' }}
                >
                  Invite Students
                </Button>
              </Box>
              {students.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                  No students yet. Invite students using the class code!
                </Typography>
              ) : (
                <List>
                {students.map((student: any, idx: number) => (
                  <React.Fragment key={student.id}>
                    <ListItem
                      secondaryAction={
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            edge="end"
                            onClick={() => navigate(`/teacher/students/${student.id}`)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" edge="end">
                            <MoreVertIcon />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar>
                          {student.user?.first_name?.[0] || 'S'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={student.user?.full_name || 'Student'}
                        secondary={student.user?.email || student.student_id}
                      />
                    </ListItem>
                    {idx < students.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
                </List>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        {/* Grades Tab */}
        <TabPanel value={tabValue} index={3}>
          <Card elevation={0} sx={{ border: '1px solid #dadce0', borderRadius: '8px' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 400 }}>
                Gradebook
              </Typography>
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                Gradebook view coming soon. Use the Gradebook page for detailed grading.
              </Typography>
            </CardContent>
          </Card>
        </TabPanel>

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
              borderBottom: '1px solid #dadce0'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton size="small" onClick={() => setPostDialogOpen(false)}>
                  <CloseIcon />
                </IconButton>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {postType === 'assignment' && <AssignmentIcon sx={{ color: '#5f6368' }} />}
                  {postType === 'quiz' && <QuizIcon sx={{ color: '#5f6368' }} />}
                  {postType === 'question' && <QuestionAnswerIcon sx={{ color: '#5f6368' }} />}
                  {postType === 'material' && <FolderIcon sx={{ color: '#5f6368' }} />}
                  {postType === 'announcement' && <AnnouncementIcon sx={{ color: '#5f6368' }} />}
                  <Typography variant="h6" sx={{ textTransform: 'capitalize', fontWeight: 400 }}>
                    {postType}
                  </Typography>
                </Box>
              </Box>
              <ButtonGroup variant="outlined">
                <Button
                  onClick={handleSubmitPost}
                  disabled={!postForm.title || createPostMutation.isPending}
                  sx={{
                    textTransform: 'none',
                    bgcolor: postForm.title ? '#1967d2' : '#f1f3f4',
                    color: postForm.title ? 'white' : '#5f6368',
                    borderColor: '#dadce0',
                    '&:hover': {
                      bgcolor: postForm.title ? '#1557b0' : '#f1f3f4',
                    },
                    '&.Mui-disabled': {
                      bgcolor: '#f1f3f4',
                      color: '#5f6368',
                    }
                  }}
                >
                  {postType === 'assignment' || postType === 'quiz' ? 'Assign' : 'Post'}
                </Button>
                <Button
                  size="small"
                  sx={{ minWidth: 'auto', px: 1 }}
                >
                  <ArrowDropDownIcon />
                </Button>
              </ButtonGroup>
            </Box>

            {/* Content */}
            <DialogContent sx={{ p: 0, display: 'flex', flex: 1, overflow: 'hidden' }}>
              <Grid container sx={{ height: '100%' }}>
                {/* Main Content */}
                <Grid item xs={12} md={8} sx={{ borderRight: '1px solid #dadce0', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
                    <TextField
                      fullWidth
                      label="Title"
                      required
                      value={postForm.title}
                      onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                      sx={{ mb: 2 }}
                      InputLabelProps={{ shrink: true }}
                      placeholder="Title*"
                    />
                    
                    <TextField
                      fullWidth
                      label="Instructions (optional)"
                      multiline
                      rows={6}
                      value={postForm.description}
                      onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                      sx={{ mb: 2 }}
                      InputLabelProps={{ shrink: true }}
                      placeholder="Instructions..."
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                            <Stack direction="row" spacing={0.5}>
                              <IconButton size="small"><FormatBoldIcon fontSize="small" /></IconButton>
                              <IconButton size="small"><FormatItalicIcon fontSize="small" /></IconButton>
                              <IconButton size="small"><FormatUnderlinedIcon fontSize="small" /></IconButton>
                              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                              <IconButton size="small"><FormatListBulletedIcon fontSize="small" /></IconButton>
                              <IconButton size="small"><FormatListNumberedIcon fontSize="small" /></IconButton>
                              <IconButton size="small"><ClearIcon fontSize="small" /></IconButton>
                            </Stack>
                          </InputAdornment>
                        )
                      }}
                    />

                    {/* Attachments */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1, color: '#5f6368', fontWeight: 500 }}>
                        Attach
                      </Typography>
                      <Stack direction="row" spacing={2} flexWrap="wrap">
                        <Button
                          variant="outlined"
                          startIcon={<DriveIcon />}
                          onClick={() => {
                            const url = prompt('Enter Google Drive link:');
                            if (url) {
                              setPostForm({
                                ...postForm,
                                attachments: [...postForm.attachments, { name: 'Drive File', type: 'drive', url }],
                              });
                            }
                          }}
                          sx={{ textTransform: 'none', borderColor: '#dadce0', color: '#202124' }}
                        >
                          Drive
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<YouTubeIcon />}
                          onClick={() => {
                            const url = prompt('Enter YouTube URL:');
                            if (url) {
                              setPostForm({
                                ...postForm,
                                attachments: [...postForm.attachments, { name: 'YouTube Video', type: 'youtube', url }],
                              });
                            }
                          }}
                          sx={{ textTransform: 'none', borderColor: '#dadce0', color: '#202124' }}
                        >
                          YouTube
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<CreateIcon />}
                          onClick={() => setAttachmentMenuAnchor(document.activeElement as HTMLElement)}
                          sx={{ textTransform: 'none', borderColor: '#dadce0', color: '#202124' }}
                        >
                          Create
                        </Button>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<UploadIcon />}
                          sx={{ textTransform: 'none', borderColor: '#dadce0', color: '#202124' }}
                        >
                          <AttachFileIcon sx={{ mr: 1 }} />
                          Upload
                          <input
                            type="file"
                            hidden
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              files.forEach(file => {
                                setPostForm({
                                  ...postForm,
                                  attachments: [...postForm.attachments, { name: file.name, type: 'file', file }],
                                });
                              });
                            }}
                          />
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<LinkIcon />}
                          onClick={() => {
                            const url = prompt('Enter link URL:');
                            if (url) {
                              setPostForm({
                                ...postForm,
                                attachments: [...postForm.attachments, { name: url, type: 'link', url }],
                              });
                            }
                          }}
                          sx={{ textTransform: 'none', borderColor: '#dadce0', color: '#202124' }}
                        >
                          Link
                        </Button>
                      </Stack>
                      {postForm.attachments.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          {postForm.attachments.map((att: any, idx: number) => (
                            <Chip
                              key={idx}
                              icon={<AttachFileIcon />}
                              label={att.name || 'Attachment'}
                              onDelete={() => {
                                setPostForm({
                                  ...postForm,
                                  attachments: postForm.attachments.filter((_, i) => i !== idx),
                                });
                              }}
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))}
                        </Box>
                      )}

                      {/* Attachment Menu Popper */}
                      <Popper
                        open={Boolean(attachmentMenuAnchor)}
                        anchorEl={attachmentMenuAnchor}
                        placement="bottom-start"
                        sx={{ zIndex: 1300 }}
                      >
                        <ClickAwayListener onClickAway={() => setAttachmentMenuAnchor(null)}>
                          <Paper sx={{ p: 1, mt: 1, boxShadow: 3 }}>
                            <MenuList>
                              <MenuItem onClick={() => { setAttachmentMenuAnchor(null); }}>
                                <CreateIcon sx={{ mr: 2 }} />
                                New Document
                              </MenuItem>
                              <MenuItem onClick={() => { setAttachmentMenuAnchor(null); }}>
                                <CreateIcon sx={{ mr: 2 }} />
                                New Spreadsheet
                              </MenuItem>
                              <MenuItem onClick={() => { setAttachmentMenuAnchor(null); }}>
                                <CreateIcon sx={{ mr: 2 }} />
                                New Presentation
                              </MenuItem>
                            </MenuList>
                          </Paper>
                        </ClickAwayListener>
                      </Popper>
                    </Box>
                  </Box>
                </Grid>

                {/* Sidebar */}
                <Grid item xs={12} md={4} sx={{ bgcolor: '#f8f9fa', p: 3, overflow: 'auto' }}>
                  <Stack spacing={3}>
                    {/* For */}
                    <FormControl fullWidth>
                      <InputLabel shrink>For</InputLabel>
                      <Select
                        value={classId}
                        disabled
                        sx={{ bgcolor: 'white' }}
                      >
                        <MenuItem value={classId}>
                          {classObj?.name}
                        </MenuItem>
                      </Select>
                    </FormControl>

                    {/* Assign to */}
                    <FormControl fullWidth>
                      <InputLabel shrink>Assign to</InputLabel>
                      <Select
                        value={postForm.assign_to}
                        onChange={(e) => setPostForm({ ...postForm, assign_to: e.target.value })}
                        sx={{ bgcolor: 'white' }}
                      >
                        <MenuItem value="all">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckIcon sx={{ fontSize: 18, color: postForm.assign_to === 'all' ? '#1976d2' : 'transparent' }} />
                            All students
                          </Box>
                        </MenuItem>
                        {students.map((student: any) => (
                          <MenuItem key={student.id} value={student.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {postForm.assign_to === student.id.toString() ? (
                                <CheckIcon sx={{ fontSize: 18, color: '#1976d2' }} />
                              ) : (
                                <RadioButtonUncheckedIcon sx={{ fontSize: 18, color: '#9aa0a6' }} />
                              )}
                              {student.user?.full_name || student.user_full_name}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Multi-Select Students */}
                    {postType === 'assignment' || postType === 'quiz' ? (
                      <Paper sx={{ p: 2, bgcolor: 'white' }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Select Specific Students ({selectedStudents.length} selected)
                        </Typography>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={selectedStudents.length === students.length && students.length > 0}
                              indeterminate={selectedStudents.length > 0 && selectedStudents.length < students.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStudents(students.map((s: any) => s.id));
                                } else {
                                  setSelectedStudents([]);
                                }
                              }}
                            />
                          }
                          label="Select All"
                        />
                        <Box sx={{ maxHeight: 150, overflow: 'auto', mt: 1 }}>
                          {students.map((student: any) => (
                            <FormControlLabel
                              key={student.id}
                              control={
                                <Checkbox
                                  checked={selectedStudents.includes(student.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedStudents([...selectedStudents, student.id]);
                                    } else {
                                      setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                                    }
                                  }}
                                />
                              }
                              label={student.user?.full_name || student.user_full_name}
                            />
                          ))}
                        </Box>
                      </Paper>
                    ) : null}

                    {/* Points (for assignments/quizzes) */}
                    {(postType === 'assignment' || postType === 'quiz') && (
                      <FormControl fullWidth>
                        <InputLabel shrink>Points</InputLabel>
                        <Select
                          value={postForm.points}
                          onChange={(e) => setPostForm({ ...postForm, points: Number(e.target.value) })}
                          sx={{ bgcolor: 'white' }}
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
                        <InputLabel shrink>Due</InputLabel>
                        <TextField
                          type="datetime-local"
                          value={postForm.due_date}
                          onChange={(e) => setPostForm({ ...postForm, due_date: e.target.value })}
                          InputLabelProps={{ shrink: true }}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton size="small" edge="end">
                                  <ScheduleIcon sx={{ fontSize: 18, color: '#5f6368' }} />
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={{ bgcolor: 'white' }}
                        />
                      </FormControl>
                    )}

                    {/* Schedule Time (for scheduled posts) */}
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!postForm.scheduled_time}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPostForm({ ...postForm, scheduled_time: new Date().toISOString().slice(0, 16) });
                            } else {
                              setPostForm({ ...postForm, scheduled_time: '' });
                            }
                          }}
                        />
                      }
                      label="Schedule for later"
                    />
                    {postForm.scheduled_time && (
                      <TextField
                        fullWidth
                        type="datetime-local"
                        label="Schedule Date & Time"
                        value={postForm.scheduled_time}
                        onChange={(e) => setPostForm({ ...postForm, scheduled_time: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                        sx={{ bgcolor: 'white' }}
                      />
                    )}

                    {/* Topic */}
                    <FormControl fullWidth>
                      <InputLabel shrink>Topic</InputLabel>
                      <Select
                        value={postForm.topic}
                        onChange={(e) => setPostForm({ ...postForm, topic: e.target.value })}
                        displayEmpty
                        sx={{ bgcolor: 'white' }}
                      >
                        <MenuItem value="">No topic</MenuItem>
                        {topics.map((topic: any) => (
                          <MenuItem key={topic.id} value={topic.id}>
                            {topic.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Rubric (for assignments) */}
                    {postType === 'assignment' && (
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        sx={{ 
                          textTransform: 'none', 
                          borderColor: '#dadce0',
                          justifyContent: 'flex-start',
                          bgcolor: 'white'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography>Rubric</Typography>
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

        {/* View Post Dialog */}
        {viewPostId && (
          <Dialog
            open={!!viewPostId}
            onClose={() => setViewPostId(null)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Post Details</Typography>
                <IconButton size="small" onClick={() => setViewPostId(null)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              {(() => {
                const post = [...posts, ...classwork].find((p: any) => p.id === viewPostId);
                if (!post) return <Typography>Post not found</Typography>;
                return (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>{post.title}</Typography>
                    <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>{post.description}</Typography>
                    {post.due_date && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                        <ScheduleIcon sx={{ fontSize: 16, color: '#5f6368' }} />
                        <Typography variant="body2" color="text.secondary">
                          Due: {new Date(post.due_date).toLocaleString()}
                        </Typography>
                      </Box>
                    )}
                    {post.attachments && post.attachments.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Attachments:</Typography>
                        {post.attachments.map((att: any, idx: number) => (
                          <Chip
                            key={idx}
                            icon={<AttachFileIcon />}
                            label={att.name || 'Attachment'}
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                );
              })()}
            </DialogContent>
          </Dialog>
        )}
      </Box>
    </Layout>
  );
};

export default ClassWorkspace;
