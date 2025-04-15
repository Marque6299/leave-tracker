import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchUserLeaveRequests, fetchLeaveBalance } from '../services/leaveService';
import { fetchUserNotifications } from '../services/notificationService';

const Dashboard = () => {
  const { user, profile, hasRole } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (user) {
          // Fetch user's leave requests
          const { data: requestsData, error: requestsError } = await fetchUserLeaveRequests(user.id);
          if (!requestsError) {
            setLeaveRequests(requestsData || []);
          }
          
          // Fetch user's leave balances
          const { data: balancesData, error: balancesError } = await fetchLeaveBalance(user.id);
          if (!balancesError) {
            setLeaveBalances(balancesData || []);
          }
          
          // Fetch user's recent notifications
          const { data: notificationsData, error: notificationsError } = await fetchUserNotifications(user.id);
          if (!notificationsError) {
            // Get only the 5 most recent notifications
            setNotifications((notificationsData || []).slice(0, 5));
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);
  
  const renderStatusBadge = (status) => {
    let variant = 'secondary';
    
    switch (status) {
      case 'approved':
        variant = 'success';
        break;
      case 'rejected':
        variant = 'danger';
        break;
      case 'pending':
        variant = 'warning';
        break;
      default:
        variant = 'secondary';
    }
    
    return (
      <Badge bg={variant}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Calculate statistics
  const pendingRequests = leaveRequests.filter(req => req.status === 'pending').length;
  const approvedRequests = leaveRequests.filter(req => req.status === 'approved').length;
  const rejectedRequests = leaveRequests.filter(req => req.status === 'rejected').length;
  
  // Get recent leave requests
  const recentRequests = [...leaveRequests].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  ).slice(0, 5);
  
  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">Dashboard</h1>
        <Button as={Link} to="/leave-requests/new" variant="primary">
          <i className="bi bi-plus-lg me-1"></i>
          New Leave Request
        </Button>
      </div>
      
      {/* Welcome message */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <h5 className="mb-3">
            <i className="bi bi-person-circle me-2"></i>
            Welcome, {profile?.first_name || 'User'}!
          </h5>
          <p className="mb-0">
            You are logged in as: <strong>{profile?.employee_id}</strong>
            {profile?.department?.name && <span> | Department: <strong>{profile.department.name}</strong></span>}
          </p>
        </Card.Body>
      </Card>
      
      {/* Statistics */}
      <h5 className="mb-3">Leave Summary</h5>
      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-3 mb-md-0">
          <div className="stats-card">
            <div className="d-flex justify-content-between">
              <div>
                <p className="stats-value">{pendingRequests}</p>
                <p className="stats-label">Pending</p>
              </div>
              <div className="stats-icon bg-warning bg-opacity-10 text-warning">
                <i className="bi bi-hourglass-split"></i>
              </div>
            </div>
          </div>
        </Col>
        <Col md={3} sm={6} className="mb-3 mb-md-0">
          <div className="stats-card">
            <div className="d-flex justify-content-between">
              <div>
                <p className="stats-value">{approvedRequests}</p>
                <p className="stats-label">Approved</p>
              </div>
              <div className="stats-icon bg-success bg-opacity-10 text-success">
                <i className="bi bi-check-circle"></i>
              </div>
            </div>
          </div>
        </Col>
        <Col md={3} sm={6} className="mb-3 mb-md-0">
          <div className="stats-card">
            <div className="d-flex justify-content-between">
              <div>
                <p className="stats-value">{rejectedRequests}</p>
                <p className="stats-label">Rejected</p>
              </div>
              <div className="stats-icon bg-danger bg-opacity-10 text-danger">
                <i className="bi bi-x-circle"></i>
              </div>
            </div>
          </div>
        </Col>
        <Col md={3} sm={6}>
          <div className="stats-card">
            <div className="d-flex justify-content-between">
              <div>
                <p className="stats-value">{leaveRequests.length}</p>
                <p className="stats-label">Total Requests</p>
              </div>
              <div className="stats-icon bg-primary bg-opacity-10 text-primary">
                <i className="bi bi-file-earmark-text"></i>
              </div>
            </div>
          </div>
        </Col>
      </Row>
      
      {/* Leave Balances */}
      <h5 className="mb-3">Leave Balances</h5>
      <Row className="mb-4">
        {leaveBalances.length > 0 ? (
          leaveBalances.map((balance) => (
            <Col md={4} sm={6} key={balance.id} className="mb-3">
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1">{balance.leave_type?.name}</h6>
                      <h4 className="mb-0">
                        {balance.balance_days} <small className="text-muted">days</small>
                      </h4>
                    </div>
                    <div className="rounded-circle p-2" style={{ 
                      backgroundColor: `${balance.leave_type?.color || '#0d6efd'}20`,
                      color: balance.leave_type?.color || '#0d6efd'
                    }}>
                      <i className="bi bi-calendar-check fs-4"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <Col>
            <p className="text-muted">No leave balances found.</p>
          </Col>
        )}
      </Row>
      
      {/* Recent Leave Requests */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Recent Leave Requests</h5>
        <Link to="/leave-requests" className="btn btn-sm btn-outline-primary">
          View All
        </Link>
      </div>
      <Card className="shadow-sm mb-4">
        <Card.Body className="p-0">
          {recentRequests.length > 0 ? (
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Leave Type</th>
                  <th>Duration</th>
                  <th>Days</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{formatDate(request.created_at)}</td>
                    <td>{request.leave_type?.name || 'N/A'}</td>
                    <td>
                      {formatDate(request.start_date)} 
                      {request.start_date !== request.end_date && ` to ${formatDate(request.end_date)}`}
                    </td>
                    <td>{request.days_count}</td>
                    <td>{renderStatusBadge(request.status)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="p-4 text-center">
              <p className="mb-0">No leave requests found.</p>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Supervisor/Manager Quick Access Section */}
      {hasRole('supervisor') && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Supervisor Quick Access</h5>
          </div>
          <Row className="mb-4">
            <Col md={4} className="mb-3 mb-md-0">
              <Card className="h-100 shadow-sm">
                <Card.Body className="d-flex flex-column">
                  <div className="mb-3 text-center">
                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-3 d-inline-block">
                      <i className="bi bi-clipboard-check fs-3"></i>
                    </div>
                  </div>
                  <h5 className="card-title text-center">Pending Approvals</h5>
                  <p className="card-text text-center text-muted">
                    Review and manage leave requests from your team members
                  </p>
                  <Button as={Link} to="/approvals" variant="outline-primary" className="mt-auto">
                    View Approvals
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-3 mb-md-0">
              <Card className="h-100 shadow-sm">
                <Card.Body className="d-flex flex-column">
                  <div className="mb-3 text-center">
                    <div className="bg-success bg-opacity-10 text-success rounded-circle p-3 d-inline-block">
                      <i className="bi bi-calendar3 fs-3"></i>
                    </div>
                  </div>
                  <h5 className="card-title text-center">Team Calendar</h5>
                  <p className="card-text text-center text-muted">
                    View your team's leave schedule to plan workload effectively
                  </p>
                  <Button as={Link} to="/team-calendar" variant="outline-success" className="mt-auto">
                    Open Calendar
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 shadow-sm">
                <Card.Body className="d-flex flex-column">
                  <div className="mb-3 text-center">
                    <div className="bg-info bg-opacity-10 text-info rounded-circle p-3 d-inline-block">
                      <i className="bi bi-people fs-3"></i>
                    </div>
                  </div>
                  <h5 className="card-title text-center">Team Management</h5>
                  <p className="card-text text-center text-muted">
                    Manage your team members and view their leave statistics
                  </p>
                  <Button as={Link} to="/team-management" variant="outline-info" className="mt-auto">
                    Manage Team
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
      
      {/* Admin Quick Access Section */}
      {hasRole('admin') && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Admin Quick Access</h5>
          </div>
          <Row className="mb-4">
            <Col md={3} sm={6} className="mb-3">
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center">
                  <i className="bi bi-people fs-1 text-primary mb-3"></i>
                  <h5>Users</h5>
                  <Button as={Link} to="/admin/users" variant="outline-primary" size="sm" className="mt-2">
                    Manage
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6} className="mb-3">
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center">
                  <i className="bi bi-building fs-1 text-success mb-3"></i>
                  <h5>Departments</h5>
                  <Button as={Link} to="/admin/departments" variant="outline-success" size="sm" className="mt-2">
                    Manage
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6} className="mb-3">
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center">
                  <i className="bi bi-tag fs-1 text-warning mb-3"></i>
                  <h5>Leave Types</h5>
                  <Button as={Link} to="/admin/leave-types" variant="outline-warning" size="sm" className="mt-2">
                    Manage
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6} className="mb-3">
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center">
                  <i className="bi bi-graph-up fs-1 text-info mb-3"></i>
                  <h5>Reports</h5>
                  <Button as={Link} to="/admin/reports" variant="outline-info" size="sm" className="mt-2">
                    View
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
      
      {/* Recent Notifications */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Recent Notifications</h5>
        <Link to="/notifications" className="btn btn-sm btn-outline-primary">
          View All
        </Link>
      </div>
      <Card className="shadow-sm">
        <Card.Body className="p-0">
          {notifications.length > 0 ? (
            <div className="notification-list">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                >
                  <p className="notification-title mb-1">{notification.title}</p>
                  <p className="mb-1">{notification.content}</p>
                  <small className="notification-time">
                    {new Date(notification.created_at).toLocaleString()}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="mb-0">No notifications found.</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Dashboard; 