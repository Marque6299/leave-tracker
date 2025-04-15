-- Schema for Leave Management System in Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Departments Table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users Table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  employee_id TEXT NOT NULL UNIQUE,
  department_id UUID REFERENCES departments(id),
  supervisor_id UUID REFERENCES auth.users(id),
  position TEXT,
  join_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roles Table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Roles Table (many-to-many relationship)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- Leave Types Table
CREATE TABLE leave_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#0d6efd',
  is_paid BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leave Balances Table
CREATE TABLE leave_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  balance_days DECIMAL(5,1) NOT NULL DEFAULT 0,
  allocation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, leave_type_id)
);

-- Leave Requests Table
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count DECIMAL(5,1) NOT NULL,
  half_day BOOLEAN DEFAULT FALSE,
  half_day_part TEXT CHECK (half_day_part IN ('morning', 'afternoon')),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Approvals Table
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leave_request_id UUID NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(leave_request_id, approver_id)
);

-- Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  type TEXT NOT NULL,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Holidays Table
CREATE TABLE holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leave Transactions Table (for audit purposes)
CREATE TABLE leave_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  leave_request_id UUID REFERENCES leave_requests(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('allocation', 'usage', 'adjustment', 'expiry')),
  days DECIMAL(5,1) NOT NULL,
  balance_before DECIMAL(5,1) NOT NULL,
  balance_after DECIMAL(5,1) NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('admin', 'Administrator with full access'),
('supervisor', 'Supervisor with team management access'),
('employee', 'Regular employee');

-- Insert default leave types
INSERT INTO leave_types (name, description, color, is_paid) VALUES
('Annual Leave', 'Regular vacation leave', '#0d6efd', TRUE),
('Sick Leave', 'Leave for medical reasons', '#dc3545', TRUE),
('Personal Leave', 'Leave for personal matters', '#fd7e14', TRUE),
('Unpaid Leave', 'Leave without pay', '#6c757d', FALSE),
('Maternity Leave', 'Leave for childbirth and care', '#e83e8c', TRUE),
('Paternity Leave', 'Leave for fathers after childbirth', '#6f42c1', TRUE);

-- RLS Policies (Row Level Security)

-- Enable RLS on all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_transactions ENABLE ROW LEVEL SECURITY;

-- Functions to check user roles
CREATE OR REPLACE FUNCTION public.user_has_role(user_id UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  has_role BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    JOIN roles ON user_roles.role_id = roles.id
    WHERE user_roles.user_id = user_id
    AND roles.name = role_name
  ) INTO has_role;
  
  RETURN has_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- For users to see their own data and supervisors to see their direct reports
CREATE OR REPLACE FUNCTION public.is_user_or_supervisor(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  curr_user_id UUID;
  is_supervisor BOOLEAN;
BEGIN
  -- Get current user ID
  curr_user_id := auth.uid();
  
  -- Check if requesting own data
  IF curr_user_id = user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Check if supervisor of the user
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE users.id = user_id
    AND users.supervisor_id = curr_user_id
  ) INTO is_supervisor;
  
  RETURN is_supervisor;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for each table (examples)

-- Users Policy
CREATE POLICY users_policy ON users
  USING (
    auth.uid() = id OR
    is_user_or_supervisor(id) OR
    user_has_role(auth.uid(), 'admin')
  );

-- Leave Requests Policy
CREATE POLICY leave_requests_policy ON leave_requests
  USING (
    user_id = auth.uid() OR
    is_user_or_supervisor(user_id) OR
    user_has_role(auth.uid(), 'admin')
  );

-- Notifications Policy
CREATE POLICY notifications_policy ON notifications
  USING (
    user_id = auth.uid() OR
    user_has_role(auth.uid(), 'admin')
  );

-- Approvals Policy
CREATE POLICY approvals_policy ON approvals
  USING (
    approver_id = auth.uid() OR
    user_has_role(auth.uid(), 'admin') OR
    (
      SELECT user_id FROM leave_requests
      WHERE leave_requests.id = leave_request_id
    ) = auth.uid()
  );

-- Create function for automatic leave request status update based on approvals
CREATE OR REPLACE FUNCTION update_leave_request_status()
RETURNS TRIGGER AS $$
DECLARE
  all_approved BOOLEAN;
  any_rejected BOOLEAN;
  leave_req_id UUID;
BEGIN
  -- Store the leave request ID
  leave_req_id := NEW.leave_request_id;
  
  -- Check if all approvals are approved
  SELECT COUNT(*) = COUNT(CASE WHEN status = 'approved' THEN 1 END)
  INTO all_approved
  FROM approvals
  WHERE leave_request_id = leave_req_id;
  
  -- Check if any approval is rejected
  SELECT EXISTS(SELECT 1 FROM approvals WHERE leave_request_id = leave_req_id AND status = 'rejected')
  INTO any_rejected;
  
  -- Update the leave request status
  IF any_rejected THEN
    UPDATE leave_requests SET status = 'rejected', updated_at = NOW() WHERE id = leave_req_id;
  ELSIF all_approved THEN
    UPDATE leave_requests SET status = 'approved', updated_at = NOW() WHERE id = leave_req_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for approval status changes
CREATE TRIGGER approval_status_trigger
AFTER UPDATE OF status ON approvals
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_leave_request_status(); 