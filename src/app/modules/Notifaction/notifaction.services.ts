import prisma from "../../utils/prisma";

const getAllnotification=async ()=>{
    const result = await prisma.notification.findMany({
        orderBy: { createdAt: "desc" },
      });
      return result;
}       

const getSingleNotification=async (id:string)=>{
    const result = await prisma.notification.findUnique({
        where: { id },
      });
      return result;
}   

const chengeNotificationReadStatus=async (id:string)=>{
    const result = await prisma.notification.update({
        where: { id },    
        data:{isRead:true}
      });
      return result;
}


export const notifactionService = {
getAllnotification,
getSingleNotification,
chengeNotificationReadStatus
};