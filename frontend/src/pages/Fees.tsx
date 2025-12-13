import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Add as AddIcon, Payment as PaymentIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { feesService } from '../services/fees';
import Layout from '../components/Layout';

const Fees: React.FC = () => {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const { data: invoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await feesService.getInvoices();
      return response.data;
    },
  });

  const handlePayment = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPaymentDialogOpen(true);
  };

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Fees
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />}>
            New Invoice
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice Number</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Paid Amount</TableCell>
                <TableCell>Balance</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices?.results?.map((invoice: any) => (
                <TableRow key={invoice.id}>
                  <TableCell>{invoice.invoice_number}</TableCell>
                  <TableCell>{invoice.student_name}</TableCell>
                  <TableCell>${invoice.total_amount}</TableCell>
                  <TableCell>${invoice.paid_amount}</TableCell>
                  <TableCell>${invoice.balance}</TableCell>
                  <TableCell>
                    <Chip
                      label={invoice.status}
                      color={
                        invoice.status === 'paid' ? 'success' :
                        invoice.status === 'partial' ? 'warning' :
                        invoice.status === 'overdue' ? 'error' : 'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {invoice.balance > 0 && (
                      <IconButton
                        size="small"
                        onClick={() => handlePayment(invoice)}
                        color="primary"
                      >
                        <PaymentIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Invoice Number"
                margin="normal"
                value={selectedInvoice?.invoice_number || ''}
                disabled
              />
              <TextField
                fullWidth
                label="Amount"
                type="number"
                margin="normal"
                InputProps={{ inputProps: { min: 0, max: selectedInvoice?.balance } }}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Payment Method</InputLabel>
                <Select label="Payment Method" defaultValue="cash">
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="ecocash">EcoCash</MenuItem>
                  <MenuItem value="paynow">Paynow</MenuItem>
                  <MenuItem value="bank">Bank Transfer</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Transaction Reference"
                margin="normal"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button variant="contained">Record Payment</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default Fees;

