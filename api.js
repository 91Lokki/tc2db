 /**
 * api.js
 */

// ▼▼▼ 1. 設定後端網址 (請把這裡換成你的 ngrok 網址) ▼▼▼
// 注意：結尾不要有斜線 /
const API_BASE_URL = "https://peaked-verificatory-jodi.ngrok-free.dev/api";

// ▼▼▼ 2. 通用連線工具 (加入 ngrok 通關密語) ▼▼▼
async function fetchAPI(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem("authToken");
    
    // ★ 關鍵修正：加入 ngrok-skip-browser-warning
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
        
        // 防呆：檢查是否真的是 JSON
        let data = {};
        if (text && (text.trim().startsWith('{') || text.trim().startsWith('['))) {
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("JSON 解析失敗:", text.substring(0, 50));
            }
        } else {
            // 如果加了標頭還是收到 HTML，印出來看看是什麼
            console.warn("收到非 JSON 回應:", text.substring(0, 100));
            // 如果是 ngrok 警告，這裡 data 還是空物件 {}，但至少我們知道原因了
        }
        
        return { ok: res.ok, status: res.status, data: data };
    } catch (err) {
        console.error("API Error:", err);
        return { ok: false, status: 500, data: { message: "連線失敗" } };
    }
}

const AVAILABLE_YEARS = [2023, 2024, 2025];

// ==========================================
// 2. LocalStorage 資料庫模擬 (Helpers)
// ==========================================

const TBL_PLAYER = "table_player";
const TBL_SEASON_POINTS = "table_season_points";
const TBL_PLAYER_CAR = "table_player_car";
const TBL_TRANSACTION = "table_transaction";
const TBL_SEASON_SCHEDULE = "table_season_schedule";
const TBL_RACE_RECORD = "table_race_record";
const TBL_CAR_MODEL = "table_car_model";

function loadTable(tableName) {
  const raw = localStorage.getItem(tableName);
  if (!raw) return [];
  try {
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

function saveTable(tableName, data) {
  localStorage.setItem(tableName, JSON.stringify(data));
}

// ==========================================
// 3. 假資料生成 (Dummy Data Generator)
// ==========================================

function initDatabase() {
  let players = loadTable(TBL_PLAYER);
  if (!players || players.length === 0) {
    console.log("偵測到空資料庫，正在初始化全站假資料...");
    createDummyData();
  } else {
    ensureSchedulesAndRecords();
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
    saveTable(TBL_CAR_MODEL, DB_CAR_MODELS); // 初始化庫存

    // 2. 建立 Cars & Transactions
    const carsData = [];
    const transactionsData = [];
    let carIdCounter = 1;
    let transIdCounter = 1;

    dummyPlayers.forEach((p, idx) => {
        const model = DB_CAR_MODELS[idx % DB_CAR_MODELS.length];
        const carId = carIdCounter++;
        
        carsData.push({
            car_id: carId,
            player_id: p.player_id,
            model_id: model.model_id,
            obtain_date: p.reg_date,
            mileage: 1000 + idx * 500,
            on_sale: idx % 2 === 0, 
            sale_price: model.base_price * 0.8,
            listing_date: idx % 2 === 0 ? new Date().toISOString() : null
        });

        transactionsData.push({
            trans_id: transIdCounter++,
            buyer_id: p.player_id,
            seller_id: 0, 
            car_id: carId,
            amount: model.base_price,
            trans_time: p.reg_date,
            type: "BUY_DEALER"
        });
    });

    saveTable(TBL_PLAYER_CAR, carsData);
    saveTable(TBL_TRANSACTION, transactionsData); 

    // ★ 關鍵修正：步驟 3 - 先建立初始積分表 (確保有東西可以存分)
    const points = [];
    AVAILABLE_YEARS.forEach(year => {
        dummyPlayers.forEach(p => {
            points.push({
                player_id: p.player_id,
                season_year: year,
                points: 0,
                final_rank: 0,
                race_count: 0,
                win_count: 0,
                sec_count: 0,
                trd_count: 0,
                total_time: 0 // 新增 total_time
            });
        });
    });
    saveTable(TBL_SEASON_POINTS, points);

    // 4. 最後才產生賽程與紀錄 (這會去更新上面的 points)
    generateSchedulesAndRecords(dummyPlayers, carsData);
}

function generateSchedulesAndRecords(players, allCars) {
  const schedules = [];
  const records = [];
  let scheduleId = 1;
  let recordId = 1;
  const pointsMap = [1000, 800, 600, 500, 400];
  const prizeMap = [50000, 25000, 10000, 5000, 2000];

  // 2023 (All Completed)
  DB_TRACKS.forEach((track, idx) => {
    const schedId = scheduleId++;
    schedules.push({
      schedule_id: schedId,
      track_id: track.track_id,
      season_year: 2023,
      round_number: idx + 1,
      race_date: `2023-${10 + Math.floor(idx / 2)}-${15 + idx * 5}`,
      is_completed: true
    });

    const shuffled = [...players].sort(() => 0.5 - Math.random());
    shuffled.forEach((p, rankIdx) => {
      const myCar = allCars.find(c => c.player_id === p.player_id) || allCars[0];
      const baseTime = 120 + Math.random() * 30;
      const myTime = baseTime + rankIdx * 2;
      const mm = Math.floor(myTime / 60).toString().padStart(2, '0');
      const ss = Math.floor(myTime % 60).toString().padStart(2, '0');
      const ms = Math.floor((myTime * 100) % 100).toString().padStart(2, '0');

      records.push({
        record_id: recordId++,
        player_id: p.player_id,
        schedule_id: schedId,
        car_id: myCar.car_id,
        finish_time: `${mm}:${ss}.${ms}`,
        prize_money: prizeMap[rankIdx] || 500,
        points_earned: pointsMap[rankIdx] || 100
      });
    });
  });

  // ★ 修改：2024 賽季 (2場已完賽，2場未完賽 -> 供模擬用)
  // Round 1, 2 (Completed)
  [0, 1].forEach((idx) => {
    const track = DB_TRACKS[idx];
    const schedId = scheduleId++;
    schedules.push({
      schedule_id: schedId,
      track_id: track.track_id,
      season_year: 2024,
      round_number: idx + 1,
      race_date: `2024-05-${10 + idx * 10}`,
      is_completed: true
    });

    const shuffled = [...players].sort(() => 0.5 - Math.random());
    shuffled.forEach((p, rankIdx) => {
      const myCar = allCars.find(c => c.player_id === p.player_id) || allCars[0];
      const baseTime = 115 + Math.random() * 20;
      const myTime = baseTime + rankIdx * 2;
      const mm = Math.floor(myTime / 60).toString().padStart(2, '0');
      const ss = Math.floor(myTime % 60).toString().padStart(2, '0');
      const ms = Math.floor((myTime * 100) % 100).toString().padStart(2, '0');

      records.push({
        record_id: recordId++,
        player_id: p.player_id,
        schedule_id: schedId,
        car_id: myCar.car_id,
        finish_time: `${mm}:${ss}.${ms}`,
        prize_money: prizeMap[rankIdx] || 500,
        points_earned: pointsMap[rankIdx] || 100
      });
    });
  });

  // Round 3, 4 (Upcoming / Uncompleted) -> 這是模擬的目標！
  [2, 3].forEach((idx) => {
    const track = DB_TRACKS[idx];
    const schedId = scheduleId++;
    schedules.push({
      schedule_id: schedId,
      track_id: track.track_id,
      season_year: 2024,
      round_number: idx + 1,
      race_date: `2024-11-${10 + idx * 5}`,
      is_completed: false // 未完賽
    });
  });

  saveTable(TBL_SEASON_SCHEDULE, schedules);
  saveTable(TBL_RACE_RECORD, records);
  recalcSeasonPoints(players, records);
}

// ★ 修改：加入 total_time 的計算與排序邏輯
// ★ 修正：加入防呆機制與正確的統計邏輯
function recalcSeasonPoints(players, records) {
    let pointsData = loadTable(TBL_SEASON_POINTS);
    const schedules = loadTable(TBL_SEASON_SCHEDULE);

    // ★ 防呆：如果積分表是空的，自動補建 (Self-Healing)
    if (pointsData.length === 0 && players.length > 0) {
        console.log("偵測到積分表遺失，正在自動修復...");
        AVAILABLE_YEARS.forEach(year => {
            players.forEach(p => {
                pointsData.push({
                    player_id: p.player_id,
                    season_year: year,
                    points: 0, final_rank: 0, race_count: 0, win_count: 0, sec_count: 0, trd_count: 0, total_time: 0
                });
            });
        });
    }

    // 1. 歸零
    pointsData.forEach(p => {
        p.points = 0; 
        p.race_count = 0; 
        p.win_count = 0; 
        p.sec_count = 0; 
        p.trd_count = 0;
        p.total_time = 0;
    });

    // 2. 累加
    records.forEach(r => {
        const sched = schedules.find(s => s.schedule_id === r.schedule_id);
        if (!sched) return;
        const y = sched.season_year;
        const pts = r.points_earned;
        
        // 嘗試找出對應的積分欄位
        let target = pointsData.find(item => item.player_id === r.player_id && item.season_year === y);
        
        // 如果找不到 (例如是新的一年)，就動態新增一筆
        if (!target) {
             target = {
                player_id: r.player_id,
                season_year: y,
                points: 0, final_rank: 0, race_count: 0, win_count: 0, sec_count: 0, trd_count: 0, total_time: 0
            };
            pointsData.push(target);
        }

        if (target) {
            target.points += pts;
            target.race_count += 1;
            // 判斷名次
            if (pts >= 1000) target.win_count++;
            else if (pts >= 800) target.sec_count++;
            else if (pts >= 600) target.trd_count++;
            
            // 累加時間
            target.total_time += parseTimeToSeconds(r.finish_time);
        }
    });

    // 3. 排名
    const years = [...new Set(pointsData.map(p => p.season_year))];
    years.forEach(y => {
        const list = pointsData.filter(d => d.season_year === y);
        list.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.win_count !== a.win_count) return b.win_count - a.win_count;
            if (b.sec_count !== a.sec_count) return b.sec_count - a.sec_count;
            if (b.trd_count !== a.trd_count) return b.trd_count - a.trd_count;
            // 秒數越小越好
            if (a.total_time === 0 && b.total_time === 0) return 0;
            if (a.total_time === 0) return 1;
            if (b.total_time === 0) return -1;
            return a.total_time - b.total_time;
        });

        list.forEach((d, idx) => {
            d.final_rank = idx + 1;
        });
    });

    saveTable(TBL_SEASON_POINTS, pointsData);
}

function ensureSchedulesAndRecords() {
  const schedules = loadTable(TBL_SEASON_SCHEDULE);
  if (schedules.length === 0) {
    const players = loadTable(TBL_PLAYER);
    const cars = loadTable(TBL_PLAYER_CAR);
    if (!players || players.length === 0) {
      createDummyData();
    } else {
      generateSchedulesAndRecords(players, cars);
    }
  }
}

initDatabase();

// ================= 4. API Functions =================





async function apiLogin(username, password) {
    const res = await fetchAPI("/Players/login", "POST", { username, password });
    if (res.ok) {
        localStorage.setItem("authToken", res.data.token); // 存下關鍵的 Token
        localStorage.setItem("playerId", res.data.playerId);
        localStorage.setItem("username", res.data.username);
        return { player_id: res.data.playerId, username: res.data.username };
    }
    return null;
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
    const newPlayer = { player_id: newId, username: username, password: password, money: 500000, reg_date: now };
    players.push(newPlayer);
    saveTable(TBL_PLAYER, players);

    const points = loadTable(TBL_SEASON_POINTS);
    AVAILABLE_YEARS.forEach(y => {
      points.push({ player_id: newId, season_year: y, points: 0, final_rank: 0, race_count: 0, win_count: 0, sec_count: 0, trd_count: 0 });
    });
    saveTable(TBL_SEASON_POINTS, points);

    const cars = loadTable(TBL_PLAYER_CAR);
    const maxCarId = cars.reduce((max, c) => Math.max(max, c.car_id), 0);
    const newCar = { car_id: maxCarId + 1, player_id: newId, model_id: 204, obtain_date: now, mileage: 0, on_sale: false, sale_price: 0, listing_date: null };
    cars.push(newCar);
    saveTable(TBL_PLAYER_CAR, cars);

    const txs = loadTable(TBL_TRANSACTION);
    const maxTxId = txs.reduce((max, t) => Math.max(max, t.trans_id || 0), 0);
    txs.push({
      trans_id: maxTxId + 1,
      buyer_id: newId,
      seller_id: 0,
      car_id: newCar.car_id,
      amount: 0,
      trans_time: now,
      type: "BUY_DEALER"
    });
    saveTable(TBL_TRANSACTION, txs);

    resolve({ success: true, user: newPlayer });
  });
}

function apiDeleteAccount(playerId) {
  return new Promise(resolve => {
    const pid = Number(playerId);
    let players = loadTable(TBL_PLAYER);
    if (!players.find(p => p.player_id === pid)) {
      resolve({ success: false, message: "找不到玩家" }); return;
    }
    players = players.filter(p => p.player_id !== pid);
    let points = loadTable(TBL_SEASON_POINTS).filter(r => r.player_id !== pid);
    let cars = loadTable(TBL_PLAYER_CAR).filter(c => c.player_id !== pid);
    let records = loadTable(TBL_RACE_RECORD).filter(r => r.player_id !== pid);
    saveTable(TBL_PLAYER, players);
    saveTable(TBL_SEASON_POINTS, points);
    saveTable(TBL_PLAYER_CAR, cars);
    saveTable(TBL_RACE_RECORD, records);
    resolve({ success: true });
  });
}

function apiUpdateProfile(playerId, data) {
  return new Promise(resolve => {
    const pid = Number(playerId);
    const players = loadTable(TBL_PLAYER);
    const user = players.find(p => p.player_id === pid);
    if (!user) { resolve(null); return; }
    if (data.password) user.password = data.password;
    saveTable(TBL_PLAYER, players);
    resolve(user);
  });
}

function apiGetProfile(playerId) {
    return new Promise(resolve => {
        const pid = Number(playerId);
        const players = loadTable(TBL_PLAYER);
        const user = players.find(p => p.player_id === pid);
        if (!user) { resolve(null); return; }

        const points = loadTable(TBL_SEASON_POINTS).filter(r => r.player_id === pid);
        
        // 累加統計數據
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
            return {
                car_id: c.car_id,
                model_name: model ? model.model_name : "Unknown",
                brand_name: brand ? brand.brand_name : "Unknown",
                on_sale: c.on_sale,
                sale_price: c.sale_price,
                obtain_date: c.obtain_date,
                mileage: c.mileage,
                car_img: model ? model.car_url : "img/car-default.png"
            };
        });

        resolve({
            player_id: user.player_id,
            username: user.username,
            money: user.money,
            reg_date: user.reg_date,
            
            // ★ 同時回傳兩種格式，確保相容性
            totalScore: totalScore, total_score: totalScore,
            raceCount: totalRaces,  race_count: totalRaces,
            winCount: winCount,     win_count: winCount,
            secCount: secCount,     sec_count: secCount,
            trdCount: trdCount,     trd_count: trdCount,
            
            cars: enrichedCars
        });
    });
}
function apiGetPlayerDetail(username) {
    return new Promise(resolve => {
        const players = loadTable(TBL_PLAYER);
        const user = players.find(p => p.username === username);
        if (!user) { resolve(null); return; }

        apiGetProfile(user.player_id).then(profile => {
            const records = loadTable(TBL_RACE_RECORD).filter(r => r.player_id === user.player_id);
            const schedules = loadTable(TBL_SEASON_SCHEDULE);
            
            const resultRecords = records.map(r => {
                const sched = schedules.find(s => s.schedule_id === r.schedule_id);
                // ★ 防呆：如果找不到賽程或賽道，給預設值
                const track = (sched && typeof DB_TRACKS !== 'undefined') ? DB_TRACKS.find(t => t.track_id === sched.track_id) : null;
                
                return {
                    trackName: track ? track.track_name : "Unknown Track",
                    bestTime: r.finish_time,
                    points: r.points_earned,
                    prize: r.prize_money,
                    date: sched ? sched.race_date : "1970-01-01" 
                };
            });
            
            // 排序並取最近 10 場
            resultRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
            profile.recentRecords = resultRecords.slice(0, 10);
            
            resolve(profile);
        });
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

      let typeText = "未知";
      if (isBuy) {
        if (t.seller_id === 0) { typeText = "BUY_DEALER"; } else { typeText = "BUY_USED"; }
      } else { typeText = "SELL_USED"; }

      let carName = "Car #" + t.car_id;
      const relatedCar = cars.find(c => c.car_id === t.car_id);
      if (relatedCar) {
        const model = DB_CAR_MODELS.find(m => m.model_id === relatedCar.model_id);
        if (model) carName = model.model_name;
      }

      return {
        time: t.trans_time,
        type: typeText,
        counterparty: counterName,
        desc: carName,
        amount: t.amount
      };
    });

    resolve(result);
  });
}

// [已修改] 取得賽道列表 (含圖片) - 取代原本的 apiGetTrackNames
async function apiGetTracks() {
    // 對應後端新改的 GetTrackOptions，回傳 [{ Name, ImageUrl, Length }, ...]
    const res = await fetchAPI("/Track/options/tracks", "GET");
    return res.ok ? res.data : [];
}

function apiGetTrackInfo(trackName, year) {
  return new Promise(resolve => {
    const track = DB_TRACKS.find(t => t.track_name === trackName);
    if (!track) { resolve(null); return; }

    let result = { ...track };

    if (year) {
      const schedules = loadTable(TBL_SEASON_SCHEDULE);
      const schedule = schedules.find(s =>
        s.track_id === track.track_id &&
        s.season_year === Number(year)
      );
      if (schedule) {
        result.race_date = schedule.race_date;
        result.round_number = schedule.round_number;
        result.is_completed = schedule.is_completed;
      } else {
        result.race_date = "本年度無賽程";
      }
    }

    resolve(result);
  });
}

// [已修改] 取得賽道排行 (支援多重篩選)
async function apiGetTrackLeaderboard(trackName, year, playerName, carName) {
    const params = new URLSearchParams();
    
    // 必填
    params.append("trackName", trackName);
    
    // 選填 (有值才傳)
    if (year && year !== 'all' && year !== '0') {
        params.append("year", year);
    }
    if (playerName) {
        params.append("playerName", playerName);
    }
    if (carName) {
        params.append("carName", carName);
    }

    const res = await fetchAPI(`/Track/history?${params.toString()}`, "GET");

    if (res.ok) {
        return res.data.map(item => ({
            rank: item.rank,
            username: item.playerName, // 注意 DTO 屬性名稱
            carName: item.carName,
            bestTime: formatTime(item.finishTime), // 轉毫秒為字串
            date: item.raceDate || item.seasonYear // 優先顯示日期
        }));
    }
    return [];
}
// 輔助函式：時間格式化 (若 api.js 裡還沒定義，請加上)
function formatTime(ms) {
    if (!ms) return "-";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    const mm = minutes.toString().padStart(2, '0');
    const ss = seconds.toString().padStart(2, '0');
    const m = milliseconds.toString().padStart(2, '0');
    return `${mm}:${ss}.${m}`;
}

// [已修改] 查詢某玩家在所有賽道的表現
async function apiGetPlayerTrackSummary(username) {
    // 呼叫 C# TrackController，利用 playerName 參數篩選所有賽道的紀錄
    // 注意：後端 API 必須支援只傳 playerName 但不傳 trackName
    // 但我看你的 TrackController 寫法： if (string.IsNullOrWhiteSpace(trackName)) return BadRequest...
    // ★ 發現問題：你的後端 TrackController 目前強制要求 trackName。
    
    // ★ 解決方案：
    // 因為這支 API 原本設計是用來查「某賽道」的。
    // 暫時解法：我們在前端不做這功能的「全賽道總覽」，或者你需要修改後端允許 trackName 為空。
    // 假設我們現在只能查「特定賽道」，那這個函式可能需要改寫成「列出該玩家有跑過的賽道」。
    
    // 為了不讓你現在改後端太複雜，我們先回傳空陣列，或者你可以告訴我是否要我教你改後端這一小段。
    console.warn("目前後端 TrackController 需要指定賽道才能查詢，暫時無法撈取該玩家'所有'賽道紀錄");
    return []; 
}

async function apiGetDealerBrands() {
    // 呼叫後端 API: GET /api/Market/options/brands
    const res = await fetchAPI("/Market/options/brands", "GET");
    // 如果成功，res.data 是一個字串陣列 ["Audi", "BMW", ...]
    return res.ok ? res.data : [];
}

// 取得車商車輛列表 (支援 品牌鎖定 + 全域搜尋 + 多重篩選)
async function apiGetDealerCarsByBrand(brand, q = "", country = "", minYear = "", maxYear = "", minPrice = "", maxPrice = "") {
    const params = new URLSearchParams();
    if (brand && brand !== "All") params.append("brand", brand);
    if (q) params.append("q", q);
    if (country && country !== "All") params.append("country", country);
    if (minYear) params.append("minYear", minYear);
    if (maxYear) params.append("maxYear", maxYear);
    if (minPrice) params.append("minPrice", minPrice);
    if (maxPrice) params.append("maxPrice", maxPrice);

    const res = await fetchAPI(`/Market/dealer/cars?${params.toString()}`, "GET");
    if (!res.ok) return [];

    return res.data.map(c => ({
        model_id: c.modelId,
        model_name: c.modelName,
        brand: c.brandName,
        countryName: c.countryName || "", 
        model_year: c.modelYear || 2024, 
        base_price: c.basePrice,
        stock: c.stockQuantity,
        top_speed: c.topSpeed,
        power: c.power,

        // ▼▼▼ 圖片來源修正 ▼▼▼
        car_img: c.carUrl || "img/car-default.png", 
        brand_logo: c.brandLogoUrl || "img/brands/default.png",
        country_img: c.countryFlagUrl || "img/flag-default.png" // 👈 直接讀取後端欄位
        // ▲▲▲ 修正結束 ▲▲▲
    }));
}

async function apiBuyDealerCar(modelId) {
    const buyerId = localStorage.getItem("playerId"); // 從 localStorage 拿 ID
    
    // 呼叫後端 API: POST /api/Market/buy
    const res = await fetchAPI("/Market/buy", "POST", { 
        buyerId: Number(buyerId), 
        modelId: Number(modelId) 
    });
    
    if (res.ok) {
        // 成功！
        // 因為後端現在可能沒回傳最新的 money，我們可能需要重新抓一次 profile 更新錢
        // 這裡先簡單回傳 success
        return { success: true };
    } else {
        // 失敗 (餘額不足、庫存不足...)
        return { success: false, message: res.data.message || "購買失敗" };
    }
}


async function apiGetUsedCars(q = "", country = "", minYear = "", maxYear = "", minPrice = "", maxPrice = "") {
    const params = new URLSearchParams();
    if (q) params.append("q", q);
    if (country && country !== "All") params.append("country", country);
    if (minYear) params.append("minYear", minYear);
    if (maxYear) params.append("maxYear", maxYear);
    if (minPrice) params.append("minPrice", minPrice);
    if (maxPrice) params.append("maxPrice", maxPrice);

    const res = await fetchAPI(`/Market/used-cars?${params.toString()}`, "GET");
    if (!res.ok) return [];

    return res.data.map(c => ({
        player_car_id: c.carId,
        seller_name: c.sellerName,
        seller_id: 0, 
        brand_name: c.brandName,
        model_name: c.modelName,
        model_year: c.modelYear,
        countryName: c.countryName || "", 
        sale_price: c.salePrice,
        listing_date: c.listingDate, 
        mileage: c.mileage,

        // ▼▼▼ 圖片來源修正 ▼▼▼
        car_img: c.carUrl || "img/car-default.png",
        brand_logo: "img/brand-default.png", // 二手車可能沒傳 Logo，暫用預設
        country_img: c.countryFlagUrl || "img/flag-default.png" // 👈 這裡也要改！
        // ▲▲▲ 修正結束 ▲▲▲
    }));
}

function apiSetCarOnSale(playerId, carId, onSale, price) {
  return new Promise(resolve => {
    const cars = loadTable(TBL_PLAYER_CAR);
    const car = cars.find(c => c.car_id === Number(carId) && c.player_id === Number(playerId));
    if (car) {
      car.on_sale = !!onSale;
      car.sale_price = onSale ? Number(price) : 0;
      car.listing_date = onSale ? new Date().toISOString() : null;
      saveTable(TBL_PLAYER_CAR, cars);
      resolve({ success: true });
    } else {
      resolve({ success: false });
    }
  });
}
async function apiBuyCar(carId) {
    const buyerId = localStorage.getItem("playerId");

    // 呼叫後端 API: POST /api/Market/purchase-used
    const res = await fetchAPI("/Market/purchase-used", "POST", {
        buyerId: Number(buyerId),
        carId: Number(carId)
    });

    if (res.ok) {
        return { success: true };
    } else {
        return { success: false, message: res.data.message || "購買失敗" };
    }
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

      let typeText = "未知";
      if (isBuy) {
        if (t.seller_id === 0) { typeText = "BUY_DEALER"; } else { typeText = "BUY_USED"; }
      } else { typeText = "SELL_USED"; }

      let carName = "Car #" + t.car_id;
      const relatedCar = cars.find(c => c.car_id === t.car_id);
      if (relatedCar) {
        const model = DB_CAR_MODELS.find(m => m.model_id === relatedCar.model_id);
        if (model) carName = model.model_name;
      }

      return {
        time: t.trans_time,
        type: typeText,
        counterparty: counterName,
        desc: carName,
        amount: t.amount
      };
    });

    resolve(result);
  });
}
// [已修改] 從後端 API 取得資料庫中所有的賽季年份
async function apiGetYears() {
    // 呼叫 C# 的 TrackController: [HttpGet("options/years")]
    const res = await fetchAPI("/Track/options/years", "GET");
    
    if (res.ok && Array.isArray(res.data)) {
        // C# 回傳的是數字陣列 [2025, 2024, 2023]
        // 我們把資料庫回傳的年份拿出來
        const years = res.data;
        
        // 如果你需要 "all" (生涯總計) 選項，可以保留在前端邏輯處理
        // 但這裡我們主要回傳數字年份
        return years.length > 0 ? years : [2024]; // 預設防呆
    } else {
        console.warn("無法取得年份，使用預設值");
        return [2024, 2023]; 
    }
}
// [新增] 取得全域最早未完成賽事 (儀表板專用)
async function apiGetGlobalNextRace() {
    const res = await fetchAPI("/Race/next-global", "GET");
    if(res.ok) return res.data;
    return null;
}
// [已修改] 取得特定年份的積分排行榜 (包含生涯總計)
async function apiGetLeaderboardByYear(year) {
    let url = "";
    if (year === 'all') {
        url = "/Leaderboard/standings/all";
    } else {
        url = `/Leaderboard/standings/${year}`;
    }

    const res = await fetchAPI(url, "GET");

    if (res.ok) {
        return res.data.map(item => ({
            rank: item.rank || item.Rank, // 相容大小寫
            username: item.username || item.Username,
            score: item.totalPoints || item.TotalPoints, 
            winCount: item.winCount || item.WinCount,
            podiumCount: item.podiumCount || item.PodiumCount, 
            raceCount: item.raceCount || item.RaceCount,
            totalTime: item.totalTime || item.TotalTime
        }));
    } else {
        console.error("取得排行榜失敗:", res.status);
        return [];
    }
}
// [已修改] 查詢特定玩家在該年度的排名
async function apiGetPlayerRankByYear(year, username) {
    if (!username) return null;

    // 我們重複利用上面的 API，但多加一個參數
    // 呼叫: /api/Leaderboard/standings/{year}?playerName={username}
    const res = await fetchAPI(`/Leaderboard/standings/${year}?playerName=${encodeURIComponent(username)}`, "GET");

    if (res.ok && res.data.length > 0) {
        // 因為後端支援模糊搜尋，可能會回傳多筆，我們抓完全符合的那一筆，或第一筆
        const item = res.data[0]; 
        return {
            rank: item.rank,
            username: item.username,
            score: item.totalPoints // 對應 HTML 顯示
        };
    }
    return null; // 找不到
}


// ★ 新增：將時間字串轉為純秒數 (例如 "02:00.00" -> 120.00)
function parseTimeToSeconds(timeStr) {
    if (!timeStr) return 999999; // 若無成績，給一個超大秒數
    const parts = timeStr.split(':');
    const mm = parseFloat(parts[0]);
    const secParts = parts[1].split('.');
    const ss = parseFloat(secParts[0]);
    const ms = parseFloat(secParts[1]);
    // 分 * 60 + 秒 + 毫秒/100
    return (mm * 60) + ss + (ms / 100);
}
// ★ 修正：根據年份取得賽程表 (並加入前三名結果)
function apiGetScheduleByYear(year) {
    return new Promise(resolve => {
        const schedules = loadTable(TBL_SEASON_SCHEDULE);
        const tracks = DB_TRACKS;
        const allRecords = loadTable(TBL_RACE_RECORD); // 載入所有紀錄
        const players = loadTable(TBL_PLAYER);         // 載入玩家名稱

        // 1. 篩選賽程
        let filteredSchedules = schedules.filter(s => s.season_year === Number(year));

        // 2. 排序 (依回合數)
        filteredSchedules.sort((a, b) => a.round_number - b.round_number);

        // 3. 整合賽道資訊與結果
        const result = filteredSchedules.map(s => {
            const trackInfo = tracks.find(t => t.track_id === s.track_id);
            
            let top3 = [];
            
            if (s.is_completed) {
                // 找出該場比賽的紀錄
                const raceResults = allRecords.filter(r => r.schedule_id === s.schedule_id);

                // 依積分 (points_earned) 排序，找出前三名
                raceResults.sort((a, b) => b.points_earned - a.points_earned);

                // 取得前三名的玩家帳號
                top3 = raceResults.slice(0, 3).map(r => {
                    const player = players.find(p => p.player_id === r.player_id);
                    return player ? player.username : '-';
                });
            }

            return {
                round: s.round_number,
                season: s.season_year,
                trackName: trackInfo ? trackInfo.track_name : "未知賽道",
                trackLength: trackInfo ? trackInfo.length : "未知",
                raceDate: s.race_date,
                is_completed: s.is_completed,
                // ★ 新增：回傳前三名 (如果沒有人參賽，會是 '-' )
                top1: top3[0] || '-',
                top2: top3[1] || '-',
                top3: top3[2] || '-',
            };
        });

        resolve(result);
    });
}

async function apiGetCountries() {
    const res = await fetchAPI("/Market/options/countries", "GET");
    return res.ok ? res.data : [];
}

// [新增] 取得下一場賽事資訊
async function apiGetNextSchedule(year) {
    const res = await fetchAPI(`/Race/next-schedule/${year}`, "GET");
    return res.ok ? res.data : null;
}

// [新增] 模擬下一場比賽 (呼叫後端已有的 simulate-next)
async function apiSimulateRace(year) {
    const res = await fetchAPI("/Race/simulate-next", "POST", { SeasonYear: Number(year) });
    return res; // 回傳原始回應物件，以便前端判斷 success/message
}
