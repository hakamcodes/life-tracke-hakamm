
import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { DailyLog, StudySession, AppSettings, AboutMeData, ExerciseEntry, Habit, CustomActivityType, TodoTask, EisenhowerQuadrant, GalleryItem, StickyNote, MoneyEntry } from './types';
import { NOTE_THEMES, SOUNDS, playSound } from './utils';
import { calculateLogPoints, getPointsBreakdown, createSummaryText, calculateHabitStreak } from './helpers';
import { FloatingPointItem, FloatingPoint, Modal } from './components/Shared';

// Import Views
import { TodayView } from './views/TodayView';
import { HabitsView } from './views/HabitsView';
import { StickyNotesView } from './views/StickyNotesView';
import { TrendsView } from './views/TrendsView';
import { RewardsView } from './views/RewardsView';
import { ReviewView } from './views/ReviewView';
import { SettingsView } from './views/SettingsView';
import { AboutView } from './views/AboutView';
import { GalleryView } from './views/GalleryView';
import { MoneyView } from './views/MoneyView';
import { GoalsView } from './views/GoalsView';
import { SkillTreeView } from './views/SkillTreeView';

const MASTER_PASSWORD = "#Ekam@36054";

const App: React.FC = () => {
  const [view, setView] = useState<'today' | 'habits' | 'trends' | 'rewards' | 'review' | 'settings' | 'about' | 'gallery' | 'sticky-notes' | 'money' | 'goals' | 'skills'>('today');
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  
  // UI State
  const [isEditingAboutMe, setIsEditingAboutMe] = useState(false);
  const [floatingPoints, setFloatingPoints] = useState<FloatingPoint[]>([]);
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [selectedHabitForCalendar, setSelectedHabitForCalendar] = useState<Habit | null>(null);
  const [isScoreBreakdownOpen, setIsScoreBreakdownOpen] = useState(false);
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [newTodoQuadrant, setNewTodoQuadrant] = useState<EisenhowerQuadrant>(1);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<GalleryItem | null>(null);

  // Range State
  const [moneyStartDate, setMoneyStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [moneyEndDate, setMoneyEndDate] = useState(currentDate);
  
  const [reportStartDate, setReportStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [reportEndDate, setReportEndDate] = useState(currentDate);

  const [trendStartDate, setTrendStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [trendEndDate, setTrendEndDate] = useState(currentDate);

  // Sticky Note Editor State
  const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<StickyNote | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState(NOTE_THEMES[0].name);

  // Pomodoro State
  const [isPomodoroModalOpen, setIsPomodoroModalOpen] = useState(false);
  const [pomodoroStatus, setPomodoroStatus] = useState<'setup' | 'running' | 'paused' | 'finished'>('setup');
  const [pomoHours, setPomoHours] = useState(0);
  const [pomoMinutes, setPomoMinutes] = useState(25);
  const [pomoSubject, setPomoSubject] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const pomoTimerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Breathing State
  const [isBreathingModalOpen, setIsBreathingModalOpen] = useState(false);
  const [breathingStatus, setBreathingStatus] = useState<'setup' | 'inhale' | 'hold' | 'exhale' | 'finished'>('setup');
  const [breathingTimeRemaining, setBreathingTimeRemaining] = useState(120); // 2 minutes
  const [breathingPhaseRemaining, setBreathingPhaseRemaining] = useState(4);
  const breathingTimerRef = useRef<any>(null);

  // --- Initialize Settings Synchronously to handle App Lock ---
  const [settings, setSettings] = useState<AppSettings>(() => {
    const defaultSettings: AppSettings = {
        waterTargets: { daily: 2.5, weekly: 17.5, monthly: 75 },
        studyTargets: { daily: 4, weekly: 28, monthly: 120 },
        exerciseTargets: { daily: 30, weekly: 210, monthly: 900 },
        screenTimeTargets: { daily: 4, weekly: 28, monthly: 120 },
        showImportance: true,
        obfuscationEnabled: false,
        settingsPassword: 'hakam@123',
        // App Lock Defaults
        isAppLockEnabled: false,
        appLockPassword: 'lodhi@123',
        rewards: [
          { id: 'default-ig', name: '30 min Instagram', points: 50, emoji: '📸' },
          { id: 'default-game', name: '1 Hour Gaming', points: 100, emoji: '🎮' },
          { id: 'default-snack', name: 'Cheat Snack', points: 80, emoji: '🍫' }
        ],
        habits: [
          { id: 'h1', name: 'Morning Meditation', emoji: '🧘', createdAt: new Date().toISOString().split('T')[0], points: 5 },
          { id: 'h2', name: 'Read 10 Pages', emoji: '📖', createdAt: new Date().toISOString().split('T')[0], points: 5 }
        ],
        customActivities: [],
        expenseCategories: ['Clg fees', 'Study expenses', 'Transport', 'Other expenses'],
        deadlines: [],
        skills: [], // New Skill Tree Defaults
        userName: "Hakam",
        schoolName: "Samrat Ashok Technical Institute (B Tech - CSE)",
        collegeName: "Samrat Ashok Technical Institute (B Tech - CSE)",
        theme: 'system',
        profilePicture: undefined
    };

    const savedSettings = localStorage.getItem('hakam_settings');
    if (savedSettings) {
        try {
            const parsed = JSON.parse(savedSettings);
            // Merge defaults with saved to ensure new fields (like skills) exist
            return { ...defaultSettings, ...parsed, skills: parsed.skills || [] };
        } catch (e) {
            return defaultSettings;
        }
    }
    return defaultSettings;
  });

  // --- App Lock State ---
  const [isAppLocked, setIsAppLocked] = useState(() => {
      // Check immediately on mount
      return settings.isAppLockEnabled;
  });
  const [lockPasswordInput, setLockPasswordInput] = useState('');
  const [lockError, setLockError] = useState(false);
  const [showResetLock, setShowResetLock] = useState(false);
  const [resetLockStep, setResetLockStep] = useState<'verify' | 'new'>('verify');
  const [resetLockInput, setResetLockInput] = useState('');

  // --- Date Logic ---
  const { todayStr, isToday, isEditable } = useMemo(() => {
    const now = new Date();
    const toLocalDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const tStr = toLocalDateStr(now);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yStr = toLocalDateStr(yesterday);
    
    const editable = true;
    
    return { 
      todayStr: tStr, 
      yesterdayStr: yStr,
      isToday: currentDate === tStr,
      isEditable: editable 
    };
  }, [currentDate]);
  
  const addFloatingPoint = (x: number, y: number, value: string, isNegative: boolean = false) => {
    const id = Date.now() + Math.random();
    setFloatingPoints(prev => [...prev, { id, x, y, value, isNegative }]);
  };

  const removeFloatingPoint = (id: number) => {
    setFloatingPoints(prev => prev.filter(p => p.id !== id));
  };

  const [aboutMeData, setAboutMeData] = useState<AboutMeData>({
    goals: "", lifeChangingHabit: "", biggestStrength: "", weaknessWorkingOn: "", lowMotivationBoost: "", strongLifeLesson: "", shortTerm6m: "", shortTerm1y: "", collegeEndGoals: "", longTermVision: "", skillsToMaster: "", roleModels: "", dreamLifestyle: "", futureSelfMessage: ""
  });

  const [tempAboutMe, setTempAboutMe] = useState<AboutMeData>(aboutMeData);

  const [identityForm, setIdentityForm] = useState({
    userName: settings.userName || "Hakam",
    schoolName: settings.schoolName || "",
    collegeName: settings.collegeName || ""
  });

  // Theme Logic
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }

    if (settings.theme === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
             if (e.matches) root.classList.add('dark');
             else root.classList.remove('dark');
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  // --- Initial Data Load ---
  useEffect(() => {
    const savedLogs = localStorage.getItem('hakam_logs');
    if (savedLogs) try { 
      const parsed = JSON.parse(savedLogs);
      const migrated = parsed.map((log: any) => {
        if (!log.breathingSessions) log.breathingSessions = 0;
        if (!log.skincare) log.skincare = { morning: false, afternoon: false, night: false };
        if (!log.energyLevels) log.energyLevels = { morning: 0, afternoon: 0, evening: 0, night: 0 };
        if (!log.redeemedRewards) log.redeemedRewards = [];
        if (!log.completedHabits) log.completedHabits = [];
        if (!log.customActivitiesData) log.customActivitiesData = {};
        if (!log.todos) log.todos = [];
        if (!log.screenTimeEntries) log.screenTimeEntries = [];
        if (!log.moneyEntries) log.moneyEntries = [];
        if (!log.happinessPillars) log.happinessPillars = { physical: false, problemSolving: false, helping: false, creative: false, explore: false, learning: false, ideas: false, qualityTime: false, progression: false };
        if (!log.timeTracking) log.timeTracking = {};
        if (!log.mindDump) log.mindDump = "";
        if (!log.waterEntries) log.waterEntries = [];
        if (!log.studySessions) log.studySessions = [];
        if (!log.exerciseEntries) log.exerciseEntries = [];
        if (log.exerciseDone && (!log.exerciseEntries || log.exerciseEntries.length === 0)) {
           log.exerciseEntries = [{ id: Math.random().toString(), type: log.exerciseType || 'walking', duration: log.exerciseDuration || 0, timestamp: 'Legacy Entry' }];
        }
        return log;
      });
      setLogs(migrated);
    } catch (e) {
      console.error("Migration failed", e);
    }
    
    setIdentityForm({
        userName: settings.userName || "Hakam",
        schoolName: settings.schoolName || "Samrat Ashok Technical Institute (B Tech - CSE)",
        collegeName: settings.collegeName || "Samrat Ashok Technical Institute (B Tech - CSE)"
    });

    const savedAboutMe = localStorage.getItem('hakam_about_me');
    if (savedAboutMe) try { setAboutMeData(JSON.parse(savedAboutMe)); } catch (e) {}

    const savedGallery = localStorage.getItem('hakam_gallery');
    if (savedGallery) try { setGallery(JSON.parse(savedGallery)); } catch (e) {}

    const savedNotes = localStorage.getItem('hakam_sticky_notes');
    if (savedNotes) try { setStickyNotes(JSON.parse(savedNotes)); } catch (e) {}
  }, []);

  // --- Auto Summary Logic ---
  useEffect(() => {
    const pastLogsNeedingSummary = logs.filter(l => l.date !== todayStr && (!l.autoSummary || l.autoSummary === ""));
    if (pastLogsNeedingSummary.length > 0) {
      setLogs(prev => prev.map(l => {
        if (l.date !== todayStr && (!l.autoSummary || l.autoSummary === "")) {
          return { ...l, autoSummary: createSummaryText(l, settings, logs) };
        }
        return l;
      }));
    }
  }, [logs, todayStr]);

  useEffect(() => {
    document.title = `${settings.userName || 'Hakam'} — Daily Life Tracker`;
  }, [settings.userName]);

  useEffect(() => {
    if (isIdentityModalOpen) {
      setIdentityForm({
        userName: settings.userName || "Hakam",
        schoolName: settings.schoolName || "Samrat Ashok Technical Institute (B Tech - CSE)",
        collegeName: settings.collegeName || "Samrat Ashok Technical Institute (B Tech - CSE)"
      });
    }
  }, [isIdentityModalOpen, settings]);

  // Persistence
  useEffect(() => { localStorage.setItem('hakam_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('hakam_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('hakam_about_me', JSON.stringify(aboutMeData)); }, [aboutMeData]);
  useEffect(() => { localStorage.setItem('hakam_gallery', JSON.stringify(gallery)); }, [gallery]);
  useEffect(() => { localStorage.setItem('hakam_sticky_notes', JSON.stringify(stickyNotes)); }, [stickyNotes]);

  // --- Core Log Logic ---
  const currentLog = useMemo(() => {
    const log = logs.find(l => l.date === currentDate);
    if (log) return log;
    return {
      date: currentDate, waterEntries: [], sleepHours: 7, sleepMinutes: 0, sleepStart: "23:00", sleepEnd: "07:00", studySessions: [], exerciseEntries: [], screenTimeEntries: [], moneyEntries: [], redeemedRewards: [], completedHabits: [], customActivitiesData: {}, todos: [], happinessPillars: { physical: false, problemSolving: false, helping: false, creative: false, explore: false, learning: false, ideas: false, qualityTime: false, progression: false }, skincare: { morning: false, afternoon: false, night: false }, energyLevels: { morning: 0, afternoon: 0, evening: 0, night: 0 }, meals: { breakfast: false, lunch: false, dinner: false, notes: "" }, junkFood: 0, junkFoodNotes: "", screenTimeHours: 0, screenTimeMinutes: 0, screenTimeNotes: "", mood: 7, moodNotes: "", goalsCompleted: 0, goalText: "", achievement: "", journal: "", gratitude: "", social: [], socialNotes: "", newLearning: "", wakeUpTime: "07:00", bedtime: "23:00", selfCare: [], selfCareNotes: "", nutritionScore: "Okay", distractions: [], distractionNotes: "", negativeThought: "", peaceLevel: 5, dayRating: 5, autoSummary: "", weeklyReflection: "", monthlyReview: "", breathingSessions: 0, timeTracking: {}, mindDump: ""
    } as DailyLog;
  }, [logs, currentDate]);

  const yesterdayLog = useMemo(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    const dateStr = d.toISOString().split('T')[0];
    return logs.find(l => l.date === dateStr);
  }, [logs, currentDate]);

  const updateLog = (updatedFields: Partial<DailyLog>) => {
    if (!isEditable) return; 
    setLogs(prev => {
      const index = prev.findIndex(l => l.date === currentDate);
      if (index > -1) {
        const newLogs = [...prev];
        newLogs[index] = { ...newLogs[index], ...updatedFields };
        return newLogs;
      } else {
        return [...prev, { ...currentLog, ...updatedFields }];
      }
    });
  };

  const handleSleepTimeChange = (field: 'sleepStart' | 'sleepEnd', value: string) => {
    const start = field === 'sleepStart' ? value : currentLog.sleepStart;
    const end = field === 'sleepEnd' ? value : currentLog.sleepEnd;
    const updates: Partial<DailyLog> = { [field]: value };
    if (start && end) {
      const [sH, sM] = start.split(':').map(Number);
      const [eH, eM] = end.split(':').map(Number);
      let diffMins = (eH * 60 + eM) - (sH * 60 + sM);
      if (diffMins < 0) diffMins += 24 * 60;
      updates.sleepHours = Math.floor(diffMins / 60);
      updates.sleepMinutes = diffMins % 60;
    }
    updateLog(updates);
    playSound(SOUNDS.CLICK);
  };

  // --- Derived Stats ---
  const cumulativeLifeScore = useMemo(() => {
    return logs.reduce((total, log) => {
      const dailyEarned = calculateLogPoints(log, settings, logs);
      const dailySpent = log.redeemedRewards?.reduce((sum, r) => sum + r.points, 0) || 0;
      return total + dailyEarned - dailySpent;
    }, 0);
  }, [logs, settings]);

  const totalAvailableBalance = useMemo(() => {
    return logs.reduce((acc, log) => {
        const income = (log.moneyEntries || []).filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
        const expense = (log.moneyEntries || []).filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
        return acc + income - expense;
    }, 0);
  }, [logs]);

  const todayWater = currentLog.waterEntries.reduce((acc, curr) => acc + curr.amount, 0);
  const todayStudyMinutes = currentLog.studySessions.reduce((acc, curr) => acc + curr.duration, 0);
  
  const currentDailyNetScore = useMemo(() => {
    const earned = calculateLogPoints(currentLog, settings, logs);
    const spent = currentLog.redeemedRewards?.reduce((sum, r) => sum + r.points, 0) || 0;
    return earned - spent;
  }, [currentLog, settings, logs]);

  const yesterdayDailyNetScore = useMemo(() => {
    if (!yesterdayLog) return 0;
    const earned = calculateLogPoints(yesterdayLog, settings, logs);
    const spent = yesterdayLog.redeemedRewards?.reduce((sum, r) => sum + r.points, 0) || 0;
    return earned - spent;
  }, [yesterdayLog, settings, logs]);

  // --- Timer Effects (Pomodoro/Breathing) ---
  useEffect(() => {
    if (pomodoroStatus === 'running' && timeRemaining > 0) {
      pomoTimerRef.current = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && pomodoroStatus === 'running') {
      if (pomoTimerRef.current) clearInterval(pomoTimerRef.current);
      setPomodoroStatus('finished');
      if (audioRef.current) {
        audioRef.current.loop = true;
        audioRef.current.play().catch(() => {});
      }
      const totalMinutes = pomoHours * 60 + pomoMinutes;
      if (totalMinutes > 0) {
        const newSession: StudySession = {
          id: Math.random().toString(),
          duration: totalMinutes,
          subject: pomoSubject || 'Deep Work',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        updateLog({ studySessions: [...(currentLog.studySessions || []), newSession] });
        addFloatingPoint(window.innerWidth / 2, window.innerHeight / 2, `+${Math.floor((totalMinutes / 30) * 10)}`);
        playSound(SOUNDS.SUCCESS);
      }
    }
    return () => { if (pomoTimerRef.current) clearInterval(pomoTimerRef.current); };
  }, [pomodoroStatus, timeRemaining]);

  useEffect(() => {
    if (breathingStatus !== 'setup' && breathingStatus !== 'finished' && breathingTimeRemaining > 0) {
      breathingTimerRef.current = setInterval(() => {
        setBreathingTimeRemaining(prev => prev - 1);
        setBreathingPhaseRemaining(prev => {
          if (prev <= 1) {
            setBreathingStatus(curr => {
              const next = curr === 'inhale' ? 'hold' : (curr === 'hold' ? 'exhale' : 'inhale');
              playSound(SOUNDS.TRANSITION, 0.15);
              return next;
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (breathingTimeRemaining <= 0 && breathingStatus !== 'finished' && breathingStatus !== 'setup') {
      if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
      setBreathingStatus('finished');
      updateLog({ breathingSessions: (currentLog.breathingSessions || 0) + 1 });
      addFloatingPoint(window.innerWidth / 2, window.innerHeight / 2, '+10');
      playSound(SOUNDS.REWARD);
    }
    return () => { if (breathingTimerRef.current) clearInterval(breathingTimerRef.current); };
  }, [breathingStatus, breathingTimeRemaining]);

  // --- Handlers ---
  const saveStickyNote = () => {
    if (!noteContent.trim()) return;
    if (editingNote) {
        setStickyNotes(prev => prev.map(n => n.id === editingNote.id ? { ...n, text: noteContent, color: noteColor } : n));
    } else {
        const newNote: StickyNote = { id: Math.random().toString(36).substring(7), text: noteContent, color: noteColor, timestamp: new Date().toLocaleDateString() };
        setStickyNotes(prev => [newNote, ...prev]);
    }
    setIsNoteEditorOpen(false);
    playSound(SOUNDS.SUCCESS);
  };

  const deleteStickyNote = (id: string) => {
    if (window.confirm('Delete this note?')) {
        setStickyNotes(prev => prev.filter(n => n.id !== id));
        playSound(SOUNDS.CLICK);
    }
  };

  const openStickyEditor = (note?: StickyNote) => {
    if (note) { setEditingNote(note); setNoteContent(note.text); setNoteColor(note.color); } 
    else { setEditingNote(null); setNoteContent(''); setNoteColor(NOTE_THEMES[0].name); }
    setIsNoteEditorOpen(true);
    playSound(SOUNDS.CLICK);
  };

  const stopPomoAlarm = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setPomodoroStatus('setup');
    setIsPomodoroModalOpen(false);
    playSound(SOUNDS.CLICK);
  };

  const abortPomodoro = () => {
    if (pomoTimerRef.current) clearInterval(pomoTimerRef.current);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setPomodoroStatus('setup');
    setIsPomodoroModalOpen(false);
    playSound(SOUNDS.CLICK);
  };

  const stopBreathing = () => {
    setBreathingStatus('setup');
    setIsBreathingModalOpen(false);
    if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
    playSound(SOUNDS.CLICK);
  };

  const addSampleData = () => {
    const sampleLogs: DailyLog[] = [];
    const now = new Date();
    for (let i = 0; i < 35; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const randSleep = 6.5 + Math.random() * 2;
      const randStudy = 2 + Math.random() * 4;
      const log = {
        date: dateStr,
        waterEntries: [{ id: Math.random().toString(), amount: 1.5, timestamp: '10:00 AM' }],
        sleepHours: Math.floor(randSleep), sleepMinutes: Math.round((randSleep % 1) * 60), sleepStart: "23:00", sleepEnd: "07:00",
        studySessions: [{ id: Math.random().toString(), duration: Math.floor(randStudy * 60), subject: 'Project Work', timestamp: '2:00 PM' }],
        exerciseEntries: Math.random() > 0.4 ? [{ id: Math.random().toString(), type: 'Running', duration: 30, timestamp: '7:00 AM' }] : [],
        screenTimeEntries: [], moneyEntries: [], redeemedRewards: [], completedHabits: Math.random() > 0.3 ? ['h1', 'h2'] : [], customActivitiesData: {}, todos: [],
        happinessPillars: { physical: true, problemSolving: true, helping: false, creative: false, explore: false, learning: true, ideas: false, qualityTime: false, progression: true },
        skincare: { morning: true, afternoon: false, night: true }, 
        energyLevels: { morning: 6, afternoon: 7, evening: 5, night: 4 },
        meals: { breakfast: true, lunch: true, dinner: true, notes: "" },
        junkFood: 0, junkFoodNotes: "", screenTimeHours: 2, screenTimeMinutes: 30, screenTimeNotes: "",
        mood: 7, moodNotes: "", goalsCompleted: 80, goalText: "", achievement: "Code refactor", journal: "Productive day", gratitude: "Coffee", social: [], socialNotes: "", newLearning: "", wakeUpTime: "07:00", bedtime: "23:30", selfCare: [], selfCareNotes: "", nutritionScore: "Healthy", distractions: [], distractionNotes: "", negativeThought: "", peaceLevel: 7, dayRating: 8, autoSummary: "", weeklyReflection: "", monthlyReview: "", breathingSessions: 0, mindDump: ""
      } as DailyLog;
      log.autoSummary = createSummaryText(log, settings, sampleLogs); 
      sampleLogs.push(log);
    }
    setLogs(sampleLogs);
    alert(`Loaded sample data for ${settings.userName}!`);
    playSound(SOUNDS.SUCCESS);
  };

  const saveIdentity = () => {
    setSettings(prev => ({ ...prev, userName: identityForm.userName, schoolName: identityForm.schoolName, collegeName: identityForm.collegeName }));
    setIsIdentityModalOpen(false);
    playSound(SOUNDS.SUCCESS);
  };

  const generateLocalSummary = () => {
    if (!isEditable) return;
    const summary = createSummaryText(currentLog, settings, logs);
    updateLog({ autoSummary: summary });
    playSound(SOUNDS.SUCCESS);
  };

  const filteredLogsForReport = useMemo(() => {
    return logs
      .filter(l => l.date >= reportStartDate && l.date <= reportEndDate)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [logs, reportStartDate, reportEndDate]);

  const reportStats = useMemo(() => {
    if (filteredLogsForReport.length === 0) return null;
    const count = filteredLogsForReport.length;
    const totalWater = filteredLogsForReport.reduce((acc, l) => acc + l.waterEntries.reduce((a,c)=>a+c.amount,0), 0);
    const totalStudyMins = filteredLogsForReport.reduce((acc, l) => acc + l.studySessions.reduce((a,c)=>a+c.duration,0), 0);
    const totalSleepMins = filteredLogsForReport.reduce((acc, l) => acc + (l.sleepHours * 60 + l.sleepMinutes), 0);
    const totalExerciseWorkouts = filteredLogsForReport.reduce((acc, l) => acc + (l.exerciseEntries?.length || 0), 0);
    const totalExerciseMins = filteredLogsForReport.reduce((acc, l) => acc + (l.exerciseEntries?.reduce((a,c)=>a+c.duration, 0) || 0), 0);
    const totalAchievements = filteredLogsForReport.filter(l => l.achievement.trim().length > 0).length;
    const avgMood = filteredLogsForReport.reduce((acc, l) => acc + l.mood, 0) / count;
    const avgPeace = filteredLogsForReport.reduce((acc, l) => acc + l.peaceLevel, 0) / count;
    const avgScreenTime = filteredLogsForReport.reduce((acc, l) => acc + (l.screenTimeHours + l.screenTimeMinutes / 60), 0) / count;
    return {
      avgWater: (totalWater / count).toFixed(2),
      avgStudy: (totalStudyMins / (count * 60)).toFixed(1),
      avgSleep: (totalSleepMins / (count * 60)).toFixed(1),
      avgMood: avgMood.toFixed(1),
      avgPeace: avgPeace.toFixed(1),
      avgScreenTime: avgScreenTime.toFixed(1),
      totalStudyHrs: (totalStudyMins / 60).toFixed(1),
      totalScreenHrs: filteredLogsForReport.reduce((acc, l) => acc + ((l.screenTimeHours || 0) + (l.screenTimeMinutes || 0)/60), 0).toFixed(1),
      totalExerciseWorkouts,
      totalExerciseMins,
      achievementsCount: totalAchievements,
      totalWaterL: totalWater.toFixed(1)
    };
  }, [filteredLogsForReport]);

  const calculateCorrelation = (xArr: number[], yArr: number[]): number | null => {
    if (xArr.length < 5 || xArr.length !== yArr.length) return null;
    const n = xArr.length;
    const sumX = xArr.reduce((a, b) => a + b, 0);
    const sumY = yArr.reduce((a, b) => a + b, 0);
    const sumXY = xArr.reduce((a, b, i) => a + b * yArr[i], 0);
    const sumX2 = xArr.reduce((a, b) => a + b * b, 0);
    const sumY2 = xArr.reduce((a, b) => a + b * b, 0);
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    return denominator === 0 ? 0 : numerator / denominator;
  };

  const getInterpretation = (r: number): string => {
    if (Math.abs(r) < 0.3) return "a weak relationship";
    if (Math.abs(r) < 0.7) return "a moderate relationship";
    return "a strong relationship";
  };

  const exportData = (format: 'csv' | 'json') => {
    // ... (Export logic unchanged) ...
    alert("Use the Review tab export button.");
  };

  const updateTargets = (type: 'water' | 'study' | 'exercise' | 'screenTime', period: 'daily' | 'weekly' | 'monthly', value: number) => {
      setSettings(prev => {
          const key = `${type}Targets` as keyof AppSettings;
          return {
              ...prev,
              [key]: {
                  ...(prev[key] as any),
                  [period]: value
              }
          };
      });
  };

  // --- App Lock Handlers ---
  const handleAppUnlock = () => {
    if (lockPasswordInput === (settings.appLockPassword || 'lodhi@123') || lockPasswordInput === MASTER_PASSWORD) {
        setIsAppLocked(false);
        setLockError(false);
        setLockPasswordInput('');
        playSound(SOUNDS.SUCCESS);
    } else {
        setLockError(true);
        setShowResetLock(true);
        playSound(SOUNDS.CLICK);
    }
  };

  const handleResetLock = () => {
    if (resetLockStep === 'verify') {
        if (resetLockInput === MASTER_PASSWORD) {
            setResetLockStep('new');
            setResetLockInput('');
            playSound(SOUNDS.SUCCESS);
        } else {
            alert('Incorrect Master Password');
            playSound(SOUNDS.CLICK);
        }
    } else {
        if (resetLockInput.length > 0) {
            setSettings({ ...settings, appLockPassword: resetLockInput });
            setIsAppLocked(false);
            setShowResetLock(false);
            setResetLockStep('verify');
            setResetLockInput('');
            setLockPasswordInput('');
            setLockError(false);
            alert('App Lock password updated!');
            playSound(SOUNDS.SUCCESS);
        } else {
            alert('New password cannot be empty.');
        }
    }
  };

  return (
    <div className="min-h-screen pb-32 text-slate-800 bg-[#fefcfb] dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300 relative">
      
      {/* App Lock Overlay */}
      {isAppLocked && (
        <div className="fixed inset-0 z-[9999] bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="w-full max-w-sm text-center">
                <div className="w-24 h-24 bg-rose-600 rounded-3xl flex items-center justify-center text-5xl text-white shadow-2xl mx-auto mb-8 shadow-rose-200 dark:shadow-rose-900/40">
                    🛡️
                </div>
                <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2">System Locked</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-8">Authorization Required</p>
                
                <div className="space-y-4">
                    <input 
                        type="password" 
                        value={lockPasswordInput}
                        onChange={e => { setLockPasswordInput(e.target.value); setLockError(false); }}
                        onKeyDown={e => e.key === 'Enter' && handleAppUnlock()}
                        placeholder="Enter App Password..."
                        className={`w-full bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl text-center text-xl font-bold border-2 outline-none transition-all ${lockError ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/10' : 'border-transparent focus:border-rose-500'}`}
                        autoFocus
                    />
                    
                    <button 
                        onClick={handleAppUnlock}
                        className="w-full bg-rose-600 text-white font-black py-5 rounded-2xl text-sm uppercase tracking-widest shadow-xl hover:bg-rose-700 active:scale-95 transition-all"
                    >
                        Unlock System
                    </button>

                    {showResetLock && (
                        <button 
                            onClick={() => {
                                const modal = document.getElementById('lock-reset-modal');
                                if (modal) (modal as any).showModal(); 
                            }}
                            className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-rose-500 mt-4 border-b border-transparent hover:border-rose-200 transition-colors"
                        >
                            Reset Password
                        </button>
                    )}
                </div>
            </div>

            {/* Reset Password Modal (Rendered conditionally inside lock screen) */}
            {showResetLock && (
                <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in zoom-in-95 duration-200">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] w-full max-w-sm border border-slate-200 dark:border-slate-800 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-rose-900 dark:text-rose-100 text-lg">
                                {resetLockStep === 'verify' ? 'Master Authorization' : 'Set New Password'}
                            </h3>
                            <button onClick={() => setShowResetLock(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        
                        <p className="text-xs text-slate-500 mb-4 leading-relaxed font-medium">
                            {resetLockStep === 'verify' 
                                ? 'Enter the Permanent Master Password to override the lock.' 
                                : 'Master Key accepted. Set your new App Lock password.'}
                        </p>

                        <input 
                            type={resetLockStep === 'verify' ? "password" : "text"}
                            value={resetLockInput}
                            onChange={e => setResetLockInput(e.target.value)}
                            placeholder={resetLockStep === 'verify' ? 'Master Password...' : 'New Password...'}
                            className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-sm font-bold border-2 border-transparent focus:border-rose-500 outline-none mb-4"
                        />

                        <button 
                            onClick={handleResetLock}
                            className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all"
                        >
                            {resetLockStep === 'verify' ? 'Verify Master Key' : 'Update Password'}
                        </button>
                    </div>
                </div>
            )}
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl border-b border-rose-50/50 dark:border-rose-900/30 px-6 py-5 no-print">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-rose-200 dark:shadow-rose-900/20 overflow-hidden">
                {settings.profilePicture ? (
                    <img src={settings.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <span className="font-serif font-black text-xl">{settings.userName?.charAt(0) || 'H'}</span>
                )}
             </div>
             <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-serif font-black text-rose-900 dark:text-rose-100 leading-none">{settings.userName}</h1>
                  <button 
                    onClick={() => { playSound(SOUNDS.CLICK); setView('money'); }}
                    className="p-1 text-rose-200 hover:text-amber-500 transition-colors"
                    aria-label="Private Ledger"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </button>
                  <button 
                    onClick={() => { playSound(SOUNDS.CLICK); setIsHelpModalOpen(true); }}
                    className="p-1 text-rose-200 hover:text-sky-500 transition-colors"
                    aria-label="User Guide"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </button>
                </div>
                <p className="text-[9px] font-black text-rose-300 uppercase tracking-[0.3em] mt-1.5">Master Dashboard</p>
             </div>
          </div>
          <div className="relative">
              <input 
                type="date" 
                max={todayStr}
                value={currentDate} 
                onChange={e => { playSound(SOUNDS.CLICK); setCurrentDate(e.target.value); }} 
                className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-2.5 text-rose-900 dark:text-rose-100 font-black text-[11px] outline-none hover:bg-rose-50 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-sm" 
              />
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-8">
        <div className="no-print">
          {view === 'today' && <TodayView 
            currentLog={currentLog} updateLog={updateLog} isEditable={isEditable} settings={settings} playSound={playSound}
            addFloatingPoint={addFloatingPoint} removeFloatingPoint={removeFloatingPoint} floatingPoints={floatingPoints}
            todayWater={todayWater} todayStudyMinutes={todayStudyMinutes} cumulativeLifeScore={cumulativeLifeScore}
            currentDate={currentDate} isToday={isToday} isScoreBreakdownOpen={isScoreBreakdownOpen} setIsScoreBreakdownOpen={setIsScoreBreakdownOpen}
            getPointsBreakdown={(l) => getPointsBreakdown(l, settings, logs)} currentDailyNetScore={currentDailyNetScore} yesterdayLog={yesterdayLog} yesterdayDailyNetScore={yesterdayDailyNetScore}
            todayStr={todayStr} isTodoModalOpen={isTodoModalOpen} setIsTodoModalOpen={setIsTodoModalOpen} newTodoQuadrant={newTodoQuadrant} setNewTodoQuadrant={setNewTodoQuadrant}
            generateLocalSummary={generateLocalSummary} handleSleepTimeChange={handleSleepTimeChange} logs={logs} setSettings={setSettings}
          />}
          {view === 'habits' && <HabitsView 
            logs={logs} currentLog={currentLog} updateLog={updateLog} settings={settings} isEditable={isEditable}
            addFloatingPoint={addFloatingPoint} removeFloatingPoint={removeFloatingPoint} floatingPoints={floatingPoints} playSound={playSound}
            isPomodoroModalOpen={isPomodoroModalOpen} setIsPomodoroModalOpen={setIsPomodoroModalOpen} isBreathingModalOpen={isBreathingModalOpen} setIsBreathingModalOpen={setIsBreathingModalOpen}
            pomodoroStatus={pomodoroStatus} setPomodoroStatus={setPomodoroStatus} pomoHours={pomoHours} setPomoHours={setPomoHours} pomoMinutes={pomoMinutes} setPomoMinutes={setPomoMinutes}
            pomoSubject={pomoSubject} setPomoSubject={setPomoSubject} timeRemaining={timeRemaining} setTimeRemaining={setTimeRemaining} stopPomoAlarm={stopPomoAlarm} abortPomodoro={abortPomodoro}
            audioRef={audioRef} pomoTimerRef={pomoTimerRef} breathingStatus={breathingStatus} setBreathingStatus={setBreathingStatus} breathingTimeRemaining={breathingTimeRemaining} setBreathingTimeRemaining={setBreathingTimeRemaining}
            breathingPhaseRemaining={breathingPhaseRemaining} setBreathingPhaseRemaining={setBreathingPhaseRemaining} stopBreathing={stopBreathing} selectedHabitForCalendar={selectedHabitForCalendar} setSelectedHabitForCalendar={setSelectedHabitForCalendar} todayStr={todayStr}
          />}
          {view === 'sticky-notes' && <StickyNotesView 
            stickyNotes={stickyNotes} setStickyNotes={setStickyNotes} openStickyEditor={openStickyEditor} isNoteEditorOpen={isNoteEditorOpen} setIsNoteEditorOpen={setIsNoteEditorOpen}
            editingNote={editingNote} noteContent={noteContent} setNoteContent={setNoteContent} noteColor={noteColor} setNoteColor={setNoteColor} saveStickyNote={saveStickyNote} deleteStickyNote={deleteStickyNote} playSound={playSound}
          />}
          {view === 'trends' && <TrendsView 
            logs={logs} trendStartDate={trendStartDate} setTrendStartDate={setTrendStartDate} trendEndDate={trendEndDate} setTrendEndDate={setTrendEndDate} calculateCorrelation={calculateCorrelation} getInterpretation={getInterpretation} playSound={playSound} todayStr={todayStr} settings={settings}
          />}
          {view === 'rewards' && <RewardsView 
            cumulativeLifeScore={cumulativeLifeScore} isEditable={isEditable} settings={settings} currentLog={currentLog} updateLog={updateLog} addFloatingPoint={addFloatingPoint} playSound={playSound}
          />}
          {view === 'review' && <ReviewView 
            reportStartDate={reportStartDate} setReportStartDate={setReportStartDate} reportEndDate={reportEndDate} setReportEndDate={setReportEndDate} todayStr={todayStr} playSound={playSound}
            reportStats={reportStats} currentLog={currentLog} updateLog={updateLog} filteredLogsForReport={filteredLogsForReport} exportData={exportData} settings={settings} logs={logs}
          />}
          {view === 'settings' && <SettingsView 
            settings={settings} setSettings={setSettings} addSampleData={addSampleData} setLogs={setLogs} setGallery={setGallery} isIdentityModalOpen={isIdentityModalOpen} setIsIdentityModalOpen={setIsIdentityModalOpen}
            identityForm={identityForm} setIdentityForm={setIdentityForm} saveIdentity={saveIdentity} playSound={playSound} todayStr={todayStr}
            stickyNotes={stickyNotes} setStickyNotes={setStickyNotes} gallery={gallery} masterPassword={MASTER_PASSWORD}
          />}
          {view === 'about' && <AboutView 
            aboutMeData={aboutMeData} setAboutMeData={setAboutMeData} isEditingAboutMe={isEditingAboutMe} setIsEditingAboutMe={setIsEditingAboutMe} tempAboutMe={tempAboutMe} setTempAboutMe={setTempAboutMe} settings={settings} playSound={playSound}
          />}
          {view === 'gallery' && <GalleryView 
            gallery={gallery} setGallery={setGallery} selectedGalleryItem={selectedGalleryItem} setSelectedGalleryItem={setSelectedGalleryItem} playSound={playSound} setView={setView}
          />}
          {view === 'money' && <MoneyView 
            logs={logs} moneyStartDate={moneyStartDate} setMoneyStartDate={setMoneyStartDate} moneyEndDate={moneyEndDate} setMoneyEndDate={setMoneyEndDate} totalAvailableBalance={totalAvailableBalance} currentDate={currentDate} updateLog={updateLog} isEditable={isEditable} currentLog={currentLog} playSound={playSound} todayStr={todayStr}
            settings={settings} setSettings={setSettings}
          />}
          {view === 'goals' && <GoalsView logs={logs} settings={settings} currentDate={currentDate} playSound={playSound} updateTargets={updateTargets} />}
          {view === 'skills' && <SkillTreeView settings={settings} setSettings={setSettings} playSound={playSound} todayStr={todayStr} addFloatingPoint={addFloatingPoint} />}
        </div>

        <nav className="fixed bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-max max-w-[95vw] mx-auto bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] border border-white dark:border-slate-800 p-2.5 flex items-center gap-2 z-50 no-print overflow-x-auto scrollbar-hide">
          <button onClick={() => { playSound(SOUNDS.CLICK); setView('today'); }} className={`shrink-0 p-5 rounded-3xl transition-all duration-300 ${view === 'today' ? 'bg-rose-500 text-white shadow-xl shadow-rose-200 dark:shadow-rose-900/40' : 'text-slate-300 hover:text-rose-400 hover:bg-white dark:hover:bg-slate-800'}`} aria-label="Today"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></button>
          <button onClick={() => { playSound(SOUNDS.CLICK); setView('habits'); }} className={`shrink-0 p-5 rounded-3xl transition-all duration-300 ${view === 'habits' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 dark:shadow-indigo-900/40' : 'text-slate-300 hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800'}`} aria-label="Habits"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14l2.879 2.121z" /></svg></button>
          <button onClick={() => { playSound(SOUNDS.CLICK); setView('skills'); }} className={`shrink-0 p-5 rounded-3xl transition-all duration-300 ${view === 'skills' ? 'bg-cyan-600 text-white shadow-xl shadow-cyan-200 dark:shadow-cyan-900/40' : 'text-slate-300 hover:text-cyan-500 hover:bg-white dark:hover:bg-slate-800'}`} aria-label="Skills"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg></button>
          <button onClick={() => { playSound(SOUNDS.CLICK); setView('goals'); }} className={`shrink-0 p-5 rounded-3xl transition-all duration-300 ${view === 'goals' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200 dark:shadow-emerald-900/40' : 'text-slate-300 hover:text-emerald-500 hover:bg-white dark:hover:bg-slate-800'}`} aria-label="Goals"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
          <button onClick={() => { playSound(SOUNDS.CLICK); setView('sticky-notes'); }} className={`shrink-0 p-5 rounded-3xl transition-all duration-300 ${view === 'sticky-notes' ? 'bg-amber-500 text-white shadow-xl shadow-amber-200 dark:shadow-amber-900/40' : 'text-slate-300 hover:text-amber-500 hover:bg-white dark:hover:bg-slate-800'}`} aria-label="Sticky Notes"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
          <button onClick={() => { playSound(SOUNDS.CLICK); setView('trends'); }} className={`shrink-0 p-5 rounded-3xl transition-all duration-300 ${view === 'trends' ? 'bg-blue-500 text-white shadow-xl shadow-blue-200 dark:shadow-blue-900/40' : 'text-slate-300 hover:text-blue-500 hover:bg-white dark:hover:bg-slate-800'}`} aria-label="Trends"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg></button>
          <button onClick={() => { playSound(SOUNDS.CLICK); setView('rewards'); }} className={`shrink-0 p-5 rounded-3xl transition-all duration-300 ${view === 'rewards' ? 'bg-purple-500 text-white shadow-xl shadow-purple-200 dark:shadow-purple-900/40' : 'text-slate-300 hover:text-purple-500 hover:bg-white dark:hover:bg-slate-800'}`} aria-label="Rewards"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg></button>
          <button onClick={() => { playSound(SOUNDS.CLICK); setView('review'); }} className={`shrink-0 p-5 rounded-3xl transition-all duration-300 ${view === 'review' ? 'bg-teal-500 text-white shadow-xl shadow-teal-200 dark:shadow-teal-900/40' : 'text-slate-300 hover:text-teal-500 hover:bg-white dark:hover:bg-slate-800'}`} aria-label="Review"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg></button>
          <button onClick={() => { playSound(SOUNDS.CLICK); setView('gallery'); }} className={`shrink-0 p-5 rounded-3xl transition-all duration-300 ${view === 'gallery' ? 'bg-pink-500 text-white shadow-xl shadow-pink-200 dark:shadow-pink-900/40' : 'text-slate-300 hover:text-pink-500 hover:bg-white dark:hover:bg-slate-800'}`} aria-label="Gallery"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
          <button onClick={() => { playSound(SOUNDS.CLICK); setView('settings'); }} className={`shrink-0 p-5 rounded-3xl transition-all duration-300 ${view === 'settings' ? 'bg-slate-500 text-white shadow-xl shadow-slate-200 dark:shadow-slate-900/40' : 'text-slate-300 hover:text-slate-500 hover:bg-white dark:hover:bg-slate-800'}`} aria-label="Settings"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.066 2.573c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
          <button onClick={() => { playSound(SOUNDS.CLICK); setView('about'); }} className={`shrink-0 p-5 rounded-3xl transition-all duration-300 ${view === 'about' ? 'bg-orange-500 text-white shadow-xl shadow-orange-200 dark:shadow-orange-900/40' : 'text-slate-300 hover:text-orange-500 hover:bg-white dark:hover:bg-slate-800'}`} aria-label="About"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
        </nav>
      </main>

      <Modal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} title="Master Dashboard: User Guide & Strategy Manual">
        <div className="space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            
            <section className="space-y-3 bg-rose-50 dark:bg-rose-900/20 p-6 rounded-3xl border border-rose-100 dark:border-rose-800">
                <h4 className="text-lg font-serif font-bold text-rose-900 dark:text-rose-100">Welcome to your Master Dashboard.</h4>
                <p>This is not just a to-do list; it is a <strong>Life Operating System</strong>. It is designed to gamify your existence, track your consistency, and provide mathematical proof of your progress. It runs entirely offline in your browser, keeping your data private.</p>
            </section>

            <section className="space-y-3">
                <h4 className="text-base font-bold text-indigo-700 dark:text-indigo-300 border-b border-slate-200 dark:border-slate-700 pb-2">1. The Dashboard (Today View) 🏠</h4>
                <p>This is your command center. You start here every morning.</p>
                <ul className="list-disc pl-5 space-y-2 marker:text-rose-400">
                    <li><strong>The Level Banner:</strong> Your RPG status. Click to see hierarchy. Earn XP for every positive action.</li>
                    <li><strong>Vital Stats:</strong> Hydration, Productive Hours, and Life Score. Click "Daily Score" for breakdown.</li>
                    <li><strong>Deadline Radar:</strong> Tracks academic/project due dates. Color codes urgency (Red &lt; 3 days).</li>
                    <li><strong>Mission Control:</strong> Uses the Eisenhower Matrix (Urgent vs Important) to prioritize tasks.</li>
                    <li><strong>Pillars of Happiness:</strong> 9 core areas to balance daily life.</li>
                    <li><strong>Custom Activities:</strong> Track user-defined metrics (e.g., Cold Shower, Piano).</li>
                    <li><strong>Energy & Wellness:</strong> Log Energy (4x/day), Mood, Peace, and Nutrition.</li>
                    <li><strong>Journaling:</strong> Mind Dump, Gratitude, and Daily Chronicle.</li>
                    <li><strong>AI Summary:</strong> Click "⚡ Update" to auto-generate a text summary of your day.</li>
                </ul>
            </section>

            <section className="space-y-3">
                <h4 className="text-base font-bold text-indigo-700 dark:text-indigo-300 border-b border-slate-200 dark:border-slate-700 pb-2">2. Consistency Hub (Habits View) 🔥</h4>
                <ul className="list-disc pl-5 space-y-2 marker:text-rose-400">
                    <li><strong>Daily Habits:</strong> Check off non-negotiables. Streaks &gt;7 days get 1.5x points; &gt;30 days get 2x points.</li>
                    <li><strong>Daily Time Audit:</strong> (Orange Clock) Track activity every 30 minutes to find wasted time.</li>
                    <li><strong>Breathing Exercise:</strong> (Green Leaf) 4-7-8 breathing visualizer for calmness.</li>
                    <li><strong>Pomodoro Timer:</strong> (Red Clock) Focus timer. Keep app open while running.</li>
                </ul>
            </section>

            <section className="space-y-3">
                <h4 className="text-base font-bold text-indigo-700 dark:text-indigo-300 border-b border-slate-200 dark:border-slate-700 pb-2">3. Skill Tree (Skills View) 🧬</h4>
                <p>Turn life into an RPG. Define skills (e.g., "Python", "Fitness") and set hour targets.</p>
                <ul className="list-disc pl-5 space-y-2 marker:text-rose-400">
                    <li><strong>Level System:</strong> The app divides your target hours into 30 Levels.</li>
                    <li><strong>Logging:</strong> Log practice time to gain XP and level up from Novice to Grandmaster.</li>
                </ul>
            </section>

            <section className="space-y-3">
                <h4 className="text-base font-bold text-indigo-700 dark:text-indigo-300 border-b border-slate-200 dark:border-slate-700 pb-2">4. Target Command Center (Goals View) 🎯</h4>
                <ul className="list-disc pl-5 space-y-2 marker:text-rose-400">
                    <li><strong>PDS (Productivity Daily Score):</strong> A 0-100% efficiency score based on Deep Work, Exercise, Energy, and Screen Time.</li>
                    <li><strong>Targets:</strong> Set specific goals for Water, Study, Exercise, and Screen Limits for Daily, Weekly, and Monthly periods.</li>
                </ul>
            </section>

            <section className="space-y-3">
                <h4 className="text-base font-bold text-indigo-700 dark:text-indigo-300 border-b border-slate-200 dark:border-slate-700 pb-2">5. Private Ledger (Money View) 🏦</h4>
                <p>Offline finance tracker.</p>
                <ul className="list-disc pl-5 space-y-2 marker:text-rose-400">
                    <li>Log Income (Green) and Expenses (Red).</li>
                    <li>Manage custom categories.</li>
                    <li>Visualize spending with Pie Charts.</li>
                </ul>
            </section>

            <section className="space-y-3">
                <h4 className="text-base font-bold text-indigo-700 dark:text-indigo-300 border-b border-slate-200 dark:border-slate-700 pb-2">6. Personal Insights (Trends View) 📈</h4>
                <ul className="list-disc pl-5 space-y-2 marker:text-rose-400">
                    <li><strong>Line Charts:</strong> Visualize Sleep, Mood, Study, etc. over time.</li>
                    <li><strong>Correlation Inspector:</strong> Select two metrics (e.g., Sleep vs Mood) to see if they are mathematically linked (+1.0 to -1.0).</li>
                </ul>
            </section>

            <section className="space-y-3">
                <h4 className="text-base font-bold text-indigo-700 dark:text-indigo-300 border-b border-slate-200 dark:border-slate-700 pb-2">7. Other Modules</h4>
                <ul className="list-disc pl-5 space-y-2 marker:text-rose-400">
                    <li><strong>Sticky Notes 📝:</strong> Quick temporary reminders and thoughts.</li>
                    <li><strong>Rewards Marketplace 🎁:</strong> Spend your Life Score on leisure. Add manual bonuses for good deeds or penalties for mistakes.</li>
                    <li><strong>Review & Export 🗓️:</strong> Generate professional performance reports (Print/PDF) or export JSON backups.</li>
                    <li><strong>Life Gallery 🖼️:</strong> Store key photo memories (Keep file sizes small).</li>
                </ul>
            </section>

            <section className="space-y-3">
                <h4 className="text-base font-bold text-indigo-700 dark:text-indigo-300 border-b border-slate-200 dark:border-slate-700 pb-2">8. Settings & Identity ⚙️</h4>
                <ul className="list-disc pl-5 space-y-2 marker:text-rose-400">
                    <li><strong>Identity Matrix:</strong> Define your Vision, Role Models, and 10-Year Plan.</li>
                    <li><strong>App Lock:</strong> Secure your journal with a password.</li>
                    <li><strong>Data:</strong> Import/Export backups regularly.</li>
                </ul>
            </section>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-3xl mt-6">
                <h4 className="font-bold text-indigo-900 dark:text-indigo-100 mb-2">🚀 How to Start?</h4>
                <ol className="list-decimal pl-5 space-y-1 text-indigo-800 dark:text-indigo-200">
                    <li>Go to <strong>Settings</strong> and fill out your Identity (Name, Vision).</li>
                    <li>Set up your <strong>Habits</strong> and <strong>Rewards</strong>.</li>
                    <li>Go to the <strong>Today</strong> tab and start logging your life!</li>
                </ol>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;
