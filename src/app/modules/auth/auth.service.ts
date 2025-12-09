import status from "http-status";
import config from "../../config";
import prisma from "../../utils/prisma";
import ApiError from "../../errors/AppError";
import { RefreshPayload } from "./auth.interface";
import { sendEmail } from "../../utils/sendEmail";
import { jwtHelpers } from "./../../helpers/jwtHelpers";
import { passwordCompare } from "../../helpers/comparePasswords";
import { hashPassword } from "../../helpers/hashPassword";
import bcrypt from "bcrypt";
import { PlanType, User, UserRole } from "@prisma/client";
import jwt,{Algorithm, JwtPayload} from'jsonwebtoken'
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library'
import { SubscriptionServices } from "../subscription/subscription.service";
import AppError from "../../errors/AppError";
import { configDotenv } from "dotenv";
const client = new OAuth2Client( process.env.CLIENT_ID);
const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  const isPasswordMatched = await passwordCompare(password, user.password);

  if (!isPasswordMatched) {
    throw new ApiError(status.UNAUTHORIZED, "Password is incorrect!");
  }

  const jwtPayload = {
    id: user.id,
    fullName: user.fullName,
    email:user.email,
    profilePic: user.profilePic,
    role: user.role,
    isVerified: user.isVerified,
    isSubscribed:user.isSubscribed,
   
   
  };

  const accessToken = jwtHelpers.createToken(
    jwtPayload,
    config.jwt.access.secret as string,
    config.jwt.access.expiresIn as string
  );

  const refreshToken = jwtHelpers.createToken(
    jwtPayload,
    config.jwt.refresh.secret as string,
    config.jwt.refresh.expiresIn as string
  );

  return {
    accessToken,
    refreshToken,
  };
};

interface GoogleUserData {
  userId: string;
  email: string;
  name: string;
  picture: string;
  emailVerified: boolean;
}



const googleLogin = async (idToken: string) => {
 
  const payload: any = jwt.decode(idToken);

  if (!payload) {
    throw new Error('Invalid token payload');
  }

  const googleUserData: GoogleUserData = {
    userId: payload['sub'] || '',
    email: payload['email'] || '',
    name: payload['name'] || payload['email']?.split('@')[0] || 'Unknown User',
    picture: payload['picture'] || '',
    emailVerified: payload['email_verified'] || false
  };

  let existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: googleUserData.email }]
    }
  });

  if (existingUser) {
    const jwtPayload = {
      id:existingUser.id,
      fullName: existingUser.fullName,
      email: existingUser.email,
      role: existingUser.role,
      profilePic: existingUser?.profilePic || "",
      isVerified: existingUser.isVerified,
      isSubscribed: existingUser.isSubscribed
    };

    const accessToken = jwtHelpers.createToken(
      jwtPayload,
      config.jwt.access.secret as string,
      config.jwt.access.expiresIn as string
    );
    const refreshToken = jwtHelpers.createToken(
    jwtPayload,
    config.jwt.refresh.secret as string,
    config.jwt.refresh.expiresIn as string
  );

    return { accessToken ,refreshToken};
  } else {

    const newUser = await prisma.user.create({
      data: {
        email: googleUserData.email,
        fullName: googleUserData.name,
        profilePic: googleUserData.picture,
        password: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
      }
    });

    const jwtPayload = {
      id:newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
      profilePic: newUser?.profilePic || "",
      isVerified: newUser.isVerified,
      isSubscribed: newUser.isSubscribed
    };

    const accessToken = jwtHelpers.createToken(
      jwtPayload,
      config.jwt.access.secret as string,
      config.jwt.access.expiresIn as string
    );
      const refreshToken = jwtHelpers.createToken(
    jwtPayload,
    config.jwt.refresh.secret as string,
    config.jwt.refresh.expiresIn as string
  );

    return { accessToken ,refreshToken};
  }
};



const verifyEmail = async (token: string) => {
  const verifiedToken = jwtHelpers.verifyToken(
    token,
    config.jwt.access.secret as string
  );

  const user = await prisma.user.findUnique({
    where: { email: verifiedToken.email },
  });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  if (user.isVerified) {
    throw new ApiError(status.BAD_REQUEST, "User already verified!");
  }

  await prisma.user.update({
    where: {
      email: verifiedToken.email,
    },
    data: {
      isVerified: true,
    },
  });

  return null;
};

const verifyResetPassLink = async (token: string) => {
  const verifiedToken = jwtHelpers.verifyToken(
    token,
    config.jwt.access.secret as string
  );

  const user = await prisma.user.findUnique({
    where: { email: verifiedToken.email },
  });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  await prisma.user.update({
    where: { email: verifiedToken.email },
    data: {
      isResetPassword: false,
      canResetPassword: true,
    },
  });

  return null;
};

const changePassword = async (
  email: string,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  if (!newPassword) {
    throw new ApiError(status.BAD_REQUEST, "New password is required!");
  }

  if (!confirmPassword) {
    throw new ApiError(status.BAD_REQUEST, "Confirm password is required!");
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(
      status.BAD_REQUEST,
      "New password and confirm password do not match!"
    );
  }

  const isPasswordMatch = await passwordCompare(currentPassword, user.password);

  if (!isPasswordMatch) {
    throw new ApiError(status.UNAUTHORIZED, "Current password is incorrect!");
  }

  const hashedNewPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { email },
    data: {
      password: hashedNewPassword,
      passwordChangedAt: new Date(),
    },
  });

  return null;
};

const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  if (!user.isVerified) {
    throw new ApiError(status.UNAUTHORIZED, "User account is not verified!");
  }

  // Generate 6-digit OTP
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const otp = generateOTP();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  // Save OTP in DBinit
  await prisma.user.update({
    where: { email },
    data: {
      isResetPassword: true,
      canResetPassword: false,
      resetPasswordOTP: otp,
      resetPasswordOTPExpiresAt: otpExpiresAt,
    },
  });

 
  const emailContent = `
  <h2>Password Reset Request</h2>
  <p>Hello ${user.fullName}</p>
  <p>We received a request to reset your password. Please use the following OTP to proceed:</p>

  <div style="
    background-color: #f5f5f5;
    padding: 20px;
    text-align: center;
    margin: 20px auto;
    max-width: 400px;
    width: 100%;
    border-radius: 8px;
  ">
    <h1 style="
      color: #333;
      font-size: 32px;
      letter-spacing: 5px;
      margin: 0;
    ">
      ${otp}
    </h1>
  </div>

  <p>This OTP will expire in 10 minutes.</p>
  <p>If you didn't request this password reset, please ignore this email.</p>
  <p>Best regards,<br>Your App Team</p>
`;
  await sendEmail(user.email, "Password Reset OTP", emailContent);

  return {
    message:
      "We have sent a 6-digit OTP to your email address. Please check your inbox and use the OTP to reset your password.",
  };
};

const otpGenerate = async (email: string) => {
    const isUserExistByEmail = await prisma.user.findUnique({
    where: { email: email },
  });

  if (isUserExistByEmail) {
    throw new ApiError(
      status.BAD_REQUEST,
      `User with this email: ${email} already exists!`
    );
  }

  // Generate 6-digit OTP
  const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Clear any existing unverified OTPs for this email
  await prisma.otpModel.deleteMany({
    where: {
      email: email.toLowerCase().trim(),
      isVerified: false
    }
  });

  const otp = generateOTP();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  // Save OTP in database
  await prisma.otpModel.create({
    data: {
      email: email.toLowerCase().trim(),
      code: otp,
      expiresAt: otpExpiresAt,
      isVerified: false,
    },
  });

  // Professional email template
  const emailContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300;">
                    Email Verification
                  </h1>
                  <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                    Secure your account with OTP verification
                  </p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Hello there,
                  </p>
                  
                  <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                    We received a request to verify your email address. Please use the following verification code to proceed:
                  </p>

                  <!-- OTP Box -->
                  <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border: 2px solid #667eea; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                    <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">
                      Verification Code
                    </p>
                    <h1 style="color: #667eea; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
                      ${otp}
                    </h1>
                  </div>

                  <!-- Important Info -->
                  <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 30px 0;">
                    <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.5;">
                      <strong>⚠️ Important:</strong> This verification code will expire in <strong>10 minutes</strong>. 
                      Please complete your verification before it expires.
                    </p>
                  </div>

                  <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                    If you didn't request this verification code, please ignore this email and ensure your account is secure.
                  </p>

                  <!-- Security Tips -->
                  <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0;">
                    <h3 style="color: #333333; font-size: 16px; margin: 0 0 10px 0;">
                      🔒 Security Tips:
                    </h3>
                    <ul style="color: #666666; font-size: 14px; margin: 0; padding-left: 20px;">
                      <li style="margin: 5px 0;">Never share your verification code with anyone</li>
                      <li style="margin: 5px 0;">We will never ask for your code via phone or email</li>
                      <li style="margin: 5px 0;">Always verify the sender's email address</li>
                    </ul>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                  <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">
                    Need help? Contact our support team
                  </p>
                  <p style="color: #6c757d; font-size: 14px; margin: 0;">
                    Best regards,<br>
                    <strong style="color: #667eea;">Your App Team</strong>
                  </p>
                  
                  <div style="margin-top: 20px;">
                    <p style="color: #adb5bd; font-size: 12px; margin: 0;">
                      This email was sent to ${email.toLowerCase().trim()}
                    </p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

 const  result= await sendEmail(email, "🔐 Email Verification Code - Action Required", emailContent);

  
   return result
};

const verifyOTP = async (otpCode: string,payload:User) => {
    const isUserExistByEmail = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (isUserExistByEmail) {
    throw new ApiError(
      status.BAD_REQUEST,
      `User with this email: ${payload.email} already exists!`
    );
  }


  if (!payload.email || !otpCode) {
    throw new ApiError(status.BAD_REQUEST, "Email and OTP are required!");
  }

  if (otpCode.length !== 6) {
    throw new ApiError(status.BAD_REQUEST, "OTP must be 6 digits!");
  }
  if (!payload) {
    throw new ApiError(status.BAD_REQUEST, "payload is required !");
  }

  const normalizedEmail = payload.email.toLowerCase().trim();


  const otpRecord = await prisma.otpModel.findFirst({
    where: {
      email: payload.email,
      isVerified: false
    },
    orderBy: {
      generatedAt: 'desc'
    }
  });
  console.log(otpRecord)

  if (!otpRecord) {
    throw new ApiError(status.NOT_FOUND, "OTP not found or already used. Please request a new OTP.");
  }


  if (new Date() > otpRecord?.expiresAt) {

    await prisma.otpModel.delete({ 
      where: { id: otpRecord.id } 
    });
    
    throw new ApiError(status.UNAUTHORIZED, "OTP has expired. Please request a new verification code.");
  }


  if (otpRecord.code !== otpCode.trim()) {
    throw new ApiError(status.UNAUTHORIZED, "Invalid OTP. Please check the code and try again.");
  }


 const result= await prisma.otpModel.update({
    where: { id: otpRecord.id },
    data: { 
      isVerified: true 
    }
  });

  const hashedPassword = await hashPassword(payload.password);

  const userData = {
    ...payload,
    password: hashedPassword,
    isVerified: true,
  };


 const user= await prisma.user.create({ data: userData });
  

  const jwtPayload = {
   fullName: payload.fullName,
    email: user.email,
    role: user.role,
    profilePic: user?.profilePic || "",
    isVerified: user.isVerified,
    isSubscribed:user.isSubscribed,
    id: user.id,
  };

  
await prisma.notification.create({
  data: {
    userId: user.id,
    type: "SYSTEM",
    message: `New user registered: ${user.fullName}`,
  },
});
  const accessToken = jwtHelpers.createToken(
    jwtPayload,
    config.jwt.access.secret as string,
    config.jwt.access.expiresIn as string
  );
const refreshToken = jwtHelpers.createToken(
    jwtPayload,
    config.jwt.refresh.secret as string,
    config.jwt.refresh.expiresIn as string
  );

  // Send success confirmation email
  const successEmailContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verified Successfully</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 30px; text-align: center;">
                  <div style="background-color: rgba(255,255,255,0.2); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 40px;">✅</span>
                  </div>
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300;">
                    Email Verified Successfully!
                  </h1>
                  <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                    Your email verification is now complete
                  </p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="color: #28a745; font-size: 24px; margin: 0 0 10px 0;">
                      🎉 Congratulations!
                    </h2>
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0;">
                      Your email address has been successfully verified.
                    </p>
                  </div>

                  <!-- Verification Details -->
                  <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
                    <p style="color: #495057; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">
                      Verified Email Address
                    </p>
                    <p style="color: #28a745; font-size: 18px; font-weight: bold; margin: 0; word-break: break-all;">
                      ${normalizedEmail}
                    </p>
                    <p style="color: #6c757d; font-size: 12px; margin: 15px 0 0 0;">
                      Verified on ${new Date().toLocaleString()}
                    </p>
                  </div>

                  <!-- Success Message -->
                  <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin: 30px 0;">
                    <p style="color: #155724; font-size: 16px; margin: 0; line-height: 1.5; text-align: center;">
                      <strong>✨ Great!</strong> You can now access all features of your account. 
                      Your email verification is complete and secure.
                    </p>
                  </div>

                  <div style="text-align: center; margin: 30px 0;">
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0;">
                      Thank you for verifying your email address. Your account is now fully activated and ready to use.
                    </p>
                  </div>

                  <!-- Next Steps -->
                  <div style="background-color: #f8f9fa; border-left: 4px solid #28a745; padding: 20px; margin: 30px 0;">
                    <h3 style="color: #333333; font-size: 16px; margin: 0 0 15px 0;">
                      🚀 What's Next?
                    </h3>
                    <ul style="color: #666666; font-size: 14px; margin: 0; padding-left: 20px;">
                      <li style="margin: 8px 0;">Complete your profile setup</li>
                      <li style="margin: 8px 0;">Explore all available features</li>
                      <li style="margin: 8px 0;">Secure your account with two-factor authentication</li>
                    </ul>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                  <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">
                    Need assistance? Our support team is here to help
                  </p>
                  <p style="color: #6c757d; font-size: 14px; margin: 0;">
                    Welcome to the team!<br>
                    <strong style="color: #28a745;">Your App Team</strong>
                  </p>
                  
                  <div style="margin-top: 20px;">
                    <p style="color: #adb5bd; font-size: 12px; margin: 0;">
                      This confirmation was sent to ${normalizedEmail}
                    </p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

 const results= sendEmail(normalizedEmail, "✅ Email Verified Successfully - Welcome!", successEmailContent)
    .catch(error => console.error('Failed to send success email:', error));

    return {accessToken}
  
};
const verifyResetPasswordOTP = async (email: string, otp: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  if (!user.isResetPassword) {
    throw new ApiError(status.BAD_REQUEST, "No password reset request found!");
  }

  if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp) {
    throw new ApiError(status.BAD_REQUEST, "Invalid OTP!");
  }

  if (
    !user.resetPasswordOTPExpiresAt ||
    new Date() > user.resetPasswordOTPExpiresAt
  ) {
    throw new ApiError(status.BAD_REQUEST, "OTP has expired!");
  }

  await prisma.user.update({
    where: { email },
    data: {
      canResetPassword: true,
      resetPasswordOTP: null,
      resetPasswordOTPExpiresAt: null,
    },
  });

  return {
    message: "OTP verified successfully. You can now reset your password.",
  };
};

const resetPassword = async (
  email: string,
  newPassword: string,
  confirmPassword: string
) => {
  if (newPassword !== confirmPassword) {
    throw new ApiError(status.BAD_REQUEST, "Passwords do not match!");
  }

  const user = await prisma.user.findUnique({
    where: { email: email },
  });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  if (!user.canResetPassword) {
    throw new ApiError(
      status.BAD_REQUEST,
      "User is not eligible for password reset!"
    );
  }


  

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { email: email },
    data: {
      password: hashedPassword,
      isResetPassword: false,
      canResetPassword: false,
    },
  });

  return {
    message: "Password reset successfully!",
  };
};

const resendVerificationLink = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  if (user.isVerified) {
    throw new ApiError(status.BAD_REQUEST, "User account already verified!");
  }

  const jwtPayload = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    profilePic: user.profilePic,
    role: user.role,
    isVerified: user.isVerified,
  };

  const accessToken = jwtHelpers.createToken(
    jwtPayload,
    config.jwt.access.secret as string,
    config.jwt.access.expiresIn as string
  );

  const confirmedLink = `${config.verify.email}?token=${accessToken}`;

  await sendEmail(user.email, undefined, confirmedLink);

  return {
    message:
      "New verification link has been sent to your email. Please check your inbox.",
  };
};

const resendResetPassLink = async (email: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }
  if (!user.canResetPassword) {
    throw new ApiError(status.UNAUTHORIZED, "Please verify OTP first!");
  } 
  const hashedPassword = await bcrypt.hash(newPassword, 12);


  await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
      isResetPassword: false,
      canResetPassword: false,
    },
  });

  const confirmationEmailContent = `
    <h2>Password Reset Successful</h2>
    <p>Hello ${user.fullName} </p>
    <p>Your password has been successfully reset for your account associated with ${email}.</p>
    <p><strong>Reset Time:</strong> ${new Date().toLocaleString()}</p>
    <p>If you did not make this change, please contact our support team immediately.</p>
    <p>Best regards,<br>Your App Team</p>
  `;

  await sendEmail(
    user.email,
    "Password Reset Confirmation",
    confirmationEmailContent
  );

  return {
    message:
      "Password has been reset successfully! A confirmation email has been sent.",
  };
};

const getMe = async (email: string) => {
  const result = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      fullName:true,
      email: true,
      profilePic: true,
      role: true,
      isVerified: true,
      isSubscribed: true,
      planExpiration: true,
      Profile:true,
      Subscription:{include:{plan:true}},
      createdAt: true,
      updatedAt: true,

    },
  });

  return result;
};

export const refreshToken = async (token: string) => {
  const decoded = jwtHelpers.verifyToken(
    token,
    config.jwt.refresh.secret as string
  ) as RefreshPayload;

  const { email, iat } = decoded;
  console.log(email);

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      profilePic: true,
      isVerified: true,
      passwordChangedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found");
  }

  if (
    user.passwordChangedAt &&

    Math.floor(user.passwordChangedAt.getTime() / 1000) > iat
  ) {
    throw new ApiError(
      status.UNAUTHORIZED,
      "Password was changed after this token was issued"
    );
  }

  const jwtPayload = {
    id: user.id,
   fullName : user.fullName,
    email: user.email,
    role: user.role,
    profilePic: user?.profilePic,
    isVerified: user.isVerified,
  };

  const accessToken = jwtHelpers.createToken(
    jwtPayload,
    config.jwt.refresh.secret as string,
    config.jwt.refresh.expiresIn as string
  );

  return { accessToken };
};

export const AuthService = {
  getMe,
  loginUser,
  verifyEmail,
  refreshToken,
  resetPassword,
  changePassword,
  forgotPassword,
  verifyResetPassLink,
  resendResetPassLink,
  resendVerificationLink,
  verifyResetPasswordOTP,
otpGenerate,
verifyOTP,
googleLogin,

};
