import React, { useState } from 'react';
import { Download, Calendar, FileText, Copy, Check } from 'lucide-react';
import type { Schedule, EnrichedSection } from '../../types';

interface ScheduleExportProps {
  schedule: Schedule;
  allSections: EnrichedSection[];
  onClose: () => void;
}

export const ScheduleExport: React.FC<ScheduleExportProps> = ({
  schedule,
  allSections,
  onClose
}) => {
  const [exportFormat, setExportFormat] = useState<'text' | 'csv' | 'ical' | 'json'>('text');
  const [copied, setCopied] = useState(false);

  const selectedSections = allSections.filter(s => schedule.selectedSectionIds[s.id]);

  // Генерация текстового формата
  const generateTextFormat = () => {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    let output = `Расписание: ${schedule.name}\n`;
    output += `Создано: ${new Date(schedule.createdAt).toLocaleDateString()}\n`;
    output += `Обновлено: ${new Date(schedule.updatedAt).toLocaleDateString()}\n\n`;

    days.forEach(day => {
      const daySections = selectedSections
        .filter(s => s.day === day)
        .sort((a, b) => a.time.localeCompare(b.time));
      
      if (daySections.length > 0) {
        output += `${day}:\n`;
        daySections.forEach(section => {
          output += `  ${section.time} - ${section.courseCode} (${section.type})\n`;
          output += `    Преподаватель: ${section.teacher}\n`;
          output += `    Аудитория: ${section.room}\n\n`;
        });
      }
    });

    return output;
  };

  // Генерация CSV формата
  const generateCSVFormat = () => {
    let csv = 'День,Время,Курс,Тип,Преподаватель,Аудитория\n';
    
    selectedSections
      .sort((a, b) => {
        const dayOrder = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
        if (dayDiff !== 0) return dayDiff;
        return a.time.localeCompare(b.time);
      })
      .forEach(section => {
        csv += `${section.day},${section.time},${section.courseCode},${section.type},"${section.teacher}","${section.room}"\n`;
      });

    return csv;
  };

  // Генерация iCal формата
  const generateICalFormat = () => {
    // const now = new Date();
    const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    let ical = 'BEGIN:VCALENDAR\n';
    ical += 'VERSION:2.0\n';
    ical += 'PRODID:-//Schedule App//Schedule Export//EN\n';
    ical += `X-WR-CALNAME:${schedule.name}\n`;
    
    selectedSections.forEach((section) => {
      // Примерная дата начала семестра (можно сделать настраиваемой)
      const semesterStart = new Date('2024-09-01');
      const dayOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].indexOf(section.day);
      
      // Находим первое вхождение дня недели
      const firstOccurrence = new Date(semesterStart);
      firstOccurrence.setDate(semesterStart.getDate() + (dayOfWeek - semesterStart.getDay() + 7) % 7);
      
      const [hours, minutes] = section.time.split(':').map(Number);
      const startTime = new Date(firstOccurrence);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setHours(hours + 1, minutes + 30, 0, 0); // Предполагаем 1.5 часа на занятие
      
      ical += 'BEGIN:VEVENT\n';
      ical += `UID:${section.id}-${schedule.id}@schedule-app\n`;
      ical += `DTSTART:${formatDate(startTime)}\n`;
      ical += `DTEND:${formatDate(endTime)}\n`;
      ical += `SUMMARY:${section.courseCode} - ${section.type}\n`;
      ical += `DESCRIPTION:Преподаватель: ${section.teacher}\\nАудитория: ${section.room}\n`;
      ical += `LOCATION:${section.room}\n`;
      ical += `RRULE:FREQ=WEEKLY;COUNT=16\n`; // 16 недель семестра
      ical += 'END:VEVENT\n';
    });
    
    ical += 'END:VCALENDAR\n';
    return ical;
  };

  // Генерация JSON формата
  const generateJSONFormat = () => {
    const exportData = {
      schedule: {
        id: schedule.id,
        name: schedule.name,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt
      },
      sections: selectedSections.map(section => ({
        id: section.id,
        courseCode: section.courseCode,
        courseName: section.courseName,
        type: section.type,
        day: section.day,
        time: section.time,
        teacher: section.teacher,
        room: section.room
      }))
    };
    
    return JSON.stringify(exportData, null, 2);
  };

  const getExportData = () => {
    switch (exportFormat) {
      case 'csv': return generateCSVFormat();
      case 'ical': return generateICalFormat();
      case 'json': return generateJSONFormat();
      default: return generateTextFormat();
    }
  };

  const getFileName = () => {
    const safeName = schedule.name.replace(/[^a-zA-Z0-9]/g, '_');
    const extensions = { text: 'txt', csv: 'csv', ical: 'ics', json: 'json' };
    return `${safeName}.${extensions[exportFormat]}`;
  };

  const getMimeType = () => {
    const mimeTypes = {
      text: 'text/plain',
      csv: 'text/csv',
      ical: 'text/calendar',
      json: 'application/json'
    };
    return mimeTypes[exportFormat];
  };

  const handleDownload = () => {
    const data = getExportData();
    const blob = new Blob([data], { type: getMimeType() });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = getFileName();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getExportData());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Не удалось скопировать в буфер обмена:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Download size={24} />
            Экспорт расписания
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4 flex-grow overflow-auto">
          {/* Информация о расписании */}
          <div className="bg-neutral-700 rounded-lg p-3">
            <h3 className="font-semibold text-white mb-2">{schedule.name}</h3>
            <div className="text-sm text-gray-300 space-y-1">
              <div>Секций: {selectedSections.length}</div>
              <div>Создано: {new Date(schedule.createdAt).toLocaleDateString()}</div>
              <div>Обновлено: {new Date(schedule.updatedAt).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Выбор формата */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Формат экспорта:</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'text', label: 'Текст', icon: <FileText size={16} /> },
                { value: 'csv', label: 'CSV', icon: <FileText size={16} /> },
                { value: 'ical', label: 'Календарь (iCal)', icon: <Calendar size={16} /> },
                { value: 'json', label: 'JSON', icon: <FileText size={16} /> }
              ].map(format => (
                <button
                  key={format.value}
                  onClick={() => setExportFormat(format.value as any)}
                  className={`p-3 rounded-lg border transition-colors flex items-center gap-2 ${
                    exportFormat === format.value
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-neutral-700 border-neutral-600 text-gray-300 hover:bg-neutral-600'
                  }`}
                >
                  {format.icon}
                  <span className="text-sm">{format.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Предварительный просмотр */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Предварительный просмотр:</label>
            <div className="bg-neutral-900 rounded-lg p-3 max-h-64 overflow-auto">
              <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                {getExportData().slice(0, 1000)}
                {getExportData().length > 1000 && '\n... (обрезано для предварительного просмотра)'}
              </pre>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="p-4 border-t border-neutral-700 flex gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Download size={16} />
            Скачать {getFileName()}
          </button>
          
          <button
            onClick={handleCopyToClipboard}
            className="bg-neutral-600 hover:bg-neutral-500 text-white py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Скопировано!' : 'Копировать'}
          </button>
          
          <button
            onClick={onClose}
            className="bg-neutral-600 hover:bg-neutral-500 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};