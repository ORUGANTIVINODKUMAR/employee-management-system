import Notification from "../models/Notification.js";

export const createNotification = async ({
  recipientId,
  title,
  message,
  link = "",
}) => {
  return await Notification.create({
    recipientId,
    title,
    message,
    link,
  });
};