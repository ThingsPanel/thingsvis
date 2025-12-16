import { useMemo } from 'react';
import { PageSchema } from '@thingsvis/schema';
import { EventBus } from '@thingsvis/kernel';
import { Button } from '@thingsvis/ui';

const bus = new EventBus();

export default function App() {
  const page = useMemo(
    () =>
      PageSchema.parse({
        id: 'demo-page',
        version: '0.0.0',
        type: 'studio'
      }),
    []
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
      <div className="space-y-4 p-6 rounded-xl bg-slate-800 shadow-lg max-w-md w-full">
        <div>
          <p className="text-xs uppercase text-slate-400 tracking-wide">ThingsVis Studio</p>
          <h1 className="text-xl font-semibold">Foundation Scaffold</h1>
          <p className="text-sm text-slate-300">Page: {page.id}</p>
        </div>
        <div className="flex gap-3">
          <Button
            className="px-3 py-2 rounded-md bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition"
            onClick={() => bus.emit('ping', { ts: Date.now() })}
            aria-label="Emit bus event"
          >
            Emit Event
          </Button>
          <Button
            className="px-3 py-2 rounded-md border border-slate-500 text-slate-100 hover:border-slate-300 transition"
            onClick={() => bus.on('ping', (payload) => console.log('ping', payload))}
            aria-label="Attach listener"
          >
            Attach Listener
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          Imports from <code>@thingsvis/schema</code>, <code>@thingsvis/kernel</code>, and{' '}
          <code>@thingsvis/ui</code> are wired through workspace dependencies.
        </p>
      </div>
    </div>
  );
}

