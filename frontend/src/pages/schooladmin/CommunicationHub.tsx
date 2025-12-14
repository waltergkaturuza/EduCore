/**
 * Communication Hub
 * Unified communications platform for SMS, Email, WhatsApp, and announcements
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
  Switch,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Send as SendIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  WhatsApp as WhatsAppIcon,
  Notifications as NotificationsIcon,
  History as HistoryIcon,
  Description as TemplateIcon,
  Event as EventIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schooladminService, CommunicationCampaign } from '../../services/schooladmin';
import apiService from '../../services/api';
import Layout from '../../components/Layout';

const CommunicationHub: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [createCampaignDialogOpen, setCreateCampaignDialogOpen] = useState(false);
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CommunicationCampaign | null>(null);
  const queryClient = useQueryClient();

  const { data: campaignsData, isLoading } = useQuery({
    queryKey: ['communicationCampaigns'],
    queryFn: () => schooladminService.getCommunicationCampaigns(),
  });

  const { data: templatesData } = useQuery({
    queryKey: ['messageTemplates'],
    queryFn: () => apiService.get('/schooladmin/message-templates/').then(res => res.data),
  });

  const { data: logsData } = useQuery({
    queryKey: ['communicationLogs'],
    queryFn: () => apiService.get('/schooladmin/communication-logs/').then(res => res.data),
  });

  const { data: eventsData } = useQuery({
    queryKey: ['eventInvitations'],
    queryFn: () => apiService.get('/schooladmin/event-invitations/').then(res => res.data),
  });

  const campaigns = (campaignsData as any)?.results || [];
  const templates = (templatesData as any)?.results || [];
  const logs = (logsData as any)?.results || [];
  const events = (eventsData as any)?.results || [];

  const handleViewCampaign = (campaign: CommunicationCampaign) => {
    setSelectedCampaign(campaign);
  };

  const sendCampaignMutation = useMutation({
    mutationFn: (id: number) => schooladminService.sendCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communicationCampaigns'] });
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
              Communication Hub
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Unified communications platform for SMS, Email, WhatsApp, and announcements
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<EventIcon />}
              onClick={() => setCreateEventDialogOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              New Event
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateCampaignDialogOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              New Campaign
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
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Campaigns</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                      {campaigns.length}
                    </Typography>
                  </Box>
                  <NotificationsIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Messages Sent</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'primary.main' }}>
                  {campaigns.reduce((sum: number, c: CommunicationCampaign) => sum + (c.sent_count || 0), 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Templates</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'primary.main' }}>
                  {templates.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Upcoming Events</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'primary.main' }}>
                  {events.filter((e: any) => new Date(e.event_date) > new Date()).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Campaigns" icon={<NotificationsIcon />} iconPosition="start" />
            <Tab label="Templates" icon={<TemplateIcon />} iconPosition="start" />
            <Tab label="History" icon={<HistoryIcon />} iconPosition="start" />
            <Tab label="Events" icon={<EventIcon />} iconPosition="start" />
          </Tabs>

          {/* Campaigns Tab */}
          <Box sx={{ p: 3 }}>
            {tabValue === 0 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Campaign Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Target</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Sent/Delivered</TableCell>
                      <TableCell>Scheduled</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {campaigns.map((campaign: CommunicationCampaign) => (
                      <TableRow key={campaign.id} hover>
                        <TableCell>{campaign.name}</TableCell>
                        <TableCell>
                          <Chip
                            icon={
                              campaign.campaign_type === 'sms' ? <SmsIcon /> :
                              campaign.campaign_type === 'email' ? <EmailIcon /> :
                              campaign.campaign_type === 'whatsapp' ? <WhatsAppIcon /> :
                              <NotificationsIcon />
                            }
                            label={campaign.campaign_type.toUpperCase()}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{campaign.target_audience.replace('_', ' ')}</TableCell>
                        <TableCell>
                          <Chip
                            label={campaign.status}
                            size="small"
                            color={
                              campaign.status === 'completed' ? 'success' :
                              campaign.status === 'sending' ? 'warning' :
                              campaign.status === 'failed' ? 'error' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {campaign.sent_count}/{campaign.delivered_count} ({campaign.total_recipients} total)
                        </TableCell>
                        <TableCell>
                          {campaign.scheduled_at ? new Date(campaign.scheduled_at).toLocaleString() : 'Immediate'}
                        </TableCell>
                        <TableCell>
                          {campaign.status === 'draft' && (
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => sendCampaignMutation.mutate(campaign.id)}
                              title="Send Campaign"
                            >
                              <SendIcon />
                            </IconButton>
                          )}
                          <IconButton 
                            size="small"
                            onClick={() => handleViewCampaign(campaign)}
                            title="View Campaign Details"
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Templates Tab */}
            {tabValue === 1 && (
              <Grid container spacing={3}>
                {templates.map((template: any) => (
                  <Grid item xs={12} md={6} lg={4} key={template.id}>
                    <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {template.name}
                          </Typography>
                          <Chip label={template.template_type.toUpperCase()} size="small" />
                        </Box>
                        {template.subject && (
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                            {template.subject}
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {template.body.substring(0, 100)}...
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" startIcon={<EditIcon />}>Edit</Button>
                          <Button size="small" startIcon={<SendIcon />}>Use</Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            {/* History Tab */}
            {tabValue === 2 && (
              <Box>
                {logs.length === 0 ? (
                  <Alert severity="info">No communication logs found.</Alert>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Recipient</TableCell>
                          <TableCell>Channel</TableCell>
                          <TableCell>Message</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Sent At</TableCell>
                          <TableCell>Delivered At</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {logs.map((log: any) => (
                          <TableRow key={log.id} hover>
                            <TableCell>{log.recipient_name}</TableCell>
                            <TableCell>
                              <Chip label={log.channel.toUpperCase()} size="small" />
                            </TableCell>
                            <TableCell>{log.message.substring(0, 50)}...</TableCell>
                            <TableCell>
                              <Chip
                                label={log.status}
                                size="small"
                                color={
                                  log.status === 'delivered' ? 'success' :
                                  log.status === 'failed' ? 'error' : 'default'
                                }
                              />
                            </TableCell>
                            <TableCell>{log.sent_at ? new Date(log.sent_at).toLocaleString() : '-'}</TableCell>
                            <TableCell>{log.delivered_at ? new Date(log.delivered_at).toLocaleString() : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}

            {/* Events Tab */}
            {tabValue === 3 && (
              <Grid container spacing={3}>
                {events.map((event: any) => (
                  <Grid item xs={12} md={6} key={event.id}>
                    <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {event.event_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(event.event_date).toLocaleString()}
                            </Typography>
                          </Box>
                          <Chip label={event.event_type.replace('_', ' ')} size="small" />
                        </Box>
                        {event.description && (
                          <Typography variant="body2" sx={{ mb: 2 }}>
                            {event.description}
                          </Typography>
                        )}
                        {event.rsvp_required && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary">RSVP: </Typography>
                            <Chip label={`${event.rsvp_yes} Yes`} size="small" color="success" sx={{ mr: 0.5 }} />
                            <Chip label={`${event.rsvp_no} No`} size="small" color="error" sx={{ mr: 0.5 }} />
                            <Chip label={`${event.rsvp_pending} Pending`} size="small" />
                          </Box>
                        )}
                        <Button size="small" startIcon={<VisibilityIcon />}>View Details</Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Paper>

        {/* Create Campaign Dialog */}
        <Dialog open={createCampaignDialogOpen} onClose={() => setCreateCampaignDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create Communication Campaign</DialogTitle>
          <DialogContent>
            <TextField fullWidth label="Campaign Name" sx={{ mt: 2, mb: 2 }} />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Campaign Type</InputLabel>
              <Select label="Campaign Type" defaultValue="sms">
                <MenuItem value="sms">SMS Campaign</MenuItem>
                <MenuItem value="email">Email Campaign</MenuItem>
                <MenuItem value="whatsapp">WhatsApp Broadcast</MenuItem>
                <MenuItem value="announcement">Announcement</MenuItem>
                <MenuItem value="emergency">Emergency Alert</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Target Audience</InputLabel>
              <Select label="Target Audience" defaultValue="all_students">
                <MenuItem value="all_students">All Students</MenuItem>
                <MenuItem value="all_parents">All Parents</MenuItem>
                <MenuItem value="all_teachers">All Teachers</MenuItem>
                <MenuItem value="all_staff">All Staff</MenuItem>
                <MenuItem value="specific_class">Specific Class</MenuItem>
                <MenuItem value="specific_students">Specific Students</MenuItem>
                <MenuItem value="custom">Custom List</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth label="Message Content" multiline rows={6} sx={{ mb: 2 }} />
            <TextField fullWidth label="Schedule (Optional)" type="datetime-local" sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
            <FormControlLabel
              control={<Switch defaultChecked={false} />}
              label="Send immediately (if not scheduled)"
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateCampaignDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" startIcon={<SendIcon />}>Create & Send</Button>
          </DialogActions>
        </Dialog>

        {/* Campaign Details Dialog */}
        {selectedCampaign && (
          <Dialog open={!!selectedCampaign} onClose={() => setSelectedCampaign(null)} maxWidth="md" fullWidth>
            <DialogTitle>Campaign Details - {selectedCampaign.name}</DialogTitle>
            <DialogContent>
              <Alert severity={selectedCampaign.status === 'completed' ? 'success' : selectedCampaign.status === 'failed' ? 'error' : 'info'} sx={{ mb: 2 }}>
                Status: {selectedCampaign.status.toUpperCase()}
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Campaign Type" value={selectedCampaign.campaign_type} disabled />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Target Audience" value={selectedCampaign.target_audience.replace('_', ' ')} disabled />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Message Content" multiline rows={4} value={selectedCampaign.message_content} disabled />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Total Recipients</Typography>
                  <Typography variant="h6">{selectedCampaign.total_recipients}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Sent / Delivered</Typography>
                  <Typography variant="h6">{selectedCampaign.sent_count} / {selectedCampaign.delivered_count}</Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedCampaign(null)}>Close</Button>
            </DialogActions>
          </Dialog>
        )}

        {/* Create Event Dialog */}
        <Dialog open={createEventDialogOpen} onClose={() => setCreateEventDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create Event Invitation</DialogTitle>
          <DialogContent>
            <TextField fullWidth label="Event Name" sx={{ mt: 2, mb: 2 }} />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Event Type</InputLabel>
              <Select label="Event Type">
                <MenuItem value="meeting">Meeting</MenuItem>
                <MenuItem value="parent_teacher">Parent-Teacher Conference</MenuItem>
                <MenuItem value="workshop">Workshop</MenuItem>
                <MenuItem value="sports_day">Sports Day</MenuItem>
                <MenuItem value="graduation">Graduation</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth label="Description" multiline rows={3} sx={{ mb: 2 }} />
            <TextField fullWidth label="Event Date & Time" type="datetime-local" sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
            <TextField fullWidth label="Location" sx={{ mb: 2 }} />
            <FormControlLabel control={<Checkbox defaultChecked />} label="RSVP Required" sx={{ mb: 2 }} />
            <TextField fullWidth label="RSVP Deadline" type="datetime-local" sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateEventDialogOpen(false)}>Cancel</Button>
            <Button variant="contained">Create Event</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default CommunicationHub;

