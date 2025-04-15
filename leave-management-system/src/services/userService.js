import { supabase } from './supabase';

// Fetch current user profile
export const fetchUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      supervisor:supervisors(id, first_name, last_name, email),
      department:departments(id, name)
    `)
    .eq('id', userId)
    .single();
  
  return { data, error };
};

// Fetch all users (admin only)
export const fetchAllUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      supervisor:supervisors(id, first_name, last_name, email),
      department:departments(id, name)
    `)
    .order('last_name');
  
  return { data, error };
};

// Create user profile after registration
export const createUserProfile = async (profileData) => {
  const { data, error } = await supabase
    .from('users')
    .insert([profileData])
    .select();
  
  return { data, error };
};

// Update user profile
export const updateUserProfile = async (userId, profileData) => {
  const { data, error } = await supabase
    .from('users')
    .update(profileData)
    .eq('id', userId)
    .select();
  
  return { data, error };
};

// Delete user
export const deleteUser = async (userId) => {
  // Delete user profile first
  const { error: profileError } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);
  
  if (profileError) return { error: profileError };
  
  // Then delete the auth user if needed
  // Note: This would typically be handled by a server function in Supabase
  
  return { error: null };
};

// Fetch direct reports (for supervisors)
export const fetchDirectReports = async (supervisorId) => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      department:departments(id, name)
    `)
    .eq('supervisor_id', supervisorId)
    .order('last_name');
  
  return { data, error };
};

// Fetch all departments
export const fetchDepartments = async () => {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name');
  
  return { data, error };
};

// Fetch all roles
export const fetchRoles = async () => {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('name');
  
  return { data, error };
};

// Assign role to user
export const assignUserRole = async (userId, roleId) => {
  const { data, error } = await supabase
    .from('user_roles')
    .insert([{ user_id: userId, role_id: roleId }])
    .select();
  
  return { data, error };
};

// Remove role from user
export const removeUserRole = async (userId, roleId) => {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role_id', roleId);
  
  return { error };
};

// Check if user has specific role
export const checkUserRole = async (userId, roleName) => {
  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      role:roles(name)
    `)
    .eq('user_id', userId)
    .eq('roles.name', roleName);
  
  if (error) return { hasRole: false, error };
  return { hasRole: data && data.length > 0, error: null };
};

// Fetch potential supervisors (for assigning supervisors)
export const fetchPotentialSupervisors = async () => {
  // Fetch users with a supervisor role
  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      user:users(id, first_name, last_name, email, employee_id)
    `)
    .eq('roles.name', 'supervisor')
    .order('user.last_name');
  
  return { data, error };
}; 