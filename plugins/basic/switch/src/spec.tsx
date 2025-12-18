import React from 'react';

/**
 * Visual test (MVP)
 * Render this component in isolation to verify the plugin loads and renders.
 */
export const Spec: React.FC = () => {
  const [checked, setChecked] = React.useState(false);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        fontFamily: 'system-ui'
      }}
    >
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <span>当前：{checked ? '开' : '关'}</span>
      </label>
      <button
        type="button"
        onClick={() => setChecked((v) => !v)}
        style={{
          padding: '6px 12px',
          borderRadius: 8,
          border: '1px solid #3a4a6b',
          background: '#1d2a45',
          color: '#e8f0ff',
          cursor: 'pointer'
        }}
      >
        切换
      </button>
    </div>
  );
};


