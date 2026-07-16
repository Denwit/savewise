-- Create database
CREATE DATABASE IF NOT EXISTS saving_plan_db;
USE saving_plan_db;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username)
);

-- Saving plans table
CREATE TABLE saving_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    owner_id INT NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    description TEXT,
    frequency ENUM('weekly', 'bi-weekly', 'monthly') NOT NULL,
    cycle ENUM('quarterly', '6-months', 'yearly') NOT NULL,
    target_amount DECIMAL(12,2) NOT NULL,
    max_members INT DEFAULT 1,
    interest_rate DECIMAL(5,2) DEFAULT 0.00,
    is_fixed_amount BOOLEAN DEFAULT TRUE,
    fixed_amount DECIMAL(10,2),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    currency VARCHAR(10) DEFAULT 'ZMW',
    status ENUM('active', 'completed', 'cancelled', 'pending') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_owner_id (owner_id),
    INDEX idx_status (status)
);

-- Plan members table
CREATE TABLE plan_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plan_id INT NOT NULL,
    user_id INT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'left', 'removed', 'pending') DEFAULT 'active',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP NULL,
    FOREIGN KEY (plan_id) REFERENCES saving_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_membership (plan_id, user_id),
    INDEX idx_plan_id (plan_id),
    INDEX idx_user_id (user_id)
);

-- Deposits table
CREATE TABLE deposits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plan_id INT NOT NULL,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    deposit_date DATE NOT NULL,
    expected_date DATE,
    status ENUM('completed', 'pending', 'missed', 'late') DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES saving_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_plan_user (plan_id, user_id),
    INDEX idx_deposit_date (deposit_date)
);

-- Withdrawals table
CREATE TABLE withdrawals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plan_id INT NOT NULL,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES saving_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_plan_user (plan_id, user_id),
    INDEX idx_status (status)
);

-- Reminders table
CREATE TABLE reminders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plan_id INT NOT NULL,
    user_id INT NOT NULL,
    reminder_type ENUM('deposit', 'withdrawal', 'target', 'general') NOT NULL,
    reminder_date DATE NOT NULL,
    message TEXT,
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES saving_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_reminder_date (reminder_date),
    INDEX idx_is_sent (is_sent)
);

-- Notifications table
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'success', 'reminder') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read)
);

-- User settings table
CREATE TABLE user_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    reminder_days_before INT DEFAULT 1,
    currency VARCHAR(10) DEFAULT 'ZMW',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user (user_id)
);

ALTER TABLE saving_plans
ADD COLUMN allow_early_withdrawals BOOLEAN DEFAULT FALSE,
ADD COLUMN auto_approval BOOLEAN DEFAULT TRUE,
ADD COLUMN reminder_settings JSON;

-- Add new columns to users table
ALTER TABLE users
ADD COLUMN last_login TIMESTAMP NULL;

-- Update withdrawals table (if not already there)
ALTER TABLE withdrawals
ADD COLUMN rejection_reason TEXT;

-- Create indexes for better performance
CREATE INDEX idx_deposits_user_plan ON deposits (user_id, plan_id);
CREATE INDEX idx_withdrawals_status ON withdrawals (status);
CREATE INDEX idx_notifications_user_created ON notifications (user_id, created_at);
CREATE INDEX idx_plan_members_status ON plan_members (status);