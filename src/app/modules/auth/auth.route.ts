import { UserRole } from "@prisma/client";
import { Router } from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";
import passport from "../../config/passport"


const router = Router();


router.post('/register-user',AuthController.otpGenerate
)

router.post('/verify-otp',AuthController.otpVerify
)

router.post('/register-organization',AuthController.createOrganizationAccounts
)

router.post('/verify-organization-otp',AuthController.verifyOrganizationOTP
)
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  (req, res) => {
    const { accessToken } = req.user as any;
    res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${accessToken}`);
  }
);

router.get("/verify-email", AuthController.verifyEmail);

router.get("/verify-reset-password", AuthController.verifyResetPassLink);

router.post(
  "/login",
  validateRequest(AuthValidation.loginValidationSchema),
  AuthController.login
);
router.put(
  "/change-password",
  auth(UserRole.USER, UserRole.ADMIN,UserRole.SUPER_ADMIN),
  validateRequest(AuthValidation.changePasswordValidationSchema),
  AuthController.changePassword
);

router.post(
  "/forgot-password",
  validateRequest(AuthValidation.forgotPasswordValidationSchema),
  AuthController.forgotPassword
);

router.post("/reset-password", AuthController.resetPassword);

router.post(
  "/verify-reset-password-otp",
  AuthController.verifyResetPasswordOTP
);
router.post(
  "/resend-verification-link",
  validateRequest(AuthValidation.resendConfirmationLinkValidationSchema),
  AuthController.resendVerificationLink
);

router.post(
  "/resend-reset-pass-link",
  validateRequest(AuthValidation.resendConfirmationLinkValidationSchema),
  AuthController.resendResetPassLink
);

router.get("/me", auth(), AuthController.getMe);

router.post("/refresh-token", AuthController.refreshToken);

export const AuthRoutes = router;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         