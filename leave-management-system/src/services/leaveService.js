import { supabase } from './supabase';

// Fetch all leave requests for a specific user
export const fetchUserLeaveRequests = async (userId) => {
  const { data, error } = await supabase
    .from('leave_requests')
    .select(`
      *,
      leave_type:leave_types(name, color),
      approvals(status, comment, updated_at, approver:users(id, first_name, last_name, email))
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return { data, error };
};

// Fetch leave requests for a supervisor (direct reports)
export const fetchTeamLeaveRequests = async (supervisorId) => {
  const { data, error } = await supabase
    .from('leave_requests')
    .select(`
      *,
      user:users(id, first_name, last_name, email, department, employee_id),
      leave_type:leave_types(name, color),
      approvals(status, comment, updated_at, approver:users(id, first_name, last_name, email))
    `)
    .eq('users.supervisor_id', supervisorId)
    .order('created_at', { ascending: false });
  
  return { data, error };
};

// Fetch all leave requests (admin only)
export const fetchAllLeaveRequests = async () => {
  const { data, error } = await supabase
    .from('leave_requests')
    .select(`
      *,
      user:users(id, first_name, last_name, email, department, employee_id),
      leave_type:leave_types(name, color),
      approvals(status, comment, updated_at, approver:users(id, first_name, last_name, email))
    `)
    .order('created_at', { ascending: false });
  
  return { data, error };
};

// Create a new leave request
export const createLeaveRequest = async (leaveData) => {
  const { data, error } = await supabase
    .from('leave_requests')
    .insert([leaveData])
    .select();
  
  return { data, error };
};

// Update an existing leave request
export const updateLeaveRequest = async (id, leaveData) => {
  const { data, error } = await supabase
    .from('leave_requests')
    .update(leaveData)
    .eq('id', id)
    .select();
  
  return { data, error };
};

// Delete a leave request
export const deleteLeaveRequest = async (id) => {
  const { error } = await supabase
    .from('leave_requests')
    .delete()
    .eq('id', id);
  
  return { error };
};

// Approve or reject a leave request
export const updateLeaveApproval = async (approvalData) => {
  const { data, error } = await supabase
    .from('approvals')
    .update({
      status: approvalData.status,
      comment: approvalData.comment,
      updated_at: new Date().toISOString()
    })
    .eq('id', approvalData.id)
    .select();
  
  return { data, error };
};

// Create initial approval records when a leave request is submitted
export const createApprovals = async (leaveRequestId, approvers) => {
  const approvalsToInsert = approvers.map(approverId => ({
    leave_request_id: leaveRequestId,
    approver_id: approverId,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('approvals')
    .insert(approvalsToInsert)
    .select();
  
  return { data, error };
};

// Fetch user's leave balance
export const fetchLeaveBalance = async (userId) => {
  const { data, error } = await supabase
    .from('leave_balances')
    .select(`
      *,
      leave_type:leave_types(name, color)
    `)
    .eq('user_id', userId);
  
  return { data, error };
};

// Fetch leave types
export const fetchLeaveTypes = async () => {
  const { data, error } = await supabase
    .from('leave_types')
    .select('*')
    .order('name');
  
  return { data, error };
};

// Update leave balance
export const updateLeaveBalance = async (userId, leaveTypeId, daysUsed) => {
  // First get the current balance
  const { data: balanceData, error: balanceError } = await supabase
    .from('leave_balances')
    .select('*')
    .eq('user_id', userId)
    .eq('leave_type_id', leaveTypeId)
    .single();
  
  if (balanceError) return { error: balanceError };
  
  // Update the balance
  const newBalance = balanceData.balance_days - daysUsed;
  const { data, error } = await supabase
    .from('leave_balances')
    .update({ balance_days: newBalance, updated_at: new Date().toISOString() })
    .eq('id', balanceData.id)
    .select();
  
  return { data, error };
}; 