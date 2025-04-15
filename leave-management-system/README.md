# Leave Management System

A comprehensive leave management application with user authentication, approval workflows, and role-based access control.

## Features

- **User Authentication**: Secure login and registration system
- **Role-Based Access Control**: Different views for employees, supervisors, and administrators
- **Leave Request Management**: Submit, edit, and track leave requests
- **Approval Workflows**: Multi-level approval process for leave requests
- **Dashboard & Analytics**: Visual representation of leave data and trends
- **Notifications**: Email and in-app notifications for request status updates

## Technology Stack

- Frontend: React, Bootstrap 5, TypeScript
- Backend: Supabase (Authentication, Database, Storage)
- Hosting: Vercel/Netlify (recommended)

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a Supabase account and project
4. Set up your environment variables in a `.env` file:
   ```
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
5. Run the development server with `npm start`

## Project Structure

- `/src/components`: Reusable UI components
- `/src/pages`: Application pages and routes
- `/src/context`: React context for global state management
- `/src/hooks`: Custom React hooks
- `/src/services`: API and service integrations
- `/src/utils`: Utility functions and helpers
- `/src/assets`: Static assets (images, icons, etc.)

## Database Schema

The application uses the following primary tables in Supabase:

- `users`: User information and authentication
- `departments`: Company departments
- `leave_types`: Types of leave (vacation, sick, etc.)
- `leave_requests`: Leave request details and status
- `leave_balances`: Employee leave balances
- `approvals`: Approval workflow records
- `notifications`: System notifications

## License

This project is licensed under the MIT License - see the LICENSE file for details. 