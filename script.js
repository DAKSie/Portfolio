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

        // NOTE: Moderation is performed client-side here using the Google
        // Generative Language (text-bison) model via a simple prompt-based
        // classifier. Placing API keys client-side is insecure; rotate the
        // key and prefer a server-side proxy in production. See README.
        const GOOGLE_API_KEY = 'AIzaSyAgEJef33FmWLWMMDQ9AOXlJx2C9n4O7rg';

        /**
         * Ask Google GenAI (text-bison) to classify/moderate the text.
         * The prompt asks for JSON only with fields: blocked (bool), severity (low|medium|high),
         * categories (array of strings), masked (string) where offensive words are replaced.
         */
        async function moderateText(text){
            if(!text) return { blocked: false, severity: 'low', categories: [], masked: text, is_feedback: false, reason: 'empty' };

            const endpoint = `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generate?key=${GOOGLE_API_KEY}`;
            const prompt = `You are a content-safety assistant. Analyze the following user feedback and respond with JSON ONLY (no extra text, no explanation). The JSON must have keys: "blocked" (true if content must be blocked entirely), "severity" (one of \"low\", \"medium\", \"high\"), "categories" (array of strings like \"profanity\", \"hate\", \"sexual\", \"threat\"), "masked" (the original text but with offensive words replaced by asterisks preserving length), and "is_feedback" (boolean indicating whether this is meaningful feedback). If you include "reason", that can be a short string explaining why something is not feedback. Allow professional criticism and negative opinions. Block or mark high severity for violent threats, calls for harm, slurs targeting protected groups, or explicit sexual content. For mere profanity or mild insults, mark severity low/medium and provide a masked version.

Text (between <<<START>>> and <<<END>>>):
<<<START>>>
${text}
<<<END>>>

Return compact JSON only.`;

            try{
                const resp = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: { text: prompt },
                        temperature: 0,
                        maxOutputTokens: 300
                    })
                });
                if(resp.ok){
                    const data = await resp.json();
                    const candidate = data?.candidates?.[0]?.output || data?.candidates?.[0]?.content || '';
                    const textOut = candidate || JSON.stringify(data);
                    const jsonMatch = textOut.match(/\{[\s\S]*\}/);
                    if(jsonMatch){
                        try{
                            const parsed = JSON.parse(jsonMatch[0]);
                            return parsed;
                        }catch(e){
                            // fallthrough to heuristic fallback
                        }
                    }
                }else{
                    console.warn('GenAI API error: ' + resp.status + ' ' + resp.statusText);
                }
            }catch(err){
                console.warn('Moderation call failed:', err);
            }

            // Heuristic fallback if API call failed or response couldn't be parsed
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
            const severity = found.length ? 'medium' : 'low';
            const categories = found.length ? ['profanity'] : [];
            const highSlurs = ['nigger','faggot','cunt','motherfucker'];
            const hasHigh = highSlurs.some(s => new RegExp(s,'i').test(text));

            // Heuristic gibberish / meaningless detection
            const stripped = text.replace(/\s+/g,' ').trim();
            const words = stripped.length ? stripped.split(' ') : [];
            const wordCount = words.length;
            const nonLetterMatches = (text.match(/[^A-Za-z0-9\s]/g) || []).length;
            const nonLetterRatio = text.length ? nonLetterMatches / text.length : 0;
            const longRepeated = /(\w)\1{5,}/i.test(text); // same char repeated 6+ times
            const lotsOfShortTokens = words.filter(w=>w.length<=2).length / (wordCount||1) > 0.6;
            const isLikelyGibberish = wordCount < 3 || nonLetterRatio > 0.4 || longRepeated || lotsOfShortTokens;
            const isFeedback = !isLikelyGibberish;
            const reason = isFeedback ? 'appears_meaningful' : 'too_short_or_gibberish';

            return { blocked: hasHigh, severity: hasHigh ? 'high' : severity, categories, masked, is_feedback: isFeedback, reason };
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
                    statusEl.textContent = 'Please enter a clear, constructive feedback message.' + (mod.reason ? (' Reason: ' + mod.reason) : '');
                    return;
                }
                // If model says blocked and severity high => block entirely
                if(mod && mod.blocked && (mod.severity === 'high' || (mod.categories && (mod.categories.includes('hate') || mod.categories.includes('threat') || mod.categories.includes('sexual'))))){
                    statusEl.textContent = 'Your feedback contains disallowed content and was not submitted.';
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

        // initial load
        setTimeout(()=> fetchFeedbacks(), 250);
    });

})();
