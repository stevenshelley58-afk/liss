import React, { useState, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ChevronDown, Plus, Minus } from 'lucide-react';

export default function FitnessCalculator() {
  const [sections, setSections] = useState({
    revenue: true,
    acquisition: false,
    retention: false
  });

  const [expandedModel, setExpandedModel] = useState('pods');
  const [incomeGoal, setIncomeGoal] = useState(5000);

  const [models, setModels] = useState({
    pt: { active: true, clients: 6, price: 150, hours: 2 },
    park: { active: false, classes: 3, attendees: 8, price: 25, hours: 1.5 },
    pods: { active: true, groups: 4, size: 4, price: 100, hours: 2 },
    online: { active: false, clients: 10, price: 75, hours: 0.75 }
  });

  const [adSpend, setAdSpend] = useState(500);
  const [costPerLead, setCostPerLead] = useState(25);
  const [leadToTrial, setLeadToTrial] = useState(25);
  const [trialToPaid, setTrialToPaid] = useState(40);
  const [churnRate, setChurnRate] = useState(8);
  const [avgLifespan, setAvgLifespan] = useState(6);

  const monthlyCosts = 295;

  const update = (model, field, value) => {
    setModels(prev => ({ ...prev, [model]: { ...prev[model], [field]: value } }));
  };

  const toggle = (model) => {
    setModels(prev => ({ ...prev, [model]: { ...prev[model], active: !prev[model].active } }));
  };

  const toggleSection = (section) => {
    setSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const calc = useMemo(() => {
    // Target capacity calculations (what she's building toward)
    const pt = models.pt.active ? {
      rev: models.pt.clients * models.pt.price,
      hrs: models.pt.clients * models.pt.hours,
      clients: models.pt.clients
    } : { rev: 0, hrs: 0, clients: 0 };
    pt.hourly = pt.hrs > 0 ? Math.round(pt.rev / pt.hrs) : 0;

    const park = models.park.active ? {
      rev: models.park.classes * models.park.attendees * models.park.price,
      hrs: models.park.classes * models.park.hours,
      clients: models.park.classes * models.park.attendees
    } : { rev: 0, hrs: 0, clients: 0 };
    park.hourly = park.hrs > 0 ? Math.round(park.rev / park.hrs) : 0;

    const pods = models.pods.active ? {
      rev: models.pods.groups * models.pods.size * models.pods.price,
      hrs: models.pods.groups * models.pods.hours,
      clients: models.pods.groups * models.pods.size
    } : { rev: 0, hrs: 0, clients: 0 };
    pods.hourly = pods.hrs > 0 ? Math.round(pods.rev / pods.hrs) : 0;

    const online = models.online.active ? {
      rev: models.online.clients * models.online.price,
      hrs: models.online.clients * models.online.hours,
      clients: models.online.clients
    } : { rev: 0, hrs: 0, clients: 0 };
    online.hourly = online.hrs > 0 ? Math.round(online.rev / online.hrs) : 0;

    // Target numbers (at full capacity)
    const targetWeeklyRev = pt.rev + park.rev + pods.rev + online.rev;
    const targetWeeklyHrs = pt.hrs + park.hrs + pods.hrs + online.hrs;
    const targetClients = pt.clients + park.clients + pods.clients + online.clients;
    const targetMonthlyRev = targetWeeklyRev * 4.33;
    const targetHourly = targetWeeklyHrs > 0 ? Math.round(targetWeeklyRev / targetWeeklyHrs) : 0;
    const targetMonthlyProfit = targetMonthlyRev - monthlyCosts - adSpend;

    // Avg revenue per client (for projection)
    const avgRevPerClient = targetClients > 0 ? targetMonthlyRev / targetClients : 0;

    // Acquisition funnel
    const leadsPerMonth = costPerLead > 0 ? adSpend / costPerLead : 0;
    const trialsPerMonth = leadsPerMonth * (leadToTrial / 100);
    const newClientsPerMonth = trialsPerMonth * (trialToPaid / 100);
    const cac = newClientsPerMonth > 0 ? Math.round(adSpend / newClientsPerMonth) : 0;
    
    // LTV
    const ltv = avgRevPerClient * avgLifespan;
    const ltvCacRatio = cac > 0 ? (ltv / cac) : 0;

    return { 
      pt, park, pods, online, 
      targetWeeklyRev, targetWeeklyHrs, targetClients, targetMonthlyRev, targetMonthlyProfit, targetHourly,
      avgRevPerClient,
      leadsPerMonth, trialsPerMonth, newClientsPerMonth, cac, ltv, ltvCacRatio,
      churnRateDecimal: churnRate / 100
    };
  }, [models, adSpend, costPerLead, leadToTrial, trialToPaid, churnRate, avgLifespan]);

  // Build projection from ZERO
  const projection = useMemo(() => {
    const months = [];
    let clients = 0;
    let monthToGoal = null;

    for (let month = 1; month <= 24; month++) {
      // Add new clients
      clients += calc.newClientsPerMonth;
      
      // Subtract churn (only from existing clients)
      const churned = clients * calc.churnRateDecimal;
      clients = Math.max(0, clients - churned);
      
      // Cap at target capacity
      clients = Math.min(clients, calc.targetClients);
      
      // Calculate financials
      const revenue = clients * calc.avgRevPerClient;
      const profit = revenue - monthlyCosts - adSpend;
      
      // Check if we hit goal
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
      <span className="text-neutral-600">{label}</span>
      <div className="flex items-center gap-4">
        <input
          type="range"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="w-28 accent-neutral-900"
        />
        <span className="w-16 text-right font-mono text-sm">
          {prefix}{typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}{suffix}
        </span>
      </div>
    </div>
  );

  const Section = ({ id, title, summary, summaryNote, children }) => {
    const isOpen = sections[id];
    return (
      <div className="border-b border-neutral-200">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between py-6 text-left"
        >
          <div>
            <h2 className="text-lg font-medium">{title}</h2>
            <p className="text-2xl font-semibold mt-1">{summary}</p>
            {summaryNote && <p className="text-sm text-neutral-500 mt-1">{summaryNote}</p>}
          </div>
          <div className={`w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center transition-colors ${isOpen ? 'bg-neutral-900 border-neutral-900' : ''}`}>
            {isOpen ? <Minus size={16} className="text-white" /> : <Plus size={16} className="text-neutral-600" />}
          </div>
        </button>
        {isOpen && <div className="pb-8">{children}</div>}
      </div>
    );
  };

  const ModelRow = ({ id, title, active, stats, children }) => {
    const isExpanded = expandedModel === id;
    return (
      <div className={`border border-neutral-200 rounded-lg mb-3 ${!active ? 'opacity-50' : ''}`}>
        <div 
          className="flex items-center justify-between p-4 cursor-pointer"
          onClick={() => setExpandedModel(isExpanded ? null : id)}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); toggle(id); }}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                active ? 'bg-neutral-900 border-neutral-900' : 'border-neutral-300'
              }`}
            >
              {active && <span className="text-white text-xs">✓</span>}
            </button>
            <span className="font-medium">{title}</span>
          </div>
          <div className="flex items-center gap-4">
            {active && stats && (
              <span className="text-sm text-neutral-500 font-mono">${stats.rev}/wk · ${stats.hourly}/hr</span>
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

  // Summary helpers
  const getAcquisitionSummary = () => {
    if (calc.newClientsPerMonth < 0.5) return "Not enough to grow";
    return `${calc.newClientsPerMonth.toFixed(1)} new clients/month`;
  };

  const getAcquisitionNote = () => {
    if (calc.cac === 0) return "Set your ad budget to see costs";
    return `$${calc.cac} to acquire each one`;
  };

  const getRetentionSummary = () => {
    return `$${Math.round(calc.ltv)} lifetime value`;
  };

  const getRetentionNote = () => {
    if (calc.ltvCacRatio >= 3) return `${calc.ltvCacRatio.toFixed(1)}x return on ad spend. Healthy.`;
    if (calc.ltvCacRatio >= 1) return `${calc.ltvCacRatio.toFixed(1)}x return. Breaking even.`;
    if (calc.ltvCacRatio > 0) return `${calc.ltvCacRatio.toFixed(1)}x return. Losing money on ads.`;
    return `Clients stay ~${avgLifespan} months on average`;
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');`}</style>
      
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 pb-12 border-b border-neutral-200">
          <h1 className="text-3xl font-semibold tracking-tight">Business Model</h1>
          <p className="text-neutral-500 mt-2">Starting from zero. Figure out if this works.</p>
        </div>

        {/* The Goal */}
        <div className="bg-neutral-50 rounded-xl p-6 mb-8">
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
              At this rate, you hit <span className="font-semibold">${incomeGoal.toLocaleString()}/month</span> in{' '}
              <span className="font-semibold">{projection.monthToGoal} months</span>.
            </p>
          ) : (
            <p className="text-lg text-neutral-600">
              {calc.newClientsPerMonth <= 0 
                ? "Set up your acquisition to see projections."
                : calc.targetMonthlyProfit < incomeGoal 
                  ? `Your target capacity only gets you to $${Math.round(calc.targetMonthlyProfit).toLocaleString()}/mo. Add more capacity.`
                  : "At current rates, you won't reach this goal in 24 months. Improve acquisition or retention."
              }
            </p>
          )}
        </div>

        {/* At Capacity Preview */}
        <div className="grid grid-cols-3 gap-6 mb-8 text-center">
          <div>
            <p className="text-sm text-neutral-500 mb-1">At full capacity</p>
            <p className="text-2xl font-semibold">${Math.round(calc.targetMonthlyProfit).toLocaleString()}/mo</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500 mb-1">Hours/week</p>
            <p className="text-2xl font-semibold">{calc.targetWeeklyHrs.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500 mb-1">Effective rate</p>
            <p className="text-2xl font-semibold">${calc.targetHourly}/hr</p>
          </div>
        </div>

        {/* Accordion Sections */}
        <Section 
          id="revenue" 
          title="Target Capacity" 
          summary={`${calc.targetClients} clients → $${Math.round(calc.targetWeeklyRev).toLocaleString()}/week`}
          summaryNote="What you're building toward"
        >
          <p className="text-neutral-600 mb-6">
            Set up what "full" looks like. How many clients, at what price, across which models?
          </p>
          
          <ModelRow id="pt" title="1:1 Personal Training" active={models.pt.active} stats={calc.pt}>
            <p className="text-sm text-neutral-500 py-3">Private sessions. Premium price, but your time is the limit.</p>
            <Slider label="Clients" value={models.pt.clients} onChange={(v) => update('pt', 'clients', v)} min={1} max={15} />
            <Slider label="Weekly rate" value={models.pt.price} onChange={(v) => update('pt', 'price', v)} min={80} max={250} step={10} prefix="$" />
            <Slider label="Hours per client" value={models.pt.hours} onChange={(v) => update('pt', 'hours', v)} min={1} max={3} step={0.5} suffix="h" />
          </ModelRow>

          <ModelRow id="park" title="Park Classes" active={models.park.active} stats={calc.park}>
            <p className="text-sm text-neutral-500 py-3">Outdoor groups. Low cost, weather dependent.</p>
            <Slider label="Classes / week" value={models.park.classes} onChange={(v) => update('park', 'classes', v)} min={1} max={10} />
            <Slider label="Avg attendees" value={models.park.attendees} onChange={(v) => update('park', 'attendees', v)} min={4} max={20} />
            <Slider label="Drop-in price" value={models.park.price} onChange={(v) => update('park', 'price', v)} min={15} max={40} step={5} prefix="$" />
            <Slider label="Hours per class" value={models.park.hours} onChange={(v) => update('park', 'hours', v)} min={1} max={2.5} step={0.5} suffix="h" />
          </ModelRow>

          <ModelRow id="pods" title="Small Group Pods" active={models.pods.active} stats={calc.pods}>
            <p className="text-sm text-neutral-500 py-3">4-6 people, weekly. Host provides the space. Built-in community.</p>
            <Slider label="Number of groups" value={models.pods.groups} onChange={(v) => update('pods', 'groups', v)} min={1} max={10} />
            <Slider label="People per group" value={models.pods.size} onChange={(v) => update('pods', 'size', v)} min={2} max={6} />
            <Slider label="Weekly rate / person" value={models.pods.price} onChange={(v) => update('pods', 'price', v)} min={50} max={150} step={10} prefix="$" />
            <Slider label="Hours per session" value={models.pods.hours} onChange={(v) => update('pods', 'hours', v)} min={1} max={3} step={0.5} suffix="h" />
          </ModelRow>

          <ModelRow id="online" title="Online Coaching" active={models.online.active} stats={calc.online}>
            <p className="text-sm text-neutral-500 py-3">Remote clients. Programs, check-ins, async support.</p>
            <Slider label="Clients" value={models.online.clients} onChange={(v) => update('online', 'clients', v)} min={1} max={30} />
            <Slider label="Weekly rate" value={models.online.price} onChange={(v) => update('online', 'price', v)} min={30} max={150} step={5} prefix="$" />
            <Slider label="Hours per client" value={models.online.hours} onChange={(v) => update('online', 'hours', v)} min={0.25} max={1.5} step={0.25} suffix="h" />
          </ModelRow>

          {/* Which model pays best */}
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <p className="text-sm text-neutral-500 mb-4">Which model pays best per hour?</p>
            <div className="space-y-2">
              {[
                models.pt.active && { name: '1:1 PT', rate: calc.pt.hourly },
                models.park.active && { name: 'Park Classes', rate: calc.park.hourly },
                models.pods.active && { name: 'Pods', rate: calc.pods.hourly },
                models.online.active && { name: 'Online', rate: calc.online.hourly },
              ].filter(Boolean).sort((a, b) => b.rate - a.rate).map((m, i) => (
                <div key={m.name} className="flex items-center gap-3">
                  <div 
                    className="h-2 bg-neutral-900 rounded"
                    style={{ width: `${(m.rate / Math.max(calc.pt.hourly, calc.park.hourly, calc.pods.hourly, calc.online.hourly)) * 200}px` }}
                  />
                  <span className="text-sm font-mono">${m.rate}/hr</span>
                  <span className="text-sm text-neutral-500">{m.name}</span>
                  {i === 0 && <span className="text-xs bg-neutral-100 px-2 py-0.5 rounded">Best</span>}
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section 
          id="acquisition" 
          title="Acquisition" 
          summary={getAcquisitionSummary()}
          summaryNote={getAcquisitionNote()}
        >
          <p className="text-neutral-600 mb-6">
            How fast can you add clients? This assumes paid ads — adjust for your situation.
          </p>
          
          <Slider label="Monthly ad spend" value={adSpend} onChange={setAdSpend} min={0} max={2000} step={50} prefix="$" />
          <Slider label="Cost per lead" value={costPerLead} onChange={setCostPerLead} min={10} max={50} step={5} prefix="$" />
          
          <p className="text-sm text-neutral-500 py-4">
            A "lead" is someone who enquires. Expect $15-40 in fitness.
          </p>
          
          <Slider label="Lead → Trial" value={leadToTrial} onChange={setLeadToTrial} min={10} max={50} step={5} suffix="%" />
          <Slider label="Trial → Paid" value={trialToPaid} onChange={setTrialToPaid} min={20} max={70} step={5} suffix="%" />

          <div className="bg-neutral-50 rounded-lg p-4 mt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-neutral-500">Leads / month</p>
                <p className="font-mono font-medium">{calc.leadsPerMonth.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-neutral-500">Trials / month</p>
                <p className="font-mono font-medium">{calc.trialsPerMonth.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-neutral-500">New clients / month</p>
                <p className="font-mono font-medium">{calc.newClientsPerMonth.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-neutral-500">Cost per client</p>
                <p className="font-mono font-medium">${calc.cac}</p>
              </div>
            </div>
          </div>
        </Section>

        <Section 
          id="retention" 
          title="Retention" 
          summary={getRetentionSummary()}
          summaryNote={getRetentionNote()}
        >
          <p className="text-neutral-600 mb-6">
            How long clients stay determines if ads are worth it.
          </p>
          
          <Slider label="Monthly churn" value={churnRate} onChange={setChurnRate} min={2} max={20} step={1} suffix="%" />
          <Slider label="Avg lifespan" value={avgLifespan} onChange={setAvgLifespan} min={2} max={24} step={1} suffix=" months" />

          <div className="bg-neutral-50 rounded-lg p-4 mt-4">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Avg revenue per client</span>
                <span className="font-mono">${Math.round(calc.avgRevPerClient)}/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Lifetime value (LTV)</span>
                <span className="font-mono font-medium">${Math.round(calc.ltv)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Cost to acquire (CAC)</span>
                <span className="font-mono">${calc.cac}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-neutral-200">
                <span className="text-neutral-500">LTV ÷ CAC</span>
                <span className={`font-mono font-medium ${calc.ltvCacRatio < 1 ? 'text-red-600' : calc.ltvCacRatio < 3 ? 'text-amber-600' : 'text-green-600'}`}>
                  {calc.ltvCacRatio.toFixed(1)}x
                </span>
              </div>
            </div>
            <p className="text-sm text-neutral-500 mt-4">
              {calc.ltvCacRatio >= 3 
                ? "For every $1 on ads, you make $" + calc.ltvCacRatio.toFixed(0) + " back. This works."
                : calc.ltvCacRatio >= 1
                  ? "You're roughly breaking even on ads. Improve conversion or retention."
                  : "You're losing money on ads. Fix this before scaling."
              }
            </p>
          </div>
        </Section>

        {/* Projection Chart */}
        <div className="mt-12 pt-12 border-t border-neutral-200">
          <h2 className="text-lg font-medium mb-2">Path to ${incomeGoal.toLocaleString()}/month</h2>
          <p className="text-neutral-500 text-sm mb-8">
            Starting from zero, adding ~{calc.newClientsPerMonth.toFixed(1)} clients/month
          </p>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projection.months.slice(0, 12)}>
                <defs>
                  <linearGradient id="fillProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#171717" stopOpacity={0.15}/>
                    <stop offset="100%" stopColor="#171717" stopOpacity={0}/>
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
                  tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                />
                <Tooltip 
                  contentStyle={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '13px' }}
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

          {/* Key milestones */}
          <div className="grid grid-cols-3 gap-4 mt-8 text-center">
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

        {/* Footer */}
        <p className="mt-16 pt-8 border-t border-neutral-200 text-sm text-neutral-400">
          Assumes ${monthlyCosts}/mo fixed costs (insurance, equipment, software).
        </p>
      </div>
    </div>
  );
}
