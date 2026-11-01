import React, { useEffect, useState } from 'react';
import { Flame, CheckCircle, AlertTriangle, Users, TrendingUp } from 'lucide-react';
import { Card } from '../ui';

function AnimatedCounter({ value }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const end = parseInt(String(value).replace(/,/g, ''), 10);
    if (!end || end <= 0) return;

    let start = 0;
    const timer = setInterval(() => {
      start += Math.ceil(end / 30);
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{count.toLocaleString()}</span>;
}

function TrendingSidebar() {
  const trendingIssues = [
    { id: 1, title: 'Major pothole on 80 Feet Road', support: '1.2K' },
    { id: 2, title: 'Garbage accumulation near market', support: '842' },
    { id: 3, title: 'Broken streetlights in sector 4', support: '531' },
    { id: 4, title: 'Drainage overflow after rain', support: '420' },
  ];

  const stats = [
    { Icon: AlertTriangle, value: '12,482', label: 'Reported', color: 'text-warning-500' },
    { Icon: CheckCircle, value: '8,921', label: 'Resolved', color: 'text-success-500' },
    { Icon: TrendingUp, value: '71', suffix: '%', label: 'Clear Rate', color: 'text-primary-600' },
    { Icon: Users, value: '342', label: 'Members', color: 'text-primary-600' },
  ];

  return (
    <aside className="w-80 hidden xl:block sticky top-6 h-[calc(100vh-48px)] space-y-6 flex-shrink-0 ml-8 mr-6">
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <Flame className="w-5 h-5 text-warning-500" />
          <h2 className="text-base font-bold text-ink">Trending Issues</h2>
        </div>

        <div className="space-y-4">
          {trendingIssues.map((issue, index) => (
            <div key={issue.id} className="group cursor-pointer">
              <div className="flex items-start gap-3">
                <span className="text-sm font-bold text-ink-muted mt-0.5">{index + 1}.</span>
                <div>
                  <h3 className="text-sm font-medium text-ink group-hover:text-primary-600 transition-colors line-clamp-2">
                    {issue.title}
                  </h3>
                  <p className="text-xs font-medium text-primary-600 mt-1">{issue.support} Support</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          <h2 className="text-base font-bold text-ink">Community Statistics</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {stats.map(({ Icon, value, suffix, label, color }) => (
            <div
              key={label}
              className="bg-surface-muted rounded-xl p-4 border border-surface-border text-center"
            >
              <Icon className={`w-5 h-5 ${color} mx-auto mb-2`} />
              <div className="text-xl font-bold text-ink">
                <AnimatedCounter value={value} />
                {suffix}
              </div>
              <div className="text-xs font-medium text-ink-muted uppercase tracking-wide mt-1">{label}</div>
            </div>
          ))}
        </div>
      </Card>
    </aside>
  );
}

export default TrendingSidebar;
