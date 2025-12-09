/**
 * api.js - 純淨後端對接版
 */

// ▼▼▼ 1. 設定後端網址 (請把這裡換成你的 ngrok 網址) ▼▼▼
// 注意：結尾不要有斜線 /
const API_BASE_URL = "https://peaked-verificatory-jodi.ngrok-free.dev/api";

// ▼▼▼ 通用連線工具 ▼▼▼
async function fetchAPI(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem("authToken");
    
    const headers = { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true' 
    };
    
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
        
        if (res.status === 401) {
            console.warn("Token 失效");
            return { ok: false, status: 401, data: null }; 
        }

        const text = await res.text();
        let data = {};
        if (text && (text.trim().startsWith('{') || text.trim().startsWith('['))) {
            try { data = JSON.parse(text); } catch (e) { console.error("JSON 解析失敗", e); }
        }
        
        return { ok: res.ok, status: res.status, data: data };
    } catch (err) {
        console.error("API 連線失敗:", err);
        return { ok: false, status: 500, data: { message: "連線失敗" } };
    }
}

// ==========================================
// 1. 使用者帳號 (User Account)
// ==========================================

async function apiLogin(username, password) {
    const res = await fetchAPI("/Players/login", "POST", { username, password });
    if (res.ok) {
        localStorage.setItem("authToken", res.data.token || res.data.Token);
        localStorage.setItem("playerId", res.data.playerId || res.data.PlayerId);
        localStorage.setItem("username", res.data.username || res.data.Username);
        return { 
            player_id: res.data.playerId || res.data.PlayerId, 
            username: res.data.username || res.data.Username 
        };
    }
    return null;
}

async function apiRegister(username, password) {
    const res = await fetchAPI("/Players/register", "POST", { username, password });
    // 後端回傳 PlayerDto 代表成功
    if (res.ok) return { success: true };
    return { success: false, message: res.data.message || "註冊失敗" };
}

// 修改密碼 (需提供舊密碼)
async function apiUpdateProfile(playerId, data) {
    // data 格式: { oldPassword, newPassword }
    const res = await fetchAPI(`/Players/${playerId}/password`, "PUT", {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword
    });
    
    if (res.ok) return { success: true };
    return { success: false, message: res.data.message || "更新失敗" };
}

// 刪除帳號
async function apiDeleteAccount(playerId) {
    const res = await fetchAPI(`/Players/${playerId}`, "DELETE");
    if (res.ok) return { success: true };
    return { success: false, message: res.data.message || "刪除失敗" };
}

// 取得完整個人資料 (含車庫、交易紀錄)
async function apiGetProfile(playerId) {
    const username = localStorage.getItem("username");
    if(!username) return null;

    const res = await fetchAPI(`/Players/profile/${username}?includePrivate=true`, "GET");
    if(res.ok) {
        const d = res.data;
        
        // 1. 呼叫車庫 API (為了取得圖片與國旗)
        const garageRes = await apiGetMyGarage();
        
        // 2. 處理交易紀錄 (大小寫相容)
        const rawTxs = d.transactions || d.Transactions || [];
        const formattedTxs = rawTxs.map(t => ({
            time: t.transTime || t.TransTime,
            type: t.type || t.Type,
            desc: t.description || t.Description,
            amount: t.amount || t.Amount,
            counterparty: "-" 
        }));

        // ★ 關鍵修正：這裡改成同時檢查「大寫」與「小寫」屬性
        // C# 預設回傳 JSON 會把首字轉小寫 (CareerTotalPoints -> careerTotalPoints)
        return {
            username: d.Username || d.username,
            money: d.Money || d.money,
            
            // 生涯數據
            totalScore: d.CareerTotalPoints || d.careerTotalPoints || 0,
            raceCount: d.TotalRaceCount || d.totalRaceCount || 0,
            // ★ 分開兩種冠軍數據
            raceWins: d.TotalWins || d.totalWins || 0, // 分站冠軍 (贏過幾場比賽)
            
            // ★ 這是賽季排名的金銀銅杯
            seasonGold: d.Career1st || d.career1st || 0,
            seasonSilver: d.Career2nd || d.career2nd || 0,
            seasonBronze: d.Career3rd || d.career3rd || 0,
            
            // 註冊日期
            reg_date: d.RegDate || d.regDate,
            
            cars: garageRes,       
            transactions: formattedTxs 
        };
    }
    return null;
}

// 取得我的車庫 (修正對應欄位)
async function apiGetMyGarage() {
    const res = await fetchAPI("/Players/garage", "GET");
    if(res.ok && Array.isArray(res.data)) {
        return res.data.map(c => ({
            car_id: c.carId,
            model_name: c.modelName,
            brand_name: c.brandName,
            model_year: c.modelYear,
            on_sale: c.onSale,
            sale_price: c.salePrice,
            obtain_date: c.obtainDate,
            mileage: c.mileage,
            listing_date: c.listingDate, // 上架時間
            
            // 圖片與國旗
            car_img: c.carUrl,
            country_name: c.countryName,
            country_img: c.countryFlagUrl
        }));
    }
    return [];
}

// ==========================================
// 2. 市場交易 (Market)
// ==========================================

// 車輛上架 / 下架
async function apiSetCarOnSale(playerId, carId, onSale, price) {
    if (onSale) {
        // 上架
        const res = await fetchAPI("/Market/sell", "POST", {
            sellerId: Number(playerId),
            carId: Number(carId),
            price: Number(price)
        });
        return res.ok ? { success: true } : { success: false, message: res.data?.message };
    } else {
        // 下架 (取消販售)
        const res = await fetchAPI("/Market/cancel-sell", "POST", {
            sellerId: Number(playerId),
            carId: Number(carId)
        });
        return res.ok ? { success: true } : { success: false, message: res.data?.message };
    }
}

// 購買二手車
async function apiBuyCar(carId) {
    const buyerId = localStorage.getItem("playerId");
    const res = await fetchAPI("/Market/purchase-used", "POST", { 
        buyerId: Number(buyerId), 
        carId: Number(carId) 
    });
    return res.ok ? { success: true } : { success: false, message: res.data?.message };
}

// 購買新車
async function apiBuyDealerCar(modelId) {
    const buyerId = localStorage.getItem("playerId");
    const res = await fetchAPI("/Market/buy", "POST", { 
        buyerId: Number(buyerId), 
        modelId: Number(modelId) 
    });
    return res.ok ? { success: true } : { success: false, message: res.data?.message };
}

async function apiGetDealerBrands() {
    const res = await fetchAPI("/Market/options/brands", "GET");
    return res.ok ? res.data : [];
}

async function apiGetDealerCarsByBrand(brand) {
    const res = await fetchAPI(`/Market/dealer/cars?brand=${encodeURIComponent(brand)}`, "GET");
    if (!res.ok) return [];
    return res.data.map(c => ({
        model_id: c.modelId,
        model_name: c.modelName,
        brand: c.brandName,
        countryName: c.countryName,
        model_year: c.modelYear,
        base_price: c.basePrice,
        stock: c.stockQuantity,
        top_speed: c.topSpeed,
        power: c.power,
        car_img: c.carUrl,
        brand_logo: c.brandLogoUrl,
        country_img: c.countryFlagUrl
    }));
}

async function apiGetUsedCars(q="", country="") {
    const params = new URLSearchParams();
    if(q) params.append("q", q);
    if(country && country !== "All") params.append("country", country);
    
    const res = await fetchAPI(`/Market/used-cars?${params.toString()}`, "GET");
    if (!res.ok) return [];
    return res.data.map(c => ({
        player_car_id: c.carId,
        seller_name: c.sellerName,
        seller_id: 0, 
        brand_name: c.brandName,
        model_name: c.modelName,
        model_year: c.modelYear,
        countryName: c.countryName,
        sale_price: c.salePrice,
        listing_date: c.listingDate,
        mileage: c.mileage,
        car_img: c.carUrl,
        country_img: c.countryFlagUrl
    }));
}

async function apiGetCountries() {
    const res = await fetchAPI("/Market/options/countries", "GET");
    return res.ok ? res.data : [];
}

// ==========================================
// 3. 排行榜與賽事 (Leaderboard & Race)
// ==========================================

async function apiGetYears() {
    const res = await fetchAPI("/Track/options/years", "GET");
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) return res.data;
    return [2024]; 
}

async function apiGetGlobalNextRace() {
    const res = await fetchAPI("/Race/next-global", "GET");
    if(res.ok) return res.data;
    return null;
}

async function apiGetNextSchedule(year) {
    const res = await fetchAPI(`/Race/next-schedule/${year}`, "GET");
    return res.ok ? res.data : null;
}

async function apiSimulateRace(year) {
    return await fetchAPI("/Race/simulate-next", "POST", { SeasonYear: Number(year) });
}

async function apiGetLeaderboardByYear(year) {
    let url = (year === 'all') ? "/Leaderboard/standings/all" : `/Leaderboard/standings/${year}`;
    const res = await fetchAPI(url, "GET");
    if (res.ok && Array.isArray(res.data)) {
        return res.data.map(item => ({
            rank: item.Rank || item.rank,
            username: item.Username || item.username,
            score: item.TotalPoints || item.totalPoints,
            winCount: item.WinCount || item.winCount,
            podiumCount: item.PodiumCount || item.podiumCount,
            raceCount: item.RaceCount || item.raceCount
        }));
    }
    return [];
}

async function apiGetTrackLeaderboard(trackName, year, playerName, carName) {
    const params = new URLSearchParams();
    params.append("trackName", trackName);
    if (year && year !== 'all') params.append("year", year);
    if (playerName) params.append("playerName", playerName);
    if (carName) params.append("carName", carName);

    const res = await fetchAPI(`/Track/history?${params.toString()}`, "GET");
    if(res.ok) {
        return res.data.map(item => ({
            rank: item.Rank || item.rank,
            username: item.PlayerName || item.playerName,
            carName: item.CarName || item.carName,
            bestTime: formatTime(item.FinishTime || item.finishTime),
            date: item.RaceDate || item.raceDate
        }));
    }
    return [];
}

async function apiGetTracks() {
    const res = await fetchAPI("/Track/options/tracks", "GET");
    return res.ok ? res.data.map(t => ({
        name: t.Name || t.name,
        length: t.Length || t.length,
        imageUrl: t.ImageUrl || t.imageUrl
    })) : [];
}

// 取得玩家詳細資料 (彈窗用)
async function apiGetPlayerDetail(username) {
    const res = await fetchAPI(`/Players/profile/${username}`, "GET");
    if(res.ok) {
        const d = res.data;
        const recent = (d.RecentRaces || d.recentRaces || []).map(r => ({
            trackName: r.TrackName || r.trackName,
            bestTime: formatTime(r.FinishTime || r.finishTime),
            date: r.SeasonYear + " R" + r.Round
        }));
        return {
            username: d.Username,
            totalScore: d.CareerTotalPoints,
            raceCount: d.TotalRaceCount,
            winCount: d.TotalWins,
            recentRecords: recent
        };
    }
    return null;
}

// 取得玩家該年度排名 (Profile用)
async function apiGetPlayerRankByYear(year, username) {
    const res = await fetchAPI(`/Leaderboard/standings/${year}?playerName=${encodeURIComponent(username)}`, "GET");
    if(res.ok && res.data.length > 0) {
        return { rank: res.data[0].Rank || res.data[0].rank };
    }
    return { rank: 0 };
}

function formatTime(ms) {
    if (!ms) return "-";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
}