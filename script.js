const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const esquilo = document.getElementById('esquilo');
const scoreDisplay = document.getElementById('score');
const timeDisplay = document.getElementById('time');
const endMessage = document.getElementById('end-message');
const container = document.getElementById('game-container');
const bgMusic = document.getElementById('bg-music');

bgMusic.volume = 0.4;

let pulos = 0;
let noAr = false;
let posicaoY = 0;
let velocidadeY = 0;
let score = 0;
let timeLeft = 50;
let isGameOver = false;
let gameInterval, nozInterval, inimigoInterval, inimigoChaoInterval;
let velocidadeJogo = 12;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function tocarSom(frequencia, tipo) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = tipo;
    oscillator.frequency.setValueAtTime(frequencia, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.1);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
}

startBtn.addEventListener('click', iniciarJogo);
restartBtn.addEventListener('click', iniciarJogo);

// Controle por teclado (Computador)
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && !isGameOver && pulos < 2 && !gameScreen.classList.contains('hidden')) {
        pular();
    }
    if (event.code === 'Enter' || event.key === 'Enter') {
        if (!startScreen.classList.contains('hidden') || !endScreen.classList.contains('hidden')) {
            iniciarJogo();
        }
    }
});

// Controle por toque na tela (Celular / Tablets)
document.addEventListener('touchstart', (event) => {
    if (!isGameOver && pulos < 2 && !gameScreen.classList.contains('hidden')) {
        pular();
    }
    if (!startScreen.classList.contains('hidden') || !endScreen.classList.contains('hidden')) {
        iniciarJogo();
    }
}, { passive: true });

function iniciarJogo() {
    startScreen.classList.add('hidden');
    endScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    
    score = 0;
    timeLeft = 50;
    velocidadeJogo = 12;
    isGameOver = false;
    scoreDisplay.innerText = score;
    timeDisplay.innerText = timeLeft;
    container.style.animationPlayState = 'running';
    
    document.querySelectorAll('.noz, .inimigo, .inimigo-chao, .rastro').forEach(el => el.remove());
    
    bgMusic.currentTime = 0;
    bgMusic.play();
    
    startGameLoops();
}

function pular() {
    pulos++;
    velocidadeY = 32; 

    criarRastro('💨', -10);

    if (!noAr) {
        noAr = true;
        let puloInterval = setInterval(() => {
            velocidadeY -= 1.3; 
            posicaoY += velocidadeY;

            if (Math.random() > 0.6) {
                criarRastro('🍃', 15);
            }

            if (posicaoY <= 0) { 
                posicaoY = 0;
                noAr = false;
                pulos = 0;
                clearInterval(puloInterval);
            }

            esquilo.style.bottom = (120 + posicaoY) + 'px';
        }, 15);
    }
}

function criarRastro(emoji, offsetY) {
    if (isGameOver) return;
    
    const rastro = document.createElement('div');
    rastro.innerText = emoji;
    rastro.classList.add('rastro');
    rastro.style.left = '100px'; 
    rastro.style.bottom = (120 + posicaoY + offsetY) + 'px';
    
    gameScreen.appendChild(rastro);
    
    setTimeout(() => {
        rastro.remove();
    }, 400);
}

function startGameLoops() {
    gameInterval = setInterval(() => {
        timeLeft--;
        timeDisplay.innerText = timeLeft;
        if (timeLeft <= 0 && !isGameOver) {
            finalizarJogo("Tempo Esgotado! Você Perdeu.");
        }
    }, 1000);

    nozInterval = setInterval(criarNoz, 1000);
    inimigoInterval = setInterval(criarInimigo, 2000);
    inimigoChaoInterval = setInterval(criarInimigoChao, 2000);
}

function criarNoz() {
    if (isGameOver) return;

    const noz = document.createElement('div');
    noz.classList.add('noz');
    
    const isDourada = Math.random() < 0.15;
    if (isDourada) noz.classList.add('noz-dourada');

    noz.style.left = window.innerWidth + 'px';
    noz.style.bottom = (120 + Math.floor(Math.random() * (window.innerHeight * 0.45)) + 40) + 'px';
    gameScreen.appendChild(noz);

    let nozTimer = setInterval(() => {
        if (isGameOver) {
            clearInterval(nozTimer);
            return;
        }

        let nozLeft = parseInt(noz.style.left);
        let esquiloRect = esquilo.getBoundingClientRect();
        let nozRect = noz.getBoundingClientRect();

        if (esquiloRect.left < nozRect.right && esquiloRect.right > nozRect.left &&
            esquiloRect.top < nozRect.bottom && esquiloRect.bottom > nozRect.top) {
            
            if (isDourada) {
                tocarSom(1200, 'square');
                score += 5;
            } else {
                tocarSom(800, 'sine');
                score++;
            }
            
            scoreDisplay.innerText = score;
            noz.remove();
            clearInterval(nozTimer);
            
            if (score % 10 === 0) {
                velocidadeJogo += 1.5;
            }

            if (score >= 40) {
                finalizarJogo("Parabéns! Você Venceu!");
            }
        } else if (nozLeft < -60) {
            noz.remove();
            clearInterval(nozTimer);
        } else {
            noz.style.left = (nozLeft - velocidadeJogo) + 'px';
        }
    }, 15);
}

function moverEntidadeNegativa(elemento, timer, velocidadeExtra, msgGameOver) {
    let posicaoLeft = parseInt(elemento.style.left);
    let esquiloRect = esquilo.getBoundingClientRect();
    let elementoRect = elemento.getBoundingClientRect();

    let margemColisao = 15;

    if (esquiloRect.left + margemColisao < elementoRect.right - margemColisao && 
        esquiloRect.right - margemColisao > elementoRect.left + margemColisao &&
        esquiloRect.top + margemColisao < elementoRect.bottom - margemColisao && 
        esquiloRect.bottom - margemColisao > elementoRect.top + margemColisao) {
        
        tocarSom(150, 'sawtooth');
        finalizarJogo(msgGameOver);
    } else if (posicaoLeft < -100) {
        elemento.remove();
        clearInterval(timer);
    } else {
        elemento.style.left = (posicaoLeft - velocidadeJogo - velocidadeExtra) + 'px';
    }
}

function criarInimigo() {
    if (isGameOver) return;
    const inimigo = document.createElement('div');
    inimigo.classList.add('inimigo');
    inimigo.style.left = window.innerWidth + 'px';
    inimigo.style.bottom = (120 + Math.floor(Math.random() * (window.innerHeight * 0.35)) + 60) + 'px'; 
    gameScreen.appendChild(inimigo);

    let inimigoTimer = setInterval(() => {
        if (isGameOver) { clearInterval(inimigoTimer); return; }
        moverEntidadeNegativa(inimigo, inimigoTimer, 2.5, "Uma águia te pegou! Game Over.");
    }, 15);
}

function criarInimigoChao() {
    if (isGameOver) return;
    const obstaculo = document.createElement('div');
    obstaculo.classList.add('inimigo-chao');
    obstaculo.style.left = window.innerWidth + 'px';
    gameScreen.appendChild(obstaculo);

    let obstaculoTimer = setInterval(() => {
        if (isGameOver) { clearInterval(obstaculoTimer); return; }
        moverEntidadeNegativa(obstaculo, obstaculoTimer, 0, "Você tropeçou na pedra! Game Over.");
    }, 15);
}

function finalizarJogo(mensagem) {
    isGameOver = true;
    clearInterval(gameInterval);
    clearInterval(nozInterval);
    clearInterval(inimigoInterval);
    clearInterval(inimigoChaoInterval);
    container.style.animationPlayState = 'paused';
    bgMusic.pause();
    endMessage.innerText = mensagem;
    gameScreen.classList.add('hidden');
    endScreen.classList.remove('hidden');
}