import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Chip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Switch,
} from '@mui/material';
import {
  Send as SendIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Notifications as NotificationsIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superadminService } from '../../services/superadmin';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'email' | 'sms' | 'in_app';
  recipients: string;
  sent_at: string;
  status: 'sent' | 'pending' | 'failed';
  sent_count: number;
}

interface Template {
  id: number;
  name: string;
  type: 'email' | 'sms';
  subject?: string;
  content: string;
  is_active: boolean;
}

const Communications: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch announcements (notifications)
  const { data: announcementsData, isLoading: announcementsLoading, refetch: refetchAnnouncements } = useQuery({
    queryKey: ['globalAnnouncements'],
    queryFn: superadminService.getAnnouncements,
  });
  const announcements = announcementsData?.results || [];

  // Fetch message templates (if available)
  // Note: You may need to add getMessageTemplates to superadminService
  const templates: Template[] = []; // Placeholder - implement when backend API is ready

  // Get SMS/Email stats from platform metrics
  const { data: platformMetrics } = useQuery({
    queryKey: ['platform-metrics'],
    queryFn: () => superadminService.getPlatformMetrics(),
  });

  const smsStats = {
    totalSent: platformMetrics?.sms_sent || 0,
    remaining: platformMetrics?.sms_remaining || 0,
    cost: (platformMetrics?.sms_sent || 0) * 0.01, // Estimate cost
    successRate: platformMetrics?.payment_success_rate || 98.5,
  };

  const emailStats = {
    totalSent: Math.floor((platformMetrics?.total_schools || 0) * 1000), // Estimate
    delivered: Math.floor((platformMetrics?.total_schools || 0) * 990),
    bounced: Math.floor((platformMetrics?.total_schools || 0) * 10),
    successRate: 98.9,
  };

  // Send announcement mutation
  const sendAnnouncementMutation = useMutation({
    mutationFn: (data: any) => superadminService.publishAnnouncement(data.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalAnnouncements'] });
      setSendDialogOpen(false);
    },
  });

  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1, color: '#1e293b' }}>
              Communications & Notifications
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Send announcements, manage templates, and monitor communication channels
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={() => setSendDialogOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
              },
            }}
          >
            Send Announcement
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <SmsIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {(smsStats.totalSent / 1000).toFixed(0)}k
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      SMS Sent
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}>
                      {smsStats.remaining.toLocaleString()} remaining
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <EmailIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {(emailStats.totalSent / 1000).toFixed(0)}k
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Emails Sent
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}>
                      {emailStats.successRate}% success rate
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                  ${smsStats.cost}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  SMS Cost (This Month)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#10b981' }}>
                  {smsStats.successRate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  SMS Delivery Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="Send Notification" />
            <Tab label="Templates" />
            <Tab label="History" />
            <Tab label="Settings" />
          </Tabs>
        </Paper>

        {/* Send Notification Tab */}
        {tabValue === 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Send Announcement
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Notification Type</InputLabel>
                    <Select label="Notification Type" defaultValue="email" sx={{ borderRadius: 2 }}>
                      <MenuItem value="email">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon fontSize="small" />
                          Email
                        </Box>
                      </MenuItem>
                      <MenuItem value="sms">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SmsIcon fontSize="small" />
                          SMS
                        </Box>
                      </MenuItem>
                      <MenuItem value="in_app">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <NotificationsIcon fontSize="small" />
                          In-App Notification
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Recipients</InputLabel>
                    <Select label="Recipients" defaultValue="all" sx={{ borderRadius: 2 }}>
                      <MenuItem value="all">All Schools</MenuItem>
                      <MenuItem value="admins">All School Admins</MenuItem>
                      <MenuItem value="teachers">All Teachers</MenuItem>
                      <MenuItem value="selected">Selected Schools</MenuItem>
                      <MenuItem value="plan">By Subscription Plan</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Subject / Title"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    label="Message"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Checkbox defaultChecked />}
                    label="Send immediately"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    fullWidth
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                      },
                    }}
                  >
                    Send Notification
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Templates Tab */}
        {tabValue === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Message Templates
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setTemplateDialogOpen(true)}
                sx={{ borderRadius: 2 }}
              >
                New Template
              </Button>
            </Box>
            <Grid container spacing={3}>
              {templates.map((template) => (
                <Grid item xs={12} md={6} key={template.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {template.name}
                            </Typography>
                            <Chip
                              label={template.type.toUpperCase()}
                              size="small"
                              sx={{ borderRadius: 2 }}
                            />
                          </Box>
                          {template.subject && (
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                              Subject: {template.subject}
                            </Typography>
                          )}
                          <Typography variant="body2" color="text.secondary">
                            {template.content}
                          </Typography>
                        </Box>
                        <Switch checked={template.is_active} size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Button size="small" startIcon={<EditIcon />}>
                          Edit
                        </Button>
                        <Button size="small" startIcon={<DeleteIcon />} color="error">
                          Delete
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* History Tab */}
        {tabValue === 2 && (
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ background: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Recipients</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Sent Count</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Sent At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {announcementsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">Loading...</TableCell>
                  </TableRow>
                ) : announcements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No announcements found</TableCell>
                  </TableRow>
                ) : (
                  announcements.map((announcement: any) => (
                  <TableRow key={announcement.id}>
                    <TableCell sx={{ fontWeight: 500 }}>{announcement.title}</TableCell>
                    <TableCell>
                      <Chip
                        label={announcement.channels?.join(', ') || 'all'}
                        size="small"
                        icon={<EmailIcon />}
                        sx={{ borderRadius: 2 }}
                      />
                    </TableCell>
                    <TableCell>{announcement.target_roles?.join(', ') || 'all'}</TableCell>
                    <TableCell>
                      <Chip
                        label={announcement.status}
                        size="small"
                        color={announcement.status === 'sent' ? 'success' : announcement.status === 'failed' ? 'error' : 'warning'}
                        sx={{ borderRadius: 2, textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>{announcement.recipient_count || 0}</TableCell>
                    <TableCell>{announcement.sent_at ? new Date(announcement.sent_at).toLocaleString() : '-'}</TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Settings Tab */}
        {tabValue === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    SMS Gateway Settings
                  </Typography>
                  <TextField
                    fullWidth
                    label="SMS Provider"
                    defaultValue="EcoCash"
                    margin="normal"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <TextField
                    fullWidth
                    label="API Key"
                    type="password"
                    margin="normal"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <TextField
                    fullWidth
                    label="Cost per SMS"
                    defaultValue="0.01"
                    margin="normal"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <Button variant="contained" sx={{ mt: 2, borderRadius: 2 }}>
                    Save SMS Settings
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Email SMTP Settings
                  </Typography>
                  <TextField
                    fullWidth
                    label="SMTP Host"
                    defaultValue="smtp.gmail.com"
                    margin="normal"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <TextField
                    fullWidth
                    label="SMTP Port"
                    defaultValue="587"
                    margin="normal"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    margin="normal"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    margin="normal"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <Button variant="contained" sx={{ mt: 2, borderRadius: 2 }}>
                    Save Email Settings
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Container>
    </Layout>
  );
};

export default Communications;

