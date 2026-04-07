/**
 * api.js - 純淨後端對接版
 */

// ▼▼▼ 1. 設定後端網址 (請把這裡換成你的 ngrok 網址) ▼▼▼
// 注意：結尾不要有斜線 /
const API_BASE_URL = "http://localhost:3000/api";

const BRAND_ACCENT_COLORS = {
    Abarth: "#d52b1e",
    Acura: "#111111",
    "Alfa Romeo": "#981b1e",
    "Aston Martin": "#00665e",
    Audi: "#111111",
    Bentley: "#0f6b5a",
    BMW: "#1c69d4",
    Bugatti: "#cf0a2c",
    Cadillac: "#111111",
    Chevrolet: "#f1b434",
    Chrysler: "#4b5563",
    Dodge: "#b91c1c",
    Ducati: "#cc0000",
    Ferrari: "#d40032",
    Ford: "#003478",
    "Harley-Davidson": "#f97316",
    Honda: "#cc0000",
    Hummer: "#111111",
    Indian: "#7c2d12",
    Jaguar: "#0f766e",
    Jeep: "#556b2f",
    Kawasaki: "#22c55e",
    Koenigsegg: "#1f2937",
    KTM: "#f97316",
    Lamborghini: "#bfa14a",
    Lotus: "#166534",
    Maserati: "#1d4ed8",
    Mazda: "#111827",
    McLaren: "#f97316",
    "Mercedes-Benz": "#374151",
    Mitsubishi: "#dc2626",
    Nissan: "#c3002f",
    Pagani: "#111111",
    Peugeot: "#1f2937",
    Porsche: "#111111",
    Proto: "#4b5563",
    Renault: "#facc15",
    RUF: "#15803d",
    Saleen: "#dc2626",
    Shelby: "#2563eb",
    Spyker: "#111111",
    Suzuki: "#1d4ed8",
    Toyota: "#d90429",
    Volkswagen: "#0a58ca"
};

function escapeSvgText(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function svgToDataUri(svg) {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function wrapLabel(label, maxCharsPerLine = 14) {
    const words = String(label ?? "").trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return ["Image"];

    const lines = [];
    let current = "";

    words.forEach(word => {
        const next = current ? `${current} ${word}` : word;
        if (next.length <= maxCharsPerLine || !current) {
            current = next;
        } else {
            lines.push(current);
            current = word;
        }
    });

    if (current) lines.push(current);
    return lines.slice(0, 3);
}

function buildLabelImageDataUri(label, options = {}) {
    const width = options.width ?? 480;
    const height = options.height ?? 220;
    const background = options.background ?? "transparent";
    const border = options.border ?? "none";
    const accent = options.accent ?? "#111827";
    const textColor = options.textColor ?? accent;
    const fontWeight = options.fontWeight ?? 700;
    const fontFamily = options.fontFamily ?? "Arial, Helvetica, sans-serif";
    const lines = wrapLabel(label, options.maxCharsPerLine ?? 14);
    const fontSize = options.fontSize ?? (lines.length > 1 ? 42 : 58);
    const lineGap = Math.round(fontSize * 1.25);
    const startY = Math.round(height / 2 - ((lines.length - 1) * lineGap) / 2);
    const textNodes = lines
        .map((line, index) => (
            `<text x="${width / 2}" y="${startY + index * lineGap}" text-anchor="middle" dominant-baseline="middle" fill="${textColor}" font-size="${fontSize}" font-family="${fontFamily}" font-weight="${fontWeight}" letter-spacing="${options.letterSpacing ?? 1.5}">${escapeSvgText(line)}</text>`
        ))
        .join("");

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            <rect width="${width}" height="${height}" rx="${options.radius ?? 24}" fill="${background}" stroke="${border}" />
            ${textNodes}
        </svg>
    `.trim();

    return svgToDataUri(svg);
}

function buildBrandLogoPlaceholderSrc(brandName) {
    const accent = BRAND_ACCENT_COLORS[brandName] || "#9ca3af";
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="520" height="190" viewBox="0 0 520 190">
            <rect width="520" height="190" rx="24" fill="transparent"/>
            <g transform="translate(180 30)">
                <rect x="0" y="0" width="160" height="110" rx="18" fill="#f3f4f6" stroke="#d1d5db" stroke-width="4"/>
                <circle cx="120" cy="28" r="10" fill="${accent}" opacity="0.65"/>
                <path d="M20 90 L58 52 L84 78 L106 58 L140 90 Z" fill="${accent}" opacity="0.75"/>
                <rect x="42" y="-8" width="76" height="18" rx="9" fill="${accent}"/>
            </g>
        </svg>
    `.trim();
    return svgToDataUri(svg);
}

function buildCarPlaceholderSrc(label = "No Image") {
    return buildLabelImageDataUri(label, {
        width: 520,
        height: 300,
        background: "#f3f4f6",
        border: "#d1d5db",
        textColor: "#6b7280",
        fontSize: 34,
        fontWeight: 700,
        maxCharsPerLine: 16
    });
}

function buildTrackPlaceholderSrc(label = "Track") {
    return buildLabelImageDataUri(label, {
        width: 640,
        height: 320,
        background: "#eef2f7",
        border: "#dbe2ea",
        textColor: "#4b5563",
        fontSize: 36,
        fontWeight: 700,
        maxCharsPerLine: 18
    });
}

function buildFlagPlaceholderSrc(label = "Flag") {
    return buildLabelImageDataUri(label, {
        width: 160,
        height: 100,
        background: "#f3f4f6",
        border: "#d1d5db",
        textColor: "#6b7280",
        fontSize: 24,
        fontWeight: 700,
        maxCharsPerLine: 12,
        radius: 12
    });
}

function normalizeRemoteImageUrl(url) {
    const rawUrl = String(url ?? "").trim();
    if (!rawUrl) return "";
    if (/^data:/i.test(rawUrl) || /^images\//i.test(rawUrl) || /^[./]/.test(rawUrl)) {
        return rawUrl;
    }

    if (/static\.wikia\.nocookie\.net/i.test(rawUrl)) {
        return rawUrl
            .replace(/\/revision\/latest\/scale-to-width-down\/\d+/i, "/revision/latest/scale-to-width-down/512")
            .replace(/\/revision\/latest(?=(\?|$))/i, "/revision/latest/scale-to-width-down/512");
    }

    return rawUrl;
}

function isPlaceholderUrl(url) {
    const value = String(url ?? "");
    return /No-Image-Placeholder|placehold|placeholder/i.test(value)
        || (/^data:image\/svg\+xml/i.test(value) && /%3Ctext|<text/i.test(value));
}

function getBrandLogoSrc(brandName, rawUrl = "") {
    const normalized = normalizeRemoteImageUrl(rawUrl);
    if (!normalized || isPlaceholderUrl(normalized)) {
        return buildBrandLogoPlaceholderSrc(brandName);
    }
    return normalized;
}

function getCarImageSrc(rawUrl, label = "No Image") {
    const normalized = normalizeRemoteImageUrl(rawUrl);
    return normalized || buildCarPlaceholderSrc(label);
}

function getTrackImageSrc(rawUrl, label = "Track") {
    const normalized = normalizeRemoteImageUrl(rawUrl);
    return normalized || buildTrackPlaceholderSrc(label);
}

function getFlagImageSrc(rawUrl, label = "Flag") {
    const normalized = normalizeRemoteImageUrl(rawUrl);
    return normalized || buildFlagPlaceholderSrc(label);
}

function attachImageFallback(img, fallbackSrc) {
    if (!img) return;
    img.onerror = () => {
        img.onerror = null;
        img.src = fallbackSrc;
    };
}

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
        const isAdmin = res.data.isAdmin ?? res.data.IsAdmin ?? false;
        localStorage.setItem("authToken", res.data.token || res.data.Token);
        localStorage.setItem("playerId", res.data.playerId || res.data.PlayerId);
        localStorage.setItem("username", res.data.username || res.data.Username);
        localStorage.setItem("isAdmin", String(Boolean(isAdmin)));
        return { 
            player_id: res.data.playerId || res.data.PlayerId, 
            username: res.data.username || res.data.Username,
            is_admin: Boolean(isAdmin)
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
        const isAdmin = d.IsAdmin ?? d.isAdmin;
        if (isAdmin !== undefined) localStorage.setItem("isAdmin", String(Boolean(isAdmin)));
        
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

            podiums: d.TotalPodiums || d.totalPodiums || 0,
            
            // ★ 這是賽季排名的金銀銅杯
            seasonGold: d.Career1st || d.career1st || 0,
            seasonSilver: d.Career2nd || d.career2nd || 0,
            seasonBronze: d.Career3rd || d.career3rd || 0,
            
            // 註冊日期
            reg_date: d.RegDate || d.regDate,
            is_admin: Boolean(isAdmin),
            
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
            car_img: getCarImageSrc(c.carUrl, `${c.brandName} ${c.modelName}`),
            country_name: c.countryName,
            country_img: getFlagImageSrc(c.countryFlagUrl, c.countryName)
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
    if (!res.ok || !Array.isArray(res.data)) return [];
    return res.data.map(item => ({
        ...item,
        imageUrl: getBrandLogoSrc(item.name || item.Name || "", item.imageUrl || item.logoUrl || item.ImageUrl),
        countryFlagUrl: getFlagImageSrc(item.countryFlagUrl || item.CountryFlagUrl, item.name || item.Name || "Flag")
    }));
}

async function apiGetDealerCarsByBrand(brand) {
    const res = await fetchAPI(`/Market/dealer/cars?brand=${encodeURIComponent(brand)}`, "GET");
    if (!res.ok) return [];
    return res.data.map(c => ({
        model_id: c.modelId,
        model_name: c.modelName,
        brand: c.brandName,
        countryName: c.countryName || c.CountryName || "", // 確保大小寫都讀得到
        model_year: c.modelYear,
        base_price: c.basePrice,
        stock: c.stockQuantity,
        top_speed: c.topSpeed,
        power: c.power,
        car_img: getCarImageSrc(c.carUrl, `${c.brandName} ${c.modelName}`),
        brand_logo: getBrandLogoSrc(c.brandName, c.brandLogoUrl),
        country_img: getFlagImageSrc(c.countryFlagUrl, c.countryName || c.CountryName || "Flag")
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
        countryName: c.countryName || c.CountryName || "",
        sale_price: c.salePrice,
        listing_date: c.listingDate,
        mileage: c.mileage,
        car_img: getCarImageSrc(c.carUrl, `${c.brandName} ${c.modelName}`),
        country_img: getFlagImageSrc(c.countryFlagUrl, c.countryName || c.CountryName || "Flag")
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

async function apiCreateNewSeason(year) {
    return await fetchAPI("/Race/new-season", "POST", { SeasonYear: Number(year) });
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
        imageUrl: getTrackImageSrc(t.ImageUrl || t.imageUrl, t.Name || t.name || "Track")
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
            // 這裡也要防呆，避免屬性抓不到
            date: (r.SeasonYear || r.seasonYear) + " R" + (r.Round || r.round)
        }));
        
        return {
            username: d.Username || d.username,
            
            // ★ 修正重點：加上小寫相容 (camelCase) 與預設值 0
            totalScore: d.CareerTotalPoints || d.careerTotalPoints || 0,
            raceCount: d.TotalRaceCount || d.totalRaceCount || 0,

            // ★ 新增：小卡需要的豐富數據
            currentRank: d.CurrentRank || d.currentRank || "-",        // 目前排名
            raceWins: d.TotalWins || d.totalWins || 0,                 // 分站冠軍數
            podiums: d.TotalPodiums || d.totalPodiums || 0,            // 上頒獎台次數
            regDate: d.RegDate || d.regDate,
            
            // 賽季獎盃數據
            seasonGold: d.Career1st || d.career1st || 0,
            seasonSilver: d.Career2nd || d.career2nd || 0,
            seasonBronze: d.Career3rd || d.career3rd || 0,
            
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

// [已修正] 根據年份取得賽程表 (呼叫後端 API)
async function apiGetScheduleByYear(year) {
    const res = await fetchAPI(`/Race/schedules/${year}`, "GET");
    if(res.ok && Array.isArray(res.data)) {
        // 直接回傳後端整理好的 DTO
        return res.data;
    }
    return [];
}
