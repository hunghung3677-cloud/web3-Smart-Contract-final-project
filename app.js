// 1. 貼上你的合約地址
const contractAddress = "0x646758882c181D2FB46f48aF239e7A1762abc7C1"; 

// 2. 貼上你剛剛複製的 ABI
const contractABI = [
  {
    "inputs": [],
    "name": "fundActivePool",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "fundReservePool",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "payEntryFee",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address payable",
        "name": "winner",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "sendPrize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "activePool",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "entryFee",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPoolBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getReserveBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "hasPaid",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "reservePool",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

let provider;
let signer;
let contract;

// ==========================================
// 新增：網頁一載入就自動執行的監聽事件
// ==========================================
window.addEventListener('load', async () => {
    if (typeof window.ethereum !== 'undefined') {
        // 1. 建立「唯讀」的 Provider (不需使用者登入就能讀取區塊鏈資料)
        provider = new ethers.BrowserProvider(window.ethereum);
        
        // 2. 建立唯讀的合約實體
        contract = new ethers.Contract(contractAddress, contractABI, provider);
        
        // 3. 網頁一打開，就算沒連錢包，也立刻讀取並顯示總獎池！
        updatePoolBalance();

        // 4. 檢查使用者是否「曾經」授權連接過這個網站
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            // 如果 length > 0，代表已經授權過，我們就自動恢復他的連線狀態
            await setupConnectedState();
        }
    } else {
        console.log("未偵測到 MetaMask");
    }
});

// ==========================================
// 提取出來的共用邏輯：設定為已連接狀態
// ==========================================
async function setupConnectedState() {
    signer = await provider.getSigner();
    
    // 升級合約實體：將 signer 放進去，這樣合約就有了「寫入/付錢」的權限
    contract = new ethers.Contract(contractAddress, contractABI, signer);
    
    // 更新畫面 UI
    const address = await signer.getAddress();
    document.getElementById("walletAddress").innerText = `已連接: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    document.getElementById("connectWalletBtn").classList.replace("btn-primary", "btn-success");
    document.getElementById("connectWalletBtn").innerText = "錢包已連接";
}

// ==========================================
// 原本的手動連接按鈕功能
// ==========================================
async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // 跳出 MetaMask 請求授權
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // 如果 provider 還沒初始化，就初始化一次
            if (!provider) provider = new ethers.BrowserProvider(window.ethereum);
            
            // 執行已連接狀態的 UI 更新
            await setupConnectedState();
            
        } catch (error) {
            console.error("使用者拒絕連接或發生錯誤:", error);
        }
    } else {
        alert("請先安裝 MetaMask 擴充功能！");
    }
}

// ==========================================
// 讀取獎池餘額的功能
// ==========================================
// ==========================================
// 讀取獎池餘額的功能 (改為顯示 GWEI)
// ==========================================
async function updatePoolBalance() {
    try {
        const balanceWei = await contract.getPoolBalance();
        
        // 1. 將 WEI 單位轉換為 GWEI 格式的字串
        const balanceGweiStr = ethers.formatUnits(balanceWei, "gwei");
        
        // 2. 轉為浮點數，並加上千分位逗號（最多保留到小數點後 9 位，若為整數則不顯示小數點）
        const balanceGweiNum = parseFloat(balanceGweiStr);
        const displayGwei = balanceGweiNum.toLocaleString(undefined, { 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 9 
        });
        
        // 3. 更新畫面，尾碼改為 GWEI
        document.getElementById("poolBalance").innerText = `${displayGwei} GWEI`;
    } catch (error) {
        console.error("讀取獎池金額失敗:", error);
    }
}