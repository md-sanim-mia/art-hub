import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AuthService } from "./auth.service";
import config from "../../config";

const verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.query;

  await AuthService.verifyEmail(token as string);

  res.redirect(`${config.url.frontend}/success`);
});

const verifyResetPassLink = catchAsync(async (req, res) => {
  const { token } = req.query;

  await AuthService.verifyResetPassLink(token as string);

  res.redirect(`${config.url.frontend}/reset-password`);
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const result = await AuthService.loginUser(email, password);

  const { accessToken, refreshToken } = result;

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false, // config.NODE_ENV === "production"
    sameSite: "lax", // config.NODE_ENV === "production" ? true : "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });

  sendResponse(res, {
    statusCode: status.OK,
    message: "User logged in successfully!",
    data: { accessToken },
  });
});

const changePassword = catchAsync(async (req, res) => {
  const email = req.user?.email as string;

  const { currentPassword, newPassword, confirmPassword } = req.body;

  await AuthService.changePassword(
    email,
    currentPassword,
    newPassword,
    confirmPassword
  );

  sendResponse(res, {
    statusCode: status.OK,
    message: "User password changed successfully!",
  });
});

const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await AuthService.forgotPassword(email);

  sendResponse(res, {
    statusCode: status.OK,
    message: result.message,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;

  const result = await AuthService.resetPassword(
    email,
    newPassword,
    confirmPassword
  );

  sendResponse(res, {
    statusCode: status.OK,
    message: result.message,
  });
});

const resendVerificationLink = catchAsync(async (req, res) => {
  const { email } = req.body;

  const result = await AuthService.resendVerificationLink(email);

  sendResponse(res, {
    statusCode: status.OK,
    message: result.message,
  });
});

const resendResetPassLink = catchAsync(async (req, res) => {
  const { email, newPassword } = req.body;

  const result = await AuthService.resendResetPassLink(email, newPassword);

  sendResponse(res, {
    statusCode: status.OK,
    message: result.message,
  });
});

const getMe = catchAsync(async (req, res) => {
  const email = req.user?.email as string;

  const result = await AuthService.getMe(email);

  sendResponse(res, {
    statusCode: status.OK,
    message: "User fetched successfully!",
    data: result,
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;

  const result = await AuthService.refreshToken(refreshToken);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Access token is retrieved successfully!",
    data: result,
  });
});


const verifyResetPasswordOTP = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  await AuthService.verifyResetPasswordOTP(email, otp);
  sendResponse(res, {
    statusCode: status.OK,
    message: "OTP verified successfully! You can now reset your password.",
  });
});

const otpGenerate=catchAsync(async(req,res)=>{

    const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const result=await AuthService.otpGenerate(email)

  sendResponse(res,{
  statusCode:status.OK,
  message: "We have sent a 6-digit verification code to your email address. Please check your inbox and use the code to complete verification.",
  })
})
const otpVerify=catchAsync(async(req,res)=>{

    const {otpCode,data} = req.body;

console.log(req.body)
  if (!data.email) {
    return res.status(400).json({ message: "Email is required" });
  }
  if (!data.password) {
    return res.status(400).json({ message: "Password is required" });
  }

  const result=await AuthService.verifyOTP(otpCode,data)

  sendResponse(res,{
  statusCode:status.OK,
  message: "Email verification completed successfully! Your account is now verified.",
  data:result
  })
})

// Google Login Controller
const googleLogin = catchAsync(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: "Google ID token is required" });
  }

  const result = await AuthService.googleLogin(idToken);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Google login successful!",
    data: result,
  });
});


const createOrganizationAccounts = catchAsync(async (req, res) => {

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const result = await AuthService.createOrganizationAccounts(email)

  sendResponse(res, {
    statusCode: status.OK,
    message: "We have sent a 6-digit verification code to your email address. Please check your inbox and use the code to complete verification.",
  })
})
const verifyOrganizationOTP = catchAsync(async (req, res) => {

  const { otpCode, data } = req.body;

  console.log(req.body)
  if (!data.email) {
    return res.status(400).json({ message: "Email is required" });
  }
  if (!data.password) {
    return res.status(400).json({ message: "Password is required" });
  }

  const result = await AuthService.verifyOrganizationOTP(otpCode, data)

  sendResponse(res, {
    statusCode: status.OK,
    message: "Email verification completed successfully! Your account is now verified.",
    data: result
  })
})

export const AuthController = {
  login,
  getMe,
  verifyEmail,
  refreshToken,
  resetPassword,
  forgotPassword,
  changePassword,
  verifyResetPassLink,
  resendResetPassLink,
  resendVerificationLink,
  verifyResetPasswordOTP,
 otpGenerate,
 otpVerify,
 googleLogin,
 createOrganizationAccounts,
 verifyOrganizationOTP


};
