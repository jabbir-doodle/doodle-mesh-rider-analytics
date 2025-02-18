'use client';

import { Suspense } from 'react';
import LinkStatusAnalyzer from '../components/LinkStatusAnalyzer';
import dynamic from 'next/dynamic';

const logData = `{ "linkstate": {"sysinfo":{"cpu_load":[17120,15712,13600],"freemem":12693504,"localtime":1651865198},"oper_chan":9,"oper_freq":2452,"chan_width":"26","noise":"-79.565010","activity":24,"lna_status":"1","sta_stats":[],"mesh_stats":[]} }
{ "linkstate": {"sysinfo":{"cpu_load":[15744,15424,13504],"freemem":12636160,"localtime":1651865202},"oper_chan":9,"oper_freq":2452,"chan_width":"26","noise":"-84.366287","activity":24,"lna_status":"1","sta_stats":[],"mesh_stats":[]} }`;

const LogFileUpload = dynamic(() => import('@/components/LogFileUpload'), {
  ssr: false, // ensures it's only imported client-side
});
export default function Page() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={<div>Loading...</div>}>
        <LinkStatusAnalyzer initialData={logData} />
      </Suspense>
    </main>
  );
}