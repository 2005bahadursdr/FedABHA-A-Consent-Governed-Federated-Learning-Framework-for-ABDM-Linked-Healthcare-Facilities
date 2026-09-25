import { useState, useEffect } from 'react';
import { fetchDashboardData, emptyData } from '../services/api';
import HospitalCard from '../components/HospitalCard';
import TrustScore from '../components/TrustScore';
import { Building2, Server } from 'lucide-react';

export default function Hospitals() {
  const [data, setData] = useState(emptyData);

  useEffect(() => {
    const poll = async () => {
      const latest = await fetchDashboardData();
      setData(latest);
    };
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100 flex items-center">
        <Building2 className="mr-3 w-8 h-8 text-primary-500" /> Node Infrastructure
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.hospitals.map(hosp => (
          <div key={hosp.id} className="bg-dark-800 rounded-xl p-6 border border-slate-700 shadow-md flex flex-col space-y-4">
             <HospitalCard id={hosp.id} status={hosp.status} dataSize={hosp.dataSize} />
             <div className="pt-4 border-t border-slate-700">
               <h4 className="text-sm font-semibold text-slate-300 mb-2">Live Trust Score</h4>
               <TrustScore score={hosp.trustScore} />
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
