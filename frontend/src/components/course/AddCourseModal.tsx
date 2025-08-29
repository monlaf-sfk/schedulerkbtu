import React, { useEffect, useState, useMemo } from 'react';
import api from '../../utils/api';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Search, Loader2 } from 'lucide-react';
import { VirtualizedCourseList } from '../ui/VirtualizedList';
import { useDebounce } from '../../hooks/useDebounce';


// --- Функция для определения текущего учебного года и семестра ---
// function getCurrentAcademicYearAndSemester() {
//   const now = new Date();
//   const month = now.getMonth() + 1; // 1-12
//   const year = now.getFullYear();
//   let academicYear;
//   let semester;
//   if (month >= 9) {
//     academicYear = `${year}-${year + 1}`;
//     semester = "Осенний";
//   } else if (month >= 1 && month <= 5) {
//     academicYear = `${year - 1}-${year}`;
//     semester = "Весенний";
//   } else {
//     academicYear = `${year - 1}-${year}`;
//     semester = "Летний";
//   }
//   return { academicYear, semester };
// }

 
interface CourseListItem {
  code: string;
  name: string;
  credits: number;
}

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedCodes: string[]) => void;
  alreadySelectedCodes: string[];
}

export const AddCourseModal: React.FC<AddCourseModalProps> = ({ isOpen, onClose, onConfirm, alreadySelectedCodes }) => {
  const [allCourses, setAllCourses] = useState<CourseListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [listHeight, setListHeight] = useState<number>(300);


  useEffect(() => {
    if (isOpen) {
      api.get('/api/courses').then(res => setAllCourses(res.data));
    }
    const initialSelected: Record<string, boolean> = {};
    alreadySelectedCodes.forEach(code => {
      initialSelected[code] = true;
    });
    setSelected(initialSelected);
  }, [isOpen, alreadySelectedCodes]);

  useEffect(() => {
    const compute = () => {
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
      const estimated = Math.round(Math.max(180, Math.min(480, Math.floor(vh * 0.45))));
      setListHeight(estimated);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  const handleSelect = (code: string) => {
    setSelected(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const handleConfirm = () => {
    const selectedCodes = Object.keys(selected).filter(code => selected[code]);
    onConfirm(selectedCodes);
    onClose();
  };

  // Функция для запуска парсера на бэкенде
  const handleScrapeCourse = async () => {
    if (isScraping) return;

    setIsScraping(true);
    setScrapeError(null);
    const courseCode = searchTerm.toUpperCase();

    try {
  //const { academicYear, semester } = getCurrentAcademicYearAndSemester();
  //console.log("Запрос на скрапинг:", { academicYear, semester, code: courseCode });
  const response = await api.post('/api/scrape', {
        year: "2025-2026",
        semester: "Осенний",
        code: courseCode,
      });

      const newCourse: CourseListItem = response.data;

      setAllCourses(prev => {
        if (prev.find(c => c.code === newCourse.code)) {
          return prev;
        }
        return [...prev, newCourse];
      });
      setSelected(prev => ({ ...prev, [newCourse.code]: true }));
      setSearchTerm('');  

    } catch (error) {
      console.error("Ошибка при скрапинге:", error);
      setScrapeError(`Не удалось найти курс с шифром "${courseCode}". Проверьте правильность написания.`);
    } finally {
      setIsScraping(false);
    }
  };

  const filteredCourses = useMemo(() =>
    allCourses.filter(course =>
      course.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    ), [allCourses, debouncedSearchTerm]
  );

  const renderCourseItem = (course: CourseListItem) => (
    <label className="flex items-center p-4 bg-gradient-to-r from-slate-800/60 to-slate-700/60 border border-slate-600/40 rounded-xl cursor-pointer hover:border-slate-500/60 hover:bg-gradient-to-r hover:from-slate-700/70 hover:to-slate-600/70 transition-all duration-200 shadow-lg">
      <input
        type="checkbox"
        className="h-5 w-5 rounded bg-slate-800 border-slate-600/50 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
        checked={!!selected[course.code]}
        onChange={() => handleSelect(course.code)}
      />
      <div className="ml-4">
        <p className="font-semibold text-slate-200">{course.code}</p>
        <p className="text-sm text-slate-300">{course.name}</p>
      </div>
    </label>
  );

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/70 fixed inset-0 z-40 animate-in fade-in-0 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-slate-900/98 to-slate-800/98 border border-slate-600/50 rounded-3xl shadow-2xl w-full sm:w-[90vw] max-w-2xl h-[80vh] md:h-[70vh] z-50 flex flex-col animate-fade-in backdrop-blur-sm">
          <header className="p-4 sm:p-6 border-b border-slate-600/30 flex justify-between items-center flex-shrink-0 bg-gradient-to-r from-slate-900/60 to-slate-800/60 rounded-t-3xl">
            <Dialog.Title className="text-2xl font-bold text-slate-200">Добавить курсы</Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-slate-400 hover:text-white p-2 rounded-full bg-slate-800/70 hover:bg-slate-700/70 transition-all duration-200 border border-slate-600/40">
                <X size={24} />
              </button>
            </Dialog.Close>
          </header>

          <div className="p-4 sm:p-6 flex-shrink-0">
            <div className="relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Поиск по коду или названию курса..."
                className="w-full bg-slate-800/70 border border-slate-600/40 rounded-xl pl-12 pr-4 py-3 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500/50 transition-all duration-200 shadow-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-grow px-6">
            {filteredCourses.length > 0 ? (
              <VirtualizedCourseList
                courses={filteredCourses}
                height={listHeight}
                itemHeight={80}
                onCourseSelect={(course) => handleSelect(course.code)}
                renderItem={renderCourseItem}
                selectedCourseId={undefined}
              />
            ) : searchTerm.length > 3 ? (
              <div className="text-center p-6 border-dashed border-2 border-slate-600/40 rounded-2xl bg-gradient-to-br from-slate-800/40 to-slate-900/40">
                <p className="mb-4 text-slate-200 font-medium">Курс не найден в локальной базе.</p>
                <button
                  onClick={handleScrapeCourse}
                  disabled={isScraping}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl flex items-center justify-center w-full disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200 shadow-lg border border-emerald-500/50"
                >
                  {isScraping ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={20} />
                      Идет поиск на портале...
                    </>
                  ) : (
                    `Найти и добавить курс "${searchTerm.toUpperCase()}"`
                  )}
                </button>
                {scrapeError && <p className="text-red-400 text-sm mt-3 font-medium">{scrapeError}</p>}
              </div>
            ) : (
              <div className="text-center p-6 text-slate-400">
                Введите название или код курса для поиска
              </div>
            )}
          </div>

          <footer className="p-6 border-t border-slate-600/30 flex justify-end gap-4 flex-shrink-0 bg-gradient-to-r from-slate-900/60 to-slate-800/60 rounded-b-3xl">
            <Dialog.Close asChild>
              <button className="px-6 py-3 bg-slate-700 border border-slate-500/30 text-slate-200 rounded-xl hover:bg-slate-600 hover:text-white transition-all duration-200 font-bold shadow-lg">
                Отмена
              </button>
            </Dialog.Close>
            <button
              onClick={handleConfirm}
              className="px-6 py-3 bg-blue-600 border border-blue-500 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg transition-all duration-200"
            >
              Добавить выбранные курсы
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};