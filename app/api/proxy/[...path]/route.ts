import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
    const targetIp = request.headers.get('x-target-ip') || '';
    const path = params.path.join('/');
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = `https://${targetIp}/${path}${queryString ? '?' + queryString : ''}`;

    try {
        const fetchOptions = {
            agent: new https.Agent({ rejectUnauthorized: false }),
            headers: { 'Content-Type': 'application/json' },
        };

        const response = await fetch(url, fetchOptions);
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to proxy request' }, { status: 500 });
    }
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
    const targetIp = request.headers.get('x-target-ip') || '';
    const path = params.path.join('/');
    const url = `https://${targetIp}/${path}`;

    try {
        const body = await request.json();
        const fetchOptions = {
            method: 'POST',
            agent: new https.Agent({ rejectUnauthorized: false }),
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        };

        const response = await fetch(url, fetchOptions);
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to proxy request' }, { status: 500 });
    }
}