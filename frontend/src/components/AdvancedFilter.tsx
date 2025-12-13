import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Grid,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

export interface FilterField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number';
  options?: { value: string; label: string }[];
}

interface AdvancedFilterProps {
  fields: FilterField[];
  onFilterChange: (filters: Record<string, any>) => void;
  onSearchChange?: (search: string) => void;
  searchPlaceholder?: string;
}

const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
  fields,
  onFilterChange,
  onSearchChange,
  searchPlaceholder = 'Search...',
}) => {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(false);

  const handleFilterChange = (name: string, value: any) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearch('');
    onFilterChange({});
    if (onSearchChange) {
      onSearchChange('');
    }
  };

  const activeFiltersCount = Object.keys(filters).filter(key => filters[key] !== '' && filters[key] != null).length;

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: expanded ? 2 : 0 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          InputProps={{
            startAdornment: <FilterIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
        <Button
          variant="outlined"
          startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          onClick={() => setExpanded(!expanded)}
        >
          Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </Button>
        {activeFiltersCount > 0 && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<ClearIcon />}
            onClick={clearFilters}
          >
            Clear
          </Button>
        )}
      </Box>

      <Collapse in={expanded}>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {fields.map((field) => (
            <Grid item xs={12} sm={6} md={4} key={field.name}>
              {field.type === 'select' ? (
                <FormControl fullWidth size="small">
                  <InputLabel>{field.label}</InputLabel>
                  <Select
                    value={filters[field.name] || ''}
                    label={field.label}
                    onChange={(e) => handleFilterChange(field.name, e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    {field.options?.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : field.type === 'date' ? (
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={field.label}
                  value={filters[field.name] || ''}
                  onChange={(e) => handleFilterChange(field.name, e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              ) : (
                <TextField
                  fullWidth
                  size="small"
                  type={field.type}
                  label={field.label}
                  value={filters[field.name] || ''}
                  onChange={(e) => handleFilterChange(field.name, e.target.value)}
                />
              )}
            </Grid>
          ))}
        </Grid>

        {activeFiltersCount > 0 && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.entries(filters).map(([key, value]) => {
              if (!value || value === '') return null;
              const field = fields.find(f => f.name === key);
              const label = field?.options?.find(o => o.value === value)?.label || value;
              return (
                <Chip
                  key={key}
                  label={`${field?.label || key}: ${label}`}
                  onDelete={() => handleFilterChange(key, '')}
                  size="small"
                />
              );
            })}
          </Box>
        )}
      </Collapse>
    </Paper>
  );
};

export default AdvancedFilter;



