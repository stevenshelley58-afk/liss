import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ChevronDown, Plus, Minus, Check, X, ArrowRight, Play } from 'lucide-react';
import heroImage from './assets/marin-longevity-hero.png';
import classImage from './assets/longevity-club-class.png';
import Website from './Website';

export default function EllissaOliverPage() {
  // Calculator State
  const [expandedModel, setExpandedModel] = useState('pods');
  const [incomeGoal, setIncomeGoal] = useState(5000);

  const [models, setModels] = useState({
    pt: { active: true, clients: 4, price: 180, hours: 1.5 },
    pods: { active: true, groups: 5, size: 4, price: 100, hours: 2, freeHostSpot: true },
    online: { active: true, clients: 6, price: 60, hours: 0.5 }
  });

  const [adSpend, setAdSpend] = useState(300);
  const [costPerLead, setCostPerLead] = useState(30);
  const [leadToTrial, setLeadToTrial] = useState(30);
  const [trialToPaid, setTrialToPaid] = useState(50);
  const [churnRate, setChurnRate] = useState(6);
  const [avgLifespan, setAvgLifespan] = useState(8);

  const [capacityLimits] = useState({
    maxPods: 8,
    maxPT: 8,
    maxOnline: 15
  });

  const [showAcquisition, setShowAcquisition] = useState(false);

  const monthlyCosts = 250;

  const update = (model, field, value) => {
    setModels(prev => ({ ...prev, [model]: { ...prev[model], [field]: value } }));
  };

  const toggle = (model) => {
    setModels(prev => ({ ...prev, [model]: { ...prev[model], active: !prev[model].active } }));
  };

  const calc = useMemo(() => {
    const pt = models.pt.active ? {
      rev: models.pt.clients * models.pt.price,
      hrs: models.pt.clients * models.pt.hours,
      clients: models.pt.clients
    } : { rev: 0, hrs: 0, clients: 0 };
    pt.hourly = pt.hrs > 0 ? Math.round(pt.rev / pt.hrs) : 0;

    // Pods with host model: 1 free spot per group
    const paidSpotsPerGroup = models.pods.freeHostSpot ? models.pods.size - 1 : models.pods.size;
    const pods = models.pods.active ? {
      rev: models.pods.groups * paidSpotsPerGroup * models.pods.price,
      hrs: models.pods.groups * models.pods.hours,
      clients: models.pods.groups * models.pods.size,
      paidClients: models.pods.groups * paidSpotsPerGroup
    } : { rev: 0, hrs: 0, clients: 0, paidClients: 0 };
    pods.hourly = pods.hrs > 0 ? Math.round(pods.rev / pods.hrs) : 0;

    const online = models.online.active ? {
      rev: models.online.clients * models.online.price,
      hrs: models.online.clients * models.online.hours,
      clients: models.online.clients
    } : { rev: 0, hrs: 0, clients: 0 };
    online.hourly = online.hrs > 0 ? Math.round(online.rev / online.hrs) : 0;

    const targetWeeklyRev = pt.rev + pods.rev + online.rev;
    const targetWeeklyHrs = pt.hrs + pods.hrs + online.hrs;
    const targetClients = pt.clients + pods.clients + online.clients;
    const targetMonthlyRev = targetWeeklyRev * 4.33;
    const targetHourly = targetWeeklyHrs > 0 ? Math.round(targetWeeklyRev / targetWeeklyHrs) : 0;
    const targetMonthlyProfit = targetMonthlyRev - monthlyCosts - adSpend;

    const avgRevPerClient = targetClients > 0 ? targetMonthlyRev / targetClients : 0;

    const leadsPerMonth = costPerLead > 0 ? adSpend / costPerLead : 0;
    const trialsPerMonth = leadsPerMonth * (leadToTrial / 100);
    const newClientsPerMonth = trialsPerMonth * (trialToPaid / 100);
    const cac = newClientsPerMonth > 0 ? Math.round(adSpend / newClientsPerMonth) : 0;

    const ltv = avgRevPerClient * avgLifespan;
    const ltvCacRatio = cac > 0 ? (ltv / cac) : 0;

    // What the host model saves
    const hostSavings = models.pods.active && models.pods.freeHostSpot ? {
      rentSaved: 200 * models.pods.groups, // estimated venue cost per group
      adsSaved: cac * models.pods.groups, // cost to acquire each host
      adminHours: 2 * models.pods.groups // hours saved on admin per group
    } : { rentSaved: 0, adsSaved: 0, adminHours: 0 };

    return {
      pt, pods, online,
      targetWeeklyRev, targetWeeklyHrs, targetClients, targetMonthlyRev, targetMonthlyProfit, targetHourly,
      avgRevPerClient,
      leadsPerMonth, trialsPerMonth, newClientsPerMonth, cac, ltv, ltvCacRatio,
      churnRateDecimal: churnRate / 100,
      hostSavings
    };
  }, [models, adSpend, costPerLead, leadToTrial, trialToPaid, churnRate, avgLifespan]);

  const projection = useMemo(() => {
    const months = [];
    let clients = 0;
    let monthToGoal = null;

    for (let month = 1; month <= 24; month++) {
      clients += calc.newClientsPerMonth;
      const churned = clients * calc.churnRateDecimal;
      clients = Math.max(0, clients - churned);
      clients = Math.min(clients, calc.targetClients);

      const revenue = clients * calc.avgRevPerClient;
      const profit = revenue - monthlyCosts - adSpend;

      if (profit >= incomeGoal && monthToGoal === null) {
        monthToGoal = month;
      }

      months.push({
        month,
        clients: Math.round(clients * 10) / 10,
        revenue: Math.round(revenue),
        profit: Math.round(profit)
      });
    }

    return { months, monthToGoal };
  }, [calc, incomeGoal]);

  // Components
  const Slider = ({ label, value, onChange, min, max, step = 1, prefix = '', suffix = '' }) => (
    <div className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
      <span className="text-neutral-600 text-sm">{label}</span>
      <div className="flex items-center gap-4">
        <input
          type="range"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="w-24 accent-neutral-900"
        />
        <span className="w-16 text-right font-mono text-sm">
          {prefix}{typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}{suffix}
        </span>
      </div>
    </div>
  );

  const ModelCard = ({ id, title, description, active, stats, children, ...props }) => {
    const isExpanded = expandedModel === id;
    return (
      <div className={`border border-neutral-200 rounded-lg mb-3 transition-opacity ${!active ? 'opacity-40' : ''}`}>
        <div
          className="flex items-center justify-between p-4 cursor-pointer"
          onClick={() => setExpandedModel(isExpanded ? null : id)}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (props.customToggle) {
                  props.customToggle();
                } else {
                  toggle(id);
                }
              }}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${active ? 'bg-neutral-900 border-neutral-900' : 'border-neutral-300'
                }`}
            >
              {active && <Check size={12} className="text-white" />}
            </button>
            <div>
              <span className="font-medium">{title}</span>
              <p className="text-xs text-neutral-500">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {active && stats && (
              <span className="text-sm text-neutral-500 font-mono">${stats.rev}/wk</span>
            )}
            <ChevronDown size={16} className={`text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
        {isExpanded && active && (
          <div className="px-4 pb-4 border-t border-neutral-100">{children}</div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Permanent+Marker&display=swap');
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        .font-marker { font-family: 'Permanent Marker', cursive; transform: rotate(-2deg); }
      `}</style>


      {/* Header */}
      <header className="border-b border-neutral-100 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="text-lg font-semibold tracking-tight">Ellissa Oliver</div>
          <div className="text-sm text-neutral-500">Internal Strategy Doc</div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-20 border-b border-neutral-100">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tighter mb-8 text-neutral-900">
          Body-Positive<br />Strength
        </h1>
        <p className="text-2xl text-neutral-600 leading-relaxed max-w-2xl mb-12">
          This is a thinking page, not a pitch. It's the antidote to the "fitness industry".
        </p>

        {/* The "Anti" Gallery */}
        <div className="bg-neutral-100 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 bg-red-500 text-white px-4 py-1 font-bold transform -rotate-12 translate-y-4 -translate-x-2 shadow-lg z-10">
            WE ARE NOT THIS
          </div>

          <div className="grid md:grid-cols-2 gap-8 relative z-0 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="relative group">
              <img src={heroImage} alt="Serious Gym Bro" className="rounded-xl w-full h-64 object-cover" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-marker text-3xl text-red-600 bg-white/90 px-4 py-2 shadow-xl rotate-3">Too Serious!</span>
              </div>
            </div>
            <div className="relative group">
              <img src={classImage} alt="Serious Class" className="rounded-xl w-full h-64 object-cover" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-marker text-3xl text-red-600 bg-white/90 px-4 py-2 shadow-xl -rotate-2">Boring!</span>
              </div>
            </div>
          </div>
          <p className="text-center text-neutral-500 mt-6 italic">
            "Live Like You Mean It"? No thanks. We just want to move without hating ourselves.
          </p>
        </div>
      </section>

      {/* Section 1: What this business actually is */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-b border-neutral-100">
        <p className="text-sm font-medium text-neutral-400 mb-4 tracking-wide">01</p>
        <h2 className="text-2xl font-semibold mb-8">What this business actually is</h2>

        <div className="space-y-6 text-lg leading-relaxed text-neutral-700">
          <p>This business sells strength training to women who do not like the fitness industry.</p>

          <div className="pl-6 border-l-2 border-neutral-200">
            <p className="text-neutral-500">Not weight loss.</p>
            <p className="text-neutral-500">Not transformation.</p>
            <p className="text-neutral-500">Not motivation.</p>
          </div>

          <p>It works because the experience is enjoyable. People keep showing up. Groups create retention.</p>

          <div className="bg-neutral-50 rounded-xl p-6 mt-8">
            <p className="font-medium text-neutral-900">Key idea</p>
            <p className="text-neutral-600 mt-2">If people enjoy something, they repeat it. Repeated attendance is the business.</p>
          </div>
        </div>
      </section>

      {/* Section 2: What problems this is NOT solving */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-b border-neutral-100">
        <p className="text-sm font-medium text-neutral-400 mb-4 tracking-wide">02</p>
        <h2 className="text-2xl font-semibold mb-8">What this is NOT solving</h2>

        <p className="text-lg text-neutral-600 mb-8">This matters for non-business people. Clear lines prevent wasted time and bad clients.</p>

        <div className="grid gap-4">
          {[
            'Fix bodies',
            'Change identities',
            'Convince people they are broken',
            'Compete with gyms'
          ].map((item) => (
            <div key={item} className="flex items-center gap-4 py-3 border-b border-neutral-100">
              <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                <X size={16} className="text-neutral-400" />
              </div>
              <span className="text-neutral-700">{item}</span>
            </div>
          ))}
        </div>

        <p className="text-neutral-500 mt-8">If someone wants those things, they are the wrong customer.</p>
      </section>

      {/* Section 3: Who this is for */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-b border-neutral-100">
        <p className="text-sm font-medium text-neutral-400 mb-4 tracking-wide">03</p>
        <h2 className="text-2xl font-semibold mb-8">Who this is for</h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 py-2">
              <Check size={18} className="text-neutral-900" />
              <span>Women 40+</span>
            </div>
            <div className="flex items-center gap-3 py-2">
              <Check size={18} className="text-neutral-900" />
              <span>Live in Perth</span>
            </div>
            <div className="flex items-center gap-3 py-2">
              <Check size={18} className="text-neutral-900" />
              <span>Have tried gyms and quit</span>
            </div>
            <div className="flex items-center gap-3 py-2">
              <Check size={18} className="text-neutral-900" />
              <span>Want to feel capable, not judged</span>
            </div>
          </div>

          <div className="bg-neutral-50 rounded-xl p-6">
            <p className="font-medium text-neutral-900 mb-3">Important</p>
            <p className="text-neutral-600 leading-relaxed">
              They will not say they are nervous. They will not say they feel intimidated. They just quietly avoid gyms.
            </p>
            <p className="text-neutral-900 font-medium mt-4">The business is designed around that silence.</p>
          </div>
        </div>
      </section>

      {/* Section 4: The constraints */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-b border-neutral-100">
        <p className="text-sm font-medium text-neutral-400 mb-4 tracking-wide">04</p>
        <h2 className="text-2xl font-semibold mb-8">The constraints</h2>

        <p className="text-lg text-neutral-600 mb-8">This is what we're working with.</p>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm font-medium text-neutral-900 uppercase tracking-wide mb-4">What exists</p>
            <div className="space-y-3">
              {[
                'A qualified PT',
                'Comfortable on camera',
                'A strong moral position (body-positive)',
                'A small ad budget'
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 py-2">
                  <Check size={18} className="text-neutral-900" />
                  <span className="text-neutral-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-4">What doesn't</p>
            <div className="space-y-3">
              {[
                'Venue',
                'Brand',
                'Proof',
                'Differentiation'
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 py-2">
                  <X size={18} className="text-neutral-400" />
                  <span className="text-neutral-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: What we need */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-b border-neutral-100">
        <p className="text-sm font-medium text-neutral-400 mb-4 tracking-wide">05</p>
        <h2 className="text-2xl font-semibold mb-6">What we need</h2>

        <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-6 mb-12">
          <p className="text-lg font-medium text-neutral-900 text-center">
            People who don't know us yet <span className="text-neutral-400 mx-2">→</span> paying <span className="text-neutral-400 mx-2">→</span> repeatedly <span className="text-neutral-400 mx-2">→</span> at scale.
          </p>
        </div>

        <div className="mb-12">
          <h3 className="text-xl font-semibold mb-6">How the structure solves it</h3>
          <p className="text-neutral-600 mb-6">Four offerings. Each one serves a different customer need AND solves a business constraint.</p>

          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 bg-neutral-50 border-b border-neutral-200 text-sm font-medium text-neutral-500">
              <div className="p-4 md:col-span-2">Offering</div>
              <div className="p-4 md:col-span-4">What they need</div>
              <div className="p-4 md:col-span-6">What it solves for us</div>
            </div>
            {[
              { name: '1:1', need: 'Total privacy', solve: 'Premium pricing funds growth' },
              { name: 'Online', need: 'Zero social exposure', solve: 'No venue, location-independent' },
              { name: 'Pod', need: 'Accountability + affordability', solve: 'Retention through social lock-in, recurring revenue' },
              { name: 'Host', need: 'Bring their own people', solve: 'No rent, no ads, no admin—hosts supply all three' }
            ].map((row, i) => (
              <div key={row.name} className={`grid grid-cols-1 md:grid-cols-12 text-sm max-md:gap-1 ${i !== 3 ? 'border-b border-neutral-100' : ''}`}>
                <div className="p-4 md:col-span-2 font-medium text-neutral-900 bg-neutral-50/50 md:bg-transparent flex items-center">{row.name}</div>
                <div className="px-4 pb-2 md:p-4 md:col-span-4 text-neutral-600 flex items-center md:border-l md:border-neutral-50"><span className="md:hidden text-xs text-neutral-400 w-20 shrink-0">Need: </span>{row.need}</div>
                <div className="px-4 pb-4 md:p-4 md:col-span-6 text-neutral-600 flex items-center md:border-l md:border-neutral-50"><span className="md:hidden text-xs text-neutral-400 w-20 shrink-0">Solve: </span>{row.solve}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">Why this matters</h3>
          <div className="space-y-4 text-neutral-600 leading-relaxed">
            <p>Most fitness businesses force one model. People who don't fit either squeeze in or leave.</p>
            <p>This removes the squeeze. Someone who would never walk into a group class has an option. Someone who can't afford 1:1 has an option.</p>
            <p>And the business can start lean—each offering pulls its own weight.</p>
            <p className="font-medium text-neutral-900 pt-2">The structure serves them and sustains us.</p>
          </div>
        </div>
      </section>



      {/* Section 5: The four offerings */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-b border-neutral-100">
        <p className="text-sm font-medium text-neutral-400 mb-4 tracking-wide">06</p>
        <h2 className="text-2xl font-semibold mb-8">The four offerings</h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 1:1 */}
          <div className="border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Private 1:1</h3>
              <span className="text-xs bg-neutral-100 px-2 py-1 rounded-full text-neutral-600">Highest price</span>
            </div>
            <p className="text-neutral-600 text-sm mb-4">One person. In their home. Lowest volume.</p>
            <div className="pt-4 border-t border-neutral-100">
              <p className="text-xs text-neutral-400 uppercase tracking-wide mb-2">Why it exists</p>
              <p className="text-sm text-neutral-700">Some people will pay for privacy. It also makes everything else feel reasonable.</p>
            </div>
          </div>

          {/* Online */}
          <div className="border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Online</h3>
              <span className="text-xs bg-neutral-100 px-2 py-1 rounded-full text-neutral-600">Entry point</span>
            </div>
            <p className="text-neutral-600 text-sm mb-4">Private plan. Weekly check-in. No app. No group.</p>
            <div className="pt-4 border-t border-neutral-100">
              <p className="text-xs text-neutral-400 uppercase tracking-wide mb-2">Why it exists</p>
              <p className="text-sm text-neutral-700">This removes fear. Many people move on to groups later.</p>
            </div>
          </div>

          {/* Pods */}
          <div className="border-2 border-neutral-900 rounded-xl p-6 bg-neutral-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Pods</h3>
              <span className="text-xs bg-neutral-900 text-white px-2 py-1 rounded-full">Core business</span>
            </div>
            <p className="text-neutral-600 text-sm mb-4">4 people. Same time every week. Same group.</p>
            <div className="pt-4 border-t border-neutral-200">
              <p className="text-xs text-neutral-400 uppercase tracking-wide mb-2">Why it works</p>
              <p className="text-sm text-neutral-700">People cancel on trainers. They do not cancel on friends. This is where the business becomes stable.</p>
            </div>
          </div>

          {/* Host */}
          <div className="border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Host Model</h3>
              <span className="text-xs bg-neutral-100 px-2 py-1 rounded-full text-neutral-600">Leverage</span>
            </div>
            <p className="text-neutral-600 text-sm mb-4">Host trains free. Supplies venue. Brings people.</p>
            <div className="pt-4 border-t border-neutral-100">
              <p className="text-xs text-neutral-400 uppercase tracking-wide mb-2">One free spot replaces</p>
              <p className="text-sm text-neutral-700">Rent. Advertising. Admin time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: THE CALCULATOR */}
      <section className="bg-neutral-50 border-y border-neutral-200">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <p className="text-sm font-medium text-neutral-400 mb-4 tracking-wide">07</p>
          <h2 className="text-2xl font-semibold mb-2">How this actually makes money</h2>
          <p className="text-lg text-neutral-600 mb-8">This is the most important section. The calculator is the spine, not an add-on.</p>

          {/* Goal Input */}
          <div className="bg-white rounded-xl p-6 mb-8 border border-neutral-200">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-neutral-500">Monthly income goal</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-semibold">$</span>
                <input
                  type="number"
                  value={incomeGoal}
                  onChange={(e) => setIncomeGoal(parseInt(e.target.value) || 0)}
                  className="text-2xl font-semibold w-24 bg-transparent border-b-2 border-neutral-300 focus:border-neutral-900 outline-none"
                />
              </div>
            </div>

            {projection.monthToGoal ? (
              <p className="text-lg">
                At this rate → <span className="font-semibold">${incomeGoal.toLocaleString()}/month</span> in{' '}
                <span className="font-semibold">{projection.monthToGoal} months</span>
              </p>
            ) : (
              <p className="text-lg text-neutral-600">
                {calc.newClientsPerMonth <= 0
                  ? "Set up acquisition to see projections."
                  : calc.targetMonthlyProfit < incomeGoal
                    ? `Current capacity maxes out at $${Math.round(calc.targetMonthlyProfit).toLocaleString()}/mo. Add more capacity.`
                    : "Won't reach this goal in 24 months. Improve acquisition or retention."
                }
              </p>
            )}
          </div>



          {/* Revenue Models */}
          <div className="bg-white rounded-xl p-6 border border-neutral-200 mb-8">
            <h3 className="font-medium mb-4">Configure your mix</h3>

            <div className="flex items-center gap-8 mb-6">
              <div>
                <p className="text-sm text-neutral-500 mb-1">Hours/week</p>
                <p className="text-2xl font-semibold tracking-tight">{calc.targetWeeklyHrs}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 mb-1">Effective rate</p>
                <p className="text-2xl font-semibold tracking-tight">${Math.round(calc.targetHourly)}/hr</p>
              </div>
            </div>

            <ModelCard
              id="pt"
              title="1:1 Private"
              description="Premium, time-limited"
              active={models.pt.active}
              stats={calc.pt}
            >
              <p className="text-sm text-neutral-500 py-3">Highest price per hour. Cap this to prevent burnout.</p>
              <Slider label="Clients" value={models.pt.clients} onChange={(v) => update('pt', 'clients', v)} min={1} max={capacityLimits.maxPT} />
              <Slider label="Weekly rate" value={models.pt.price} onChange={(v) => update('pt', 'price', v)} min={100} max={300} step={10} prefix="$" />
              <Slider label="Hours each" value={models.pt.hours} onChange={(v) => update('pt', 'hours', v)} min={1} max={2} step={0.5} suffix="h" />
            </ModelCard>

            <ModelCard
              id="pods"
              title="Pods (Small Groups)"
              description="Core business model"
              active={models.pods.active}
              stats={calc.pods}
            >
              <p className="text-sm text-neutral-500 py-3">4 people, same group each week. Host gets free spot.</p>
              <Slider label="Number of groups" value={models.pods.groups} onChange={(v) => update('pods', 'groups', v)} min={1} max={capacityLimits.maxPods} />
              <Slider label="People per group" value={models.pods.size} onChange={(v) => update('pods', 'size', v)} min={3} max={6} />
              <Slider label="Weekly rate / person" value={models.pods.price} onChange={(v) => update('pods', 'price', v)} min={50} max={150} step={10} prefix="$" />
              <Slider label="Hours per session" value={models.pods.hours} onChange={(v) => update('pods', 'hours', v)} min={1} max={2} step={0.5} suffix="h" />
            </ModelCard>

            <ModelCard
              id="host"
              title="Host Model"
              description="Leverage for growth"
              active={models.pods.freeHostSpot}
              activeOverride={true} // Special prop to handle boolean toggle instead of object.active
              stats={calc.hostSavings ? { rev: calc.hostSavings.rentSaved + calc.hostSavings.adsSaved } : null} // Showing savings as revenue equivalent? Or just hide stats.
              customToggle={() => update('pods', 'freeHostSpot', !models.pods.freeHostSpot)}
            >
              <p className="text-sm text-neutral-500 py-3">Host trains free. Replaces rent, ads, and admin.</p>

              <div className="bg-neutral-50 rounded p-3 mb-3">
                <p className="text-xs font-medium text-neutral-900 mb-2">Savings per group:</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-neutral-500 block">Rent</span>
                    <span className="font-mono">$200</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Ads</span>
                    <span className="font-mono">${calc.cac}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Admin</span>
                    <span className="font-mono">2h</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-neutral-500">
                Total Impact: <span className="font-medium text-neutral-900">{models.pods.groups} free spots</span> = no overhead for those groups.
              </div>
            </ModelCard>

            <ModelCard
              id="online"
              title="Online Coaching"
              description="Entry point, low friction"
              active={models.online.active}
              stats={calc.online}
            >
              <p className="text-sm text-neutral-500 py-3">Remote. Weekly check-in. Many upgrade to Pods later.</p>
              <Slider label="Clients" value={models.online.clients} onChange={(v) => update('online', 'clients', v)} min={1} max={capacityLimits.maxOnline} />
              <Slider label="Weekly rate" value={models.online.price} onChange={(v) => update('online', 'price', v)} min={30} max={100} step={5} prefix="$" />
              <Slider label="Hours per client/week" value={models.online.hours} onChange={(v) => update('online', 'hours', v)} min={0.25} max={1} step={0.25} suffix="h" />
            </ModelCard>
          </div>





          {/* Acquisition & Retention */}
          <div className="border border-neutral-200 rounded-xl overflow-hidden mb-8 bg-white">
            <button
              onClick={() => setShowAcquisition(!showAcquisition)}
              className="w-full flex items-center justify-between p-6 bg-neutral-50 hover:bg-neutral-100 transition-colors"
            >
              <div className="text-left">
                <h3 className="font-semibold text-neutral-900">Growth Levers</h3>
                <p className="text-sm text-neutral-500">Acquisition & Retention settings</p>
              </div>
              <ChevronDown size={20} className={`text-neutral-400 transition-transform ${showAcquisition ? 'rotate-180' : ''}`} />
            </button>

            {showAcquisition && (
              <div className="grid md:grid-cols-2 gap-6 p-6 border-t border-neutral-200">
                <div className="bg-white rounded-xl p-6 border border-neutral-200">
                  <h3 className="font-medium mb-4">Acquisition</h3>
                  <p className="text-sm text-neutral-500 mb-4">How fast can you add clients?</p>

                  <Slider label="Monthly ad spend" value={adSpend} onChange={setAdSpend} min={0} max={1000} step={50} prefix="$" />
                  <Slider label="Cost per lead" value={costPerLead} onChange={setCostPerLead} min={15} max={50} step={5} prefix="$" />
                  <Slider label="Lead → Trial" value={leadToTrial} onChange={setLeadToTrial} min={10} max={50} step={5} suffix="%" />
                  <Slider label="Trial → Paid" value={trialToPaid} onChange={setTrialToPaid} min={20} max={70} step={5} suffix="%" />

                  <div className="mt-4 pt-4 border-t border-neutral-100 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-neutral-500">New clients/mo</p>
                      <p className="font-mono font-medium text-lg">{calc.newClientsPerMonth.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Cost per client</p>
                      <p className="font-mono font-medium text-lg">${calc.cac}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-neutral-200">
                  <h3 className="font-medium mb-4">Retention</h3>
                  <p className="text-sm text-neutral-500 mb-4">How long do they stay?</p>

                  <Slider label="Monthly churn" value={churnRate} onChange={setChurnRate} min={2} max={15} step={1} suffix="%" />
                  <Slider label="Avg lifespan" value={avgLifespan} onChange={setAvgLifespan} min={3} max={18} step={1} suffix=" mo" />

                  <div className="mt-4 pt-4 border-t border-neutral-100 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Lifetime value</span>
                      <span className="font-mono font-medium">${Math.round(calc.ltv)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">LTV ÷ CAC</span>
                      <span className={`font-mono font-medium ${calc.ltvCacRatio < 1 ? 'text-red-600' : calc.ltvCacRatio < 3 ? 'text-amber-600' : 'text-green-600'}`}>
                        {calc.ltvCacRatio.toFixed(1)}x
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-500 mt-4">
                    {calc.ltvCacRatio >= 3
                      ? "Healthy. Each $1 on ads returns $" + calc.ltvCacRatio.toFixed(0) + "."
                      : calc.ltvCacRatio >= 1
                        ? "Breaking even. Improve retention."
                        : "Losing money on ads. Fix before scaling."
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Projection Chart */}
          <div className="bg-white rounded-xl p-6 border border-neutral-200 mb-8">
            <h3 className="font-medium mb-2">Path to ${incomeGoal.toLocaleString()}/month</h3>
            <p className="text-sm text-neutral-500 mb-6">Starting from zero, adding ~{calc.newClientsPerMonth.toFixed(1)} clients/month</p>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projection.months.slice(0, 12)}>
                  <defs>
                    <linearGradient id="fillProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#171717" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#171717" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: '#737373' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `M${v}`}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#737373' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', fontSize: '13px' }}
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Profit']}
                    labelFormatter={(label) => `Month ${label}`}
                  />
                  <ReferenceLine
                    y={incomeGoal}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    label={{ value: 'Goal', position: 'right', fontSize: 12, fill: '#10b981' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#171717"
                    strokeWidth={2}
                    fill="url(#fillProfit)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 text-center">
              <div className="bg-neutral-50 rounded-lg p-4">
                <p className="text-sm text-neutral-500">Month 3</p>
                <p className="font-semibold">{projection.months[2]?.clients || 0} clients</p>
                <p className="text-sm text-neutral-500">${projection.months[2]?.profit?.toLocaleString() || 0}/mo</p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-4">
                <p className="text-sm text-neutral-500">Month 6</p>
                <p className="font-semibold">{projection.months[5]?.clients || 0} clients</p>
                <p className="text-sm text-neutral-500">${projection.months[5]?.profit?.toLocaleString() || 0}/mo</p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-4">
                <p className="text-sm text-neutral-500">Month 12</p>
                <p className="font-semibold">{projection.months[11]?.clients || 0} clients</p>
                <p className="text-sm text-neutral-500">${projection.months[11]?.profit?.toLocaleString() || 0}/mo</p>
              </div>
            </div>
          </div>

          {/* Teaching Note */}
          <div className="bg-neutral-900 text-white rounded-xl p-6 mb-8">
            <p className="text-sm text-neutral-400 uppercase tracking-wide mb-3">What this teaches</p>
            <ul className="space-y-2 text-neutral-200">
              <li className="flex items-start gap-2">
                <span className="text-neutral-500">→</span>
                <span>Pods matter because they compound (4 people × recurring × social lock-in)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neutral-500">→</span>
                <span>Retention matters more than leads (keeping 1 client = not paying to find another)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neutral-500">→</span>
                <span>One free host spot can increase profit (replaces rent + ads + admin)</span>
              </li>
            </ul>
            <p className="text-sm text-neutral-400 mt-4 pt-4 border-t border-neutral-700">
              "Oh, this works because small groups compound."
            </p>
          </div>
        </div>
      </section>




      {/* Section 8: Website Role */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-b border-neutral-100">
        <p className="text-sm font-medium text-neutral-400 mb-4 tracking-wide">08</p>
        <h2 className="text-2xl font-semibold mb-8">Website role</h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm font-medium text-neutral-900 uppercase tracking-wide mb-4">Must do</p>
            <div className="space-y-3">
              {[
                'Explain the logic',
                'Show the options',
                'Link to booking and payment',
                'Feel approachable, not salesy'
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 py-2">
                  <Check size={18} className="text-neutral-900" />
                  <span className="text-neutral-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-4">Must not</p>
            <div className="space-y-3">
              {[
                'Hype',
                'Pressure',
                'Educate about fitness science',
                'Look like a gym website'
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 py-2">
                  <X size={18} className="text-neutral-400" />
                  <span className="text-neutral-500">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>




      {/* Section 9: The Result */}
      <section className="border-b border-neutral-100 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <p className="text-sm font-medium text-neutral-400 mb-4 tracking-wide">09</p>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold">The Result</h2>
          </div>
          <p className="text-lg text-neutral-600 mb-8">
            This is the live build. It uses the logic above to filter for the right people.
          </p>
        </div>

        <div className="w-full border-t border-neutral-200">
          <Website />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100">
        <div className="max-w-4xl mx-auto px-6 py-8 flex items-center justify-between">
          <p className="text-sm text-neutral-400">Internal document · Not for distribution</p>
          <p className="text-sm text-neutral-400">{new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
