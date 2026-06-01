// ==========================================
// 1. Web3 支付與解鎖邏輯
// ==========================================
async function payAndStart() {
    const btn = document.getElementById("payStartBtn");
    
    // 檢查 app.js 中的 contract 是否已經準備好 (代表已連錢包)
    if (!contract || !signer) {
        alert("請先回到首頁連接錢包！");
        location.href = 'index.html';
        return;
    }

    try {
        btn.innerText = "呼叫錢包中...";
        btn.disabled = true;

        // 呼叫智能合約的 payEntryFee，並附帶 0.01 ETH 的 Value
        // 將原本的 0.01 改為 0.0001
        const tx = await contract.payEntryFee({ value: ethers.parseEther("0.0001") });
        
        btn.innerText = "交易確認中 (請稍候)...";
        
        // 等待區塊鏈打包這筆交易
        await tx.wait(); 

        // 交易成功，解鎖遊戲！
        document.getElementById("web3-gate").style.display = "none";
        
        // 更新上方獎池顯示 (因為剛付了錢，獎池變大了)
        updatePoolBalance(); 

        // 啟動遊戲
        startGame();

    } catch (error) {
        console.error("支付失敗:", error);
        alert("支付取消或失敗，無法開始遊戲。");
        btn.innerText = "🚀 支付並開始挑戰";
        btn.disabled = false;
    }
}

// ==========================================
// 2. 英文打字遊戲邏輯 (改編自你的 typing6)
// ==========================================
const englishWordBank = [
    // --- Web3 與區塊鏈核心 ---
    "BLOCKCHAIN", "SMART", "CONTRACT", "CRYPTO", "WALLET", 
    "ETHEREUM", "TOKEN", "GAS", "WEB3", "DECENTRALIZED",
    "HACKER", "SECURITY", "MINER", "HASH", "NODE",
    "DAPP", "DEFI", "NFT", "METAMASK", "SOLIDITY", 
    "MAINNET", "TESTNET", "LEDGER", "CONSENSUS", "AIRDROP",

    // --- 程式開發與演算法 ---
    "PYTHON", "ALGORITHM", "FASTAPI", "BOOTSTRAP", "UVICORN",
    "FRONTEND", "BACKEND", "DATABASE", "DEBUG", "GITHUB",

    // --- 極限挑戰長單字 (容易在最後階段讓玩家手忙腳亂) ---
    "CRYPTOGRAPHY", "TRANSACTION", "GOVERNANCE", "IMMUTABLE", "METAVERSE"
];

let targetWord = "";
let currentInputIndex = 0;
let lives = 3;
let timeLeft = 30;
let gameActive = false;
let boxPos = 900;
let animationId;
let baseSpeed = 2; // 初始速度

function startGame() {
    gameActive = true;
    lives = 3;
    timeLeft = 30;
    baseSpeed = 4;
    spawnBox();
    gameLoop();

    const timer = setInterval(() => {
        if(!gameActive) {
            clearInterval(timer);
            return;
        }
        timeLeft--;
        document.getElementById('timer-display').innerText = `⏱️ ${timeLeft}s`;
        
        // 【核心機制】：每過 5 秒，速度加快，增加極限感
        if (timeLeft % 5 === 0 && timeLeft !== 30) {
            baseSpeed += 1.5;
            document.getElementById('speed-display').innerText = `⚡ 速度: ${(baseSpeed/2).toFixed(1)}x`;
        }

        if(timeLeft <= 0) {
            clearInterval(timer);
            victory(); // 撐過 30 秒即為勝利！
        }
    }, 1000);
}

function spawnBox() {
    const stage = document.getElementById('game-stage');
    const oldBox = document.querySelector('.target-box');
    if(oldBox) oldBox.remove();

    // 隨機抽選英文單字
    targetWord = englishWordBank[Math.floor(Math.random() * englishWordBank.length)];
    currentInputIndex = 0;

    const box = document.createElement('div');
    box.className = 'target-box'; 
    box.id = 'current-box';
    // 建立字元顯示的 span，方便單獨變色
    box.innerHTML = targetWord.split('').map(char => `<span>${char}</span>`).join('');
    
    stage.appendChild(box);
    boxPos = 1500;
}

function gameLoop() {
    if(!gameActive) return;
    const box = document.getElementById('current-box');
    if(box) {
        boxPos -= baseSpeed; 
        box.style.left = boxPos + 'px';
        
        // 如果方塊撞到倉鼠 (x座標約 110)
        if(boxPos < 110) { 
            lives--; 
            document.getElementById('lives-display').innerText = '❤️ '.repeat(Math.max(0, lives));
            if(lives <= 0) {
                gameOver();
            } else {
                spawnBox(); 
            }
        }
    }
    animationId = requestAnimationFrame(gameLoop);
}

// 監聽實體鍵盤的按鍵
window.addEventListener('keydown', (e) => {
    if (!gameActive) return;

    // 將按鍵轉為大寫字母
    const pressedKey = e.key.toUpperCase();
    const expectedKey = targetWord[currentInputIndex];

    if (pressedKey === expectedKey) {
        // 打對字：將該字母變成金色
        const box = document.getElementById('current-box');
        const spans = box.getElementsByTagName('span');
        spans[currentInputIndex].className = 'typed-text';
        
        currentInputIndex++;

        // 如果整個單字打完
        if (currentInputIndex === targetWord.length) {
            spawnBox();
        }
    }
});

function gameOver() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    alert("遊戲結束！倉鼠被撞飛了 😭 \n你失去了本次的入場費。");
    location.href = 'index.html';
}

async function victory() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    
    try {
        // 先給玩家一個回饋，提醒他 MetaMask 會跳出來
        alert("🎉 太神啦！你撐過了 30 秒！\n請在 MetaMask 確認交易，領取總獎金！");
        
        // 1. 取得目前合約內的總獎池餘額 (Wei 單位)
        const poolBalance = await contract.getPoolBalance();
        
        // 2. 取得目前遊玩者的錢包地址
        const winnerAddress = await signer.getAddress();

        // 3. 呼叫合約的 sendPrize，把總獎池的錢發給贏家
        const tx = await contract.sendPrize(winnerAddress, poolBalance);
        
        // 顯示等待狀態
        document.getElementById("timer-display").innerText = "💰 發獎中...";
        
        // 4. 等待區塊鏈確認這筆交易
        await tx.wait();

        alert("💰 獎金已成功發送至你的錢包！");
        location.href = 'index.html'; // 跳回首頁

    } catch (error) {
        console.error("領獎失敗:", error);
        alert("領獎失敗！(請確認METAMESK連線狀況)");
        location.href = 'index.html';
    }
}
