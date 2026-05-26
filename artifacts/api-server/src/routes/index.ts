import { Router, type IRouter } from "express";
import healthRouter from "./health";
import videosRouter from "./videos";
import plansRouter from "./plans";
import aiStoryRouter from "./aiStory";
import authRouter from "./auth";
import usersRouter from "./users";
import paymentsRouter from "./payments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(paymentsRouter);
router.use(videosRouter);
router.use(plansRouter);
router.use(aiStoryRouter);

export default router;
