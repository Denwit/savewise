import cron from 'cron';
import { Op } from 'sequelize';
import moment from 'moment';
import { Reminder, User, SavingPlan } from '../models/index.js';
import { sendEmail } from './emailService.js';

class ReminderScheduler {
  constructor() {
    this.job = null;
  }

  start() {
    // Run every day at 8 AM
    this.job = new cron.CronJob('0 8 * * *', this.checkReminders.bind(this));
    this.job.start();
    console.log('Reminder scheduler started');
  }

  async checkReminders() {
    try {
      const today = moment().format('YYYY-MM-DD');
      
      const reminders = await Reminder.findAll({
        where: {
          reminder_date: today,
          is_sent: false,
        },
        include: [
          {
            model: User,
            attributes: ['email', 'username'],
          },
          {
            model: SavingPlan,
            attributes: ['plan_name'],
          },
        ],
      });

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

    const emailContent = {
      to: user.email,
      subject: `Reminder: ${reminder.reminder_type}`,
      html: `
        <h2>SaveWise Reminder</h2>
        <p>Hello ${user.username},</p>
        <p>${reminder.message}</p>
        <p>Plan: ${plan.plan_name}</p>
        <p>Please log in to your account to take action.</p>
      `,
    };

    await sendEmail(emailContent);
  }
}

export default new ReminderScheduler();