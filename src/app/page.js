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
  { label: "Total Revenue", value: "₹24.8L", change: "+12.5%", trendingUp: true, icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "Active Products", value: "1,248", change: "+3.2%", trendingUp: true, icon: ShoppingBag, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { label: "Customer Sentiment", value: "4.2", change: "-0.5%", trendingUp: false, icon: MessageSquare, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { label: "Alerts", value: "12", change: "Action Needed", trendingUp: false, icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10" },
];

export default function Home() {
  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">E-Commerce Intelligence</h1>
          <p className="text-muted-foreground text-sm mt-2 font-medium">Analyze, optimize, and grow your digital storefront.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search data points..."
              className="w-full md:w-72 pl-12 pr-6 py-3 bg-secondary/50 border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium placeholder:text-muted-foreground/60"
            />
          </div>
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-2xl text-sm font-bold hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95 whitespace-nowrap">
            <Plus className="h-4 w-4" />
            Import CSV
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-card p-6 rounded-[2rem] border border-border shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 group">
            <div className="flex items-center justify-between mb-6">
              <div className={`h-12 w-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform duration-500 group-hover:scale-110`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className={`flex items-center gap-1.2 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider ${stat.trendingUp
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                }`}>
                {stat.trendingUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {stat.change}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-3xl font-black text-foreground mt-2 tracking-tight group-hover:text-primary transition-colors">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-card rounded-[2.5rem] border border-border shadow-sm p-10">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-foreground">Recent AI Insights</h3>
              <p className="text-sm text-muted-foreground mt-1">Targeted actions based on recent data ingestion.</p>
            </div>
            <button className="text-xs font-black uppercase tracking-widest text-primary hover:underline hover:translate-x-1 transition-all">View Analytics →</button>
          </div>

          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="group p-6 rounded-[2rem] border border-border bg-secondary/30 hover:bg-card hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all cursor-pointer">
                <div className="flex items-start gap-6">
                  <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 flex-shrink-0 group-hover:rotate-12 transition-transform">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-black text-foreground group-hover:text-primary transition-colors">
                        Profitability Alert: Noise Smartwatch X
                      </h4>
                      <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] whitespace-nowrap">
                        12:45 PM
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6 font-medium">
                      Conversion rates dropping due to competitive pressure in the sub-2k segment. Recommend dynamic repricing or adding "Limited Edition" tags.
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 px-3 py-1 bg-amber-500/10 rounded-lg uppercase tracking-widest">
                        High Priority
                      </span>
                      <span className="text-[9px] font-black text-muted-foreground/60 px-3 py-1 bg-secondary rounded-lg uppercase tracking-widest border border-border/50">
                        Margin Analysis
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-[2.5rem] border border-border shadow-sm p-10 overflow-hidden flex flex-col">
          <div className="mb-10">
            <h3 className="text-2xl font-black text-foreground">Growth Agent</h3>
            <p className="text-sm text-muted-foreground mt-1">Your personal strategist.</p>
          </div>

          <div className="bg-primary rounded-[2rem] p-8 text-primary-foreground relative overflow-hidden flex-1 min-h-[450px] shadow-2xl shadow-primary/30">
            <div className="relative z-10 h-full flex flex-col">
              <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur-xl flex items-center justify-center mb-8 shadow-2xl border border-white/20">
                <BrainCircuit className="h-8 w-8 text-white" />
              </div>
              <p className="text-[10px] font-black mb-2 text-primary-foreground/70 uppercase tracking-[0.3em]">AI Cognitive Engine</p>
              <h4 className="text-3xl font-black mb-8 leading-[1.2] tracking-tight">How can I help you scale today?</h4>

              <div className="space-y-3 mt-auto">
                <p className="text-[10px] font-black text-primary-foreground/50 uppercase tracking-[0.2em] mb-4">Prompt Templates</p>
                <div className="text-xs bg-white/5 hover:bg-white/10 backdrop-blur-sm p-5 rounded-2xl border border-white/10 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl group">
                  <span className="font-bold opacity-80 group-hover:opacity-100 transition-opacity">"Analyze category margin leakages"</span>
                </div>
                <div className="text-xs bg-white/5 hover:bg-white/10 backdrop-blur-sm p-5 rounded-2xl border border-white/10 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl group">
                  <span className="font-bold opacity-80 group-hover:opacity-100 transition-opacity">"Competitor gap analysis report"</span>
                </div>
                <div className="text-xs bg-white/5 hover:bg-white/10 backdrop-blur-sm p-5 rounded-2xl border border-white/10 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl group">
                  <span className="font-bold opacity-80 group-hover:opacity-100 transition-opacity">"Predict Q4 sales growth"</span>
                </div>
              </div>
            </div>

            {/* Abstract Background Design */}
            <div className="absolute top-0 right-0 h-64 w-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-[80px]"></div>
            <div className="absolute bottom-0 left-0 h-48 w-48 bg-black/10 rounded-full -ml-24 -mb-24 blur-[60px]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
