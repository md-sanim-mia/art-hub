import { Request, Response } from "express";
import status from "http-status";
import { blogService } from "./blog.services";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { JwtPayload } from "jsonwebtoken";

// Create Blog
export const createBlog = catchAsync(async (req: Request, res: Response) => {

     const {id}=req.user as JwtPayload
    
          const file = req.file;
     
      if (!file) {
        throw new Error("Image file is required");
      }
      const blogData = { ...req.body, image: file.path };

  const result = await blogService.createBlog(blogData);
  sendResponse(res, {
    statusCode: status.CREATED,
    message: "Blog created successfully!",
    data: result,
  });
});

// Get All Blogs
export const getAllBlogs = catchAsync(async (_req: Request, res: Response) => {
  const result = await blogService.getAllBlogs();
  sendResponse(res, {
    statusCode: status.OK,
    message: "Blogs retrieved successfully!",
    data: result,
  });
});

// Get Single Blog (and increase views)
export const getSingleBlog = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await blogService.getSingleBlog(id);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Blog retrieved successfully!",
    data: result,
  });
});

// Update Blog
export const updateBlog = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await blogService.updateBlog(id, req.body);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Blog updated successfully!",
    data: result,
  });
});

// Delete Blog
export const deleteBlog = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await blogService.deleteBlog(id);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Blog deleted successfully!",
    data: result,
  });
});


export const blogController = {
  createBlog,
  getAllBlogs,
  getSingleBlog,
  updateBlog,
  deleteBlog,
};