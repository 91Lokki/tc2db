/**
 * api.js
 * 模擬後端資料庫 (Relational Schema)
 * 修正版：修復排行榜彈窗「最近十場成績」無法顯示的問題
 */

// ==========================================
// 1. 靜態資料表 (Static Data Tables)
// ==========================================

// --- TABLE: COUNTRY ---
const DB_COUNTRIES = [
    { country_id: 1, country_name: "Japan", flag_url: "img/flag-jp.png" },
    { country_id: 2, country_name: "Germany", flag_url: "img/flag-de.png" },
    { country_id: 3, country_name: "Italy", flag_url: "img/flag-it.png" },
    { country_id: 4, country_name: "USA", flag_url: "img/flag-us.png" },
    { country_id: 5, country_name: "UK", flag_url: "img/flag-gb.png" },
    { country_id: 6, country_name: "France", flag_url: "img/flag-fr.png" }
];

// --- TABLE: BRAND ---
const DB_BRANDS = [
    { brand_id: 1, country_id: 1, brand_name: "Honda", logo_url: "img/brand-honda.png" },
    { brand_id: 2, country_id: 1, brand_name: "Toyota", logo_url: "img/brand-toyota.png" },
    { brand_id: 3, country_id: 1, brand_name: "Nissan", logo_url: "img/brand-nissan.png" },
    { brand_id: 4, country_id: 2, brand_name: "BMW", logo_url: "img/brand-bmw.png" },
    { brand_id: 5, country_id: 2, brand_name: "Mercedes-Benz", logo_url: "img/brand-mercedes.png" },
    { brand_id: 6, country_id: 2, brand_name: "Audi", logo_url: "img/brand-audi.png" },
    { brand_id: 7, country_id: 2, brand_name: "Porsche", logo_url: "img/brand-porsche.png" },
    { brand_id: 8, country_id: 3, brand_name: "Ferrari", logo_url: "img/brand-ferrari.png" },
    { brand_id: 9, country_id: 3, brand_name: "Lamborghini", logo_url: "img/brand-lamborghini.png" },
    { brand_id: 10, country_id: 1, brand_name: "Mazda", logo_url: "img/brand-mazda.png" },
    { brand_id: 11, country_id: 1, brand_name: "Subaru", logo_url: "img/brand-subaru.png" },
    { brand_id: 12, country_id: 4, brand_name: "Ford", logo_url: "img/brand-ford.png" },
    { brand_id: 13, country_id: 4, brand_name: "Chevrolet", logo_url: "img/brand-chevrolet.png" },
    { brand_id: 14, country_id: 4, brand_name: "Dodge", logo_url: "img/brand-dodge.png" }
];

// --- TABLE: CAR_MODEL ---
const DB_CAR_MODELS = [
    { model_id: 201, brand_id: 1, model_name: "Civic Type R", base_price: 150000, car_url: "img/car-honda-civic-type-r.png" },
    { model_id: 202, brand_id: 1, model_name: "NSX", base_price: 350000, car_url: "img/car-honda-nsx.png" },
    { model_id: 203, brand_id: 2, model_name: "Supra GR", base_price: 180000, car_url: "img/car-toyota-supra-gr.png" },
    { model_id: 204, brand_id: 2, model_name: "GR86", base_price: 120000, car_url: "img/car-toyota-gr86.png" },
    { model_id: 205, brand_id: 3, model_name: "GT-R", base_price: 300000, car_url: "img/car-nissan-gtr.png" },
    { model_id: 206, brand_id: 4, model_name: "M4", base_price: 250000, car_url: "img/car-bmw-m4.png" },
    { model_id: 207, brand_id: 4, model_name: "M2 Competition", base_price: 220000, car_url: "img/car-bmw-m2.png" },
    { model_id: 208, brand_id: 5, model_name: "AMG C63", base_price: 270000, car_url: "img/car-mercedes-amg-c63.png" },
    { model_id: 209, brand_id: 6, model_name: "RS5", base_price: 260000, car_url: "img/car-audi-rs5.png" },
    { model_id: 210, brand_id: 7, model_name: "911 Carrera", base_price: 400000, car_url: "img/car-porsche-911.png" },
    { model_id: 211, brand_id: 9, model_name: "Huracán EVO", base_price: 600000, car_url: "img/car-lamborghini-huracan.png" },
    { model_id: 212, brand_id: 8, model_name: "488 GTB", base_price: 650000, car_url: "img/car-ferrari-488.png" },
    { model_id: 213, brand_id: 11, model_name: "WRX STI", base_price: 140000, car_url: "img/car-subaru-wrx-sti.png" },
    { model_id: 214, brand_id: 10, model_name: "RX-7 Spirit R", base_price: 200000, car_url: "img/car-mazda-rx7.png" },
    { model_id: 226, brand_id: 12, model_name: "Mustang GT", base_price: 240000, car_url: "img/car-ford-mustang-gt.png" },
    { model_id: 222, brand_id: 13, model_name: "Corvette C7 ZR1", base_price: 240000, car_url: "img/car-chevrolet-corvette-zr1.png" },
    { model_id: 224, brand_id: 14, model_name: "Challenger SRT Hellcat", base_price: 240000, car_url: "img/car-dodge-challenger-hellcat.png" }
];

// --- TABLE: TRACK (模擬) ---
const DB_TRACKS = [
    { track_id: 1, track_name: "New York Rush" },
    { track_id: 2, track_name: "Tokyo Express" },
    { track_id: 3, track_name: "San Francisco" },
    { track_id: 4, track_name: "Las Vegas Final" }
];

const AVAILABLE_YEARS = [2023, 2024, 2025];
const CURRENT_SEASON_YEAR = 2024;

// ==========================================
// 2. LocalStorage 資料庫模擬 (Helpers)
// ==========================================

const TBL_PLAYER = "table_player";
const TBL_SEASON_POINTS = "table_season_points";
const TBL_PLAYER_CAR = "table_player_car";
const TBL_TRANSACTION = "table_transaction";

// 通用讀取
function loadTable(tableName) {
    const raw = localStorage.getItem(tableName);
    if (!raw) return [];
    try {
        return JSON.parse(raw) || [];
    } catch {
        return [];
    }
}

// 通用寫入
function saveTable(tableName, data) {
    localStorage.setItem(tableName, JSON.stringify(data));
}

// ==========================================
// 3. 假資料生成 (Dummy Data Generator)
// ==========================================

function initDatabase() {
    let players = loadTable(TBL_PLAYER);
    if (players.length === 0) {
        console.log("初始化假資料...");
        createDummyData();
    } else {
        // 確保 SEASON_POINTS 完整
        ensureSeasonPoints();
    }
}

function createDummyData() {
    // 1. 建立 Players
    const dummyPlayers = [
        { player_id: 1, username: "nyking", password: "123", money: 500000, reg_date: "2023-01-01T10:00:00Z" },
        { player_id: 2, username: "carGodB", password: "123", money: 600000, reg_date: "2023-02-15T12:00:00Z" },
        { player_id: 3, username: "tokyoDemon", password: "123", money: 800000, reg_date: "2023-03-20T09:30:00Z" },
        { player_id: 4, username: "coolDriver", password: "123", money: 450000, reg_date: "2023-05-10T14:20:00Z" },
        { player_id: 5, username: "rookie", password: "123", money: 200000, reg_date: "2024-01-05T16:00:00Z" }
    ];
    saveTable(TBL_PLAYER, dummyPlayers);

    // 2. 建立 Season Points
    const pointsData = [];
    const scoreMap = {
        "nyking": { 2023: 38000, 2024: 42000, 2025: 50000 },
        "carGodB": { 2023: 36000, 2024: 41000, 2025: 48000 },
        "tokyoDemon": { 2023: 39000, 2024: 43000, 2025: 52000 },
        "coolDriver": { 2023: 34000, 2024: 38000, 2025: 45000 },
        "rookie": { 2023: 5000, 2024: 8000, 2025: 12000 }
    };

    dummyPlayers.forEach(p => {
        AVAILABLE_YEARS.forEach(year => {
            const score = scoreMap[p.username] ? scoreMap[p.username][year] : 0;
            const win = Math.floor(score / 20000);
            pointsData.push({
                player_id: p.player_id,
                season_year: year,
                points: score,
                final_rank: 0,
                race_count: Math.max(5, Math.floor(score / 3000)),
                win_count: win,
                sec_count: Math.floor(win * 1.5),
                trd_count: Math.floor(win * 2)
            });
        });
    });
    saveTable(TBL_SEASON_POINTS, pointsData);
    recalcRankings();

    // 3. 建立 Player Cars
    const carsData = [];
    let carIdCounter = 1;
    dummyPlayers.forEach((p, idx) => {
        const model = DB_CAR_MODELS[idx % DB_CAR_MODELS.length];
        carsData.push({
            car_id: carIdCounter++,
            player_id: p.player_id,
            model_id: model.model_id,
            obtain_date: p.reg_date,
            mileage: 1000 + idx * 500,
            on_sale: idx % 2 === 0,
            sale_price: model.base_price * 0.8,
            listing_date: idx % 2 === 0 ? new Date().toISOString() : null
        });
    });
    saveTable(TBL_PLAYER_CAR, carsData);

    // 4. 初始化 Transactions
    saveTable(TBL_TRANSACTION, []);
}

function ensureSeasonPoints() {
    let points = loadTable(TBL_SEASON_POINTS);
    const players = loadTable(TBL_PLAYER);
    let changed = false;

    players.forEach(p => {
        AVAILABLE_YEARS.forEach(y => {
            const exists = points.find(r => r.player_id === p.player_id && r.season_year === y);
            if (!exists) {
                points.push({
                    player_id: p.player_id,
                    season_year: y,
                    points: 0,
                    final_rank: 0,
                    race_count: 0,
                    win_count: 0,
                    sec_count: 0,
                    trd_count: 0
                });
                changed = true;
            }
        });
    });

    if (changed) {
        saveTable(TBL_SEASON_POINTS, points);
        recalcRankings();
    }
}

function recalcRankings() {
    let points = loadTable(TBL_SEASON_POINTS);
    AVAILABLE_YEARS.forEach(year => {
        const list = points.filter(r => r.season_year === year);
        list.sort((a, b) => b.points - a.points);
        list.forEach((r, idx) => {
            r.final_rank = idx + 1;
        });
    });
    saveTable(TBL_SEASON_POINTS, points);
}

// 執行初始化
initDatabase();


// ==========================================
// 4. API 實作 (Auth & Profile)
// ==========================================

function apiLogin(username, password) {
    return new Promise(resolve => {
        const players = loadTable(TBL_PLAYER);
        const user = players.find(p => p.username === username && p.password === password);
        resolve(user || null);
    });
}

function apiRegister(username, password) {
    return new Promise(resolve => {
        const players = loadTable(TBL_PLAYER);
        if (players.find(p => p.username === username)) {
            resolve({ success: false, message: "帳號已存在" });
            return;
        }

        const maxId = players.reduce((max, p) => Math.max(max, p.player_id), 0);
        const newId = maxId + 1;
        const now = new Date().toISOString();

        const newPlayer = {
            player_id: newId,
            username: username,
            password: password,
            money: 500000,
            reg_date: now
        };
        players.push(newPlayer);
        saveTable(TBL_PLAYER, players);

        const points = loadTable(TBL_SEASON_POINTS);
        AVAILABLE_YEARS.forEach(y => {
            points.push({
                player_id: newId,
                season_year: y,
                points: 0,
                final_rank: 0,
                race_count: 0,
                win_count: 0,
                sec_count: 0,
                trd_count: 0
            });
        });
        saveTable(TBL_SEASON_POINTS, points);

        const cars = loadTable(TBL_PLAYER_CAR);
        const maxCarId = cars.reduce((max, c) => Math.max(max, c.car_id), 0);
        cars.push({
            car_id: maxCarId + 1,
            player_id: newId,
            model_id: 204, // Starter Car: Toyota GR86
            obtain_date: now,
            mileage: 0,
            on_sale: false,
            sale_price: 0,
            listing_date: null
        });
        saveTable(TBL_PLAYER_CAR, cars);

        resolve({ success: true, user: newPlayer });
    });
}

function apiDeleteAccount(playerId) {
    return new Promise(resolve => {
        const pid = Number(playerId);
        let players = loadTable(TBL_PLAYER);
        let points = loadTable(TBL_SEASON_POINTS);
        let cars = loadTable(TBL_PLAYER_CAR);

        if (!players.find(p => p.player_id === pid)) {
            resolve({ success: false, message: "找不到玩家" });
            return;
        }

        players = players.filter(p => p.player_id !== pid);
        points = points.filter(r => r.player_id !== pid);
        cars = cars.filter(c => c.player_id !== pid);

        saveTable(TBL_PLAYER, players);
        saveTable(TBL_SEASON_POINTS, points);
        saveTable(TBL_PLAYER_CAR, cars);

        resolve({ success: true });
    });
}

function apiUpdateProfile(playerId, data) {
    return new Promise(resolve => {
        const pid = Number(playerId);
        const players = loadTable(TBL_PLAYER);
        const user = players.find(p => p.player_id === pid);

        if (!user) {
            resolve(null);
            return;
        }

        if (data.password) user.password = data.password;
        saveTable(TBL_PLAYER, players);
        resolve(user);
    });
}

/**
 * 取得完整個人資料 (模擬 JOIN)
 */
function apiGetProfile(playerId) {
    return new Promise(resolve => {
        const pid = Number(playerId);
        const players = loadTable(TBL_PLAYER);
        const user = players.find(p => p.player_id === pid);
        if (!user) { resolve(null); return; }

        const points = loadTable(TBL_SEASON_POINTS).filter(r => r.player_id === pid);
        let totalScore = 0, totalRaces = 0, winCount = 0, secCount = 0, trdCount = 0;

        points.forEach(r => {
            totalScore += (r.points || 0);
            totalRaces += (r.race_count || 0);
            winCount += (r.win_count || 0);
            secCount += (r.sec_count || 0);
            trdCount += (r.trd_count || 0);
        });

        const myCarsRaw = loadTable(TBL_PLAYER_CAR).filter(c => c.player_id === pid);
        const enrichedCars = myCarsRaw.map(c => {
            const model = DB_CAR_MODELS.find(m => m.model_id === c.model_id);
            const brand = model ? DB_BRANDS.find(b => b.brand_id === model.brand_id) : {};
            const country = brand ? DB_COUNTRIES.find(ct => ct.country_id === brand.country_id) : {};

            return {
                car_id: c.car_id,
                model_name: model ? model.model_name : "Unknown",
                brand_name: brand ? brand.brand_name : "Unknown",
                car_img: model ? model.car_url : "img/car-default.png",
                on_sale: c.on_sale,
                sale_price: c.sale_price,
                base_price: model ? model.base_price : 0,
                obtain_date: c.obtain_date
            };
        });

        resolve({
            player_id: user.player_id,
            username: user.username,
            money: user.money,
            reg_date: user.reg_date,
            totalScore,
            raceCount: totalRaces,
            winCount: winCount,
            secCount: secCount,
            trdCount: trdCount,
            cars: enrichedCars
        });
    });
}

// 供 leaderboard 點擊使用 (JOIN SEASON_POINTS & 查詢 MOCK_TRACK_RECORDS)
function apiGetPlayerDetail(username) {
    return new Promise(resolve => {
        const players = loadTable(TBL_PLAYER);
        const user = players.find(p => p.username === username);
        if (!user) { resolve(null); return; }

        apiGetProfile(user.player_id).then(profile => {
            // ★ 修正：從 MOCK_TRACK_RECORDS 找出該玩家的紀錄
            const records = [];
            // MOCK_TRACK_RECORDS 定義在檔案下方，JS hoisting 不適用於 const，所以這裡確保執行時已讀到
            // 或者將 MOCK_TRACK_RECORDS 移到上方。
            // 這裡假設 MOCK_TRACK_RECORDS 為全域變數，因為定義在下面
            
            if (typeof MOCK_TRACK_RECORDS !== 'undefined') {
                Object.keys(MOCK_TRACK_RECORDS).forEach(trackName => {
                    const entries = MOCK_TRACK_RECORDS[trackName];
                    const entry = entries.find(r => r.username === username);
                    if (entry) {
                        records.push({
                            trackName: trackName,
                            bestTime: entry.bestTime,
                            points: entry.points
                        });
                    }
                });
            }
            
            profile.recentRecords = records;
            resolve(profile);
        });
    });
}

// ==========================================
// 5. API 實作 (Car Shop & Trade)
// ==========================================

function apiGetDealerBrands() {
    const names = DB_BRANDS.map(b => b.brand_name).sort();
    return Promise.resolve(names);
}

function apiGetDealerCarsByBrand(brandName) {
    return new Promise(resolve => {
        const brand = DB_BRANDS.find(b => b.brand_name === brandName);
        if (!brand) { resolve([]); return; }

        const country = DB_COUNTRIES.find(c => c.country_id === brand.country_id);
        const models = DB_CAR_MODELS.filter(m => m.brand_id === brand.brand_id);

        const result = models.map(m => ({
            model_id: m.model_id,
            model_name: m.model_name,
            base_price: m.base_price,
            car_img: m.car_url,
            brand: brand.brand_name,
            brand_logo: brand.logo_url,
            country_img: country ? country.flag_url : ""
        }));
        resolve(result);
    });
}

function apiBuyDealerCar(carModelId) {
    return new Promise(resolve => {
        const myId = Number(localStorage.getItem("playerId"));
        if (!myId) { resolve({ success: false, message: "未登入" }); return; }

        const players = loadTable(TBL_PLAYER);
        const user = players.find(p => p.player_id === myId);
        const model = DB_CAR_MODELS.find(m => m.model_id === Number(carModelId));

        if (!user || !model) { resolve({ success: false, message: "資料錯誤" }); return; }
        if (user.money < model.base_price) { resolve({ success: false, message: "金錢不足" }); return; }

        user.money -= model.base_price;
        saveTable(TBL_PLAYER, players);

        const cars = loadTable(TBL_PLAYER_CAR);
        const maxId = cars.reduce((max, c) => Math.max(max, c.car_id), 0);
        const newCar = {
            car_id: maxId + 1,
            player_id: myId,
            model_id: model.model_id,
            obtain_date: new Date().toISOString(),
            mileage: 0,
            on_sale: false,
            sale_price: 0,
            listing_date: null
        };
        cars.push(newCar);
        saveTable(TBL_PLAYER_CAR, cars);

        const txs = loadTable(TBL_TRANSACTION);
        const maxTxId = txs.reduce((max, t) => Math.max(max, t.trans_id || 0), 0);
        txs.push({
            trans_id: maxTxId + 1,
            buyer_id: myId,
            seller_id: 0,
            car_id: newCar.car_id,
            amount: model.base_price,
            trans_time: new Date().toISOString(),
            type: "BUY_DEALER"
        });
        saveTable(TBL_TRANSACTION, txs);

        resolve({ success: true, money: user.money });
    });
}

function apiGetUsedCars() {
    return new Promise(resolve => {
        const cars = loadTable(TBL_PLAYER_CAR);
        const players = loadTable(TBL_PLAYER);

        const onSaleCars = cars.filter(c => c.on_sale);

        const result = onSaleCars.map(c => {
            const model = DB_CAR_MODELS.find(m => m.model_id === c.model_id);
            const brand = model ? DB_BRANDS.find(b => b.brand_id === model.brand_id) : {};
            const seller = players.find(p => p.player_id === c.player_id);
            const country = brand ? DB_COUNTRIES.find(ct => ct.country_id === brand.country_id) : {};

            return {
                player_car_id: c.car_id,
                seller_name: seller ? seller.username : "Unknown",
                seller_id: c.player_id,
                brand_name: brand ? brand.brand_name : "-",
                model_name: model ? model.model_name : "-",
                sale_price: c.sale_price,
                listing_date: c.listing_date,
                car_img: model ? model.car_url : "",
                brand_logo: brand ? brand.logo_url : "",
                country_img: country ? country.flag_url : ""
            };
        });

        result.sort((a, b) => {
            return new Date(b.listing_date).getTime() - new Date(a.listing_date).getTime();
        });

        resolve(result);
    });
}

function apiSetCarOnSale(playerId, carId, onSale, price) {
    return new Promise(resolve => {
        const cars = loadTable(TBL_PLAYER_CAR);
        const car = cars.find(c => c.car_id === Number(carId) && c.player_id === Number(playerId));

        if (!car) { resolve({ success: false, message: "找不到車輛" }); return; }

        car.on_sale = !!onSale;
        if (onSale) {
            car.sale_price = Number(price);
            car.listing_date = new Date().toISOString();
        } else {
            car.sale_price = 0;
            car.listing_date = null;
        }

        saveTable(TBL_PLAYER_CAR, cars);
        resolve({ success: true });
    });
}

function apiBuyCar(targetCarId) {
    return new Promise(resolve => {
        const buyerId = Number(localStorage.getItem("playerId"));
        const carId = Number(targetCarId);

        const players = loadTable(TBL_PLAYER);
        const cars = loadTable(TBL_PLAYER_CAR);
        const txs = loadTable(TBL_TRANSACTION);

        const buyer = players.find(p => p.player_id === buyerId);
        const car = cars.find(c => c.car_id === carId);

        if (!buyer || !car) { resolve({ success: false, message: "交易失敗：資料錯誤" }); return; }
        if (!car.on_sale) { resolve({ success: false, message: "此車已下架" }); return; }
        if (car.player_id === buyerId) { resolve({ success: false, message: "不能買自己的車" }); return; }
        if (buyer.money < car.sale_price) { resolve({ success: false, message: "餘額不足" }); return; }

        const sellerId = car.player_id;
        const seller = players.find(p => p.player_id === sellerId);
        const price = car.sale_price;

        buyer.money -= price;
        if (seller) seller.money += price;
        saveTable(TBL_PLAYER, players);

        car.player_id = buyerId;
        car.on_sale = false;
        car.sale_price = 0;
        car.listing_date = null;
        saveTable(TBL_PLAYER_CAR, cars);

        const maxTxId = txs.reduce((max, t) => Math.max(max, t.trans_id || 0), 0);
        txs.push({
            trans_id: maxTxId + 1,
            buyer_id: buyerId,
            seller_id: sellerId,
            car_id: carId,
            amount: price,
            trans_time: new Date().toISOString(),
            type: "BUY_USED"
        });
        saveTable(TBL_TRANSACTION, txs);

        resolve({ success: true, money: buyer.money });
    });
}

function apiGetTransactions(playerId) {
    return new Promise(resolve => {
        const pid = Number(playerId);
        const txs = loadTable(TBL_TRANSACTION);
        const players = loadTable(TBL_PLAYER);
        const cars = loadTable(TBL_PLAYER_CAR);

        const myTxs = txs.filter(t => t.buyer_id === pid || t.seller_id === pid);

        myTxs.sort((a, b) => new Date(b.trans_time).getTime() - new Date(a.trans_time).getTime());

        const result = myTxs.map(t => {
            const isBuy = (t.buyer_id === pid);
            const counterId = isBuy ? t.seller_id : t.buyer_id;
            let counterName = "Dealer";
            if (counterId !== 0) {
                const p = players.find(u => u.player_id === counterId);
                counterName = p ? p.username : "Unknown";
            }
            
            const relatedCar = cars.find(c => c.car_id === t.car_id);
            let carName = "Car #" + t.car_id;
            if (relatedCar) {
                const model = DB_CAR_MODELS.find(m => m.model_id === relatedCar.model_id);
                if (model) carName = model.model_name;
            }

            return {
                time: t.trans_time,
                type: t.type,
                counterparty: counterName,
                desc: carName,
                amount: t.amount
            };
        });

        resolve(result);
    });
}


// ==========================================
// 6. API 實作 (Leaderboard & Race)
// ==========================================

// 賽道紀錄 API (模擬 RACE_RECORD)
// ★ 注意：這裡的資料要放在 apiGetPlayerDetail 之前被定義，或是 apiGetPlayerDetail 裡面要能存取到
const MOCK_TRACK_RECORDS = {
    "New York Rush": [
        { rank: 1, username: "nyking", bestTime: "02:00.00", points: 500 },
        { rank: 2, username: "carGodB", bestTime: "02:05.20", points: 450 },
        { rank: 3, username: "tokyoDemon", bestTime: "02:08.00", points: 400 } // 補上一筆讓範例有資料
    ],
    "Tokyo Express": [
        { rank: 1, username: "tokyoDemon", bestTime: "01:55.00", points: 600 },
        { rank: 2, username: "coolDriver", bestTime: "02:01.80", points: 550 }
    ]
};

function apiGetYears() {
    return Promise.resolve(AVAILABLE_YEARS);
}

function apiGetLeaderboardByYear(year) {
    return new Promise(resolve => {
        const y = Number(year);
        const points = loadTable(TBL_SEASON_POINTS);
        const players = loadTable(TBL_PLAYER);

        const rows = points.filter(r => r.season_year === y);
        
        const result = rows.map(r => {
            const p = players.find(u => u.player_id === r.player_id);
            return {
                rank: r.final_rank,
                username: p ? p.username : "Unknown",
                score: r.points
            };
        });
        
        result.sort((a, b) => b.score - a.score);
        resolve(result);
    });
}

function apiGetPlayerRankByYear(year, username) {
    return new Promise(resolve => {
        const players = loadTable(TBL_PLAYER);
        const target = players.find(p => p.username === username);
        if (!target) { resolve(null); return; }

        apiGetLeaderboardByYear(year).then(list => {
            const found = list.find(item => item.username === username);
            resolve(found || null);
        });
    });
}

function apiGetNextRaceInfo() {
    const today = new Date();
    const races = [
        { year: 2024, round: 1, trackName: "New York Rush", raceDate: "2024-12-01" },
        { year: 2024, round: 2, trackName: "Tokyo Express", raceDate: "2024-12-15" },
        { year: 2024, round: 3, trackName: "San Francisco", raceDate: "2025-01-05" },
        { year: 2024, round: 4, trackName: "Las Vegas Final", raceDate: "2025-01-20" }
    ];
    
    const upcoming = races.find(r => new Date(r.raceDate) >= today);
    if (!upcoming) {
        return Promise.resolve({ year: 2024, isFinal: true });
    }
    return Promise.resolve({
        year: 2024,
        isFinal: false,
        round: upcoming.round,
        trackName: upcoming.trackName,
        raceDate: upcoming.raceDate
    });
}

function apiGetTrackNames() {
    return Promise.resolve(Object.keys(MOCK_TRACK_RECORDS));
}

function apiGetTrackLeaderboard(trackName) {
    return Promise.resolve(MOCK_TRACK_RECORDS[trackName] || []);
}

function apiGetPlayerTrackSummary(username) {
    const result = [];
    Object.keys(MOCK_TRACK_RECORDS).forEach(trackName => {
        const rec = MOCK_TRACK_RECORDS[trackName].find(r => r.username === username);
        if (rec) {
            result.push({
                trackName: trackName,
                username: rec.username,
                rank: rec.rank,
                bestTime: rec.bestTime,
                points: rec.points
            });
        }
    });
    return Promise.resolve(result);
}