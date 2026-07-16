# SaveWise - Saving Plan Web App

A comprehensive web application for creating and managing saving plans with features for deposits, withdrawals, reminders, and progress tracking.

## Features

- **User Authentication**: Register, login, and profile management
- **Saving Plans**: Create weekly, bi-weekly, or monthly saving plans
- **Flexible Cycles**: Quarterly, 6-months, or yearly cycles
- **Deposit Tracking**: Track deposits with fixed or variable amounts
- **Reminders & Notifications**: Automated reminders for deposits
- **Progress Reports**: Visual progress tracking with charts
- **Multi-member Plans**: Invite others to join your saving plans
- **Withdrawals**: Request withdrawals with approval system
- **Interest Rates**: Set interest rates for borrowed money (optional)

## Tech Stack

### Backend
- Node.js with Express.js
- MySQL with Sequelize ORM
- JWT for authentication
- Nodemailer for email notifications
- Node-cron for scheduling

### Frontend
- React.js with Vite
- Tailwind CSS for styling
- Chart.js for data visualization
- React Router for navigation
- Axios for API calls

## Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## Windows Setup

1. **Clone the repository**
   ```powershell
   git clone <repository-url>
   cd saving-plan-app

## API Endpoints
1. **Authentication**
- POST /api/auth/register - Register new user

- POST /api/auth/login - Login user

- GET /api/auth/me - Get current user

2. **Saving Plans**
- POST /api/plans - Create new plan

- GET /api/plans - Get user's plans

- GET /api/plans/:id - Get single plan

- PUT /api/plans/:id - Update plan

- DELETE /api/plans/:id - Delete plan

- GET /api/plans/dashboard/stats - Get dashboard statistics

3. **Deposits**
- POST /api/deposits - Create deposit

- GET /api/deposits/plan/:planId - Get plan deposits

- GET /api/deposits/my-deposits - Get user's deposits

- PUT /api/deposits/:id - Update deposit