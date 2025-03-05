import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import tls from 'tls';
import crypto from 'crypto';

// SSL certificate verification override
const customHttpsAgent = new https.Agent({
    rejectUnauthorized: false,
    secureOptions: crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION,
    ciphers: tls.DEFAULT_CIPHERS,
    minVersion: 'TLSv1',
    maxVersion: 'TLSv1.3',
    sessionTimeout: 30000, // 30 seconds
    keepAlive: true,
});

interface UbusRequest {
    jsonrpc: string;
    id: number;
    method: string;
    params: [string, string, string, Record<string, string>];
}

function validateUbusRequest(body: any): body is UbusRequest {
    return (
        body &&
        typeof body === 'object' &&
        Array.isArray(body) &&
        body.length > 0 &&
        body[0].jsonrpc === '2.0' &&
        body[0].method === 'call' &&
        Array.isArray(body[0].params) &&
        body[0].params.length === 4
    );
}

// Basic rate limiting
const REQUESTS_PER_MINUTE = 60;
const requests = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute

    const timestamps = requests.get(ip) || [];
    const recentRequests = timestamps.filter(time => now - time < windowMs);

    if (recentRequests.length >= REQUESTS_PER_MINUTE) {
        return true;
    }

    requests.set(ip, [...recentRequests, now]);
    return false;
}

export async function POST(request: NextRequest) {
    try {
        const targetIp = request.headers.get('x-target-ip') || '10.223.106.148'; // Default IP

        // Rate limiting
        const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
        if (isRateLimited(clientIp)) {
            return NextResponse.json(
                { error: 'Rate limit exceeded' },
                { status: 429 }
            );
        }

        let requestBody;
        try {
            requestBody = await request.json();
            if (!validateUbusRequest(requestBody)) {
                return NextResponse.json(
                    { error: 'Invalid UBUS request format' },
                    { status: 400 }
                );
            }
        } catch (e) {
            return NextResponse.json(
                { error: 'Invalid JSON in request body' },
                { status: 400 }
            );
        }

        const url = `http://${targetIp}/ubus`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            //@ts-ignore
            agent: customHttpsAgent, // Use the custom agent
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`UBUS error! status: ${response.status}`);
        }

        const data = await response.json();

        // Check for UBUS specific errors
        if (data[0]?.error) {
            return NextResponse.json(
                { error: 'UBUS error', details: data[0].error },
                { status: 400 }
            );
        }

        return NextResponse.json(data, {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, x-target-ip',
                'Cache-Control': 'no-store'
            }
        });

    } catch (error) {
        console.error('UBUS proxy error:', error);

        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                return NextResponse.json(
                    { error: 'Request timeout' },
                    { status: 504 }
                );
            }

            // Handle SSL errors specifically
            if (error.message.includes('SSL') || error.message.includes('certificate')) {
                return NextResponse.json(
                    {
                        error: 'SSL verification failed',
                        details: 'Continuing with insecure connection'
                    },
                    { status: 200 }
                );
            }
        }

        return NextResponse.json(
            {
                error: 'UBUS connection failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, x-target-ip'
        }
    });
}

export async function GET() {
    return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
    );
}