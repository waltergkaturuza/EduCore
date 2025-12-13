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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  IconButton,
  Avatar,
  Divider,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Message as MessageIcon,
  AttachFile as AttachFileIcon,
  Send as SendIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../../components/Layout';
import { superadminService } from '../../services/superadmin';
import AdvancedFilter, { FilterField } from '../../components/AdvancedFilter';
import apiService from '../../services/api';
import { downloadBlob } from '../../utils/exportHelpers';

interface Ticket {
  id: number;
  ticket_number: string;
  school_name: string;
  subject: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  last_reply: string;
  replies_count: number;
}

const SupportTickets: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock data
  const tickets: Ticket[] = [
    {
      id: 1,
      ticket_number: 'TKT-2024-001',
      school_name: 'Greenwood High',
      subject: 'Payment gateway not working',
      priority: 'urgent',
      status: 'open',
      category: 'Billing',
      assigned_to: 'John Doe',
      created_at: '2024-06-15 10:30',
      updated_at: '2024-06-15 14:20',
      last_reply: '2 hours ago',
      replies_count: 3,
    },
    {
      id: 2,
      ticket_number: 'TKT-2024-002',
      school_name: 'Riverside Academy',
      subject: 'Unable to export student reports',
      priority: 'high',
      status: 'in_progress',
      category: 'Technical',
      assigned_to: 'Jane Smith',
      created_at: '2024-06-14 09:15',
      updated_at: '2024-06-15 16:45',
      last_reply: '1 hour ago',
      replies_count: 5,
    },
    {
      id: 3,
      ticket_number: 'TKT-2024-003',
      school_name: 'Sunset Primary',
      subject: 'Feature request: Bulk SMS',
      priority: 'low',
      status: 'resolved',
      category: 'Feature Request',
      assigned_to: 'Mike Johnson',
      created_at: '2024-06-10 11:00',
      updated_at: '2024-06-12 15:30',
      last_reply: '2 days ago',
      replies_count: 2,
    },
  ];

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
    urgent: tickets.filter(t => t.priority === 'urgent').length,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'error';
      case 'in_progress':
        return 'warning';
      case 'resolved':
        return 'success';
      case 'closed':
        return 'default';
      default:
        return 'default';
    }
  };

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setTicketDialogOpen(true);
  };

  const filteredTickets = filterStatus === 'all' 
    ? tickets 
    : tickets.filter(t => t.status === filterStatus);

  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1, color: '#1e293b' }}>
              Support Tickets
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and track support requests from all schools
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
              },
            }}
          >
            New Ticket
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <AssignmentIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Tickets
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                    <WarningIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats.open}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Open Tickets
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                    <ScheduleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats.inProgress}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      In Progress
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                    <CheckCircleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats.resolved}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Resolved
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="All Tickets" />
            <Tab label="Open" />
            <Tab label="In Progress" />
            <Tab label="Resolved" />
          </Tabs>
        </Paper>

        {/* Tickets Table */}
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ background: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600 }}>Ticket #</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>School</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Assigned To</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Last Update</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTickets.map((ticket) => (
                <TableRow
                  key={ticket.id}
                  sx={{
                    '&:hover': {
                      background: '#f8fafc',
                      cursor: 'pointer',
                    },
                    transition: 'background 0.2s',
                  }}
                  onClick={() => handleViewTicket(ticket)}
                >
                  <TableCell sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                    {ticket.ticket_number}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SchoolIcon sx={{ fontSize: 16, color: '#64748b' }} />
                      {ticket.school_name}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{ticket.subject}</TableCell>
                  <TableCell>
                    <Chip
                      label={ticket.priority}
                      size="small"
                      color={getPriorityColor(ticket.priority) as any}
                      sx={{ fontWeight: 500, borderRadius: 2, textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ticket.status.replace('_', ' ')}
                      size="small"
                      color={getStatusColor(ticket.status) as any}
                      sx={{ fontWeight: 500, borderRadius: 2, textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>{ticket.category}</TableCell>
                  <TableCell>
                    {ticket.assigned_to ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                          {ticket.assigned_to[0]}
                        </Avatar>
                        <Typography variant="body2">{ticket.assigned_to}</Typography>
                      </Box>
                    ) : (
                      <Chip label="Unassigned" size="small" sx={{ borderRadius: 2 }} />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{ticket.last_reply}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {ticket.replies_count} replies
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewTicket(ticket);
                      }}
                    >
                      <MessageIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Ticket Detail Dialog */}
        <Dialog
          open={ticketDialogOpen}
          onClose={() => setTicketDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 600, fontSize: '1.5rem', pb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6">{selectedTicket?.ticket_number}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedTicket?.subject}
                </Typography>
              </Box>
              <IconButton onClick={() => setTicketDialogOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedTicket && (
              <Box>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      School
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {selectedTicket.school_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Category
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {selectedTicket.category}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Priority
                    </Typography>
                    <Chip
                      label={selectedTicket.priority}
                      size="small"
                      color={getPriorityColor(selectedTicket.priority) as any}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Status
                    </Typography>
                    <Chip
                      label={selectedTicket.status.replace('_', ' ')}
                      size="small"
                      color={getStatusColor(selectedTicket.status) as any}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Conversation Thread */}
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Conversation
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Avatar sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                      {selectedTicket.school_name[0]}
                    </Avatar>
                    <Box sx={{ flex: 1, background: '#f8fafc', p: 2, borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                        {selectedTicket.school_name}
                      </Typography>
                      <Typography variant="body2">
                        Initial ticket description would appear here...
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {selectedTicket.created_at}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Reply Section */}
                <Box sx={{ mt: 3 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Type your reply..."
                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button startIcon={<AttachFileIcon />} sx={{ borderRadius: 2 }}>
                      Attach File
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SendIcon />}
                      sx={{
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                        },
                      }}
                    >
                      Send Reply
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <FormControl size="small" sx={{ minWidth: 150, mr: 'auto' }}>
              <InputLabel>Change Status</InputLabel>
              <Select value={selectedTicket?.status || ''} label="Change Status">
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </FormControl>
            <Button onClick={() => setTicketDialogOpen(false)} sx={{ borderRadius: 2 }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default SupportTickets;

