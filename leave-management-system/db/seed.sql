-- Sample seed data for testing

-- Insert sample departments
INSERT INTO departments (name, description) VALUES
('Human Resources', 'HR department responsible for employee management'),
('Information Technology', 'IT department handling technical infrastructure'),
('Finance', 'Finance and accounting department'),
('Marketing', 'Marketing and communications department'),
('Operations', 'Operations and logistics department');

-- Insert sample holidays
INSERT INTO holidays (name, date, is_recurring) VALUES
('New Year''s Day', '2025-01-01', TRUE),
('Martin Luther King Jr. Day', '2025-01-20', TRUE),
('Presidents'' Day', '2025-02-17', TRUE),
('Memorial Day', '2025-05-26', TRUE),
('Independence Day', '2025-07-04', TRUE),
('Labor Day', '2025-09-01', TRUE),
('Veterans Day', '2025-11-11', TRUE),
('Thanksgiving Day', '2025-11-27', TRUE),
('Christmas Day', '2025-12-25', TRUE);

-- Note: The following inserts assume you have already created users in Supabase Auth
-- Replace the UUIDs with actual user IDs from your Supabase Auth

-- Assuming you have an admin user with this ID
-- Replace with actual admin user ID from auth.users
DO $$ 
DECLARE
  admin_user_id UUID := '00000000-0000-0000-0000-000000000001'; -- Replace with real UUID
BEGIN
  -- Insert admin user profile
  INSERT INTO users (
    id, first_name, last_name, email, employee_id, 
    department_id, position, join_date
  ) VALUES (
    admin_user_id, 
    'Admin', 
    'User', 
    'admin@example.com',
    '100001', 
    (SELECT id FROM departments WHERE name = 'Human Resources'),
    'System Administrator',
    '2024-01-01'
  );
  
  -- Assign admin role
  INSERT INTO user_roles (user_id, role_id) VALUES
  (admin_user_id, (SELECT id FROM roles WHERE name = 'admin'));
  
  -- Set up leave balances for admin
  INSERT INTO leave_balances (user_id, leave_type_id, balance_days, allocation_date, expiry_date) 
  SELECT 
    admin_user_id,
    leave_types.id,
    CASE 
      WHEN leave_types.name = 'Annual Leave' THEN 25.0
      WHEN leave_types.name = 'Sick Leave' THEN 15.0
      WHEN leave_types.name = 'Personal Leave' THEN 5.0
      ELSE 0.0
    END,
    '2025-01-01',
    '2025-12-31'
  FROM leave_types;
END $$;

-- Assuming you have a supervisor user with this ID
-- Replace with actual supervisor user ID from auth.users
DO $$ 
DECLARE
  supervisor_user_id UUID := '00000000-0000-0000-0000-000000000002'; -- Replace with real UUID
BEGIN
  -- Insert supervisor user profile
  INSERT INTO users (
    id, first_name, last_name, email, employee_id, 
    department_id, position, join_date
  ) VALUES (
    supervisor_user_id, 
    'Supervisor', 
    'User', 
    'supervisor@example.com',
    '100002', 
    (SELECT id FROM departments WHERE name = 'Information Technology'),
    'IT Manager',
    '2024-01-15'
  );
  
  -- Assign supervisor role
  INSERT INTO user_roles (user_id, role_id) VALUES
  (supervisor_user_id, (SELECT id FROM roles WHERE name = 'supervisor')),
  (supervisor_user_id, (SELECT id FROM roles WHERE name = 'employee'));
  
  -- Set up leave balances for supervisor
  INSERT INTO leave_balances (user_id, leave_type_id, balance_days, allocation_date, expiry_date) 
  SELECT 
    supervisor_user_id,
    leave_types.id,
    CASE 
      WHEN leave_types.name = 'Annual Leave' THEN 22.0
      WHEN leave_types.name = 'Sick Leave' THEN 12.0
      WHEN leave_types.name = 'Personal Leave' THEN 3.0
      ELSE 0.0
    END,
    '2025-01-01',
    '2025-12-31'
  FROM leave_types;
END $$;

-- Assuming you have a regular employee user with this ID
-- Replace with actual employee user ID from auth.users
DO $$ 
DECLARE
  employee_user_id UUID := '00000000-0000-0000-0000-000000000003'; -- Replace with real UUID
  supervisor_id UUID := '00000000-0000-0000-0000-000000000002'; -- Replace with real UUID of supervisor
BEGIN
  -- Insert employee user profile
  INSERT INTO users (
    id, first_name, last_name, email, employee_id, 
    department_id, supervisor_id, position, join_date
  ) VALUES (
    employee_user_id, 
    'Employee', 
    'User', 
    'employee@example.com',
    '100003', 
    (SELECT id FROM departments WHERE name = 'Information Technology'),
    supervisor_id,
    'Software Developer',
    '2024-02-01'
  );
  
  -- Assign employee role
  INSERT INTO user_roles (user_id, role_id) VALUES
  (employee_user_id, (SELECT id FROM roles WHERE name = 'employee'));
  
  -- Set up leave balances for employee
  INSERT INTO leave_balances (user_id, leave_type_id, balance_days, allocation_date, expiry_date) 
  SELECT 
    employee_user_id,
    leave_types.id,
    CASE 
      WHEN leave_types.name = 'Annual Leave' THEN 20.0
      WHEN leave_types.name = 'Sick Leave' THEN 10.0
      WHEN leave_types.name = 'Personal Leave' THEN 3.0
      ELSE 0.0
    END,
    '2025-01-01',
    '2025-12-31'
  FROM leave_types;
  
  -- Create a sample leave request for employee
  INSERT INTO leave_requests (
    user_id, leave_type_id, start_date, end_date, 
    days_count, reason, status
  ) VALUES (
    employee_user_id,
    (SELECT id FROM leave_types WHERE name = 'Annual Leave'),
    '2025-04-15',
    '2025-04-18',
    4.0,
    'Family vacation',
    'pending'
  );
  
  -- Create an approval record for the leave request
  INSERT INTO approvals (
    leave_request_id, approver_id, status
  ) VALUES (
    (SELECT id FROM leave_requests WHERE user_id = employee_user_id ORDER BY created_at DESC LIMIT 1),
    supervisor_id,
    'pending'
  );
  
  -- Create a notification for the supervisor about the leave request
  INSERT INTO notifications (
    user_id, sender_id, title, content, type, reference_id
  ) VALUES (
    supervisor_id,
    employee_user_id,
    'New Leave Request',
    'A new leave request from Employee User requires your approval.',
    'leave_request',
    (SELECT id FROM leave_requests WHERE user_id = employee_user_id ORDER BY created_at DESC LIMIT 1)
  );
END $$; 