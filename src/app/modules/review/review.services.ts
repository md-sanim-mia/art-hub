import status from "http-status";
import AppError from "../../errors/AppError";
import prisma from "../../utils/prisma";

const createReview = async (payload: { rating: number; comment: string; userId: string }) => {
  if (!payload) throw new AppError(status.BAD_REQUEST, "Payload is required!");
  
  const review = await prisma.review.create({
    data: payload,
  });
  return review;
};

const getReviewById = async (id: string) => {
  const review = await prisma.review.findUnique({
    where: { id },
    include:{
        user:{
            select:{
                fullName:true,
                email:true,
                lastActiveAt:true,
                isSubscribed:true,
                profilePic :true,
            }
        }
    }
  });
  if (!review) throw new AppError(status.NOT_FOUND, "Review not found");
  return review;
};

const getAllReviews = async () => {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
     include:{
        user:{
            select:{
               fullName:true,
                email:true,
                lastActiveAt:true,
                isSubscribed:true,
                profilePic :true,
            }
        }
    }
  });
  return reviews;
};

const updateReview = async (id: string, payload: { rating?: number; comment?: string }) => {
  const review = await prisma.review.update({
    where: { id },
    data: payload,
  });
  return review;
};

const deleteReview = async (id: string) => {
  await prisma.review.delete({
    where: { id },
  });
  return true;
};

export const ReviewServices = {
  createReview,
  getReviewById,
  getAllReviews,
  updateReview,
  deleteReview,
};