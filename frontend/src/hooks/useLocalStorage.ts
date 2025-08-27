import { useState, useEffect } from 'react';

function getValueFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return defaultValue;
    
    const parsed = JSON.parse(item);
    
    if (Array.isArray(parsed) && parsed.length > 0) {
      if (parsed[0]?.createdAt) {
        return parsed.map((schedule: any) => ({
          ...schedule,
          createdAt: new Date(schedule.createdAt),
          updatedAt: new Date(schedule.updatedAt)
        })) as T;
      }
      return parsed as T;
    }
    
    return parsed;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
}

export function useLocalStorage<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    return getValueFromStorage(key, defaultValue);
  });

  useEffect(() => {
    try {
      const valueToStore = JSON.stringify(storedValue);
      window.localStorage.setItem(key, valueToStore);
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}