import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button, Alert, Card } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { fetchLeaveTypes, createLeaveRequest, updateLeaveRequest } from '../services/leaveService';
import { fetchLeaveBalance } from '../services/leaveService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const LeaveRequestForm = ({ existingRequest = null, onSuccess = () => {}, onCancel = () => {} }) => {
  const { user, profile } = useAuth();
  
  const initialFormState = {
    startDate: new Date(),
    endDate: new Date(),
    leaveTypeId: '',
    reason: '',
    halfDay: false,
    halfDayPart: 'morning'
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Load leave types and balances
  useEffect(() => {
    const loadFormData = async () => {
      try {
        // Fetch leave types
        const { data: typesData, error: typesError } = await fetchLeaveTypes();
        if (typesError) throw typesError;
        setLeaveTypes(typesData || []);
        
        // Fetch leave balances
        if (user) {
          const { data: balancesData, error: balancesError } = await fetchLeaveBalance(user.id);
          if (balancesError) throw balancesError;
          setLeaveBalances(balancesData || []);
        }
        
        // If editing an existing request
        if (existingRequest) {
          setIsEditing(true);
          setFormData({
            startDate: new Date(existingRequest.start_date),
            endDate: new Date(existingRequest.end_date),
            leaveTypeId: existingRequest.leave_type_id,
            reason: existingRequest.reason,
            halfDay: existingRequest.half_day,
            halfDayPart: existingRequest.half_day_part || 'morning'
          });
        }
      } catch (err) {
        console.error('Error loading form data:', err);
        setError('Failed to load form data. Please try again.');
      }
    };
    
    loadFormData();
  }, [user, existingRequest]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleDateChange = (date, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
  };
  
  const getWorkingDays = (startDate, endDate) => {
    let count = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Not a weekend
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return count;
  };
  
  const calculateLeaveDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    
    let days = getWorkingDays(formData.startDate, formData.endDate);
    
    if (formData.halfDay) {
      days = days - 0.5;
    }
    
    return days > 0 ? days : 0;
  };
  
  const getLeaveBalance = (leaveTypeId) => {
    const balance = leaveBalances.find(b => b.leave_type_id === leaveTypeId);
    return balance ? balance.balance_days : 0;
  };
  
  const validateForm = () => {
    if (!formData.startDate || !formData.endDate || !formData.leaveTypeId || !formData.reason) {
      setError('All fields are required');
      return false;
    }
    
    if (formData.startDate > formData.endDate) {
      setError('End date cannot be before start date');
      return false;
    }
    
    const leaveDays = calculateLeaveDays();
    if (leaveDays <= 0) {
      setError('Please select valid working days for your leave');
      return false;
    }
    
    const balance = getLeaveBalance(formData.leaveTypeId);
    if (leaveDays > balance && !isEditing) {
      setError(`Insufficient leave balance. You have ${balance} days available.`);
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setError('');
      
      const leaveData = {
        user_id: user.id,
        start_date: formData.startDate.toISOString().split('T')[0],
        end_date: formData.endDate.toISOString().split('T')[0],
        leave_type_id: formData.leaveTypeId,
        reason: formData.reason,
        status: isEditing ? existingRequest.status : 'pending',
        half_day: formData.halfDay,
        half_day_part: formData.halfDay ? formData.halfDayPart : null,
        days_count: calculateLeaveDays(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      let result;
      
      if (isEditing) {
        result = await updateLeaveRequest(existingRequest.id, leaveData);
      } else {
        result = await createLeaveRequest(leaveData);
      }
      
      if (result.error) throw result.error;
      
      setSuccess(true);
      setTimeout(() => {
        setFormData(initialFormState);
        onSuccess(result.data?.[0]);
      }, 1500);
      
    } catch (err) {
      console.error('Error submitting leave request:', err);
      setError(err.message || 'Failed to submit leave request. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="shadow-sm">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="card-title mb-0">
          <i className="bi bi-pencil-square me-2"></i>
          {isEditing ? 'Edit Leave Request' : 'New Leave Request'}
        </h5>
      </Card.Header>
      
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && (
          <Alert variant="success">
            {isEditing ? 'Leave request updated successfully!' : 'Leave request submitted successfully!'}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit}>
          {/* Employee Information */}
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Employee ID</Form.Label>
                <Form.Control
                  type="text"
                  value={profile?.employee_id || ''}
                  disabled
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Employee Name</Form.Label>
                <Form.Control
                  type="text"
                  value={profile ? `${profile.last_name}, ${profile.first_name}` : ''}
                  disabled
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Department</Form.Label>
                <Form.Control
                  type="text"
                  value={profile?.department?.name || ''}
                  disabled
                />
              </Form.Group>
            </Col>
          </Row>
          
          {/* Leave Type & Duration */}
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Leave Type <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="leaveTypeId"
                  value={formData.leaveTypeId}
                  onChange={handleChange}
                  required
                  disabled={loading || success}
                >
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name} - Balance: {getLeaveBalance(type.id)} days
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Start Date <span className="text-danger">*</span></Form.Label>
                <DatePicker
                  selected={formData.startDate}
                  onChange={(date) => handleDateChange(date, 'startDate')}
                  className="form-control"
                  dateFormat="yyyy-MM-dd"
                  minDate={new Date()}
                  disabled={loading || success}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>End Date <span className="text-danger">*</span></Form.Label>
                <DatePicker
                  selected={formData.endDate}
                  onChange={(date) => handleDateChange(date, 'endDate')}
                  className="form-control"
                  dateFormat="yyyy-MM-dd"
                  minDate={formData.startDate}
                  disabled={loading || success}
                />
              </Form.Group>
            </Col>
          </Row>
          
          {/* Half Day Option */}
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Check
                  type="checkbox"
                  id="halfDay"
                  name="halfDay"
                  label="Half Day"
                  checked={formData.halfDay}
                  onChange={handleChange}
                  disabled={loading || success}
                />
              </Form.Group>
            </Col>
            {formData.halfDay && (
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Half Day Part</Form.Label>
                  <Form.Select
                    name="halfDayPart"
                    value={formData.halfDayPart}
                    onChange={handleChange}
                    disabled={loading || success}
                  >
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            )}
            <Col md={4}>
              <Form.Group>
                <Form.Label>Total Days</Form.Label>
                <Form.Control
                  type="text"
                  value={calculateLeaveDays()}
                  disabled
                />
              </Form.Group>
            </Col>
          </Row>
          
          {/* Reason */}
          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Reason for Leave <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  as="textarea"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows={3}
                  required
                  disabled={loading || success}
                />
              </Form.Group>
            </Col>
          </Row>
          
          {/* Form Buttons */}
          <div className="d-flex justify-content-end">
            <Button
              variant="outline-secondary"
              onClick={onCancel}
              className="me-2"
              disabled={loading || success}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {isEditing ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                <>{isEditing ? 'Update Request' : 'Submit Request'}</>
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default LeaveRequestForm; 