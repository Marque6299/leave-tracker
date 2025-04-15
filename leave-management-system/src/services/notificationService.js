import { supabase } from './supabase';

// Fetch notifications for a user
export const fetchUserNotifications = async (userId) => {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      sender:users(id, first_name, last_name)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return { data, error };
};

// Create a new notification
export const createNotification = async (notificationData) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert([notificationData])
    .select();
  
  return { data, error };
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .select();
  
  return { data, error };
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .select();
  
  return { data, error };
};

// Delete a notification
export const deleteNotification = async (notificationId) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);
  
  return { error };
};

// Get unread notification count
export const getUnreadNotificationCount = async (userId) => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  
  return { count, error };
};

// Send notification to a supervisor about a new leave request
export const notifySupervisorAboutLeaveRequest = async (leaveRequest, userId, supervisorId) => {
  const dateInfo = leaveRequest.start_date === leaveRequest.end_date 
    ? `on ${formatDate(leaveRequest.start_date)}` 
    : `from ${formatDate(leaveRequest.start_date)} to ${formatDate(leaveRequest.end_date)}`;
  
  const notification = {
    user_id: supervisorId,
    sender_id: userId,
    title: 'New Leave Request',
    content: `A new leave request ${dateInfo} requires your approval.`,
    type: 'leave_request',
    reference_id: leaveRequest.id,
    is_read: false,
    created_at: new Date().toISOString()
  };
  
  return await createNotification(notification);
};

// Send notification to employee about leave request status change
export const notifyEmployeeAboutLeaveRequestStatus = async (leaveRequest, statusUpdate, supervisorId) => {
  const dateInfo = leaveRequest.start_date === leaveRequest.end_date 
    ? `on ${formatDate(leaveRequest.start_date)}` 
    : `from ${formatDate(leaveRequest.start_date)} to ${formatDate(leaveRequest.end_date)}`;
  
  let title = '';
  let content = '';
  
  if (statusUpdate === 'approved') {
    title = 'Leave Request Approved';
    content = `Your leave request ${dateInfo} has been approved.`;
  } else if (statusUpdate === 'rejected') {
    title = 'Leave Request Rejected';
    content = `Your leave request ${dateInfo} has been rejected.`;
  } else {
    title = 'Leave Request Updated';
    content = `Your leave request ${dateInfo} status has been updated to ${statusUpdate}.`;
  }
  
  const notification = {
    user_id: leaveRequest.user_id,
    sender_id: supervisorId,
    title,
    content,
    type: 'leave_request',
    reference_id: leaveRequest.id,
    is_read: false,
    created_at: new Date().toISOString()
  };
  
  return await createNotification(notification);
};

// Helper function to format date
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}; 