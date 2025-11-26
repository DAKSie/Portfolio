// Frontend using Firebase Firestore for feedback storage
// Script is loaded as a module (index.html uses `type="module"`).
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { getDatabase, ref, push, get, child } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';
import { firebaseConfig } from './firebase-config.js';

// Basic check: ensure developer replaced placeholder values
const isConfigFilled = firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.apiKey.indexOf('REPLACE') === -1;

let db = null;
let dbRT = null;
if(isConfigFilled){
    const app = initializeApp(firebaseConfig);
    try{ db = getFirestore(app); }catch(e){ console.warn('Firestore init failed', e); }
    try{ dbRT = getDatabase(app); }catch(e){ console.warn('Realtime Database init failed', e); }
    // expose for quick debugging in browser console
    try{ window.db = db; window.dbRT = dbRT; }catch(e){}
} else {
    console.warn('Firebase config not set. Please fill `firebase-config.js` with your project settings (see firebase-config.js).');
}

(function(){
    const adjectives = ['brave','swift','gentle','clever','bright','kind','calm','bold','merry','quiet','keen','witty','bold','noble','lucky','happy','sly','fresh','wild','brisk'];
    const animals = ['fox','hawk','otter','hare','wolf','raven','lynx','finch','badger','stoat','puma','seal','lynx','heron','boar','beetle','crow','stag','sparrow','owl'];

    function randomName(){
        const a = adjectives[Math.floor(Math.random() * adjectives.length)];
        const animal = animals[Math.floor(Math.random() * animals.length)];
        const num = Math.floor(Math.random() * 90000) + 10000;
        return `${a}${animal}${num}`;
    }

    async function fetchFeedbacks(){
        const container = document.querySelector('.existing-feedbacks');
        const statusEl = document.getElementById('feedback-status');
        try{
            if(!db && !dbRT){
                if(container) container.innerHTML = '<div class="placeholder">Firebase not configured. Add your `firebaseConfig` inside `firebase-config.js`.</div>';
                return;
            }

            // Prefer Realtime Database if available
            if(dbRT){
                const dbRef = ref(dbRT);
                const snap = await get(child(dbRef, 'feedbacks'));
                const list = [];
                if(snap && snap.exists && snap.exists()){
                    const val = snap.val();
                    for(const id in val){
                        list.push({ id, ...val[id] });
                    }
                    list.sort((a,b)=> (b.createdAt||0) - (a.createdAt||0));
                }
                renderFeedbacks(list);
                return;
            }

            // Fallback to Firestore
            const q = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            renderFeedbacks(list);
        }catch(err){
            if(container) container.innerHTML = `<div class="placeholder">Unable to load feedbacks (${err.message}).</div>`;
            if(statusEl) statusEl.textContent = '';
        }
    }

    function renderFeedbacks(list){
        const container = document.querySelector('.existing-feedbacks');
        if(!container) return;
        container.innerHTML = '';
        if(!Array.isArray(list) || list.length === 0){
            container.innerHTML = '<div class="placeholder">No feedbacks yet.</div>';
            return;
        }
        const ul = document.createElement('ul');
        ul.className = 'feedback-list';
        list.forEach(item => {
            const li = document.createElement('li');
            li.className = 'feedback-card';
            const who = document.createElement('strong');
            who.textContent = item.name || 'Anonymous';
            const p = document.createElement('p');
            p.textContent = item.text || item.message || '';
            li.appendChild(who);
            li.appendChild(p);
            ul.appendChild(li);
        });
        container.appendChild(ul);
    }

    async function postFeedback(name, text){
        const statusEl = document.getElementById('feedback-status');
        try{
            if(dbRT){
                // Write to Realtime Database
                const listRef = ref(dbRT, 'feedbacks');
                await push(listRef, {
                    name: name,
                    text: text,
                    createdAt: Date.now()
                });
                statusEl.textContent = 'Feedback submitted.';
                setTimeout(()=> statusEl.textContent = '', 3000);
                await fetchFeedbacks();
                return;
            }

            if(!db){
                statusEl.textContent = 'Firebase not configured. Add your `firebaseConfig` in `firebase-config.js`.';
                return;
            }

            await addDoc(collection(db, 'feedbacks'), {
                name: name,
                text: text,
                createdAt: serverTimestamp()
            });
            statusEl.textContent = 'Feedback submitted.';
            setTimeout(()=> statusEl.textContent = '', 3000);
            await fetchFeedbacks();
        }catch(err){
            statusEl.textContent = 'Failed to submit feedback: ' + err.message;
        }
    }

    // Auto-generated certificate thumbnails list (detected in workspace)
    const certificates = [
        'global/certifications/thumbnail/logic.png',
        'global/certifications/thumbnail/java-its.png',
        'global/certifications/thumbnail/intro-to-cs.png',
        'global/certifications/thumbnail/cpp-workshop.png'
    ];

    function buildCertCarousel(items){
        const container = document.getElementById('cert-grid');
        if(!container) return;
        container.innerHTML = '';
        items.forEach(src => {
            const li = document.createElement('li');
            li.className = 'cert-card';
            const img = document.createElement('img');
            img.src = src;
            img.alt = src.split('/').pop().replace(/[-_]/g,' ').replace('.png','');
            img.loading = 'lazy';
            img.addEventListener('click', ()=>{
                // open corresponding PDF (same name) in new tab
                try{
                    const pdfPath = src.replace('/thumbnail/', '/pdf/').replace(/\.[a-zA-Z0-9]+$/, '.pdf');
                    window.open(pdfPath, '_blank');
                }catch(e){
                    // fallback to opening the image if pdf path fails
                    window.open(src, '_blank');
                }
            });
            // allow keyboard activation (Enter) on the image for accessibility
            img.tabIndex = 0;
            img.addEventListener('keydown', (ev)=>{
                if(ev.key === 'Enter' || ev.key === ' '){
                    ev.preventDefault();
                    img.click();
                }
            });
            img.addEventListener('error', ()=>{ li.style.display = 'none'; });
            const caption = document.createElement('div');
            caption.className = 'cert-title';
            caption.textContent = img.alt;
            li.appendChild(img);
            li.appendChild(caption);
            container.appendChild(li);
        });
    }

    document.addEventListener('DOMContentLoaded', ()=>{
        const nameInput = document.getElementById('feedback-name');
        const submitBtn = document.getElementById('submit-feedback');
        const textArea = document.getElementById('feedback-text');
        const statusEl = document.getElementById('feedback-status');

        // Build certifications grid
        try{ buildCertCarousel(certificates); }catch(e){ console.warn('Failed to build cert carousel', e); }

        
        const GOOGLE_API_KEY = 'AIzaSyAgEJef33FmWLWMMDQ9AOXlJx2C9n4O7rg';
        //danilo kabalo mangita ka sa api key nako HAHAHAHAHAHA
        //ayaw sa, please. I need my tokens.
        //Pwede man ask nicely saakoa chat ra AHHAHAHAHA

        async function moderateText(text){
            if(!text) return { blocked: false, severity: 'low', categories: [], masked: text, is_feedback: false, reason: 'empty' };

            // Fast heuristic pass (run locally for low latency)
            const profanity = ['fuck','shit','bitch','asshole','bastard','cunt','motherfucker','nigger','faggot'];
            let masked = text;
            let found = [];
            profanity.forEach(w => {
                const re = new RegExp(w, 'ig');
                if(re.test(masked)){
                    found.push(w);
                    masked = masked.replace(re, (m)=> '*'.repeat(m.length));
                }
            });
            const categories = found.length ? ['profanity'] : [];
            const highSlurs = ['nigger','faggot','cunt','motherfucker'];
            const hasHigh = highSlurs.some(s => new RegExp(s,'i').test(text));

            // Quick threat detection
            const threatPatterns = [ /\bi will kill you\b/i, /\bkill you\b/i, /\bi'll kill you\b/i, /\bi will (hurt|harm) you\b/i, /\bi'll (hurt|harm) you\b/i, /\bi am going to kill\b/i, /\bshoot you\b/i, /\bstab you\b/i, /\bbeat you\b/i, /\brape you\b/i, /\bkill yourself\b/i ];
            const isThreat = threatPatterns.some(rx => rx.test(text));
            if(isThreat){
                return { blocked: true, severity: 'high', categories: Array.from(new Set([...categories, 'threat'])), masked: masked, is_feedback: false, reason: 'threat' };
            }

            // Personal attack detection
            const insultWords = ['stupid','idiot','suck','sucks','trash','worthless','loser','pathetic','dumb','moron','garbage'];
            const addressedToYou = /\b(you|u|your|you're|youre)\b/i.test(text);
            const hasInsult = insultWords.some(w => new RegExp('\\b' + w + '\\b','i').test(text)) || found.length>0;
            const isPersonalAttack = addressedToYou && hasInsult;
            if(isPersonalAttack){
                return { blocked: true, severity: 'medium', categories: Array.from(new Set([...categories, 'personal_attack'])), masked: masked, is_feedback: false, reason: 'personal_attack', personal_attack: true };
            }

            // Contact/solicitation detection
            const contactPatterns = [ /\bmailto:\b/i, /@\w+\.\w+/i, /\b\d{3}[-\.\s]?\d{3}[-\.\s]?\d{4}\b/, /\b(api[-_ ]?key|token|secret)\b/i, /\bcontact me\b/i, /\bcall me\b/i, /\badd me\b/i, /\bfollow me\b/i, /\binstagram\b|\btwitter\b|\bfacebook\b|\btelegram\b/i ];
            const isContact = contactPatterns.some(rx => rx.test(text));
            if(isContact){
                return { blocked: false, severity: 'low', categories: Array.from(new Set([...categories, 'irrelevant'])), masked, is_feedback: false, reason: 'contact_or_solicitation' };
            }

            // Heuristic gibberish / meaningless detection
            const stripped = text.replace(/\s+/g,' ').trim();
            const words = stripped.length ? stripped.split(' ') : [];
            const wordCount = words.length;
            const nonLetterMatches = (text.match(/[^A-Za-z0-9\s]/g) || []).length;
            const nonLetterRatio = text.length ? nonLetterMatches / text.length : 0;
            const longRepeated = /(\w)\1{5,}/i.test(text);
            const lotsOfShortTokens = words.filter(w=>w.length<=2).length / (wordCount||1) > 0.6;
            const isLikelyGibberish = wordCount < 3 || nonLetterRatio > 0.4 || longRepeated || lotsOfShortTokens;
            if(isLikelyGibberish){
                return { blocked: false, severity: 'low', categories: Array.from(new Set([...categories, 'irrelevant'])), masked, is_feedback: false, reason: 'too_short_or_gibberish' };
            }

            // Relevance detection
            const feedbackKeywords = ['site','website','page','portfolio','project','resume','mobile','desktop','design','load','loading','slow','bug','error','issue','feature','layout','link','image','certificate','pdf','feedback','suggest','improve','improvement','responsive','button','form','typo','content','performance','accessibility','readability','navigation','nav','submit','contact','email'];
            const lower = text.toLowerCase();
            const hasFeedbackKeyword = feedbackKeywords.some(k => lower.includes(k));
            const opinionWords = ['love','like','dislike','hate','great','good','bad','terrible','awesome','awful'];
            const hasOpinion = opinionWords.some(k => lower.includes(k));
            if(!hasFeedbackKeyword && (wordCount < 6 && !hasOpinion)){
                return { blocked: false, severity: 'low', categories: Array.from(new Set([...categories, 'irrelevant'])), masked, is_feedback: false, reason: 'irrelevant_or_personal_statement' };
            }

            // At this point heuristics consider it likely meaningful feedback.
            let baseResult = { blocked: false, severity: hasHigh ? 'high' : (found.length ? 'medium' : 'low'), categories, masked, is_feedback: true, reason: 'appears_meaningful' };

            // If there's no API key or the text is short, return right away to keep latency low
            const useRemote = (typeof GOOGLE_API_KEY === 'string' && GOOGLE_API_KEY && GOOGLE_API_KEY.indexOf('AIza') === 0);
            if(!useRemote || text.length < 120){
                return baseResult;
            }

            // For longer / potentially ambiguous messages, attempt a remote moderation call with a short timeout
            const endpoint = `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generate?key=${GOOGLE_API_KEY}`;
            const prompt = `You are a content-safety assistant. Analyze the following user feedback and respond with JSON ONLY (no extra text, no explanation). The JSON must have keys: "blocked" (true if content must be blocked entirely), "severity" (one of \"low\", \"medium\", \"high\"), "categories" (array of strings like \"profanity\", \"hate\", \"sexual\", \"threat\", \"irrelevant\", \"personal_attack\"), "masked" (the original text but with offensive words replaced by asterisks preserving length), "is_feedback" (boolean indicating whether this is meaningful feedback), and optionally "reason" (short string explaining why something is not feedback).`; 

            try{
                const controller = new AbortController();
                const timeoutId = setTimeout(()=> controller.abort(), 1500); // 1.5s timeout
                const resp = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal,
                    body: JSON.stringify({ prompt: { text: prompt + '\nText:\n' + text }, temperature: 0, maxOutputTokens: 300 })
                });
                clearTimeout(timeoutId);
                if(resp.ok){
                    const data = await resp.json();
                    const candidate = data?.candidates?.[0]?.output || data?.candidates?.[0]?.content || '';
                    const textOut = candidate || JSON.stringify(data);
                    const jsonMatch = textOut.match(/\{[\s\S]*\}/);
                    if(jsonMatch){
                        try{
                            const parsed = JSON.parse(jsonMatch[0]);
                            // merge parsed fields with our heuristics (favor parsed when present)
                            return Object.assign({}, baseResult, parsed);
                        }catch(e){
                            // fall back to baseResult
                        }
                    }
                }else{
                    console.warn('GenAI API error: ' + resp.status + ' ' + resp.statusText);
                }
            }catch(err){
                if(err.name === 'AbortError'){
                    console.warn('Moderation API timed out, using local heuristics');
                }else{
                    console.warn('Moderation call failed:', err);
                }
            }

            return baseResult;
        }

        if(submitBtn){
            submitBtn.addEventListener('click', async ()=>{
                const nameField = (nameInput.value || '').trim();
                const name = nameField === '' ? randomName() : nameField;
                const text = (textArea.value || '').trim();
                if(!text){
                    statusEl.textContent = 'Please enter feedback before submitting.';
                    return;
                }
                statusEl.textContent = 'Checking content for appropriateness...';
                const mod = await moderateText(text);
                // If the moderator determines the input is not meaningful feedback, reject it
                if(mod && mod.is_feedback === false){
                    if(mod.reason === 'contact_or_solicitation' || (mod.categories && mod.categories.includes('irrelevant'))){
                        statusEl.textContent = 'Feedback rejected.';
                    }else{
                        statusEl.textContent = 'Please enter a clear, constructive feedback message.' + (mod.reason ? (' Reason: ' + mod.reason) : '');
                    }
                    return;
                }

                // Block explicit threats or content flagged as blocked by the moderator
                if(mod && (mod.blocked || (mod.categories && (mod.categories.includes('threat') || mod.categories.includes('sexual'))))){
                    statusEl.textContent = 'Your feedback contains disallowed content and was not submitted.';
                    return;
                }

                // Block targeted personal attacks
                if(mod && mod.personal_attack){
                    statusEl.textContent = 'Personal attacks are not accepted. Please provide constructive, impartial feedback.';
                    return;
                }

                // If moderation suggests masking, use masked version
                const finalText = (mod && mod.masked) ? mod.masked : text;
                // notify user if we masked content
                if(finalText !== text){
                    statusEl.textContent = 'Offensive words were masked; submitting edited feedback.';
                }else{
                    statusEl.textContent = 'Sending...';
                }
                await postFeedback(name, finalText);
                textArea.value = '';
                nameInput.value = name;
            });
        }

        // Theme cycling: light <-> dark (persists in localStorage)
        const themeBtn = document.querySelector('header button');
        const themes = ['light','dark'];
        let currentTheme = localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        function applyTheme(t){
            // Directly apply the theme class; CSS transitions handle the smooth change.
            currentTheme = t;
            if(t === 'dark'){
                document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark');
            }
            try{ localStorage.setItem('theme', t); }catch(e){}
            if(themeBtn){
                themeBtn.textContent = t === 'dark' ? 'Switch to Light' : 'Switch to Dark';
            }
        }
        if(themeBtn){
            themeBtn.addEventListener('click', ()=>{
                const next = currentTheme === 'light' ? 'dark' : 'light';
                applyTheme(next);
            });
        }
        // apply initially
        applyTheme(currentTheme);

        // initial load
        setTimeout(()=> fetchFeedbacks(), 250);
    });

})();
