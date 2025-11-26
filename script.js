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

        if(submitBtn){
            submitBtn.addEventListener('click', async ()=>{
                const nameField = (nameInput.value || '').trim();
                const name = nameField === '' ? randomName() : nameField;
                const text = (textArea.value || '').trim();
                if(!text){
                    statusEl.textContent = 'Please enter feedback before submitting.';
                    return;
                }
                statusEl.textContent = 'Sending...';
                await postFeedback(name, text);
                textArea.value = '';
                nameInput.value = name;
            });
        }

        // initial load
        setTimeout(()=> fetchFeedbacks(), 250);
    });

})();
