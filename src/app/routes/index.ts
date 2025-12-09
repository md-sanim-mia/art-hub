import { Router } from "express";
import { PlanRoutes } from "../modules/plan/plan.route";
import { AuthRoutes } from "../modules/auth/auth.route";
import { UserRoutes } from "../modules/user/user.routes";
import { SubscriptionRoutes } from "../modules/subscription/subscription.route";
import { blogRouter } from "../modules/blogs/blog.route";
import { contactRoute } from "../modules/contact/contact.route";


const router = Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/users",
    route: UserRoutes,
  },
  {
    path: "/plans",
    route: PlanRoutes,
  },
  {
    path: "/subscriptions",
    route: SubscriptionRoutes,
  },

  {
    path: "/blogs",
    route: blogRouter,
  },
  {
    path: "/contacts",
    route: contactRoute,
  },
  

];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
