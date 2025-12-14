import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  Button,
  Divider,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import Layout from '../components/Layout';

const Messages: React.FC = () => {
  const [message, setMessage] = useState('');

  // Mock messages - replace with actual API call
  const messages = [
    { id: 1, sender: 'John Doe', message: 'Hello, how can I help?', time: '10:30 AM' },
    { id: 2, sender: 'You', message: 'I need information about my child\'s progress', time: '10:32 AM' },
  ];

  return (
    <Layout>
      <Container maxWidth="md">
        <Typography variant="h4" component="h1" gutterBottom>
          Messages
        </Typography>

        <Paper sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            <List>
              {messages.map((msg) => (
                <React.Fragment key={msg.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>{msg.sender[0]}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={msg.sender}
                      secondary={
                        <Box>
                          <Typography variant="body2">{msg.message}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {msg.time}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Box>

          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                size="small"
              />
              <Button variant="contained" endIcon={<SendIcon />}>
                Send
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Layout>
  );
};

export default Messages;




