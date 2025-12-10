import { NextFunction, Request, Response, Router } from "express";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { blogController } from "./blog.contllors";
import { imageUpload } from "../../config/multer-config";


const router = Router();

// Create Blog
router.post(
  "/create-blog",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),

   imageUpload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = JSON.parse(req.body.data);

      console.log(req.body)
      next();
    } catch (err) {
      next(err);
    }
  },
  blogController.createBlog
);

// Get All Blogs
router.get(
  "/",

  blogController.getAllBlogs
);

// Get Single Blog
router.get(
  "/:id",
  blogController.getSingleBlog
);

// Update Blog
router.patch(
  "/update-blog/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  // validateRequest(blogValidationSchema),
  imageUpload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = JSON.parse(req.body.data);

      console.log(req.body)
      next();
    } catch (err) {
      next(err); 
    }
  },
  blogController.updateBlog
);

// Delete Blog
router.delete(
  "/delete-blog/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  blogController.deleteBlog
);

export const blogRouter = router;
