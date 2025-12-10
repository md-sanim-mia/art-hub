
import cors from "cors";
import path from "path";
import passport from "./app/config/passport"
import router from "./app/routes";
import cookieParser from "cookie-parser";
import notFound from "./app/middlewares/notFound";
import express, { Application, Request, Response } from "express";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";



const app: Application = express();

// parsers
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(cors({ origin: ["http://localhost:3000","http://localhost:3001"], credentials: true }));

// app routes
app.use(passport.initialize());
app.use("/api/v1", router);

app.get("/", async (req: Request, res: Response) => {
	// 
	res.send("API is running...");
});


app.use(globalErrorHandler);
app.use(notFound);


export default app;
