import { Router } from 'express';
import { getAllCourses, getCourseByCode, triggerScraping, deleteCourse } from '../controllers/courseController';

const router = Router();

router.get('/courses', getAllCourses);

router.get('/courses/:code', getCourseByCode);

router.post('/scrape', triggerScraping);

router.post('/delete', deleteCourse);

export default router;