// No início do app.js, adicione:
let sessionCounter = 0;
let totalToday = localStorage.getItem('totalToday') ? parseInt(localStorage.getItem('totalToday')) : 0;

// Atualiza o display inicial
document.getElementById('total-today').innerText = totalToday;

// DENTRO da função pose.onResults, substitua a parte da contagem por:
  if (shoulderY > 0.65) {
    stage = "down";
  }
  if (shoulderY < 0.35 && stage === "down") {
    stage = "up";
    
    // Incrementa contadores
    sessionCounter++;
    totalToday++;
    
    // Salva no celular
    localStorage.setItem('totalToday', totalToday);
    
    // Atualiza a tela
    document.getElementById('session-count').innerText = sessionCounter;
    document.getElementById('total-today').innerText = totalToday;
    
    // Feedback visual (opcional)
    const fb = document.getElementById('feedback');
    fb.style.opacity = "1";
    setTimeout(() => fb.style.opacity = "0", 400);
  }