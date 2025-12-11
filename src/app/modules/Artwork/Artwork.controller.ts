import { Request, Response } from "express";

import httpStatus from "http-status";
import { artworkService } from "./Artwork.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

const createArtwork = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const payload = { ...req.body, userId };
  
  const result = await artworkService.createArtwork(payload);
  
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    
    message: "Artwork created successfully",
    data: result,
  });
});

const getAllArtworks = catchAsync(async (req: Request, res: Response) => {
  const results = await artworkService.getAllArtworks(req.query);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    
    message: "Artworks retrieved successfully",
    data: results,
  });
});

const getArtworksByUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const results = await artworkService.getArtworksByUser(userId, req.query);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    
    message: "User artworks retrieved successfully",
    data: results,
  });
});

const getSingleArtwork = catchAsync(async (req: Request, res: Response) => {
  const result = await artworkService.getSingleArtwork(req.params.id);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    
    message: "Artwork retrieved successfully",
    data: result,
  });
});

const updateArtwork = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string
  const result = await artworkService.updateArtwork(
    req.params.id,
    req.body,
    userId
  );
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    
    message: "Artwork updated successfully",
    data: result,
  });
});

const deleteArtwork = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string
  const result = await artworkService.deleteArtwork(req.params.id, userId);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    
    message: "Artwork deleted successfully",
    data: result,
  });
});

const getFeaturedArtworks = catchAsync(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
  const result = await artworkService.getFeaturedArtworks(limit);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    
    message: "Featured artworks retrieved successfully",
    data: result,
  });
});

const getArtworkStatistics = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const result = await artworkService.getArtworkStatistics(userId);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    
    message: "Artwork statistics retrieved successfully",
    data: result,
  });
});

export const artworkController = {
  createArtwork,
  getAllArtworks,
  getArtworksByUser,
  getSingleArtwork,
  updateArtwork,
  deleteArtwork,
  getFeaturedArtworks,
  getArtworkStatistics,
};