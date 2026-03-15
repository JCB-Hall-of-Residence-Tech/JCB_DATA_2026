"use client"
import { useState, useRef, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { ChevronDown, Search, Calendar, X, Check } from 'lucide-react';

// ─── THEME PALETTE ───────────────────────────────────────────────
// Primary accent : #e8193c  (deep red)
// Secondary      : #ff6b35  (orange)
// Highlight      : #ff9f7f  (peach/light orange)
// Background     : #fff0f0  (very light pink)
// Card bg        : #ffffff
// Text primary   : #1a1a2e
// Text muted     : #888
// Border         : rgba(232, 25, 60, 0.2)
// ─────────────────────────────────────────────────────────────────

const filterCategories = [
  { name: 'Date', options: ['Today', 'Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'Custom Range'] },
  { name: 'Client', options: ['All Clients', 'Client A', 'Client B', 'Client C', 'Client D'] },
  { name: 'Channel', options: ['All Channels', 'Web', 'Mobile', 'API', 'Social Media'] },
  { name: 'User', options: ['All Users', 'Admin', 'Editor', 'Viewer', 'Contributor'] },
  { name: 'Language', options: ['All Languages', 'English', 'Spanish', 'French', 'German', 'Japanese'] },
  { name: 'Type', options: ['All Types', 'Article', 'Video', 'Image', 'Audio', 'Document'] }
];

const searchSuggestions = [
  { id: 1, text: 'Channel Performance', category: 'Analytics' },
  { id: 2, text: 'Content Uploads', category: 'Content' },
  { id: 3, text: 'User Activity', category: 'Users' },
  { id: 4, text: 'Publishing Metrics', category: 'Analytics' },
  { id: 5, text: 'API Usage', category: 'Technical' },
  { id: 6, text: 'Client Dashboard', category: 'Overview' },
  { id: 7, text: 'Language Distribution', category: 'Content' },
  { id: 8, text: 'Content Analytics', category: 'Analytics' },
];

const channelPerformanceData = [
  { name: 'Web', uploaded: 124, created: 95, published: 70 },
  { name: 'Mobile', uploaded: 89, created: 62, published: 51 },
  { name: 'API', uploaded: 65, created: 54, published: 42 },
  { name: 'Social', uploaded: 144, created: 118, published: 92 },
  { name: 'Email', uploaded: 78, created: 61, published: 48 },
];

const platformDistributionData = [
  { name: 'Web', value: 35, color: '#e8193c' },
  { name: 'Mobile', value: 28, color: '#ff6b35' },
  { name: 'API', value: 20, color: '#ff9f7f' },
  { name: 'Social', value: 17, color: '#ffcab0' },
];

const contentActivityData = [
  { id: 'CT-1021', channel: 'Web', uploaded: 124, created: 95, published: 70 },
  { id: 'CT-1035', channel: 'Mobile', uploaded: 89, created: 62, published: 51 },
  { id: 'CT-1087', channel: 'API', uploaded: 65, created: 54, published: 42 },
  { id: 'CT-1122', channel: 'Web', uploaded: 144, created: 118, published: 92 },
];

const userActivityData = [
  { id: 'USR-01', channel: 'Web', uploads: 34, creates: 28, publishes: 21 },
  { id: 'USR-02', channel: 'Mobile', uploads: 26, creates: 20, publishes: 16 },
  { id: 'USR-03', channel: 'API', uploads: 19, creates: 17, publishes: 12 },
  { id: 'USR-04', channel: 'Web', uploads: 41, creates: 35, publishes: 29 },
];

function FilterCategory({ category, isOpen, onToggle, selectedOption, onSelect }: {
  category: { name: string; options: string[] };
  isOpen: boolean;
  onToggle: () => void;
  selectedOption: string;
  onSelect: (option: string) => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border"
        style={{
          color: '#e8193c',
          borderColor: 'rgba(232, 25, 60, 0.4)',
          background: 'rgba(232, 25, 60, 0.06)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(232, 25, 60, 0.14)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(232, 25, 60, 0.06)'; }}
      >
        <span>{selectedOption}</span>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 py-2 rounded-xl shadow-xl z-[9999] min-w-[180px] overflow-hidden"
          style={{
            background: '#ffffff',
            border: '1px solid rgba(232, 25, 60, 0.2)',
            boxShadow: '0 8px 24px rgba(232, 25, 60, 0.12)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {category.options.map((option) => (
            <button
              key={option}
              onClick={() => onSelect(option)}
              className="w-full px-4 py-2.5 text-left text-sm transition-all duration-200 flex items-center justify-between"
              style={{
                color: selectedOption === option ? '#e8193c' : '#333',
                background: selectedOption === option ? 'rgba(232, 25, 60, 0.06)' : 'transparent',
              }}
              onMouseEnter={(e) => { if (selectedOption !== option) e.currentTarget.style.background = 'rgba(232, 25, 60, 0.04)'; }}
              onMouseLeave={(e) => { if (selectedOption !== option) e.currentTarget.style.background = 'transparent'; }}
            >
              <span>{option}</span>
              {selectedOption === option && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DateRangePicker({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border"
        style={{
          color: '#e8193c',
          borderColor: 'rgba(232, 25, 60, 0.4)',
          background: 'rgba(232, 25, 60, 0.06)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(232, 25, 60, 0.14)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(232, 25, 60, 0.06)'; }}
      >
        <Calendar size={14} />
        <span>{startDate && endDate ? `${startDate} - ${endDate}` : 'Date'}</span>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 p-4 rounded-xl shadow-xl z-[9999]"
          style={{
            background: '#ffffff',
            border: '1px solid rgba(232, 25, 60, 0.2)',
            boxShadow: '0 8px 24px rgba(232, 25, 60, 0.12)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#888' }}>Start Date</label>
              <input
                type="date" value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none border"
                style={{ color: '#333', background: 'rgba(232,25,60,0.04)', borderColor: 'rgba(232,25,60,0.2)' }}
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#888' }}>End Date</label>
              <input
                type="date" value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none border"
                style={{ color: '#333', background: 'rgba(232,25,60,0.04)', borderColor: 'rgba(232,25,60,0.2)' }}
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  const today = new Date();
                  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                  setStartDate(weekAgo.toISOString().split('T')[0]);
                  setEndDate(today.toISOString().split('T')[0]);
                }}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                style={{ color: '#e8193c', background: 'rgba(232,25,60,0.08)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(232,25,60,0.16)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(232,25,60,0.08)'; }}
              >Last 7 Days</button>
              <button
                onClick={() => {
                  const today = new Date();
                  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                  setStartDate(monthAgo.toISOString().split('T')[0]);
                  setEndDate(today.toISOString().split('T')[0]);
                }}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                style={{ color: '#e8193c', background: 'rgba(232,25,60,0.08)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(232,25,60,0.16)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(232,25,60,0.08)'; }}
              >Last 30 Days</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LiveSearch() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = searchSuggestions.filter(s =>
    s.text.toLowerCase().includes(query.toLowerCase()) ||
    s.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => prev < filteredSuggestions.length - 1 ? prev + 1 : 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : filteredSuggestions.length - 1);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      setQuery(filteredSuggestions[highlightedIndex].text);
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  const highlightMatch = (text: string, highlight: string) => {
    if (!highlight) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <span key={i} style={{ background: 'rgba(232,25,60,0.15)', color: '#e8193c' }} className="px-0.5 rounded">{part}</span>
      ) : part
    );
  };

  return (
    <div className="relative flex-1 max-w-md">
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300"
          style={{ color: query ? '#e8193c' : '#aaa' }} />
        <input
          ref={inputRef} type="text" value={query}
          onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); setHighlightedIndex(-1); }}
          onFocus={() => { setIsFocused(true); setShowSuggestions(true); }}
          onBlur={() => { setIsFocused(false); setTimeout(() => setShowSuggestions(false), 200); }}
          onKeyDown={handleKeyDown}
          placeholder="Search analytics, content, users..."
          className="w-full pl-11 pr-10 py-2.5 rounded-full text-sm transition-all duration-300 border outline-none"
          style={{
            color: '#333',
            background: 'rgba(232, 25, 60, 0.04)',
            borderColor: isFocused ? 'rgba(232, 25, 60, 0.6)' : 'rgba(232, 25, 60, 0.3)',
          }}
        />
        {query && (
          <button onClick={() => { setQuery(''); inputRef.current?.focus(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-0.5 transition-colors"
            style={{ background: 'rgba(232,25,60,0.08)' }}>
            <X size={14} style={{ color: '#e8193c' }} />
          </button>
        )}
      </div>

      {showSuggestions && (query || isFocused) && filteredSuggestions.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-2 py-2 rounded-xl shadow-xl z-[9999] max-h-64 overflow-y-auto"
          style={{ background: '#ffffff', border: '1px solid rgba(232,25,60,0.2)', boxShadow: '0 8px 24px rgba(232,25,60,0.12)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button key={suggestion.id}
              onClick={() => { setQuery(suggestion.text); setShowSuggestions(false); }}
              className="w-full px-4 py-2.5 text-left text-sm transition-all duration-200 flex items-center justify-between"
              style={{ background: index === highlightedIndex ? 'rgba(232,25,60,0.06)' : 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(232,25,60,0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = index === highlightedIndex ? 'rgba(232,25,60,0.06)' : 'transparent'; }}
            >
              <div className="flex flex-col">
                <span style={{ color: '#1a1a2e' }}>{highlightMatch(suggestion.text, query)}</span>
                <span className="text-xs" style={{ color: '#888' }}>{suggestion.category}</span>
              </div>
              {index === highlightedIndex && (
                <span className="text-xs" style={{ color: '#e8193c' }}>Enter to select</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterBar() {
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({
    Date: 'Last 30 Days', Client: 'Client', Channel: 'Channel',
    User: 'User', Language: 'Language', Type: 'Type',
  });

  const handleSelect = (categoryName: string, option: string) => {
    setSelectedOptions(prev => ({ ...prev, [categoryName]: option }));
    setOpenCategory(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setOpenCategory(null);
        setOpenDatePicker(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div
      ref={filterRef}
      className="flex items-center gap-3 px-6 py-3 mx-auto my-3 rounded-2xl shrink-0 relative z-[100]"
      style={{
        width: '90%',
        background: '#ffffff',
        border: '1px solid rgba(232, 25, 60, 0.15)',
        boxShadow: '0 4px 16px rgba(232, 25, 60, 0.08)',
      }}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <DateRangePicker
          isOpen={openDatePicker}
          onToggle={() => { setOpenDatePicker(prev => !prev); setOpenCategory(null); }}
        />
        {filterCategories.slice(1).map((category) => (
          <FilterCategory
            key={category.name}
            category={category}
            isOpen={openCategory === category.name}
            onToggle={() => {
              setOpenCategory(openCategory === category.name ? null : category.name);
              setOpenDatePicker(false);
            }}
            selectedOption={selectedOptions[category.name]}
            onSelect={(option) => handleSelect(category.name, option)}
          />
        ))}
      </div>
      <LiveSearch />
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-4 transition-all duration-300 hover:-translate-y-1 flex flex-col"
      style={{
        background: '#ffffff',
        border: '1px solid rgba(232, 25, 60, 0.15)',
        boxShadow: '0 4px 16px rgba(232, 25, 60, 0.07)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 12px 28px rgba(232, 25, 60, 0.14)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(232, 25, 60, 0.07)'; }}
    >
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h3 className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>{title}</h3>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ color: '#e8193c', background: 'rgba(232, 25, 60, 0.1)' }}>
          {subtitle}
        </span>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

function DataTable({ columns, data, highlightColumn }: {
  columns: string[]; data: any[]; highlightColumn?: number
}) {
  return (
    <div className="overflow-hidden rounded-lg">
      <table className="w-full">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="text-left text-xs font-medium pb-3 border-b"
                style={{ color: '#aaa', borderColor: 'rgba(232, 25, 60, 0.15)' }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b last:border-0 transition-colors duration-200"
              style={{ borderColor: 'rgba(232, 25, 60, 0.07)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(232,25,60,0.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {Object.values(row).map((cell: any, cellIndex) => (
                <td key={cellIndex} className="py-3 text-sm"
                  style={{
                    color: cellIndex === highlightColumn ? '#e8193c' : '#333',
                    fontWeight: cellIndex === highlightColumn ? 600 : 400,
                  }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Page4() {
  return (
    <div
      className="min-h-screen md:h-screen flex flex-col md:overflow-hidden overflow-y-auto"
      style={{ background: '#fff0f0' }}
    >
      <FilterBar />

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 px-6 pb-4">
        <Card title="Channel-wise Testing Performance" subtitle="Bar Chart">
          <div className="h-full min-h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelPerformanceData} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,25,60,0.1)" />
                <XAxis dataKey="name" stroke="#aaa" fontSize={11} />
                <YAxis stroke="#aaa" fontSize={11} />
                <Tooltip contentStyle={{
                  background: '#ffffff', border: '1px solid rgba(232,25,60,0.2)',
                  borderRadius: '8px', color: '#333', boxShadow: '0 4px 16px rgba(232,25,60,0.1)'
                }} />
                <Bar dataKey="uploaded" name="Uploaded" fill="#e8193c" radius={[4, 4, 0, 0]} />
                <Bar dataKey="created" name="Created" fill="#ff6b35" radius={[4, 4, 0, 0]} />
                <Bar dataKey="published" name="Published" fill="#ff9f7f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Platform Publishing Distribution" subtitle="Bar Chart">
          <div className="h-full min-h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformDistributionData} layout="vertical" margin={{ top: 5, right: 15, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,25,60,0.1)" />
                <XAxis type="number" stroke="#aaa" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#aaa" fontSize={11} width={60} />
                <Tooltip contentStyle={{
                  background: '#ffffff', border: '1px solid rgba(232,25,60,0.2)',
                  borderRadius: '8px', color: '#333', boxShadow: '0 4px 16px rgba(232,25,60,0.1)'
                }} />
                <Bar dataKey="value" name="Percentage" radius={[0, 4, 4, 0]}>
                  {platformDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Content Activity Table" subtitle="Uploads / Create / Publish">
          <div className="overflow-auto">
            <DataTable
              columns={['Content ID', 'Channel', 'Uploaded', 'Created', 'Published']}
              data={contentActivityData}
              highlightColumn={2}
            />
          </div>
        </Card>

        <Card title="User Activity Table" subtitle="Platform Usage">
          <div className="overflow-auto">
            <DataTable
              columns={['User ID', 'Channel', 'Uploads', 'Creates', 'Publishes']}
              data={userActivityData}
              highlightColumn={4}
            />
          </div>
        </Card>
      </div>

      <div
        className="h-6 flex items-center justify-center text-xs border-t shrink-0"
        style={{ color: '#aaa', borderColor: 'rgba(232, 25, 60, 0.15)', background: '#ffffff' }}
      >
        Content Analytics Dashboard · Page 4
      </div>
    </div>
  );
}

export default Page4;