// Full scraper service restored with parser, DB upsert and safer runtime management.
import { chromium, Browser } from 'playwright';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalizeCourseCode(code: string): string {
  return code.replace(/\u0430/g, 'a').toUpperCase();
}

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
  const sections: any[] = [];
  console.log("  - Ищем сетку расписания...");

  try {
    await page.waitForSelector('.schedule-item', { timeout: 5000 });
    console.log("  - Сетка найдена, парсим...");

    const scheduleItems = await page.locator('.schedule-item').all();

    for (const item of scheduleItems) {
      const fullText = await item.innerText();
      const wrapper = item.locator('xpath=..');
      const style = (await wrapper.getAttribute('style')) || '';

      const topMatch = style.match(/top:\s*(\d+)/);
      if (!topMatch) continue;
      const topPixels = parseInt(topMatch[1], 10);
      const hour = 8 + Math.floor(topPixels / 40);
      const timeStart = `${String(hour).padStart(2, '0')}:00`;

      let dayOfWeek = 'N/A';
      try {
        const dayColumn = item.locator('xpath=ancestor::div[contains(@class, "v-slot v-slot-v-border-left-1-bfbfbf")]');
        dayOfWeek = await dayColumn.locator('.v-label.bold').first().innerText();
      } catch (e) { }

      const cleanText = fullText.trim();
      let teacher = 'N/A', lessonType = 'N/A', room = 'N/A', duration = 1;

      const typeMatch = cleanText.match(/\s(Лаб|Л|П)\s/);
      if (typeMatch) {
        if (typeMatch[1] === 'Л') { lessonType = 'Лекция'; duration = 1; }
        else if (typeMatch[1] === 'П') {
          lessonType = 'Практика';
          const lower = cleanText.toLowerCase();
          if (lower.includes('офп') || lower.includes('физическая культура') || lower.includes('физкультура') || lower.includes('тренажер') || lower.includes('игровой') || lower.includes('зал')) duration = 2;
          else duration = 1;
        } else if (typeMatch[1] === 'Лаб') { lessonType = 'Лабораторная'; duration = 2; }
      }

      const teacherMatch = cleanText.match(/^(.*?)\s(Лаб|Л|П)\s/);
      if (teacherMatch) teacher = teacherMatch[1].trim();

      const roomActivityGroupMatch = cleanText.match(/(Лаб|Л|П)\s+([^()]+)(?:\s*\(([^)]*)\))?(?:\s*\(([^)]*)\))?/);
      if (roomActivityGroupMatch) {
        const place = roomActivityGroupMatch[2] ? roomActivityGroupMatch[2].trim() : 'N/A';
        const activity = roomActivityGroupMatch[3] ? roomActivityGroupMatch[3].trim() : '';
        const group = roomActivityGroupMatch[4] ? roomActivityGroupMatch[4].trim() : '';
        room = [place, activity, group].filter(Boolean).join(' ').trim();
      }

      sections.push({ day: dayOfWeek.trim(), time: timeStart, teacher, type: lessonType, room, duration, raw_text: cleanText });
    }
  } catch (error) {
    console.log(`  - Расписание для этого курса не найдено.`);
  }
  return sections;
}

// shared browser + concurrency
let sharedBrowser: Browser | null = null;
const MAX_CONCURRENT_SCRAPES = Number(process.env.MAX_CONCURRENT_SCRAPES) || 2;
let currentScrapes = 0;

async function getSharedBrowser(): Promise<Browser> {
  if (sharedBrowser) return sharedBrowser;
  sharedBrowser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
  const cleanup = async () => { try { if (sharedBrowser) { await sharedBrowser.close(); sharedBrowser = null; } } catch (e) { console.warn('Error closing shared browser', e); } };
  process.on('exit', cleanup);
  process.on('SIGINT', () => cleanup().then(() => process.exit(0)));
  process.on('SIGTERM', () => cleanup().then(() => process.exit(0)));
  return sharedBrowser;
}

function acquireSlot(): Promise<void> {
  return new Promise((resolve) => {
    const tryAcquire = () => { if (currentScrapes < MAX_CONCURRENT_SCRAPES) { currentScrapes += 1; resolve(); } else { setTimeout(tryAcquire, 200); } };
    tryAcquire();
  });
}

function releaseSlot() { currentScrapes = Math.max(0, currentScrapes - 1); }

function withTimeout<T>(p: Promise<T>, ms: number, onTimeout?: () => void): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => { try { onTimeout?.(); } catch (e) {} ; reject(new Error(`Scrape timed out after ${ms} ms`)); }, ms);
    p.then((v) => { clearTimeout(timer); resolve(v); }).catch((err) => { clearTimeout(timer); reject(err); });
  });
}

export const scrapeAndSaveCourse = async (year: string, semester: string, courseCode: string) => {
  const LOGIN = process.env.LOGIN ?? '';
  const PASSWORD = process.env.PASSWORD ?? '';
  const BASE_URL = 'https://wsp.kbtu.kz/';
  const SCHEDULE_URL = 'https://wsp.kbtu.kz/SubjectSchedule';
  const LANDING_PAGE_AFTER_LOGIN = '**/News**';

  await acquireSlot();
  let page: any = null;
  try {
    const browser = await getSharedBrowser();
    page = await browser.newPage();
    page.setDefaultTimeout(20_000);

  const timeoutMs = Number(process.env.SCRAPE_TIMEOUT_MS) || 70_000;
  const LOGIN_TIMEOUT_MS = Number(process.env.LOGIN_TIMEOUT_MS) || 30_000;

    const result = await withTimeout((async () => {
      try {
        console.log('1. Авторизация...');
        await page.goto(BASE_URL);
        await page.waitForTimeout(5000);
        const loginIcon = page.locator('div[role="button"]:has(img[src*="login_24.png"])');
        await loginIcon.click({ force: true });
        await page.getByLabel('Пользователь').fill(LOGIN);
        await page.getByLabel('Пароль').fill(PASSWORD);
        const loginButton = page.getByRole('button', { name: 'Вход' });
        await page.waitForTimeout(5000);
        await loginButton.hover();
        await loginButton.click();
        await page.waitForTimeout(5000);
        const waitForLanding = async () => {
          try {
            await page.waitForURL(LANDING_PAGE_AFTER_LOGIN, { timeout: LOGIN_TIMEOUT_MS });
            return;
          } catch (e) {
            try {
              await page.waitForNavigation({ timeout: LOGIN_TIMEOUT_MS, waitUntil: 'load' });
            } catch (navErr) {
            }
            const fallbackSelectors = [
              'div.v-menubar', // top menu
              'div.v-table-body', // schedule table
              'span:has-text("Расписание")',
            ];

            for (const sel of fallbackSelectors) {
              try {
                await page.waitForSelector(sel, { timeout: 5000 });
                return;
              } catch (_) {
                // try next
              }
            }

            throw e;
          }
        };

        await waitForLanding();
        console.log('   Успешно!');
        await page.waitForTimeout(5000);
        console.log(`2. Ищем курс ${courseCode} за ${year}, ${semester} семестр...`);
        await page.goto(SCHEDULE_URL);
        await page.waitForSelector('div.v-table-body', { timeout: 15000 });
        await page.waitForTimeout(5000);
        const comboboxes = page.locator('div[role="combobox"]');
        await comboboxes.first().locator('.v-filterselect-button').click();
        await page.locator('span', { hasText: year }).click();
        await page.waitForTimeout(500);
        await comboboxes.nth(1).locator('.v-filterselect-button').click();
        await page.locator('span', { hasText: semester }).click();
        await page.waitForTimeout(500);

        await page.getByLabel('Шифр').fill(courseCode);
        await Promise.all([
          page.waitForResponse('**/UIDL/**'),
          page.getByRole('button', { name: 'Фильтровать' }).click()
        ]);
        await page.waitForTimeout(1000);
        console.log('   Фильтр применен.');

        const rows = await page.locator('tr.v-table-row, tr.v-table-row-odd').all();
        let rowToClick: any = null;
        for (const row of rows) {
          const codeCell = await row.locator('td').first().innerText();
          if (codeCell.trim().toUpperCase() === courseCode.trim().toUpperCase()) { rowToClick = row; break; }
        }
        if (!rowToClick) throw new Error(`Курс с шифром ${courseCode} не найден в таблице после фильтрации.`);
        await rowToClick.waitFor({ state: 'visible', timeout: 5000 });

        const cells = await rowToClick.locator('td').all();
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
        const scheduleButton = page.locator('span.v-menubar-menuitem', { hasText: 'Расписание' });
        await Promise.all([ page.waitForResponse('**/UIDL/**', { timeout: 15000 }), scheduleButton.click() ]);

        const sections = await parseScheduleView(page);
        courseInfo.sections = sections;
        console.log(`  - Найдено секций: ${sections.length}`);
        //console.log(courseInfo);

        console.log(`[DB] Сохраняем/обновляем курс ${courseInfo.code}...`);
        const savedCourse = await prisma.course.upsert({
          where: { code: courseInfo.code },
          update: {
            name: courseInfo.name_en,
            credits: parseInt(courseInfo.credits, 10) || 0,
            formula: courseInfo.formula,
            year: courseInfo.year,
            period: courseInfo.period,
            sections: { deleteMany: {}, create: courseInfo.sections.map((section: any) => ({ type: section.type, day: section.day, time: section.time, teacher: section.teacher, room: section.room, duration: section.duration })) }
          },
          create: {
            code: courseInfo.code,
            name: courseInfo.name_en,
            credits: parseInt(courseInfo.credits, 10) || 0,
            formula: courseInfo.formula,
            year: courseInfo.year,
            period: courseInfo.period,
            sections: { create: courseInfo.sections.map((section: any) => ({ type: section.type, day: section.day, time: section.time, teacher: section.teacher, room: section.room, duration: section.duration })) }
          },
          include: { sections: true }
        });
        console.log('[DB] Успешно!');
        return savedCourse;
      } finally {
        try { /* page closed in outer finally */ } catch (e) { }
      }
    })(), timeoutMs, () => { try { page?.close().catch(() => {}); } catch (e) {} });

    return result;
  } catch (error) {
    console.error('Ошибка в процессе скрапинга:', error);
    throw error;
  } finally {
    try { if (page) await page.close(); } catch (e) { }
    releaseSlot();
  }
};