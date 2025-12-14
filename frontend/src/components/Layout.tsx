import React, { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  EventNote as AttendanceIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  Payment as PaymentIcon,
  Message as MessageIcon,
  Book as BookIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  Close as CloseIcon,
  CloudQueue as CloudQueueIcon,
  Description as DescriptionIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const DRAWER_WIDTH = 280;

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const getMenuItems = (): Array<{ text: string; icon: React.ReactNode; path: string; roles?: string[] }> => {
    const userRole = user?.role?.toLowerCase();
    
    if (userRole === 'superadmin') {
      return [
        { text: 'Platform Dashboard', icon: <DashboardIcon />, path: '/superadmin' },
        { text: 'School Management', icon: <BusinessIcon />, path: '/superadmin/tenants' },
        { text: 'Subscriptions & Billing', icon: <PaymentIcon />, path: '/superadmin/subscriptions' },
        { text: 'Revenue Analytics', icon: <TrendingUpIcon />, path: '/superadmin/revenue' },
        { text: 'System Monitoring', icon: <CloudQueueIcon />, path: '/superadmin/monitoring' },
        { text: 'Support Tickets', icon: <MessageIcon />, path: '/superadmin/support' },
        { text: 'Feature Flags', icon: <SettingsIcon />, path: '/superadmin/features' },
        { text: 'Communications', icon: <MessageIcon />, path: '/superadmin/communications' },
      ];
    }
    
    // School Admin menu
    if (userRole === 'admin') {
      return [
        { text: 'Command Dashboard', icon: <DashboardIcon />, path: '/schooladmin/dashboard' },
        { text: 'School Profile', icon: <SchoolIcon />, path: '/schooladmin/profile' },
        { text: 'Admissions', icon: <PeopleIcon />, path: '/schooladmin/admissions' },
        { text: 'Student Records', icon: <PeopleIcon />, path: '/schooladmin/students' },
        { text: 'Timetable', icon: <SchoolIcon />, path: '/schooladmin/timetable' },
        { text: 'Attendance', icon: <AttendanceIcon />, path: '/schooladmin/attendance' },
        { text: 'Exams & Results', icon: <AssignmentIcon />, path: '/schooladmin/exams' },
        { text: 'Finance & Fees', icon: <PaymentIcon />, path: '/schooladmin/finance' },
        { text: 'Staff & HCM', icon: <PeopleIcon />, path: '/schooladmin/staff' },
        { text: 'Communications', icon: <MessageIcon />, path: '/schooladmin/communications' },
        { text: 'Reports & Analytics', icon: <TrendingUpIcon />, path: '/schooladmin/reports' },
        { text: 'Ministry Exports', icon: <DescriptionIcon />, path: '/schooladmin/ministry' },
      ];
    }
    
    // Teacher menu
    if (userRole === 'teacher') {
      return [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/teacher/dashboard' },
        { text: 'My Classes', icon: <SchoolIcon />, path: '/teacher/classes' },
        { text: 'Classwork', icon: <AssignmentIcon />, path: '/teacher/classwork' },
        { text: 'Lesson Planner', icon: <BookIcon />, path: '/teacher/lesson-planner' },
        { text: 'Attendance', icon: <AttendanceIcon />, path: '/teacher/attendance' },
        { text: 'Gradebook', icon: <AssessmentIcon />, path: '/teacher/gradebook' },
        { text: 'Analytics', icon: <TrendingUpIcon />, path: '/teacher/analytics' },
        { text: 'Parents', icon: <MessageIcon />, path: '/teacher/parents' },
        { text: 'CPD', icon: <DescriptionIcon />, path: '/teacher/cpd' },
      ];
    }
    
    return [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
      { text: 'Students', icon: <PeopleIcon />, path: '/students', roles: ['admin', 'teacher'] },
      { text: 'Classes', icon: <SchoolIcon />, path: '/classes', roles: ['admin', 'teacher'] },
      { text: 'Attendance', icon: <AttendanceIcon />, path: '/attendance', roles: ['admin', 'teacher'] },
      { text: 'Assessments', icon: <AssignmentIcon />, path: '/assessments', roles: ['admin', 'teacher'] },
      { text: 'Fees', icon: <PaymentIcon />, path: '/fees', roles: ['admin', 'parent'] },
      { text: 'Messages', icon: <MessageIcon />, path: '/messages' },
      { text: 'e-Learning', icon: <BookIcon />, path: '/lms' },
      { text: 'Settings', icon: <SettingsIcon />, path: '/settings', roles: ['admin'] },
    ];
  };

  const menuItems = getMenuItems();

  // For role-specific menus (superadmin, admin, teacher), don't filter - they're already filtered by getMenuItems()
  // Only filter the default menu items that have roles property
  const filteredMenuItems = menuItems.filter((item) => {
    // If item has roles property, filter by role
    if (item.roles) {
      return item.roles.includes(user?.role || '');
    }
    // If no roles property, include it (role-specific menus already filtered)
    return true;
  });
  
  // Debug logging (commented out to reduce console noise)
  // Uncomment only when debugging navigation issues
  // if (process.env.NODE_ENV === 'development') {
  //   console.log('[Layout] User role:', user?.role);
  //   console.log('[Layout] Menu items count:', menuItems.length);
  //   console.log('[Layout] Filtered menu items count:', filteredMenuItems.length);
  // }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleProfileMenuClose();
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          position: 'relative',
        }}
      >
        <SchoolIcon sx={{ fontSize: 32 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            EduCore
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            School Management
          </Typography>
        </Box>
        <Button
          onClick={handleDrawerToggle}
          sx={{
            display: { xs: 'flex', md: 'none' },
            color: 'white',
            minWidth: 'auto',
            p: 0.5,
          }}
        >
          <CloseIcon />
        </Button>
      </Box>
      <Divider />
      <List sx={{ flex: 1, pt: 2 }}>
        {filteredMenuItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5, px: 1.5 }}>
              <ListItemButton
                selected={isSelected}
                onClick={() => handleMenuClick(item.path)}
                sx={{
                  borderRadius: 2,
                  py: 1.25,
                  '&.Mui-selected': {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isSelected ? 'white' : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isSelected ? 600 : 400,
                    fontSize: '0.9375rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {user?.first_name} {user?.last_name}
            </Typography>
            <Chip
              label={user?.role}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                textTransform: 'capitalize',
                mt: 0.5,
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          background: 'white',
          color: '#1e293b',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {filteredMenuItems.find(item => item.path === location.pathname)?.text || 'EduCore'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={handleProfileMenuOpen} size="small">
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </Avatar>
            </IconButton>
          </Box>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 200,
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              },
            }}
          >
            <MenuItem onClick={() => { navigate('/profile'); handleProfileMenuClose(); }}>
              Profile
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1, fontSize: 20 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: 'none',
              boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: { xs: 7, md: 8 },
          background: '#f8fafc',
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
