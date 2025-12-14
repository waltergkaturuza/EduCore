/**
 * Parent Communication Hub
 * Full messaging interface for teacher-parent communication
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  TextField,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  Divider,
  IconButton,
  Paper,
  InputAdornment,
  Chip,
  Stack,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Send as SendIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teachersService } from '../../services/teachers';
import Layout from '../../components/Layout';

const ParentCommunication: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'read'>('all');
  const [newMessageMenuAnchor, setNewMessageMenuAnchor] = useState<null | HTMLElement>(null);
  const [groupMessageDialogOpen, setGroupMessageDialogOpen] = useState(false);
  const [scheduleMessageDialogOpen, setScheduleMessageDialogOpen] = useState(false);
  const [selectedParents, setSelectedParents] = useState<number[]>([]);
  const [scheduledTime, setScheduledTime] = useState('');
  const [groupMessageText, setGroupMessageText] = useState('');
  const [scheduledMessageText, setScheduledMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => teachersService.getConversations(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: () => teachersService.getConversation(selectedConversation!),
    enabled: !!selectedConversation,
    refetchInterval: 5000, // Refetch every 5 seconds when conversation is open
  });

  // Fetch parents list for new message
  const { data: parentsData, refetch: refetchParents } = useQuery({
    queryKey: ['parents'],
    queryFn: () => teachersService.getParentsForTeacher(),
    enabled: false, // Only fetch when needed
  });

  const parents = (parentsData as any)?.results || [];

  const sendMessageMutation = useMutation({
    mutationFn: (data: { recipient: number; body: string; subject?: string }) =>
      teachersService.sendMessage(data),
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (messageId: number) => teachersService.markMessageRead(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      const unreadMessages = messages.filter(
        (msg: any) => !msg.is_read && msg.recipient === parseInt(localStorage.getItem('userId') || '0')
      );
      unreadMessages.forEach((msg: any) => {
        markReadMutation.mutate(msg.id);
      });
    }
  }, [selectedConversation, messages, markReadMutation]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      recipient: selectedConversation,
      body: messageText.trim(),
    });
  };

  const handleStartNewConversation = (parentId: number) => {
    setSelectedConversation(parentId);
    setNewMessageMenuAnchor(null);
    queryClient.invalidateQueries({ queryKey: ['messages', parentId] });
  };

  const handleSendGroupMessage = () => {
    if (!groupMessageText.trim() || selectedParents.length === 0) return;

    const promises = selectedParents.map(parentId =>
      teachersService.sendMessage({
        recipient: parentId,
        body: groupMessageText.trim(),
        subject: 'Group Message',
      })
    );

    Promise.all(promises).then(() => {
      setGroupMessageText('');
      setSelectedParents([]);
      setGroupMessageDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });
  };

  const handleScheduleMessage = () => {
    if (!scheduledMessageText.trim() || !selectedConversation || !scheduledTime) return;

    // Note: This is a placeholder - actual implementation would need backend support for scheduled messages
    // For now, we'll send immediately but could extend to schedule
    sendMessageMutation.mutate({
      recipient: selectedConversation,
      body: scheduledMessageText.trim(),
    });

    setScheduledMessageText('');
    setScheduledTime('');
    setScheduleMessageDialogOpen(false);
  };

  const filteredConversations = conversations.filter((conv: any) => {
    const matchesSearch =
      conv.partner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.partner_email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'unread' && conv.unread_count > 0) ||
      (filterType === 'read' && conv.unread_count === 0);
    
    return matchesSearch && matchesFilter;
  });

  const selectedConversationData = conversations.find(
    (conv: any) => conv.partner_id === selectedConversation
  );

  const getCurrentUserId = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id;
      } catch {
        return null;
      }
    }
    return null;
  };

  const currentUserId = getCurrentUserId();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Layout>
      <Box sx={{ p: 3, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #1976D2 30%, #42A5F5 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Parent Communication Hub
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<GroupIcon />}
              onClick={() => {
                refetchParents();
                setGroupMessageDialogOpen(true);
              }}
              sx={{
                borderRadius: '24px',
                px: 2,
                textTransform: 'none',
                borderColor: '#1976D2',
                color: '#1976D2',
                '&:hover': { borderColor: '#1565C0', bgcolor: '#e3f2fd' },
              }}
            >
              Group Message
            </Button>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={(e) => {
                setNewMessageMenuAnchor(e.currentTarget);
                refetchParents();
              }}
              sx={{
                bgcolor: '#1976D2',
                borderRadius: '24px',
                px: 3,
                textTransform: 'none',
                '&:hover': { bgcolor: '#1565C0' },
              }}
            >
              New Message
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 200px)' }}>
          {/* Conversations List */}
          <Card sx={{ width: 350, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl fullWidth size="small">
                <InputLabel>Filter</InputLabel>
                <Select
                  value={filterType}
                  label="Filter"
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'unread' | 'read')}
                >
                  <MenuItem value="all">All Conversations</MenuItem>
                  <MenuItem value="unread">Unread Only</MenuItem>
                  <MenuItem value="read">Read Only</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {conversationsLoading ? (
                <LinearProgress />
              ) : filteredConversations.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <PersonIcon sx={{ fontSize: 48, color: '#bdbdbd', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                  </Typography>
                </Box>
              ) : (
                <List>
                  {filteredConversations.map((conv: any, index: number) => (
                    <React.Fragment key={conv.partner_id}>
                      <ListItem
                        button
                        selected={selectedConversation === conv.partner_id}
                        onClick={() => setSelectedConversation(conv.partner_id)}
                        sx={{
                          bgcolor: selectedConversation === conv.partner_id ? '#e3f2fd' : 'transparent',
                          '&:hover': { bgcolor: '#f5f5f5' },
                        }}
                      >
                        <ListItemAvatar>
                          <Badge
                            badgeContent={conv.unread_count || 0}
                            color="error"
                            invisible={!conv.unread_count || conv.unread_count === 0}
                          >
                            <Avatar sx={{ bgcolor: '#1976D2' }}>
                              {conv.partner_name?.charAt(0)?.toUpperCase() || 'P'}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: conv.unread_count > 0 ? 600 : 400 }}>
                                {conv.partner_name || conv.partner_email}
                              </Typography>
                              {conv.last_message && (
                                <Typography variant="caption" color="text.secondary">
                                  {formatTime(conv.last_message.created_at)}
                                </Typography>
                              )}
                            </Box>
                          }
                          secondary={
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontWeight: conv.unread_count > 0 ? 500 : 400,
                              }}
                            >
                              {conv.last_message?.body || 'No messages yet'}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < filteredConversations.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          </Card>

          {/* Messages Area */}
          <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {!selectedConversation ? (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <SendIcon sx={{ fontSize: 64, color: '#bdbdbd', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    Select a conversation to start messaging
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Or start a new conversation with a parent
                  </Typography>
                </Box>
              </Box>
            ) : (
              <>
                {/* Conversation Header */}
                <Box
                  sx={{
                    p: 2,
                    borderBottom: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Avatar sx={{ bgcolor: '#1976D2' }}>
                    {selectedConversationData?.partner_name?.charAt(0)?.toUpperCase() || 'P'}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {selectedConversationData?.partner_name || 'Unknown'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedConversationData?.partner_email}
                    </Typography>
                  </Box>
                  {selectedConversationData?.partner_role === 'parent' && (
                    <Chip label="Parent" size="small" color="primary" />
                  )}
                </Box>

                {/* Messages List */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#fafafa' }}>
                  {messagesLoading ? (
                    <LinearProgress />
                  ) : messages.length === 0 ? (
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No messages yet. Start the conversation!
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={2}>
                      {messages.map((message: any) => {
                        const isSent = message.sender === currentUserId;
                        return (
                          <Box
                            key={message.id}
                            sx={{
                              display: 'flex',
                              justifyContent: isSent ? 'flex-end' : 'flex-start',
                            }}
                          >
                            <Paper
                              elevation={0}
                              sx={{
                                p: 2,
                                maxWidth: '70%',
                                bgcolor: isSent ? '#1976D2' : 'white',
                                color: isSent ? 'white' : 'text.primary',
                                borderRadius: 2,
                              }}
                            >
                              <Typography variant="body1" sx={{ mb: 0.5 }}>
                                {message.body}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                  {formatTime(message.created_at)}
                                </Typography>
                                {isSent && (
                                  <CheckCircleIcon
                                    sx={{
                                      fontSize: 14,
                                      opacity: message.is_read ? 1 : 0.5,
                                      color: message.is_read ? '#4caf50' : 'inherit',
                                    }}
                                  />
                                )}
                              </Box>
                            </Paper>
                          </Box>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </Stack>
                  )}
                </Box>

                {/* Message Input */}
                <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', bgcolor: 'white' }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setScheduledMessageText(messageText);
                        setScheduleMessageDialogOpen(true);
                      }}
                      sx={{ color: '#1976D2' }}
                      title="Schedule message"
                    >
                      <ScheduleIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={sendMessageMutation.isPending}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            color="primary"
                            onClick={handleSendMessage}
                            disabled={!messageText.trim() || sendMessageMutation.isPending}
                          >
                            <SendIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </>
            )}
          </Card>
        </Box>

        {/* New Message Menu */}
        <Menu
          anchorEl={newMessageMenuAnchor}
          open={Boolean(newMessageMenuAnchor)}
          onClose={() => setNewMessageMenuAnchor(null)}
          PaperProps={{
            sx: { maxHeight: 400, width: 300 },
          }}
        >
          <Box sx={{ p: 1, borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, px: 1 }}>
              Select a parent to message
            </Typography>
          </Box>
          {parents.length === 0 ? (
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                No parents found
              </Typography>
            </MenuItem>
          ) : (
            parents.slice(0, 10).map((parent: any) => {
              const userId = parent.user || parent.user_id || parent.id;
              const userName = parent.user_name || parent.user?.full_name || parent.user?.first_name || 'Parent';
              const userEmail = parent.user_email || parent.user?.email || '';
              return (
                <MenuItem
                  key={parent.id}
                  onClick={() => handleStartNewConversation(userId)}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976D2' }}>
                      {userName.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={userName}
                    secondary={userEmail}
                  />
                </MenuItem>
              );
            })
          )}
        </Menu>

        {/* Group Message Dialog */}
        <Dialog
          open={groupMessageDialogOpen}
          onClose={() => {
            setGroupMessageDialogOpen(false);
            setGroupMessageText('');
            setSelectedParents([]);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GroupIcon sx={{ color: '#1976D2' }} />
              <Typography variant="h6">Send Group Message</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Message"
                placeholder="Type your message to send to multiple parents..."
                value={groupMessageText}
                onChange={(e) => setGroupMessageText(e.target.value)}
              />
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Select Parents ({selectedParents.length} selected)
                </Typography>
                <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
                  {parents.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                      No parents available
                    </Typography>
                  ) : (
                    parents.map((parent: any) => {
                      const userId = parent.user || parent.user_id || parent.id;
                      const userName = parent.user_name || parent.user?.full_name || parent.user?.first_name || 'Parent';
                      const userEmail = parent.user_email || parent.user?.email || '';
                      return (
                        <FormControlLabel
                          key={parent.id}
                          control={
                            <Checkbox
                              checked={selectedParents.includes(userId)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedParents([...selectedParents, userId]);
                                } else {
                                  setSelectedParents(selectedParents.filter(id => id !== userId));
                                }
                              }}
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2">{userName}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {userEmail}
                              </Typography>
                            </Box>
                          }
                        />
                      );
                    })
                  )}
                </Box>
                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    onClick={() => {
                      const allIds = parents.map((p: any) => p.user || p.user_id || p.id);
                      setSelectedParents(allIds);
                    }}
                  >
                    Select All
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setSelectedParents([])}
                  >
                    Clear All
                  </Button>
                </Box>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setGroupMessageDialogOpen(false);
              setGroupMessageText('');
              setSelectedParents([]);
            }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSendGroupMessage}
              disabled={!groupMessageText.trim() || selectedParents.length === 0}
              startIcon={<GroupIcon />}
            >
              Send to {selectedParents.length} {selectedParents.length === 1 ? 'Parent' : 'Parents'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Schedule Message Dialog */}
        <Dialog
          open={scheduleMessageDialogOpen}
          onClose={() => {
            setScheduleMessageDialogOpen(false);
            setScheduledMessageText('');
            setScheduledTime('');
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScheduleIcon sx={{ color: '#1976D2' }} />
              <Typography variant="h6">Schedule Message</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Message"
                placeholder="Type your message..."
                value={scheduledMessageText}
                onChange={(e) => setScheduledMessageText(e.target.value)}
              />
              <TextField
                fullWidth
                label="Schedule Date & Time"
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Select when you want this message to be sent"
              />
              {selectedConversationData && (
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">To:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {selectedConversationData.partner_name}
                  </Typography>
                </Box>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setScheduleMessageDialogOpen(false);
              setScheduledMessageText('');
              setScheduledTime('');
            }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleScheduleMessage}
              disabled={!scheduledMessageText.trim() || !scheduledTime}
              startIcon={<ScheduleIcon />}
            >
              Schedule Message
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default ParentCommunication;
