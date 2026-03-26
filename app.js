const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const countDisplay = document.getElementById('session-count');
const totalDisplay = document.getElementById('total-today');

let sessionCounter = 0;
let totalToday = localStorage.getItem('totalToday') ? parseInt(localStorage.getItem('totalToday')) : 0;
let stage = "up";

// Atualiza o display inicial com o que está salvo no celular
totalDisplay.innerText = totalToday;

// 1. Configuração da Inteligência Artificial (Pose)
const pose = new Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});

pose.setOptions({
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

// 2. Lógica de Processamento (Desenho + Contagem)
pose.onResults((results) => {
  if (!results.poseLandmarks) return;

  // Ajusta o tamanho do canvas
  canvasElement.width = results.image.width;
  canvasElement.height = results.image.height;

  // --- Lógica de Contagem ---
  const shoulderY = results.poseLandmarks[11].y;
  
  if (shoulderY > 0.65) {
    stage = "down";
  }
  if (shoulderY < 0.35 && stage === "down") {
    stage = "up";
    
    // Incrementa
    sessionCounter++;
    totalToday++;
    
    // Salva no celular (Persistência)
    localStorage.setItem('totalToday', totalToday);
    
    // Atualiza a tela
    countDisplay.innerText = sessionCounter;
    totalDisplay.innerText = totalToday;
    
    // Feedback visual (fogo)
    const fb = document.getElementById('feedback');
    fb.style.opacity = "1";
    setTimeout(() => fb.style.opacity = "0", 400);
  }

  // --- Lógica de Desenho ---
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  const filteredPoseConnections = [
    [11, 12], [11, 23], [12, 24], [23, 24], // Tronco
    [11, 13], [13, 15], [12, 14], [14, 16], // Braços
    [23, 25], [25, 27], [24, 26], [26, 28]  // Pernas
  ];
  
  drawConnectors(canvasCtx, results.poseLandmarks, filteredPoseConnections,
                 {color: 'rgba(255, 255, 255, 0.5)', lineWidth: 3});
  drawLandmarks(canvasCtx, results.poseLandmarks,
                {color: '#FF0000', lineWidth: 1, radius: 2});
  
  canvasCtx.restore();
});

// 3. Inicialização da Câmera
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await pose.send({image: videoElement});
  },
  width: 640,
  height: 480
});
camera.start();

// Notificações
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

async function ativarNotificacao() {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    alert('Lembretes ativados!');
  }
}