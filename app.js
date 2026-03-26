const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');

// --- ESTADOS E PERSISTÊNCIA ---
let sessionCounter = 0;
// Ajuste para garantir timezone local ao criar a chave da data
const now = new Date();
const todayKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0'); // YYYY-MM-DD local

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
        const last = new Date(userData.lastActive + 'T00:00:00'); // Força timezone local
        const today = new Date(todayKey + 'T00:00:00');
        const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            // Fez ontem, mantém o streak
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
    const start = new Date(userData.startDate + 'T00:00:00');
    const today = new Date(todayKey + 'T00:00:00');
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
    
    // Calibrado para visão frontal (ombros descem abaixo de 70% da tela)
    if (shoulderAvgY > 0.70) stage = "down";
    
    // Sobe acima de 45% para contar
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

        if (sessionCounter % 10 === 0 && sessionCounter !== 0) audio10Point.play();
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

// Nova função para formatar data: Quinta - 26/03
function formatDateString(dateStr) {
    const dateObj = new Date(dateStr + 'T00:00:00'); // Força timezone local
    const weekdayOptions = { weekday: 'long' };
    const dateOptions = { day: '2-digit', month: '2-digit' };
    
    let weekday = dateObj.toLocaleDateString('pt-BR', weekdayOptions);
    let date = dateObj.toLocaleDateString('pt-BR', dateOptions);
    
    // Capitaliza apenas a primeira letra do dia da semana (ex: Quinta)
    weekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    
    return `${weekday} - ${date}`;
}

function renderHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = "";
    // Pega os últimos 7 dias registrados
    const dates = Object.keys(userData.history).sort().reverse().slice(0, 7);
    dates.forEach(d => {
        const formattedDate = formatDateString(d); // Formata aqui
        list.innerHTML += `<div class="history-item"><span class="history-item-date">${formattedDate}</span> <b>${userData.history[d]} reps</b></div>`;
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