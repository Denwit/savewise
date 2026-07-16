import cron from 'cron';
import { Op } from 'sequelize';
import moment from 'moment';
import { Reminder, User, SavingPlan } from '../models/index.js';
import { sendEmailNotification } from './email.service.js';

class ReminderService {
  constructor() {
    this.job = null;
  }

  start() {
    // Run every day at 8 AM
    this.job = new cron.CronJob('0 8 * * *', this.checkReminders.bind(this));
    this.job.start();
    console.log('Reminder service started');
  }

  async checkReminders() {
    try {
      const today = moment().format('YYYY-MM-DD');
      
      // Get reminders for today
      const reminders = await Reminder.findAll({
        where: {
          reminder_date: today,
          is_sent: false
        },
        include: [
          {
            model: User,
            attributes: ['email', 'username']
          },
          {
            model: SavingPlan,
            attributes: ['plan_name']
          }
        ]
      });

      // Send notifications for each reminder
      for (const reminder of reminders) {
        await this.sendReminder(reminder);
        await reminder.update({ is_sent: true, sent_at: new Date() });
      }

      console.log(`Processed ${reminders.length} reminders`);
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }

  async sendReminder(reminder) {
    const user = reminder.User;
    const plan = reminder.SavingPlan;
    
    // Send email
    const emailContent = {
      to: user.email,
      subject: `Reminder: ${reminder.message}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0ea5e9;">SaveWise Reminder</h2>
          <p>Hello ${user.username},</p>
          <p>${reminder.message}</p>
          <p><strong>Plan:</strong> ${plan.plan_name}</p>
          <p>Please log in to your account to take action.</p>
          <a href="https://savewisezm.com/dashboard" 
             style="display: inline-block; padding: 10px 20px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px;">
            Go to Dashboard
          </a>
        </div>
      `
    };

    await sendEmailNotification(emailContent);
    
    // You can also add SMS or push notifications here
  }
}

export default new ReminderService();