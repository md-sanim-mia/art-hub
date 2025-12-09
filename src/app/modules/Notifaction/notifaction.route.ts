import express from "express";
import { NotifactionController } from "./notifaction.contller";

const router = express.Router();

router.get("/", NotifactionController.getAllnotification);
router.patch("/read-status/:id", NotifactionController.chengeNotificationReadStatus);
router.get("/:id", NotifactionController.getSingleNotification);
export const notifactionRoute = router;