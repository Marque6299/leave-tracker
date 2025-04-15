import React, { useState } from 'react';
import { Card, Button, Badge, Form, Row, Col, Alert, Modal } from 'react-bootstrap';
import { updateLeaveApproval } from '../services/leaveService';
import { notifyEmployeeAboutLeaveRequestStatus } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

const LeaveApproval = ({ leaveRequest, onComplete }) => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleOpenModal = (actionType) => {
    setAction(actionType);
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setComment('');
    setError('');
  };
  
  const handleApproval = async () => {
    if (!action) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Find the approval record for the current user
      const approvalRecord = leaveRequest.approvals?.find(
        approval => approval.approver?.id === user.id
      );
      
      if (!approvalRecord) {
        throw new Error('Approval record not found');
      }
      
      // Update approval status
      const approvalData = {
        id: approvalRecord.id,
        status: action === 'approve' ? 'approved' : 'rejected',
        comment: comment.trim() || null
      };
      
      const { error: approvalError } = await updateLeaveApproval(approvalData);
      
      if (approvalError) throw approvalError;
      
      // Send notification to employee
      await notifyEmployeeAboutLeaveRequestStatus(
        leaveRequest,
        action === 'approve' ? 'approved' : 'rejected',
        user.id
      );
      
      // Close modal and trigger refresh
      handleCloseModal();
      if (onComplete) onComplete();
      
    } catch (err) {
      console.error('Error processing approval:', err);
      setError(err.message || 'Failed to process approval. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
  
  // Get approval record for current user
  const currentUserApproval = leaveRequest.approvals?.find(
    approval => approval.approver?.id === user.id
  );
  
  const isPending = currentUserApproval?.status === 'pending';
  
  return (
    <>
      <Card className="shadow-sm mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Leave Request Details</h5>
          <div>{renderStatusBadge(leaveRequest.status)}</div>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={6}>
              <p className="mb-1"><strong>Employee:</strong> {leaveRequest.user?.first_name} {leaveRequest.user?.last_name}</p>
              <p className="mb-1"><strong>Employee ID:</strong> {leaveRequest.user?.employee_id}</p>
              <p className="mb-1"><strong>Department:</strong> {leaveRequest.user?.department?.name}</p>
            </Col>
            <Col md={6}>
              <p className="mb-1"><strong>Leave Type:</strong> {leaveRequest.leave_type?.name}</p>
              <p className="mb-1"><strong>Duration:</strong> {formatDate(leaveRequest.start_date)} to {formatDate(leaveRequest.end_date)}</p>
              <p className="mb-1"><strong>Days:</strong> {leaveRequest.days_count} {leaveRequest.days_count === 1 ? 'day' : 'days'} {leaveRequest.half_day && '(Half Day)'}</p>
            </Col>
          </Row>
          
          <div className="mb-3">
            <h6>Reason for Leave:</h6>
            <p className="p-2 bg-light rounded">{leaveRequest.reason}</p>
          </div>
          
          {isPending ? (
            <div className="d-flex justify-content-end">
              <Button 
                variant="outline-danger" 
                className="me-2" 
                onClick={() => handleOpenModal('reject')}
              >
                <i className="bi bi-x-circle me-1"></i>
                Reject
              </Button>
              <Button 
                variant="success" 
                onClick={() => handleOpenModal('approve')}
              >
                <i className="bi bi-check-circle me-1"></i>
                Approve
              </Button>
            </div>
          ) : (
            <Alert variant={currentUserApproval?.status === 'approved' ? 'success' : 'danger'}>
              <p className="mb-1">
                <strong>Your Response:</strong> {renderStatusBadge(currentUserApproval?.status || 'pending')}
              </p>
              {currentUserApproval?.comment && (
                <p className="mb-0">
                  <strong>Your Comment:</strong> {currentUserApproval.comment}
                </p>
              )}
            </Alert>
          )}
        </Card.Body>
      </Card>
      
      {/* Approval/Rejection Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {action === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <p>
            You are about to <strong>{action === 'approve' ? 'approve' : 'reject'}</strong> the leave request 
            from <strong>{leaveRequest.user?.first_name} {leaveRequest.user?.last_name}</strong> for 
            <strong> {leaveRequest.days_count} {leaveRequest.days_count === 1 ? 'day' : 'days'}</strong>.
          </p>
          
          <Form.Group className="mb-3">
            <Form.Label>Comment (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add any comments about your decision..."
              disabled={loading}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleCloseModal} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant={action === 'approve' ? 'success' : 'danger'} 
            onClick={handleApproval}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                {action === 'approve' ? 'Approving...' : 'Rejecting...'}
              </>
            ) : (
              <>{action === 'approve' ? 'Approve' : 'Reject'}</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default LeaveApproval; 