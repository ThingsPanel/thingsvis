const fs = require('fs');
const http = require('http');

const ssoPayload = fs.readFileSync('sso_request.json');

function request(options, body) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                const end = Date.now();
                resolve({
                    statusCode: res.statusCode,
                    time: end - start,
                    data: data
                });
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (body) {
            req.write(body);
        }
        req.end();
    });
}

async function run() {
    // 1. SSO
    console.log('--- Testing SSO ---');
    const ssoOptions = {
        hostname: '127.0.0.1',
        port: 3001,
        path: '/api/v1/auth/sso',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': ssoPayload.length
        }
    };

    try {
        const ssoRes = await request(ssoOptions, ssoPayload);
        if (ssoRes.statusCode !== 200) {
            console.error('SSO Failed:', ssoRes.data);
            return;
        }

        const ssoData = JSON.parse(ssoRes.data);
        const token = ssoData.accessToken;

        // Get Project ID
        const projectOptions = {
            hostname: '127.0.0.1',
            port: 3001,
            path: '/api/v1/projects',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        };
        const projRes = await request(projectOptions);
        const projData = JSON.parse(projRes.data);
        const validProjectId = projData.data?.[0]?.id;

        if (!validProjectId) {
            console.log("No projects found, cannot test dashboard list.");
            return;
        }
        console.log(`Using Project ID: ${validProjectId}`);

        // 2. Get Dashboards List (Should be fast and have NO thumbnail)
        console.log('\n--- Testing Get Dashboards List (Expect Fast) ---');
        const dashboardOptions = {
            hostname: '127.0.0.1',
            port: 3001,
            path: `/api/v1/dashboards?projectId=${validProjectId}&limit=100`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        const dashRes = await request(dashboardOptions);
        console.log(`Dashboard List Status: ${dashRes.statusCode}`);
        console.log(`Dashboard List Time: ${dashRes.time}ms`);
        console.log(`Response Length: ${dashRes.data.length}`);

        const dashData = JSON.parse(dashRes.data);
        const dashboards = dashData.data || [];

        if (dashboards.length > 0) {
            const first = dashboards[0];
            console.log(`First item ID: ${first.id}`);
            console.log(`Thumbnail in List: ${first.thumbnail}`); // Should be undefined or null

            // 3. Get Thumbnail for First Item (New API)
            console.log('\n--- Testing Get Thumbnail (New API) ---');
            const thumbOptions = {
                hostname: '127.0.0.1',
                port: 3001,
                path: `/api/v1/dashboards/${first.id}/thumbnail`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };
            const thumbRes = await request(thumbOptions);
            console.log(`Thumbnail API Status: ${thumbRes.statusCode}`);
            console.log(`Thumbnail API Time: ${thumbRes.time}ms`);
            console.log(`Thumbnail Response Length: ${thumbRes.data.length}`);

            if (thumbRes.statusCode === 200) {
                const thumbData = JSON.parse(thumbRes.data);
                console.log(`Thumbnail Data Length: ${thumbData.data.thumbnail ? thumbData.data.thumbnail.length : 0}`);
            } else {
                console.log('Thumbnail API Error:', thumbRes.data);
            }

        }

    } catch (e) {
        console.error('Error:', e);
    }
}

run();
