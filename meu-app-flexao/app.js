const videoElement = document.getElementById('input_video');
const countDisplay = document.getElementById('count');
let counter = 0;
let stage = "up"; // Estado inicial: corpo em cima

// Configuração do MediaPipe Pose
const pose = new Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});

pose.setOptions({
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

// Lógica de contagem
pose.onResults((results) => {
  if (!results.poseLandmarks) return;

  // Pega o Y do ombro (ponto 11 ou 12)
  const shoulderY = results.poseLandmarks[11].y;

  // Lógica simples: 
  // Se o ombro descer (Y aumenta), entra no estágio "down"
  // Se o ombro subir (Y diminui) e estava em "down", conta +1
  if (shoulderY > 0.6) {
    stage = "down";
  }
  if (shoulderY < 0.4 && stage === "down") {
    stage = "up";
    counter++;
    countDisplay.innerText = counter;
  }
});

// Inicializa a câmera
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await pose.send({image: videoElement});
  },
  width: 640,
  height: 480
});
camera.start();

// Registro do Service Worker para notificações
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// Função do botão de notificação
async function ativarNotificacao() {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    alert('Notificações autorizadas!');
  }
}