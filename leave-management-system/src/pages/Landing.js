import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const { isAuthenticated, sessionChecked } = useAuth();
  
  // If user is authenticated and session check is complete, redirect to dashboard
  if (sessionChecked && isAuthenticated()) {
    return <Link to="/dashboard" />;
  }
  
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero py-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-4 mb-lg-0">
              <h1 className="display-4 fw-bold mb-3">Streamline Your Leave Management</h1>
              <p className="lead mb-4">
                A comprehensive leave management system designed to simplify the way your organization
                handles time-off requests, approvals, and tracking.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <Button as={Link} to="/register" variant="primary" size="lg">
                  Get Started
                </Button>
                <Button as={Link} to="/login" variant="outline-primary" size="lg">
                  Sign In
                </Button>
              </div>
            </Col>
            <Col lg={6}>
              <img
                src="https://via.placeholder.com/600x400?text=Leave+Management"
                alt="Leave Management"
                className="img-fluid rounded shadow"
              />
            </Col>
          </Row>
        </Container>
      </section>
      
      {/* Features Section */}
      <section className="features py-5 bg-light">
        <Container>
          <h2 className="text-center mb-5">Key Features</h2>
          <Row>
            {[
              {
                icon: 'bi-calendar-check',
                title: 'Request Management',
                description: 'Easily submit, track, and manage leave requests with an intuitive interface.'
              },
              {
                icon: 'bi-shield-check',
                title: 'Role-Based Access',
                description: 'Different views and permissions for employees, supervisors, and administrators.'
              },
              {
                icon: 'bi-graph-up',
                title: 'Dashboard & Analytics',
                description: 'Visual representation of leave data with insightful analytics.'
              },
              {
                icon: 'bi-bell',
                title: 'Notifications',
                description: 'Automatic notifications for leave request status changes and approvals.'
              },
              {
                icon: 'bi-calendar3',
                title: 'Calendar Integration',
                description: 'View and manage leave requests with built-in calendar view.'
              },
              {
                icon: 'bi-phone',
                title: 'Mobile Responsive',
                description: 'Access the application on any device with a fully responsive design.'
              }
            ].map((feature, index) => (
              <Col md={6} lg={4} key={index} className="mb-4">
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Body className="text-center p-4">
                    <div className="feature-icon mb-3">
                      <i className={`bi ${feature.icon} fs-1 text-primary`}></i>
                    </div>
                    <Card.Title className="fw-bold">{feature.title}</Card.Title>
                    <Card.Text>{feature.description}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>
      
      {/* Call to Action */}
      <section className="cta py-5">
        <Container className="text-center">
          <h2 className="mb-4">Ready to simplify your leave management?</h2>
          <p className="lead mb-4">
            Join thousands of organizations that have streamlined their leave management process.
          </p>
          <Button as={Link} to="/register" variant="primary" size="lg">
            Sign Up Now
          </Button>
        </Container>
      </section>
    </div>
  );
};

export default Landing; 