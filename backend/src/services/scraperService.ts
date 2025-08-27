function normalizeCourseCode(code: string): string {
    return code.replace(/а/g, 'a').toUpperCase();
}
import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

interface ScrapedCourseData {
  code: string;
  name_en: string;
  department: string;
  credits: string;
  formula: string;
  year: string;
  period: string;
  sections: any[];
}
  
async function parseScheduleView(page: any): Promise<any[]> {
    const sections = [];
    console.log("  - Ищем сетку расписания...");

    try {
        await page.waitForSelector('.schedule-item', { timeout: 5000 });
        console.log("  - Сетка найдена, парсим...");

        const scheduleItems = await page.locator('.schedule-item').all();

        for (const item of scheduleItems) {
            const fullText = await item.innerText();
            const wrapper = item.locator('xpath=..');
            const style = await wrapper.getAttribute("style");

            const topMatch = style.match(/top:\s*(\d+)/);
            if (!topMatch) continue;
            const topPixels = parseInt(topMatch[1], 10);
            const hour = 8 + Math.floor(topPixels / 40);
            const timeStart = `${String(hour).padStart(2, '0')}:00`;

            const dayColumn = item.locator('xpath=ancestor::div[contains(@class, "v-slot v-slot-v-border-left-1-bfbfbf")]');
            const dayOfWeek = await dayColumn.locator('.v-label.bold').innerText();

            const cleanText = fullText.trim();
            let teacher = "N/A", lessonType = "N/A", room = "N/A", duration = 1;

            const typeMatch = cleanText.match(/\s(Лаб|Л|П)\s/);
            if (typeMatch) {
                if (typeMatch[1] === 'Л') {
                    lessonType = "Лекция";
                    duration = 1;
                } else if (typeMatch[1] === 'П') {
                    lessonType = "Практика";
                    if (cleanText.toLowerCase().includes('офп') || 
                        cleanText.toLowerCase().includes('физическая культура') ||
                        cleanText.toLowerCase().includes('физкультура') ||
                        cleanText.toLowerCase().includes('тренажерный зал') ||
                        cleanText.toLowerCase().includes('игровой зал') ||
                        cleanText.toLowerCase().includes('зал борьбы') ||
                        cleanText.toLowerCase().includes('зал бокса') ||
                        cleanText.toLowerCase().includes('футбол') ||
                        cleanText.toLowerCase().includes('волейбол') ||
                        cleanText.toLowerCase().includes('баскетбол') ||
                        cleanText.toLowerCase().includes('регби') ||
                        cleanText.toLowerCase().includes('шахматы')) {
                        duration = 2;  
                    } else {
                        duration = 1; 
                    }
                } else if (typeMatch[1] === 'Лаб') {
                    lessonType = "Лабораторная";
                    duration = 2;
                }
            }

            // 2. Преподаватель
            const teacherMatch = cleanText.match(/^(.*?)\s(Лаб|Л|П)\s/);
            if (teacherMatch) {
                teacher = teacherMatch[1].trim();
            }

            // 3. Место проведения (room), вид активности, группа
            // Например: 'П ДМиС ОФП (футбол) (юн) (21/21)'
            const roomActivityGroupMatch = cleanText.match(/(Лаб|Л|П)\s+([^()]+)(?:\s*\(([^)]*)\))?(?:\s*\(([^)]*)\))?/);
            if (roomActivityGroupMatch) {
                const place = roomActivityGroupMatch[2] ? roomActivityGroupMatch[2].trim() : "N/A";
                const activity = roomActivityGroupMatch[3] ? roomActivityGroupMatch[3].trim() : "";
                const group = roomActivityGroupMatch[4] ? roomActivityGroupMatch[4].trim() : "";
                room = [place, activity, group].filter(Boolean).join(' ').trim();
            }

            sections.push({
                day: dayOfWeek.trim(),
                time: timeStart,
                teacher: teacher,
                type: lessonType,
                room: room,
                duration: duration,
                raw_text: cleanText
            });
        }
    } catch (error) {
        console.log(`  - Расписание для этого курса не найдено.`);
    }
    return sections;
}


// Основная функция, которую будет вызывать наш контроллер
export const scrapeAndSaveCourse = async (year: string, semester: string, courseCode: string) => {
    const LOGIN = process.env.LOGIN;
    const PASSWORD = process.env.PASSWORD;
    const BASE_URL = "https://wsp.kbtu.kz/";
    const SCHEDULE_URL = "https://wsp.kbtu.kz/SubjectSchedule";
    const LANDING_PAGE_AFTER_LOGIN = "**/News**";

    const browser = await chromium.launch({ headless: true }); // headless: true для работы на сервере
    const page = await browser.newPage();

    try {
        console.log("1. Авторизация...");
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        const loginIcon = page.locator('div[role="button"]:has(img[src*="login_24.png"])');
        await loginIcon.click({ force: true });
        await page.getByLabel("Пользователь").fill(LOGIN);
        await page.getByLabel("Пароль").fill(PASSWORD);
        const loginButton = page.getByRole("button", { name: "Вход" });
        await loginButton.hover();
        await loginButton.click();
        await page.waitForURL(LANDING_PAGE_AFTER_LOGIN, { timeout: 10000 });
        console.log("   Успешно!");

        console.log(`2. Ищем курс ${courseCode} за ${year}, ${semester} семестр...`);
        await page.goto(SCHEDULE_URL);
        await page.waitForSelector('div.v-table-body', { timeout: 15000 });
        
        const comboboxes = page.locator('div[role="combobox"]');
        await comboboxes.first().locator('.v-filterselect-button').click();
        await page.locator('span', { hasText: year }).click();
        await page.waitForTimeout(500);
        await comboboxes.nth(1).locator('.v-filterselect-button').click();
        await page.locator('span', { hasText: semester }).click();
        await page.waitForTimeout(500);

        await page.getByLabel("Шифр").fill(courseCode);
        await Promise.all([
            page.waitForResponse("**/UIDL/**"),
            page.getByRole("button", { name: "Фильтровать" }).click()
        ]);
        await page.waitForTimeout(1000); // Дать время на обновление таблицы
        console.log("   Фильтр применен.");
        
        // Найти строку с точным совпадением шифра курса
        const rows = await page.locator('tr.v-table-row, tr.v-table-row-odd').all();
        let rowToClick = null;
        for (const row of rows) {
            const codeCell = await row.locator('td').first().innerText();
            if (codeCell.trim().toUpperCase() === courseCode.trim().toUpperCase()) {
                rowToClick = row;
                break;
            }
        }
        if (!rowToClick) {
            throw new Error(`Курс с шифром ${courseCode} не найден в таблице после фильтрации.`);
        }
        await rowToClick.waitFor({ state: 'visible', timeout: 5000 });
        
        const cells = await rowToClick.locator('td').all();
        // console.log(cells);
        const courseInfo: ScrapedCourseData = {
            code: normalizeCourseCode(await cells[0].innerText()),
            name_en: await cells[3].innerText(),
            department: await cells[4].innerText(),
            credits: await cells[5].innerText(),
            formula: await cells[6].innerText(),
            year: await cells[7].innerText(),
            period: await cells[8].innerText(),
            sections: []
        };
       
        console.log(`   Курс '${courseInfo.name_en}' найден!`);

        await rowToClick.click();
        const scheduleButton = page.locator('span.v-menubar-menuitem', { hasText: "Расписание" });
        await Promise.all([
            page.waitForResponse("**/UIDL/**", { timeout: 15000 }),
            scheduleButton.click()
        ]);
        
        const sections = await parseScheduleView(page);
        courseInfo.sections = sections;
        console.log(`  - Найдено секций: ${sections.length}`);
        console.log(courseInfo);
       
        console.log(`[DB] Сохраняем/обновляем курс ${courseInfo.code}...`);
        const savedCourse = await prisma.course.upsert({
            where: { code: courseInfo.code },
            update: {
                name: courseInfo.name_en,
                credits: parseInt(courseInfo.credits, 10) || 0,
                formula: courseInfo.formula,
                year: courseInfo.year,
                period: courseInfo.period,
                sections: {
                    deleteMany: {},
                    create: courseInfo.sections.map(section => ({
                        type: section.type, day: section.day, time: section.time,
                        teacher: section.teacher, room: section.room, duration: section.duration,
                    })),
                },
            },
            create: {
                code: courseInfo.code,
                name: courseInfo.name_en,
                credits: parseInt(courseInfo.credits, 10) || 0,
                formula: courseInfo.formula,
                year: courseInfo.year,
                period: courseInfo.period,
                sections: {
                    create: courseInfo.sections.map(section => ({
                        type: section.type, day: section.day, time: section.time,
                        teacher: section.teacher, room: section.room, duration: section.duration,
                    })),
                },
            },
            include: { sections: true }
        });
        console.log("[DB] Успешно!");
        return savedCourse;

    } catch (error) {
        console.error("Ошибка в процессе скрапинга:", error);
        throw error; 
    } finally {
        await browser.close();
    }
}