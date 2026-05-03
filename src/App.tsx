import { useState, useRef, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  Send, 
  Utensils, 
  Camera, 
  History, 
  Waves, 
  Mountain,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ImagePlus,
  Menu,
  Sparkles,
  MapPin,
  ExternalLink
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { raahiAI } from './services/geminiService';
import { cn } from './lib/utils';
import LandingPage from './LandingPage';

const FEATURED_DESTINATIONS = [
  {
    name: "Hunza Valley",
    category: "Mountains",
    icon: <Mountain className="w-5 h-5" />,
    image: "https://naturehikepakistan.pk/wp-content/uploads/2024/03/gulmit-a-min.jpeg",
    description: "The Shangri-La of the Karakoram."
  },
  {
    name: "Lahore",
    category: "Culture",
    icon: <History className="w-5 h-5" />,
    image: "https://media.istockphoto.com/id/1386446426/photo/badshahi-mosque.jpg?s=612x612&w=0&k=20&c=vShhc9rb17q_5k-tx_HJnlDvlE4YjCNNlOCEWplI2_Y=",
    description: "The heart of Punjab's heritage."
  },
  {
    name: "Gwadar",
    category: "Beaches",
    icon: <Waves className="w-5 h-5" />,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmWlyrG1508zv96BjnjP1wIRp-g87HNmx0Eg&s",
    description: "Golden sands and blue waters."
  },
  {
    name: "Mohenjo-daro",
    category: "Ancient",
    icon: <Camera className="w-5 h-5" />,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSMozxN5qhugShW8PsCU0EweWrDWPcDFb1KKw&s",
    description: "Cradle of the Indus Valley Civilization."
  }
];

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;
type SpeechInputLang = 'en-US' | 'ur-PK';

const ROMAN_URDU_HINTS = /\b(assalam|salam|aap|ap|apka|kya|kia|hai|hain|nahi|nahin|mujhe|mjay|bata|btao|kaise|kahan|kidhar|kitna|shukriya|mehrbani|safar|ghoom|jagah|khana|chalo)\b/i;
const URDU_SCRIPT_PATTERN = /[\u0600-\u06FF]/;

const getSpeechLangForText = (text: string) => (
  URDU_SCRIPT_PATTERN.test(text) || ROMAN_URDU_HINTS.test(text) ? 'ur-PK' : 'en-US'
);

const QUICK_PROMPTS = [
  "Plan a 5 day Hunza trip",
  "Best food streets in Lahore",
  "Family friendly places near Islamabad",
  "Hidden beaches in Balochistan"
];

const MAP_DESTINATIONS = [
  "Hunza Valley",
  "Lahore",
  "Gwadar",
  "Mohenjo-daro",
  "Islamabad",
  "Karachi",
  "Skardu",
  "Naran",
  "Kaghan",
  "Swat",
  "Murree",
  "Fairy Meadows",
  "Deosai National Park",
  "Khunjerab Pass",
  "Attabad Lake",
  "Neelum Valley",
  "Kalash Valley",
  "Chitral",
  "Multan",
  "Peshawar",
  "Quetta",
  "Makran Coastal Highway",
  "Ormara",
  "Hingol National Park",
  "Badshahi Mosque",
  "Lahore Fort",
  "Faisal Mosque",
  "Minar-e-Pakistan"
];

type Message = {
  role: 'user' | 'model';
  content: string;
  imageUrl?: string;
  mapQuery?: string;
};

const buildGoogleMapsEmbedUrl = (query: string) => (
  `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`
);

const buildGoogleMapsSearchUrl = (query: string) => (
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
);

const extractMapQuery = (response: string, userPrompt: string) => {
  const combined = `${userPrompt}\n${response}`;
  const matchedDestination = MAP_DESTINATIONS.find((destination) => (
    new RegExp(`\\b${destination.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(combined)
  ));

  if (matchedDestination) {
    return `${matchedDestination}, Pakistan`;
  }

  const headingMatch = response.match(/^#{1,3}\s+(.+)$/m);
  if (headingMatch?.[1]) {
    return `${headingMatch[1].replace(/\*\*/g, '').trim()}, Pakistan`;
  }

  const tellMeMatch = userPrompt.match(/(?:about|in|near|to)\s+([a-zA-Z\s-]{3,40})/i);
  if (tellMeMatch?.[1]) {
    return `${tellMeMatch[1].trim()}, Pakistan`;
  }

  return null;
};

function ChatApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
  const [isSpeechSynthesisSupported, setIsSpeechSynthesisSupported] = useState(false);
  const [speechInputLang, setSpeechInputLang] = useState<SpeechInputLang>('en-US');
  const [activeTab, setActiveTab] = useState('Explore');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const lastSpokenIndexRef = useRef(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const speakText = (text: string) => {
    if (!isSpeechSynthesisSupported) return;
    if (!text.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getSpeechLangForText(text);
    window.speechSynthesis.speak(utterance);
  };

  const fileToBase64 = (file: File) => new Promise<{ data: string; mimeType: string }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Image read failed'));
        return;
      }
      const [header, data] = result.split(',', 2);
      if (!data) {
        reject(new Error('Image read failed'));
        return;
      }
      const mimeMatch = header.match(/data:(.*);base64/);
      resolve({ data, mimeType: mimeMatch?.[1] ?? file.type ?? 'image/jpeg' });
    };
    reader.onerror = () => reject(new Error('Image read failed'));
    reader.readAsDataURL(file);
  });

  const clearSelectedImage = () => {
    if (selectedImagePreview) {
      URL.revokeObjectURL(selectedImagePreview);
    }
    setSelectedImage(null);
    setSelectedImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('Please select an image file.');
      return;
    }
    setImageError(null);
    if (selectedImagePreview) {
      URL.revokeObjectURL(selectedImagePreview);
    }
    setSelectedImage(file);
    setSelectedImagePreview(URL.createObjectURL(file));
  };

  const handleToggleListening = () => {
    if (!isSpeechSupported) return;
    if (isListening) {
      speechRecognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    try {
      speechRecognitionRef.current?.start();
      setIsListening(true);
    } catch (error) {
      console.error(error);
      setIsListening(false);
    }
  };

  const handleToggleSpeechOutput = () => {
    if (!isSpeechSynthesisSupported) return;
    if (!isSpeechEnabled) {
      lastSpokenIndexRef.current = messages.length - 1;
    } else {
      window.speechSynthesis.cancel();
    }
    setIsSpeechEnabled((prev) => !prev);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setIsSpeechSynthesisSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setIsSpeechSupported(false);
      return;
    }
    setIsSpeechSupported(true);
    const recognition = new (SpeechRecognitionCtor as SpeechRecognitionConstructor)();
    recognition.lang = speechInputLang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };
    recognition.onerror = () => {
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    speechRecognitionRef.current = recognition;
    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop();
    };
  }, [speechInputLang]);

  useEffect(() => {
    if (!isSpeechEnabled || !isSpeechSynthesisSupported) return;
    const lastIndex = messages.length - 1;
    if (lastIndex <= lastSpokenIndexRef.current) return;
    const lastMessage = messages[lastIndex];
    if (lastMessage?.role === 'model') {
      speakText(lastMessage.content);
      lastSpokenIndexRef.current = lastIndex;
    }
  }, [messages, isSpeechEnabled, isSpeechSynthesisSupported]);

  const handleSend = async (text: string = input) => {
    const trimmedText = text.trim();
    if (!trimmedText && !selectedImage) return;

    if (isListening) {
      speechRecognitionRef.current?.stop();
      setIsListening(false);
    }

    const imageFile = selectedImage;
    const messageText = trimmedText || (imageFile ? 'Analyze this image for travel insights in Pakistan. If you are unsure about what is visible, say so clearly.' : '');

    setInput('');
    setIsLoading(true);
    setIsMobileMenuOpen(false);
    setImageError(null);

    let imagePayload: { data: string; mimeType: string } | undefined;
    let imagePreviewDataUrl: string | undefined;

    if (imageFile) {
      try {
        const { data, mimeType } = await fileToBase64(imageFile);
        imagePayload = { data, mimeType };
        imagePreviewDataUrl = `data:${mimeType};base64,${data}`;
      } catch (error) {
        console.error(error);
        clearSelectedImage();
        setIsLoading(false);
        setMessages(prev => [...prev, {
          role: 'model' as const,
          content: "Sorry, I could not read that image. Please try another file."
        }]);
        return;
      }
    }

    clearSelectedImage();

    const userMsg = { role: 'user' as const, content: messageText, imageUrl: imagePreviewDataUrl };
    setMessages(prev => [...prev, userMsg]);

    try {
      const response = await raahiAI.sendMessage(messageText, imagePayload);
      setMessages(prev => [...prev, {
        role: 'model' as const,
        content: response,
        mapQuery: extractMapQuery(response, messageText) ?? undefined
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        role: 'model' as const, 
        content: "Maaf kijiyega, kuch technical masla hua hai. (Sorry, I'm having some technical trouble.)" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 mb-10">
        <div className="w-11 h-11 bg-white/95 rounded-2xl flex items-center justify-center text-emerald-700 shadow-xl ring-4 ring-emerald-300/20">
          <Compass className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Raahi</h1>
          <p className="text-[11px] text-emerald-100/50 font-medium">Pakistan travel intelligence</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6">
        <div>
          <div className="text-[10px] font-bold text-emerald-300/60 uppercase tracking-[0.2em] mb-4">
            Navigation
          </div>
          <div className="space-y-1">
            {[
              { id: 'Explore', icon: <Compass className="w-4 h-4" /> },
              { id: 'Destinations', icon: <Mountain className="w-4 h-4" /> },
              { id: 'Culture', icon: <History className="w-4 h-4" /> },
              { id: 'Food', icon: <Utensils className="w-4 h-4" /> }
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                className={cn(
                  "w-full text-left p-3 rounded-2xl text-sm transition-all flex items-center gap-3 border",
                  activeTab === item.id ? "bg-white/12 border-white/15 text-white font-medium shadow-lg shadow-emerald-950/10" : "border-transparent text-emerald-100/60 hover:bg-white/7 hover:text-white hover:border-white/10"
                )}
              >
                {item.icon}
                {item.id}
              </button>
            ))}
          </div>
        </div>

        <div>
           <div className="text-[10px] font-bold text-emerald-300/60 uppercase tracking-[0.2em] mb-4">
             Recent Highlights
           </div>
           <div className="space-y-2">
             {FEATURED_DESTINATIONS.map((dest) => (
               <button 
                 key={dest.name}
                 onClick={() => handleSend(`Tell me about ${dest.name}`)}
                 className="w-full block p-3 rounded-2xl hover:bg-white/7 text-emerald-100/80 text-xs text-left transition-colors border border-transparent hover:border-white/10"
               >
                 <span className="font-semibold text-white/90">{dest.name}</span>
                 <span className="block mt-1 text-[11px] text-emerald-100/40">{dest.category}</span>
               </button>
             ))}
           </div>
         </div>
      </nav>

      <div className="pt-6 border-t border-white/10 mt-6">
        <p className="text-[11px] text-emerald-300/60 mb-6 italic text-center font-serif opacity-80 leading-relaxed">
          "Safar hai shart, musafir nawaz bohot hain"
        </p>
        <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/10">
          <div className="w-8 h-8 rounded-xl bg-emerald-300/15 flex items-center justify-center text-emerald-200">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-semibold text-white">Guest Explorer</div>
            <div className="opacity-40">Voice + image ready</div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,#ecfdf5_0,#f8fafc_30%,#eef2ff_100%)] selection:bg-pak-green/10">
      {/* Sidebar - Desktop */}
      <aside className="w-80 app-sidebar-gradient text-white hidden lg:flex flex-col p-8 shrink-0 relative overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.aside 
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              className="fixed top-0 left-0 bottom-0 w-80 app-sidebar-gradient text-white flex flex-col p-8 z-[70] lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0">
        <header className="h-[72px] min-h-[72px] border-b border-white/70 bg-white/75 backdrop-blur-xl flex items-center justify-between px-5 md:px-8 shrink-0 z-40 shadow-sm shadow-emerald-950/5">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 rounded-xl hover:bg-slate-100"
              type="button"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <span className="hover:text-emerald-600 cursor-pointer">Destinations</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-900">{activeTab}</span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-400 mt-1">Ask in English, Urdu, or Roman Urdu. Raahi will match your language.</p>
            </div>
          </div>
          <div className="flex gap-2 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setSpeechInputLang('en-US')}
              className={cn(
                "px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-colors uppercase tracking-tight",
                speechInputLang === 'en-US' ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              ENG
            </button>
            <button
              type="button"
              onClick={() => setSpeechInputLang('ur-PK')}
              className={cn(
                "px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-colors uppercase tracking-tight",
                speechInputLang === 'ur-PK' ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              Urdu
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col relative">
          <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12 scroll-smooth bg-slate-50">
            <div className="max-w-4xl mx-auto space-y-10">
              {messages.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-12"
                >
                  <div className="mb-10 overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 shadow-2xl shadow-emerald-950/10 backdrop-blur">
                    <div className="relative min-h-[300px] p-8 md:p-10">
                      <img
                        src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=1400"
                        alt="A scenic mountain valley"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/35 to-transparent" />
                      <div className="relative max-w-2xl">
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-100 backdrop-blur">
                          <Sparkles className="h-4 w-4" />
                          Voice + image travel guide
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-4">
                          Discover Pakistan,<br />
                          <span className="italic text-emerald-200 font-serif leading-none">with Raahi.</span>
                        </h2>
                        <p className="text-emerald-50/80 font-medium italic font-serif text-lg leading-relaxed max-w-xl">
                          "Where mountains touch the heavens and the heart finds peace in the silence of the clouds."
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {[
                      { icon: <Mountain className="w-5 h-5 text-emerald-600" />, label: "Adventure", color: "bg-emerald-50" },
                      { icon: <Utensils className="w-5 h-5 text-orange-600" />, label: "Cuisine", color: "bg-orange-50" },
                      { icon: <History className="w-5 h-5 text-blue-600" />, label: "Heritage", color: "bg-blue-50" }
                    ].map((feature) => (
                      <div key={feature.label} className={cn("p-6 rounded-2xl border border-white/80 shadow-lg shadow-slate-200/50 flex flex-col gap-4 bg-white/85 backdrop-blur")}>
                         <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center ring-1 ring-black/5", feature.color)}>
                           {feature.icon}
                         </div>
                         <div>
                            <h3 className="font-bold text-slate-800 mb-1">{feature.label}</h3>
                            <p className="text-xs text-slate-400 leading-tight">Curated experiences in every province.</p>
                         </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {FEATURED_DESTINATIONS.map((dest) => (
                      <button 
                        key={dest.name}
                        onClick={() => handleSend(`Tell me about ${dest.name}`)}
                        className="group bg-white/90 p-3 rounded-2xl border border-white shadow-lg shadow-slate-200/50 text-left hover:border-emerald-200 hover:-translate-y-1 transition-all"
                      >
                         <div className="aspect-square rounded-xl overflow-hidden mb-3">
                           <img src={dest.image} alt={dest.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                         </div>
                         <div className="font-bold text-slate-800 text-xs truncate">{dest.name}</div>
                         <div className="text-[10px] text-slate-400 italic truncate opacity-0 group-hover:opacity-100 transition-opacity">Explore now</div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-10 flex flex-wrap gap-3">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleSend(prompt)}
                        className="rounded-full border border-emerald-100 bg-emerald-50/80 px-4 py-2 text-xs font-bold text-emerald-700 shadow-sm hover:bg-emerald-100 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-8 pb-20">
                  {messages.map((msg, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex flex-col",
                        msg.role === 'user' ? "items-end" : "items-start"
                      )}
                    >
                      {msg.role === 'user' ? (
                        <div className="bg-slate-900 text-white px-6 py-4 rounded-[1.5rem] rounded-tr-md shadow-xl shadow-slate-900/15 text-sm font-medium max-w-[85%] md:max-w-[70%]">
                          {msg.imageUrl && (
                            <div className="mb-3">
                              <img
                                src={msg.imageUrl}
                                alt="Uploaded"
                                className="w-56 h-36 object-cover rounded-2xl border border-white/10"
                              />
                            </div>
                          )}
                          <div>{msg.content}</div>
                        </div>
                      ) : (
                        <div className="w-full bg-white/90 p-6 md:p-8 rounded-[2rem] shadow-xl shadow-emerald-950/5 border border-white backdrop-blur">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-9 h-9 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 ring-1 ring-emerald-100">
                              <Compass className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300">Raahi Intelligence</span>
                              <p className="text-[11px] text-slate-400">Built for Pakistan travel, culture, food, and routes.</p>
                            </div>
                          </div>
                          <div className="markdown-body">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                          {msg.mapQuery && (
                            <div className="mt-6 overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/40">
                              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                                <div className="flex min-w-0 items-center gap-2 text-emerald-800">
                                  <MapPin className="h-4 w-4 shrink-0" />
                                  <span className="truncate text-xs font-bold uppercase tracking-widest">
                                    {msg.mapQuery}
                                  </span>
                                </div>
                                <a
                                  href={buildGoogleMapsSearchUrl(msg.mapQuery)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700 transition-colors hover:bg-emerald-50"
                                >
                                  Open map
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                              <iframe
                                title={`Google map for ${msg.mapQuery}`}
                                src={buildGoogleMapsEmbedUrl(msg.mapQuery)}
                                className="h-64 w-full border-0 md:h-80"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                              />
                            </div>
                          )}
                          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-3">
                             <button className="px-4 py-2 bg-emerald-50 rounded-full text-[10px] font-bold text-emerald-700 uppercase tracking-widest border border-emerald-100 cursor-pointer hover:bg-emerald-100 transition-colors" type="button">
                               Plan itinerary
                             </button>
                             <button className="px-4 py-2 bg-slate-50 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors" type="button">
                               Save destination
                             </button>
                             <button
                               className="px-4 py-2 bg-emerald-50 rounded-full text-[10px] font-bold text-emerald-700 uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                               type="button"
                               onClick={() => speakText(msg.content)}
                               disabled={!isSpeechSynthesisSupported}
                             >
                               <Volume2 className="w-3.5 h-3.5" />
                               Speak
                             </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-4 bg-white/80 p-6 rounded-[2rem] border border-emerald-100/60 shadow-lg shadow-emerald-950/5 animate-pulse">
                      <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Reading the route...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Footer Input Area */}
          <footer className="shrink-0 p-4 md:p-8 md:pt-0">
             <div className="max-w-4xl mx-auto">
               <input
                 ref={fileInputRef}
                 type="file"
                 accept="image/*"
                 onChange={handleImageChange}
                 className="hidden"
               />
               {selectedImagePreview && (
                 <div className="mb-3 flex items-center gap-3 bg-white/85 border border-white rounded-2xl p-2 shadow-lg shadow-slate-200/50">
                   <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200">
                     <img src={selectedImagePreview} alt="Selected" className="w-full h-full object-cover" />
                   </div>
                   <div className="text-xs text-slate-500 truncate flex-1">{selectedImage?.name}</div>
                   <button
                     type="button"
                     onClick={clearSelectedImage}
                     className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-full hover:bg-slate-100"
                   >
                     Remove
                   </button>
                 </div>
               )}
               {imageError && (
                 <div className="mb-3 text-xs font-semibold text-rose-500">{imageError}</div>
               )}
               {isListening && (
                 <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
                   <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                   Listening in {speechInputLang === 'ur-PK' ? 'Urdu' : 'English'}
                 </div>
               )}
               <div className="glass-effect app-input-shell p-2 rounded-[1.75rem] md:rounded-full flex items-center gap-2 px-3 md:px-4 shadow-2xl shadow-emerald-900/10 ring-1 ring-emerald-900/5">
                 <button
                   type="button"
                   onClick={() => fileInputRef.current?.click()}
                   className={cn(
                     "p-2 rounded-full text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors",
                     selectedImagePreview && "text-emerald-600 bg-emerald-50"
                   )}
                   title="Attach image"
                 >
                   <ImagePlus className="w-4 h-4" />
                 </button>
                 <button
                   type="button"
                   onClick={handleToggleListening}
                   disabled={!isSpeechSupported || isLoading}
                   className={cn(
                     "p-2 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                     isListening ? "text-emerald-600 bg-emerald-50" : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                   )}
                   title={isListening ? "Stop voice input" : "Start voice input"}
                   aria-pressed={isListening}
                 >
                   {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                 </button>
                 <input 
                   type="text" 
                   value={input}
                   onChange={(e) => setInput(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                   placeholder="Search or ask anything about Pakistan..." 
                   className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm px-2 text-slate-600 placeholder:text-slate-400 font-medium"
                 />
                 <button
                   type="button"
                   onClick={handleToggleSpeechOutput}
                   disabled={!isSpeechSynthesisSupported}
                   className={cn(
                     "p-2 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                     isSpeechEnabled ? "text-emerald-600 bg-emerald-50" : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                   )}
                   title={isSpeechEnabled ? "Disable voice output" : "Enable voice output"}
                   aria-pressed={isSpeechEnabled}
                 >
                   {isSpeechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                 </button>
                 <button 
                   onClick={() => handleSend()}
                   disabled={isLoading || (!input.trim() && !selectedImage)}
                   className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 md:px-7 py-2.5 rounded-full text-xs font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-40"
                   type="button"
                 >
                   <Send className="w-4 h-4" />
                   <span className="hidden sm:inline">Ask Raahi</span>
                 </button>
               </div>
               <p className="text-[10px] text-center text-slate-400 mt-4 font-bold tracking-[0.25em] opacity-30 uppercase">
                 Curated by the Heart of Pakistan
               </p>
             </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (route === '#/app') {
    return <ChatApp />;
  }

  return <LandingPage />;
}
