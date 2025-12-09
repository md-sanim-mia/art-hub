import status from "http-status";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { upload } from "../../utils/upload";
import ApiError from "../../errors/AppError";
import { UserValidation } from "./user.validation";
import { UserController } from "./user.controller";
import validateRequest from "../../middlewares/validateRequest";
import { NextFunction, Request, Response, Router } from "express";
import { imageUpload } from "../../config/multer-config";

const router = Router();

router.get(
  "/",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  UserController.getAllUser
);

router.get(
  "/:userId",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN,UserRole.USER),
  UserController.getSingleUserById
);

router.post(
  "/register",
  validateRequest(UserValidation.createUserValidationSchema),
  UserController.createUser
);

router.patch(
  "/update",
  auth(),
  upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body?.data) {
        req.body = JSON.parse(req.body.data);
      }
      next();
    } catch {
      next(new ApiError(status.BAD_REQUEST, "Invalid JSON in 'data' field"));
    }
  },
  auth(),
  validateRequest(UserValidation.updateUserValidationSchema),
  UserController.updateUser
);

router.patch(
  "/update-profile",
  auth(),
  imageUpload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body.data) {
        req.body = JSON.parse(req.body.data);
      }
      next();
    } catch {
      next(new ApiError(status.BAD_REQUEST, "Invalid JSON in 'data' field"));
    }
  },
  auth(),
  // validateRequest(UserValidation.updateUserProfileValidationSchema),
  UserController.updateUserProfile
);

router.delete(
  "/:userId",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  UserController.deleteUser
);

router.patch(
  "/chenge/role/:id",
  auth(UserRole.SUPER_ADMIN),
  UserController.chengeUserRoleIntoDB
);

router.post(
  "/invite-admin",
  auth(UserRole.SUPER_ADMIN),

  UserController.inviteUserToAdmin
);
router.get(
  "/get-all/admin",
  auth(UserRole.SUPER_ADMIN,UserRole.ADMIN
  ),

  UserController.getAllAdminFromDB
);

export const UserRoutes = router;
