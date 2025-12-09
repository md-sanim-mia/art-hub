import status from "http-status";
import AppError from "../../errors/AppError";
import { sendContactEmail, sendEmail } from "../../utils/sendEmail";


const createContact = async (payload: {
  fullName: string;
  email: string;
  subject: string;
  description: string;
}) => {
  if (!payload) {
    throw new AppError(status.NOT_FOUND, "Payload is required!");
  }
console.log(payload)

  const result= await sendContactEmail(payload?.email,payload);

  return result

};

export const ContactServices={
    createContact
}