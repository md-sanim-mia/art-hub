import {
  handlePaymentIntentFailed,
  handlePaymentIntentSucceeded,
} from "../../utils/webhook";
import Stripe from "stripe";
import status from "http-status";
import prisma from "../../utils/prisma";
import { stripe } from "../../utils/stripe";
import AppError from "../../errors/AppError";
import { Subscription } from "@prisma/client";
import QueryBuilder from "../../builder/QueryBuilder";

const createSubscription = async (userId: string, planId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
  });
  
  console.log("createSubscription - plan:", plan);
  if (!plan) {
    throw new AppError(status.NOT_FOUND, "Plan not found");
  }


  const isLifetimePlan = plan?.PlanType === "LIFETIME";
  const isFamilyPlan = plan.PlanType === "FAMILY";

  const maxMembers = isFamilyPlan ? (plan?.maxMembers || 5) : 1;

  const startDate = new Date();
  let endDate: Date | null = null;

  if (isLifetimePlan) {
    endDate = null;
    console.log("🔥 Creating LIFETIME subscription");
  } else {
    if (plan.interval === "month") {
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + (plan.intervalCount || 1));

      if (endDate.getDate() !== startDate.getDate()) {
        endDate.setDate(0); 
      }
    } else if (plan.interval === "year") {
      endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + (plan.intervalCount || 1));
    }
    console.log("🔄 Creating SUBSCRIPTION with end date:", endDate);
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(plan.amount * 100),
    currency: "usd",
    metadata: {
      userId: user.id,
      planId,
      planType: plan.PlanType, 
      maxMembers: maxMembers.toString(),
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return await prisma.$transaction(async (tx) => {
    const existingSubscription = await tx.subscription.findUnique({
      where: { userId: user.id },
    });

    let subscription;
    if (existingSubscription?.paymentStatus === "PENDING") {
      subscription = await tx.subscription.update({
        where: { userId: user.id },
        data: {
          planId,
          stripePaymentId: paymentIntent.id,
          startDate,
          amount: plan.amount,
          endDate: isLifetimePlan ? null : (existingSubscription.endDate || endDate),
          paymentStatus: "PENDING",
        },
      });
    } else {
      subscription = await tx.subscription.create({
        data: {
          userId: user.id,
          planId,
          startDate,
          amount: plan.amount,
          stripePaymentId: paymentIntent.id,
          paymentStatus: "PENDING",
          endDate,
        },
      });
    }


    return {
      subscription,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      planType: plan.PlanType,
      maxMembers: isFamilyPlan ? maxMembers : 1,
    };
  }, {
    maxWait: 5000,
    timeout: 10000,
  });
};
const getAllSubscription = async (query: Record<string, any>) => {
  const queryBuilder = new QueryBuilder(prisma.subscription, query);
  const subscription = await queryBuilder
    .search([""])
    .paginate()
    .fields()
    .include({
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profilePic: true,
          role: true,
          isSubscribed: true,
          planExpiration: true,
        },
      },
      plan: true,
      members: {  
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profilePic: true,
            },
          },
        },
      },
    })
    .execute();

  const meta = await queryBuilder.countTotal();
  return { meta, data: subscription };
};

const getSingleSubscription = async (subscriptionId: string) => {
  const result = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      user: {
        select: {
          id: true,
         fullName:true,
          profilePic: true,
          email: true,
          role: true,
          isSubscribed: true,
          planExpiration: true,
        },
      },
      plan: true,
    },
  });

  if (!result) {
    throw new AppError(status.NOT_FOUND, "Subscription not found!");
  }

  return result;
};

const getMySubscription = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

 
  let result = await prisma.subscription.findFirst({
    where: { userId: userId }, 
    include: {
      user: {
        select: {
          id: true,
         fullName:true,
          profilePic: true,
          email: true,
          role: true,
          isSubscribed: true,
          planExpiration: true,
        },
      },
      plan: true,
   
    },
  });
  if (!result) {
    throw new AppError(status.NOT_FOUND, "Subscription not found!");
  }

  return result;
};

const updateSubscription = async (
  subscriptionId: string,
  data: Subscription
) => {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    throw new AppError(status.NOT_FOUND, "Subscription not found");
  }

  const result = await prisma.subscription.update({
    where: { id: subscriptionId },
    data,
  });
  return result;
};

const deleteSubscription = async (subscriptionId: string) => {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    throw new AppError(status.NOT_FOUND, "Subscription not found");
  }

  return null;
};

const HandleStripeWebhook = async (event: Stripe.Event) => {
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;

      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.planType === "lifetime") {
          await handleLifetimePaymentSuccess(session);
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return { received: true };
  } catch (error) {
    console.error("Error handling Stripe webhook:", error);
    throw new AppError(status.INTERNAL_SERVER_ERROR, "Webhook handling failed");
  }
};

const handleLifetimePaymentSuccess = async (session: Stripe.Checkout.Session) => {
  const { userId, planId } = session.metadata!;
  
  await prisma.subscription.updateMany({
    where: {
      userId: userId,
      planId: planId,
      paymentStatus: "PENDING"
    },
    data: {
      paymentStatus: "COMPLETED",
      stripePaymentId: session.payment_intent as string,
    }
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      isSubscribed: true,
      planExpiration: null,
    }
  });

};


export const SubscriptionServices = {
  getMySubscription,
  createSubscription,
  getAllSubscription,
  updateSubscription,
  deleteSubscription,
  HandleStripeWebhook,
  getSingleSubscription,
};
