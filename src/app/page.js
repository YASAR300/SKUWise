import {
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  MessageSquare,
  AlertCircle,
  Search,
  Plus,
  BrainCircuit
} from "lucide-react";

const stats = [
  { label: "Total Revenue", value: "₹24.8L", change: "+12.5%", trendingUp: true, icon: ShoppingBag },
  { label: "Active Products", value: "1,248", change: "+3.2%", trendingUp: true, icon: ShoppingBag },
  { label: "Customer Sentiment", value: "4.2", change: "-0.5%", trendingUp: false, icon: MessageSquare },
  { label: "Alerts", value: "12", change: "Action Needed", trendingUp: false, icon: AlertCircle },
];

export default function Home() {
  return (
    <div className="p-8 max-w-7xl mx-auto min-h-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">E-Commerce Intelligence</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Welcome back, here's your category overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full md:w-64 pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/10 transition-all font-medium"
            />
          </div>
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 active:scale-95">
            <Plus className="h-4 w-4" />
            Import Data
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500 dark:text-slate-400">
                <stat.icon className="h-6 w-6" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${stat.trendingUp
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400"
                }`}>
                {stat.trendingUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {stat.change}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{stat.label}</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent AI Insights</h3>
            <button className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">View all reports</button>
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="group p-5 rounded-2xl border border-slate-50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-white dark:hover:bg-slate-900 hover:border-indigo-100 dark:hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 transition-all cursor-pointer">
                <div className="flex items-start gap-5">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        Profitability Alert: Noise Smartwatch X
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        2 hours ago
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                      Conversion dropping due to price-value mismatch. Competitors offer AMOLED at same price. Recommend price drop or listing optimization.
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 px-2 py-1 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                        CRITICAL
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 px-2 py-1 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg">
                        MARGIN IMPACT
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-8 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Growth Strategist</h3>
          </div>
          <div className="bg-indigo-600 dark:bg-indigo-950 rounded-3xl p-8 text-white relative overflow-hidden flex-1 min-h-[400px] shadow-2xl shadow-indigo-500/20">
            <div className="relative z-10 h-full flex flex-col">
              <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6 shadow-xl border border-white/20">
                <BrainCircuit className="h-8 w-8 text-white" />
              </div>
              <p className="text-sm font-bold mb-2 text-indigo-100">AI AGENT ACTIVE</p>
              <h4 className="text-2xl font-black mb-6 leading-tight">What business problem should I solve today?</h4>

              <div className="space-y-3 mt-auto">
                <p className="text-[11px] font-bold text-indigo-200 uppercase tracking-widest">Suggested Queries</p>
                <div className="text-xs bg-white/5 hover:bg-white/15 backdrop-blur-sm p-4 rounded-xl border border-white/10 cursor-pointer transition-all hover:translate-x-1">
                  "Why is the Smartwatch category margin dropping?"
                </div>
                <div className="text-xs bg-white/5 hover:bg-white/15 backdrop-blur-sm p-4 rounded-xl border border-white/10 cursor-pointer transition-all hover:translate-x-1">
                  "Compare my top SKU with competitor X"
                </div>
                <div className="text-xs bg-white/5 hover:bg-white/15 backdrop-blur-sm p-4 rounded-xl border border-white/10 cursor-pointer transition-all hover:translate-x-1">
                  "Find missing features in top reviews"
                </div>
              </div>
            </div>

            {/* Design patterns */}
            <div className="absolute top-0 right-0 h-48 w-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 h-48 w-48 bg-indigo-400/20 rounded-full -ml-24 -mb-24 blur-3xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
