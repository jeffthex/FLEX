const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');

// --- ESTADOS E PERSISTÊNCIA ---
let sessionCounter = 0;
let todayKey = new Date().toISOString().split('T')[0]; // Ex: "2026-03-26"

// Carregar dados salvos
let userData = JSON.parse(localStorage.getItem('flexData')) || {
    history: {}, // { "data": total }
    streak: 0,
    lastActive: null,
    startDate: todayKey,
    grandTotal: 0
};

// Reset Diário e Verificação de Streak
function initData() {
    if (!userData.history[todayKey]) {
        userData.history[todayKey] = 0;
    }
    
    // Lógica de Streak (Estilo Duolingo)
    if (userData.lastActive) {
        const last = new Date(userData.lastActive);
        const today = new Date(todayKey);
        const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            // Fez ontem, mantém o streak (será incrementado na primeira flexão de hoje)
        } else if (diffDays > 1) {
            userData.streak = 0; // Quebrou o streak
        }
    }
    saveData();
}

function saveData() {
    localStorage.setItem('flexData', JSON.stringify(userData));
    updateUI();
}

function updateUI() {
    document.getElementById('total-today').innerText = userData.history[todayKey] || 0;
    document.getElementById('streak-count').innerText = userData.streak;
    document.getElementById('grand-total').innerText = userData.grandTotal;
    
    // Cálculo de Meta: +2 por sessão a cada 14 dias
    const start = new Date(userData.startDate);
    const today = new Date(todayKey);
    const daysDiff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    const currentGoal = 15 + (Math.floor(daysDiff / 14) * 2);
    document.getElementById('goal-info').innerText = `Meta da Sessão: ${currentGoal}`;
}

// --- CONTADOR E ÁUDIO ---
const audioPoint = new Audio('point.mp3');
const audio10Point = new Audio('10point.mp3');
let stage = "up";

const pose = new Pose({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
pose.setOptions({ modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });

pose.onResults((results) => {
    if (!results.poseLandmarks) return;
    canvasElement.width = results.image.width;
    canvasElement.height = results.image.height;

    // Lógica Frontal
    const shoulderAvgY = (results.poseLandmarks[11].y + results.poseLandmarks[12].y) / 2;
    
    if (shoulderAvgY > 0.70) stage = "down";
    if (shoulderAvgY < 0.45 && stage === "down") {
        stage = "up";
        
        // Se for a primeira flexão do dia, aumenta o streak
        if (userData.lastActive !== todayKey) {
            userData.streak++;
            userData.lastActive = todayKey;
        }

        sessionCounter++;
        userData.history[todayKey]++;
        userData.grandTotal++;
        
        document.getElementById('session-count').innerText = sessionCounter;
        saveData();

        if (sessionCounter % 10 === 0) audio10Point.play();
        else audioPoint.play();

        const fb = document.getElementById('feedback');
        fb.style.opacity = "1";
        setTimeout(() => fb.style.opacity = "0", 400);
    }

    // Desenho (Filtro corpo)
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    const conn = [[11,12], [11,23], [12,24], [23,24], [11,13], [13,15], [12,14], [14,16], [23,25], [25,27], [24,26], [26,28]];
    drawConnectors(canvasCtx, results.poseLandmarks, conn, {color: 'rgba(255, 255, 255, 0.4)', lineWidth: 3});
    const bodyInd = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
    const bodyLms = bodyInd.map(i => results.poseLandmarks[i]);
    drawLandmarks(canvasCtx, bodyLms, {color: '#FF0000', lineWidth: 1, radius: 2});
    canvasCtx.restore();
});

function renderHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = "";
    // Pega os últimos 7 dias registrados
    const dates = Object.keys(userData.history).sort().reverse().slice(0, 7);
    dates.forEach(d => {
        list.innerHTML += `<div class="history-item"><span>${d}</span> <b>${userData.history[d]} reps</b></div>`;
    });
}

const camera = new Camera(videoElement, { onFrame: async () => { await pose.send({image: videoElement}); }, width: 640, height: 480 });
camera.start();
initData();

async function ativarNotificacao() {
    audioPoint.play().then(() => { audioPoint.pause(); audioPoint.currentTime = 0; });
    const permission = await Notification.requestPermission();
    if (permission === 'granted') alert('Sistema Ativado!');
}