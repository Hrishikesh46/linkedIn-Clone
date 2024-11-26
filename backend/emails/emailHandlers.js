import { mailtrapClient, sender } from '../lib/mailtrap.js';
import {
  createWelcomeEmailTemplate,
  createCommentNotificationEmailTemplate,
  createConnectionAcceptedEmailTemplate,
} from './emailTemplates.js';

export const sendWelcomeEmail = async (email, name, profileUrl) => {
  const recipient = [{ email }];

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: 'Welcome to UnLinked',
      html: createWelcomeEmailTemplate(name, profileUrl),
      category: 'Welcome',
    });

    console.log('Welcome Email sent successfully', response);
  } catch (error) {
    throw error;
  }
};

export const sendCommentNotificationEmail = async (
  recipientEmail,
  recipientName,
  commenterName,
  postUrl,
  commentContent
) => {
  const recipient = [{ email: recipientEmail }];
  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: 'New comment on your post',
      html: createCommentNotificationEmailTemplate(
        recipientName,
        commenterName,
        postUrl,
        commentContent
      ),
      category: 'comment_notification',
    });

    console.log('Comment Notification Email sent successfully', response);
  } catch (error) {
    throw error;
  }
};

export const sendConnectionAcceptedEmail = async (
  senderEmail,
  senderName,
  recipientName
) => {
  const recipient = [{ email: senderEmail }];

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: ` ${recipientName} accepted your connection request`,
      html: createConnectionAcceptedEmailTemplate(
        senderName,
        recipientName,
        recipientName.profileUrl
      ),
      category: 'connection_accepted',
    });
  } catch (error) {}
};
