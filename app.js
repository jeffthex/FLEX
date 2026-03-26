const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const countDisplay = document.getElementById('session-count');
const totalDisplay = document.getElementById('total-today');

// Carregamento dos Áudios
const audioPoint = new Audio('point.mp3');
const audio10Point = new Audio('10point.mp3');

let sessionCounter = 0;
let totalToday = localStorage.getItem('totalToday') ? parseInt(localStorage.getItem('totalToday')) : 0;
let stage = "up";

totalDisplay.innerText = totalToday;

const pose = new Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});

pose.setOptions({
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

pose.onResults((results) => {
  if (!results.poseLandmarks) return;

  canvasElement.width = results.image.width;
  canvasElement.height = results.image.height;

  const shoulderY = results.poseLandmarks[11].y;
  
  if (shoulderY > 0.65) {
    stage = "down";
  }
  if (shoulderY < 0.35 && stage === "down") {
    stage = "up";
    
    sessionCounter++;
    totalToday++;
    
    localStorage.setItem('totalToday', totalToday);
    
    countDisplay.innerText = sessionCounter;
    totalDisplay.innerText = totalToday;

    // LÓGICA DE ÁUDIO
    if (sessionCounter % 10 === 0 && sessionCounter !== 0) {
      audio10Point.play();
    } else {
      audioPoint.play();
    }
    
    const fb = document.getElementById('feedback');
    fb.style.opacity = "1";
    setTimeout(() => fb.style.opacity = "0", 400);
  }

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  const filteredPoseConnections = [
    [11, 12], [11, 23], [12, 24], [23, 24],
    [11, 13], [13, 15], [12, 14], [14, 16],
    [23, 25], [25, 27], [24, 26], [26, 28]
  ];
  
  drawConnectors(canvasCtx, results.poseLandmarks, filteredPoseConnections,
                 {color: 'rgba(255, 255, 255, 0.5)', lineWidth: 3});

  const bodyLandmarkIndices = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
  const bodyLandmarks = bodyLandmarkIndices.map(index => results.poseLandmarks[index]);

  drawLandmarks(canvasCtx, bodyLandmarks, {color: '#FF0000', lineWidth: 1, radius: 2});
  
  canvasCtx.restore();
});

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await pose.send({image: videoElement});
  },
  width: 640,
  height: 480
});
camera.start();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// IMPORTANTE: iOS exige interação humana para liberar áudio
async function ativarNotificacao() {
  // Toca um áudio mudo rapidamente para "desbloquear" o som no iPhone
  audioPoint.play().then(() => {
      audioPoint.pause();
      audioPoint.currentTime = 0;
  });
  
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    alert('Som e Lembretes ativados!');
  }
}