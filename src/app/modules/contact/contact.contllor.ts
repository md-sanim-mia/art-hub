import status from "http-status";
import AppError from "../../errors/AppError";
import catchAsync from "../../utils/catchAsync";
import { ContactServices } from "./contact.services";

const createContact=catchAsync(async(req,res)=>{
const payload = req.body;

  // payload validation
  if (!payload || !payload.fullName || !payload.email || !payload.subject || !payload.description) {
    throw new AppError(status.BAD_REQUEST, "All fields are required: fullName, email, subject, description");
  }

  // send email
const result=await ContactServices.createContact(payload)

  // respond
  res.status(status.OK).json({
    success: true,
    message: "Contact form submitted successfully!",
  });
})

export const ContactContllor={
    createContact
}