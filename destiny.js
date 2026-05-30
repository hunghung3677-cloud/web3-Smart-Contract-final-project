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

        // ==========================================
        // 🌟 新增：在此處重置遊戲狀態與畫面 🌟
        // ==========================================
        
        // 1. 步數變數歸零 (⚠️ 請確認你程式碼中紀錄步數的變數是不是叫 currentStep，如果不是請換成你的變數名稱)
        currentStep = 0; 
        
        // 2. 貓咪畫面位置歸零
        const catElement = document.getElementById("cat"); // 確認 HTML 裡的 id 是 cat
        if(catElement) {
            catElement.style.left = "0px"; 
            // ⚠️ 註：如果你當初移動貓咪是用 transform，請改用下面這行：
            // catElement.style.transform = "translateX(0px)";
        }

        // 3. 賽道格子顏色歸零
        const blocks = document.querySelectorAll(".destiny-block");
        blocks.forEach(block => {
            block.style.backgroundColor = ""; // 恢復 CSS 預設顏色
            block.classList.remove("active"); // 若你有設定 active 狀態發光，一併清除
        });
        
        // ==========================================

    } catch (error) {
        console.error("支付失敗:", error);
        alert("支付取消或失敗，無法開始遊戲。");
        btn.innerText = "🚀 支付並開始挑戰";
        btn.disabled = false;
    }
}
