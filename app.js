const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const countDisplay = document.getElementById('top-bar'); // Nome atualizado

let counter = 0;
let stage = "up"; // Estado inicial

// Configuração do MediaPipe Pose
const pose = new Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});

pose.setOptions({
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

// Lógica de contagem e desenho
pose.onResults((results) => {
  if (!results.poseLandmarks) return;

  // Sincroniza o tamanho do canvas com o vídeo da câmera
  canvasElement.width = results.image.width;
  canvasElement.height = results.image.height;

  // --- Lógica de Contagem (Inalterada) ---
  const shoulderY = results.poseLandmarks[11].y; // Pega o Y do ombro esquerdo
  if (shoulderY > 0.6) {
    stage = "down";
  }
  if (shoulderY < 0.4 && stage === "down") {
    stage = "up";
    counter++;
    countDisplay.innerText = counter;
  }

  // --- NOVA LÓGICA DE DESENHO DO ESQUELETO ---
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
  // Desenha os conectores (as linhas entre as juntas do corpo, incluindo braços/ombros)
  drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
                 {color: '#00FF00', lineWidth: 4}); // Verde neon para as linhas

  // Desenha os landmarks (os pontos circulares nas juntas, ex: cotovelo, pulso)
  drawLandmarks(canvasCtx, results.poseLandmarks,
                {color: '#FF0000', lineWidth: 2, radius: 2}); // Vermelho para os pontos
  
  canvasCtx.restore();
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

// Registro do Service Worker (Inalterado)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// Função do botão de notificação (Inalterado)
async function ativarNotificacao() {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    alert('Notificações autorizadas!');
  }
}