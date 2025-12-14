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
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../../components/Layout';
import { superadminService, SupportTicket } from '../../services/superadmin';
import AdvancedFilter, { FilterField } from '../../components/AdvancedFilter';
import apiService from '../../services/api';
import { downloadBlob } from '../../utils/exportHelpers';

type Ticket = Omit<SupportTicket, 'assigned_to_name' | 'assigned_to'> & {
  school_name: string;
  created_at: string;
  updated_at: string;
  last_reply: string;
  assigned_to?: string;
};

const SupportTickets: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch tickets from backend
  const { data: ticketsData, isLoading: ticketsLoading, refetch: refetchTickets } = useQuery({
    queryKey: ['supportTickets', filterStatus, filters, searchTerm],
    queryFn: async () => {
      const params: any = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filters.priority) params.priority = filters.priority;
      if (filters.category) params.category = filters.category;
      if (searchTerm) params.search = searchTerm;
      
      return superadminService.getSupportTickets(params);
    },
  });

  const tickets: Ticket[] = (ticketsData?.results || []).map((ticket: SupportTicket): Ticket => ({
    ...ticket,
    school_name: ticket.tenant_name || 'Unknown School',
    created_at: ticket.first_response_at || new Date().toISOString(),
    updated_at: ticket.last_reply_at || new Date().toISOString(),
    last_reply: ticket.last_reply_at ? `${Math.floor((Date.now() - new Date(ticket.last_reply_at).getTime()) / 3600000)} hours ago` : 'No replies',
    assigned_to: ticket.assigned_to_name,
  }));

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ ticketId, message, isInternal = false }: { ticketId: number; message: string; isInternal?: boolean }) => {
      return superadminService.replyToTicket(ticketId, message, isInternal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
      refetchTickets();
      setTicketDialogOpen(false);
    },
  });

  // Update ticket status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: number; status: string }) => {
      return apiService.patch(`/superadmin/support-tickets/${ticketId}/`, { status }).then(res => res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
      refetchTickets();
      if (selectedTicket) {
        setSelectedTicket({ ...selectedTicket, status: updateStatusMutation.variables?.status as any });
      }
    },
  });

  // Export tickets function
  const handleExportTickets = () => {
    const csvRows = [
      ['Ticket #', 'School', 'Subject', 'Priority', 'Status', 'Category', 'Assigned To', 'Created At', 'Last Update'].join(','),
      ...tickets.map((t) =>
        [
          t.ticket_number,
          t.school_name,
          `"${t.subject}"`,
          t.priority,
          t.status,
          t.category,
          t.assigned_to || 'Unassigned',
          t.created_at,
          t.updated_at,
        ].join(',')
      ),
    ];
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    downloadBlob(blob, `support-tickets-${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Filter fields for AdvancedFilter
  const filterFields: FilterField[] = [
    {
      name: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' },
      ],
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: 'Technical', label: 'Technical' },
        { value: 'Billing', label: 'Billing' },
        { value: 'Feature Request', label: 'Feature Request' },
        { value: 'Other', label: 'Other' },
      ],
    },
    {
      name: 'school',
      label: 'School Name',
      type: 'text',
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

  const filteredTickets = tickets;

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
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportTickets}
              sx={{ borderRadius: 2 }}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/superadmin/support-tickets/new')}
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

        {/* Advanced Filter */}
        <Paper sx={{ mb: 3, p: 2, borderRadius: 2 }}>
          <AdvancedFilter
            fields={filterFields}
            onFilterChange={(newFilters) => {
              setFilters(newFilters);
            }}
            onSearchChange={(search) => {
              setSearchTerm(search);
            }}
            searchPlaceholder="Search tickets by subject, school..."
          />
        </Paper>

        {/* Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, v) => {
              setTabValue(v);
              const statusMap = ['all', 'open', 'in_progress', 'resolved'];
              setFilterStatus(statusMap[v] || 'all');
            }}
          >
            <Tab 
              label={
                <Badge badgeContent={stats.total} color="primary" sx={{ '& .MuiBadge-badge': { right: -8, top: 4 } }}>
                  All Tickets
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={stats.open} color="error" sx={{ '& .MuiBadge-badge': { right: -8, top: 4 } }}>
                  Open
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={stats.inProgress} color="warning" sx={{ '& .MuiBadge-badge': { right: -8, top: 4 } }}>
                  In Progress
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={stats.resolved} color="success" sx={{ '& .MuiBadge-badge': { right: -8, top: 4 } }}>
                  Resolved
                </Badge>
              } 
            />
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
              {ticketsLoading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">Loading tickets...</TableCell>
                </TableRow>
              ) : filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">No tickets found</TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((ticket) => (
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
                          <PersonIcon sx={{ fontSize: 16 }} />
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
                ))
              )}
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
                      {(selectedTicket.school_name || selectedTicket.tenant_name || 'U')[0]}
                    </Avatar>
                    <Box sx={{ flex: 1, background: '#f8fafc', p: 2, borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                        {selectedTicket.school_name || selectedTicket.tenant_name || 'Unknown School'}
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
                    id="reply-message"
                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button startIcon={<AttachFileIcon />} sx={{ borderRadius: 2 }}>
                      Attach File
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SendIcon />}
                      onClick={() => {
                        const messageInput = document.getElementById('reply-message') as HTMLInputElement;
                        if (messageInput && selectedTicket && messageInput.value.trim()) {
                          replyMutation.mutate({
                            ticketId: selectedTicket.id,
                            message: messageInput.value,
                          });
                          messageInput.value = '';
                        }
                      }}
                      disabled={replyMutation.isPending}
                      sx={{
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                        },
                      }}
                    >
                      {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <FormControl size="small" sx={{ minWidth: 150, mr: 'auto' }}>
              <InputLabel>Change Status</InputLabel>
              <Select 
                value={selectedTicket?.status || ''} 
                label="Change Status"
                onChange={(e) => {
                  if (selectedTicket) {
                    updateStatusMutation.mutate({
                      ticketId: selectedTicket.id,
                      status: e.target.value,
                    });
                  }
                }}
              >
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

