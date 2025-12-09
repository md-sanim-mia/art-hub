import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { notifactionService } from "./notifaction.services";

const getAllnotification = catchAsync(async (req, res) => {
  const { userId } = req.params;    
    const result = await notifactionService.getAllnotification();           
    sendResponse(res, {
      statusCode: status.OK,
      message: "Notifications retrieved successfully!",
      data: result,
    });
}
);

const getSingleNotification = catchAsync(async (req, res) => {
  const { id } = req.params;    
    const result = await notifactionService.getSingleNotification(id);  
    sendResponse(res, {
      statusCode: status.OK,
      message: "Notification retrieved successfully!",  
        data: result,
    });
}               
);

const chengeNotificationReadStatus = catchAsync(async (req, res) => {
  const { id } = req.params;    
    const result = await notifactionService.chengeNotificationReadStatus(id);  
    sendResponse(res, { 
      statusCode: status.OK,  
      message: "Notification read status changed successfully!",  
        data: result,
    });
}
);

export const NotifactionController = {
  getAllnotification,
  getSingleNotification,
  chengeNotificationReadStatus
};
    