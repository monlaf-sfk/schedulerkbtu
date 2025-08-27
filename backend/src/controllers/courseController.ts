import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
 
function normalizeCourseCode(code: string): string {
    return code.replace(/а/g, 'a').toUpperCase();
}
 
import { scrapeAndSaveCourse } from '../services/scraperService';

const prisma = new PrismaClient();

 
export const getAllCourses = async (req: Request, res: Response) => {
    try {
        const courses = await prisma.course.findMany({
            select: { code: true, name: true, credits: true },
        });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch courses from DB' });
    }
};

export const deleteCourse = async (req: Request, res: Response) => {
    const { code } = req.body;
    if (!code) {
        return res.status(400).json({ error: 'Course code is required' });
    }
    const normalizedCode = normalizeCourseCode(code);
    try {
        const course = await prisma.course.findUnique({ where: { code: normalizedCode } });
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        await prisma.section.deleteMany({ where: { courseId: course.id } });
        const deletedCourse = await prisma.course.delete({
            where: { code: normalizedCode },
        });
        res.json(deletedCourse);
    } catch (error) {
        console.error('[API] Ошибка при удалении курса:', error);
        res.status(500).json({ error: 'Failed to delete course' });
    }
};

 
export const getCourseByCode = async (req: Request, res: Response) => {
    const { code } = req.params;
    const normalizedCode = normalizeCourseCode(code);
    try {
        const course = await prisma.course.findUnique({
            where: { code: normalizedCode },
            include: { sections: true },
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found in DB' });
        }
        res.json(course);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch course details from DB' });
    }
};

 г
export const triggerScraping = async (req: Request, res: Response) => {
    const { year, semester, code } = req.body;

    if (!year || !semester || !code) {
        return res.status(400).json({ error: 'Year, semester, and code are required' });
    }

    try {
        const normalizedCode = normalizeCourseCode(code);
        console.log(`[API] Запрос на скрапинг курса ${normalizedCode}...`);
        
        const savedCourse = await scrapeAndSaveCourse(year, semester, normalizedCode);
        console.log(`[API] Курс ${normalizedCode} успешно спаршен и сохранен.`);
        res.status(201).json(savedCourse);
    } catch (error) {
        console.error('[API] Ошибка в процессе скрапинга:', error);
        res.status(500).json({ error: 'Failed to scrape and save course' });
    }
};