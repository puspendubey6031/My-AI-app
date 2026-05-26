import { Router, type IRouter } from "express";
import healthRouter from "./health";
import videosRouter from "./videos";
import plansRouter from "./plans";
import aiStoryRouter from "./aiStory";

const router: IRouter = Router();

router.use(healthRouter);
router.use(videosRouter);
router.use(plansRouter);
router.use(aiStoryRouter);

export default router;
