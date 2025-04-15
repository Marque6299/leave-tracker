import React, { useState, useEffect } from 'react';
import { Navbar, Container, Nav, NavDropdown, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut } from '../services/supabase';
import { getUnreadNotificationCount } from '../services/notificationService';

const MainNavigation = () => {
  const { user, profile, hasRole, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  
  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (user) {
        try {
          const { count, error } = await getUnreadNotificationCount(user.id);
          if (!error) {
            setUnreadCount(count || 0);
          }
        } catch (err) {
          console.error('Error fetching unread count:', err);
        }
      }
    };
    
    fetchUnreadCount();
    
    // Set up a timer to fetch notifications periodically
    const timer = setInterval(fetchUnreadCount, 60000); // every minute
    
    return () => clearInterval(timer);
  }, [user]);
  
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  const getUserName = () => {
    if (profile) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return 'User';
  };
  
  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <i className="bi bi-calendar-check me-2"></i>
          PLS Leave Tracker
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="main-navbar" />
        
        <Navbar.Collapse id="main-navbar">
          {isAuthenticated() ? (
            <>
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
                
                <Nav.Link as={Link} to="/leave-requests">My Leaves</Nav.Link>
                
                {/* Supervisor Menu Items */}
                {hasRole('supervisor') && (
                  <NavDropdown title="Supervisor" id="supervisor-dropdown">
                    <NavDropdown.Item as={Link} to="/approvals">
                      Pending Approvals
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/team-calendar">
                      Team Calendar
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/team-management">
                      Team Management
                    </NavDropdown.Item>
                  </NavDropdown>
                )}
                
                {/* Admin Menu Items */}
                {hasRole('admin') && (
                  <NavDropdown title="Administration" id="admin-dropdown">
                    <NavDropdown.Item as={Link} to="/admin/users">
                      User Management
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/departments">
                      Departments
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/leave-types">
                      Leave Types
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/reports">
                      Reports
                    </NavDropdown.Item>
                  </NavDropdown>
                )}
              </Nav>
              
              <Nav>
                {/* Notifications */}
                <Nav.Link as={Link} to="/notifications" className="position-relative">
                  <i className="bi bi-bell"></i>
                  {unreadCount > 0 && (
                    <Badge 
                      bg="danger" 
                      pill 
                      className="position-absolute top-0 start-100 translate-middle"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Nav.Link>
                
                {/* User Profile Dropdown */}
                <NavDropdown 
                  title={
                    <span>
                      <i className="bi bi-person-circle me-1"></i>
                      {getUserName()}
                    </span>
                  } 
                  id="user-dropdown" 
                  align="end"
                >
                  <NavDropdown.Item as={Link} to="/profile">
                    My Profile
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/settings">
                    Settings
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </Nav>
            </>
          ) : (
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/login">Login</Nav.Link>
              <Nav.Link as={Link} to="/register">Register</Nav.Link>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default MainNavigation; 