import status from "http-status";
import AppError from "../../errors/AppError";
import catchAsync from "../../utils/catchAsync";
import { ReviewServices } from "./review.services";

// Create Review
const createReview = catchAsync(async (req, res) => {
  const { rating, comment } = req.body;

  const userId=req.user?.id
  if (!rating || !comment || !userId) {
    throw new AppError(status.BAD_REQUEST, "rating, comment, and userId are required");
  }
  const result = await ReviewServices.createReview({ rating, comment, userId });
  
  res.status(status.CREATED).json({
    success: true,
    message: "Review created successfully",
    data: result,
  });
});

// Get All Reviews
const getAllReviews = catchAsync(async (req, res) => {
  const reviews = await ReviewServices.getAllReviews();
  res.status(status.OK).json({ success: true, data: reviews });
});

// Get Single Review
const getReviewById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const review = await ReviewServices.getReviewById(id);
  res.status(status.OK).json({ success: true, data: review });
});

// Update Review
const updateReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  const updated = await ReviewServices.updateReview(id, payload);
  res.status(status.OK).json({ success: true, message: "Review updated", data: updated });
});

// Delete Review
const deleteReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  await ReviewServices.deleteReview(id);
  res.status(status.OK).json({ success: true, message: "Review deleted" });
});

export const ReviewController = {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview,
};
