import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Mic, MicOff, Send, Upload, User, BarChart2, MessageSquare, Menu, X, Zap, Target, Search, PlusCircle, Award } from 'lucide-react';

// === Firebase & API Configuration ===
// These variables are provided by the canvas environment. Do not modify.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// The backend API calls are simulated within this file due to the single-file immersive constraint.
// In a real-world scenario, these would be separate Node.js endpoints.
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=`;
const GEMINI_IMG_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=`;

// === Utility Functions ===
// Helper for UUID generation
const generateUUID = () => crypto.randomUUID();

// === Translations & Data ===
const translations = {
  en: {
    chatTitle: "Chatbot",
    chatPlaceholder: "Type your message...",
    disclaimer: "Note: This chatbot provides guidance and support. It is not a substitute for professional medical or leadership advice.",
    sidebarTitle: "ShiftWyse 2.0",
    chatNav: "Chat",
    knowledgeBaseNav: "Knowledge Base",
    analyticsNav: "Analytics Dashboard",
    competencyNav: "Competency Snapshot",
    mentorMatchNav: "Mentor Match",
    userId: "User ID:",
    uploadTitle: "Dynamic Knowledge Integration",
    uploadText: "Upload a leadership framework or policy document (e.g., PDF) to enhance the chatbot's knowledge base.",
    uploadButton: "Choose Document",
    processing: "Processing document...",
    processed: "Document processed successfully. Insights are now available to the chatbot!",
    analyticsTitle: "Aggregated Competency Trends",
    analyticsText: "Anonymized data showing key leadership competency trends across the organization.",
    generateData: "Generate Mock Data",
    boostButton: "Daily Boost",
    closeButton: "Close",
    competencyTitle: "Competency Snapshot",
    competencyText: "Rate yourself on key leadership competencies. Your scores will be saved and tracked.",
    saveButton: "Save Snapshot",
    competencies: {
      strategicVision: "Strategic Vision",
      communication: "Communication",
      teamLeadership: "Team Leadership",
      ethicalPractice: "Ethical Practice",
      conflictResolution: "Conflict Resolution"
    },
    snapshotSaved: "Snapshot saved successfully!",
    selectSnapshot: "Select a snapshot:",
    yourSnapshot: "Your Latest Snapshot",
    mentorMatchTitle: "Mentor Match",
    mentorMatchText: "Connect with experienced leaders. View a list of mentors or become one yourself.",
    becomeAMentor: "Become a Mentor",
    findMentors: "Find Mentors",
    mentorListTitle: "Available Mentors",
    noMentors: "No mentors available yet. Be the first to add a profile!",
    mentorName: "Name",
    mentorExpertise: "Expertise",
    mentorBio: "Bio",
    mentorContact: "Contact Email",
    submitProfile: "Submit Profile",
    addMentorTitle: "Add Your Mentor Profile",
    addMentorText: "Fill in your details to be listed as a mentor for others.",
    profileSaved: "Mentor profile saved successfully!",
    contactMentor: "Contact Mentor",
  },
  zu: {
    chatTitle: "I-Chatbot",
    chatPlaceholder: "Thayipha umyalezo wakho...",
    disclaimer: "Qaphela: Le chatbot inikeza isiqondiso nokweseka. Akuyona indawo yeseluleko esingochwepheshe kwezempilo noma ezobuholi.",
    sidebarTitle: "ShiftWyse 2.0",
    chatNav: "Ingxoxo",
    knowledgeBaseNav: "Isizinda Solwazi",
    analyticsNav: "Ideshibhodi Yezibalo",
    competencyNav: "Isithombe Esifushane Samakhono",
    mentorMatchNav: "Ukufaniswa Komeluleki",
    userId: "I-ID Yomsebenzisi:",
    uploadTitle: "Ukuhlanganiswa Kolwazi Oluguquguqukayo",
    uploadText: "Layisha uhlaka lobuholi noma umqulu wenqubomgomo (isb., i-PDF) ukuze uthuthukise isizinda solwazi se-chatbot.",
    uploadButton: "Khetha Umqulu",
    processing: "Icubungula umqulu...",
    processed: "Umqulu ucubungulwe ngempumelelo. Ulwazi oluphakeme manje luyatholakala kwi-chatbot!",
    analyticsTitle: "Amasu Wobuchule Abuthwele",
    analyticsText: "Idatha engaziwa ekhombisa amasiko amakhono obuholi obuthuthukisiwe enhlangano.",
    generateData: "Khiqiza Idatha Yento Eyinto",
    boostButton: "Ukukhuthaza Kwansuku Zonke",
    closeButton: "Vala",
    competencyTitle: "Isithombe Esifushane Samakhono",
    competencyText: "Zilinganisele emakhonweni abalulekile obuholi. Izikolo zakho zizogcinwa futhi zilandelwe.",
    saveButton: "Gcina Isithombe Esifushane",
    competencies: {
      strategicVision: "Umbono Wesu",
      communication: "Ukuxhumana",
      teamLeadership: "Ubuholi Bethimba",
      ethicalPractice: "Ukuziphatha Okufanelekile",
      conflictResolution: "Ukuxazulula Izinkinga"
    },
    snapshotSaved: "Isithombe esifushane sigcinwe ngempumelelo!",
    yourSnapshot: "Isithombe Sakho Esifushane Esisha",
    mentorMatchTitle: "Ukufaniswa Komeluleki",
    mentorMatchText: "Xhumana nabaholi abanolwazi. Buka uhlu lwabeluleki noma ube ngumeluleki wena.",
    becomeAMentor: "Yiba Umeluleki",
    findMentors: "Thola Abeluleki",
    mentorListTitle: "Abeluleki Abatholakalayo",
    noMentors: "Akekho abeluleki abatholakalayo okwamanje. Yiba ngowokuqala ukwengeza iphrofayela!",
    mentorName: "Igama",
    mentorExpertise: "Ubuchwepheshe",
    mentorBio: "Umlando",
    mentorContact: "I-imeyili Yokuxhumana",
    submitProfile: "Thumela Iphrofayela",
    addMentorTitle: "Engeza Iphrofayela Yakho Yomeluleki",
    addMentorText: "Faka imininingwane yakho ukuze ubhalwe njengomeluleki wabanye.",
    profileSaved: "Iphrofayela yomeluleki igcinwe ngempumelelo!",
    contactMentor: "Xhumana Nomeluleki",
  },
  af: {
    chatTitle: "Kletsbot",
    chatPlaceholder: "Tik jou boodskap...",
    disclaimer: "Let wel: Hierdie kletsbot bied leiding en ondersteuning. Dit is nie 'n plaasvervanger vir professionele mediese of leierskapadvies nie.",
    sidebarTitle: "ShiftWyse 2.0",
    chatNav: "Klets",
    knowledgeBaseNav: "Kennisbasis",
    analyticsNav: "Analitiese Dashboard",
    competencyNav: "Bevoegdheidsmomentopname",
    mentorMatchNav: "Mentor Pasmaat",
    userId: "Gebruiker-ID:",
    uploadTitle: "Dinamiese Kennisintegrasie",
    uploadText: "Laai 'n leierskapsraamwerk of beleidsdokument (bv. PDF) op om die kletsbot se kennisbasis te verbeter.",
    uploadButton: "Kies Dokument",
    processing: "Verwerk dokument...",
    processed: "Dokument suksesvol verwerk. Insigte is nou beskikbaar vir die kletsbot!",
    analyticsTitle: "Geaggregeerde Vaardigheidstendense",
    analyticsText: "Anonieme data wat sleutel leierskapsvaardigheidstendense oor die organisasie toon.",
    generateData: "Genereer Skyn Data",
    boostButton: "Daaglikse Hupstoot",
    closeButton: "Sluit",
    competencyTitle: "Bevoegdheidsmomentopname",
    competencyText: "Beoordeel jouself oor sleutel leierskapsvaardighede. Jou tellings sal gestoor en nagespoor word.",
    saveButton: "Stoor Momentopname",
    competencies: {
      strategicVision: "Strategiese Visie",
      communication: "Kommunikasie",
      teamLeadership: "Spanleierskap",
      ethicalPractice: "Etiese Praktyk",
      conflictResolution: "Konflikoplossing"
    },
    snapshotSaved: "Momentopname suksesvol gestoor!",
    yourSnapshot: "Jou Jongste Momentopname",
    mentorMatchTitle: "Mentor Pasmaat",
    mentorMatchText: "Verbind met ervare leiers. Bekyk 'n lys van mentors of word self een.",
    becomeAMentor: "Word 'n Mentor",
    findMentors: "Vind Mentors",
    mentorListTitle: "Beskikbare Mentors",
    noMentors: "Geen mentors beskikbaar nie. Wees die eerste om 'n profiel by te voeg!",
    mentorName: "Naam",
    mentorExpertise: "Kundigheid",
    mentorBio: "Bio",
    mentorContact: "Kontak E-pos",
    submitProfile: "Dien Profiel In",
    addMentorTitle: "Voeg Jou Mentorprofiel by",
    addMentorText: "Vul jou besonderhede in om as 'n mentor vir ander gelys te word.",
    profileSaved: "Mentorprofiel suksesvol gestoor!",
    contactMentor: "Kontak Mentor",
  },
  xh: {
    chatTitle: "I-Chatbot",
    chatPlaceholder: "Chwetheza umyalezo wakho...",
    disclaimer: "Qaphela: Le chatbot ibonelela ngesikhokelo nenkxaso. Ayilifihli igqwetha elinika iingcebiso zobugqirha okanye zobunkokeli.",
    sidebarTitle: "ShiftWyse 2.0",
    chatNav: "Ncokola",
    knowledgeBaseNav: "Isiseko Solwazi",
    analyticsNav: "Ideshibhodi Ye-Analitiki",
    competencyNav: "Ulwazi Lwempumelelo",
    mentorMatchNav: "Umfanisi Wenkokeli",
    userId: "I-ID Yomsebenzisi:",
    uploadTitle: "Ulwazi Oluntsonkothileyo",
    uploadText: "Layisha isakhelo sobunkokeli okanye uxwebhu lwe-polisi (umz., i-PDF) ukwandisa ulwazi lwe-chatbot.",
    uploadButton: "Khetha Uxwebhu",
    processing: "Icubungula uxwebhu...",
    processed: "Uxwebhu lucubungulwe ngempumelelo. Ulwazi olukwafumaneka kwi-chatbot!",
    analyticsTitle: "Iimeko Zobuchule Eziqokelelweyo",
    analyticsText: "Idata engafihliyo ibonisa iimeko zobuchule zobunkokeli ezibalulekileyo kwiziko.",
    generateData: "Yenza Idatha Eyingamxolo",
    boostButton: "Ukukhuthaza Kwemihla Ngemihla",
    closeButton: "Vala",
    competencyTitle: "Ulwazi Lwempumelelo",
    competencyText: "Zilinganise kwiimpumelelo ezibalulekileyo zobunkokeli. Izikolo zakho ziya kugcinwa kwaye zilandelelwe.",
    saveButton: "Gcina Ulwazi",
    competencies: {
      strategicVision: "Umbono Wobunkokeli",
      communication: "Unxibelelwano",
      teamLeadership: "Ubunkokeli Bethimba",
      ethicalPractice: "Ukuziphatha Ngokufanelekileyo",
      conflictResolution: "Ukuxazulula Izinkinga"
    },
    snapshotSaved: "Ulwazi lugcinwe ngempumelelo!",
    yourSnapshot: "Ulwazi Lwakho Olutsha",
    mentorMatchTitle: "Umfanisi Wenkokeli",
    mentorMatchText: "Xhumana nabaholi abanolwazi. Buka uluhlu lwabafanisi abanye ubenguye.",
    becomeAMentor: "Yiba Ngumfanisi",
    findMentors: "Fumana Abafanisi",
    mentorListTitle: "Abafanisi Abafumanekayo",
    noMentors: "Akukho bafanisi bafumanekayo okwangoku. Yiba ngowokuqala ukwenza iprofayili!",
    mentorName: "Igama",
    mentorExpertise: "Ulwazi",
    mentorBio: "Isishwankathelo",
    mentorContact: "I-imeyili Yonxibelelwano",
    submitProfile: "Ngenisa Iprofayili",
    addMentorTitle: "Yongeza Iprofayili Yakho Yomfanisi",
    addMentorText: "Faka iinkcukacha zakho ukuze ubaliswe njengomfanisi wabanye.",
    profileSaved: "Iprofayili yomfanisi igcinwe ngempumelelo!",
    contactMentor: "Xhumana Nomfanisi",
  },
};

// Daily leadership boosts in multiple languages
const dailyLeadershipBoosts = {
  en: [
    "'Leadership is not about being in charge. It's about taking care of those in your charge.' - Simon Sinek",
    "A leader is one who knows the way, goes the way, and shows the way. - John C. Maxwell",
    "Before you are a leader, success is all about growing yourself. When you become a leader, success is all about growing others. - Jack Welch",
    "The function of leadership is to produce more leaders, not more followers. - Ralph Nader"
  ],
  zu: [
    "'Ubuholi akukhona nje ukuba ngumphathi. Kumayelana nokunakekela labo abaphansi kwakho.' - Simon Sinek",
    "Umholi ungumuntu owazi indlela, ohamba indlela, futhi obonisa indlela. - John C. Maxwell",
    "Ngaphambi kokuba ube umholi, impumelelo imayelana nokuzikhulisa wena. Lapho usuba umholi, impumelelo imayelana nokukhulisa abanye. - Jack Welch",
    "Umsebenzi wobuholi ukukhiqiza abaholi abaningi, hhayi abalandeli abaningi. - Ralph Nader"
  ],
  af: [
    "'Leierskap gaan nie oor om in beheer te wees nie. Dit gaan daaroor om te sorg vir diegene in jou beheer.' - Simon Sinek",
    "’n Leier is een wat die pad ken, die pad loop en die pad wys. - John C. Maxwell",
    "Voordat jy ’n leier is, gaan sukses daaroor om jouself te laat groei. Wanneer jy ’n leier word, gaan sukses daaroor om ander te laat groei. - Jack Welch",
    "Die funksie van leierskap is om meer leiers te produseer, nie meer volgelinge nie. - Ralph Nader"
  ],
  xh: [
    "'Ubunkokeli asikuko ukuba yintloko. Bubukho bokukhathalela abo ubakhokelayo.' - Simon Sinek",
    "Inkokeli yileyo eyazi indlela, ehamba indlela, kwaye ibonise indlela. - John C. Maxwell",
    "Phambi kokuba ube yinkokeli, impumelelo imalunga nokuzikhulisa wena. Xa usiba yinkokeli, impumelelo imalunga nokukhu lula abanye. - Jack Welch",
    "Umsebenzi wobunkokeli kukuzala iinkokeli ezingaphezulu, hayi abalandeli abaninzi. - Ralph Nader"
  ]
};

// Function to get a daily leadership boost based on the current date
const getDailyLeadershipBoost = (language) => {
  const boosts = dailyLeadershipBoosts[language] || dailyLeadershipBoosts.en;
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  return boosts[dayOfYear % boosts.length];
};

// === App Component ===
const App = () => {
  // === State Management ===
  const [currentPage, setCurrentPage] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [analyticsData, setAnalyticsData] = useState([]);
  const [language, setLanguage] = useState('en');
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [dailyBoostQuote, setDailyBoostQuote] = useState('');
  // New state for Competency Snapshot
  const initialCompetencyRatings = {
    strategicVision: 0,
    communication: 0,
    teamLeadership: 0,
    ethicalPractice: 0,
    conflictResolution: 0,
  };
  const [competencyRatings, setCompetencyRatings] = useState(initialCompetencyRatings);
  const [savedSnapshots, setSavedSnapshots] = useState([]);
  const [snapshotMessage, setSnapshotMessage] = useState('');

  // New state for Mentor Match
  const [mentors, setMentors] = useState([]);
  const [isAddingMentor, setIsAddingMentor] = useState(false);
  const [newMentorProfile, setNewMentorProfile] = useState({ name: '', expertise: '', bio: '', contact: '' });
  const [mentorMessage, setMentorMessage] = useState('');


  // Firestore & Auth state
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);

  // References for UI and voice
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // === Firebase Initialization & Authentication ===
  useEffect(() => {
    // Initialize Firebase only once
    const app = initializeApp(firebaseConfig);
    const firestoreDb = getFirestore(app);
    const firebaseAuth = getAuth(app);
    setDb(firestoreDb);
    setAuth(firebaseAuth);

    // Listen for auth state changes and sign in
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setIsAuthenticated(true);
        // Load messages for the authenticated user
        fetchMessages(user.uid);
        // Load analytics data (if manager)
        fetchAnalyticsData(user.uid);
        // Load competency snapshots
        fetchCompetencySnapshots(user.uid);
        // Load mentors
        fetchMentors();
      } else {
        // If not authenticated, sign in with the custom token or anonymously
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(firebaseAuth, initialAuthToken);
          } else {
            await signInAnonymously(firebaseAuth);
          }
        } catch (error) {
          console.error("Firebase Auth error:", error);
          // Fallback for when authentication fails
          setUserId(generateUUID());
          setIsAuthenticated(false);
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Use a second useEffect to load data after authentication is ready
  useEffect(() => {
    if (isAuthenticated && userId) {
      // Check if user is a manager (for demonstration)
      const isManager = userId.startsWith('manager_');
      setIsManager(isManager);
      // Fetch data based on user type
      if (isManager) {
        fetchAnalyticsData(userId);
      } else {
        fetchMessages(userId);
      }
      fetchCompetencySnapshots(userId);
      fetchMentors();
    }
  }, [isAuthenticated, userId]);

  // === Chatbot Logic ===
  const getAssistantResponse = async (userMessage, userLanguage) => {
    // Determine the language name to include in the prompt
    const languageMap = {
      en: 'English',
      zu: 'isiZulu',
      af: 'Afrikaans',
      xh: 'isiXhosa',
    };
    const languageName = languageMap[userLanguage] || 'English';
    const prompt = `You are ShiftWyse, an AI-powered nurse leadership chatbot. Respond to the user's message in ${languageName}. The user's input is: "${userMessage}". Provide a supportive, encouraging response focused on nursing leadership and professional development. Use a friendly tone.`;

    const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = {
      contents: chatHistory,
      generationConfig: {
        responseMimeType: "text/plain",
      },
    };

    try {
      setLoading(true);
      const apiUrl = `${GEMINI_API_URL}`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      setLoading(false);
      return text || "I'm sorry, I couldn't generate a response at this time.";
    } catch (error) {
      console.error('Gemini API Error:', error);
      setLoading(false);
      return "I'm sorry, I am currently experiencing technical difficulties. Please try again later.";
    }
  };

  const sendMessage = async (message) => {
    if (!message.trim()) return;

    // Add user message to UI
    const userMessageObj = {
      id: generateUUID(),
      sender: 'user',
      text: message,
      timestamp: serverTimestamp(),
      userId: userId
    };
    setMessages(prevMessages => [...prevMessages, userMessageObj]);

    // Send to backend (simulated)
    try {
      // Save user message to Firestore
      await saveMessageToFirestore(userMessageObj);

      const assistantResponseText = await getAssistantResponse(message, language);
      const assistantMessageObj = {
        id: generateUUID(),
        sender: 'assistant',
        text: assistantResponseText,
        timestamp: serverTimestamp(),
        userId: 'shiftwyse'
      };

      // Add assistant message to UI
      setMessages(prevMessages => [...prevMessages, assistantMessageObj]);
      await saveMessageToFirestore(assistantMessageObj);

    } catch (error) {
      console.error('Error sending message:', error);
    }

    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage(input);
    }
  };

  const handleDailyBoost = () => {
    const boostQuote = getDailyLeadershipBoost(language);
    setDailyBoostQuote(boostQuote);
    setShowBoostModal(true);
  };

  // === Voice Input ===
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US'; // Set a default language

      recognition.onstart = () => {
        setIsListening(true);
        console.log('Voice recognition started.');
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setInput(transcript);
        sendMessage(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        // Clear input on error to prevent sending junk data
        setInput('');
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log('Voice recognition ended.');
      };

      recognitionRef.current = recognition;
    } else {
      console.warn('Web Speech API is not supported in this browser.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // === Firestore Database Operations ===
  const saveMessageToFirestore = async (message) => {
    if (!db || !userId) return;
    try {
      const chatRef = doc(collection(db, `artifacts/${appId}/users/${userId}/chats`), message.id);
      await setDoc(chatRef, message, { merge: true });
    } catch (error) {
      console.error("Error saving message to Firestore:", error);
    }
  };

  const fetchMessages = (currentUserId) => {
    if (!db || !currentUserId) return;
    const chatCollection = collection(db, `artifacts/${appId}/users/${currentUserId}/chats`);
    const q = query(chatCollection);
    onSnapshot(q, (snapshot) => {
      const fetchedChats = snapshot.docs.map(doc => doc.data());
      // Sort messages by timestamp
      fetchedChats.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(fetchedChats);
    });
  };

  // === Dynamic Knowledge Integration (NotebookLM) Simulation ===
  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setUploadMessage(translations[language].processing);

    // Simulate API call to NotebookLM. In a real app, this would send the file to
    // a Node.js backend which would then call the NotebookLM API.
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulated insights from NotebookLM
    const insights = {
      title: "Key Insights from Global Nursing Leadership Framework",
      summary: "This document highlights key competencies for nurse leaders, including strategic vision, communication, and team development. It emphasizes continuous learning and ethical decision-making.",
      keywords: ["leadership", "competency", "strategic vision", "ethics", "nursing"],
      id: generateUUID()
    };

    setUploadMessage(translations[language].processed);
    setLoading(false);

    // Save insights to a public collection for the chatbot to access
    if (db) {
      try {
        const insightsRef = doc(collection(db, `artifacts/${appId}/public/data/knowledgeBase`), insights.id);
        await setDoc(insightsRef, insights, { merge: true });
        console.log("Insights saved to Firestore.");
      } catch (error) {
        console.error("Error saving insights to Firestore:", error);
      }
    }
  };

  // === Analytics Dashboard ===
  const fetchAnalyticsData = (currentUserId) => {
    if (!db || !isManager) return;
    const analyticsCollection = collection(db, `artifacts/${appId}/public/data/analytics`);
    const q = query(analyticsCollection);
    onSnapshot(q, (snapshot) => {
      const fetchedData = snapshot.docs.map(doc => doc.data());
      setAnalyticsData(fetchedData);
    });
  };

  // Simulated data aggregation for the dashboard
  const aggregateData = () => {
    const competencyCounts = {};
    const microWinCounts = {};

    analyticsData.forEach(item => {
      if (item.type === 'competency') {
        const competency = item.data.competency || 'N/A';
        competencyCounts[competency] = (competencyCounts[competency] || 0) + 1;
      }
      if (item.type === 'micro-win') {
        const winType = item.data.winType || 'N/A';
        microWinCounts[winType] = (microWinCounts[winType] || 0) + 1;
      }
    });

    const competencyChartData = Object.keys(competencyCounts).map(key => ({
      name: key,
      'Competency Trends': competencyCounts[key]
    }));

    // Add some mock data to make the dashboard more interesting
    if (competencyChartData.length === 0) {
      return [
        { name: 'Strategic Vision', 'Competency Trends': 10 },
        { name: 'Communication', 'Competency Trends': 15 },
        { name: 'Team Leadership', 'Competency Trends': 20 },
        { name: 'Ethical Practice', 'Competency Trends': 12 },
      ];
    }
    return competencyChartData;
  };

  const chartData = aggregateData();

  const generateRandomAnalytics = async () => {
    if (!db || !isManager) return;
    const analyticsRef = collection(db, `artifacts/${appId}/public/data/analytics`);
    const mockData = [
      { type: 'competency', data: { competency: 'Strategic Vision' }, timestamp: serverTimestamp() },
      { type: 'competency', data: { competency: 'Team Leadership' }, timestamp: serverTimestamp() },
      { type: 'competency', data: { competency: 'Communication' }, timestamp: serverTimestamp() },
      { type: 'micro-win', data: { winType: 'Positive Feedback' }, timestamp: serverTimestamp() },
      { type: 'micro-win', data: { winType: 'Conflict Resolution' }, timestamp: serverTimestamp() },
    ];
    await addDoc(analyticsRef, mockData[Math.floor(Math.random() * mockData.length)]);
  };

  // === Competency Snapshot Logic ===
  const handleRatingChange = (competency, value) => {
    setCompetencyRatings(prev => ({
      ...prev,
      [competency]: parseInt(value, 10)
    }));
  };

  const saveCompetencySnapshot = async () => {
    if (!db || !userId) return;
    try {
      setLoading(true);
      const newSnapshot = {
        id: generateUUID(),
        userId: userId,
        timestamp: new Date().toISOString(), // Use ISO string for consistent date sorting
        ratings: competencyRatings,
      };
      const snapshotRef = doc(collection(db, `artifacts/${appId}/users/${userId}/competencySnapshots`), newSnapshot.id);
      await setDoc(snapshotRef, newSnapshot);
      setSnapshotMessage(translations[language].snapshotSaved);
      setCompetencyRatings(initialCompetencyRatings); // Reset form
      setLoading(false);
      // Fetch updated list of snapshots
      fetchCompetencySnapshots(userId);
    } catch (error) {
      console.error("Error saving competency snapshot:", error);
      setSnapshotMessage("Failed to save snapshot. Please try again.");
      setLoading(false);
    }
  };

  const fetchCompetencySnapshots = (currentUserId) => {
    if (!db || !currentUserId) return;
    const snapshotsCollection = collection(db, `artifacts/${appId}/users/${currentUserId}/competencySnapshots`);
    const q = query(snapshotsCollection);
    onSnapshot(q, (snapshot) => {
      const fetchedSnapshots = snapshot.docs.map(doc => doc.data());
      fetchedSnapshots.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // Sort by date ascending
      setSavedSnapshots(fetchedSnapshots);
    });
  };

  // === Mentor Match Logic ===
  const fetchMentors = () => {
    if (!db) return;
    const mentorsCollection = collection(db, `artifacts/${appId}/public/data/mentorProfiles`);
    const q = query(mentorsCollection);
    onSnapshot(q, (snapshot) => {
      const fetchedMentors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMentors(fetchedMentors);
    });
  };

  const handleMentorProfileChange = (e) => {
    const { name, value } = e.target;
    setNewMentorProfile(prev => ({ ...prev, [name]: value }));
  };

  const submitMentorProfile = async () => {
    if (!db || !userId) return;
    setLoading(true);
    setMentorMessage('');
    try {
      const profileData = {
        ...newMentorProfile,
        userId: userId,
        timestamp: serverTimestamp(),
      };
      const profilesRef = collection(db, `artifacts/${appId}/public/data/mentorProfiles`);
      await addDoc(profilesRef, profileData);
      setMentorMessage(translations[language].profileSaved);
      setNewMentorProfile({ name: '', expertise: '', bio: '', contact: '' });
      setIsAddingMentor(false);
    } catch (error) {
      console.error("Error submitting mentor profile:", error);
      setMentorMessage("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // === UI Components ===
  const renderSidebar = () => (
    <div className={`fixed inset-y-0 left-0 w-64 bg-gray-900 text-white p-4 space-y-4 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out z-50 md:relative md:translate-x-0`}>
      <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute top-4 right-4 text-white hover:text-gray-300">
        <X size={24} />
      </button>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{translations[language].sidebarTitle}</h2>
      </div>
      <nav className="space-y-2">
        <button onClick={() => { setCurrentPage('chat'); setIsSidebarOpen(false); }} className="w-full flex items-center px-4 py-2 rounded-lg text-left hover:bg-gray-700 transition-colors duration-200">
          <MessageSquare size={20} className="mr-3" />
          {translations[language].chatNav}
        </button>
        <button onClick={() => { setCurrentPage('upload'); setIsSidebarOpen(false); }} className="w-full flex items-center px-4 py-2 rounded-lg text-left hover:bg-gray-700 transition-colors duration-200">
          <Upload size={20} className="mr-3" />
          {translations[language].knowledgeBaseNav}
        </button>
        {isManager && (
          <button onClick={() => { setCurrentPage('analytics'); setIsSidebarOpen(false); }} className="w-full flex items-center px-4 py-2 rounded-lg text-left hover:bg-gray-700 transition-colors duration-200">
            <BarChart2 size={20} className="mr-3" />
            {translations[language].analyticsNav}
          </button>
        )}
      </nav>
      {/* Language Selector */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Language</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setLanguage('en')} className={`px-3 py-1 rounded-full text-sm font-medium ${language === 'en' ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            EN
          </button>
          <button onClick={() => setLanguage('zu')} className={`px-3 py-1 rounded-full text-sm font-medium ${language === 'zu' ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            ZU
          </button>
          <button onClick={() => setLanguage('af')} className={`px-3 py-1 rounded-full text-sm font-medium ${language === 'af' ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            AF
          </button>
          <button onClick={() => setLanguage('xh')} className={`px-3 py-1 rounded-full text-sm font-medium ${language === 'xh' ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            XH
          </button>
        </div>
      </div>
      {userId && (
        <div className="absolute bottom-4 left-4 right-4 p-4 bg-gray-800 rounded-lg text-xs break-words">
          <div className="font-semibold text-gray-400">{translations[language].userId}</div>
          <div className="mt-1 text-gray-200">{userId}</div>
        </div>
      )}
    </div>
  );

  const BoostModal = () => (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[100]">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full text-center relative">
        <button onClick={() => setShowBoostModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200">
          <X size={24} />
        </button>
        <div className="flex flex-col items-center">
          <Zap size={48} className="text-yellow-500 mb-4" />
          <p className="text-lg font-semibold mb-4 text-gray-800">
            {translations[language].boostButton}
          </p>
          <blockquote className="text-xl italic text-gray-700 leading-relaxed">
            "{dailyBoostQuote}"
          </blockquote>
          <button
            onClick={() => setShowBoostModal(false)}
            className="mt-6 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors duration-200"
          >
            {translations[language].closeButton}
          </button>
        </div>
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="flex-1 flex flex-col p-4">
      <h1 className="text-3xl font-bold text-center mb-4 text-gray-800">{translations[language].chatTitle}</h1>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-lg shadow-inner mb-4 max-h-[60vh]">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-xl max-w-xs md:max-w-md ${msg.sender === 'user' ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="p-3 rounded-xl bg-gray-200 text-gray-800 rounded-bl-none">
              <div className="animate-pulse">...</div>
            </div>
          </div>
        )}
        <div ref={chatEndRef}></div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={toggleListening}
          className={`p-3 rounded-full text-white transition-colors duration-200 ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
          title={isListening ? 'Stop Listening' : 'Start Listening'}
        >
          {isListening ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={translations[language].chatPlaceholder}
          className="flex-1 p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
        />
        <button
          onClick={() => sendMessage(input)}
          className="p-3 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition-colors duration-200"
          title="Send"
        >
          <Send size={24} />
        </button>
      </div>
      <p className="mt-2 text-sm text-center text-gray-600">
        {translations[language].disclaimer}
      </p>
    </div>
  );

  const renderUpload = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">{translations[language].uploadTitle}</h2>
        <p className="mb-6 text-gray-600">
          {translations[language].uploadText}
          <br/>
          (NotebookLM API is simulated)
        </p>
        <label htmlFor="file-upload" className="cursor-pointer bg-indigo-500 text-white py-3 px-6 rounded-lg hover:bg-indigo-600 transition-colors duration-200 inline-block">
          <Upload size={20} className="inline-block mr-2" />
          {translations[language].uploadButton}
        </label>
        <input id="file-upload" type="file" className="hidden" onChange={handleDocumentUpload} accept=".pdf,.doc,.docx" />
        {loading && <p className="mt-4 text-indigo-500 animate-pulse">{uploadMessage}</p>}
        {uploadMessage && !loading && <p className="mt-4 text-green-500 font-medium">{uploadMessage}</p>}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="flex-1 flex flex-col p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">{translations[language].analyticsTitle}</h2>
        <p className="mb-6 text-gray-600">
          {translations[language].analyticsText}
        </p>
        <div className="bg-gray-50 p-4 rounded-lg">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{
                top: 5, right: 30, left: 20, bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Competency Trends" fill="#4f46e5" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 text-center">
          <button onClick={generateRandomAnalytics} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors duration-200">
            {translations[language].generateData}
          </button>
        </div>
      </div>
    </div>
  );

  const renderCompetencySnapshot = () => {
    // Check for latest snapshot, otherwise use default 0s
    const latestSnapshot = savedSnapshots.length > 0
      ? savedSnapshots[savedSnapshots.length - 1].ratings
      : initialCompetencyRatings;

    // Create a new data structure suitable for the RadarChart with translated subjects
    const chartData = [
      {
        subject: translations[language].competencies.strategicVision,
        value: latestSnapshot.strategicVision,
        fullMark: 5,
      },
      {
        subject: translations[language].competencies.communication,
        value: latestSnapshot.communication,
        fullMark: 5,
      },
      {
        subject: translations[language].competencies.teamLeadership,
        value: latestSnapshot.teamLeadership,
        fullMark: 5,
      },
      {
        subject: translations[language].competencies.ethicalPractice,
        value: latestSnapshot.ethicalPractice,
        fullMark: 5,
      },
      {
        subject: translations[language].competencies.conflictResolution,
        value: latestSnapshot.conflictResolution,
        fullMark: 5,
      }
    ];

    // Convert object to array for mapping
    const competenciesArray = Object.keys(translations[language].competencies).map(key => ({
      key,
      label: translations[language].competencies[key]
    }));

    return (
      <div className="flex-1 flex flex-col p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl mx-auto mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">{translations[language].competencyTitle}</h2>
          <p className="mb-6 text-gray-600">
            {translations[language].competencyText}
          </p>
          <div className="space-y-4">
            {competenciesArray.map(({ key, label }) => (
              <div key={key} className="flex flex-col">
                <label className="text-lg font-medium text-gray-700 mb-2">{label}</label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={competencyRatings[key]}
                  onChange={(e) => handleRatingChange(key, e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-center text-gray-500 mt-1">{competencyRatings[key]} / 5</span>
              </div>
            ))}
          </div>
          <button
            onClick={saveCompetencySnapshot}
            disabled={loading}
            className="mt-6 w-full py-3 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 transition-colors duration-200 disabled:opacity-50"
          >
            {loading ? 'Saving...' : translations[language].saveButton}
          </button>
          {snapshotMessage && (
            <p className="mt-4 text-center text-sm font-medium text-green-600">{snapshotMessage}</p>
          )}
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl mx-auto">
          <h3 className="text-xl font-bold mb-4 text-gray-800">{translations[language].yourSnapshot}</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            {savedSnapshots.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart outerRadius={90} data={chartData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 12 }} />
                  {/* Removed PolarRadiusAxis to remove the numerical labels */}
                  <Radar name={translations[language].yourSnapshot} dataKey="value" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500">No snapshots saved yet. Rate your competencies above to see a chart.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMentorMatch = () => (
    <div className="flex-1 flex flex-col p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl mx-auto mb-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">{translations[language].mentorMatchTitle}</h2>
        <p className="mb-6 text-gray-600">
          {translations[language].mentorMatchText}
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setIsAddingMentor(true)}
            className="flex items-center justify-center w-48 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors duration-200"
          >
            <PlusCircle size={20} className="mr-2" />
            {translations[language].becomeAMentor}
          </button>
          <button
            onClick={() => setIsAddingMentor(false)}
            className="flex items-center justify-center w-48 py-3 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 transition-colors duration-200"
          >
            <Search size={20} className="mr-2" />
            {translations[language].findMentors}
          </button>
        </div>
      </div>

      {isAddingMentor ? (
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl mx-auto">
          <h3 className="text-xl font-bold mb-4 text-gray-800">{translations[language].addMentorTitle}</h3>
          <p className="text-gray-600 mb-4">{translations[language].addMentorText}</p>
          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">{translations[language].mentorName}</label>
              <input
                type="text"
                id="name"
                name="name"
                value={newMentorProfile.name}
                onChange={handleMentorProfileChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label htmlFor="expertise" className="block text-sm font-medium text-gray-700">{translations[language].mentorExpertise}</label>
              <input
                type="text"
                id="expertise"
                name="expertise"
                value={newMentorProfile.expertise}
                onChange={handleMentorProfileChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">{translations[language].mentorBio}</label>
              <textarea
                id="bio"
                name="bio"
                value={newMentorProfile.bio}
                onChange={handleMentorProfileChange}
                rows="3"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              ></textarea>
            </div>
            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700">{translations[language].mentorContact}</label>
              <input
                type="email"
                id="contact"
                name="contact"
                value={newMentorProfile.contact}
                onChange={handleMentorProfileChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <button
              type="button"
              onClick={submitMentorProfile}
              disabled={loading}
              className="w-full py-3 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : translations[language].submitProfile}
            </button>
            {mentorMessage && (
              <p className="mt-4 text-center text-sm font-medium text-green-600">{mentorMessage}</p>
            )}
          </form>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl mx-auto">
          <h3 className="text-xl font-bold mb-4 text-gray-800">{translations[language].mentorListTitle}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mentors.length > 0 ? (
              mentors.map(mentor => (
                <div key={mentor.id} className="p-4 border border-gray-200 rounded-lg flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <User size={20} className="text-indigo-500" />
                    <h4 className="text-lg font-semibold text-gray-800">{mentor.name}</h4>
                  </div>
                  <p className="text-sm font-medium text-gray-600">{translations[language].mentorExpertise}: <span className="text-gray-800">{mentor.expertise}</span></p>
                  <p className="text-sm text-gray-500 italic">"{mentor.bio}"</p>
                  <a href={`mailto:${mentor.contact}`} className="flex items-center justify-center mt-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors duration-200">
                    {translations[language].contactMentor}
                  </a>
                </div>
              ))
            ) : (
              <div className="col-span-1 md:col-span-2 text-center text-gray-500 italic p-8">
                {translations[language].noMentors}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // === Main App Layout ===
  return (
    <div className="font-sans antialiased text-gray-900 bg-gray-100 min-h-screen flex flex-col md:flex-row">
      <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-4 fixed top-0 left-0 text-gray-800 z-50">
        <Menu size={28} />
      </button>

      {/* Sidebar */}
      {renderSidebar()}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        <div className="p-4 bg-white shadow-md flex justify-between items-center md:hidden">
          <h1 className="text-2xl font-bold text-gray-800">ShiftWyse 2.0</h1>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          {(() => {
            switch (currentPage) {
              case 'chat':
                return renderChat();
              case 'upload':
                return renderUpload();
              case 'competency':
                return renderCompetencySnapshot();
              case 'mentorMatch':
                return renderMentorMatch();
              case 'analytics':
                return renderAnalytics();
              default:
                return renderChat();
            }
          })()}
        </div>
      </div>

      {/* Floating Buttons */}
      <div className="fixed bottom-4 right-4 flex flex-col space-y-2 z-40">
        <button
          onClick={handleDailyBoost}
          className="p-3 rounded-full bg-yellow-500 text-white shadow-lg hover:bg-yellow-600 transition-colors duration-200"
          title={translations[language].boostButton}
        >
          <Zap size={24} />
        </button>
        <button
          onClick={() => setCurrentPage('competency')}
          className="p-3 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition-colors duration-200"
          title={translations[language].competencyNav}
        >
          <Target size={24} />
        </button>
        <button
          onClick={() => setCurrentPage('mentorMatch')}
          className="p-3 rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 transition-colors duration-200"
          title={translations[language].mentorMatchNav}
        >
          <Award size={24} />
        </button>
      </div>

      {/* Daily Boost Modal */}
      {showBoostModal && <BoostModal />}
    </div>
  );
};

export default App;
