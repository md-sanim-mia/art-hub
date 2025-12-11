import { Router } from "express";
import { artworkController } from "./Artwork.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = Router();

router.post(
  "/create",
  auth("USER", "ADMIN", "SUPER_ADMIN",UserRole.ORGANIZATION),
  artworkController.createArtwork
);

router.get("/", artworkController.getAllArtworks);

router.get("/featured", artworkController.getFeaturedArtworks);

router.get("/statistics", 
  auth("USER", "ADMIN", "SUPER_ADMIN",UserRole.ORGANIZATION),
  artworkController.getArtworkStatistics
);

router.get("/user/:userId", artworkController.getArtworksByUser);

router.get("/:id", artworkController.getSingleArtwork);

router.put(
  "/:id",
  auth("USER", "ADMIN", "SUPER_ADMIN",),
  artworkController.updateArtwork
);

router.delete(
  "/:id",
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  artworkController.deleteArtwork
);

export const artworkRoutes = router;