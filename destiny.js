// ==========================================
// 1. Web3 支付與解鎖邏輯 (與 Chance 相似)
// ==========================================
async function payAndStart() {
    const btn = document.getElementById("payStartBtn");
    if (!contract || !signer) {
        alert("請先回到首頁連接錢包！");
        location.href = 'index.html';
        return;
    }

    try {
        btn.innerText = "呼叫錢包中...";
        btn.disabled = true;
        // 將原本的 0.01 改為 0.0001
        const tx = await contract.payEntryFee({ value: ethers.parseEther("0.0001") });
        btn.innerText = "交易確認中 (請稍候)...";
        await tx.wait(); 
        
        document.getElementById("web3-gate").style.display = "none";
        document.getElementById("controls").style.display = "flex"; // 顯示操作按鈕
        updatePoolBalance(); 

        // 起點不能領獎，所以先隱藏「見好就收」按鈕
        document.getElementById("claimBtn").style.display = "none";

    } catch (error) {
        console.error("支付失敗:", error);
        alert("支付取消或失敗，無法開始遊戲。");
        btn.innerText = "🚀 支付並開始挑戰";
        btn.disabled = false;
    }
}

// ==========================================
// 2. 命運遊戲邏輯 (機率與跳躍)
// ==========================================

// 設定每一格的過關機率 (第0格是起點, 1~5是挑戰格)
const probabilities = [1.0, 0.9, 0.7, 0.5, 0.3, 0.1]; 
// 設定每一格可領取的獎池比例 (0%, 10%, 30%, 50%, 80%, 100%)
const prizePercentages = [0n, 10n, 30n, 50n, 80n, 100n]; 

let currentStep = 0;

function tryJump() {
    const nextStep = currentStep + 1;
    if (nextStep > 5) return; // 已經到最後一格了

    // 取得下一格的成功機率 (例如 0.9 代表 90%)
    const successRate = probabilities[nextStep];
    
    // 產生一個 0 到 1 之間的隨機數
    const randomRoll = Math.random();

    // 判斷是否成功
    if (randomRoll <= successRate) {
        // 成功跳躍！
        moveCat(nextStep);
    } else {
        // 失敗！
        gameOver();
    }
}

function moveCat(stepIndex) {
    // 1. 更新 UI 樣式
    document.getElementById(`step-${currentStep}`).classList.remove('active');
    document.getElementById(`step-${currentStep}`).classList.add('passed');
    currentStep = stepIndex;
    document.getElementById(`step-${currentStep}`).classList.add('active');

    // 2. 移動貓咪的位置 (每個 block 寬度 100px + gap 15px = 115px)
    // 起始 left 約為 45px
    const newLeft = 45 + (stepIndex * 115);
    document.getElementById('cat').style.left = `${newLeft}px`;

    // 3. 顯示「見好就收」按鈕 (因為已經離開起點了)
    document.getElementById("claimBtn").style.display = "inline-block";

    // 4. 如果跳到了最後一格(第5格)，隱藏跳躍按鈕，強迫他領獎
    if (currentStep === 5) {
        document.getElementById("jumpBtn").style.display = "none";
        alert("🎉 不可思議！你抵達了最後一格！趕快領取 100% 的獎金吧！");
    }
}

function gameOver() {
    // 讓貓咪掉下去的視覺效果
    document.getElementById('cat').style.bottom = "-100px";
    
    setTimeout(() => {
        alert("😿 糟糕！貓咪跳躍失敗掉下去了...\n你失去了入場費與累積的獎金。");
        location.href = 'index.html';
    }, 500);
}

// ==========================================
// 3. 提領當前累積獎金
// ==========================================
async function claimAndExit() {
    const claimBtn = document.getElementById("claimBtn");
    const jumpBtn = document.getElementById("jumpBtn");
    
    // 禁用按鈕防止重複點擊
    claimBtn.disabled = true;
    jumpBtn.disabled = true;
    claimBtn.innerText = "呼叫錢包領獎中...";

    try {
        // 1. 取得總獎池餘額
        const poolBalance = await contract.getPoolBalance();
        
        // 2. 計算該發送的獎金 (利用 BigInt 處理大數百分比乘法)
        // 公式： 餘額 * 比例 / 100
        const percent = prizePercentages[currentStep];
        const prizeAmount = (poolBalance * percent) / 100n;

        // 3. 取得玩家地址
        const winnerAddress = await signer.getAddress();

        // 4. 呼叫合約的 sendPrize 提款
        const tx = await contract.sendPrize(winnerAddress, prizeAmount);
        
        claimBtn.innerText = "獎金發送中 (請稍候)...";
        await tx.wait();

        alert(`💰 恭喜！你成功見好就收，領取了獎池 ${percent}% 的獎金！`);
        location.href = 'index.html';

    } catch (error) {
        console.error("領獎失敗:", error);
        alert("領獎過程發生錯誤。");
        claimBtn.innerText = "💰 見好就收 (領獎)";
        claimBtn.disabled = false;
        jumpBtn.disabled = false;
    }
}