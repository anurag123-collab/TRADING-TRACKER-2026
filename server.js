const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.apk': 'application/vnd.android.package-archive',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    let rawUrl = req.url || '/';
    let cleanUrl = rawUrl.split('?')[0].split('#')[0];

    // CORS Headers for all responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        return res.end();
    }

    // ============================================================
    // API ROUTE: GET /api/market-pulse — Live Financial Market Quotes
    // ============================================================
    if (cleanUrl === '/api/market-pulse' && req.method === 'GET') {
        const marketPulseHandler = require('./api/market-pulse');
        const customRes = {
            setHeader: (k, v) => res.setHeader(k, v),
            status: (code) => {
                res.writeHead(code, { 'Content-Type': 'application/json' });
                return {
                    json: (obj) => res.end(JSON.stringify(obj)),
                    end: () => res.end()
                };
            }
        };
        return marketPulseHandler(req, customRes);
    }

    // ============================================================
    // API ROUTE: POST /api/send-otp — Real SMS via 2Factor.in DLT Approved Template
    // ============================================================
    if (cleanUrl === '/api/send-otp' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const { mobile, email, otp } = JSON.parse(body || '{}');
                const isMobileValid = mobile && /^\d{10}$/.test(mobile);
                const isEmailValid = email && /\S+@\S+\.\S+/.test(email);

                if (!isMobileValid && !isEmailValid) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: false, error: 'Valid 10-digit mobile number or email required' }));
                }

                const finalOtp = otp || Math.floor(1000 + Math.random() * 9000).toString();

                // If only email is provided (Google / Gmail OTP)
                if (isEmailValid && !isMobileValid) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({
                        success: true,
                        otp: finalOtp,
                        emailSent: true,
                        message: `Instant Email OTP generated for ${email}`
                    }));
                }

                const twoFactorApiKey = process.env.TWOFACTOR_API_KEY || '8ca9f7ae-9406-11f1-908b-0200cd936042';

                // High-Speed Priority OTP Route (2-3 second instant delivery guarantee)
                const fastOtpUrl = `https://2factor.in/API/V1/${twoFactorApiKey}/SMS/${mobile}/${finalOtp}`;

                const reqSms = https.get(fastOtpUrl, { timeout: 3500 }, (smsRes) => {
                    let data = '';
                    smsRes.on('data', chunk => { data += chunk; });
                    smsRes.on('end', () => {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, otp: finalOtp, response: data, emailSent: isEmailValid }));
                    });
                });

                reqSms.on('timeout', () => {
                    reqSms.destroy();
                    // Fallback to TSMS if standard route times out
                    const fallbackUrl = `https://2factor.in/API/V1/${twoFactorApiKey}/ADDON_SERVICES/SEND/TSMS?From=TRADER&To=${mobile}&TemplateName=Trading%20Tracker%20OTP&VAR1=${finalOtp}`;
                    https.get(fallbackUrl, (fRes) => {
                        let data = '';
                        fRes.on('data', chunk => { data += chunk; });
                        fRes.on('end', () => {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: true, otp: finalOtp, response: data, emailSent: isEmailValid }));
                        });
                    }).on('error', () => {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, otp: finalOtp, timeout: true, emailSent: isEmailValid }));
                    });
                });

                reqSms.on('error', (e) => {
                    console.error('2Factor OTP error:', e);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: e.message }));
                });

            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Bad request' }));
            }
        });
        return;
    }

    // ============================================================
    // API ROUTE: /api/user-profile (GET & POST) — Disk Persistence for Credentials & Mobile
    // ============================================================
    if (cleanUrl === '/api/user-profile') {
        const CREDENTIALS_FILE = path.join(PUBLIC_DIR, 'user_credentials.json');

        if (req.method === 'GET') {
            let profileData = {};
            if (fs.existsSync(CREDENTIALS_FILE)) {
                try {
                    profileData = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
                } catch (e) {}
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: true, profile: profileData }));
        }

        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
                try {
                    const payload = JSON.parse(body || '{}');
                    let existing = {};
                    if (fs.existsSync(CREDENTIALS_FILE)) {
                        try { existing = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8')); } catch(e) {}
                    }

                    if (payload.mobile) existing.mobile = payload.mobile;
                    if (payload.password) existing.password = payload.password;
                    if (payload.userId) existing.userId = payload.userId;
                    if (payload.name) existing.name = payload.name;
                    if (payload.email) existing.email = payload.email;
                    existing.updatedAt = new Date().toISOString();

                    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(existing, null, 2), 'utf-8');

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: true, profile: existing }));
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
                }
            });
            return;
        }
    }

    // ============================================================
    // API ROUTE: /api/sync-trader-log (GET & POST) — Registered Traders Log Sync & Disk Persistence
    // ============================================================
    if (cleanUrl === '/api/sync-trader-log') {
        const TRADERS_FILE = path.join(PUBLIC_DIR, 'traders_log.json');
        let tradersList = [
            {
                name: "Anurag Patel (Master Admin)",
                mobile: "8102241463",
                email: "anuragpatel4u00.ap@gmail.com",
                password: "******",
                active_key: "TT2026-VIP-917660",
                trial_status: "👑 Master Admin",
                last_login: new Date().toLocaleString()
            },
            {
                name: "ANURAG PATEL",
                mobile: "8825255625",
                email: "anuragpatel4u00.ap@gmail.com",
                password: "******",
                active_key: "TT2026-VIP-FREE-206772",
                trial_status: "👑 VIP Pro (1 Year Free Access)",
                last_login: new Date().toLocaleString()
            }
        ];

        if (fs.existsSync(TRADERS_FILE)) {
            try {
                const fileData = JSON.parse(fs.readFileSync(TRADERS_FILE, 'utf-8'));
                if (Array.isArray(fileData) && fileData.length > 0) tradersList = fileData;
            } catch (e) {}
        }

        if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: true, count: tradersList.length, traders: tradersList }));
        }

        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
                try {
                    const entry = JSON.parse(body || '{}');
                    if (entry && (entry.mobile || entry.name || entry.email)) {
                        const trMobile = entry.mobile || 'N/A';
                        const trName = entry.name || 'Trader';
                        const trEmail = entry.email || 'N/A';

                        const existingIdx = tradersList.findIndex(t => 
                            (t.mobile && t.mobile !== 'N/A' && trMobile !== 'N/A' && t.mobile === trMobile) ||
                            (t.email && t.email !== 'N/A' && trEmail !== 'N/A' && t.email.toLowerCase() === trEmail.toLowerCase()) ||
                            (t.name && t.name === trName)
                        );

                        const updatedEntry = {
                            name: trName,
                            mobile: trMobile,
                            email: trEmail,
                            password: entry.password || '******',
                            active_key: entry.active_key || 'FREE-TRIAL',
                            trial_status: entry.trial_status || '🎁 Free Trial',
                            last_login: entry.last_login || new Date().toLocaleString()
                        };

                        if (existingIdx !== -1) {
                            tradersList[existingIdx] = { ...tradersList[existingIdx], ...updatedEntry };
                        } else {
                            tradersList.unshift(updatedEntry);
                        }

                        fs.writeFileSync(TRADERS_FILE, JSON.stringify(tradersList, null, 2), 'utf-8');
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: true, count: tradersList.length, traders: tradersList }));
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
                }
            });
            return;
        }
    }

    // ============================================================
    // API ROUTE: /api/sync-user-trades (GET & POST) — High-Scale Cloud Trade Sync
    // ============================================================
    if (cleanUrl === '/api/sync-user-trades') {
        const USER_TRADES_DIR = path.join(PUBLIC_DIR, 'user_data');
        if (!fs.existsSync(USER_TRADES_DIR)) {
            try { fs.mkdirSync(USER_TRADES_DIR, { recursive: true }); } catch (e) {}
        }

        const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const rawUserId = urlObj.searchParams.get('user_id') || urlObj.searchParams.get('mobile') || urlObj.searchParams.get('email');

        if (req.method === 'GET') {
            if (!rawUserId) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, error: 'user_id parameter is required' }));
            }
            const cleanId = String(rawUserId).replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
            const userFile = path.join(USER_TRADES_DIR, `trades_${cleanId}.json`);

            if (fs.existsSync(userFile)) {
                try {
                    const data = JSON.parse(fs.readFileSync(userFile, 'utf-8'));
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: true, exists: true, ...data }));
                } catch (e) {}
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: true, exists: false, tradesHtml: '', tradesCount: 0 }));
        }

        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
                try {
                    const payload = JSON.parse(body || '{}');
                    const targetUser = payload.userId || payload.mobile || payload.email || rawUserId;
                    if (!targetUser) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ success: false, error: 'userId is required' }));
                    }

                    const cleanId = String(targetUser).replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
                    const userFile = path.join(USER_TRADES_DIR, `trades_${cleanId}.json`);

                    const tradeRecord = {
                        userId: cleanId,
                        tradesHtml: payload.tradesHtml || '',
                        tradesCount: payload.tradesCount || 0,
                        capital: payload.capital || null,
                        updatedAt: new Date().toISOString()
                    };

                    fs.writeFileSync(userFile, JSON.stringify(tradeRecord, null, 2), 'utf-8');

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: true, message: 'Trades safely synced', ...tradeRecord }));
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
                }
            });
            return;
        }
    }

    // ============================================================
    // API ROUTE: /api/dhan-sync (POST) — DhanHQ 1-Click Trade Auto-Import
    // ============================================================
    if (cleanUrl === '/api/dhan-sync' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body || '{}');
                const clientId = payload.clientId || req.headers['client-id'];
                const accessToken = payload.accessToken || req.headers['access-token'];
                const targetDate = payload.date || new Date().toISOString().slice(0, 10);

                if (!clientId || !accessToken) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: false, error: 'Dhan Client ID and Access Token required' }));
                }

                const dhanReq = https.request({
                    hostname: 'api.dhan.co',
                    path: '/v2/trades',
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'access-token': accessToken,
                        'client-id': clientId
                    },
                    timeout: 8000
                }, (dhanRes) => {
                    let dData = '';
                    dhanRes.on('data', chunk => { dData += chunk; });
                    dhanRes.on('end', () => {
                        try {
                            const parsed = JSON.parse(dData || '[]');
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            return res.end(JSON.stringify({ success: true, trades: Array.isArray(parsed) ? parsed : [], date: targetDate }));
                        } catch (e) {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            return res.end(JSON.stringify({ success: true, trades: [], raw: dData }));
                        }
                    });
                });

                dhanReq.on('error', (e) => {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: e.message }));
                });

                dhanReq.on('timeout', () => {
                    dhanReq.destroy();
                    res.writeHead(504, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Dhan API request timed out' }));
                });

                dhanReq.end();
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
            }
        });
        return;
    }

    if (cleanUrl === '/') cleanUrl = '/index.html';

    // Direct match for APK download requests
    if (cleanUrl.toLowerCase().includes('.apk')) {
        let apkCandidates = [
            path.join(PUBLIC_DIR, 'Trading_Tracker_2026.apk'),
            path.join(PUBLIC_DIR, 'public', 'Trading_Tracker_2026.apk'),
            path.join(PUBLIC_DIR, 'www', 'Trading_Tracker_2026.apk')
        ];
        let apkPath = apkCandidates.find(p => fs.existsSync(p));
        if (apkPath) {
            let stat = fs.statSync(apkPath);
            res.writeHead(200, {
                'Content-Type': 'application/vnd.android.package-archive',
                'Content-Length': stat.size,
                'Content-Disposition': 'attachment; filename="Trading_Tracker_2026.apk"',
                'Access-Control-Allow-Origin': '*'
            });
            return fs.createReadStream(apkPath).pipe(res);
        }
    }

    let filePath = path.join(PUBLIC_DIR, cleanUrl);

    if (!fs.existsSync(filePath)) {
        let pubP = path.join(PUBLIC_DIR, 'public', cleanUrl);
        let wwwP = path.join(PUBLIC_DIR, 'www', cleanUrl);
        if (fs.existsSync(pubP)) filePath = pubP;
        else if (fs.existsSync(wwwP)) filePath = wwwP;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1>', 'utf-8');
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*'
            });
            res.end(content, 'utf-8');
        }
    });
});

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (let devName in interfaces) {
        let iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            let alias = iface[i];
            if (alias.family === 'IPv4' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return 'localhost';
}

if (process.env.VERCEL) {
    module.exports = server;
} else {
    server.listen(PORT, () => {
        const ip = getLocalIP();
        console.log(`🚀 Trading Tracker 2026 Web Server is Running!`);
        console.log(`💻 Desktop Link: http://localhost:${PORT}`);
        console.log(`📱 WiFi Network Link: http://${ip}:${PORT}`);
        console.log(`📦 APK Direct Download Link: http://${ip}:${PORT}/Trading_Tracker_2026.apk`);
    });
}
